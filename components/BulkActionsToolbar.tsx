import React from 'react';
import { WorkflowStage } from '../types';
import {
    X, MoveRight, Building2, Download, Send,
    CheckCircle2, Users
} from 'lucide-react';

interface BulkActionsToolbarProps {
    selectedCount: number;
    onClearSelection: () => void;
    onBulkStageChange: (stage: WorkflowStage) => void;
    onBulkAssign: () => void;
    onBulkExport: () => void;
    onBulkNotify: () => void;
}

const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
    selectedCount,
    onClearSelection,
    onBulkStageChange,
    onBulkAssign,
    onBulkExport,
    onBulkNotify
}) => {
    const [showStageMenu, setShowStageMenu] = React.useState(false);

    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-8 duration-300">
            <div className="bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 px-6 py-4 flex items-center gap-6">
                {/* Selection Count */}
                <div className="flex items-center gap-3 pr-6 border-r border-slate-700">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                        {selectedCount}
                    </div>
                    <span className="text-sm font-medium">
                        {selectedCount === 1 ? 'candidate' : 'candidates'} selected
                    </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    {/* Move Stage */}
                    <div className="relative">
                        <button
                            onClick={() => setShowStageMenu(!showStageMenu)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-medium transition-all"
                        >
                            <MoveRight size={16} />
                            Move Stage
                        </button>

                        {showStageMenu && (
                            <div className="absolute bottom-full mb-2 left-0 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 py-2 min-w-[200px] max-h-[300px] overflow-y-auto">
                                <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                                    Select Stage
                                </div>
                                {Object.values(WorkflowStage).map((stage) => (
                                    <button
                                        key={stage}
                                        onClick={() => {
                                            onBulkStageChange(stage);
                                            setShowStageMenu(false);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 transition-colors"
                                    >
                                        {stage}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Assign to Employer */}
                    <button
                        onClick={onBulkAssign}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-medium transition-all"
                    >
                        <Building2 size={16} />
                        Assign
                    </button>

                    {/* Export */}
                    <button
                        onClick={onBulkExport}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-medium transition-all"
                    >
                        <Download size={16} />
                        Export
                    </button>

                    {/* Send Message */}
                    <button
                        onClick={onBulkNotify}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-medium transition-all"
                    >
                        <Send size={16} />
                        Send Message
                    </button>
                </div>

                {/* Clear Selection */}
                <button
                    onClick={onClearSelection}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors ml-2"
                    title="Clear Selection"
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    );
};

export default BulkActionsToolbar;
