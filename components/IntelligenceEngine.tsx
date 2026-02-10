import React, { useState, useEffect } from 'react';
import { ReportingService } from '../services/reportingService';
import { SystemSnapshot } from '../types';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { 
  LayoutDashboard, Activity, Users, AlertTriangle, TrendingUp, DollarSign, 
  FileText, Download, RefreshCw, Server, BrainCircuit, ShieldCheck 
} from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const IntelligenceEngine: React.FC = () => {
  const [snapshot, setSnapshot] = useState<SystemSnapshot | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'workflow' | 'staff' | 'financial'>('dashboard');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setIsLoading(true);
    // Simulate calculation delay for "Heavy ETL" feel
    setTimeout(() => {
        setSnapshot(ReportingService.getSystemSnapshot());
        setIsLoading(false);
    }, 600);
  };

  const handleExportReport = () => {
     const csvContent = ReportingService.generateFullSystemCSV();
     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
     const link = document.createElement("a");
     const url = URL.createObjectURL(blob);
     link.setAttribute("href", url);
     link.setAttribute("download", `GlobalWorkforce_System_Report_${new Date().toISOString().slice(0,10)}.csv`);
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  if (!snapshot) return <div className="p-8 text-center">Initializing Intelligence Engine...</div>;

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
                    <RechartsTooltip cursor={{fill: 'transparent'}} />
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
                        <p className={`text-sm font-bold ${
                           b.status === 'Critical' ? 'text-red-600' : 
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
                       <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                       <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
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
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                             b.status === 'Critical' ? 'bg-red-100 text-red-700' :
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
              <BrainCircuit size={20} />
              <span className="text-xs font-bold uppercase tracking-wider">Enterprise Edition</span>
           </div>
           <h2 className="text-3xl font-bold text-slate-900">Intelligence Engine</h2>
           <p className="text-slate-500">System-wide reporting, financial aggregation, and predictive analytics.</p>
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
               onClick={() => setActiveTab(tab.id as any)}
               className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
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
            <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
               <DollarSign size={64} className="mx-auto text-green-200 mb-4" />
               <h3 className="text-2xl font-bold text-slate-800">Financial Intelligence Module</h3>
               <p className="text-slate-500 mb-6">Aggregate view of collected payments: <span className="font-bold text-green-600">${snapshot.financials.totalCollected.toLocaleString()}</span></p>
               <p className="text-sm text-slate-400">Detailed ledger integration required for full breakdown.</p>
            </div>
         )}
      </div>
    </div>
  );
};

export default IntelligenceEngine;