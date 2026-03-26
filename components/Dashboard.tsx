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
import { useAuth } from '../context/AuthContext';
import {
   CheckCircle, AlertTriangle, Clock, Activity, ArrowRight,
   Calendar, Zap, Bell, FileText, UserPlus,
   Briefcase, TrendingUp, MessageCircle, Layout, Settings as SettingsIcon, FilePlus,
   Package, Building2
} from 'lucide-react';
import Skeleton from './ui/Skeleton';
import WidgetErrorBoundary from './ui/WidgetErrorBoundary';

const Dashboard: React.FC = () => {
   const [candidates, setCandidates] = useState<Candidate[]>([]);
   const [tasks, setTasks] = useState<WorkTask[]>([]);
   const [alerts, setAlerts] = useState<SystemAlert[]>([]);
   const [projectedRevenue, setProjectedRevenue] = useState(0);
   const [openJobsCount, setOpenJobsCount] = useState(0);
   const [activeDemands, setActiveDemands] = useState(0);
   const [isLoading, setIsLoading] = useState(true);
   const [activeTaskTab, setActiveTaskTab] = useState<'priority' | 'alerts' | 'compliance'>('priority');
   const navigate = useNavigate();
   const { user } = useAuth();
   const isAdmin = user?.role === 'Admin';

   useEffect(() => {
      // GUARD: Don't fetch dashboard data until the user is authenticated
      if (!user) return;

      const loadDashboardData = async () => {
         console.log('[Dashboard] Loading data... user:', user?.email, 'role:', user?.role, 'isAdmin:', isAdmin);
         try {
            // FRICTIONLESS MODE: Parallel Fetching to eliminate network waterfalls.
            // Force refresh (true) to bypass any stale caches from prior unauthenticated requests.
            const [data, employers, jobs, orders] = await Promise.all([
               CandidateService.getCandidates(true).then(res => res || []),
               isAdmin ? PartnerService.getEmployers(true).then(res => res || []) : Promise.resolve([]),
               isAdmin ? JobService.getJobs(true).then(res => res || []) : Promise.resolve([]),
               isAdmin ? DemandOrderService.getAll(true).then(res => res || []) : Promise.resolve([])
            ]);

            console.log('[Dashboard] Fetched:', { candidates: data.length, employers: employers.length, jobs: jobs.length, orders: orders.length });

            // *** SET REACT STATE FIRST — before any localStorage operations ***
            // This ensures the dashboard renders data even if caching fails.
            setCandidates(data);
            const generatedTasks = TaskEngine.generateWorkQueue(data);
            const generatedAlerts = TaskEngine.generateAlerts(data);
            setTasks(generatedTasks);
            setAlerts(generatedAlerts);

            if (isAdmin) {
               setProjectedRevenue(FinanceService.getProjectedRevenue(data, employers));
               setOpenJobsCount(jobs.filter(j => j.status === JobStatus.OPEN).length);
               setActiveDemands(orders.filter(o => o.status === DemandOrderStatus.OPEN || o.status === DemandOrderStatus.PARTIALLY_FILLED).length);
            }

            // OFFLINE MODE: Cache latest data (wrapped in try-catch to prevent QuotaExceededError from crashing)
            try {
               if (data.length > 0) localStorage.setItem('caditare_dash_data', JSON.stringify(data));
               if (isAdmin) {
                  if (employers.length > 0) localStorage.setItem('caditare_dash_employers', JSON.stringify(employers));
                  if (jobs.length > 0) localStorage.setItem('caditare_dash_jobs', JSON.stringify(jobs));
                  if (orders.length > 0) localStorage.setItem('caditare_dash_orders', JSON.stringify(orders));
               }
            } catch (cacheErr) {
               console.warn('[Dashboard] localStorage cache failed (quota exceeded). Clearing stale data and retrying...');
               // Clear old cache entries to free up space
               localStorage.removeItem('caditare_dash_data');
               localStorage.removeItem('caditare_dash_employers');
               localStorage.removeItem('caditare_dash_jobs');
               localStorage.removeItem('caditare_dash_orders');
               localStorage.removeItem('caditare_offline_candidates');
               // Dashboard data is already rendered in React state — no action needed.
            }
         } catch (error) {
            console.error('[Dashboard] Failed to load dashboard data:', error);
            // OFFLINE MODE: Fallback to cached data if network fails
            try {
               const cData = localStorage.getItem('caditare_dash_data');
               if (cData) {
                  console.log('[Dashboard] Serving dashboard from local cache.');
                  const data = JSON.parse(cData);
                  setCandidates(data);
                  setTasks(TaskEngine.generateWorkQueue(data));
                  setAlerts(TaskEngine.generateAlerts(data));

                  const cEmpl = localStorage.getItem('caditare_dash_employers');
                  const cJobs = localStorage.getItem('caditare_dash_jobs');
                  const cOrders = localStorage.getItem('caditare_dash_orders');
                  if (cEmpl && cJobs && cOrders) {
                     const employers = JSON.parse(cEmpl);
                     const jobs = JSON.parse(cJobs);
                     const orders = JSON.parse(cOrders);
                     setProjectedRevenue(FinanceService.getProjectedRevenue(data, employers));
                     setOpenJobsCount(jobs.filter((j: any) => j.status === JobStatus.OPEN).length);
                     setActiveDemands(orders.filter((o: any) => o.status === DemandOrderStatus.OPEN || o.status === DemandOrderStatus.PARTIALLY_FILLED).length);
                  }
               }
            } catch (cacheReadErr) {
               console.error('[Dashboard] Cache read also failed:', cacheReadErr);
            }
         } finally {
            setIsLoading(false);
         }
      };
      loadDashboardData();
   }, [user]);

   const activeCandidates = candidates.length;
   const criticalIssues = tasks.filter(t => t.priority === 'Critical').length;

   // Profile Completion Stats
   const quickProfiles = candidates.filter(c => c.profileCompletionStatus === ProfileCompletionStatus.QUICK).length;
   const partialProfiles = candidates.filter(c => c.profileCompletionStatus === ProfileCompletionStatus.PARTIAL && (c.profileCompletionPercentage || 0) < 75).length;
   const completeProfiles = candidates.filter(c => c.profileCompletionStatus === ProfileCompletionStatus.COMPLETE || (c.profileCompletionPercentage || 0) >= 75).length;

   const verificationPercent = activeCandidates > 0 ? Math.round((completeProfiles / activeCandidates) * 100) : 0;
   const deployedCount = candidates.filter(c => c.stage === WorkflowStage.DEPARTED).length;
   const deployedPercent = activeCandidates > 0 ? Math.round((deployedCount / activeCandidates) * 100) : 0;

   // Tab-specific filtered data
   const priorityTasks = tasks; // all tasks sorted by priority
   const complianceTasks = tasks.filter(t => t.type === 'ISSUE');
   const alertItems = alerts;

   const getActiveContent = () => {
      if (activeTaskTab === 'alerts') {
         return alertItems.length > 0 ? (
            <div className="divide-y divide-slate-100">
               {alertItems.map((alert) => (
                  <div key={alert.id} className={`p-4 md:p-6 flex items-start gap-4 md:gap-5 border-l-4 transition-all duration-300 ${alert.type === 'DELAY' ? 'border-red-500' :
                     alert.type === 'WARNING' ? 'border-amber-500' : 'border-blue-500'
                     }`}>
                     <div className="pt-1 shrink-0">
                        {alert.type === 'DELAY' ? <AlertTriangle className="text-red-500" size={28} /> :
                           alert.type === 'WARNING' ? <AlertTriangle className="text-amber-500" size={28} /> :
                              <Bell className="text-blue-500" size={28} />}
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-3 mb-2">
                           <h4 className="font-black text-slate-900 text-lg uppercase tracking-tight">{alert.message}</h4>
                           <span className={`text-xs font-medium px-2 py-0.5 rounded-md shrink-0 ${alert.type === 'DELAY' ? 'bg-red-500 text-white shadow-red-100' :
                              alert.type === 'WARNING' ? 'bg-amber-500 text-white shadow-amber-100' : 'bg-blue-600 text-white shadow-blue-100'
                              }`}>
                              {alert.type}
                           </span>
                        </div>
                        <p className="text-sm text-slate-500 font-medium">
                           {alert.count} candidate{alert.count !== 1 ? 's' : ''} affected
                        </p>
                        <div className="flex items-center gap-4 text-xs mt-3">
                           <span className="text-slate-500 font-medium">
                              <Clock size={12} className="inline mr-1" />
                              {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </span>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         ) : renderEmpty('No Active Alerts', 'All systems operating normally.');
      }

      if (activeTaskTab === 'compliance') {
         return complianceTasks.length > 0 ? renderTaskList(complianceTasks) : renderEmpty('No Compliance Issues', 'All candidates are compliant.');
      }

      // Default: priority
      return priorityTasks.length > 0 ? renderTaskList(priorityTasks) : renderEmpty('All Caught Up', 'No pending tasks.');
   };

   const renderTaskList = (taskList: WorkTask[]) => (
      <div className="divide-y divide-slate-100">
         {taskList.map((task) => (
            <div key={task.id} onClick={() => navigate(`/candidates/${task.candidateId}`)} className={`p-4 md:p-6 hover:bg-slate-50 transition-colors cursor-pointer group flex items-start gap-4 md:gap-5 border-l-4 transition-all duration-300 ${task.priority === 'Critical' ? 'border-red-500' :
               task.priority === 'High' ? 'border-amber-500' : 'border-blue-500'
               }`}>
               <div className="pt-1 shrink-0 group-hover:scale-110 transition-premium">
                  {task.priority === 'Critical' ? <AlertTriangle className="text-red-500" size={28} /> :
                     task.priority === 'High' ? <Clock className="text-amber-500" size={28} /> :
                        <FileText className="text-blue-500" size={28} />}
               </div>
               <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-3 mb-2">
                     <h4 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors text-base">{task.title}</h4>
                     <span className={`text-xs font-medium px-2 py-0.5 rounded-md shrink-0 ${task.priority === 'Critical' ? 'bg-red-500 text-white shadow-red-100' :
                        task.priority === 'High' ? 'bg-amber-500 text-white shadow-amber-100' : 'bg-blue-600 text-white shadow-blue-100'
                        }`}>
                        {task.priority}
                     </span>
                  </div>
                  <p className="text-sm text-slate-500 mb-4 font-medium leading-relaxed">{task.description}</p>
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                     <span className="flex items-center gap-2 font-medium text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                        <UserPlus size={14} className="text-blue-500" /> {task.candidateName}
                     </span>
                     <span className="text-slate-500 font-medium">{task.stage}</span>
                     <span className="ml-auto text-red-600 font-medium flex items-center gap-1.5">
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
   );

   const renderEmpty = (title: string, subtitle: string) => (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
         <div className="mb-4">
            <CheckCircle size={32} className="text-slate-300" />
         </div>
         <p className="font-semibold text-slate-900 mb-1">{title}</p>
         <p className="text-sm text-slate-500 max-w-[200px]">{subtitle}</p>
      </div>
   );

   return (
      <div className="container-responsive py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6 md:space-y-8">
         {/* 1. Header Row: High-Level Status (KPIs) */}
         <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
            {isLoading ? (
               Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-lg p-5 flex items-center justify-between h-[116px]">
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
                     className="bg-slate-900 group relative overflow-hidden p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  >
                     <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-colors"></div>
                     <div className="flex items-center justify-between relative z-10">
                        <div className="flex-1 min-w-0 pr-2">
                           <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1 truncate">Total Candidates</p>
                           <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 truncate">{activeCandidates}</h3>
                           <p className="text-xs text-emerald-400 font-bold flex items-center gap-1 uppercase tracking-tight truncate">
                              <Activity size={10} className="shrink-0" /> Online
                           </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10 text-blue-400 group-hover:scale-110 transition-transform shrink-0">
                           <Briefcase size={24} />
                        </div>
                     </div>
                  </div>

                  <div
                     onClick={() => navigate('/pipeline')}
                     className="bg-red-600 group relative overflow-hidden p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  >
                     <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                     <div className="flex items-center justify-between relative z-10">
                        <div className="flex-1 min-w-0 pr-2">
                           <p className="text-red-100 text-xs font-semibold uppercase tracking-wider mb-1 truncate">Pending Actions</p>
                           <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 truncate">{criticalIssues}</h3>
                           <p className="text-xs text-red-100 font-bold uppercase tracking-tight truncate">Critical</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-md p-3 rounded-xl border border-white/20 text-yellow-300 group-hover:rotate-12 transition-transform shrink-0">
                           <Zap size={24} />
                        </div>
                     </div>
                  </div>

                  {isAdmin && (
                     <div
                        onClick={() => navigate('/finance')}
                        className="bg-blue-600 group relative overflow-hidden p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                     >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center justify-between relative z-10">
                           <div className="flex-1 min-w-0 pr-2">
                              <p className="text-blue-100 text-xs font-semibold uppercase tracking-wider mb-1 truncate">Projected Revenue</p>
                              <h3 className="text-2xl sm:text-2xl lg:text-3xl xl:text-2xl 2xl:text-3xl font-bold text-white mb-1 truncate" title={`$${projectedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}>${projectedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                              <p className="text-xs text-blue-100 font-bold uppercase tracking-tight truncate">Projected Revenue</p>
                           </div>
                           <div className="bg-white/20 backdrop-blur-md p-3 rounded-xl border border-white/20 text-emerald-300 group-hover:-translate-y-1 transition-transform shrink-0">
                              <TrendingUp size={24} />
                           </div>
                        </div>
                     </div>
                  )}

                  <div
                     onClick={() => navigate('/candidates?stage=Departed')}
                     className="bg-emerald-600 group relative overflow-hidden p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  >
                     <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                     <div className="flex items-center justify-between relative z-10">
                        <div className="flex-1 min-w-0 pr-2">
                           <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider mb-1 truncate">Deployed</p>
                           <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 truncate">{candidates.filter(c => c.stage === WorkflowStage.DEPARTED).length}</h3>
                           <p className="text-xs text-emerald-100 font-bold uppercase tracking-tight truncate">Ready for bill</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-md p-3 rounded-xl border border-white/20 text-yellow-300 group-hover:scale-110 transition-transform shrink-0">
                           <Calendar size={24} />
                        </div>
                     </div>
                  </div>

                  {isAdmin && (
                     <>
                        <div
                           onClick={() => navigate('/jobs')}
                           className="bg-purple-600 group relative overflow-hidden p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        >
                           <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                           <div className="flex items-center justify-between relative z-10">
                              <div className="flex-1 min-w-0 pr-2">
                                 <p className="text-purple-100 text-xs font-semibold uppercase tracking-wider mb-1 truncate">Open Jobs</p>
                                 <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 truncate">{openJobsCount}</h3>
                                 <p className="text-xs text-purple-100 font-bold uppercase tracking-tight truncate">Hiring Now</p>
                              </div>
                              <div className="bg-white/20 backdrop-blur-md p-3 rounded-xl border border-white/20 text-yellow-300 group-hover:scale-110 transition-transform shrink-0">
                                 <Briefcase size={24} />
                              </div>
                           </div>
                        </div>

                        <div
                           onClick={() => navigate('/partners')}
                           className="bg-indigo-600 group relative overflow-hidden p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        >
                           <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                           <div className="flex items-center justify-between relative z-10">
                              <div className="flex-1 min-w-0 pr-2">
                                 <p className="text-indigo-100 text-xs font-semibold uppercase tracking-wider mb-1 truncate">Active Demands</p>
                                 <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 truncate">{activeDemands}</h3>
                                 <p className="text-xs text-indigo-100 font-bold uppercase tracking-tight truncate">Orders Open</p>
                              </div>
                              <div className="bg-white/20 backdrop-blur-md p-3 rounded-xl border border-white/20 text-cyan-300 group-hover:rotate-12 transition-transform shrink-0">
                                 <Package size={24} />
                              </div>
                           </div>
                        </div>
                     </>
                  )}
               </>
            )}
         </div>

         {/* Database Health Overview */}
         <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
               <div>
                  <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3 uppercase tracking-tight">
                     <Activity className="text-blue-600" size={24} />
                     System Status
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">Database Health</p>
               </div>
               <button
                  onClick={() => navigate('/candidates?status=quick')}
                  className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
               >
                  Action Required
               </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
               <div className="flex items-center justify-center p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                  <div className="relative w-32 h-32 animate-float">
                     <svg className="transform -rotate-90 w-32 h-32">
                        <circle cx="64" cy="64" r="54" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                        <circle cx="64" cy="64" r="54" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={`${2 * Math.PI * 54}`}
                           strokeDashoffset={`${2 * Math.PI * 54 * (1 - (completeProfiles / activeCandidates || 0))}`}
                           className="text-emerald-500 transition-all duration-1000 ease-out" strokeLinecap="round" />
                     </svg>
                     <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-slate-900 tracking-tighter">{activeCandidates > 0 ? Math.round(((completeProfiles + (partialProfiles * 0.5)) / activeCandidates) * 100) : 0}%</span>
                        <span className="text-xs text-slate-500 font-medium">Verified</span>
                     </div>
                  </div>
               </div>

               <div onClick={() => navigate('/candidates?status=QUICK')} className="bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors p-6 flex flex-col justify-between group">
                  <div className="flex items-center gap-2 mb-4">
                     <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></div>
                     <h3 className="text-sm font-medium text-slate-700">Fragile</h3>
                  </div>
                  <p className="text-3xl font-bold text-red-600 tracking-tighter mb-1">{quickProfiles}</p>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">Pending full Sync</p>
               </div>

               <div onClick={() => navigate('/candidates?status=PARTIAL')} className="bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors p-6 flex flex-col justify-between group">
                  <div className="flex items-center gap-2 mb-4">
                     <Clock size={16} className="text-amber-500" />
                     <h3 className="text-sm font-medium text-slate-700">Staging</h3>
                  </div>
                  <p className="text-3xl font-bold text-amber-600 tracking-tighter mb-1">{partialProfiles}</p>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">Active Processing</p>
               </div>

               <div onClick={() => navigate('/candidates?status=COMPLETE')} className="bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors p-6 flex flex-col justify-between group">
                  <div className="flex items-center gap-2 mb-4">
                     <CheckCircle size={16} className="text-emerald-500" />
                     <h3 className="text-sm font-medium text-slate-700">Validated</h3>
                  </div>
                  <p className="text-3xl font-bold text-emerald-600 tracking-tighter mb-1">{completeProfiles}</p>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">Production Ready</p>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            <div className="lg:col-span-2 space-y-6">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                     <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3 uppercase tracking-tight">
                        <Zap className="text-amber-400 fill-amber-400 animate-pulse" size={24} />
                        Priority Tasks
                     </h2>
                     <p className="text-xs text-slate-500 mt-1 font-bold uppercase tracking-widest">Sorted by priority</p>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                     <button
                        onClick={() => setActiveTaskTab('priority')}
                        className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest shrink-0 transition-all ${activeTaskTab === 'priority'
                           ? 'bg-blue-50 text-blue-700 border border-blue-100 shadow-sm'
                           : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                           }`}
                     >
                        Priority {priorityTasks.length > 0 && <span className={`ml-1 px-1.5 py-0.5 rounded text-[8px] ${activeTaskTab === 'priority' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>{priorityTasks.length}</span>}
                     </button>
                     <button
                        onClick={() => setActiveTaskTab('alerts')}
                        className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest shrink-0 transition-all ${activeTaskTab === 'alerts'
                           ? 'bg-amber-50 text-amber-700 border border-amber-100 shadow-sm'
                           : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                           }`}
                     >
                        Alerts {alertItems.length > 0 && <span className={`ml-1 px-1.5 py-0.5 rounded text-[8px] ${activeTaskTab === 'alerts' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>{alertItems.length}</span>}
                     </button>
                     <button
                        onClick={() => setActiveTaskTab('compliance')}
                        className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest shrink-0 transition-all ${activeTaskTab === 'compliance'
                           ? 'bg-red-50 text-red-700 border border-red-100 shadow-sm'
                           : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                           }`}
                     >
                        Compliance {complianceTasks.length > 0 && <span className={`ml-1 px-1.5 py-0.5 rounded text-[8px] ${activeTaskTab === 'compliance' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>{complianceTasks.length}</span>}
                     </button>
                  </div>
               </div>

               <div className="bg-white border border-slate-200 rounded-lg overflow-hidden min-h-[500px]">
                  {isLoading ? (
                     <div className="p-6 space-y-6">
                        {Array.from({ length: 5 }).map((_, i) => (
                           <div key={i} className="flex gap-6 items-start animate-pulse">
                              <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
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
                  ) : getActiveContent()}
               </div>
            </div>

            <div className="space-y-8">
               <div className="bg-white border border-slate-200 rounded-lg p-6">
                  <h3 className="font-black text-slate-900 mb-6 flex items-center gap-3 text-xs uppercase tracking-widest">
                     <Bell size={18} className="text-blue-500" /> Notifications
                  </h3>
                  <div className="space-y-4">
                     {isLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                           <div key={i} className="p-4 bg-slate-50 rounded-xl flex gap-4">
                              <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
                              <div className="flex-1 space-y-2">
                                 <Skeleton className="h-4 w-full rounded" />
                                 <Skeleton className="h-3 w-24 rounded" />
                              </div>
                           </div>
                        ))
                     ) : alerts.length > 0 ? alerts.map(alert => (
                        <div key={alert.id} className={`p-4 rounded-xl border transition-premium hover:scale-[1.02] shadow-sm ${alert.type === 'DELAY' ? 'bg-red-50 border-red-100 text-red-800 shadow-red-100' :
                           'bg-blue-50 border-blue-100 text-blue-800 shadow-blue-100'
                           }`}>
                           <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-xl border ${alert.type === 'DELAY' ? 'bg-white/50 border-red-200 text-red-600' : 'bg-white/50 border-blue-200 text-blue-600'
                                 }`}>
                                 <AlertTriangle size={18} />
                              </div>
                              <div>
                                 <p className="font-black text-xs uppercase tracking-tight">{alert.message}</p>
                                 <p className="text-xs font-bold opacity-60 mt-2 uppercase tracking-widest">{new Date(alert.timestamp).toLocaleTimeString()}</p>
                              </div>
                           </div>
                        </div>
                     )) : (
                        <div className="text-center py-10">
                           <Activity size={32} className="mx-auto text-slate-200 mb-3" />
                           <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No Active Signals</p>
                        </div>
                     )}
                  </div>
               </div>

               <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 relative overflow-hidden group">
                  <h3 className="font-black mb-6 text-slate-900 text-xs uppercase tracking-widest flex items-center gap-3">
                     <Activity size={16} className="text-blue-500" /> Performance
                  </h3>
                  <div className="space-y-6">
                     <div>
                        <div className="flex justify-between text-xs mb-2 font-bold uppercase tracking-widest">
                           <span className="text-slate-500">Fully Validated Hub</span>
                           <span className="text-emerald-600">{completeProfiles}/{activeCandidates} - {verificationPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                           <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${verificationPercent}%` }}></div>
                        </div>
                     </div>
                     <div>
                        <div className="flex justify-between text-xs mb-2 font-bold uppercase tracking-widest">
                           <span className="text-slate-500">Total Deployments</span>
                           <span className="text-amber-500">{deployedCount}/{activeCandidates} - {deployedPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                           <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${deployedPercent}%` }}></div>
                        </div>
                     </div>
                  </div>
                  <div className="mt-8 pt-5 border-t border-slate-100">
                     <button className="w-full py-2 bg-white border border-slate-200 rounded-lg text-slate-700 text-xs font-bold uppercase tracking-widest hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm">
                        Advanced Metrics Overview
                     </button>
                  </div>
               </div>
            </div>
         </div>

         {/* 4. QUICK ACTIONS PALETTE */}
         <div className="fixed bottom-[calc(var(--bottom-nav-height)+1rem)] lg:bottom-8 right-4 md:right-8 flex flex-col items-end gap-3 z-40">
            <div className="group relative">
               <button className="flex items-center gap-0 md:gap-3 bg-slate-900 border border-slate-700 text-white pl-2 md:pl-5 pr-2 py-2 md:py-2.5 rounded-xl shadow-md hover:bg-slate-800 transition-colors">
                  <span className="hidden md:block font-bold text-xs uppercase tracking-widest pl-2">Actions</span>
                  <div className="w-10 h-10 md:w-9 md:h-9 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10 text-blue-400 shadow-lg shadow-blue-500/20">
                     <Zap size={18} />
                  </div>
               </button>

               {/* Pop-up Menu */}
               <div className="absolute bottom-full right-0 mb-4 w-52 bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-100 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-bottom-right scale-90 group-hover:scale-100 duration-300">
                  <div className="p-2.5 space-y-1">
                     <button onClick={() => navigate('/candidates')} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-blue-600 hover:text-white rounded-xl text-left transition-premium">
                        <UserPlus size={16} /> Add Candidate
                     </button>
                     {isAdmin && (
                        <button onClick={() => navigate('/jobs')} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-blue-600 hover:text-white rounded-xl text-left transition-premium">
                           <FilePlus size={16} /> Post Job
                        </button>
                     )}
                     <button onClick={() => navigate('/team-chat')} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-blue-600 hover:text-white rounded-xl text-left transition-premium">
                        <MessageCircle size={16} /> Chat
                     </button>
                     <button onClick={() => navigate('/pipeline')} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-blue-600 hover:text-white rounded-xl text-left transition-premium">
                        <Layout size={16} /> Pipeline
                     </button>
                     <div className="h-px bg-slate-100 my-2"></div>
                     <button onClick={() => navigate('/settings')} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 rounded-xl text-left transition-premium">
                        <SettingsIcon size={16} /> Settings
                     </button>
                  </div>
               </div>
            </div>
         </div>
      </div >
   );
};

export default Dashboard;