import { supabase } from './supabase';
import { logger } from './loggerService';

export interface QueuedMutation {
    id: string;
    type: 'INSERT' | 'UPDATE' | 'DELETE';
    table: string;
    payload: any;
    timestamp: string;
    status: 'pending' | 'syncing' | 'failed';
}

export class OfflineSyncService {
    private static QUEUE_KEY = 'caditare_offline_mutations';

    // We dynamically check this, but also track event listeners
    private static isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    static init() {
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => {
                console.log('📡 OfflineSyncService: Network restored. Triggering sync...');
                this.isOnline = true;
                this.syncQueue();
            });
            window.addEventListener('offline', () => {
                console.log('📡 OfflineSyncService: Network dropped. Switching to queue mode...');
                window.dispatchEvent(new CustomEvent('caditare_offline'));
                this.isOnline = false;
            });

            // Initial sync attempt if online on boot
            if (this.isOnline) {
                this.syncQueue();
            }
        }
    }

    static isAppOnline(): boolean {
        return this.isOnline;
    }

    static getQueue(): QueuedMutation[] {
        try {
            const raw = localStorage.getItem(this.QUEUE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }

    static saveQueue(queue: QueuedMutation[]) {
        try {
            localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
        } catch (e) {
            console.error('Failed to save offline queue. Storage might be full.', e);
        }
    }

    static enqueue(mutation: Omit<QueuedMutation, 'id' | 'timestamp' | 'status'>) {
        const queue = this.getQueue();
        const newMutation: QueuedMutation = {
            ...mutation,
            id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            timestamp: new Date().toISOString(),
            status: 'pending'
        };
        queue.push(newMutation);
        this.saveQueue(queue);

        logger.info(`Enqueued offline mutation: ${mutation.type} on ${mutation.table}`);
    }

    static async syncQueue() {
        if (!this.isOnline) return;

        let queue = this.getQueue();
        const pending = queue.filter(m => m.status === 'pending' || m.status === 'failed'); // Retry failed ones as well

        if (pending.length === 0) return;

        logger.info(`Starting offline sync for ${pending.length} queued mutations...`);

        // Mark as syncing to avoid duplicate processing loops
        queue = queue.map(m => (m.status === 'pending' || m.status === 'failed') ? { ...m, status: 'syncing' } : m);
        this.saveQueue(queue);

        // We process sequentially so we don't overwhelm Supabase with 100 parallel requests
        const remainingQueue: QueuedMutation[] = queue.filter(m => m.status !== 'syncing');

        let successCount = 0;

        for (const item of pending) {
            try {
                let error = null;
                if (item.type === 'INSERT') {
                    const res = await supabase.from(item.table).insert(item.payload);
                    error = res.error;
                } else if (item.type === 'UPDATE') {
                    // Expects payload to have an 'id' identifying the row natively
                    const { id, ...updateData } = item.payload;
                    if (!id) throw new Error("Missing ID for update payload");
                    const res = await supabase.from(item.table).update(updateData).eq('id', id);
                    error = res.error;
                } else if (item.type === 'DELETE') {
                    const id = item.payload.id;
                    if (!id) throw new Error("Missing ID for delete payload");
                    const res = await supabase.from(item.table).delete().eq('id', id);
                    error = res.error;
                }

                // If collision or unique constraint fails, we should drop or manually resolve. For now, log.
                if (error) {
                    throw error;
                }

                logger.info(`Successfully synced mutation: ${item.id}`);
                successCount++;
            } catch (err: any) {
                logger.error(`Failed to sync mutation: ${item.id}`, err);
                item.status = 'failed';

                // If it's a conflict (like duplicate ID because it actually went through before disconnecting), 
                // we might want to drop it. For now, we will drop 409 conflicts.
                if (err?.code === '23505' || err?.code === '409') {
                    logger.warn(`Dropping mutation ${item.id} due to unique constraint violation (likely already synced).`);
                } else {
                    remainingQueue.push(item);
                }
            }
        }

        // Re-read queue in case user added more things while we were syncing
        const currentQueue = this.getQueue();
        const newlyAdded = currentQueue.filter(m => m.status === 'pending');

        this.saveQueue([...remainingQueue, ...newlyAdded]);

        if (successCount > 0) {
            console.log(`✅ Synced ${successCount} items to the clouded database.`);
            window.dispatchEvent(new CustomEvent('caditare_synced', { detail: { count: successCount } }));
        }
    }
}
