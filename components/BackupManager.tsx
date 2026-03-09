import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Database,
    Download,
    RotateCcw,
    Trash2,
    Clock,
    Shield,
    CheckCircle2,
    AlertCircle,
    HardDrive,
    ArrowDownToLine,
    ArrowUpFromLine,
    RefreshCw,
    Package,
    Eye,
    X,
    ChevronDown,
    ChevronUp,
    History,
    Zap,
    ShieldCheck,
    AlertTriangle,
    Users,
    Briefcase,
    Target,
    DollarSign,
    ScrollText,
    Settings,
    UserCircle,
    Timer,
    Info,
    FileCheck,
    FileWarning,
    Plus,
    Minus
} from 'lucide-react';
import {
    BackupService,
    BackupHistoryEntry,
    BackupModule,
    BackupDiff,
    RestoreResult,
    BackupStats
} from '../services/backupService';
import { useAuth } from '../context/AuthContext';

// ─── Module Config ──────────────────────────────────────────
const MODULE_CONFIG: Record<BackupModule, { label: string; icon: React.ComponentType<any>; color: string }> = {
    candidates: { label: 'Candidates', icon: Users, color: 'text-blue-500' },
    jobs: { label: 'Jobs', icon: Briefcase, color: 'text-emerald-500' },
    employers: { label: 'Employers', icon: Target, color: 'text-violet-500' },
    finance_transactions: { label: 'Transactions', icon: DollarSign, color: 'text-amber-500' },
    finance_invoices: { label: 'Invoices', icon: ScrollText, color: 'text-orange-500' },
    audit_logs: { label: 'Audit Logs', icon: Shield, color: 'text-red-500' },
    settings: { label: 'Settings', icon: Settings, color: 'text-slate-500' },
    profiles: { label: 'User Profiles', icon: UserCircle, color: 'text-cyan-500' },
};

const ALL_MODULES: BackupModule[] = Object.keys(MODULE_CONFIG) as BackupModule[];

// ─── Component ──────────────────────────────────────────────
const BackupManager: React.FC = () => {
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State
    const [history, setHistory] = useState<BackupHistoryEntry[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedModules, setSelectedModules] = useState<BackupModule[]>([...ALL_MODULES]);
    const [backupLabel, setBackupLabel] = useState('');
    const [backupDescription, setBackupDescription] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showRestoreModal, setShowRestoreModal] = useState<string | null>(null);
    const [showDiffModal, setShowDiffModal] = useState<string | null>(null);
    const [restoreModules, setRestoreModules] = useState<BackupModule[]>([]);
    const [restoreResult, setRestoreResult] = useState<RestoreResult | null>(null);
    const [diffs, setDiffs] = useState<BackupDiff[]>([]);
    const [loadingDiff, setLoadingDiff] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
    const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
    const [autoBackupInterval, setAutoBackupInterval] = useState(0);
    const [storageInfo, setStorageInfo] = useState({ used: 0, count: 0 });
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [importError, setImportError] = useState<string | null>(null);

    // ── Load Data ──
    const loadData = useCallback(() => {
        setHistory(BackupService.getBackupHistory());
        setAutoBackupInterval(BackupService.getAutoBackupInterval());
        setStorageInfo(BackupService.getStorageUsed());
    }, []);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        // Artificial delay so the spin animation is visible to the user
        await new Promise(r => setTimeout(r, 600));
        loadData();
        setIsRefreshing(false);
        showNotification('success', 'Backup history synchronized');
    };

    useEffect(() => {
        loadData();
        // Check for auto-backup on mount
        BackupService.checkAndRunAutoBackup().then(ran => {
            if (ran) {
                loadData();
                showNotification('info', 'Auto-backup completed successfully');
            }
        });
    }, [loadData]);

    // ── Notifications ──
    const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    // ── Create Backup ──
    const handleCreateBackup = async () => {
        setIsCreating(true);
        try {
            const backup = await BackupService.createBackup({
                label: backupLabel || undefined,
                description: backupDescription,
                modules: selectedModules,
                createdBy: user?.name || user?.email || 'Admin',
                tags: [],
            });
            loadData();
            setShowCreateForm(false);
            setBackupLabel('');
            setBackupDescription('');
            setSelectedModules([...ALL_MODULES]);
            showNotification('success', `Backup "${backup.manifest.label}" created successfully — ${BackupService.formatBytes(backup.manifest.sizeBytes)}`);
        } catch (e: any) {
            showNotification('error', `Backup failed: ${e.message || 'Unknown error'}`);
        } finally {
            setIsCreating(false);
        }
    };

    // ── Download Backup ──
    const handleDownload = async (backupId: string) => {
        const success = await BackupService.downloadBackup(backupId);
        if (success) {
            showNotification('success', 'Backup file downloaded');
        } else {
            showNotification('error', 'Failed to download backup — data may have been removed');
        }
    };

    // ── Import Backup ──
    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setImportError(null);
        const result = await BackupService.importBackupFromFile(file);
        if (result.success) {
            loadData();
            showNotification('success', `Backup "${result.backup?.manifest.label}" imported successfully`);
        } else {
            setImportError(result.error || 'Import failed');
            showNotification('error', result.error || 'Failed to import backup');
        }

        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // ── Restore Backup ──
    const handleRestore = async () => {
        if (!showRestoreModal) return;
        setIsRestoring(true);
        setRestoreResult(null);

        try {
            const result = await BackupService.restoreBackup(showRestoreModal, {
                modules: restoreModules.length > 0 ? restoreModules : undefined,
                createPreRestoreBackup: true,
                createdBy: user?.name || user?.email || 'Admin',
            });
            setRestoreResult(result);
            loadData();

            if (result.success) {
                showNotification('success', `Restored ${result.modulesRestored.length} modules successfully`);
            } else {
                showNotification('error', `Restore completed with ${result.errors.length} errors`);
            }
        } catch (e: any) {
            showNotification('error', `Restore failed: ${e.message}`);
        } finally {
            setIsRestoring(false);
        }
    };

    // ── Compare Backup ──
    const handleCompare = async (backupId: string) => {
        setShowDiffModal(backupId);
        setLoadingDiff(true);
        try {
            const result = await BackupService.compareWithCurrent(backupId);
            setDiffs(result);
        } catch {
            setDiffs([]);
        } finally {
            setLoadingDiff(false);
        }
    };

    // ── Delete Backup ──
    const handleDelete = async (backupId: string) => {
        await BackupService.deleteBackup(backupId);
        loadData();
        setDeleteConfirm(null);
        showNotification('info', 'Backup deleted');
    };

    // ── Auto Backup Config ──
    const handleAutoBackupChange = (hours: number) => {
        setAutoBackupInterval(hours);
        BackupService.setAutoBackupInterval(hours);
        if (hours > 0) {
            showNotification('info', `Auto-backup set to every ${hours} hour${hours > 1 ? 's' : ''}`);
        } else {
            showNotification('info', 'Auto-backup disabled');
        }
    };

    // ── Toggle Module Selection ──
    const toggleModule = (module: BackupModule, list: BackupModule[], setter: (m: BackupModule[]) => void) => {
        setter(list.includes(module) ? list.filter(m => m !== module) : [...list, module]);
    };

    // ── Module Badge ──
    const ModuleBadge: React.FC<{ module: BackupModule; small?: boolean }> = ({ module, small }) => {
        const config = MODULE_CONFIG[module];
        if (!config) return null;
        const Icon = config.icon;
        return (
            <span className={`inline-flex items-center gap-1 ${small ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'} bg-slate-100 text-slate-700 rounded-full font-medium`}>
                <Icon size={small ? 10 : 12} className={config.color} />
                {config.label}
            </span>
        );
    };

    // ── Stats Summary ──
    const StatsSummary: React.FC<{ stats: BackupStats }> = ({ stats }) => (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
            {[
                { label: 'Candidates', value: stats.candidates, color: 'text-blue-600 bg-blue-50' },
                { label: 'Jobs', value: stats.jobs, color: 'text-emerald-600 bg-emerald-50' },
                { label: 'Employers', value: stats.employers, color: 'text-violet-600 bg-violet-50' },
                { label: 'Transactions', value: stats.transactions, color: 'text-amber-600 bg-amber-50' },
            ].map(s => (
                <div key={s.label} className={`${s.color} rounded-lg px-3 py-2 text-center`}>
                    <p className="text-lg font-bold">{s.value}</p>
                    <p className="text-[10px] font-medium opacity-70">{s.label}</p>
                </div>
            ))}
        </div>
    );

    // ── Format time ago ──
    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 30) return `${days}d ago`;
        return new Date(dateStr).toLocaleDateString();
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">

            {/* ═══ Notification Toast ═══ */}
            {notification && (
                <div className={`fixed top-4 right-4 z-[9999] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border transition-all animate-in slide-in-from-right-8 duration-300 ${notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                    notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                        'bg-blue-50 border-blue-200 text-blue-800'
                    }`}>
                    {notification.type === 'success' ? <CheckCircle2 size={18} /> :
                        notification.type === 'error' ? <AlertCircle size={18} /> :
                            <Info size={18} />}
                    <span className="text-sm font-medium">{notification.message}</span>
                    <button onClick={() => setNotification(null)} className="ml-2 opacity-60 hover:opacity-100">
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* ═══ Header Section ═══ */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 relative overflow-hidden shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-1">Backup & Restore Center</h3>
                        <p className="text-sm text-slate-500">Manage data snapshots, local imports, and auto-backups.</p>
                    </div>

                    <div className="flex items-center gap-6 text-center bg-slate-50 border border-slate-100 rounded-lg px-6 py-3">
                        <div>
                            <p className="text-xl font-bold text-slate-800">{storageInfo.count}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-0.5">Backups</p>
                        </div>
                        <div className="w-px h-8 bg-slate-200" />
                        <div>
                            <p className="text-xl font-bold text-slate-800">{BackupService.formatBytes(storageInfo.used)}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-0.5">Storage</p>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-slate-100">
                    <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors text-sm"
                    >
                        <ArrowDownToLine size={16} />
                        Create Backup
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors text-sm"
                    >
                        <ArrowUpFromLine size={16} />
                        Import Backup
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        className="hidden"
                    />

                    {/* Auto-Backup Toggle */}
                    <div className="flex items-center gap-2 ml-auto bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                        <Timer size={14} className="text-slate-500" />
                        <span className="text-xs text-slate-600 font-medium hidden sm:inline">Auto-backup:</span>
                        <select
                            value={autoBackupInterval}
                            onChange={(e) => handleAutoBackupChange(Number(e.target.value))}
                            className="bg-transparent text-sm text-slate-800 font-medium outline-none cursor-pointer appearance-none pl-1 pr-2"
                        >
                            <option value={0}>Off</option>
                            <option value={1}>Every 1h</option>
                            <option value={4}>Every 4h</option>
                            <option value={12}>Every 12h</option>
                            <option value={24}>Daily</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* ═══ Create Backup Form ═══ */}
            {showCreateForm && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Package size={20} className="text-slate-500" />
                            New Backup Configuration
                        </h4>
                        <button onClick={() => setShowCreateForm(false)} className="text-slate-400 hover:text-slate-600">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Backup Label</label>
                            <input
                                type="text"
                                value={backupLabel}
                                onChange={(e) => setBackupLabel(e.target.value)}
                                placeholder={`Backup ${new Date().toLocaleDateString()}`}
                                className="w-full px-4 py-2 border border-slate-200 hover:border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-100 focus:border-slate-400 outline-none text-sm transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Description (optional)</label>
                            <input
                                type="text"
                                value={backupDescription}
                                onChange={(e) => setBackupDescription(e.target.value)}
                                placeholder="e.g. Before major update..."
                                className="w-full px-4 py-2 border border-slate-200 hover:border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-100 focus:border-slate-400 outline-none text-sm transition-all"
                            />
                        </div>
                    </div>

                    {/* Module Selection */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-medium text-slate-700">Select Modules to Backup</label>
                            <button
                                onClick={() => setSelectedModules(selectedModules.length === ALL_MODULES.length ? [] : [...ALL_MODULES])}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                                {selectedModules.length === ALL_MODULES.length ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {ALL_MODULES.map(mod => {
                                const config = MODULE_CONFIG[mod];
                                const Icon = config.icon;
                                const selected = selectedModules.includes(mod);
                                return (
                                    <button
                                        key={mod}
                                        onClick={() => toggleModule(mod, selectedModules, setSelectedModules)}
                                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${selected
                                            ? 'border-slate-300 bg-slate-50 text-slate-800 shadow-sm'
                                            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
                                            }`}
                                    >
                                        <Icon size={16} className={selected ? 'text-slate-800' : 'text-slate-400'} />
                                        {config.label}
                                        {selected && <CheckCircle2 size={12} className="ml-auto text-slate-800" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={() => setShowCreateForm(false)}
                            className="px-5 py-2 text-slate-600 hover:text-slate-800 font-medium text-sm rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateBackup}
                            disabled={isCreating || selectedModules.length === 0}
                            className="flex items-center gap-2 px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:pointer-events-none text-sm"
                        >
                            {isCreating ? (
                                <>
                                    <RefreshCw size={16} className="animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <ArrowDownToLine size={16} />
                                    Create Backup Now
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* ═══ Import Error ═══ */}
            {importError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-in fade-in duration-200">
                    <FileWarning size={18} className="text-red-500 mt-0.5 shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-red-800">Import Failed</p>
                        <p className="text-xs text-red-600 mt-1">{importError}</p>
                    </div>
                    <button onClick={() => setImportError(null)} className="text-red-400 hover:text-red-600">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* ═══ Backup History ═══ */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                        <History size={18} className="text-slate-500" />
                        Backup History
                        <span className="text-xs text-slate-400 font-normal ml-1">({history.length} backups)</span>
                    </h4>
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className={`text-slate-400 hover:text-slate-800 transition-colors ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Refresh history"
                    >
                        <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                    </button>
                </div>

                {history.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Database size={28} className="text-slate-400" />
                        </div>
                        <p className="text-slate-500 font-medium mb-1">No backups yet</p>
                        <p className="text-sm text-slate-400 mb-4">Create your first backup to protect your data</p>
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white font-medium rounded-lg text-sm hover:bg-slate-800 transition-colors"
                        >
                            <ArrowDownToLine size={16} />
                            Create First Backup
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {history.map((entry) => {
                            const isExpanded = expandedEntry === entry.id;
                            return (
                                <div key={entry.id} className="group hover:bg-slate-50/50 transition-colors">
                                    {/* Main Row */}
                                    <div className="px-6 py-4 flex items-center gap-4">
                                        {/* Icon */}
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${entry.isAutoBackup ? 'bg-slate-100' : 'bg-blue-50'
                                            }`}>
                                            {entry.isAutoBackup ? (
                                                <Zap size={18} className="text-slate-500" />
                                            ) : (
                                                <Package size={18} className="text-blue-600" />
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h5 className="font-bold text-slate-800 text-sm truncate">{entry.label}</h5>
                                                {entry.isAutoBackup && (
                                                    <span className="text-[9px] px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded-full font-bold uppercase tracking-wider">Auto</span>
                                                )}
                                                {entry.restoredAt && (
                                                    <span className="text-[9px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-bold uppercase tracking-wider">Restored</span>
                                                )}
                                                {entry.tags?.map(tag => (
                                                    <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full font-medium">{tag}</span>
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-slate-400">
                                                <span className="flex items-center gap-1">
                                                    <Clock size={11} />
                                                    {timeAgo(entry.createdAt)}
                                                </span>
                                                <span>•</span>
                                                <span>{BackupService.formatBytes(entry.sizeBytes)}</span>
                                                <span>•</span>
                                                <span>{entry.modules.length} modules</span>
                                                <span>•</span>
                                                <span>by {entry.createdBy}</span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                onClick={() => handleDownload(entry.id)}
                                                title="Download .json"
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <Download size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleCompare(entry.id)}
                                                title="Compare with current"
                                                className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowRestoreModal(entry.id);
                                                    setRestoreModules([]);
                                                    setRestoreResult(null);
                                                }}
                                                title="Restore this backup"
                                                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                            >
                                                <RotateCcw size={16} />
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(entry.id)}
                                                title="Delete backup"
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                                                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                                            >
                                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <div className="px-6 pb-4 animate-in slide-in-from-top-2 duration-200">
                                            <div className="bg-slate-50 rounded-xl p-4 ml-14">
                                                {entry.description && (
                                                    <p className="text-sm text-slate-600 mb-3 italic">"{entry.description}"</p>
                                                )}

                                                {/* Modules included */}
                                                <div className="mb-3">
                                                    <p className="text-xs font-medium text-slate-500 mb-2">Modules Included:</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {entry.modules.map(mod => (
                                                            <ModuleBadge key={mod} module={mod} small />
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Stats */}
                                                <StatsSummary stats={entry.stats} />

                                                {/* Metadata */}
                                                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                                                    <div>
                                                        <span className="font-medium">Created:</span>{' '}
                                                        {new Date(entry.createdAt).toLocaleString()}
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">Checksum:</span>{' '}
                                                        <code className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded font-mono">{entry.checksum.substring(0, 16)}...</code>
                                                    </div>
                                                    {entry.restoredAt && (
                                                        <div className="col-span-2">
                                                            <span className="font-medium text-emerald-600">Last Restored:</span>{' '}
                                                            {new Date(entry.restoredAt).toLocaleString()}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Delete Confirmation */}
                                    {deleteConfirm === entry.id && (
                                        <div className="px-6 pb-4 animate-in fade-in duration-200">
                                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 ml-14 flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-red-800">
                                                    <AlertTriangle size={16} />
                                                    <span className="text-sm font-medium">Delete this backup permanently?</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setDeleteConfirm(null)}
                                                        className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white rounded-lg transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(entry.id)}
                                                        className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ═══ Restore Modal ═══ */}
            {showRestoreModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <RotateCcw size={20} className="text-emerald-600" />
                                    Restore Backup
                                </h4>
                                <button onClick={() => { setShowRestoreModal(null); setRestoreResult(null); }} className="text-slate-400 hover:text-slate-600">
                                    <X size={20} />
                                </button>
                            </div>

                            {!restoreResult ? (
                                <>
                                    {/* Safety Notice */}
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                                        <ShieldCheck size={18} className="text-amber-600 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-amber-800">Safety First</p>
                                            <p className="text-xs text-amber-700 mt-1">
                                                A safety backup of your current data will be created automatically before restoring.
                                                You can always roll back.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Module Selection for Restore */}
                                    <div className="mb-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-sm font-medium text-slate-700">Select modules to restore</label>
                                            <span className="text-xs text-slate-400">Leave empty = restore all</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {(() => {
                                                const backup = history.find(h => h.id === showRestoreModal);
                                                return (backup?.modules || ALL_MODULES).map(mod => {
                                                    const config = MODULE_CONFIG[mod];
                                                    if (!config) return null;
                                                    const Icon = config.icon;
                                                    const selected = restoreModules.includes(mod);
                                                    return (
                                                        <button
                                                            key={mod}
                                                            onClick={() => toggleModule(mod, restoreModules, setRestoreModules)}
                                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${selected
                                                                ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                                                : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                                                }`}
                                                        >
                                                            <Icon size={14} className={selected ? config.color : 'text-slate-400'} />
                                                            {config.label}
                                                            {selected && <CheckCircle2 size={10} className="ml-auto text-emerald-500" />}
                                                        </button>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    </div>

                                    {/* Restore Button */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => { setShowRestoreModal(null); setRestoreResult(null); }}
                                            className="flex-1 px-4 py-2.5 text-slate-600 hover:bg-slate-100 font-medium text-sm rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleRestore}
                                            disabled={isRestoring}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {isRestoring ? (
                                                <>
                                                    <RefreshCw size={16} className="animate-spin" />
                                                    Restoring...
                                                </>
                                            ) : (
                                                <>
                                                    <RotateCcw size={16} />
                                                    Restore Now
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                /* Restore Result */
                                <div className="animate-in fade-in duration-300">
                                    <div className={`p-4 rounded-xl mb-4 ${restoreResult.success ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            {restoreResult.success ? (
                                                <CheckCircle2 size={20} className="text-emerald-600" />
                                            ) : (
                                                <AlertCircle size={20} className="text-red-600" />
                                            )}
                                            <h5 className={`font-bold text-sm ${restoreResult.success ? 'text-emerald-800' : 'text-red-800'}`}>
                                                {restoreResult.success ? 'Restore Completed Successfully' : 'Restore Completed with Errors'}
                                            </h5>
                                        </div>

                                        {/* Modules Restored */}
                                        <div className="mt-3">
                                            <p className="text-xs font-medium text-slate-600 mb-1">Modules Restored:</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {restoreResult.modulesRestored.map(mod => (
                                                    <ModuleBadge key={mod} module={mod} small />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Errors */}
                                        {restoreResult.errors.length > 0 && (
                                            <div className="mt-3">
                                                <p className="text-xs font-bold text-red-700 mb-1">Errors:</p>
                                                <ul className="text-xs text-red-600 space-y-1 list-disc list-inside">
                                                    {restoreResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Warnings */}
                                        {restoreResult.warnings.length > 0 && (
                                            <div className="mt-3">
                                                <p className="text-xs font-bold text-amber-700 mb-1">Warnings:</p>
                                                <ul className="text-xs text-amber-600 space-y-1 list-disc list-inside">
                                                    {restoreResult.warnings.map((w, i) => <li key={i}>{w}</li>)}
                                                </ul>
                                            </div>
                                        )}

                                        {restoreResult.rollbackAvailable && (
                                            <p className="mt-3 text-xs text-slate-500 flex items-center gap-1">
                                                <ShieldCheck size={12} className="text-emerald-500" />
                                                A pre-restore safety backup was created. You can roll back anytime.
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => { setShowRestoreModal(null); setRestoreResult(null); }}
                                        className="w-full px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-lg transition-colors"
                                    >
                                        Done
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ Diff Modal ═══ */}
            {showDiffModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-lg animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Eye size={20} className="text-violet-600" />
                                    Compare with Current Data
                                </h4>
                                <button onClick={() => setShowDiffModal(null)} className="text-slate-400 hover:text-slate-600">
                                    <X size={20} />
                                </button>
                            </div>

                            {loadingDiff ? (
                                <div className="py-12 text-center">
                                    <RefreshCw size={24} className="text-blue-500 animate-spin mx-auto mb-3" />
                                    <p className="text-sm text-slate-500">Comparing data...</p>
                                </div>
                            ) : diffs.length === 0 ? (
                                <div className="py-8 text-center text-slate-500">
                                    <FileCheck size={32} className="mx-auto mb-2 text-slate-400" />
                                    <p className="text-sm">No comparison data available</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {diffs.map(diff => {
                                        const config = MODULE_CONFIG[diff.module];
                                        const Icon = config?.icon || Database;
                                        return (
                                            <div key={diff.module} className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Icon size={16} className={config?.color || 'text-slate-500'} />
                                                    <span className="font-bold text-sm text-slate-800">{config?.label || diff.module}</span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="bg-emerald-50 rounded-lg p-2 text-center">
                                                        <div className="flex items-center justify-center gap-1 text-emerald-700">
                                                            <Plus size={12} />
                                                            <span className="font-bold text-sm">{diff.added}</span>
                                                        </div>
                                                        <p className="text-[10px] text-emerald-600">New since</p>
                                                    </div>
                                                    <div className="bg-red-50 rounded-lg p-2 text-center">
                                                        <div className="flex items-center justify-center gap-1 text-red-700">
                                                            <Minus size={12} />
                                                            <span className="font-bold text-sm">{diff.removed}</span>
                                                        </div>
                                                        <p className="text-[10px] text-red-600">Removed</p>
                                                    </div>
                                                    <div className="bg-blue-50 rounded-lg p-2 text-center">
                                                        <div className="flex items-center justify-center gap-1 text-blue-700">
                                                            <RefreshCw size={12} />
                                                            <span className="font-bold text-sm">{diff.modified}</span>
                                                        </div>
                                                        <p className="text-[10px] text-blue-600">In both</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <button
                                onClick={() => setShowDiffModal(null)}
                                className="w-full mt-6 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ Info Footer ═══ */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
                <div className="text-xs text-blue-700 leading-relaxed">
                    <p className="font-medium text-blue-800 mb-1">How Backup & Restore Works</p>
                    <ul className="list-disc list-inside space-y-0.5">
                        <li><strong>Create:</strong> Takes a full snapshot of all selected modules and stores it locally with a SHA-256 checksum</li>
                        <li><strong>Download:</strong> Export any backup as a portable JSON file — plug-and-play across systems</li>
                        <li><strong>Import:</strong> Load a backup file from another system or a previous export</li>
                        <li><strong>Restore:</strong> Roll back to any previous state. A safety backup is created automatically before every restore</li>
                        <li><strong>Compare:</strong> See what changed between a backup snapshot and the current live data</li>
                        <li><strong>Auto-backup:</strong> Set a schedule and backups happen automatically in the background</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default BackupManager;
