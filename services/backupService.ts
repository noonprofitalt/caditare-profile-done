/**
 * BackupService — Enterprise-Grade Backup & Restore Engine
 * 
 * Features:
 * - Full system snapshots (candidates, jobs, partners, finance, settings, audit logs)
 * - Version-stamped JSON backup files with SHA-256 checksums
 * - Plug-and-play restore: forward and backward compatible
 * - Backup history stored in localStorage with metadata
 * - Selective restore (pick which modules to restore)
 * - Diff viewer to compare backups with current state
 * - Auto-backup scheduling
 */

import { get, set, del } from 'idb-keyval';
import { CandidateService } from './candidateService';
import { JobService } from './jobService';
import { PartnerService } from './partnerService';
import { FinanceService } from './financeService';
import { AuditService } from './auditService';
import { supabase } from './supabase';

// ─── Types ──────────────────────────────────────────────────
export interface BackupManifest {
    id: string;
    version: string;             // Schema version for forward/backward compat
    appVersion: string;
    createdAt: string;
    createdBy: string;
    label: string;               // User-friendly name
    description: string;
    checksum: string;             // SHA-256 hash of the data payload
    modules: BackupModule[];      // Which modules are included
    stats: BackupStats;           // Quick stats summary
    sizeBytes: number;
    isAutoBackup: boolean;
    tags: string[];
}

export interface BackupStats {
    candidates: number;
    jobs: number;
    employers: number;
    transactions: number;
    invoices: number;
    auditLogs: number;
    settings: number;
}

export type BackupModule =
    | 'candidates'
    | 'jobs'
    | 'employers'
    | 'finance_transactions'
    | 'finance_invoices'
    | 'audit_logs'
    | 'settings'
    | 'profiles';

export interface BackupData {
    manifest: BackupManifest;
    payload: {
        candidates?: any[];
        jobs?: any[];
        employers?: any[];
        finance_transactions?: any[];
        finance_invoices?: any[];
        audit_logs?: any[];
        settings?: Record<string, any>;
        profiles?: any[];
    };
}

export interface BackupHistoryEntry {
    id: string;
    label: string;
    createdAt: string;
    createdBy: string;
    modules: BackupModule[];
    stats: BackupStats;
    sizeBytes: number;
    isAutoBackup: boolean;
    checksum: string;
    tags: string[];
    restoredAt?: string;         // If this backup was ever restored
    description: string;
}

export interface RestoreResult {
    success: boolean;
    modulesRestored: BackupModule[];
    errors: string[];
    warnings: string[];
    restoredAt: string;
    rollbackAvailable: boolean;
}

export interface BackupDiff {
    module: BackupModule;
    added: number;
    removed: number;
    modified: number;
    unchanged: number;
}

// Current schema version - increment when breaking changes occur
const BACKUP_SCHEMA_VERSION = '2.0.0';
const APP_VERSION = '1.0.0';
const BACKUP_HISTORY_KEY = 'suhara_backup_history';
const BACKUP_DATA_PREFIX = 'suhara_backup_data_';
const AUTO_BACKUP_INTERVAL_KEY = 'suhara_auto_backup_interval';
const LAST_AUTO_BACKUP_KEY = 'suhara_last_auto_backup';

// ─── Service Implementation ────────────────────────────────
export class BackupService {

    // ═══════════════════════════════════════════
    //  CREATE BACKUP
    // ═══════════════════════════════════════════

