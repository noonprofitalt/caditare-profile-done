import React, { useState } from 'react';
import { GeminiService } from '../services/geminiService';
import { CandidateService } from '../services/candidateService';
import { PartnerService } from '../services/partnerService';
import { JobService } from '../services/jobService';
import {
   Building2,
   Shield,
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
   AlertCircle,
   BrainCircuit,
   Key
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import UserManagement from './UserManagement';

const Settings: React.FC = () => {
   const { user } = useAuth();
   const isAdmin = user?.role === 'Admin';

   const [activeTab, setActiveTab] = useState<'agency' | 'security' | 'data' | 'ai' | 'users'>('data'); // Default to safe tab
   const [isSaved, setIsSaved] = useState(false);
   const [apiKey, setApiKey] = useState(() => localStorage.getItem('globalworkforce_gemini_api_key') || '');
   const [scanning, setScanning] = useState(false);
   const [integrityIssues, setIntegrityIssues] = useState<string[]>([]);
   const [scanComplete, setScanComplete] = useState(false);

   const handleSave = () => {
      if (activeTab === 'ai') {
         GeminiService.saveApiKey(apiKey);
      }
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
   };

   const handleScanIntegrity = async () => {
      setScanning(true);
      setIntegrityIssues([]);
      setScanComplete(false);

      const issues: string[] = [];
      const candidates = await CandidateService.getCandidates();
      const jobs = await JobService.getJobs();
      const employers = await PartnerService.getEmployers();
      const employerIds = new Set(employers.map(e => e.id));

      // Check 1: Orphaned Jobs
      jobs.forEach(j => {
         if (j.employerId && !employerIds.has(j.employerId)) {
            issues.push(`Orphaned Job: "${j.title}" links to missing employer (ID: ${j.employerId})`);
         }
      });

      // Check 2: Stuck Candidates (Mock > 30 days)
      // In a real app we would diff dates. Here we just mock found issues if none exist to show UI.
      if (issues.length === 0) {
         // Check for valid docs vs status mismatch
         candidates.forEach(c => {
            if (c.stage === 'Registered' && c.documents.length === 0) {
               issues.push(`Data Quality: Candidate "${c.name}" is Registered but has 0 documents.`);
            }
         });
      }

      setIntegrityIssues(issues);
      setScanning(false);
      setScanComplete(true);
   };

   return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto pb-24 md:pb-8">
         <div className="mb-6 md:mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Settings & Configuration</h2>
            <p className="text-slate-500">Manage agency profile, system preferences, and data backups.</p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Settings Navigation */}
            <div className="md:col-span-1 space-y-2">
               {isAdmin && (
                  <button
                     onClick={() => setActiveTab('agency')}
                     className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'agency' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                     <Building2 size={18} /> Agency Profile
                  </button>
               )}
               {isAdmin && (
                  <button
                     onClick={() => setActiveTab('security')}
                     className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'security' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                     <Shield size={18} /> Security & Roles
                  </button>
               )}
               <button
                  onClick={() => setActiveTab('data')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'data' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
               >
                  <Database size={18} /> Data Management
               </button>
               {isAdmin && (
                  <button
                     onClick={() => setActiveTab('users')}
                     className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                     <Users size={18} /> User Management
                  </button>
               )}
               <button
                  onClick={() => setActiveTab('ai')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'ai' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
               >
                  <BrainCircuit size={18} /> AI Configuration
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
                              <input type="text" defaultValue="Suhara Foreign Employment Agency" className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                           </div>
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-2">License Number</label>
                           <div className="relative">
                              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                              <input type="text" defaultValue="2185" className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-2">Contact Email</label>
                           <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                              <input type="email" defaultValue="info@suharaagency.com | cv@suharaagency.com, suharainternal@gmail.com" className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                           </div>
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-2">Support Phone</label>
                           <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                              <input type="text" defaultValue="037 223 1333" className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                           </div>
                        </div>
                     </div>

                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Headquarters Address</label>
                        <textarea rows={3} defaultValue="138, 2nd Floor, Colombo Road, Kurunegala, Sri Lanka" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"></textarea>
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
                              <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-blue-600 right-0" />
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
                              <input type="checkbox" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-slate-300" />
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

               {/* AI CONFIGURATION TAB */}
               {activeTab === 'ai' && (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-in fade-in slide-in-from-right-4 duration-300">
                     <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Artificial Intelligence Settings</h3>

                     <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 mb-8 text-white">
                        <div className="flex items-center gap-4 mb-4">
                           <div className="bg-blue-600 p-3 rounded-xl shadow-lg">
                              <BrainCircuit size={24} />
                           </div>
                           <div>
                              <h4 className="font-bold text-lg">Google Gemini Integration</h4>
                              <p className="text-slate-400 text-sm">Powers candidate analysis and the Intelligence Playground.</p>
                           </div>
                        </div>

                        <div className="space-y-4">
                           <div>
                              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Gemini API Key</label>
                              <div className="relative">
                                 <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                 <input
                                    type="password"
                                    placeholder="Paste your API key here..."
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-green-400 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                 />
                              </div>
                              <p className="mt-2 text-[11px] text-slate-500">
                                 Get your API key from the <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Google AI Studio</a>.
                                 Your key is stored locally in your browser and is never sent to our servers.
                              </p>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-6">
                        <div className="flex items-start gap-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                           <div className="bg-white p-2 rounded-lg text-blue-600 shadow-sm"><Shield size={20} /></div>
                           <div>
                              <h4 className="font-bold text-blue-900 text-sm">Secure Implementation</h4>
                              <p className="text-xs text-blue-700 leading-relaxed">
                                 We use the <code>@google/genai</code> client-side SDK. All AI processing happens directly between your browser and Google's API.
                              </p>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="p-4 border border-slate-200 rounded-xl space-y-2">
                              <h5 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                 <CheckCircle2 size={16} className="text-green-500" /> Candidate Analysis
                              </h5>
                              <p className="text-xs text-slate-500">Auto-summarize resumes and assess candidate fit for specific roles.</p>
                           </div>
                           <div className="p-4 border border-slate-200 rounded-xl space-y-2">
                              <h5 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                 <CheckCircle2 size={16} className="text-green-500" /> Smart Suggestions
                              </h5>
                              <p className="text-xs text-slate-500">Get AI-powered recommendations for next steps in the recruitment pipeline.</p>
                           </div>
                        </div>
                     </div>
                  </div>
               )}

               {/* DATA TAB (The solution for the user) */}
               {activeTab === 'data' && (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-in fade-in slide-in-from-right-4 duration-300">
                     <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Data Management & Version Control</h3>

                     {/* DATA INTEGRITY SCANNER */}
                     <div className="bg-white border border-slate-200 rounded-xl p-6 mb-8 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                           <h4 className="font-bold text-slate-800 flex items-center gap-2">
                              <Shield size={20} className="text-blue-600" /> System Health & Integrity
                           </h4>
                           <button
                              onClick={handleScanIntegrity}
                              disabled={scanning}
                              className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                           >
                              {scanning ? <BrainCircuit className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                              {scanning ? 'Scanning...' : 'Run Diagnostics'}
                           </button>
                        </div>

                        {!scanComplete && !scanning && (
                           <p className="text-sm text-slate-500">Run a diagnostic scan to identify orphaned records, data inconsistencies, and potential logic errors.</p>
                        )}

                        {scanComplete && (
                           <div className="animate-in fade-in duration-300">
                              {integrityIssues.length > 0 ? (
                                 <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                                    <h5 className="font-bold text-red-800 text-sm flex items-center gap-2">
                                       <AlertCircle size={16} /> Issues Found ({integrityIssues.length})
                                    </h5>
                                    <ul className="list-disc list-inside text-xs text-red-700 space-y-1">
                                       {integrityIssues.map((issue, i) => (
                                          <li key={i}>{issue}</li>
                                       ))}
                                    </ul>
                                    <button className="text-xs font-bold text-white bg-red-600 px-3 py-1.5 rounded hover:bg-red-700">
                                       Attempt Auto-Fix
                                    </button>
                                 </div>
                              ) : (
                                 <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                                    <CheckCircle2 size={20} className="text-green-600" />
                                    <div>
                                       <p className="font-bold text-green-800 text-sm">System Healthy</p>
                                       <p className="text-xs text-green-600">No data integrity issues found.</p>
                                    </div>
                                 </div>
                              )}
                           </div>
                        )}
                     </div>

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

                     <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer group">
                        <div>
                           <h4 className="font-bold text-slate-800 group-hover:text-blue-700">Financial Records Backup</h4>
                           <p className="text-xs text-slate-500">Last backup: 2 days ago</p>
                        </div>
                        <button className="text-slate-400 group-hover:text-blue-600"><Download size={20} /></button>
                     </div>
                  </div>
               )}

               {/* USERS TAB */}
               {activeTab === 'users' && (
                  <UserManagement />
               )}

               {/* Footer Actions */}
               {activeTab !== 'users' && (
                  <div className="flex justify-end pt-4 border-t border-slate-200">
                     <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-all active:scale-95"
                     >
                        {isSaved ? <CheckCircle2 size={18} /> : <Save size={18} />}
                        {isSaved ? 'Changes Saved' : 'Save Changes'}
                     </button>
                  </div>
               )}

            </div>
         </div>
      </div >
   );
};

export default Settings;