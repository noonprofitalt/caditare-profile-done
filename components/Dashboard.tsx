import React, { useState, useEffect } from 'react';
import { TaskEngine } from '../services/taskEngine';
import { CandidateService } from '../services/candidateService';
import { NotificationService } from '../services/notificationService';
import { FinanceService } from '../services/financeService';
import { PartnerService } from '../services/partnerService';
import { JobService } from '../services/jobService';
import { DemandOrderService } from '../services/demandOrderService';
import { WorkTask, SystemAlert, Candidate, WorkflowStage, ProfileCompletionStatus, JobStatus, DemandOrderStatus } from '../types';
import { useNavigate } from 'react-router-dom';
import {
   CheckCircle, AlertTriangle, Clock, Activity, ArrowRight,
   Calendar, Zap, Bell, FileText, UserPlus,
   Briefcase, TrendingUp, MessageCircle, Layout, Settings as SettingsIcon, FilePlus,
   Package, Building2
} from 'lucide-react';
import Skeleton from './ui/Skeleton';

const Dashboard: React.FC = () => {
   const [candidates, setCandidates] = useState<Candidate[]>([]);
   const [tasks, setTasks] = useState<WorkTask[]>([]);
   const [alerts, setAlerts] = useState<SystemAlert[]>([]);
   const [projectedRevenue, setProjectedRevenue] = useState(0);
   const [openJobsCount, setOpenJobsCount] = useState(0);
   const [activeDemands, setActiveDemands] = useState(0);
   const [isLoading, setIsLoading] = useState(true);
   const navigate = useNavigate();

   useEffect(() => {
      // setIsLoading(true); // Already true by default
      // Simulate loading delay
      setTimeout(async () => {
         try {
            const data = await CandidateService.getCandidates() || [];
            setCandidates(data);
            const generatedTasks = TaskEngine.generateWorkQueue(data);
            const generatedAlerts = TaskEngine.generateAlerts(data);
            setTasks(generatedTasks);
            setAlerts(generatedAlerts);
            // Finance service needs employers too, but for now we might mock it or fetch it
            // Assuming PartnerService is still sync or we need to fetch it.
            // Let's check PartnerService.
            const employers = PartnerService.getEmployers();
            setProjectedRevenue(FinanceService.getProjectedRevenue(data, employers));
            // Jobs & Demand Orders
            const jobs = JobService.getJobs();
            setOpenJobsCount(jobs.filter(j => j.status === JobStatus.OPEN).length);
            const orders = DemandOrderService.getAll();
            setActiveDemands(orders.filter(o => o.status === DemandOrderStatus.OPEN || o.status === DemandOrderStatus.PARTIALLY_FILLED).length);
         } catch (error) {
            console.error('Failed to load dashboard data:', error);
         } finally {
            setIsLoading(false);
         }
      }, 800);
   }, []);

   const getPriorityColor = (priority: string) => {
      switch (priority) {
         case 'Critical': return 'border-l-4 border-l-red-500 bg-red-50/50';
         case 'High': return 'border-l-4 border-l-orange-500 bg-orange-50/50';
         case 'Medium': return 'border-l-4 border-l-blue-500 bg-blue-50/50';
         default: return 'border-l-4 border-l-slate-300';
      }
   };

   const activeCandidates = candidates.length;
   const criticalIssues = tasks.filter(t => t.priority === 'Critical').length;

   // Profile Completion Stats
   const quickProfiles = candidates.filter(c => c.profileCompletionStatus === ProfileCompletionStatus.QUICK).length;
   const partialProfiles = candidates.filter(c => c.profileCompletionStatus === ProfileCompletionStatus.PARTIAL).length;
   const completeProfiles = candidates.filter(c => c.profileCompletionStatus === ProfileCompletionStatus.COMPLETE).length;

   return (
      <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 md:space-y-8 pb-24 lg:pb-8">
         {/* 1. Header Row: High-Level Status (KPIs) */}
         <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-5">
            {isLoading ? (
               Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="glass-card p-5 flex items-center justify-between h-[116px]">
                     <div className="space-y-3 w-full">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-3 w-32" />
                     </div>
                     <Skeleton className="h-12 w-12 rounded-xl" />
                  </div>
               ))
            ) : (
               <>
                  <div
                     onClick={() => navigate('/candidates')}
                     className="bg-slate-900 group relative overflow-hidden p-6 rounded-2xl shadow-2xl hover:scale-[1.02] active:scale-95 transition-premium cursor-pointer"
                  >
                     <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-premium"></div>
                     <div className="flex items-center justify-between relative z-10">
                        <div>
                           <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest mb-1">Total Candidates</p>
                           <h3 className="text-2xl sm:text-4xl font-black text-white mb-1 tracking-tighter">{activeCandidates}</h3>
                           <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 uppercase tracking-tight">
                              <Activity size={10} /> Online
                           </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10 text-blue-400 group-hover:scale-110 transition-premium">
                           <Briefcase size={28} />
                        </div>
                     </div>
                  </div>

                  <div
                     onClick={() => navigate('/pipeline')}
                     className="bg-red-600 group relative overflow-hidden p-6 rounded-2xl shadow-2xl shadow-red-200 hover:scale-[1.02] active:scale-95 transition-premium cursor-pointer"
                  >
                     <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-premium"></div>
                     <div className="flex items-center justify-between relative z-10">
                        <div>
                           <p className="text-red-100 text-[10px] uppercase font-black tracking-widest mb-1">Pending Actions</p>
                           <h3 className="text-3xl sm:text-4xl font-black text-white mb-1 tracking-tighter">{criticalIssues}</h3>
                           <p className="text-[10px] text-red-100 font-bold uppercase tracking-tight">Critical</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-md p-3 rounded-xl border border-white/20 text-yellow-300 group-hover:rotate-12 transition-premium">
                           <Zap size={28} />
                        </div>
                     </div>
                  </div>

                  <div
                     onClick={() => navigate('/finance')}
                     className="bg-blue-600 group relative overflow-hidden p-6 rounded-2xl shadow-2xl shadow-blue-200 hover:scale-[1.02] active:scale-95 transition-premium cursor-pointer"
                  >
                     <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-premium"></div>
                     <div className="flex items-center justify-between relative z-10">
                        <div>
                           <p className="text-blue-100 text-[10px] uppercase font-black tracking-widest mb-1">Projected Revenue</p>
                           <h3 className="text-2xl sm:text-3xl font-black text-white mb-1 tracking-tighter">${projectedRevenue.toLocaleString()}</h3>
                           <p className="text-[10px] text-blue-100 font-bold uppercase tracking-tight">Projected Revenue</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-md p-3 rounded-xl border border-white/20 text-emerald-300 group-hover:translate-y-[-4px] transition-premium">
                           <TrendingUp size={28} />
                        </div>
                     </div>
                  </div>

                  <div
                     onClick={() => navigate('/candidates?stage=Departed')}
                     className="bg-emerald-600 group relative overflow-hidden p-6 rounded-2xl shadow-2xl shadow-emerald-200 hover:scale-[1.02] active:scale-95 transition-premium cursor-pointer"
                  >
                     <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-premium"></div>
                     <div className="flex items-center justify-between relative z-10">
                        <div>
                           <p className="text-emerald-100 text-[10px] uppercase font-black tracking-widest mb-1">Deployed</p>
                           <h3 className="text-3xl sm:text-4xl font-black text-white mb-1 tracking-tighter">{candidates.filter(c => c.stage === WorkflowStage.DEPARTED).length}</h3>
                           <p className="text-[10px] text-emerald-100 font-bold uppercase tracking-tight">Ready for bill</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-md p-3 rounded-xl border border-white/20 text-yellow-300 group-hover:scale-110 transition-premium">
                           <Calendar size={28} />
                        </div>
                     </div>
                  </div>

                  <div
                     onClick={() => navigate('/jobs')}
                     className="bg-purple-600 group relative overflow-hidden p-6 rounded-2xl shadow-2xl shadow-purple-200 hover:scale-[1.02] active:scale-95 transition-premium cursor-pointer"
                  >
                     <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-premium"></div>
                     <div className="flex items-center justify-between relative z-10">
                        <div>
                           <p className="text-purple-100 text-[10px] uppercase font-black tracking-widest mb-1">Open Jobs</p>
                           <h3 className="text-3xl sm:text-4xl font-black text-white mb-1 tracking-tighter">{openJobsCount}</h3>
                           <p className="text-[10px] text-purple-100 font-bold uppercase tracking-tight">Hiring Now</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-md p-3 rounded-xl border border-white/20 text-yellow-300 group-hover:scale-110 transition-premium">
                           <Briefcase size={28} />
                        </div>
                     </div>
                  </div>

                  <div
                     onClick={() => navigate('/partners')}
                     className="bg-indigo-600 group relative overflow-hidden p-6 rounded-2xl shadow-2xl shadow-indigo-200 hover:scale-[1.02] active:scale-95 transition-premium cursor-pointer"
                  >
                     <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-premium"></div>
                     <div className="flex items-center justify-between relative z-10">
                        <div>
                           <p className="text-indigo-100 text-[10px] uppercase font-black tracking-widest mb-1">Active Demands</p>
                           <h3 className="text-3xl sm:text-4xl font-black text-white mb-1 tracking-tighter">{activeDemands}</h3>
                           <p className="text-[10px] text-indigo-100 font-bold uppercase tracking-tight">Orders Open</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-md p-3 rounded-xl border border-white/20 text-cyan-300 group-hover:rotate-12 transition-premium">
                           <Package size={28} />
                        </div>
                     </div>
                  </div>
               </>
            )}
         </div>

         {/* Database Health Overview */}
         <div className="glass-card p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
               <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-3 uppercase tracking-tight">
                     <Activity className="text-blue-600" size={24} />
                     System Status
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 font-bold uppercase tracking-widest">Database Health</p>
               </div>
               <button
                  onClick={() => navigate('/candidates?status=quick')}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-premium text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-200"
               >
                  Action Required
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <div className="flex items-center justify-center p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <div className="relative w-32 h-32 animate-float">
                     <svg className="transform -rotate-90 w-32 h-32">
                        <circle cx="64" cy="64" r="54" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                        <circle cx="64" cy="64" r="54" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={`${2 * Math.PI * 54}`}
                           strokeDashoffset={`${2 * Math.PI * 54 * (1 - (completeProfiles / activeCandidates || 0))}`}
                           className="text-emerald-500 transition-all duration-1000 ease-out" strokeLinecap="round" />
                     </svg>
                     <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-slate-900 tracking-tighter">{activeCandidates > 0 ? Math.round((completeProfiles / activeCandidates) * 100) : 0}%</span>
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Healthy</span>
                     </div>
                  </div>
               </div>

               <div onClick={() => navigate('/candidates?status=quick')} className="glass-card-interactive p-6 flex flex-col justify-between group">
                  <div className="flex items-center gap-2 mb-4">
                     <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></div>
                     <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">Fragile</h3>
                  </div>
                  <p className="text-4xl font-black text-red-600 tracking-tighter mb-1">{quickProfiles}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Pending full Sync</p>
               </div>

               <div onClick={() => navigate('/candidates?status=partial')} className="glass-card-interactive p-6 flex flex-col justify-between group">
                  <div className="flex items-center gap-2 mb-4">
                     <Clock size={16} className="text-amber-500" />
                     <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">Staging</h3>
                  </div>
                  <p className="text-4xl font-black text-amber-600 tracking-tighter mb-1">{partialProfiles}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Active Processing</p>
               </div>

               <div onClick={() => navigate('/candidates?status=complete')} className="glass-card-interactive p-6 flex flex-col justify-between group">
                  <div className="flex items-center gap-2 mb-4">
                     <CheckCircle size={16} className="text-emerald-500" />
                     <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">Validated</h3>
                  </div>
                  <p className="text-4xl font-black text-emerald-600 tracking-tighter mb-1">{completeProfiles}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Production Ready</p>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                     <h2 className="text-xl font-black text-slate-900 flex items-center gap-3 uppercase tracking-tight">
                        <Zap className="text-amber-400 fill-amber-400 animate-pulse" size={24} />
                        Priority Tasks
                     </h2>
                     <p className="text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-widest">Sorted by priority</p>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                     <button className="px-4 py-2 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-200 shrink-0">Priority</button>
                     <button className="px-4 py-2 bg-white border border-slate-200 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 shrink-0">Alerts</button>
                     <button className="px-4 py-2 bg-white border border-slate-200 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 shrink-0">Compliance</button>
                  </div>
               </div>

               <div className="glass-card overflow-hidden min-h-[500px]">
                  {isLoading ? (
                     <div className="p-6 space-y-6">
                        {Array.from({ length: 5 }).map((_, i) => (
                           <div key={i} className="flex gap-6 items-start animate-pulse">
                              <Skeleton className="h-12 w-12 shrink-0 rounded-2xl" />
                              <div className="flex-1 space-y-3">
                                 <div className="flex justify-between">
                                    <Skeleton className="h-6 w-48 rounded-lg" />
                                    <Skeleton className="h-6 w-20 rounded-xl" />
                                 </div>
                                 <Skeleton className="h-4 w-full rounded-lg" />
                                 <div className="flex gap-6">
                                    <Skeleton className="h-4 w-32 rounded-lg" />
                                    <Skeleton className="h-4 w-40 rounded-lg ml-auto" />
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  ) : tasks.length > 0 ? (
                     <div className="divide-y divide-slate-100">
                        {tasks.map((task) => (
                           <div
                              key={task.id}
                              onClick={() => navigate(`/candidates/${task.candidateId}`)}
                              className={`p-4 md:p-6 hover:bg-slate-50/50 transition-premium cursor-pointer group flex items-start gap-4 md:gap-5 border-l-4 transition-all duration-300 ${task.priority === 'Critical' ? 'border-red-500' :
                                 task.priority === 'High' ? 'border-amber-500' : 'border-blue-500'
                                 }`}
                           >
                              <div className="pt-1 shrink-0 group-hover:scale-110 transition-premium">
                                 {task.priority === 'Critical' ? <AlertTriangle className="text-red-500" size={28} /> :
                                    task.priority === 'High' ? <Clock className="text-amber-500" size={28} /> :
                                       <FileText className="text-blue-500" size={28} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                 <div className="flex justify-between items-start gap-3 mb-2">
                                    <h4 className="font-black text-slate-900 group-hover:text-blue-600 transition-colors text-lg uppercase tracking-tight">{task.title}</h4>
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg shrink-0 shadow-sm ${task.priority === 'Critical' ? 'bg-red-500 text-white shadow-red-100' :
                                       task.priority === 'High' ? 'bg-amber-500 text-white shadow-amber-100' : 'bg-blue-600 text-white shadow-blue-100'
                                       }`}>
                                       {task.priority}
                                    </span>
                                 </div>
                                 <p className="text-sm text-slate-500 mb-4 font-medium leading-relaxed">{task.description}</p>
                                 <div className="flex flex-wrap items-center gap-4 text-[10px]">
                                    <span className="flex items-center gap-2 font-black text-slate-700 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                                       <UserPlus size={14} className="text-blue-500" /> {task.candidateName}
                                    </span>
                                    <span className="text-slate-400 font-black uppercase tracking-widest">{task.stage}</span>
                                    <span className="ml-auto text-red-500 font-black uppercase tracking-widest flex items-center gap-1.5">
                                       <Clock size={12} /> {task.dueDate}
                                    </span>
                                 </div>
                              </div>
                              <div className="self-center hidden md:block opacity-0 group-hover:opacity-100 transition-premium shrink-0 translate-x-4 group-hover:translate-x-0">
                                 <ArrowRight size={24} className="text-blue-600" />
                              </div>
                           </div>
                        ))}
                     </div>
                  ) : (
                     <div className="flex flex-col items-center justify-center p-20 text-slate-300">
                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center border border-slate-100 mb-6 group-hover:scale-110 transition-premium">
                           <CheckCircle size={40} className="text-emerald-400" />
                        </div>
                        <p className="font-black uppercase tracking-widest text-sm text-slate-400">All Caught Up</p>
                        <p className="text-xs font-bold text-slate-400 mt-2">No pending tasks.</p>
                     </div>
                  )}
               </div>
            </div>

            <div className="space-y-8">
               <div className="glass-card p-6">
                  <h3 className="font-black text-slate-900 mb-6 flex items-center gap-3 text-xs uppercase tracking-widest">
                     <Bell size={18} className="text-blue-500" /> Notifications
                  </h3>
                  <div className="space-y-4">
                     {isLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                           <div key={i} className="p-4 bg-slate-50 rounded-2xl flex gap-4">
                              <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
                              <div className="flex-1 space-y-2">
                                 <Skeleton className="h-4 w-full rounded" />
                                 <Skeleton className="h-3 w-24 rounded" />
                              </div>
                           </div>
                        ))
                     ) : alerts.length > 0 ? alerts.map(alert => (
                        <div key={alert.id} className={`p-4 rounded-2xl border transition-premium hover:scale-[1.02] shadow-sm ${alert.type === 'DELAY' ? 'bg-red-50 border-red-100 text-red-800 shadow-red-100' :
                           'bg-blue-50 border-blue-100 text-blue-800 shadow-blue-100'
                           }`}>
                           <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-xl border ${alert.type === 'DELAY' ? 'bg-white/50 border-red-200 text-red-600' : 'bg-white/50 border-blue-200 text-blue-600'
                                 }`}>
                                 <AlertTriangle size={18} />
                              </div>
                              <div>
                                 <p className="font-black text-xs uppercase tracking-tight">{alert.message}</p>
                                 <p className="text-[10px] font-bold opacity-60 mt-2 uppercase tracking-widest">{new Date(alert.timestamp).toLocaleTimeString()}</p>
                              </div>
                           </div>
                        </div>
                     )) : (
                        <div className="text-center py-10">
                           <Activity size={32} className="mx-auto text-slate-200 mb-3" />
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No Active Signals</p>
                        </div>
                     )}
                  </div>
               </div>

               <div className="bg-slate-900 rounded-3xl shadow-2xl p-8 text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-600/30 transition-premium"></div>
                  <h3 className="font-black mb-8 opacity-90 text-xs uppercase tracking-widest flex items-center gap-3">
                     <Activity size={16} className="text-blue-400" /> Performance
                  </h3>
                  <div className="space-y-8">
                     <div>
                        <div className="flex justify-between text-[10px] mb-3 font-black uppercase tracking-widest">
                           <span className="text-slate-400">Verification</span>
                           <span className="text-blue-400">8/12 - 66%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2.5 border border-white/5 p-0.5">
                           <div className="bg-gradient-to-r from-blue-600 to-emerald-400 h-full rounded-full shadow-[0_0_12px_rgba(52,211,153,0.4)]" style={{ width: '66%' }}></div>
                        </div>
                     </div>
                     <div>
                        <div className="flex justify-between text-[10px] mb-3 font-black uppercase tracking-widest">
                           <span className="text-slate-400">Visa Processing</span>
                           <span className="text-amber-400">3/5 - 60%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2.5 border border-white/5 p-0.5">
                           <div className="bg-gradient-to-r from-amber-500 to-orange-400 h-full rounded-full shadow-[0_0_12px_rgba(251,191,36,0.3)]" style={{ width: '60%' }}></div>
                        </div>
                     </div>
                  </div>
                  <div className="mt-10 pt-6 border-t border-white/5">
                     <button className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-premium">
                        Advanced Metrics Overview
                     </button>
                  </div>
               </div>
            </div>
         </div>

         {/* 4. QUICK ACTIONS PALETTE */}
         <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 flex flex-col items-end gap-3 z-40 lg:mr-0 mr-2">
            <div className="group relative">
               <button className="flex items-center gap-3 bg-slate-900 border border-slate-700 text-white pl-5 pr-2 py-2.5 rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-premium animate-float ring-4 ring-slate-900/10">
                  <span className="font-black text-[10px] uppercase tracking-widest">Actions</span>
                  <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                     <Zap size={18} className="text-white fill-white" />
                  </div>
               </button>

               {/* Pop-up Menu */}
               <div className="absolute bottom-full right-0 mb-4 w-52 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-bottom-right scale-90 group-hover:scale-100 duration-300">
                  <div className="p-2.5 space-y-1">
                     <button onClick={() => navigate('/candidates')} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-blue-600 hover:text-white rounded-xl text-left transition-premium">
                        <UserPlus size={16} /> Add Candidate
                     </button>
                     <button onClick={() => navigate('/jobs')} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-blue-600 hover:text-white rounded-xl text-left transition-premium">
                        <FilePlus size={16} /> Post Job
                     </button>
                     <button onClick={() => navigate('/team-chat')} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-blue-600 hover:text-white rounded-xl text-left transition-premium">
                        <MessageCircle size={16} /> Chat
                     </button>
                     <button onClick={() => navigate('/pipeline')} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-blue-600 hover:text-white rounded-xl text-left transition-premium">
                        <Layout size={16} /> Pipeline
                     </button>
                     <div className="h-px bg-slate-100 my-2"></div>
                     <button onClick={() => navigate('/settings')} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 rounded-xl text-left transition-premium">
                        <SettingsIcon size={16} /> Settings
                     </button>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

export default Dashboard;