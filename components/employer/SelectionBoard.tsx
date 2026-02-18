import React, { useState, useMemo } from 'react';
import { CandidateSelection, SelectionStage, DemandOrder } from '../../types';
import { SelectionService } from '../../services/selectionService';
import { DemandOrderService } from '../../services/demandOrderService';
import {
    Users, UserCheck, Video, Phone, Eye, CheckCircle2,
    FileText, ThumbsUp, XCircle, ChevronLeft, Plus,
    GripVertical, Clock, Star, ArrowRight, MessageSquare,
    Send, X
} from 'lucide-react';

interface SelectionBoardProps {
    demandOrder: DemandOrder;
    onBack: () => void;
    onMatchCandidates: () => void;
    onRefresh: () => void;
}

const STAGE_COLUMNS: { stage: SelectionStage; label: string; icon: React.ReactNode; color: string; bgColor: string }[] = [
    { stage: SelectionStage.MATCHED, label: 'Matched', icon: <Users size={14} />, color: 'text-slate-600', bgColor: 'bg-slate-100' },
    { stage: SelectionStage.CV_SUBMITTED, label: 'CV Sent', icon: <Send size={14} />, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { stage: SelectionStage.SHORTLISTED, label: 'Shortlisted', icon: <Star size={14} />, color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { stage: SelectionStage.INTERVIEW_SCHEDULED, label: 'Interview', icon: <Video size={14} />, color: 'text-amber-600', bgColor: 'bg-amber-50' },
    { stage: SelectionStage.INTERVIEWED, label: 'Interviewed', icon: <Eye size={14} />, color: 'text-orange-600', bgColor: 'bg-orange-50' },
    { stage: SelectionStage.SELECTED, label: 'Selected', icon: <UserCheck size={14} />, color: 'text-green-600', bgColor: 'bg-green-50' },
    { stage: SelectionStage.OFFER_ISSUED, label: 'Offer Issued', icon: <FileText size={14} />, color: 'text-teal-600', bgColor: 'bg-teal-50' },
    { stage: SelectionStage.OFFER_ACCEPTED, label: 'Accepted', icon: <ThumbsUp size={14} />, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
];

const SelectionBoard: React.FC<SelectionBoardProps> = ({
    demandOrder,
    onBack,
    onMatchCandidates,
    onRefresh,
}) => {
    const [selections, setSelections] = useState<CandidateSelection[]>(
        SelectionService.getByDemandOrderId(demandOrder.id)
    );
    const [detailPanel, setDetailPanel] = useState<CandidateSelection | null>(null);
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [rejectModal, setRejectModal] = useState<CandidateSelection | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    const reload = () => {
        setSelections(SelectionService.getByDemandOrderId(demandOrder.id));
        onRefresh();
    };

    const activeSelections = selections.filter(s => s.stage !== SelectionStage.REJECTED);
    const rejectedSelections = selections.filter(s => s.stage === SelectionStage.REJECTED);

    const handleDragStart = (e: React.DragEvent, selectionId: string) => {
        setDraggedId(selectionId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, targetStage: SelectionStage) => {
        e.preventDefault();
        if (!draggedId) return;

        const selection = selections.find(s => s.id === draggedId);
        if (!selection || selection.stage === targetStage) {
            setDraggedId(null);
            return;
        }

        // Advance stage
        SelectionService.advanceStage(draggedId, targetStage);

        // If candidate reached OFFER_ACCEPTED, increment demand order filled count
        if (targetStage === SelectionStage.OFFER_ACCEPTED) {
            DemandOrderService.incrementFilled(demandOrder.id);
        }

        setDraggedId(null);
        reload();
    };

    const handleAdvance = (selection: CandidateSelection) => {
        const stageOrder = SelectionService.getStageOrder();
        const currentIndex = stageOrder.indexOf(selection.stage);
        if (currentIndex < stageOrder.length - 1) {
            const nextStage = stageOrder[currentIndex + 1];
            SelectionService.advanceStage(selection.id, nextStage);

            if (nextStage === SelectionStage.OFFER_ACCEPTED) {
                DemandOrderService.incrementFilled(demandOrder.id);
            }
            reload();
            if (detailPanel?.id === selection.id) {
                setDetailPanel(SelectionService.getById(selection.id) || null);
            }
        }
    };

    const handleReject = () => {
        if (!rejectModal) return;
        SelectionService.rejectCandidate(rejectModal.id, rejectReason);
        setRejectModal(null);
        setRejectReason('');
        if (detailPanel?.id === rejectModal.id) setDetailPanel(null);
        reload();
    };

    const fillPercent = demandOrder.positionsRequired > 0
        ? Math.round((demandOrder.positionsFilled / demandOrder.positionsRequired) * 100)
        : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        <ChevronLeft size={20} className="text-slate-500" />
                    </button>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">{demandOrder.title}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {demandOrder.location}, {demandOrder.country} • {demandOrder.salaryRange}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Fill Progress */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Filled</span>
                        <span className="text-sm font-black text-slate-800">
                            {demandOrder.positionsFilled}/{demandOrder.positionsRequired}
                        </span>
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${fillPercent >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                style={{ width: `${Math.min(fillPercent, 100)}%` }}
                            />
                        </div>
                    </div>
                    <button
                        onClick={onMatchCandidates}
                        className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
                    >
                        <Plus size={14} /> Match Candidates
                    </button>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="overflow-x-auto pb-4">
                <div className="flex gap-4" style={{ minWidth: `${STAGE_COLUMNS.length * 220}px` }}>
                    {STAGE_COLUMNS.map(col => {
                        const columnSelections = activeSelections.filter(s => s.stage === col.stage);

                        return (
                            <div
                                key={col.stage}
                                className="flex-1 min-w-[200px]"
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, col.stage)}
                            >
                                {/* Column Header */}
                                <div className={`${col.bgColor} rounded-t-2xl px-4 py-3 flex items-center justify-between border border-b-0 border-slate-200/50`}>
                                    <div className="flex items-center gap-2">
                                        <span className={col.color}>{col.icon}</span>
                                        <span className="text-xs font-bold text-slate-700">{col.label}</span>
                                    </div>
                                    <span className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-[10px] font-black text-slate-600 shadow-sm">
                                        {columnSelections.length}
                                    </span>
                                </div>

                                {/* Column Body */}
                                <div className={`bg-slate-50/50 rounded-b-2xl border border-t-0 border-slate-200/50 p-2 space-y-2 min-h-[300px] transition-colors ${draggedId ? 'ring-2 ring-blue-100 ring-inset' : ''
                                    }`}>
                                    {columnSelections.map(sel => (
                                        <div
                                            key={sel.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, sel.id)}
                                            onClick={() => setDetailPanel(sel)}
                                            className={`bg-white rounded-xl border border-slate-100 p-3 cursor-pointer transition-all hover:shadow-md hover:border-blue-200 group ${detailPanel?.id === sel.id ? 'ring-2 ring-blue-200 border-blue-300' : ''
                                                } ${draggedId === sel.id ? 'opacity-50 scale-95' : ''}`}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <GripVertical size={12} className="text-slate-300 cursor-grab" />
                                                    <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 text-[10px] font-black">
                                                        {sel.candidateName.charAt(0)}
                                                    </div>
                                                </div>
                                                {sel.matchScore && (
                                                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${sel.matchScore >= 80 ? 'bg-green-100 text-green-700' :
                                                            sel.matchScore >= 60 ? 'bg-amber-100 text-amber-700' :
                                                                'bg-red-100 text-red-700'
                                                        }`}>
                                                        {sel.matchScore}%
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs font-bold text-slate-800 leading-tight">{sel.candidateName}</p>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-[9px] text-slate-400">
                                                    {new Date(sel.updatedAt).toLocaleDateString()}
                                                </span>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleAdvance(sel); }}
                                                    className="opacity-0 group-hover:opacity-100 p-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all"
                                                    title="Advance to next stage"
                                                >
                                                    <ArrowRight size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Rejected Section */}
            {rejectedSelections.length > 0 && (
                <div className="bg-red-50/50 rounded-2xl border border-red-100 p-4">
                    <h4 className="text-xs font-bold text-red-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <XCircle size={14} /> Rejected ({rejectedSelections.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {rejectedSelections.map(sel => (
                            <div key={sel.id} className="bg-white px-3 py-2 rounded-xl border border-red-100 text-xs">
                                <span className="font-bold text-slate-700">{sel.candidateName}</span>
                                {sel.rejectionReason && (
                                    <span className="text-slate-400 ml-2">— {sel.rejectionReason}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Detail Side Panel */}
            {detailPanel && (
                <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-slate-200 z-50 overflow-y-auto animate-in slide-in-from-right duration-300">
                    <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
                        <h3 className="text-sm font-bold text-slate-800">Candidate Details</h3>
                        <button onClick={() => setDetailPanel(null)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                            <X size={18} className="text-slate-400" />
                        </button>
                    </div>
                    <div className="p-6 space-y-6">
                        {/* Candidate Header */}
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-xl font-black">
                                {detailPanel.candidateName.charAt(0)}
                            </div>
                            <div>
                                <p className="text-lg font-bold text-slate-800">{detailPanel.candidateName}</p>
                                <p className="text-xs text-slate-500">ID: {detailPanel.candidateId}</p>
                            </div>
                        </div>

                        {/* Current Stage */}
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                            <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">Current Stage</p>
                            <p className="text-sm font-bold text-blue-800 mt-1">{detailPanel.stage}</p>
                        </div>

                        {/* Match Score */}
                        {detailPanel.matchScore && (
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Match Score</p>
                                <div className="flex items-center gap-3 mt-2">
                                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${detailPanel.matchScore >= 80 ? 'bg-green-500' :
                                                    detailPanel.matchScore >= 60 ? 'bg-amber-500' :
                                                        'bg-red-500'
                                                }`}
                                            style={{ width: `${detailPanel.matchScore}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-black text-slate-800">{detailPanel.matchScore}%</span>
                                </div>
                            </div>
                        )}

                        {/* Interview Details */}
                        {detailPanel.interviewDate && (
                            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                                <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest">Interview</p>
                                <div className="mt-2 space-y-1">
                                    <p className="text-xs text-slate-700 flex items-center gap-2">
                                        <Clock size={12} /> {new Date(detailPanel.interviewDate).toLocaleDateString()}
                                    </p>
                                    {detailPanel.interviewType && (
                                        <p className="text-xs text-slate-700 flex items-center gap-2">
                                            {detailPanel.interviewType === 'Video' ? <Video size={12} /> : <Phone size={12} />}
                                            {detailPanel.interviewType}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Interview Notes */}
                        {detailPanel.interviewNotes && (
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Interview Notes</p>
                                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">{detailPanel.interviewNotes}</p>
                            </div>
                        )}

                        {/* Employer Feedback */}
                        {detailPanel.employerFeedback && (
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                    <MessageSquare size={10} /> Employer Feedback
                                </p>
                                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">{detailPanel.employerFeedback}</p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="pt-4 border-t border-slate-100 space-y-2">
                            {detailPanel.stage !== SelectionStage.OFFER_ACCEPTED && detailPanel.stage !== SelectionStage.REJECTED && (
                                <>
                                    <button
                                        onClick={() => handleAdvance(detailPanel)}
                                        className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                                    >
                                        <ArrowRight size={16} /> Advance Stage
                                    </button>
                                    <button
                                        onClick={() => setRejectModal(detailPanel)}
                                        className="w-full py-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                                    >
                                        <XCircle size={16} /> Reject Candidate
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {rejectModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                                <XCircle size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">Reject {rejectModal.candidateName}</h3>
                                <p className="text-xs text-slate-500">This removes the candidate from the selection pipeline</p>
                            </div>
                        </div>
                        <textarea
                            rows={3}
                            placeholder="Reason for rejection (optional)..."
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-100"
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                                className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-all"
                            >
                                Confirm Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SelectionBoard;
