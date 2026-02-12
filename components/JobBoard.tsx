import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CandidateService } from '../services/candidateService';
import { GeminiService } from '../services/geminiService';
import { PartnerService } from '../services/partnerService';
import { Job, JobStatus, Candidate, WorkflowStage, Employer } from '../types';
import { MOCK_JOBS } from '../services/mockData';
import {
  MapPin, DollarSign, Clock, Plus, Briefcase, Users, Target,
  ChevronRight, Search, Bot, RefreshCw, CheckCircle2
} from 'lucide-react';
import { STAGE_ORDER } from '../services/workflowEngine';
import Skeleton from './ui/Skeleton';

const JobBoard: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>(MOCK_JOBS);
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'details' | 'create'>('list');
  const [searchParams, setSearchParams] = useSearchParams();
  const filterEmployerId = searchParams.get('employer');

  // AI State
  const [matchScores, setMatchScores] = useState<Record<string, { score: number, reason: string }>>({});
  const [isAnalyzing, setIsAnalyzing] = useState<string | null>(null);


  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    // Simulate loading delay
    setTimeout(() => {
      setCandidates(CandidateService.getCandidates());
      setEmployers(PartnerService.getEmployers());
      setIsLoading(false);
    }, 700);
  }, []);

  const getJobFunnel = (jobId: string) => {
    const jobCandidates = candidates.filter(c => c.jobId === jobId);
    const funnel: Record<string, number> = {};
    STAGE_ORDER.forEach(stage => {
      funnel[stage] = jobCandidates.filter(c => c.stage === stage).length;
    });
    return funnel;
  };

  const handleAnalyzeMatch = async (candidate: Candidate) => {
    if (!selectedJob) return;
    setIsAnalyzing(candidate.id);
    try {
      const result = await GeminiService.getMatchScore(candidate, selectedJob);
      setMatchScores(prev => ({ ...prev, [candidate.id]: result }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(null);
    }
  };

  const handleSelectCandidate = (candidate: Candidate) => {
    if (!selectedJob) return;
    const updatedCandidate = { ...candidate, jobId: selectedJob.id };
    CandidateService.updateCandidate(updatedCandidate);
    setCandidates(CandidateService.getCandidates());

    // Update local jobs state if we had matchedCandidateIds
    const updatedJobs = jobs.map(j => {
      if (j.id === selectedJob.id) {
        return {
          ...j,
          matchedCandidateIds: [...(j.matchedCandidateIds || []), candidate.id]
        };
      }
      return j;
    });
    setJobs(updatedJobs);
    setSelectedJob(updatedJobs.find(j => j.id === selectedJob.id) || null);
  };

  const renderFunnel = (job: Job) => {
    const funnel = getJobFunnel(job.id);

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 mb-8">
        {STAGE_ORDER.map((stage) => (
          <div key={stage} className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 truncate" title={stage}>{stage}</p>
            <h4 className="text-xl font-bold text-slate-800">{funnel[stage]}</h4>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Job Board V2</h2>
          <p className="text-slate-500 mt-1">AI-powered candidate matching and specialized recruitment pipelines.</p>
        </div>
        <div className="flex gap-2">
          {selectedJob && (
            <button
              onClick={() => { setSelectedJob(null); setActiveTab('list'); }}
              className="px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50"
            >
              Back to Jobs
            </button>
          )}
          <button
            onClick={() => setActiveTab('create')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-100"
          >
            <Plus size={18} /> Post Job
          </button>
        </div>
      </div>

      {activeTab === 'list' && (
        <div className="space-y-4">
          {filterEmployerId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm text-blue-800 font-bold">
                Filtering by Partner: {employers.find(e => e.id === filterEmployerId)?.companyName || 'Unknown'}
              </span>
              <button
                onClick={() => setSearchParams({})}
                className="text-xs text-blue-600 hover:underline font-bold"
              >
                Clear Filter
              </button>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-[280px]">
                  <div className="flex justify-between mb-4">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                  <Skeleton className="h-8 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-6" />
                  <div className="space-y-3 mb-6">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex justify-between">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))
            ) : (
              jobs.filter(job => filterEmployerId ? job.employerId === filterEmployerId : true).map((job) => {
                const funnel = getJobFunnel(job.id);
                const total = Object.values(funnel).reduce((a, b) => a + b, 0);
                return (
                  <div
                    key={job.id}
                    onClick={() => { setSelectedJob(job); setActiveTab('details'); }}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:border-blue-300 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Briefcase size={24} />
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${job.status === JobStatus.OPEN ? 'bg-green-100 text-green-700' :
                        job.status === JobStatus.CLOSED ? 'bg-slate-100 text-slate-600' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                        {job.status}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-800 mb-1">{job.title}</h3>
                    <p className="text-sm text-slate-500 font-medium mb-4">
                      {job.employerId ? (
                        <Link to={`/partners/${job.employerId}`} className="hover:text-blue-600 hover:underline transition-all">
                          {job.company}
                        </Link>
                      ) : (
                        job.company
                      )}
                    </p>

                    <div className="space-y-2 mb-6 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-slate-400" /> {job.location}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-slate-400" /> {total} Matched Candidates
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                      <span>Posted {job.postedDate}</span>
                      <span className="font-bold text-blue-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        Manage Pipeline <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'details' && selectedJob && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <div className="flex flex-col lg:flex-row justify-between gap-8 mb-8 border-b border-slate-100 pb-8">
              <div className="space-y-4">
                <div>
                  <h3 className="text-3xl font-bold text-slate-900">{selectedJob.title}</h3>
                  <p className="text-lg text-blue-600 font-medium">
                    {selectedJob.employerId ? (
                      <Link to={`/partners/${selectedJob.employerId}`} className="hover:text-blue-800 hover:underline">
                        {employers.find(e => e.id === selectedJob.employerId)?.companyName || selectedJob.company}
                      </Link>
                    ) : (
                      selectedJob.company
                    )} • {selectedJob.location}
                  </p>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg"><DollarSign size={16} /> {selectedJob.salaryRange}</span>
                  <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg"><Clock size={16} /> {selectedJob.type}</span>
                </div>
              </div>
              <div className="lg:w-96 p-6 bg-slate-900 rounded-xl text-white">
                <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Pipeline Stats</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold ">{Object.values(getJobFunnel(selectedJob.id)).reduce((a, b) => a + b, 0)}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Total In Pipeline</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-400">
                      {getJobFunnel(selectedJob.id)[WorkflowStage.APPLIED] || 0}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Applications</p>
                  </div>
                </div>
              </div>
            </div>

            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Target size={18} className="text-blue-500" /> Recruitment Funnel
            </h4>
            {renderFunnel(selectedJob)}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="font-bold text-slate-800 mb-4">Job Requirements</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.requirements.map(req => (
                    <span key={req} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs rounded-lg font-bold border border-blue-100">{req}</span>
                  ))}
                </div>
                <p className="mt-6 text-sm text-slate-600 leading-relaxed">{selectedJob.description}</p>
              </div>

              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-bold text-slate-800">Available Candidates</h4>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input type="text" placeholder="Quick search..." className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 w-48" />
                  </div>
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {candidates.filter(c => !c.jobId || c.jobId === selectedJob.id).map(candidate => {
                    const isMatched = candidate.jobId === selectedJob.id;
                    const ai = matchScores[candidate.id];

                    return (
                      <div key={candidate.id} className={`p-4 rounded-xl border transition-all ${isMatched ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex gap-3">
                            <img src={candidate.avatarUrl} className="w-10 h-10 rounded-lg object-cover" />
                            <div>
                              <Link to={`/candidates/${candidate.id}`} className="font-bold text-slate-800 hover:text-blue-600 hover:underline">
                                {candidate.name}
                              </Link>
                              <p className="text-[10px] text-slate-500 font-medium">{candidate.role} • {candidate.experienceYears}y exp</p>
                            </div>
                          </div>
                          {isMatched ? (
                            <div className="bg-blue-600 text-white p-1 rounded-full shadow-lg shadow-blue-100">
                              <CheckCircle2 size={16} />
                            </div>
                          ) : (
                            <button
                              onClick={() => handleSelectCandidate(candidate)}
                              className="px-3 py-1 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 shadow-sm"
                            >
                              Match
                            </button>
                          )}
                        </div>

                        {/* AI Matching Logic */}
                        {ai ? (
                          <div className="mt-4 p-3 bg-white rounded-lg border border-blue-100 animate-in zoom-in-95 duration-300">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold text-blue-600 flex items-center gap-1">
                                <Bot size={12} /> AI Match Score
                              </span>
                              <span className={`text-xs font-bold ${ai.score > 75 ? 'text-green-600' : ai.score > 50 ? 'text-amber-600' : 'text-red-500'}`}>
                                {ai.score}% Match
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                              <div className={`h-full transition-all duration-1000 ${ai.score > 75 ? 'bg-green-500' : ai.score > 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${ai.score}%` }}></div>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-normal italic">{ai.reason}</p>
                          </div>
                        ) : !isMatched && (
                          <button
                            onClick={() => handleAnalyzeMatch(candidate)}
                            disabled={isAnalyzing === candidate.id}
                            className="mt-4 w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-[10px] font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
                          >
                            {isAnalyzing === candidate.id ? <RefreshCw className="animate-spin" size={12} /> : <Bot size={12} />}
                            {isAnalyzing === candidate.id ? 'Analyzing...' : 'Analyze Match Quality'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'create' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-3xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Plus size={20} /></div>
            <h3 className="text-xl font-bold text-slate-800">Post New Enterprise Opportunity</h3>
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Job Title</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="e.g., Lead Project Manager"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Location</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="e.g., Dubai, UAE"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Assign Partner (Employer)</label>
                <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm appearance-none">
                  <option value="">Select a Partner Company...</option>
                  {employers.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.companyName} ({emp.country})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Salary Range</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="e.g., $1,200 - $1,500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Description</label>
              <textarea rows={4} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all" placeholder="Enter detailed job description..."></textarea>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button onClick={() => setActiveTab('list')} className="px-5 py-2 text-slate-600 font-bold hover:bg-slate-50 rounded-lg">Discard</button>
              <button className="px-8 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 shadow-xl">Post Listing</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobBoard;