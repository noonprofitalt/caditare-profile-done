import React, { useState, useEffect } from 'react';
import { CandidateService } from '../services/candidateService';
import { Candidate, ProfileCompletionStatus, WorkflowStage } from '../types';
import { Plus, Download, Users, X, FileJson, FileSpreadsheet, Send, CheckSquare } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import CandidateCard from './CandidateCard';
import FilterBar from './FilterBar';
import Skeleton from './ui/Skeleton';
import { convertToCSV } from '../services/csvExportService';

const CandidateList: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState<ProfileCompletionStatus | 'ALL'>('ALL');
  const [activeStage, setActiveStage] = useState<WorkflowStage | 'ALL'>('ALL');
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Load candidates
  useEffect(() => {
    setIsLoading(true);
    const allCandidates = CandidateService.getCandidates();
    setCandidates(allCandidates);
    setIsLoading(false);
  }, []);

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

  // Filter candidates
  const filteredCandidates = candidates.filter(candidate => {
    // Profile status filter
    if (activeStatus !== 'ALL' && candidate.profileCompletionStatus !== activeStatus) {
      return false;
    }

    // Stage filter
    if (activeStage !== 'ALL' && candidate.stage !== activeStage) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        candidate.name.toLowerCase().includes(query) ||
        candidate.phone?.includes(query) ||
        candidate.nic?.toLowerCase().includes(query) ||
        candidate.email?.toLowerCase().includes(query) ||
        candidate.role?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Calculate counts
  const candidateCounts = {
    all: candidates.length,
    quick: candidates.filter(c => c.profileCompletionStatus === ProfileCompletionStatus.QUICK).length,
    partial: candidates.filter(c => c.profileCompletionStatus === ProfileCompletionStatus.PARTIAL).length,
    complete: candidates.filter(c => c.profileCompletionStatus === ProfileCompletionStatus.COMPLETE).length
  };

  // Handle status change
  const handleStatusChange = (status: ProfileCompletionStatus | 'ALL') => {
    setActiveStatus(status);
    updateURL(status, activeStage);
  };

  // Handle stage change
  const handleStageChange = (stage: WorkflowStage | 'ALL') => {
    setActiveStage(stage);
    updateURL(activeStatus, stage);
  };

  // Update URL params
  const updateURL = (status: ProfileCompletionStatus | 'ALL', stage: WorkflowStage | 'ALL') => {
    const params = new URLSearchParams();
    if (status !== 'ALL') {
      params.set('status', status.toLowerCase());
    }
    if (stage !== 'ALL') {
      params.set('stage', stage.toLowerCase());
    }
    navigate(`?${params.toString()}`, { replace: true });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setActiveStatus('ALL');
    setActiveStage('ALL');
    setSearchQuery('');
    navigate('', { replace: true });
  };

  // Check if filters are active
  const hasActiveFilters = activeStatus !== 'ALL' || activeStage !== 'ALL' || searchQuery !== '';

  // Handle candidate selection
  const handleSelectCandidate = (id: string) => {
    setSelectedCandidateIds(prev =>
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedCandidateIds.length === filteredCandidates.length) {
      setSelectedCandidateIds([]);
    } else {
      setSelectedCandidateIds(filteredCandidates.map(c => c.id));
    }
  };

  const [isIntegrityScanActive, setIsIntegrityScanActive] = useState(false);

  // Handle bulk export
  const handleBulkExport = (format: 'json' | 'csv' = 'csv') => {
    const selectedCandidates = candidates.filter(c => selectedCandidateIds.includes(c.id));

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
    link.download = `candidates-report-bulk-${new Date().toISOString().split('T')[0]}.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleIntegrityScan = () => {
    setIsLoading(true);
    // Simulate scan delay
    setTimeout(() => {
      setIsIntegrityScanActive(!isIntegrityScanActive);
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Candidates</h1>
              <p className="text-sm text-slate-600 mt-1">
                Manage and track candidate applications
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleIntegrityScan}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-all font-medium ${isIntegrityScanActive
                  ? 'bg-red-50 border-red-200 text-red-600 shadow-inner'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
              >
                <div className={`w-2 h-2 rounded-full ${isIntegrityScanActive ? 'bg-red-500 animate-ping' : 'bg-slate-300'}`} />
                {isIntegrityScanActive ? 'Stop Integrity Scan' : 'System Integrity Scan'}
              </button>
              <Link
                to="/candidates/quick-add"
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
              >
                <Plus size={20} />
                Quick Add
              </Link>
              <Link
                to="/applications/new"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus size={20} />
                Full Application
              </Link>
            </div>
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

      {/* Bulk Actions Bar - Minimalist Staff-Friendly Design */}
      {selectedCandidateIds.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5">
          <div className="bg-white border border-slate-200 shadow-[0_10px_40px_rgba(0,0,0,0.1)] rounded-full px-5 py-3 flex items-center gap-5">
            {/* Selection Count */}
            <div className="flex items-center gap-3 pr-5 border-r border-slate-100">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                {selectedCandidateIds.length}
              </div>
              <span className="text-sm font-semibold text-slate-700">
                {selectedCandidateIds.length === 1 ? 'Candidate' : 'Candidates'} Selected
              </span>
            </div>

            {/* Practical Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkExport('csv')}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all text-sm font-bold shadow-lg shadow-blue-600/20 active:scale-95"
              >
                <Download size={18} />
                Download Bulk CSV Report
              </button>
            </div>

            {/* Simple Controls */}
            <div className="flex items-center gap-3 pl-5 border-l border-slate-100">
              <button
                onClick={handleSelectAll}
                className="text-xs font-bold text-slate-500 hover:text-blue-600 uppercase tracking-widest transition-colors"
              >
                {selectedCandidateIds.length === filteredCandidates.length ? 'Clear All' : 'Select All'}
              </button>

              <button
                onClick={() => setSelectedCandidateIds([])}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                title="Cancel"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="px-6 py-6">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Users size={16} />
            <span className="font-medium">
              {filteredCandidates.length} {filteredCandidates.length === 1 ? 'candidate' : 'candidates'}
            </span>
            {hasActiveFilters && (
              <span className="text-slate-500">
                (filtered from {candidates.length} total)
              </span>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <Skeleton className="w-14 h-14 rounded-full" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-96" />
                    <Skeleton className="h-10 w-32" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredCandidates.length === 0 && (
          <div className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-12 text-center">
            <Users size={48} className="mx-auto text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {hasActiveFilters ? 'No candidates match your filters' : 'No candidates yet'}
            </h3>
            <p className="text-slate-600 mb-6">
              {hasActiveFilters
                ? 'Try adjusting your filters or search query'
                : 'Get started by adding your first candidate'}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={handleClearFilters}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Clear Filters
              </button>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <Link
                  to="/candidates/quick-add"
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                >
                  Quick Add
                </Link>
                <Link
                  to="/applications/new"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Full Application
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Candidate Cards */}
        {!isLoading && filteredCandidates.length > 0 && (
          <div className="space-y-3">
            {filteredCandidates.map(candidate => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                onSelect={handleSelectCandidate}
                isSelected={selectedCandidateIds.includes(candidate.id)}
                showAudit={isIntegrityScanActive}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateList;
