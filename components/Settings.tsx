import React, { useState } from 'react';
import { 
  Building2, 
  Shield, 
  Bell, 
  Download, 
  Save, 
  Globe, 
  Mail, 
  Phone,
  Database,
  Users,
  CheckCircle2,
  GitBranch,
  Terminal,
  Copy,
  AlertCircle
} from 'lucide-react';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'agency' | 'security' | 'data'>('agency');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Settings & Configuration</h2>
        <p className="text-slate-500">Manage agency profile, system preferences, and data backups.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Settings Navigation */}
        <div className="md:col-span-1 space-y-2">
          <button 
            onClick={() => setActiveTab('agency')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'agency' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Building2 size={18} /> Agency Profile
          </button>
          <button 
             onClick={() => setActiveTab('security')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'security' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Shield size={18} /> Security & Roles
          </button>
          <button 
             onClick={() => setActiveTab('data')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'data' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Database size={18} /> Data Management
          </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 space-y-6">
          
          {/* AGENCY PROFILE TAB */}
          {activeTab === 'agency' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-in fade-in slide-in-from-right-4 duration-300">
               <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Agency Details</h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-2">Agency Name</label>
                   <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input type="text" defaultValue="GlobalWorkforce Solutions" className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                   </div>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-2">License Number</label>
                   <div className="relative">
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input type="text" defaultValue="FEA-2024-8892" className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                   </div>
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-2">Contact Email</label>
                   <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input type="email" defaultValue="admin@globalworkforce.com" className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                   </div>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-2">Support Phone</label>
                   <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input type="text" defaultValue="+1 (555) 123-4567" className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                   </div>
                 </div>
               </div>

               <div>
                   <label className="block text-sm font-medium text-slate-700 mb-2">Headquarters Address</label>
                   <textarea rows={3} defaultValue="123 Business Bay, Tower A, Dubai, UAE" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"></textarea>
               </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-in fade-in slide-in-from-right-4 duration-300">
               <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Security & Access Control</h3>
               
               <div className="space-y-4 mb-8">
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Users size={20} /></div>
                       <div>
                          <h4 className="font-bold text-slate-800">Two-Factor Authentication</h4>
                          <p className="text-xs text-slate-500">Require 2FA for all admin accounts</p>
                       </div>
                    </div>
                    <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                        <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-blue-600 right-0"/>
                        <label htmlFor="toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-blue-600 cursor-pointer"></label>
                    </div>
                 </div>

                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Globe size={20} /></div>
                       <div>
                          <h4 className="font-bold text-slate-800">IP Whitelisting</h4>
                          <p className="text-xs text-slate-500">Only allow access from office IP ranges</p>
                       </div>
                    </div>
                    <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                        <input type="checkbox" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-slate-300"/>
                        <label className="toggle-label block overflow-hidden h-6 rounded-full bg-slate-300 cursor-pointer"></label>
                    </div>
                 </div>
               </div>

               <h4 className="font-bold text-sm text-slate-800 mb-4">Active Sessions</h4>
               <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-400 uppercase bg-slate-50">
                     <tr>
                        <th className="px-4 py-2">Device</th>
                        <th className="px-4 py-2">Location</th>
                        <th className="px-4 py-2">Last Active</th>
                        <th className="px-4 py-2">Status</th>
                     </tr>
                  </thead>
                  <tbody>
                     <tr className="border-b border-slate-100">
                        <td className="px-4 py-3 font-medium">Chrome on Windows</td>
                        <td className="px-4 py-3">Colombo, LK</td>
                        <td className="px-4 py-3 text-green-600">Current Session</td>
                        <td className="px-4 py-3"><span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span></td>
                     </tr>
                     <tr>
                        <td className="px-4 py-3 font-medium">Safari on iPhone</td>
                        <td className="px-4 py-3">Dubai, UAE</td>
                        <td className="px-4 py-3 text-slate-500">2 hours ago</td>
                        <td className="px-4 py-3"><button className="text-red-600 text-xs hover:underline">Revoke</button></td>
                     </tr>
                  </tbody>
               </table>
            </div>
          )}

          {/* DATA TAB (The solution for the user) */}
          {activeTab === 'data' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-in fade-in slide-in-from-right-4 duration-300">
               <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Data Management & Version Control</h3>
               
               {/* DOWNLOAD INSTRUCTION */}
               <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-8 flex items-start gap-4">
                  <div className="bg-white p-2 rounded-lg shadow-sm text-blue-600">
                    <Download size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-900 mb-1">Step 1: Download Source Code</h4>
                    <p className="text-sm text-blue-700 mb-4 leading-relaxed">
                       To sync with GitHub, you must first download this project to your local computer. 
                       Click the <strong>Download</strong> button in your AI Studio header, or use the button below to get the ZIP.
                    </p>
                    <button className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md transition-all text-sm flex items-center gap-2">
                       <Download size={16} /> Download .ZIP
                    </button>
                  </div>
               </div>

               {/* GITHUB COMMANDS */}
               <div className="bg-slate-900 rounded-xl p-6 mb-8 text-white relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-5">
                       <GitBranch size={150} />
                   </div>
                   <div className="relative z-10">
                       <div className="flex items-center justify-between mb-4">
                           <h4 className="font-bold text-lg flex items-center gap-2">
                               <Terminal size={20} className="text-green-400" /> 
                               GitHub Sync Commands
                           </h4>
                           <span className="text-[10px] bg-slate-800 px-2 py-1 rounded border border-slate-700 text-slate-400">
                               For Local Terminal
                           </span>
                       </div>
                       
                       <p className="text-slate-400 text-sm mb-6 max-w-lg">
                           After unzipping the project, open your terminal in that folder and run these commands to push your code to GitHub.
                       </p>

                       <div className="space-y-4">
                           <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                               <div className="bg-slate-900 px-3 py-1.5 border-b border-slate-800 flex justify-between items-center">
                                   <span className="text-[10px] text-slate-500 font-mono">1. Initialize & Stage</span>
                                   <Copy size={12} className="text-slate-600 hover:text-white cursor-pointer" />
                               </div>
                               <div className="p-3 font-mono text-xs space-y-1">
                                   <p className="text-green-400">git init</p>
                                   <p className="text-green-400">git add .</p>
                               </div>
                           </div>

                           <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                               <div className="bg-slate-900 px-3 py-1.5 border-b border-slate-800 flex justify-between items-center">
                                   <span className="text-[10px] text-slate-500 font-mono">2. Commit</span>
                                   <Copy size={12} className="text-slate-600 hover:text-white cursor-pointer" />
                               </div>
                               <div className="p-3 font-mono text-xs">
                                   <p className="text-green-400">git commit -m "Initial commit of Admin Portal"</p>
                               </div>
                           </div>

                           <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                               <div className="bg-slate-900 px-3 py-1.5 border-b border-slate-800 flex justify-between items-center">
                                   <span className="text-[10px] text-slate-500 font-mono">3. Connect & Push</span>
                                   <Copy size={12} className="text-slate-600 hover:text-white cursor-pointer" />
                               </div>
                               <div className="p-3 font-mono text-xs space-y-1">
                                   <p className="text-slate-500 italic"># Replace [URL] with your repo link</p>
                                   <p className="text-green-400">git branch -M main</p>
                                   <p className="text-green-400">git remote add origin https://github.com/username/repo.git</p>
                                   <p className="text-green-400">git push -u origin main</p>
                               </div>
                           </div>
                       </div>
                       
                       <div className="mt-4 flex items-start gap-2 text-xs text-yellow-500 bg-yellow-500/10 p-3 rounded border border-yellow-500/20">
                          <AlertCircle size={14} className="shrink-0 mt-0.5" />
                          <span>
                            <strong>Note:</strong> Do not run these commands in C:\Windows\System32. 
                            Navigate to your extracted project folder first (e.g., <code>cd Documents/MyProject</code>).
                          </span>
                       </div>
                   </div>
               </div>

               {/* Existing Backup Buttons */}
               <h4 className="font-bold text-slate-800 mb-4 text-sm">Local Data Backups</h4>
               <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer group">
                     <div>
                        <h4 className="font-bold text-slate-800 group-hover:text-blue-700">Candidate Database Backup</h4>
                        <p className="text-xs text-slate-500">Last backup: 12 hours ago</p>
                     </div>
                     <button className="text-slate-400 group-hover:text-blue-600"><Download size={20} /></button>
                  </div>
               </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-end pt-4 border-t border-slate-200">
             <button 
               onClick={handleSave}
               className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-all active:scale-95"
             >
                {isSaved ? <CheckCircle2 size={18} /> : <Save size={18} />}
                {isSaved ? 'Changes Saved' : 'Save Changes'}
             </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Settings;