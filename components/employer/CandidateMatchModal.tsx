import React, { useState, useMemo } from 'react';
import { DemandOrder, CandidateSelection, SelectionStage, Candidate } from '../../types';
import { CandidateService } from '../../services/candidateService';
import { SelectionService } from '../../services/selectionService';
import { X, Search, UserPlus, Check, Users, Star, MapPin, Briefcase } from 'lucide-react';

interface CandidateMatchModalProps {
    demandOrder: DemandOrder;
    onClose: () => void;
    onMatched: () => void;
}

const CandidateMatchModal: React.FC<CandidateMatchModalProps> = ({
    demandOrder,
    onClose,
    onMatched,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);

    // Candidates are loaded via useEffect below

    const [candidates, setCandidates] = useState<Candidate[]>([]);

    // Load candidates on mount
    React.useEffect(() => {
        const load = async () => {
            try {
                const data = await CandidateService.getCandidates();
                setCandidates(data || []);
            } catch {
                setCandidates([]);
            }
        };
        load();
    }, []);

    const existingSelections = useMemo(
        () => SelectionService.getByDemandOrderId(demandOrder.id),
        [demandOrder.id]
    );
    const alreadyMatchedIds = new Set(existingSelections.map(s => s.candidateId));

    // Calculate match score based on requirement overlap
    const calculateMatchScore = (candidate: Candidate): number => {
        if (!demandOrder.requirements.length) return 50;

        const candidateSkills = [
            ...(candidate.skills || []),
            ...(candidate.preferredCountries || []),
            String(candidate.education || ''),
        ].map(s => String(s).toLowerCase());

        const matches = demandOrder.requirements.filter(req =>
            candidateSkills.some(skill => skill.includes(req.toLowerCase()) || req.toLowerCase().includes(skill))
        );

        return Math.round((matches.length / demandOrder.requirements.length) * 100);
    };

    // Filter and score candidates
    const scoredCandidates = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return candidates
            .filter(c => !alreadyMatchedIds.has(c.id))
            .filter(c => {
                if (!query) return true;
                return (
                    c.name.toLowerCase().includes(query) ||
                    (c.nationality || '').toLowerCase().includes(query) ||
                    (c.skills || []).some(s => s.toLowerCase().includes(query)) ||
                    (c.preferredCountries || []).some(pc => pc.toLowerCase().includes(query))
                );
            })
            .map(c => ({
                candidate: c,
                matchScore: calculateMatchScore(c),
            }))
            .sort((a, b) => b.matchScore - a.matchScore);
    }, [candidates, searchQuery, alreadyMatchedIds]);

    const toggleSelect = (candidateId: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(candidateId)) next.delete(candidateId);
            else next.add(candidateId);
            return next;
        });
    };

    const selectAll = () => {
        const allIds = scoredCandidates.map(sc => sc.candidate.id);
        setSelectedIds(new Set(allIds));
    };

    const handleMatch = () => {
        setIsLoading(true);
        const now = new Date().toISOString();

        const newSelections: CandidateSelection[] = Array.from(selectedIds).map(candidateId => {
            const scored = scoredCandidates.find(sc => sc.candidate.id === candidateId);
            return {
                id: `sel-${Date.now()}-${candidateId}`,
                demandOrderId: demandOrder.id,
                candidateId,
                candidateName: scored?.candidate.name || 'Unknown',
                stage: SelectionStage.MATCHED,
                matchScore: scored?.matchScore || 50,
                createdAt: now,
                updatedAt: now,
            };
        });

        SelectionService.addBatch(newSelections);
        setIsLoading(false);
        onMatched();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-100 px-8 py-5 rounded-t-3xl flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                            <UserPlus size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Match Candidates</h3>
                            <p className="text-xs text-slate-500">
                                Select candidates to match with: <span className="font-bold text-slate-700">{demandOrder.title}</span>
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Search + Filters */}
                <div className="px-8 py-4 border-b border-slate-100 flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by name, nationality, skills..."
                            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={selectAll}
                        className="px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                        Select All
                    </button>
                    <div className="text-xs text-slate-500">
                        <span className="font-bold text-blue-600">{selectedIds.size}</span> selected
                    </div>
                </div>

                {/* Requirements Reminder */}
                {demandOrder.requirements.length > 0 && (
                    <div className="px-8 py-3 bg-blue-50/50 border-b border-blue-100">
                        <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest mb-1">Required Skills</p>
                        <div className="flex flex-wrap gap-1.5">
                            {demandOrder.requirements.map((r, i) => (
                                <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold">{r}</span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Candidate List */}
                <div className="flex-1 overflow-y-auto px-8 py-4">
                    {scoredCandidates.length === 0 ? (
                        <div className="text-center py-16">
                            <Users size={40} className="mx-auto text-slate-300 mb-3" />
                            <p className="text-sm font-bold text-slate-400">No unmatched candidates found</p>
                            <p className="text-xs text-slate-400 mt-1">All candidates are already matched to this demand order</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {scoredCandidates.map(({ candidate, matchScore }) => {
                                const isSelected = selectedIds.has(candidate.id);
                                return (
                                    <div
                                        key={candidate.id}
                                        onClick={() => toggleSelect(candidate.id)}
                                        className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${isSelected
                                            ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-100'
                                            : 'bg-white border-slate-100 hover:border-blue-200 hover:bg-blue-50/20'
                                            }`}
                                    >
                                        {/* Checkbox */}
                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                                            }`}>
                                            {isSelected && <Check size={14} className="text-white" />}
                                        </div>

                                        {/* Avatar */}
                                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 font-bold text-sm flex-shrink-0">
                                            {candidate.name.charAt(0)}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-800 truncate">{candidate.name}</p>
                                            <div className="flex items-center gap-3 mt-0.5">
                                                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                                    <MapPin size={9} /> {candidate.nationality || 'Unknown'}
                                                </span>
                                                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                                    <Briefcase size={9} /> {candidate.stage}
                                                </span>
                                            </div>
                                            {candidate.skills && candidate.skills.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1.5">
                                                    {candidate.skills.slice(0, 3).map((s, i) => (
                                                        <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold">{s}</span>
                                                    ))}
                                                    {candidate.skills.length > 3 && (
                                                        <span className="text-[9px] text-slate-400">+{candidate.skills.length - 3} more</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Match Score */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <div className="text-right">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase">Match</p>
                                                <p className={`text-lg font-black ${matchScore >= 80 ? 'text-green-600' :
                                                    matchScore >= 60 ? 'text-amber-600' :
                                                        matchScore >= 40 ? 'text-orange-500' :
                                                            'text-red-500'
                                                    }`}>{matchScore}%</p>
                                            </div>
                                            <Star
                                                size={16}
                                                className={matchScore >= 80 ? 'text-green-400 fill-green-400' : 'text-slate-300'}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-slate-100 px-8 py-4 rounded-b-3xl flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                        <span className="font-bold">{scoredCandidates.length}</span> available • <span className="font-bold text-blue-600">{selectedIds.size}</span> selected
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleMatch}
                            disabled={selectedIds.size === 0 || isLoading}
                            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <UserPlus size={16} />
                            Match {selectedIds.size} Candidate{selectedIds.size !== 1 ? 's' : ''}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CandidateMatchModal;
