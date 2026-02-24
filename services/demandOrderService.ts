import { DemandOrder, DemandOrderStatus, EmployerActivity } from '../types';
import { supabase } from './supabase';
import { OfflineSyncService } from './offlineSyncService';

export class DemandOrderService {
    static async getAll(): Promise<DemandOrder[]> {
        const { data, error } = await supabase
            .from('demand_orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching demand orders:', error);
            return [];
        }

        return data.map((d: any) => this.mapDatabaseToOrder(d));
    }

    static async getById(id: string): Promise<DemandOrder | undefined> {
        const { data, error } = await supabase
            .from('demand_orders')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching demand order:', error);
            return undefined;
        }

        return this.mapDatabaseToOrder(data);
    }

    static async getByEmployerId(employerId: string): Promise<DemandOrder[]> {
        const { data, error } = await supabase
            .from('demand_orders')
            .select('*')
            .eq('employer_id', employerId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching demand orders for employer:', error);
            return [];
        }

        return data.map((d: any) => this.mapDatabaseToOrder(d));
    }

    static async getOpenOrders(): Promise<DemandOrder[]> {
        const { data, error } = await supabase
            .from('demand_orders')
            .select('*')
            .in('status', [DemandOrderStatus.OPEN, DemandOrderStatus.PARTIALLY_FILLED])
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching open orders:', error);
            return [];
        }

        return data.map((d: any) => this.mapDatabaseToOrder(d));
    }

    static async add(order: DemandOrder): Promise<DemandOrder | null> {
        const dbOrder = {
            employer_id: order.employerId,
            order_number: order.id, // Or generate new if ID not provided
            title: order.title,
            category: order.jobCategory,
            positions: order.positionsRequired,
            salary_range: order.salaryRange,
            location: order.location,
            status: order.status,
            requirements: order.requirements,
            created_at: order.createdAt || new Date().toISOString(),
            data: {
                positionsFilled: order.positionsFilled,
                contractDuration: order.contractDuration,
                benefits: order.benefits,
                deadline: order.deadline,
                notes: order.notes,
                activityLog: order.activityLog || [{
                    id: `act-${Date.now()}`,
                    type: 'Note',
                    content: 'Demand order manually created',
                    timestamp: new Date().toISOString(),
                    actor: 'System',
                }]
            }
        };

        // OPTIMISTIC OFFLINE MODE
        if (!OfflineSyncService.isAppOnline()) {
            OfflineSyncService.enqueue({ type: 'INSERT', table: 'demand_orders', payload: dbOrder });
            return this.mapDatabaseToOrder({ id: `do_tmp_${Date.now()}`, ...dbOrder });
        }

        const { data, error } = await supabase
            .from('demand_orders')
            .insert(dbOrder)
            .select()
            .single();

        if (error) {
            console.error('Error adding demand order:', error);
            // Fallback to queue if it's a network-level fetch failure
            if (error.message === 'Failed to fetch') {
                OfflineSyncService.enqueue({ type: 'INSERT', table: 'demand_orders', payload: dbOrder });
                return this.mapDatabaseToOrder({ id: `do_tmp_${Date.now()}`, ...dbOrder });
            }
            return null;
        }

        return this.mapDatabaseToOrder(data);
    }

    static async update(updated: DemandOrder): Promise<DemandOrder | null> {
        const dbUpdate = {
            title: updated.title,
            category: updated.jobCategory,
            positions: updated.positionsRequired,
            salary_range: updated.salaryRange,
            location: updated.location,
            status: updated.status,
            requirements: updated.requirements,
            updated_at: new Date().toISOString(),
            data: {
                positionsFilled: updated.positionsFilled,
                contractDuration: updated.contractDuration,
                benefits: updated.benefits,
                deadline: updated.deadline,
                notes: updated.notes,
                activityLog: updated.activityLog || []
            }
        };

        // OPTIMISTIC OFFLINE MODE
        if (!OfflineSyncService.isAppOnline()) {
            OfflineSyncService.enqueue({ type: 'UPDATE', table: 'demand_orders', payload: { id: updated.id, ...dbUpdate } });
            return this.mapDatabaseToOrder({ id: updated.id, ...dbUpdate });
        }

        const { data, error } = await supabase
            .from('demand_orders')
            .update(dbUpdate)
            .eq('id', updated.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating demand order:', error);
            if (error.message === 'Failed to fetch') {
                OfflineSyncService.enqueue({ type: 'UPDATE', table: 'demand_orders', payload: { id: updated.id, ...dbUpdate } });
                return this.mapDatabaseToOrder({ id: updated.id, ...dbUpdate });
            }
            return null;
        }

        return this.mapDatabaseToOrder(data);
    }

    static async delete(id: string): Promise<boolean> {
        // OPTIMISTIC OFFLINE MODE
        if (!OfflineSyncService.isAppOnline()) {
            OfflineSyncService.enqueue({ type: 'DELETE', table: 'demand_orders', payload: { id } });
            return true;
        }

        const { error } = await supabase
            .from('demand_orders')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting demand order:', error);
            if (error.message === 'Failed to fetch') {
                OfflineSyncService.enqueue({ type: 'DELETE', table: 'demand_orders', payload: { id } });
                return true;
            }
            return false;
        }
        return true;
    }

    static async incrementFilled(orderId: string): Promise<void> {
        const order = await this.getById(orderId);
        if (order) {
            order.positionsFilled = Math.min(order.positionsFilled + 1, order.positionsRequired);
            if (order.positionsFilled >= order.positionsRequired) {
                order.status = DemandOrderStatus.FILLED;
            } else if (order.positionsFilled > 0) {
                order.status = DemandOrderStatus.PARTIALLY_FILLED;
            }
            await this.update(order);
        }
    }

    private static mapDatabaseToOrder(dbRecord: any): DemandOrder {
        return {
            id: dbRecord.id,
            employerId: dbRecord.employer_id,
            title: dbRecord.title || '',
            jobCategory: dbRecord.category || '',
            country: 'Qatar', // Default or from joined employer
            location: dbRecord.location || '',
            positionsRequired: dbRecord.positions || 1,
            positionsFilled: dbRecord.data?.positionsFilled || 0,
            salaryRange: dbRecord.salary_range || '',
            contractDuration: dbRecord.data?.contractDuration || '',
            benefits: dbRecord.data?.benefits || [],
            requirements: dbRecord.requirements || [],
            status: (dbRecord.status as DemandOrderStatus) || DemandOrderStatus.OPEN,
            createdAt: dbRecord.created_at,
            deadline: dbRecord.data?.deadline,
            notes: dbRecord.data?.notes,
            activityLog: dbRecord.data?.activityLog || []
        };
    }

    static async addActivity(orderId: string, activity: Omit<EmployerActivity, 'id' | 'timestamp'>): Promise<boolean> {
        const order = await this.getById(orderId);
        if (!order) return false;

        const newActivity: EmployerActivity = {
            id: `act-${Date.now()}`,
            timestamp: new Date().toISOString(),
            ...activity
        };

        order.activityLog = [...(order.activityLog || []), newActivity];
        const updated = await this.update(order);
        return updated !== null;
    }
}
