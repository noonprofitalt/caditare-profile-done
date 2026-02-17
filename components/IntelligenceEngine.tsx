import React, { useState, useEffect } from 'react';
import { ReportingService } from '../services/reportingService';
import { SystemSnapshot } from '../types';
import {
   BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
   LayoutDashboard, Activity, Users, AlertTriangle, TrendingUp, DollarSign,
   Download, RefreshCw, Server, BrainCircuit, ShieldCheck, MessageSquare, ShieldAlert
} from 'lucide-react';
import AIPlayground from './AIPlayground';

const IntelligenceEngine: React.FC = () => {
   const [snapshot, setSnapshot] = useState<SystemSnapshot | null>(null);
   const [activeTab, setActiveTab] = useState<'dashboard' | 'workflow' | 'staff' | 'financial' | 'assistant'>('dashboard');
   const [isLoading, setIsLoading] = useState(false);

   const refreshData = async () => {
      setIsLoading(true);
      const data = await ReportingService.getSystemSnapshot();
      setSnapshot(data);
      setIsLoading(false);

   };

   useEffect(() => {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      refreshData();
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
      <div className="space-y-6 animate-in fade-in duration-500">

         {/* Top Level KPI Cards */}
         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
               <div className="flex justify-between items-start mb-4">
                  <div>
                     <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Est. Revenue</p>
                     <h3 className="text-3xl font-bold text-slate-800">${snapshot.kpi.revenueEst.toLocaleString()}</h3>
                  </div>
                  <DollarSign className="text-green-500 bg-green-50 p-1.5 rounded-lg" size={32} />
               </div>
               <p className="text-xs text-green-600 font-medium">Verified Collections</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
               <div className="flex justify-between items-start mb-4">
                  <div>
                     <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Critical Bottlenecks</p>
                     <h3 className="text-3xl font-bold text-red-600">{snapshot.kpi.criticalDelays}</h3>
                  </div>
                  <AlertTriangle className="text-red-500 bg-red-50 p-1.5 rounded-lg" size={32} />
               </div>
               <p className="text-xs text-red-500 font-medium">SLA Breaches Detected</p>
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
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
         <h3 className="text-xl font-bold text-slate-800 mb-2">Detailed Workflow Analytics</h3>
         <p className="text-slate-500 mb-8">Process mining data regarding stage duration and efficiency.</p>

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

         <div className="mt-8">
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
   );

   const renderStaffMetrics = () => (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {snapshot.staffMetrics.map((staff, idx) => (
            <div key={staff.name} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
               <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-500">
                  {staff.name.charAt(0)}
               </div>
               <div className="flex-1">
                  <h4 className="font-bold text-lg text-slate-800">{staff.name}</h4>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                     <div>
                        <p className="text-xs text-slate-400 uppercase">Actions</p>
                        <p className="font-bold">{staff.actionsPerformed}</p>
                     </div>
                     <div>
                        <p className="text-xs text-slate-400 uppercase">Focus Area</p>
                        <p className="font-bold text-blue-600">{staff.mostActiveStage}</p>
                     </div>
                     <div>
                        <p className="text-xs text-slate-400 uppercase">Last Active</p>
                        <p className="font-mono text-xs">{new Date(staff.lastActive).toLocaleDateString()}</p>
                     </div>
                  </div>
               </div>
               <div className="text-2xl font-bold text-slate-200">#{idx + 1}</div>
            </div>
         ))}
      </div>
   );

   return (
      <div className="p-8 max-w-7xl mx-auto space-y-8">
         {/* Header */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
               <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <TrendingUp size={20} />
                  <span className="text-xs font-bold uppercase tracking-wider">Operational Analytics Suite</span>
               </div>
               <h2 className="text-3xl font-bold text-slate-900">System Analytics Engine</h2>
               <p className="text-slate-500">Global performance reporting, financial outlook, and process mapping.</p>
            </div>
            <div className="flex items-center gap-3">
               <span className="text-xs text-slate-400 font-mono">Last updated: {new Date(snapshot.timestamp).toLocaleTimeString()}</span>
               <button
                  onClick={refreshData}
                  disabled={isLoading}
                  className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
               >
                  <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
               </button>
               <button
                  onClick={handleExportReport}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 shadow-lg"
               >
                  <Download size={18} /> Export Full Report
               </button>
            </div>
         </div>

         {/* Tabs */}
         <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-full md:w-fit">
            {[
               { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
               { id: 'workflow', label: 'Workflow Analytics', icon: Server },
               { id: 'staff', label: 'Staff Performance', icon: Users },
               { id: 'financial', label: 'Financials', icon: DollarSign },
            ].map(tab => (
               <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'dashboard' | 'workflow' | 'staff' | 'financial' | 'assistant')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
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
               <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                     <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Collected</p>
                           <div className="p-1.5 bg-green-50 text-green-600 rounded-lg"><DollarSign size={16} /></div>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900">${snapshot.financials.totalCollected.toLocaleString()}</h3>
                        <div className="mt-2 text-xs text-green-600 font-medium flex items-center gap-1">
                           <TrendingUp size={12} /> Cash on hand
                        </div>
                     </div>

                     <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending (Invoiced)</p>
                           <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg"><Activity size={16} /></div>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900">${snapshot.financials.pendingCollection.toLocaleString()}</h3>
                        <div className="mt-2 text-xs text-orange-600 font-medium">Outstanding receivables</div>
                     </div>

                     <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-sm bg-blue-50/30">
                        <div className="flex justify-between items-start mb-2">
                           <p className="text-xs font-bold text-blue-500 uppercase tracking-wider">Projected (30 Days)</p>
                           <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><TrendingUp size={16} /></div>
                        </div>
                        <h3 className="text-2xl font-bold text-blue-900">${snapshot.financials.projectedRevenue.toLocaleString()}</h3>
                        <div className="mt-2 text-xs text-blue-600 font-medium">Estimated from high-prob leads</div>
                     </div>

                     <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Pipeline Value</p>
                           <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg"><LayoutDashboard size={16} /></div>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900">${snapshot.financials.pipelineValue.toLocaleString()}</h3>
                        <div className="mt-2 text-xs text-slate-400 font-medium">Full potential of active funnel</div>
                     </div>
                  </div>

                  <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                     <div className="flex justify-between items-center mb-6">
                        <h4 className="font-bold text-slate-800 flex items-center gap-2">
                           <DollarSign size={18} className="text-green-500" /> Revenue Capture by Stage
                        </h4>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">
                           Cumulative Paid
                        </div>
                     </div>
                     <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={snapshot.financials.revenueByStage}>
                              <defs>
                                 <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                 </linearGradient>
                              </defs>
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
                                 tickFormatter={(value) => `$${value}`}
                              />
                              <RechartsTooltip
                                 contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                 formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                              />
                              <Area
                                 type="monotone"
                                 dataKey="value"
                                 stroke="#10b981"
                                 strokeWidth={3}
                                 fillOpacity={1}
                                 fill="url(#colorValue)"
                              />
                           </AreaChart>
                        </ResponsiveContainer>
                     </div>
                  </div>

                  <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                     <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <TrendingUp size={18} className="text-blue-500" /> Revenue Realization Funnel
                     </h4>
                     <div className="space-y-8">
                        <div>
                           <div className="flex justify-between items-end mb-2">
                              <div>
                                 <p className="text-sm font-bold text-slate-700">Realized Revenue</p>
                                 <p className="text-xs text-slate-500">Payments already in the bank</p>
                              </div>
                              <span className="text-sm font-bold text-green-600">
                                 {Math.round((snapshot.financials.totalCollected / snapshot.financials.pipelineValue) * 100)}%
                              </span>
                           </div>
                           <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                 className="h-full bg-green-500 rounded-full transition-all duration-1000"
                                 style={{ width: `${(snapshot.financials.totalCollected / snapshot.financials.pipelineValue) * 100}%` }}
                              />
                           </div>
                        </div>

                        <div>
                           <div className="flex justify-between items-end mb-2">
                              <div>
                                 <p className="text-sm font-bold text-slate-700">Projected Growth (Short Term)</p>
                                 <p className="text-xs text-slate-500">Expected revenue from candidates near departure</p>
                              </div>
                              <span className="text-sm font-bold text-blue-600">
                                 +${snapshot.financials.projectedRevenue.toLocaleString()}
                              </span>
                           </div>
                           <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                 className="h-full bg-blue-500 rounded-full transition-all duration-1000 delay-300"
                                 style={{ width: `${((snapshot.financials.totalCollected + snapshot.financials.projectedRevenue) / snapshot.financials.pipelineValue) * 100}%` }}
                              />
                           </div>
                        </div>
                     </div>

                     <div className="mt-12 p-4 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-center">
                        <p className="text-sm text-slate-500">
                           <ShieldCheck size={14} className="inline mr-1 text-slate-400" />
                           Forecast is based on a conservative <strong>$2,500 average revenue</strong> per successful placement.
                        </p>
                     </div>
                  </div>
               </div>
            )}
         </div>
      </div>
   );
};

export default IntelligenceEngine;