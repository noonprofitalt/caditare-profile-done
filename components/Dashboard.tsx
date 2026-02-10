import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Users, Briefcase, CheckCircle, TrendingUp, Globe, AlertTriangle, Clock, Activity } from 'lucide-react';
import { getDashboardMetrics } from '../services/analyticsService';
import { Link } from 'react-router-dom';

const data = [
  { name: 'Jan', placements: 4 },
  { name: 'Feb', placements: 7 },
  { name: 'Mar', placements: 5 },
  { name: 'Apr', placements: 12 },
  { name: 'May', placements: 10 },
  { name: 'Jun', placements: 15 },
  { name: 'Jul', placements: 8 },
];

const Dashboard: React.FC = () => {
  const metrics = getDashboardMetrics();

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Operational Command Center</h2>
        <p className="text-slate-500">Real-time monitoring of agency performance and process health.</p>
      </div>

      {/* Alert Banner */}
      {metrics.delayedCases > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-red-700">
            <AlertTriangle className="animate-pulse" />
            <div>
              <p className="font-bold">Attention Required: {metrics.delayedCases} SLA Breaches Detected</p>
              <p className="text-sm text-red-600">Candidates have exceeded the maximum allowed time in their current stage.</p>
            </div>
          </div>
          <Link to="/candidates" className="px-4 py-2 bg-white border border-red-200 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-100">
            View Delayed Cases
          </Link>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Total Active</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-2">{metrics.totalCandidates}</h3>
            <p className="text-xs text-green-600 flex items-center mt-2 font-medium">
              <Activity size={14} className="mr-1" /> System Online
            </p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Users size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Delayed Cases</p>
            <h3 className="text-3xl font-bold text-red-600 mt-2">{metrics.delayedCases}</h3>
            <p className="text-xs text-red-500 flex items-center mt-2 font-medium">
              <Clock size={14} className="mr-1" /> {((metrics.delayedCases / metrics.totalCandidates) * 100).toFixed(1)}% of total
            </p>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-lg">
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Placements</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-2">{metrics.placements}</h3>
            <p className="text-xs text-slate-400 flex items-center mt-2">
              Lifetime total
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Active Jobs</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-2">{metrics.activeJobs}</h3>
            <p className="text-xs text-blue-600 flex items-center mt-2 font-medium">
              High Demand
            </p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <Briefcase size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">Monthly Throughput</h3>
            <select className="text-sm border-slate-200 rounded-lg text-slate-500 focus:ring-blue-500">
              <option>Last 6 Months</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="placements" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Alerts */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={20} /> Critical Delays
          </h3>
          <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
            {metrics.recentAlerts.length > 0 ? (
              metrics.recentAlerts.map((c) => (
                <Link to={`/candidates/${c.id}`} key={c.id} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100 hover:bg-red-100 transition-colors cursor-pointer group">
                  <img src={c.avatarUrl} className="w-8 h-8 rounded-full" alt="User" />
                  <div>
                    <p className="text-sm font-bold text-red-900 group-hover:underline">{c.name}</p>
                    <p className="text-xs text-red-700">Stuck in <span className="font-semibold">{c.stage}</span></p>
                  </div>
                  <span className="text-xs text-red-600 font-bold ml-auto bg-white px-2 py-1 rounded">Overdue</span>
                </Link>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm">No critical delays found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;