import React, { useState, useEffect } from 'react';
import { TaskEngine } from '../services/taskEngine';
import { CandidateService } from '../services/candidateService';
import { NotificationService } from '../services/notificationService';
import { FinanceService } from '../services/financeService';
import { WorkTask, SystemAlert, Candidate, WorkflowStage, ProfileCompletionStatus } from '../types';
import { useNavigate } from 'react-router-dom';
import {
   CheckCircle, AlertTriangle, Clock, Activity, ArrowRight,
   Calendar, Zap, Bell, FileText, UserPlus,
   Briefcase, TrendingUp, MessageCircle, Layout, Settings as SettingsIcon, FilePlus
} from 'lucide-react';
import Skeleton from './ui/Skeleton';

const Dashboard: React.FC = () => {
   const [candidates, setCandidates] = useState<Candidate[]>([]);
   const [tasks, setTasks] = useState<WorkTask[]>([]);
   const [alerts, setAlerts] = useState<SystemAlert[]>([]);
   const [projectedRevenue, setProjectedRevenue] = useState(0);
   const [isLoading, setIsLoading] = useState(true);
   const navigate = useNavigate();

   useEffect(() => {
      // setIsLoading(true); // Already true by default
      // Simulate loading delay
      setTimeout(() => {
         const data = CandidateService.getCandidates() || [];
         setCandidates(data);
         const generatedTasks = TaskEngine.generateWorkQueue(data);
         const generatedAlerts = TaskEngine.generateAlerts(data);
         setTasks(generatedTasks);
         setAlerts(generatedAlerts);
         setProjectedRevenue(FinanceService.getProjectedRevenue());
         setIsLoading(false);

         // Check for critical tasks and notify if needed
         const criticalTasks = generatedTasks.filter(t => t.priority === 'Critical');
         if (criticalTasks.length > 0) {
            NotificationService.addNotification({
               type: 'DELAY',
               title: 'Critical SLA Breaches detected!',
               message: `There are ${criticalTasks.length} candidates requiring immediate attention due to processing delays.`,
               link: '/'
            });
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
      <div className="p-6 max-w-[1600px] mx-auto space-y-6 relative h-[calc(100vh-4rem)] overflow-y-auto">

         {/* 1. Header Row: High-Level Status (KPIs) */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {isLoading ? (
               Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between h-[116px]">
                     <div className="space-y-3 w-full">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-3 w-32" />
                     </div>
                     <Skeleton className="h-12 w-12 rounded-lg" />
                  </div>
               ))
            ) : (
               <>
                  <div
                     onClick={() => navigate('/candidates')}
                     className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-6 rounded-xl shadow-xl flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-all duration-200 group relative overflow-hidden"
                  >
                     <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                     <div className="relative z-10">
                        <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Active Workforce</p>
                        <h3 className="text-4xl font-bold mb-1">{activeCandidates}</h3>
                        <p className="text-xs text-slate-400 flex items-center gap-1"><Activity size={12} className="text-green-400" /> System Operational</p>
                     </div>
                     <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/20 relative z-10"><Briefcase size={28} className="text-blue-400" /></div>
                  </div>

                  <div
                     onClick={() => navigate('/pipeline')}
                     className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-xl shadow-xl flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-all duration-200 group relative overflow-hidden"
                  >
                     <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-red-700/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                     <div className="relative z-10">
                        <p className="text-red-100 text-xs uppercase font-bold tracking-wider mb-1">Critical Actions</p>
                        <h3 className="text-4xl font-bold mb-1">{criticalIssues}</h3>
                        <p className="text-xs text-red-100 font-medium">Immediate attention required</p>
                     </div>
                     <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl border border-white/30 relative z-10"><Zap size={28} className="text-yellow-300" /></div>
                  </div>

                  <div
                     onClick={() => navigate('/finance')}
                     className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 rounded-xl shadow-xl flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-all duration-200 group relative overflow-hidden"
                  >
                     <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-blue-800/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                     <div className="relative z-10">
                        <p className="text-blue-100 text-xs uppercase font-bold tracking-wider mb-1">Projected Revenue</p>
                        <h3 className="text-4xl font-bold mb-1">${projectedRevenue.toLocaleString()}</h3>
                        <p className="text-xs text-blue-100">Expected Pipeline Value</p>
                     </div>
                     <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl border border-white/30 relative z-10"><TrendingUp size={28} className="text-green-300" /></div>
                  </div>

                  <div
                     onClick={() => navigate('/candidates?stage=Departed')}
                     className="bg-gradient-to-br from-green-600 to-green-700 text-white p-6 rounded-xl shadow-xl flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-all duration-200 group relative overflow-hidden"
                  >
                     <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-green-800/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                     <div className="relative z-10">
                        <p className="text-green-100 text-xs uppercase font-bold tracking-wider mb-1">Departures</p>
                        <h3 className="text-4xl font-bold mb-1">{candidates.filter(c => c.stage === WorkflowStage.DEPARTED).length}</h3>
                        <p className="text-xs text-green-100 font-medium flex items-center"><CheckCircle size={12} className="mr-1" /> Ready for Invoicing</p>
                     </div>
                     <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl border border-white/30 relative z-10"><Calendar size={28} className="text-yellow-300" /></div>
                  </div>
               </>
            )}
         </div>

         {/* Database Health Overview */}
         <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
               <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                     <Activity className="text-blue-600" size={24} />
                     Database Health
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">Profile completion status across all candidates</p>
               </div>
               <button
                  onClick={() => navigate('/candidates?status=quick')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
               >
                  View Incomplete
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               {/* Radial Progress */}
               <div className="flex items-center justify-center">
                  <div className="relative w-32 h-32">
                     <svg className="transform -rotate-90 w-32 h-32">
                        <circle
                           cx="64"
                           cy="64"
                           r="56"
                           stroke="currentColor"
                           strokeWidth="12"
                           fill="transparent"
                           className="text-slate-200"
                        />
                        <circle
                           cx="64"
                           cy="64"
                           r="56"
                           stroke="currentColor"
                           strokeWidth="12"
                           fill="transparent"
                           strokeDasharray={`${2 * Math.PI * 56}`}
                           strokeDashoffset={`${2 * Math.PI * 56 * (1 - (completeProfiles / activeCandidates || 0))}`}
                           className="text-green-600 transition-all duration-1000"
                           strokeLinecap="round"
                        />
                     </svg>
                     <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-slate-900">{activeCandidates > 0 ? Math.round((completeProfiles / activeCandidates) * 100) : 0}%</span>
                        <span className="text-xs text-slate-500">Complete</span>
                     </div>
                  </div>
               </div>

               {/* Quick Profiles */}
               <div
                  onClick={() => navigate('/candidates?status=quick')}
                  className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-4 cursor-pointer hover:scale-[1.02] transition-all group"
               >
                  <div className="flex items-center gap-2 mb-2">
                     <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                     <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Quick Add</h3>
                  </div>
                  <p className="text-3xl font-bold text-red-600 mb-1">{quickProfiles}</p>
                  <p className="text-xs text-slate-600">Pending full registration</p>
                  <div className="mt-3 text-xs font-semibold text-red-700 group-hover:underline">Complete Now →</div>
               </div>

               {/* Partial Profiles */}
               <div
                  onClick={() => navigate('/candidates?status=partial')}
                  className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-xl p-4 cursor-pointer hover:scale-[1.02] transition-all group"
               >
                  <div className="flex items-center gap-2 mb-2">
                     <Clock size={14} className="text-yellow-600" />
                     <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">In Progress</h3>
                  </div>
                  <p className="text-3xl font-bold text-yellow-600 mb-1">{partialProfiles}</p>
                  <p className="text-xs text-slate-600">Partially completed</p>
                  <div className="mt-3 text-xs font-semibold text-yellow-700 group-hover:underline">Finish Registration →</div>
               </div>

               {/* Complete Profiles */}
               <div
                  onClick={() => navigate('/candidates?status=complete')}
                  className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-4 cursor-pointer hover:scale-[1.02] transition-all group"
               >
                  <div className="flex items-center gap-2 mb-2">
                     <CheckCircle size={14} className="text-green-600" />
                     <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Complete</h3>
                  </div>
                  <p className="text-3xl font-bold text-green-600 mb-1">{completeProfiles}</p>
                  <p className="text-xs text-slate-600">Ready for workflow</p>
                  <div className="mt-3 text-xs font-semibold text-green-700">
                     {completeProfiles > 0 ? `${((completeProfiles / activeCandidates) * 100).toFixed(0)}% of database` : 'No profiles yet'}
                  </div>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">

            {/* 2. MAIN WORK QUEUE (Personal To-Do) */}
            <div className="lg:col-span-2 space-y-4">
               <div className="flex items-center justify-between">
                  <div>
                     <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Zap className="text-yellow-500 fill-yellow-500" size={24} />
                        My Priority Work Queue
                     </h2>
                     <p className="text-sm text-slate-600 mt-1">Tasks requiring your attention, sorted by urgency</p>
                  </div>
                  <div className="flex gap-2 text-sm">
                     <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-medium text-xs hover:bg-blue-700 transition-colors">All</button>
                     <button className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg font-medium text-xs hover:bg-slate-50 transition-colors">Critical</button>
                     <button className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg font-medium text-xs hover:bg-slate-50 transition-colors">Approvals</button>
                  </div>
               </div>

               <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
                  {isLoading ? (
                     <div className="p-4 space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                           <div key={i} className="flex gap-4 items-start">
                              <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                              <div className="flex-1 space-y-2">
                                 <div className="flex justify-between">
                                    <Skeleton className="h-5 w-40" />
                                    <Skeleton className="h-5 w-16 rounded-full" />
                                 </div>
                                 <Skeleton className="h-4 w-full" />
                                 <div className="flex gap-4">
                                    <Skeleton className="h-3 w-20" />
                                    <Skeleton className="h-3 w-16" />
                                    <Skeleton className="h-3 w-20 ml-auto" />
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
                              className={`p-5 hover:bg-slate-50 transition-all cursor-pointer group flex items-start gap-4 ${getPriorityColor(task.priority)}`}
                           >
                              <div className="pt-1 shrink-0">
                                 {task.priority === 'Critical' ? <AlertTriangle className="text-red-500" size={24} /> :
                                    task.priority === 'High' ? <Clock className="text-orange-500" size={24} /> :
                                       <FileText className="text-blue-500" size={24} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                 <div className="flex justify-between items-start gap-3 mb-2">
                                    <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-base">{task.title}</h4>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0 ${task.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                                       task.priority === 'High' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                                       }`}>
                                       {task.priority}
                                    </span>
                                 </div>
                                 <p className="text-sm text-slate-600 mb-3">{task.description}</p>
                                 <div className="flex items-center gap-4 text-xs">
                                    <span className="flex items-center gap-1.5 font-medium text-slate-700">
                                       <UserPlus size={14} /> {task.candidateName}
                                    </span>
                                    <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-600 font-medium">{task.stage}</span>
                                    <span className="ml-auto text-orange-600 font-bold">Due: {task.dueDate}</span>
                                 </div>
                              </div>
                              <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                 <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm">
                                    {task.actionLabel}
                                 </button>
                              </div>
                           </div>
                        ))}
                     </div>
                  ) : (
                     <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <CheckCircle size={48} className="text-green-500 mb-4 opacity-50" />
                        <p className="font-medium">All caught up! No pending tasks.</p>
                     </div>
                  )}
               </div>
            </div>

            {/* 3. ALERTS & ACTIVITY FEED */}
            <div className="space-y-6">
               {/* Alerts */}
               <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                     <Bell size={18} className="text-slate-400" /> System Alerts
                  </h3>
                  <div className="space-y-3">
                     {isLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                           <div key={i} className="p-3 border border-slate-100 rounded-lg flex gap-3">
                              <Skeleton className="h-8 w-8 shrink-0 rounded" />
                              <div className="flex-1 space-y-2">
                                 <Skeleton className="h-4 w-full" />
                                 <Skeleton className="h-3 w-20" />
                              </div>
                           </div>
                        ))
                     ) : alerts.length > 0 ? alerts.map(alert => (
                        <div key={alert.id} className={`p-3 rounded-lg text-sm border ${alert.type === 'DELAY' ? 'bg-red-50 border-red-100 text-red-800' :
                           'bg-blue-50 border-blue-100 text-blue-800'
                           }`}>
                           <div className="flex items-start gap-2">
                              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                              <div>
                                 <p className="font-semibold">{alert.message}</p>
                                 <p className="text-xs opacity-75 mt-1">{new Date(alert.timestamp).toLocaleTimeString()}</p>
                              </div>
                           </div>
                        </div>
                     )) : (
                        <p className="text-sm text-slate-400 italic">No system alerts.</p>
                     )}
                  </div>
               </div>

               {/* Quick Stats */}
               {isLoading ? (
                  <div className="bg-white rounded-xl shadow-lg p-5 border border-slate-200">
                     <Skeleton className="h-6 w-32 mb-4" />
                     <div className="space-y-4">
                        <Skeleton className="h-10 w-full rounded-lg" />
                        <Skeleton className="h-10 w-full rounded-lg" />
                     </div>
                  </div>
               ) : (
                  <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-lg p-5 text-white">
                     <h3 className="font-bold mb-4 opacity-90">Daily Targets</h3>
                     <div className="space-y-4">
                        <div>
                           <div className="flex justify-between text-xs mb-1 opacity-80">
                              <span>Verification Queue</span>
                              <span>8/12</span>
                           </div>
                           <div className="w-full bg-blue-900/50 rounded-full h-2">
                              <div className="bg-green-400 h-2 rounded-full" style={{ width: '66%' }}></div>
                           </div>
                        </div>
                        <div>
                           <div className="flex justify-between text-xs mb-1 opacity-80">
                              <span>Visa Submissions</span>
                              <span>3/5</span>
                           </div>
                           <div className="w-full bg-blue-900/50 rounded-full h-2">
                              <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '60%' }}></div>
                           </div>
                        </div>
                     </div>
                  </div>
               )}
            </div>
         </div>

         {/* 4. FLOATING ACTION PALETTE (Quick Actions) */}
         <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 flex flex-col items-end gap-3 z-40">
            <div className="group relative">
               <button className="flex items-center gap-2 md:gap-3 bg-slate-900 text-white pl-4 pr-1 md:pl-5 md:pr-2 py-2.5 md:py-3 rounded-full shadow-2xl hover:scale-105 transition-all">
                  <span className="font-bold text-xs md:text-sm">Quick Actions</span>
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-blue-600 rounded-full flex items-center justify-center">
                     <ArrowRight size={14} className="md:w-4 md:h-4" />
                  </div>
               </button>

               {/* Pop-up Menu */}
               <div className="absolute bottom-full right-0 mb-3 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-bottom-right scale-95 group-hover:scale-100">
                  <div className="p-2 space-y-1">
                     <button onClick={() => navigate('/candidates')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg text-left">
                        <UserPlus size={16} /> Add Candidate
                     </button>
                     <button onClick={() => navigate('/jobs')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg text-left">
                        <FilePlus size={16} /> Post New Job
                     </button>
                     <button onClick={() => navigate('/team-chat')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg text-left">
                        <MessageCircle size={16} /> Team Chat
                     </button>
                     <button onClick={() => navigate('/pipeline')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg text-left">
                        <Layout size={16} /> Pipeline View
                     </button>
                     <div className="h-px bg-slate-100 my-1"></div>
                     <button onClick={() => navigate('/settings')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg text-left">
                        <SettingsIcon size={16} /> System Settings
                     </button>
                  </div>
               </div>
            </div>
         </div>

      </div>
   );
};

export default Dashboard;