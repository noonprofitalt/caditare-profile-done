import React, { useState } from 'react';
import { Database, Trash2, Download, Upload, RefreshCw } from 'lucide-react';
import { Candidate } from '../types';
import { generateAllTestData } from '../scripts/generateTestData';
import { CandidateService } from '../services/candidateService';

/**
 * Developer Tools Component
 * Provides UI for managing test data
 */
const DevTools: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [status, setStatus] = useState('');

    const seedTestData = () => {
        setStatus('Generating test data...');
        const candidates = generateAllTestData();

        // Clear existing data
        localStorage.removeItem('candidates');

        // Add each candidate
        candidates.forEach(candidate => {
            CandidateService.addCandidate(candidate);
        });

        setStatus(`✅ Added ${candidates.length} test candidates! Refresh to see changes.`);
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    };

    const clearAllData = () => {
        if (confirm('⚠️ This will delete ALL candidate data. Are you sure?')) {
            localStorage.removeItem('candidates');
            setStatus('🗑️ All data cleared! Refresh to see changes.');
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        }
    };

    const exportData = () => {
        const data = localStorage.getItem('candidates');
        if (!data) {
            setStatus('❌ No data to export');
            return;
        }

        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `candidates-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        setStatus('💾 Data exported successfully!');
    };

    const importData = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = event.target?.result as string;
                    JSON.parse(data); // Validate JSON
                    localStorage.setItem('candidates', data);
                    setStatus('📥 Data imported successfully! Refreshing...');
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                } catch (error) {
                    setStatus('❌ Invalid JSON file');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    const getCandidateStats = () => {
        const candidates = CandidateService.getCandidates();
        const quick = candidates.filter((c: Candidate) => c.profileCompletionStatus === 'QUICK').length;
        const partial = candidates.filter((c: Candidate) => c.profileCompletionStatus === 'PARTIAL').length;
        const complete = candidates.filter((c: Candidate) => c.profileCompletionStatus === 'COMPLETE').length;

        return { total: candidates.length, quick, partial, complete };
    };

    const stats = getCandidateStats();

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 p-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-all z-50"
                title="Developer Tools"
            >
                <Database size={24} />
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 w-96 bg-white rounded-xl shadow-2xl border-2 border-purple-200 z-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4 rounded-t-xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Database size={20} />
                        <h3 className="font-bold">Developer Tools</h3>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="hover:bg-white/20 p-1 rounded transition-colors"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="p-4 bg-purple-50 border-b border-purple-100">
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div>
                        <div className="font-bold text-slate-700">{stats.total}</div>
                        <div className="text-slate-500">Total</div>
                    </div>
                    <div>
                        <div className="font-bold text-red-600">{stats.quick}</div>
                        <div className="text-slate-500">Quick</div>
                    </div>
                    <div>
                        <div className="font-bold text-yellow-600">{stats.partial}</div>
                        <div className="text-slate-500">Partial</div>
                    </div>
                    <div>
                        <div className="font-bold text-green-600">{stats.complete}</div>
                        <div className="text-slate-500">Complete</div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="p-4 space-y-2">
                <button
                    onClick={seedTestData}
                    className="w-full flex items-center gap-2 px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors border border-green-200 font-medium text-sm"
                >
                    <RefreshCw size={18} />
                    Seed Test Data (20 candidates)
                </button>

                <button
                    onClick={exportData}
                    className="w-full flex items-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200 font-medium text-sm"
                >
                    <Download size={18} />
                    Export Data (Backup)
                </button>

                <button
                    onClick={importData}
                    className="w-full flex items-center gap-2 px-4 py-3 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200 font-medium text-sm"
                >
                    <Upload size={18} />
                    Import Data (Restore)
                </button>

                <button
                    onClick={clearAllData}
                    className="w-full flex items-center gap-2 px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors border border-red-200 font-medium text-sm"
                >
                    <Trash2 size={18} />
                    Clear All Data
                </button>
            </div>

            {/* Status */}
            {status && (
                <div className="px-4 pb-4">
                    <div className="p-3 bg-slate-100 rounded-lg text-xs text-slate-700 border border-slate-200">
                        {status}
                    </div>
                </div>
            )}

            {/* Info */}
            <div className="px-4 pb-4 text-xs text-slate-500">
                💡 Test data includes 5 Quick, 7 Partial, and 8 Complete profiles
            </div>
        </div>
    );
};

export default DevTools;