    /**
     * Creates a full system backup snapshot.
     * Fetches all data from Supabase, packages it with metadata,
     * generates a checksum, and stores it.
     */
    static async createBackup(options: {
        label?: string;
        description?: string;
        modules?: BackupModule[];
        isAutoBackup?: boolean;
        createdBy?: string;
        tags?: string[];
    } = {}): Promise<BackupData> {

        const {
            label = `Backup ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
            description = '',
            modules = ['candidates', 'jobs', 'employers', 'finance_transactions', 'finance_invoices', 'audit_logs', 'settings', 'profiles'] as BackupModule[],
            isAutoBackup = false,
            createdBy = 'System',
            tags = []
        } = options;

        const payload: BackupData['payload'] = {};
        const stats: BackupStats = {
            candidates: 0,
            jobs: 0,
            employers: 0,
            transactions: 0,
            invoices: 0,
            auditLogs: 0,
            settings: 0
        };

        // ── Fetch Each Module ──
        if (modules.includes('candidates')) {
            try {
                const candidates = await CandidateService.getCandidates();
                payload.candidates = candidates;
                stats.candidates = candidates.length;
            } catch (e) {
                console.warn('Backup: Failed to fetch candidates', e);
                payload.candidates = [];
            }
        }

        if (modules.includes('jobs')) {
            try {
                const jobs = await JobService.getJobs();
                payload.jobs = jobs;
                stats.jobs = jobs.length;
            } catch (e) {
                console.warn('Backup: Failed to fetch jobs', e);
                payload.jobs = [];
            }
        }

        if (modules.includes('employers')) {
            try {
                const employers = await PartnerService.getEmployers();
                payload.employers = employers;
                stats.employers = employers.length;
            } catch (e) {
                console.warn('Backup: Failed to fetch employers', e);
                payload.employers = [];
            }
        }

        if (modules.includes('finance_transactions')) {
            try {
                const transactions = await FinanceService.getTransactions();
                payload.finance_transactions = transactions;
                stats.transactions = transactions.length;
            } catch (e) {
                console.warn('Backup: Failed to fetch transactions', e);
                payload.finance_transactions = [];
            }
        }

        if (modules.includes('finance_invoices')) {
            try {
                const invoices = await FinanceService.getInvoices();
                payload.finance_invoices = invoices;
                stats.invoices = invoices.length;
            } catch (e) {
                console.warn('Backup: Failed to fetch invoices', e);
                payload.finance_invoices = [];
            }
        }

        if (modules.includes('audit_logs')) {
            try {
                const { data } = await supabase
                    .from('audit_logs')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(5000);
                payload.audit_logs = data || [];
                stats.auditLogs = (data || []).length;
            } catch (e) {
                console.warn('Backup: Failed to fetch audit logs', e);
                payload.audit_logs = [];
            }
        }

        if (modules.includes('settings')) {
            try {
                // Gather all localStorage settings
                const settingsKeys = [
                    'globalworkforce_gemini_api_key',
                    'suhara_security_config',
                    'suhara_auto_backup_interval',
                    'suhara_last_auto_backup'
                ];
                const settings: Record<string, any> = {};
                settingsKeys.forEach(key => {
                    const val = localStorage.getItem(key);
                    if (val) settings[key] = val;
                });
                payload.settings = settings;
                stats.settings = Object.keys(settings).length;
            } catch (e) {
                console.warn('Backup: Failed to fetch settings', e);
                payload.settings = {};
            }
        }

        if (modules.includes('profiles')) {
            try {
                const { data } = await supabase
                    .from('profiles')
                    .select('*');
                payload.profiles = data || [];
            } catch (e) {
                console.warn('Backup: Failed to fetch profiles', e);
                payload.profiles = [];
            }
        }

        // ── Build Manifest ──
        const payloadStr = JSON.stringify(payload);
        const checksum = await this.generateChecksum(payloadStr);
        const id = `bkp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

        const manifest: BackupManifest = {
            id,
            version: BACKUP_SCHEMA_VERSION,
            appVersion: APP_VERSION,
            createdAt: new Date().toISOString(),
            createdBy,
            label,
            description,
            checksum,
            modules,
            stats,
            sizeBytes: new Blob([payloadStr]).size,
            isAutoBackup,
            tags
        };

        const backup: BackupData = { manifest, payload };

        // ── Store Backup ──
        await this.storeBackup(backup);

        // ── Log to audit ──
        AuditService.log('SYSTEM_BACKUP_CREATED', {
            backupId: id,
            label,
            modules,
            stats,
            isAutoBackup,
            sizeBytes: manifest.sizeBytes
        });

        return backup;
    }

    // ═══════════════════════════════════════════
    //  RESTORE BACKUP
    // ═══════════════════════════════════════════

    /**
     * Restores a backup by its ID.
     * Supports selective module restore and automatic pre-restore backup.
     */
    static async restoreBackup(
        backupId: string,
        options: {
            modules?: BackupModule[];
            createPreRestoreBackup?: boolean;
            createdBy?: string;
        } = {}
    ): Promise<RestoreResult> {

        const {
            modules,
            createPreRestoreBackup = true,
            createdBy = 'System'
        } = options;

        const result: RestoreResult = {
            success: false,
            modulesRestored: [],
            errors: [],
            warnings: [],
            restoredAt: new Date().toISOString(),
            rollbackAvailable: false
        };

        // 1. Load the backup
        const backup = await this.loadBackup(backupId);
        if (!backup) {
            result.errors.push('Backup not found');
            return result;
        }

        // 2. Verify integrity
        const payloadStr = JSON.stringify(backup.payload);
        const currentChecksum = await this.generateChecksum(payloadStr);
        if (currentChecksum !== backup.manifest.checksum) {
            result.warnings.push('Backup integrity check failed — checksum mismatch. Proceeding with caution.');
        }

        // 3. Version compatibility check
        const backupVersion = backup.manifest.version;
        if (!this.isVersionCompatible(backupVersion)) {
            result.errors.push(`Backup version ${backupVersion} is not compatible with current schema version ${BACKUP_SCHEMA_VERSION}`);
            return result;
        }

        // 4. Create a pre-restore safety backup
        if (createPreRestoreBackup) {
            try {
                await this.createBackup({
                    label: `Pre-restore safety backup (before restoring ${backup.manifest.label})`,
                    description: `Automatic safety backup created before restoring backup "${backup.manifest.label}"`,
                    isAutoBackup: true,
                    createdBy,
                    tags: ['pre-restore', 'safety']
                });
                result.rollbackAvailable = true;
            } catch (e) {
                result.warnings.push('Could not create pre-restore safety backup');
            }
        }

        // 5. Determine which modules to restore
        const modulesToRestore = modules || backup.manifest.modules;

        // 6. Restore each module
        for (const mod of modulesToRestore) {
            try {
                const data = backup.payload[mod as keyof typeof backup.payload];
                if (!data) {
                    result.warnings.push(`Module "${mod}" not found in backup payload`);
                    continue;
                }

                await this.restoreModule(mod, data);
                result.modulesRestored.push(mod);
            } catch (e: any) {
                result.errors.push(`Failed to restore module "${mod}": ${e.message || e}`);
            }
        }

        // 7. Update history
        const history = this.getBackupHistory();
        const entry = history.find(h => h.id === backupId);
        if (entry) {
            entry.restoredAt = result.restoredAt;
            this.saveBackupHistory(history);
        }

        result.success = result.errors.length === 0;

        // 8. Audit log
        AuditService.log('SYSTEM_BACKUP_RESTORED', {
            backupId,
            modulesRestored: result.modulesRestored,
            errors: result.errors,
            warnings: result.warnings
        });

        return result;
    }

    /**
     * Restores a single module from backup data.
     */
    private static async restoreModule(module: BackupModule, data: any): Promise<void> {
        switch (module) {
            case 'candidates': {
                // Upsert candidates to Supabase
                if (Array.isArray(data)) {
                    for (const candidate of data) {
                        try {
                            const row = CandidateService.mapCandidateToRow(candidate);
                            await supabase.from('candidates').upsert(row, { onConflict: 'id' });
                        } catch (e) {
                            console.warn('Restore: Failed to upsert candidate', candidate.id, e);
                        }
                    }
                }
                break;
            }
            case 'jobs': {
                if (Array.isArray(data)) {
                    for (const job of data) {
                        const dbJob = {
                            id: job.id,
                            title: job.title,
                            company: job.company,
                            location: job.location,
                            salary_range: job.salaryRange,
                            type: job.type,
                            description: job.description,
                            status: job.status,
                            posted_date: job.postedDate,
                            employer_id: job.employerId,
                            data: {
                                requirements: job.requirements,
                                matchedCandidateIds: job.matchedCandidateIds,
                                category: job.category,
                                positions: job.positions,
                                filledPositions: job.filledPositions,
                                deadline: job.deadline,
                                demandOrderId: job.demandOrderId,
                                contactPerson: job.contactPerson,
                                benefits: job.benefits
                            }
                        };
                        await supabase.from('jobs').upsert(dbJob, { onConflict: 'id' });
                    }
                }
                break;
            }
            case 'employers': {
                if (Array.isArray(data)) {
                    for (const emp of data) {
                        const dbEmp = {
                            id: emp.id,
                            name: emp.companyName,
                            location: emp.country,
                            contact_person: emp.contactPerson,
                            email: emp.email,
                            phone: emp.phone,
                            status: emp.status,
                            data: {
                                regNumber: emp.regNumber,
                                website: emp.website,
                                joinedDate: emp.joinedDate,
                                commissionPerHire: emp.commissionPerHire,
                                paymentTermDays: emp.paymentTermDays,
                                quotaTotal: emp.quotaTotal,
                                quotaUsed: emp.quotaUsed,
                                selectionRatio: emp.selectionRatio,
                                documents: emp.documents,
                                activityLog: emp.activityLog,
                                notes: emp.notes
                            }
                        };
                        await supabase.from('employers').upsert(dbEmp, { onConflict: 'id' });
                    }
                }
                break;
            }
            case 'finance_transactions': {
                if (Array.isArray(data)) {
                    for (const tx of data) {
                        await supabase.from('finance_transactions').upsert(tx, { onConflict: 'id' });
                    }
                }
                break;
            }
            case 'finance_invoices': {
                if (Array.isArray(data)) {
                    for (const inv of data) {
                        await supabase.from('invoices').upsert(inv, { onConflict: 'id' });
                    }
                }
                break;
            }
            case 'audit_logs': {
                if (Array.isArray(data)) {
                    for (const log of data) {
                        await supabase.from('audit_logs').upsert(log, { onConflict: 'id' });
                    }
                }
                break;
            }
            case 'settings': {
                if (data && typeof data === 'object') {
                    Object.entries(data).forEach(([key, value]) => {
                        if (typeof value === 'string') {
                            try {
                                localStorage.setItem(key, value);
                            } catch (e) {
                                console.warn('[BackupService] Failed to set localStorage cache (quota exceeded)', e);
                            }
                        }
                    });
                }
                break;
            }
            case 'profiles': {
                if (Array.isArray(data)) {
                    for (const profile of data) {
                        await supabase.from('profiles').upsert(profile, { onConflict: 'id' });
                    }
                }
                break;
            }
        }
    }

    // ═══════════════════════════════════════════
    //  EXPORT / IMPORT (File-Based)
    // ═══════════════════════════════════════════

    /**
     * Exports a backup as a downloadable JSON file.
     */
    static exportBackupToFile(backup: BackupData): void {
        const json = JSON.stringify(backup, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `suhara-backup-${backup.manifest.id}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Downloads a backup from storage as a file.
     */
    static async downloadBackup(backupId: string): Promise<boolean> {
        const backup = await this.loadBackup(backupId);
        if (!backup) return false;
        this.exportBackupToFile(backup);
        return true;
    }

    /**
     * Imports a backup from a JSON file.
     * Validates format, version, and checksum before importing.
     */
    static async importBackupFromFile(file: File): Promise<{ success: boolean; backup?: BackupData; error?: string }> {
        try {
            const text = await file.text();
            const backup: BackupData = JSON.parse(text);

            // Validate structure
            if (!backup.manifest || !backup.payload) {
                return { success: false, error: 'Invalid backup file format: missing manifest or payload' };
            }

            if (!backup.manifest.id || !backup.manifest.version) {
                return { success: false, error: 'Invalid backup manifest: missing id or version' };
            }

            // Version check
            if (!this.isVersionCompatible(backup.manifest.version)) {
                return {
                    success: false,
                    error: `Backup version ${backup.manifest.version} is not compatible with current version ${BACKUP_SCHEMA_VERSION}`
                };
            }

            // Verify checksum
            const payloadStr = JSON.stringify(backup.payload);
            const computedChecksum = await this.generateChecksum(payloadStr);
            if (computedChecksum !== backup.manifest.checksum) {
                // Don't block — just warn. The backup might have been manually edited
                console.warn('Imported backup checksum mismatch — file may have been modified');
            }

            // Recalculate size
            backup.manifest.sizeBytes = new Blob([payloadStr]).size;

            // Store it
            await this.storeBackup(backup);

            AuditService.log('SYSTEM_BACKUP_IMPORTED', {
                backupId: backup.manifest.id,
                label: backup.manifest.label,
                originalDate: backup.manifest.createdAt
            });

            return { success: true, backup };
        } catch (e: any) {
            return { success: false, error: e.message || 'Failed to parse backup file' };
        }
    }

    // ═══════════════════════════════════════════
    //  BACKUP HISTORY & STORAGE
    // ═══════════════════════════════════════════

    /**
     * Gets the history of all backups (metadata only).
     */
    static getBackupHistory(): BackupHistoryEntry[] {
        try {
            const raw = localStorage.getItem(BACKUP_HISTORY_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }

    /**
     * Saves backup history to localStorage.
     */
    private static saveBackupHistory(history: BackupHistoryEntry[]): void {
        try {
            localStorage.setItem(BACKUP_HISTORY_KEY, JSON.stringify(history));
        } catch (e) {
            console.warn('[BackupService] Failed to save backup history (quota exceeded)', e);
            // Optionally, we could trim the history further here, but for now just catch the error.
        }
    }

    /**
     * Stores a full backup (metadata + data). Data goes to IndexedDB, history goes to localStorage.
     */
    private static async storeBackup(backup: BackupData): Promise<void> {
        const key = BACKUP_DATA_PREFIX + backup.manifest.id;
        try {
            await set(key, backup);
        } catch (e) {
            console.warn('IndexedDB full or error, removing oldest backup...');
            await this.removeOldestBackup();
            try {
                await set(key, backup);
            } catch (e2) {
                console.error('Failed to store backup even after cleanup', e2);
            }
        }

        // Update history synchronously in LocalStorage
        const history = this.getBackupHistory();
        const entry: BackupHistoryEntry = {
            id: backup.manifest.id,
            label: backup.manifest.label,
            createdAt: backup.manifest.createdAt,
            createdBy: backup.manifest.createdBy,
            modules: backup.manifest.modules,
            stats: backup.manifest.stats,
            sizeBytes: backup.manifest.sizeBytes,
            isAutoBackup: backup.manifest.isAutoBackup,
            checksum: backup.manifest.checksum,
            tags: backup.manifest.tags,
            description: backup.manifest.description
        };

        const filtered = history.filter(h => h.id !== entry.id);
        filtered.unshift(entry); // newest first
        this.saveBackupHistory(filtered.slice(0, 50));
    }

    /**
     * Loads a full backup by ID from IndexedDB.
     */
    static async loadBackup(backupId: string): Promise<BackupData | null> {
        try {
            const backup = await get<BackupData>(BACKUP_DATA_PREFIX + backupId);
            return backup || null;
        } catch {
            return null;
        }
    }

    /**
     * Deletes a backup by ID.
     */
    static async deleteBackup(backupId: string): Promise<boolean> {
        try {
            await del(BACKUP_DATA_PREFIX + backupId);
            const history = this.getBackupHistory().filter(h => h.id !== backupId);
            this.saveBackupHistory(history);

            AuditService.log('SYSTEM_BACKUP_DELETED', { backupId });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Removes the oldest backup to free space.
     */
    private static async removeOldestBackup(): Promise<void> {
        const history = this.getBackupHistory();
        if (history.length > 0) {
            const oldest = history[history.length - 1];
            await this.deleteBackup(oldest.id);
        }
    }

    // ═══════════════════════════════════════════
    //  COMPARISON / DIFF
    // ═══════════════════════════════════════════

    /**
     * Compares a backup's contents with the current live data.
     */
    static async compareWithCurrent(backupId: string): Promise<BackupDiff[]> {
        const backup = await this.loadBackup(backupId);
        if (!backup) return [];

        const diffs: BackupDiff[] = [];

        // Compare candidates
        if (backup.payload.candidates) {
            const currentCandidates = await CandidateService.getCandidates();
            const backupIds = new Set(backup.payload.candidates.map((c: any) => c.id));
            const currentIds = new Set(currentCandidates.map(c => c.id));

            diffs.push({
                module: 'candidates',
                added: [...currentIds].filter(id => !backupIds.has(id)).length,
                removed: [...backupIds].filter(id => !currentIds.has(id)).length,
                modified: [...currentIds].filter(id => backupIds.has(id)).length,
                unchanged: 0 // Simplified — would need deep comparison for accuracy
            });
        }

        // Compare jobs
        if (backup.payload.jobs) {
            const currentJobs = await JobService.getJobs();
            const backupIds = new Set(backup.payload.jobs.map((j: any) => j.id));
            const currentIds = new Set(currentJobs.map(j => j.id));

            diffs.push({
                module: 'jobs',
                added: [...currentIds].filter(id => !backupIds.has(id)).length,
                removed: [...backupIds].filter(id => !currentIds.has(id)).length,
                modified: [...currentIds].filter(id => backupIds.has(id)).length,
                unchanged: 0
            });
        }

        // Compare employers
        if (backup.payload.employers) {
            const currentEmployers = await PartnerService.getEmployers();
            const backupIds = new Set(backup.payload.employers.map((e: any) => e.id));
            const currentIds = new Set(currentEmployers.map(e => e.id));

            diffs.push({
                module: 'employers',
                added: [...currentIds].filter(id => !backupIds.has(id)).length,
                removed: [...backupIds].filter(id => !currentIds.has(id)).length,
                modified: [...currentIds].filter(id => backupIds.has(id)).length,
                unchanged: 0
            });
        }

        return diffs;
    }

    // ═══════════════════════════════════════════
    //  AUTO-BACKUP SCHEDULING
    // ═══════════════════════════════════════════

    /**
     * Gets the auto-backup interval in hours (0 = disabled).
     */
    static getAutoBackupInterval(): number {
        const val = localStorage.getItem(AUTO_BACKUP_INTERVAL_KEY);
        return val ? parseInt(val, 10) : 0;
    }

    /**
     * Sets the auto-backup interval in hours (0 = disabled).
     */
    static setAutoBackupInterval(hours: number): void {
        try {
            localStorage.setItem(AUTO_BACKUP_INTERVAL_KEY, String(hours));
        } catch (e) {
            console.warn('[BackupService] Failed to set auto backup interval (quota exceeded)', e);
        }
    }

    /**
     * Gets the timestamp of the last auto-backup.
     */
    static getLastAutoBackupTime(): string | null {
        return localStorage.getItem(LAST_AUTO_BACKUP_KEY);
    }

    /**
     * Checks if an auto-backup is due and creates one if needed.
     */
    static async checkAndRunAutoBackup(): Promise<boolean> {
        const interval = this.getAutoBackupInterval();
        if (interval <= 0) return false;

        const lastBackup = this.getLastAutoBackupTime();
        const now = Date.now();

        if (!lastBackup || (now - new Date(lastBackup).getTime()) >= interval * 60 * 60 * 1000) {
            try {
                await this.createBackup({
                    label: `Auto-backup ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
                    description: 'Automatic scheduled backup',
                    isAutoBackup: true,
                    createdBy: 'Auto-Scheduler',
                    tags: ['auto', 'scheduled']
                });
                try {
                    localStorage.setItem(LAST_AUTO_BACKUP_KEY, new Date().toISOString());
                } catch (e) {
                    console.warn('[BackupService] Failed to update last auto backup time (quota exceeded)', e);
                }
                return true;
            } catch (e) {
                console.error('Auto-backup failed:', e);
                return false;
            }
        }

        return false;
    }

    // ═══════════════════════════════════════════
    //  UTILITIES
    // ═══════════════════════════════════════════

    /**
     * Generates a SHA-256 checksum of the given string.
     */
    private static async generateChecksum(data: string): Promise<string> {
        try {
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(data);
            const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch {
            // Fallback for environments without crypto.subtle
            let hash = 0;
            for (let i = 0; i < data.length; i++) {
                const char = data.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32bit integer
            }
            return Math.abs(hash).toString(16).padStart(8, '0');
        }
    }

    /**
     * Checks version compatibility using semver-light logic.
     * Major version must match. Minor/patch can differ.
     */
    private static isVersionCompatible(backupVersion: string): boolean {
        const [backupMajor] = backupVersion.split('.').map(Number);
        const [currentMajor] = BACKUP_SCHEMA_VERSION.split('.').map(Number);
        return backupMajor === currentMajor;
    }

    /**
     * Formats bytes into human readable format.
     */
    static formatBytes(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    /**
     * Gets total storage used by backups.
     */
    static getStorageUsed(): { used: number; count: number } {
        const history = this.getBackupHistory();
        const used = history.reduce((acc, h) => acc + h.sizeBytes, 0);
        return { used, count: history.length };
    }
}
