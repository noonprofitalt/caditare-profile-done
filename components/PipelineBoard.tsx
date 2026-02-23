import React, { useState, useEffect } from 'react';
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners,
    DragStartEvent,
    DragEndEvent,
    useDroppable
} from '@dnd-kit/core';
import { useCandidates } from '../context/CandidateContext';
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CandidateService } from '../services/candidateService';
import { WorkflowStage, Candidate, StageStatus } from '../types';
import { STAGE_ORDER, WorkflowEngine } from '../services/workflowEngine';
import {
    Users,
    Search,
    Filter,
    AlertCircle
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

// --- Types ---
interface Column {
    id: WorkflowStage;
    title: string;
    candidates: Candidate[];
}

// --- Sortable Card Component ---
const PipelineCard = ({ candidate, isDragging }: { candidate: Candidate; isDragging?: boolean }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: candidate.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const sla = WorkflowEngine.calculateSLAStatus(candidate);

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`slate-card-interactive p-3 flex flex-col gap-2 ${isDragging ? 'opacity-50 grayscale scale-105 rotate-2' : ''
                }`}
        >
            <div className="flex items-center gap-3">
                <img
                    src={candidate.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.name)}`}
                    className="w-8 h-8 rounded-full border border-slate-200"
                    alt=""
                />
                <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 truncate">{candidate.name}</div>
                    <div className="text-[10px] text-slate-500 font-medium uppercase truncate">
                        {candidate.role || 'GENERAL'}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between text-[10px] mt-1 pt-2 border-t border-slate-100">
                <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${candidate.stageStatus === StageStatus.IN_PROGRESS ? 'bg-blue-50 text-blue-700' :
                    candidate.stageStatus === StageStatus.ON_HOLD ? 'bg-orange-50 text-orange-700' :
                        'bg-slate-100 text-slate-600'
                    }`}>
                    {candidate.stageStatus}
                </span>

                {sla.status === 'OVERDUE' && (
                    <div className="flex items-center gap-1 text-red-600 font-bold">
                        <AlertCircle size={10} />
                        <span>{sla.daysElapsed}d</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Column Component ---
const PipelineColumn = ({ column }: { column: Column }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: `column-${column.id}`,
        data: { type: 'column', columnId: column.id }
    });

    return (
        <div className={`flex-shrink-0 w-72 md:w-80 flex flex-col rounded-2xl border overflow-hidden shadow-sm transition-colors duration-200 ${isOver ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-200' : 'bg-slate-100/50 border-slate-200'
            }`}>
            <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${column.id === WorkflowStage.DEPARTED ? 'bg-emerald-500 animate-pulse' :
                        column.id === WorkflowStage.VISA_RECEIVED ? 'bg-green-500' :
                            'bg-blue-600'
                        }`} />
                    <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{column.title}</h3>
                </div>
                <span className="text-[10px] font-black text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
                    {column.candidates.length}
                </span>
            </div>

            <div ref={setNodeRef} className="flex-1 p-3 flex flex-col gap-3 overflow-y-auto custom-scrollbar min-h-[500px]">
                <SortableContext
                    items={column.candidates.map(c => c.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {column.candidates.map(candidate => (
                        <PipelineCard key={candidate.id} candidate={candidate} />
                    ))}
                </SortableContext>

                {column.candidates.length === 0 && (
                    <div className="h-24 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-1">
                        <Users size={16} />
                        <span className="text-[10px] uppercase font-bold tracking-widest">Entry Empty</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Main Board Component ---
const PipelineBoard: React.FC = () => {
    const { candidates, updateCandidateInState, refreshCandidates } = useCandidates();
    // Local state for optimistic UI updates if needed, but context handles it.
    // However, dnd-kit needs stable items. Context updates might be fast enough.
    // Let's use context stats directly but we might need local state for immediate feedback if context is slow?
    // Actually, updateCandidateInState updates context state immediately.

    // We can remove local candidates state if we use context directly.
    // But wait, the original code had:
    // const [candidates, setCandidates] = useState<Candidate[]>([]);

    // Let's rely on context.
    const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const toast = useToast();

    // FRICTIONLESS: Removed activationConstraint (distance: 8) so drag starts instantly without requiring initial movement.
    const sensors = useSensors(
        useSensor(PointerSensor)
    );

    // Initial load handled by context
    useEffect(() => {
        refreshCandidates();
    }, []);

    const filteredCandidates = candidates.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.nic?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const columns: Column[] = STAGE_ORDER.map(stage => ({
        id: stage,
        title: stage,
        candidates: filteredCandidates.filter(c => c.stage === stage)
    }));

    const onDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const candidate = candidates.find(c => c.id === active.id);
        if (candidate) setActiveCandidate(candidate);
    };

    const onDragEnd = async (event: DragEndEvent) => {
        setActiveCandidate(null);
        const { active, over } = event;

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // Determine the target column
        let targetColumnId: WorkflowStage | null = null;

        // Check if dropped directly on a column droppable (id = "column-STAGE_NAME")
        if (overId.startsWith('column-')) {
            targetColumnId = overId.replace('column-', '') as WorkflowStage;
        } else {
            // Check if dropped on a card — find which column that card belongs to
            const overColumn = columns.find(col => col.candidates.some(c => c.id === overId));
            if (overColumn) {
                targetColumnId = overColumn.id;
            }
        }

        if (targetColumnId) {
            const candidate = candidates.find(c => c.id === activeId);
            if (candidate && candidate.stage !== targetColumnId) {
                // Update stage in database
                try {
                    const updatedCandidate = { ...candidate, stage: targetColumnId };

                    // Optimistic update via Context
                    updateCandidateInState(updatedCandidate);

                    // API Call
                    await CandidateService.updateCandidate(updatedCandidate);
                    toast.success(`Moved to ${targetColumnId}`);
                } catch (error) {
                    console.error('Failed to update stage:', error);
                    toast.error('Failed to move candidate. Reverting...');
                    refreshCandidates(); // Revert on failure
                }
            }
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50">
            {/* Search & Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-slate-200 gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <h1 className="slate-header text-lg md:text-xl">Visual Pipeline</h1>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">
                            <Users size={12} className="text-blue-600" />
                            <span>Batch: {candidates.length} Operations</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative group flex-1 md:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={14} />
                        <input
                            type="text"
                            placeholder="Locate Identity..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all md:w-64 uppercase tracking-tighter"
                        />
                    </div>
                    <button className="slate-card flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-50 transition-premium active:scale-95 shadow-sm">
                        <Filter size={14} />
                        <span className="hidden md:block text-[10px] font-black uppercase tracking-widest">Filters</span>
                    </button>
                </div>
            </div>

            {/* Board Container */}
            <div className="flex-1 overflow-x-auto p-4 md:p-8 custom-scrollbar">
                <div className="flex h-full gap-6 min-w-max">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCorners}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                    >
                        {columns.map(column => (
                            <PipelineColumn key={column.id} column={column} />
                        ))}

                        <DragOverlay>
                            {activeCandidate ? (
                                <div className="w-72">
                                    <PipelineCard candidate={activeCandidate} isDragging />
                                </div>
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                </div>
            </div>
        </div>
    );
};

export default PipelineBoard;
