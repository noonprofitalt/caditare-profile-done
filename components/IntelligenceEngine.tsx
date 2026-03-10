import React, { useState, useEffect } from 'react';
import { ReportingService } from '../services/reportingService';
import { SystemSnapshot } from '../types';
import {
   BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
   LayoutDashboard, Activity, Users, AlertTriangle, TrendingUp, DollarSign,
   Download, RefreshCw, Server, BrainCircuit, ShieldCheck, MessageSquare, ShieldAlert, Bot
} from 'lucide-react';
import AIPlayground from './AIPlayground';
import StaffPerformanceDashboard from './StaffPerformanceDashboard';
import { useAuth } from '../context/AuthContext';

const IntelligenceEngine: React.FC = () => {
   const { user } = useAuth();
   const isAdmin = user?.role === 'Admin';
   const [snapshot, setSnapshot] = useState<SystemSnapshot | null>(null);
   const [activeTab, setActiveTab] = useState<'dashboard' | 'workflow' | 'staff' | 'financial' | 'assistant'>('dashboard');
   const [isLoading, setIsLoading] = useState(false);
   const [aiPrompt, setAiPrompt] = useState<string | undefined>(undefined);

   const askAI = (prompt: string) => {
      setAiPrompt(prompt);
      setActiveTab('assistant');
      setTimeout(() => setAiPrompt(undefined), 100);
   };

   const refreshData = async () => {
      setIsLoading(true);
      const data = await ReportingService.getSystemSnapshot();
      setSnapshot(data);
      setIsLoading(false);

   };

   useEffect(() => {
      refreshData();

      const handleShowAssistant = () => setActiveTab('assistant');
      window.addEventListener('show_ai_assistant', handleShowAssistant);
      return () => window.removeEventListener('show_ai_assistant', handleShowAssistant);
   }, []);

   const handleExportReport = async () => {
      const csvContent = await ReportingService.generateFullSystemCSV();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `GlobalWorkforce_System_Report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
   };

   if (!snapshot) return <div className="p-8 text-center">Initializing Operational Analytics...</div>;

   const renderDashboard = () => (
      <div className="space-y-6">

         {/* Top Level KPI Cards */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 text-white shadow-lg">
               <div className="flex justify-between items-start mb-4">
                  <div>
                     <p className="text-blue-100 text-xs uppercase font-bold tracking-wider">Total Candidates</p>
                     <h3 className="text-3xl font-bold">{snapshot.kpi.totalCandidates}</h3>
                  </div>
                  <Users className="text-blue-300 opacity-50" size={24} />
               </div>
               <div className="flex items-center gap-2 text-xs text-blue-100 bg-blue-700/50 p-2 rounded-lg">
                  <Activity size={12} /> {snapshot.kpi.activeProcessing} Active Cases
               </div>
            </div>

            {isAdmin && (
               <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                     <div>
                        <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Est. Revenue</p>
                        <h3 className="text-3xl font-bold text-slate-800">Rs. {snapshot.kpi.revenueEst.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                     </div>
                     <DollarSign className="text-green-500 bg-green-50 p-1.5 rounded-lg" size={32} />
                  </div>
                  <p className="text-xs text-green-600 font-medium">Verified Collections</p>
               </div>
            )}

            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
               <div className="flex justify-between items-start mb-4">
                  <div>
                     <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Critical Bottlenecks</p>
                     <h3 className="text-3xl font-bold text-red-600">{snapshot.kpi.criticalDelays}</h3>
                  </div>
                  <AlertTriangle className="text-red-500 bg-red-50 p-1.5 rounded-lg" size={32} />
               </div>
               <p className="text-xs text-red-500 font-medium mb-3">SLA Breaches Detected</p>
               <button
                  onClick={() => askAI("Audit our current bottlenecks. Which stages are most critical and what's the recommended fix?")}
                  className="w-full py-2 bg-white border border-slate-200 text-slate-700 text-[11px] font-bold uppercase tracking-widest rounded-lg hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-colors flex items-center justify-center gap-2 shadow-sm"
               >
                  <Bot size={14} className="text-blue-500" /> AI Audit Stages
               </button>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
               <div className="flex justify-between items-start mb-4">
                  <div>
                     <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Throughput</p>
                     <h3 className="text-3xl font-bold text-slate-800">{snapshot.kpi.completedDepartures}</h3>
                  </div>
                  <TrendingUp className="text-purple-500 bg-purple-50 p-1.5 rounded-lg" size={32} />
               </div>
               <p className="text-xs text-slate-500">Successful Departures</p>
            </div>
         </div>

         {/* Safety & Integrity Summary */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="md:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
               <div className="flex items-center justify-between mb-6">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                     <ShieldAlert className="text-red-500" size={18} /> System Integrity Alerts
                  </h4>
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded uppercase">
                     {snapshot.bottlenecks.filter(b => b.status === 'Critical').length} Critical Issues
                  </span>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {snapshot.bottlenecks.filter(b => b.status !== 'Good').slice(0, 4).map(b => (
                     <div key={b.stage} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${b.status === 'Critical' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                           <AlertTriangle size={20} />
                        </div>
                        <div>
                           <p className="font-bold text-slate-800 text-sm">{b.stage}</p>
                           <p className="text-xs text-slate-500">{b.count} candidates delayed</p>
                           <div className="mt-2 text-[10px] font-bold text-red-700 flex items-center gap-1">
                              {b.avgDays}d Average ({b.avgDays - b.slaLimit}d over limit)
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            <div className="bg-slate-900 text-white p-6 rounded-xl shadow-xl flex flex-col justify-between">
               <div>
                  <h4 className="font-bold text-blue-400 mb-2 flex items-center gap-2">
                     <TrendingUp size={18} /> Optimization Tip
                  </h4>
                  <p className="text-sm text-slate-300 leading-relaxed">
                     Your <strong>{snapshot.bottlenecks?.length > 0 ? [...snapshot.bottlenecks].sort((a, b) => b.avgDays - a.avgDays)[0].stage : 'Workflow'}</strong> stage is currently slowing down the pipeline.
                     Resolving this could improve turnaround time by <span className="text-blue-400 font-bold">~15%</span>.
                  </p>
               </div>
               <button
                  onClick={() => setActiveTab('workflow')}
                  className="w-full mt-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all"
               >
                  Analyze Flow
               </button>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Distribution Chart */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
               <h4 className="font-bold text-slate-800 mb-6">Live Workflow Distribution</h4>
               <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={snapshot.stageDistribution}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                        <YAxis axisLine={false} tickLine={false} fontSize={12} />
                        <RechartsTooltip cursor={{ fill: 'transparent' }} />
                        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                     </BarChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* Bottleneck List */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
               <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <ShieldCheck className="text-slate-400" size={18} /> Health Check
               </h4>
               <div className="space-y-4">
                  {snapshot.bottlenecks.map(b => (
                     <div key={b.stage} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                        <div>
                           <p className="text-sm font-bold text-slate-700">{b.stage}</p>
                           <p className="text-xs text-slate-400">{b.count} Candidates</p>
                        </div>
                        <div className="text-right">
                           <p className={`text-sm font-bold ${b.status === 'Critical' ? 'text-red-600' :
                              b.status === 'Warning' ? 'text-orange-500' : 'text-green-600'
                              }`}>
                              {b.avgDays}d Avg
                           </p>
                           <p className="text-[10px] text-slate-400">Target: {b.slaLimit}d</p>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
   );

   const renderWorkflowAnalytics = () => (
      <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm">
         <h3 className="text-xl font-bold text-slate-800 mb-1 sm:mb-2">Detailed Workflow Analytics</h3>
         <p className="text-sm sm:text-base text-slate-500 mb-6 sm:mb-8">Process mining data regarding stage duration and efficiency.</p>

         <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
            <button
               onClick={() => askAI("Analyze our workflow efficiency. Which stage has the highest attrition or delay, and how can we optimize it based on SLA compliance?")}
               className="w-full sm:w-auto justify-center px-4 py-2 sm:py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-colors flex items-center gap-2 shadow-sm"
            >
               <Bot size={16} className="text-slate-300" />
               AI Process Mining Audit
            </button>
         </div>

         <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={snapshot.bottlenecks}>
                  <defs>
                     <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                     </linearGradient>
                  </defs>
                  <XAxis dataKey="stage" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <RechartsTooltip />
                  <Area type="monotone" dataKey="avgDays" stroke="#8884d8" fillOpacity={1} fill="url(#colorAvg)" name="Avg Days in Stage" />
                  <Area type="monotone" dataKey="slaLimit" stroke="#ff0000" fill="transparent" strokeDasharray="5 5" name="SLA Limit" />
               </AreaChart>
            </ResponsiveContainer>
         </div>

         <div className="-mx-4 sm:mx-0 overflow-x-auto border-t sm:border-none border-slate-100 mt-6 sm:mt-8">
            <div className="px-4 sm:px-0 min-w-[600px]">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                        <th className="py-3">Stage Name</th>
                        <th className="py-3">Current Load</th>
                        <th className="py-3">Avg Processing Time</th>
                        <th className="py-3">SLA Compliance</th>
                        <th className="py-3">Status</th>
                     </tr>
                  </thead>
                  <tbody>
                     {snapshot.bottlenecks.map(b => (
                        <tr key={b.stage} className="border-b border-slate-100 hover:bg-slate-50">
                           <td className="py-3 font-medium text-slate-700">{b.stage}</td>
                           <td className="py-3 text-slate-600">{b.count}</td>
                           <td className="py-3 font-mono">{b.avgDays} days</td>
                           <td className="py-3">
                              <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                                 <div
                                    className={`h-full ${b.avgDays > b.slaLimit ? 'bg-red-500' : 'bg-green-500'}`}
                                    style={{ width: `${Math.min((b.avgDays / b.slaLimit) * 100, 100)}%` }}
                                 ></div>
                              </div>
                           </td>
                           <td className="py-3">
                              <span className={`text-xs font-bold px-2 py-1 rounded-full ${b.status === 'Critical' ? 'bg-red-100 text-red-700' :
                                 b.status === 'Warning' ? 'bg-orange-100 text-orange-700' :
                                    'bg-green-100 text-green-700'
                                 }`}>
                                 {b.status}
                              </span>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
   );

   const renderStaffMetrics = () => (
      <div className="space-y-6">
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
            <div>
               <h3 className="text-xl font-bold text-slate-800 mb-1 sm:mb-2">Staff Productivity Performance</h3>
               <p className="text-sm sm:text-base text-slate-500">Cross-departmental activity analysis and throughput metrics.</p>
            </div>
            <button
               onClick={() => askAI("Analyze our staff performance metrics. Who are the top performers, and where do we need additional training or resource allocation based on current action volumes?")}
               className="w-full sm:w-auto justify-center px-4 py-2 sm:py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-colors flex items-center gap-2 shadow-sm"
            >
               <Bot size={16} className="text-slate-300" />
               AI Performance Audit
            </button>
         </div>
         <StaffPerformanceDashboard staffMetrics={snapshot.staffMetrics} />
      </div>
   );

   return (
      <div className="p-4 sm:p-6 md:p-8 max-w-[1600px] mx-auto space-y-6 md:space-y-8 pb-24 md:pb-8">
         {/* Header */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
               <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <TrendingUp size={20} className="shrink-0" />
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Operational Analytics Suite</span>
               </div>
               <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">System Analytics Engine</h2>
               <p className="text-sm sm:text-base text-slate-500 mt-1">Global performance reporting, financial outlook, and process mapping.</p>
            </div>
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 w-full md:w-auto">
               <span className="text-[10px] sm:text-xs text-slate-400 font-mono hidden sm:inline-block">Last updated: {new Date(snapshot.timestamp).toLocaleTimeString()}</span>
               <button
                  onClick={refreshData}
                  disabled={isLoading}
                  className="p-2 sm:p-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 flex-none"
               >
                  <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
               </button>
               <button
                  onClick={handleExportReport}
                  className="flex flex-1 sm:flex-none justify-center items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 shadow-lg text-sm transition-colors whitespace-nowrap"
               >
                  <Download size={18} /> Export <span className="hidden sm:inline">Full Report</span>
               </button>
            </div>
         </div>

         {/* Tabs */}
         <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-full md:w-fit overflow-x-auto whitespace-nowrap scrollbar-none snap-x">
            {[
               { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
               { id: 'workflow', label: 'Workflow Analytics', icon: Server },
               { id: 'staff', label: 'Staff Performance', icon: Users },
               ...(isAdmin ? [{ id: 'financial', label: 'Financials', icon: DollarSign }] : []),
               { id: 'assistant', label: 'AI Assistant', icon: Bot },
            ].map(tab => (
               <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'dashboard' | 'workflow' | 'staff' | 'financial' | 'assistant')}
                  className={`flex shrink-0 snap-start items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                     }`}
               >
                  <tab.icon size={16} /> {tab.label}
               </button>
            ))}
         </div>

         {/* Content Area */}
         <div className="min-h-[500px]">
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'workflow' && renderWorkflowAnalytics()}
            {activeTab === 'staff' && renderStaffMetrics()}
            {activeTab === 'financial' && (
               <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-2">
                     <div>
                        <h3 className="text-xl font-bold text-slate-800 mb-1 sm:mb-2">Financial Performance</h3>
                        <p className="text-sm sm:text-base text-slate-500">Advance payment collections, breakdown by type, and collection analytics.</p>
                     </div>
                     <button
                        onClick={() => askAI("Analyze our financial health. What's our collection rate? Which payment types have the highest amounts? Are there candidates with outstanding balances?")}
                        className="w-full sm:w-auto justify-center px-4 py-2 sm:py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-colors flex items-center gap-2 shadow-sm"
                     >
                        <Bot size={16} className="text-slate-300" />
                        AI Revenue Strategy
                     </button>
                  </div>

                  {/* KPI Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                     <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 border-emerald-700 p-6 rounded-xl shadow-sm text-white relative overflow-hidden">
                        <div className="flex justify-between items-start mb-2">
                           <div>
                              <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest mb-1">Total Collected</p>
                              <h3 className="text-3xl font-bold tracking-tight">Rs. {snapshot.financials.totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                           </div>
                           <div className="text-emerald-400 opacity-60"><DollarSign size={24} strokeWidth={2.5} /></div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-emerald-100 font-medium mt-3 bg-emerald-900/30 w-max px-3 py-1.5 rounded-lg">
                           <Activity size={12} className="text-emerald-300" /> From {snapshot.financials.candidatesWithPayments} of {snapshot.financials.totalCandidates} candidates
                        </div>
                     </div>

                     <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                           <div>
                              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Avg per Candidate</p>
                              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Rs. {snapshot.financials.avgCollectionPerCandidate.toLocaleString()}</h3>
                           </div>
                           <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><TrendingUp size={16} /></div>
                        </div>
                        <div className="mt-3 text-xs font-medium text-blue-600">Average from paying candidates</div>
                     </div>

                     <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                           <div>
                              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Collection Rate</p>
                              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{snapshot.financials.totalCandidates > 0 ? Math.round((snapshot.financials.candidatesWithPayments / snapshot.financials.totalCandidates) * 100) : 0}%</h3>
                           </div>
                           <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Users size={16} /></div>
                        </div>
                        <div className="mt-3">
                           <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${snapshot.financials.totalCandidates > 0 ? (snapshot.financials.candidatesWithPayments / snapshot.financials.totalCandidates) * 100 : 0}%` }} />
                           </div>
                        </div>
                     </div>

                     <div className="bg-white p-6 rounded-xl border border-amber-200 shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                           <div>
                              <p className="text-amber-500 text-[10px] font-bold uppercase tracking-widest mb-1">Pending Receivables</p>
                              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Rs. {snapshot.financials.pendingCollection.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                           </div>
                           <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><AlertTriangle size={16} /></div>
                        </div>
                        <div className="mt-3 text-xs font-medium text-amber-600">Outstanding invoices & balances</div>
                     </div>
                  </div>

                  {/* Payment Type Breakdown + Top Collectors */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                     <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h4 className="font-bold text-slate-800 mb-5 flex items-center gap-2">
                           <DollarSign size={18} className="text-emerald-500" /> Collection Breakdown by Payment Type
                        </h4>
                        {snapshot.financials.paymentTypeBreakdown.length > 0 ? (
                           <div className="space-y-3">
                              {snapshot.financials.paymentTypeBreakdown.map((pt, i) => {
                                 const maxAmount = snapshot.financials.paymentTypeBreakdown[0]?.total || 1;
                                 const pct = Math.round((pt.total / maxAmount) * 100);
                                 const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-indigo-500', 'bg-cyan-500', 'bg-teal-500'];
                                 const barColor = colors[i % colors.length];
                                 return (
                                    <div key={pt.type} className="group">
                                       <div className="flex items-center justify-between mb-1.5">
                                          <div className="flex items-center gap-2">
                                             <span className={`w-2.5 h-2.5 rounded-full ${barColor}`} />
                                             <span className="text-sm font-medium text-slate-700 capitalize">{pt.type.toLowerCase()}</span>
                                             <span className="text-[10px] text-slate-400 font-mono">({pt.count} entries)</span>
                                          </div>
                                          <span className="text-sm font-bold text-slate-900">Rs. {pt.total.toLocaleString()}</span>
                                       </div>
                                       <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                          <div className={`h-full ${barColor} rounded-full transition-all group-hover:opacity-80`} style={{ width: `${pct}%` }} />
                                       </div>
                                    </div>
                                 );
                              })}
                           </div>
                        ) : (
                           <div className="text-center py-12 text-slate-400">
                              <DollarSign size={32} className="mx-auto mb-2 opacity-30" />
                              <p className="text-sm">No advance payments recorded yet</p>
                           </div>
                        )}
                     </div>

                     <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                           <TrendingUp size={18} className="text-blue-500" /> Top Paying Candidates
                        </h4>
                        {snapshot.financials.topCollectors.length > 0 ? (
                           <div className="space-y-3">
                              {snapshot.financials.topCollectors.map((tc, i) => (
                                 <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-[10px] font-bold flex-shrink-0">
                                       {i + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                       <p className="text-sm font-medium text-slate-700 truncate capitalize" title={tc.name}>{tc.name.toLowerCase()}</p>
                                       <p className="text-[10px] text-slate-400 uppercase">{tc.stage}</p>
                                    </div>
                                    <span className="text-sm font-bold text-slate-800 whitespace-nowrap">Rs. {tc.total.toLocaleString()}</span>
                                 </div>
                              ))}
                           </div>
                        ) : (
                           <div className="text-center py-8 text-slate-400">
                              <p className="text-sm">No payment data yet</p>
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Revenue by Stage Chart */}
                  <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                     <div className="flex justify-between items-center mb-6">
                        <h4 className="font-bold text-slate-800 flex items-center gap-2">
                           <DollarSign size={18} className="text-emerald-500" /> Collections by Workflow Stage
                        </h4>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">
                           Cumulative Paid (Rs.)
                        </div>
                     </div>
                     <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={snapshot.financials.revenueByStage}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis
                                 dataKey="name"
                                 axisLine={false}
                                 tickLine={false}
                                 fontSize={10}
                                 tick={{ fill: '#64748b' }}
                                 interval={0}
                                 angle={-45}
                                 textAnchor="end"
                                 height={60}
                              />
                              <YAxis
                                 axisLine={false}
                                 tickLine={false}
                                 fontSize={10}
                                 tick={{ fill: '#64748b' }}
                                 tickFormatter={(value) => value >= 1000000 ? `Rs.${(value / 1000000).toFixed(1)}M` : value >= 1000 ? `Rs.${(value / 1000).toFixed(0)}k` : `Rs.${value}`}
                              />
                              <RechartsTooltip
                                 contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                                 formatter={(value: number) => [`Rs. ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Collected']}
                              />
                              <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                           </BarChart>
                        </ResponsiveContainer>
                     </div>
                  </div>

                  {/* Recent Payments Activity */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                     <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Activity size={18} className="text-emerald-500" /> Recent Payment Activity
                     </h4>
                     {snapshot.financials.recentPayments.length > 0 ? (
                        <div className="overflow-x-auto">
                           <table className="w-full text-sm">
                              <thead>
                                 <tr className="border-b-2 border-slate-100 text-xs font-bold text-slate-500 uppercase">
                                    <th className="text-left py-3 px-2">Candidate</th>
                                    <th className="text-left py-3 px-2">Payment Type</th>
                                    <th className="text-right py-3 px-2">Amount</th>
                                    <th className="text-left py-3 px-2">Date</th>
                                 </tr>
                              </thead>
                              <tbody>
                                 {snapshot.financials.recentPayments.map((rp, i) => (
                                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50">
                                       <td className="py-2.5 px-2 font-medium text-slate-700 truncate max-w-[150px] sm:max-w-[250px] capitalize" title={rp.candidateName}>{rp.candidateName.toLowerCase()}</td>
                                       <td className="py-2.5 px-2">
                                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-medium text-[10px] uppercase tracking-wider rounded whitespace-nowrap border border-emerald-100">{rp.type}</span>
                                       </td>
                                       <td className="py-2.5 px-2 text-right font-semibold text-slate-800 whitespace-nowrap tabular-nums tracking-tight">Rs. {rp.amount.toLocaleString()}</td>
                                       <td className="py-2.5 px-2 text-slate-500 text-xs whitespace-nowrap">{new Date(rp.date).toLocaleDateString()}</td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     ) : (
                        <div className="text-center py-8 text-slate-400">
                           <p className="text-sm">No recent payments to display</p>
                        </div>
                     )}
                  </div>

                  <div className="p-4 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-center">
                     <p className="text-sm text-slate-500">
                        <ShieldCheck size={14} className="inline mr-1 text-slate-400" />
                        All values are in <strong>Sri Lankan Rupees (Rs.)</strong>. Data sourced from Advance Payment Tracking records on each candidate.
                     </p>
                  </div>
               </div>
            )}
            {activeTab === 'assistant' && <AIPlayground snapshot={snapshot} initialPrompt={aiPrompt} />}
         </div>
      </div>
   );
};

export default IntelligenceEngine;