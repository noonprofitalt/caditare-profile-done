import React, { useState, useEffect, useMemo, useCallback } from 'react';
// @ts-ignore
import * as reactWindowModule from 'react-window';
const _rw: any = reactWindowModule;
const List = _rw.FixedSizeList || _rw.default?.FixedSizeList;
import { useCandidates } from '../context/CandidateContext';
import { Candidate, ProfileCompletionStatus, WorkflowStage } from '../types';
import { Download, Users, X, ArrowRight, Loader2 } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import FilterBar from './FilterBar';
import Skeleton from './ui/Skeleton';
import { convertToCSV } from '../services/csvExportService';
import { useDebounce } from '../hooks/useDebounce';
import { CandidateService } from '../services/candidateService';
import { supabase } from '../services/supabase';

const PAGE_SIZE = 50;

const CandidateList: React.FC = () => {
  const { candidates: contextCandidates } = useCandidates(); // Keeps the top-level stats alive

  const [paginatedCandidates, setPaginatedCandidates] = useState<Candidate[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const hasMoreItems = paginatedCandidates.length < totalCount;

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [activeStatus, setActiveStatus] = useState<ProfileCompletionStatus | 'ALL'>('ALL');
  const [activeStage, setActiveStage] = useState<WorkflowStage | 'ALL'>('ALL');
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [isIntegrityScanActive, setIsIntegrityScanActive] = useState(false);
  const [listHeight, setListHeight] = useState(600);
  const [isScanning, setIsScanning] = useState(false);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Initialize filters from URL
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) {
      const status = statusParam.toUpperCase() as ProfileCompletionStatus;
      if (Object.values(ProfileCompletionStatus).includes(status)) {
        setActiveStatus(status);
      }
    }

    const stageParam = searchParams.get('stage');
    if (stageParam) {
      const stage = stageParam.toUpperCase() as WorkflowStage;
      if (Object.values(WorkflowStage).includes(stage)) {
        setActiveStage(stage);
      }
    }
  }, [searchParams]);

  // Load Initial Data or Filter Change
  const loadData = useCallback(async (pageNum: number, isRefresh: boolean = false) => {
    if (isRefresh) setIsLoading(true);
    else setIsFetchingMore(true);

    try {
      const { candidates: newBatch, count } = await CandidateService.searchCandidates(
        PAGE_SIZE,
        pageNum * PAGE_SIZE,
        {
          status: activeStatus,
          stage: activeStage,
          query: debouncedSearchQuery
        }
      );

      setPaginatedCandidates(prev => isRefresh ? newBatch : [...prev, ...newBatch]);
      setTotalCount(count);
    } catch (err) {
      console.error("Failed to load candidates page", err);
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  }, [activeStatus, activeStage, debouncedSearchQuery]);

  useEffect(() => {
    setPage(0);
    loadData(0, true);
  }, [loadData]);

  useEffect(() => {
    // Connect to realtime for updates directly visible in the local paginated list
    const channel = supabase.channel('public:candidates_list')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'candidates' },
        (payload) => {
          // On any change, softly reload the current page data so we get accurate numbers and latest items
          // We'll just reset and reload the first page for simplicity on any structural change 
          // if this is too aggressive we could handle INSERT/UPDATE granularly
          setPage(0);
          loadData(0, true);
        }
      )
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [loadData]);


  const loadMoreItems = () => {
    if (isFetchingMore || isLoading || paginatedCandidates.length >= totalCount) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadData(nextPage, false);
  };

  // Handle resize for virtual list
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      // On mobile, we need more space at the bottom for the fixed nav bar
      setListHeight(window.innerHeight - (isMobile ? 360 : 300));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Use the context array just for the stats counter on the header
  const candidateCounts = useMemo(() => ({
    all: contextCandidates.length,
    quick: contextCandidates.filter(c => c.profileCompletionStatus === ProfileCompletionStatus.QUICK).length,
    partial: contextCandidates.filter(c => c.profileCompletionStatus === ProfileCompletionStatus.PARTIAL).length,
    complete: contextCandidates.filter(c => c.profileCompletionStatus === ProfileCompletionStatus.COMPLETE).length
  }), [contextCandidates]);

  const handleStatusChange = (status: ProfileCompletionStatus | 'ALL') => {
    setActiveStatus(status);
    updateURL(status, activeStage);
  };

  const handleStageChange = (stage: WorkflowStage | 'ALL') => {
    setActiveStage(stage);
    updateURL(activeStatus, stage);
  };

  const updateURL = (status: ProfileCompletionStatus | 'ALL', stage: WorkflowStage | 'ALL') => {
    const params = new URLSearchParams();
    if (status !== 'ALL') params.set('status', status.toLowerCase());
    if (stage !== 'ALL') params.set('stage', stage.toLowerCase());
    navigate(`?${params.toString()}`, { replace: true });
  };

  const handleClearFilters = () => {
    setActiveStatus('ALL');
    setActiveStage('ALL');
    setSearchQuery('');
    navigate('', { replace: true });
  };

  const hasActiveFilters = activeStatus !== 'ALL' || activeStage !== 'ALL' || searchQuery !== '';

  const handleSelectCandidate = (id: string) => {
    setSelectedCandidateIds(prev =>
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedCandidateIds.length === paginatedCandidates.length) {
      setSelectedCandidateIds([]);
    } else {
      setSelectedCandidateIds(paginatedCandidates.map(c => c.id));
    }
  };

  const handleBulkExport = (format: 'json' | 'csv' = 'csv') => {
    const selectedCandidates = contextCandidates.filter(c => selectedCandidateIds.includes(c.id));
    let dataBlob: Blob;
    let extension: string;

    if (format === 'csv') {
      const csvStr = convertToCSV(selectedCandidates);
      dataBlob = new Blob([csvStr], { type: 'text/csv' });
      extension = 'csv';
    } else {
      const dataStr = JSON.stringify(selectedCandidates, null, 2);
      dataBlob = new Blob([dataStr], { type: 'application/json' });
      extension = 'json';
    }

    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `candidates-bulk-${new Date().toISOString().split('T')[0]}.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleIntegrityScan = () => {
    setIsIntegrityScanActive(!isIntegrityScanActive);
  };

  // Virtualized Row Component - Responsive Card
  const CandidateRow = ({ index, style, candidates, selectedIds, onSelect }: any) => {
    const candidate = candidates[index];
    const isSelected = selectedIds.includes(candidate.id);

    return (
      <div style={style} className="px-4 md:px-6">
        <div className={`glass-card-interactive mb-3 p-4 flex flex-col md:flex-row md:items-center gap-4 ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50/50' : ''
          }`}>
          {/* Mobile Header: Checkbox + Avatar + Basic Info */}
          <div className="flex items-center gap-3 md:w-1/3 min-w-0">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(candidate.id)}
              className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 transition-premium cursor-pointer"
            />
            <div className="relative flex-shrink-0">
              <img
                src={candidate.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.name)}`}
                className="w-12 h-12 rounded-xl border border-slate-200 shadow-sm"
                alt=""
              />
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${candidate.profileCompletionStatus === ProfileCompletionStatus.COMPLETE ? 'bg-emerald-500' : 'bg-amber-500'
                }`} />
            </div>
            <div className="truncate flex-1">
              <Link to={`/candidates/${candidate.id}`} className="font-black text-slate-900 hover:text-blue-600 truncate block text-sm uppercase tracking-tight">
                {candidate.name}
              </Link>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] bg-slate-100 text-slate-600 font-black px-1.5 py-0.5 rounded uppercase tracking-widest">
                  {candidate.nic || 'NO NIC'}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase truncate">
                  {candidate.role || 'Personnel'}
                </span>
              </div>
            </div>
          </div>

          {/* Desktop/Mobile Detail Wrapper */}
          <div className="flex items-center justify-between md:contents">
            <div className="md:w-1/4 text-xs font-bold text-slate-500 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 md:hidden" />
              {candidate.phone || 'No Contact'}
            </div>

            <div className="md:w-1/4">
              <span className={`badge ${candidate.stage === WorkflowStage.DEPARTED ? 'badge-green' :
                candidate.stage === WorkflowStage.VISA_RECEIVED ? 'badge-blue' :
                  'badge-amber'
                }`}>
                {candidate.stage}
              </span>
            </div>

            <div className="flex justify-end md:flex-1">
              <Link
                to={`/candidates/${candidate.id}`}
                className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-blue-600 hover:text-white rounded-xl text-slate-400 transition-premium shadow-sm"
              >
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-16 z-30 px-4 md:px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter uppercase">Candidates</h1>
            <div className="flex items-center gap-2 text-[10px] md:text-xs text-slate-500 mt-1 font-bold uppercase tracking-widest">
              <Users size={12} className="text-blue-500" />
              <span>{totalCount} Total Candidates</span>
            </div>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <button
              onClick={toggleIntegrityScan}
              className={`flex items-center gap-2 px-3 py-2 border rounded-xl transition-premium text-[10px] font-black uppercase tracking-tight shrink-0 ${isIntegrityScanActive
                ? 'bg-red-50 border-red-200 text-red-600 shadow-lg shadow-red-100'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${isIntegrityScanActive ? 'bg-red-500 animate-ping' : 'bg-slate-300'}`} />
              {isIntegrityScanActive ? 'Checking...' : 'Data Check'}
            </button>
            <div className="hidden md:block h-6 w-px bg-slate-200 mx-1" />
            <Link
              to="/candidates/quick-add"
              className="hidden md:block px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-premium text-[10px] font-black uppercase tracking-widest"
            >
              Quick Create
            </Link>
            <Link
              to="/applications/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-premium text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-200"
            >
              Full Form
            </Link>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        activeStatus={activeStatus}
        onStatusChange={handleStatusChange}
        activeStage={activeStage}
        onStageChange={handleStageChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        candidateCounts={candidateCounts}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Bulk Actions Bar */}
      {selectedCandidateIds.length > 0 && (
        <div className="fixed bottom-[88px] md:bottom-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 z-50 transition-premium scale-in">
          <div className="bg-slate-900/95 backdrop-blur-xl text-white border border-slate-800 shadow-2xl rounded-2xl px-4 py-3 flex items-center justify-between md:justify-start md:gap-4 max-w-lg mx-auto md:max-w-none">
            <div className="flex items-center gap-2 pr-4 md:border-r border-slate-800">
              <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-lg shadow-blue-500/20 animate-pulse">
                {selectedCandidateIds.length}
              </span>
              <span className="hidden md:inline text-xs font-black uppercase tracking-widest text-slate-400">Candidates Selected</span>
            </div>
            <button
              onClick={() => handleBulkExport('csv')}
              className="flex items-center gap-2 px-4 py-2 bg-white text-slate-900 rounded-xl hover:bg-slate-100 transition-premium text-xs font-black uppercase tracking-tight shadow-xl"
            >
              <Download size={14} />
              <span className="hidden md:inline">Export CSV</span>
              <span className="md:hidden">Export</span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
              <button
                onClick={handleSelectAll}
                className="text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-tighter transition-premium"
              >
                {selectedCandidateIds.length === paginatedCandidates.length ? 'Reset' : 'Select All'}
              </button>
              <button onClick={() => setSelectedCandidateIds([])} className="p-1 hover:bg-white/10 rounded-lg text-slate-500 hover:text-red-400 transition-premium">
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="px-6 py-4">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <Users size={12} />
            <span>Showing {paginatedCandidates.length} of {totalCount} Candidates</span>
          </div>
        </div>

        {/* Loading State */}
        {(isLoading || isScanning) && (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-96" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && paginatedCandidates.length === 0 && (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center">
            <Users size={48} className="mx-auto text-slate-200 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {hasActiveFilters ? 'No matches in registry' : 'Registry Empty'}
            </h3>
            <p className="text-slate-500 mb-6 max-w-xs mx-auto text-sm">
              {hasActiveFilters
                ? 'Adjust your high-precision filters to locate personnel.'
                : 'Initialize the workforce by enrolling new personnel.'}
            </p>
            <button onClick={handleClearFilters} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold">
              Reset Filters
            </button>
          </div>
        )}

        {/* Virtualized Registry */}
        {!isLoading && paginatedCandidates.length > 0 && (
          <div className="glass-card overflow-hidden bg-white/50" style={{ height: listHeight }}>
            <div className="hidden md:flex items-center px-6 py-3 border-b border-slate-200 bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400 sticky top-0 z-10 backdrop-blur-sm">
              <div className="w-1/3">Candidate</div>
              <div className="w-1/4">Contact</div>
              <div className="w-1/4">Status</div>
              <div className="flex-1 text-right italic normal-case font-bold text-slate-300">Synced</div>
            </div>

            <List
              style={{ height: listHeight - 40, width: '100%' }}
              rowCount={paginatedCandidates.length + (hasMoreItems ? 1 : 0)}
              rowHeight={window.innerWidth < 768 ? 160 : 72}
              onItemsRendered={({ visibleStopIndex }: { visibleStopIndex: number }) => {
                if (visibleStopIndex >= paginatedCandidates.length - 5) {
                  loadMoreItems();
                }
              }}
              rowComponent={CandidateRow}
              rowProps={{
                candidates: paginatedCandidates,
                selectedIds: selectedCandidateIds,
                onSelect: handleSelectCandidate
              }}
              className="custom-scrollbar"
            />
          </div>
        )}
        {/* Mobile FAB */}
        <div className="lg:hidden fixed bottom-24 right-6 z-40">
          <Link
            to="/candidates/quick-add"
            className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-slate-900/40 border border-slate-800 transition-premium active:scale-90 hover:rotate-12 animate-float"
          >
            <Users size={24} />
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white">+</div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CandidateList;
