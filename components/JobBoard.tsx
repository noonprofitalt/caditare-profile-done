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
    setTimeout(async () => {
      setCandidates(await CandidateService.getCandidates() || []);
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

  const handleSelectCandidate = async (candidate: Candidate) => {
    if (!selectedJob) return;
    const updatedCandidate = { ...candidate, jobId: selectedJob.id };
    await CandidateService.updateCandidate(updatedCandidate);
    setCandidates(await CandidateService.getCandidates() || []);

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

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-8 pb-24 md:pb-12">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl rotate-3 animate-float mb-1">
              <Target className="text-blue-400" size={24} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase text-slate-900 leading-none">Market Center</h1>
              <div className="flex items-center gap-2 text-[10px] text-blue-600 font-black uppercase tracking-[0.2em] mt-1">
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span>Live Enterprise Opportunities</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {selectedJob && (
            <button
              onClick={() => { setSelectedJob(null); setActiveTab('list'); }}
              className="px-6 py-3 bg-white border border-slate-200 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-premium shadow-sm active:scale-95"
            >
              Exit Console
            </button>
          )}
          <button
            onClick={() => setActiveTab('create')}
            className="flex-1 md:flex-none px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 transition-premium shadow-2xl shadow-slate-900/20 active:scale-95"
          >
            <Plus size={18} className="text-blue-400" /> Post Opportunity
          </button>
        </div>
      </div>

      {activeTab === 'list' && (
        <div className="space-y-6">
          {filterEmployerId && (
            <div className="glass-card p-4 bg-blue-600 border-none text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RefreshCw size={16} className="animate-spin-slow opacity-50" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Filtering Source: {employers.find(e => e.id === filterEmployerId)?.companyName || 'GLOBAL REGISTRY'}
                </span>
              </div>
              <button
                onClick={() => setSearchParams({})}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
              >
                Reset
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass-card p-8 h-[320px] animate-pulse">
                  <div className="flex justify-between mb-8">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl" />
                    <div className="w-20 h-6 bg-slate-100 rounded-full" />
                  </div>
                  <div className="w-3/4 h-8 bg-slate-100 rounded-xl mb-3" />
                  <div className="w-1/2 h-4 bg-slate-100 rounded-lg mb-8" />
                  <div className="space-y-2">
                    <div className="w-2/3 h-4 bg-slate-100 rounded-lg" />
                    <div className="w-1/3 h-4 bg-slate-100 rounded-lg" />
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
                    className="glass-card p-8 group cursor-pointer hover:border-blue-500/50 transition-premium relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-blue-500/10 transition-colors" />

                    <div className="flex items-start justify-between mb-6 relative z-10">
                      <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-premium">
                        <Briefcase size={28} className="text-blue-400" />
                      </div>
                      <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm ${job.status === JobStatus.OPEN ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                          job.status === JobStatus.CLOSED ? 'bg-slate-50 text-slate-500 border border-slate-100' :
                            'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                        {job.status}
                      </span>
                    </div>

                    <div className="relative z-10">
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">{job.title}</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">{job.company}</p>

                      <div className="space-y-3 mb-8">
                        <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                          <MapPin size={16} className="text-blue-500" />
                          <span className="uppercase tracking-tight">{job.location}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                          <Users size={16} className="text-blue-500" />
                          <span className="uppercase tracking-tight">{total} TALENT MATCHED</span>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-300 uppercase leading-none">POSTED DATE</span>
                          <span className="text-[10px] font-black text-slate-500 uppercase mt-1">{job.postedDate}</span>
                        </div>
                        <div className="px-4 py-2 bg-slate-50 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-premium">
                          <ChevronRight size={16} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'details' && selectedJob && (
        <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
          <div className="glass-card p-6 md:p-12">
            <div className="flex flex-col lg:flex-row justify-between gap-12 mb-12 border-b border-slate-100 pb-12">
              <div className="space-y-8">
                <div>
                  <h3 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-4">{selectedJob.title}</h3>
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="text-lg font-black text-blue-600 uppercase tracking-tight">
                      {selectedJob.company}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                    <span className="text-lg font-black text-slate-400 uppercase tracking-tight">
                      {selectedJob.location}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="px-6 py-3 bg-slate-900 text-white rounded-2xl flex items-center gap-3 shadow-xl shadow-slate-900/20">
                    <DollarSign size={20} className="text-blue-400" />
                    <span className="text-sm font-black uppercase tracking-widest">{selectedJob.salaryRange}</span>
                  </div>
                  <div className="px-6 py-3 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100 flex items-center gap-3">
                    <Clock size={20} />
                    <span className="text-sm font-black uppercase tracking-widest">{selectedJob.type}</span>
                  </div>
                </div>
              </div>

              <div className="lg:w-[400px] p-8 bg-slate-900 rounded-[2.5rem] text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 blur-3xl rounded-full" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-8 flex items-center gap-3">
                  <div className="w-12 h-[1px] bg-blue-400/30" />
                  Deployment Stats
                </h4>
                <div className="grid grid-cols-2 gap-10">
                  <div className="space-y-2">
                    <p className="text-4xl font-black tracking-tighter">{Object.values(getJobFunnel(selectedJob.id)).reduce((a, b) => a + b, 0)}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Global Pool</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-4xl font-black tracking-tighter text-blue-400">
                      {getJobFunnel(selectedJob.id)[WorkflowStage.APPLIED] || 0}
                    </p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Active Apps</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-12">
              <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
                <Target size={16} className="text-blue-600" />
                System Funnel Architecture
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                {STAGE_ORDER.map((stage) => {
                  const count = getJobFunnel(selectedJob.id)[stage] || 0;
                  return (
                    <div key={stage} className={`p-4 rounded-2xl border transition-all ${count > 0 ? 'bg-blue-50 border-blue-200 shadow-lg shadow-blue-500/5' : 'bg-slate-50 border-slate-100 opacity-40'}`}>
                      <p className="text-[8px] uppercase font-black text-slate-400 mb-2 truncate line-clamp-1">{stage}</p>
                      <h4 className={`text-2xl font-black tracking-tighter ${count > 0 ? 'text-blue-600' : 'text-slate-300'}`}>{count}</h4>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
              <div className="lg:col-span-3 space-y-10">
                <section>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6">Execution Requirements</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.requirements.map(req => (
                      <span key={req} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-[10px] font-bold rounded-xl uppercase tracking-tight hover:border-blue-300 transition-colors">{req}</span>
                    ))}
                  </div>
                </section>

                <section>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6">Mission Briefing</h4>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-2xl whitespace-pre-wrap">{selectedJob.description}</p>
                </section>
              </div>

              <div className="lg:col-span-2 space-y-8">
                <div className="glass-card p-8 bg-slate-50 border-slate-200">
                  <div className="flex items-center justify-between mb-8">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Candidate Matrix</h4>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input type="text" placeholder="FILTER..." className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 w-40" />
                    </div>
                  </div>

                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-3 custom-scrollbar">
                    {candidates.filter(c => !c.jobId || c.jobId === selectedJob.id).map(candidate => {
                      const isMatched = candidate.jobId === selectedJob.id;
                      const ai = matchScores[candidate.id];

                      return (
                        <div key={candidate.id} className={`p-5 rounded-2xl border transition-premium ${isMatched ? 'bg-white border-blue-500 shadow-xl shadow-blue-500/10 animate-in zoom-in-95' : 'bg-white border-slate-100 hover:border-blue-300'}`}>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex gap-4">
                              <div className="relative">
                                <img src={candidate.avatarUrl} className="w-12 h-12 rounded-2xl object-cover grayscale hover:grayscale-0 transition-all shadow-md" />
                                {isMatched && <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />}
                              </div>
                              <div>
                                <Link to={`/candidates/${candidate.id}`} className="text-sm font-black text-slate-900 uppercase tracking-tight hover:text-blue-600 transition-colors">
                                  {candidate.name}
                                </Link>
                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{candidate.role} • {candidate.experienceYears}Y EXP</p>
                              </div>
                            </div>

                            {!isMatched && (
                              <button
                                onClick={() => handleSelectCandidate(candidate)}
                                className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-premium active:scale-95"
                              >
                                <Plus size={16} />
                              </button>
                            )}
                          </div>

                          {ai ? (
                            <div className="mt-4 p-4 bg-slate-900 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-500 border border-white/5">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                  <Bot size={14} /> Intelligence
                                </span>
                                <span className={`text-xs font-black ${ai.score > 75 ? 'text-emerald-400' : ai.score > 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                                  {ai.score}% COMPATIBLE
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-3">
                                <div className={`h-full transition-all duration-1000 ease-out ${ai.score > 75 ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]' : ai.score > 50 ? 'bg-amber-400' : 'bg-rose-400'}`} style={{ width: `${ai.score}%` }}></div>
                              </div>
                              <p className="text-[9px] text-slate-400 font-medium leading-relaxed italic line-clamp-2">{ai.reason}</p>
                            </div>
                          ) : !isMatched && (
                            <button
                              onClick={() => handleAnalyzeMatch(candidate)}
                              disabled={isAnalyzing === candidate.id}
                              className="mt-2 w-full flex items-center justify-center gap-3 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-premium shadow-lg disabled:opacity-50 active:scale-95"
                            >
                              {isAnalyzing === candidate.id ? <RefreshCw className="animate-spin" size={14} /> : <Bot size={14} className="text-blue-400" />}
                              {isAnalyzing === candidate.id ? 'Analyzing Protocol...' : 'Invoke Gemini Check'}
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
        </div>
      )}

      {activeTab === 'create' && (
        <div className="glass-card p-8 md:p-12 max-w-4xl mx-auto animate-in slide-in-from-bottom-8 duration-500">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-blue-500/20 rotate-3 animate-float mb-2">
              <Plus size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Initialize Opportunity</h3>
              <p className="text-[10px] text-blue-600 font-black uppercase tracking-[0.2em] mt-1">Enterprise Configuration Protocol</p>
            </div>
          </div>

          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Designated Role</label>
                <input
                  type="text"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-premium"
                  placeholder="E.G., OPERATIONS DIRECTOR"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Geographic Zone</label>
                <input
                  type="text"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-premium"
                  placeholder="E.G., DOHA, QATAR"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Enterprise Source</label>
                <select className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-premium appearance-none">
                  <option value="">SELECT PARTNER ENTITY...</option>
                  {employers.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.companyName} ({emp.country})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Remuneration Matrix</label>
                <input
                  type="text"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-premium"
                  placeholder="E.G., QAR 8,000 - 10,000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mission Operational details</label>
              <textarea rows={6} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-3xl font-bold text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none resize-none transition-premium" placeholder="INPUT DEPLOYMENT PARAMETERS..."></textarea>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-end gap-4 pt-8 border-t border-slate-100">
              <button
                onClick={() => setActiveTab('list')}
                className="w-full md:w-auto px-8 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-all active:scale-95"
              >
                Abort Protocol
              </button>
              <button className="w-full md:w-auto px-12 py-5 bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-800 shadow-2xl shadow-slate-900/40 transition-premium active:scale-95">
                Authorize Posting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobBoard;