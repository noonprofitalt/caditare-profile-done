import React, { useState, useRef, useEffect } from 'react';
import { Candidate, RemarkEntry } from '../../types';
import {
    Activity,
    Plus,
    X,
    Trash2,
    Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ActivityLogWidgetProps {
    candidate: Candidate;
    onUpdate?: (updatedRemarkLog: RemarkEntry[]) => void;
    isEditable?: boolean;
}

// Quick action templates for standard activities
const QUICK_ACTIONS = [
    { label: 'Medical Call', text: 'Called to come for Medical + Advance', status: 'Pending' },
    { label: 'Medical Done', text: 'Medical & Advance Payment Done', status: 'Completed' },
    { label: '20% Confirm', text: '20% Payment Received', status: 'Completed' },
    { label: 'Balance Paid', text: 'Balance Payment Received', status: 'Completed' },
    { label: 'Submit WP', text: 'Submit Work Permit Application', status: 'In Progress' },
    { label: 'Police Rep', text: 'Send a Police Report', status: 'Pending' },
    { label: 'Offer Sign', text: 'Offer Letter Signed', status: 'Completed' },
];

const formatDisplayDate = (dateStr: string): string => {
    if (!dateStr) return '-';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
    } catch {
        return dateStr;
    }
};

const ActivityLogWidget: React.FC<ActivityLogWidgetProps> = ({ candidate, onUpdate, isEditable = true }) => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'Admin';
    const [showAddRow, setShowAddRow] = useState(false);

    // Form state
    const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
    const [newReason, setNewReason] = useState('');
    const [newNote, setNewNote] = useState('');

    const [deleteConfirmIdx, setDeleteConfirmIdx] = useState<number | null>(null);
    const reasonInputRef = useRef<HTMLTextAreaElement>(null);

    const remarkLog: RemarkEntry[] = (candidate as any).remarkLog || [];

    // Newest first
    const sortedRemarks = [...remarkLog].sort((a, b) => {
        const da = new Date(a.date).getTime();
        const db = new Date(b.date).getTime();
        if (isNaN(da) && isNaN(db)) return 0;
        if (isNaN(da)) return 1;
        if (isNaN(db)) return -1;
        return db - da;
    });

    useEffect(() => {
        if (showAddRow && reasonInputRef.current) {
            reasonInputRef.current.focus();
        }
    }, [showAddRow]);

    // Auto-resize textarea
    useEffect(() => {
        if (reasonInputRef.current) {
            reasonInputRef.current.style.height = 'auto';
            reasonInputRef.current.style.height = reasonInputRef.current.scrollHeight + 'px';
        }
    }, [newReason]);

    const handleAddSubmit = () => {
        if (!newDate || !newReason.trim()) return;

        const updatedEntry: RemarkEntry = {
            date: newDate,
            remark: newReason.trim(),
            note: newNote.trim() || undefined
        };

        const updatedLog = [...remarkLog, updatedEntry];

        if (onUpdate) {
            onUpdate(updatedLog);
        }

        // Reset
        setNewReason('');
        setNewNote('');
        setNewDate(new Date().toISOString().split('T')[0]);
        setShowAddRow(false);
    };

    const handleDelete = (idx: number) => {
        const targetEntry = sortedRemarks[idx];
        const originalIdx = remarkLog.findIndex(
            (e) => e.date === targetEntry.date && e.remark === targetEntry.remark
        );
        if (originalIdx === -1) return;

        const updatedLog = [...remarkLog];
        updatedLog.splice(originalIdx, 1);

        if (onUpdate) {
            onUpdate(updatedLog);
        }
        setDeleteConfirmIdx(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            handleAddSubmit();
        }
        if (e.key === 'Escape') {
            setShowAddRow(false);
            setNewReason('');
            setNewNote('');
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col mb-6 min-h-[400px] max-h-[600px]">
            {/* Header */}
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-white shrink-0 rounded-t-xl">
                <div className="flex items-center gap-2">
                    <Activity size={16} className="text-slate-400" />
                    <h3 className="text-[13px] font-semibold text-slate-800">Activity Log</h3>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                        {remarkLog.length}
                    </span>
                </div>
                {isEditable && onUpdate && !showAddRow && (
                    <button
                        onClick={() => setShowAddRow(true)}
                        className="text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 px-2.5 py-1.5 rounded-md transition-colors flex items-center gap-1"
                    >
                        <Plus size={12} /> Add
                    </button>
                )}
            </div>

            <div className="flex-1 flex flex-col min-h-0 bg-white rounded-b-xl overflow-hidden">
                {/* Entry Form */}
                {isEditable && showAddRow && (
                    <div className="bg-slate-50 border-b border-slate-200 p-4 shrink-0">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-[13px] font-semibold text-slate-700">New Activity Record</h4>
                            <button
                                onClick={() => setShowAddRow(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Quick Templates */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {QUICK_ACTIONS.map(action => (
                                <button
                                    key={action.label}
                                    onClick={() => {
                                        setNewReason(prev => (prev ? prev + '\n' : '') + action.text);
                                        if (action.status) setNewNote(action.status);
                                    }}
                                    className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors"
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <div>
                                <label className="block text-[11px] font-medium text-slate-600 mb-1">Date</label>
                                <input
                                    type="date"
                                    value={newDate}
                                    onChange={(e) => setNewDate(e.target.value)}
                                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md text-[13px] focus:border-slate-400 focus:ring-0 outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-slate-600 mb-1">Status / Tag</label>
                                <input
                                    type="text"
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md text-[13px] focus:border-slate-400 focus:ring-0 outline-none transition-colors"
                                    placeholder="e.g. Completed, Pending"
                                />
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="block text-[11px] font-medium text-slate-600 mb-1">Details</label>
                            <textarea
                                ref={reasonInputRef}
                                value={newReason}
                                onChange={(e) => setNewReason(e.target.value)}
                                onKeyDown={handleKeyDown}
                                rows={2}
                                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md text-[13px] focus:border-slate-400 focus:ring-0 outline-none resize-none transition-colors"
                                placeholder="Enter activity details..."
                            />
                        </div>

                        <div className="flex justify-end pt-1">
                            <button
                                onClick={handleAddSubmit}
                                disabled={!newDate || !newReason.trim()}
                                className="px-4 py-1.5 rounded-md bg-slate-800 text-white text-[13px] font-medium hover:bg-slate-900 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                            >
                                <Check size={14} /> Save Record
                            </button>
                        </div>
                    </div>
                )}

                {/* List */}
                <div className="flex-1 overflow-y-auto w-full flex flex-col">
                    {sortedRemarks.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                            <Activity size={32} className="mb-3 opacity-20" />
                            <span className="text-sm font-medium">No activities recorded</span>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 flex-1 h-full w-full">
                            {sortedRemarks.map((entry, idx) => {
                                const isConfirmingDelete = deleteConfirmIdx === idx;
                                return (
                                    <div key={`${entry.date}-${idx}`} className="flex flex-col sm:flex-row gap-2 sm:gap-4 py-4 px-5 hover:bg-slate-50 transition-colors group relative w-full items-start">
                                        <div className="w-full sm:w-32 shrink-0">
                                            <div className="text-sm font-medium text-slate-900">
                                                {formatDisplayDate(entry.date)}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0 pr-0 sm:pr-8 overflow-hidden break-words">
                                            <div className="text-sm text-slate-700 whitespace-pre-wrap">
                                                {entry.remark}
                                            </div>
                                        </div>
                                        <div className="shrink-0 mt-2 sm:mt-0 flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto relative">
                                            {entry.note && (
                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md ${entry.note.toLowerCase().includes('complete') || entry.note.toLowerCase().includes('done')
                                                    ? 'bg-green-100 text-green-700'
                                                    : entry.note.toLowerCase().includes('progress') || entry.note.toLowerCase().includes('pending')
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : 'bg-slate-100 text-slate-700'
                                                    }`}>
                                                    {entry.note}
                                                </span>
                                            )}
                                            {isEditable && (
                                                <div className="sm:opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                                                    {isConfirmingDelete ? (
                                                        <div className="flex items-center gap-1 bg-white shadow-sm border border-red-100 rounded-md p-1 right-0 sm:absolute z-10 top-0">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDelete(idx); }}
                                                                className="p-1 rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
                                                            >
                                                                <Check size={14} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setDeleteConfirmIdx(null); }}
                                                                className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setDeleteConfirmIdx(idx); }}
                                                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors right-0 sm:absolute top-0 transform sm:-translate-y-1/2"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActivityLogWidget;

