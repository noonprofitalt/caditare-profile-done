import React, { useState } from 'react';
import { MOCK_JOBS } from '../services/mockData';
import { JobStatus } from '../types';
import { MapPin, DollarSign, Clock, Plus, Briefcase } from 'lucide-react';

const JobBoard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  
  // Create Job Form State
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobLocation, setNewJobLocation] = useState('');
  const [newJobRequirements, setNewJobRequirements] = useState('');
  const [description, setDescription] = useState('');

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Job Board</h2>
          <p className="text-slate-500">Manage foreign employment opportunities.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'list' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
          >
            All Jobs
          </button>
          <button 
             onClick={() => setActiveTab('create')}
             className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'create' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-200'}`}
          >
            <Plus size={16} /> Post New Job
          </button>
        </div>
      </div>

      {activeTab === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_JOBS.map((job) => (
            <div key={job.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Briefcase size={24} />
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  job.status === JobStatus.OPEN ? 'bg-green-100 text-green-700' :
                  job.status === JobStatus.CLOSED ? 'bg-slate-100 text-slate-600' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {job.status}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-slate-800 mb-1">{job.title}</h3>
              <p className="text-sm text-slate-500 font-medium mb-4">{job.company}</p>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin size={16} className="text-slate-400" /> {job.location}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <DollarSign size={16} className="text-slate-400" /> {job.salaryRange}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock size={16} className="text-slate-400" /> {job.type}
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">Posted: {job.postedDate}</span>
                <button className="text-sm font-semibold text-blue-600 hover:text-blue-800">Details &rarr;</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Create Job View */
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-3xl mx-auto">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Create New Job Posting</h3>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Job Title</label>
                <input 
                  type="text" 
                  value={newJobTitle}
                  onChange={(e) => setNewJobTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Senior Civil Engineer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                <input 
                  type="text" 
                  value={newJobLocation}
                  onChange={(e) => setNewJobLocation(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Dubai, UAE"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Key Requirements</label>
              <input 
                type="text" 
                value={newJobRequirements}
                onChange={(e) => setNewJobRequirements(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g., 5 years exp, AutoCAD, Safety Cert"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Job Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={8}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                placeholder="Enter full job description here..."
              ></textarea>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Cancel</button>
                <button className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm">Post Job</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobBoard;