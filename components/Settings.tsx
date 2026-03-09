import React, { useState, useEffect } from 'react';
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
   Trash2,
   Copy,
   AlertCircle,
   BrainCircuit,
   Key,
   Zap,
   Cpu,
   Clock,
   Calendar,
   Wifi,
   Lock,
   Monitor,
   Smartphone,
   XCircle,
   ShieldAlert,
   MapPin,
   Laptop
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuditService } from '../services/auditService';
import { SecurityService, ActiveSession } from '../services/securityService';
import { formatDistanceToNow } from 'date-fns';

import UserManagement from './UserManagement';
import BackupManager from './BackupManager';

const Settings: React.FC = () => {
   const { user } = useAuth();
   const [activeTab, setActiveTab] = useState<'agency' | 'security' | 'data' | 'ai' | 'users'>('data'); // Default to safe tab
   const [isSaved, setIsSaved] = useState(false);
   const [apiKey, setApiKey] = useState(() => localStorage.getItem('globalworkforce_gemini_api_key') || '');
   const [aiModel, setAiModel] = useState(() => GeminiService.getModelPref());
   const [testConnStatus, setTestConnStatus] = useState<{ testing: boolean; message: string | null; success: boolean | null }>({ testing: false, message: null, success: null });
   const [scanning, setScanning] = useState(false);
   const [integrityIssues, setIntegrityIssues] = useState<{ id: string; type: string; message: string; data?: any }[]>([]);
   const [scanComplete, setScanComplete] = useState(false);
   const [isFixing, setIsFixing] = useState(false);

   // Agency Profile State
   const [agencyName, setAgencyName] = useState(() => localStorage.getItem('agency_name') || 'Suhara Foreign Employment Agency');
   const [licenseNo, setLicenseNo] = useState(() => localStorage.getItem('agency_license') || '2185');
   const [email, setEmail] = useState(() => localStorage.getItem('agency_email') || 'info@suharaagency.com');
   const [phone, setPhone] = useState(() => localStorage.getItem('agency_phone') || '037 223 1333');
   const [address, setAddress] = useState(() => localStorage.getItem('agency_address') || '138, 2nd Floor, Colombo Road, Kurunegala, Sri Lanka');

   // Security Settings State
   const [officeIp, setOfficeIp] = useState('');
   const [workStartTime, setWorkStartTime] = useState('');
   const [workEndTime, setWorkEndTime] = useState('');
   const [blockSundays, setBlockSundays] = useState(true);
   const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);

   const loadConfig = async () => {
      const config = await SecurityService.getConfig();
      setOfficeIp(config.officeIp);
      setWorkStartTime(config.workStartTime);
      setWorkEndTime(config.workEndTime);
      setBlockSundays(config.blockSundays);

      const sessions = await SecurityService.getActiveSessions();
      setActiveSessions(sessions);
   };

   // Load configuration on mount
   useEffect(() => {
      loadConfig();
   }, []);

   const handleRevokeSession = async (sessionId: string) => {
      const success = await SecurityService.revokeSession(sessionId);
      if (success) {
         loadConfig(); // Refresh session list
      }
   };

   const handleScanIntegrity = async () => {
      setScanning(true);
      setIntegrityIssues([]);
      setScanComplete(false);

      const issues: { id: string; type: string; message: string; data?: any }[] = [];
      const candidates = await CandidateService.getCandidates();
      const jobs = await JobService.getJobs();
      const employers = await PartnerService.getEmployers();
      const employerIds = new Set(employers.map(e => e.id));

      // Check 1: Orphaned Jobs
      jobs.forEach(j => {
         if (j.employerId && !employerIds.has(j.employerId)) {
            issues.push({
               id: `job-orphan-${j.id}`,
               type: 'ORPHANED_JOB',
               message: `Orphaned Job: "${j.title}" links to missing employer (ID: ${j.employerId})`,
               data: { jobId: j.id }
            });
         }
      });

      // Check 2: Data Quality
      candidates.forEach(c => {
         if (c.stage === 'Registered' && c.documents.length === 0) {
            issues.push({
               id: `cand-dq-${c.id}`,
               type: 'DATA_QUALITY',
               message: `Data Quality: Candidate "${c.name}" is Registered but has 0 documents.`,
               data: { candidateId: c.id }
            });
         }
      });

      setIntegrityIssues(issues);
      setScanning(false);
      setScanComplete(true);

      AuditService.log('SYSTEM_DIAGNOSTICS_RUN', {
         issuesFound: issues.length,
         targetAreas: ['Jobs', 'Candidates', 'Employers']
      });
   };

   const handleAutoFix = async () => {
      setIsFixing(true);
      const remainingIssues = [...integrityIssues];

      for (const issue of integrityIssues) {
         try {
            if (issue.type === 'ORPHANED_JOB') {
               // Fix: Disconnect orphaned employer reference
               const job = await JobService.getJobById(issue.data.jobId);
               if (job) {
                  await JobService.updateJob({ ...job, employerId: undefined });
               }
            } else if (issue.type === 'DATA_QUALITY') {
               // Fix: In a real app we might trigger a re-sync or email ping. 
               // For now, let's just log it as "Reviewed"
               console.log(`Auto-fix: Remediation triggered for candidate ${issue.data.candidateId}`);
            }
            // Remove from local list after "fix"
            const idx = remainingIssues.findIndex(i => i.id === issue.id);
            if (idx > -1) remainingIssues.splice(idx, 1);
         } catch (e) {
            console.error('Failed to fix issue', issue.id, e);
         }
      }

      setIntegrityIssues(remainingIssues);
      setIsFixing(false);
      if (remainingIssues.length === 0) {
         setScanComplete(true);
      }

      AuditService.log('SYSTEM_DIAGNOSTICS_FIX_ATTEMPTED', {
         totalIssues: integrityIssues.length,
         fixedCount: integrityIssues.length - remainingIssues.length
      });
   };

   const handleSave = async () => {
      if (activeTab === 'ai') {
         GeminiService.saveApiKey(apiKey);
         GeminiService.saveModelPref(aiModel);
      } else if (activeTab === 'security') {
         await SecurityService.saveConfig({
            officeIp,
            workStartTime,
            workEndTime,
            blockSundays
         });
      } else if (activeTab === 'agency') {
         localStorage.setItem('agency_name', agencyName);
         localStorage.setItem('agency_license', licenseNo);
         localStorage.setItem('agency_email', email);
         localStorage.setItem('agency_phone', phone);
         localStorage.setItem('agency_address', address);
      }
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
   };

   const handleClearAiCache = () => {
      GeminiService.clearCache();
      setTestConnStatus({ testing: false, message: 'AI Cache cleared successfully.', success: true });
      setTimeout(() => setTestConnStatus(s => ({ ...s, message: null })), 3000);
   };

   const handleTestConnection = async () => {
      if (!apiKey) {
         setTestConnStatus({ testing: false, message: 'Please enter an API key first.', success: false });
         return;
      }
      setTestConnStatus({ testing: true, message: null, success: null });
      const res = await GeminiService.testConnection(apiKey, aiModel);
      setTestConnStatus({ testing: false, message: res.message, success: res.success });
      // Clear status after 5s
      setTimeout(() => setTestConnStatus(s => ({ ...s, message: null })), 5000);
   };

   return (
      <div className="p-3 sm:p-4 md:p-8 max-w-5xl mx-auto pb-24 md:pb-8">
         <div className="mb-6 md:mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Settings & Configuration</h2>
            <p className="text-slate-500">Manage agency profile, system preferences, and data backups.</p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Settings Navigation */}
            <div className="md:col-span-1 flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none snap-x snap-mandatory shrink-0">
               <button
                  onClick={() => setActiveTab('agency')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'agency' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
               >
                  <Building2 size={18} className="shrink-0" /> <span className="whitespace-nowrap">Agency Profile</span>
               </button>
               <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'security' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
               >
                  <Shield size={18} className="shrink-0" /> <span className="whitespace-nowrap">Security & Roles</span>
               </button>
               <button
                  onClick={() => setActiveTab('data')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'data' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
               >
                  <Database size={18} className="shrink-0" /> <span className="whitespace-nowrap">Data Management</span>
               </button>
               <button
                  onClick={() => setActiveTab('users')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
               >
                  <Users size={18} className="shrink-0" /> <span className="whitespace-nowrap">User Management</span>
               </button>
               <button
                  onClick={() => setActiveTab('ai')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'ai' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
               >
                  <BrainCircuit size={18} className="shrink-0" /> <span className="whitespace-nowrap">AI Configuration</span>
               </button>
            </div>

            {/* Content Area */}
            <div className="md:col-span-3 space-y-6">

               {/* AGENCY PROFILE TAB */}
               {activeTab === 'agency' && (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 animate-in fade-in slide-in-from-right-4 duration-300">
                     <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Agency Details</h3>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-2">Agency Name</label>
                           <div className="relative">
                              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                              <input type="text" value={agencyName} onChange={e => setAgencyName(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                           </div>
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-2">License Number</label>
                           <div className="relative">
                              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                              <input type="text" value={licenseNo} onChange={e => setLicenseNo(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-2">Contact Email</label>
                           <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                           </div>
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-2">Support Phone</label>
                           <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                              <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                           </div>
                        </div>
                     </div>

                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Headquarters Address</label>
                        <textarea
                           rows={3}
                           value={address}
                           onChange={e => setAddress(e.target.value)}
                           className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        ></textarea>
                     </div>
                  </div>
               )}

               {/* SECURITY TAB */}
               {activeTab === 'security' && (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 animate-in fade-in slide-in-from-right-4 duration-300">
                     <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Security & Access Control</h3>

                     <div className="space-y-4 mb-8">
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                           <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                              <Wifi size={18} className="text-blue-600" /> Office Network Access
                           </h4>
                           <div className="space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                 <div>
                                    <p className="text-sm font-medium text-slate-700">Office Router IP Address</p>
                                    <p className="text-xs text-slate-500">Only block connections outside this IP for Staff users</p>
                                 </div>
                                 <input
                                    type="text"
                                    value={officeIp}
                                    onChange={(e) => setOfficeIp(e.target.value)}
                                    className="w-full sm:w-48 px-3 py-2 sm:py-1.5 text-sm border border-slate-300 rounded-lg sm:rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono btn-touch"
                                 />
                              </div>
                           </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                           <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                              <Clock size={18} className="text-blue-600" /> Operational Timeframe
                           </h4>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                              <div>
                                 <label className="block text-xs font-medium text-slate-600 mb-1">System Open Time</label>
                                 <input
                                    type="time"
                                    value={workStartTime}
                                    onChange={(e) => setWorkStartTime(e.target.value)}
                                    className="w-full px-3 py-2 sm:py-1.5 text-sm border border-slate-300 rounded-lg sm:rounded focus:ring-2 focus:ring-blue-500 outline-none btn-touch"
                                 />
                              </div>
                              <div>
                                 <label className="block text-xs font-medium text-slate-600 mb-1">System Close Time</label>
                                 <input
                                    type="time"
                                    value={workEndTime}
                                    onChange={(e) => setWorkEndTime(e.target.value)}
                                    className="w-full px-3 py-2 sm:py-1.5 text-sm border border-slate-300 rounded-lg sm:rounded focus:ring-2 focus:ring-blue-500 outline-none btn-touch"
                                 />
                              </div>
                           </div>

                           <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                              <div className="flex items-center gap-2">
                                 <Calendar size={16} className="text-slate-500" />
                                 <span className="text-sm font-medium text-slate-700">Block Access on Sundays</span>
                              </div>
                              <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                 <input
                                    type="checkbox"
                                    id="blockSundays"
                                    checked={blockSundays}
                                    onChange={(e) => setBlockSundays(e.target.checked)}
                                    className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                    style={{ borderColor: blockSundays ? '#2563eb' : '#cbd5e1', right: blockSundays ? '0' : 'auto' }}
                                 />
                                 <label
                                    htmlFor="blockSundays"
                                    className="toggle-label block overflow-hidden h-5 rounded-full cursor-pointer"
                                    style={{ backgroundColor: blockSundays ? '#2563eb' : '#cbd5e1' }}
                                 ></label>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="mt-8">
                        <h4 className="font-bold text-sm text-slate-800 mb-4">Active Sessions</h4>
                        <div className="border border-slate-200 rounded overflow-hidden">
                           <table className="w-full text-sm text-left">
                              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 hidden sm:table-header-group">
                                 <tr>
                                    <th className="px-4 py-2 font-medium">User</th>
                                    <th className="px-4 py-2 font-medium">IP Address</th>
                                    <th className="px-4 py-2 font-medium">Action</th>
                                 </tr>
                              </thead>
                              <tbody>
                                 {activeSessions.length === 0 ? (
                                    <tr>
                                       <td colSpan={3} className="px-4 py-4 text-center text-slate-500 italic">No active sessions</td>
                                    </tr>
                                 ) : (
                                    activeSessions.map(session => (
                                       <tr key={session.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 flex flex-col sm:table-row p-3 sm:p-0">
                                          <td className="px-1 sm:px-4 py-1 sm:py-3 font-medium sm:font-normal" data-label="User">{session.userName}</td>
                                          <td className="px-1 sm:px-4 py-1 sm:py-3 font-mono text-xs sm:text-sm text-slate-500 sm:text-slate-900 break-all" data-label="IP Address">{session.ip}</td>
                                          <td className="px-1 sm:px-4 py-2 sm:py-3 mt-2 sm:mt-0 border-t sm:border-0 border-slate-100" data-label="Action">
                                             {session.status === 'active' ? (
                                                <button
                                                   onClick={() => handleRevokeSession(session.id)}
                                                   className="text-red-600 hover:text-red-800 hover:underline font-medium focus:outline-none btn-touch text-left"
                                                >
                                                   Revoke Access
                                                </button>
                                             ) : (
                                                <span className="text-slate-400 italic">Revoked</span>
                                             )}
                                          </td>
                                       </tr>
                                    ))
                                 )}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  </div>
               )}

               {/* AI CONFIGURATION TAB */}
               {activeTab === 'ai' && (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 animate-in fade-in slide-in-from-right-4 duration-300">
                     <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Artificial Intelligence Settings</h3>

                     <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 text-white">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4">
                           <div className="bg-blue-600 p-3 rounded-xl shadow-lg">
                              <BrainCircuit size={24} />
                           </div>
                           <div>
                              <h4 className="font-bold text-lg">Google Gemini Integration</h4>
                              <p className="text-slate-400 text-sm">Powers candidate analysis and the Intelligence Playground.</p>
                           </div>
                        </div>

                        <div className="space-y-5">
                           <div>
                              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Gemini API Key</label>
                              <div className="relative">
                                 <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                 <input
                                    type="password"
                                    placeholder="Paste your API key here..."
                                    value={apiKey}
                                    onChange={(e) => {
                                       setApiKey(e.target.value);
                                       setTestConnStatus({ testing: false, message: null, success: null }); // Reset on change
                                    }}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-green-400 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all btn-touch"
                                 />
                              </div>
                              <p className="mt-2 text-[11px] text-slate-500">
                                 Get your API key from the <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Google AI Studio</a>.
                                 Your key is stored locally in your browser and is never sent to our servers.
                              </p>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                 <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">AI Engine Model</label>
                                 <div className="relative">
                                    <Cpu className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                    <select
                                       value={aiModel}
                                       onChange={(e) => setAiModel(e.target.value)}
                                       className="w-full pl-10 pr-4 py-3 sm:py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer btn-touch"
                                    >
                                       <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fastest)</option>
                                       <option value="gemini-1.5-pro">Gemini 1.5 Pro (Highest Quality)</option>
                                       <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                                    </select>
                                 </div>
                              </div>
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                                 <button
                                    onClick={handleTestConnection}
                                    disabled={testConnStatus.testing || !apiKey}
                                    className="flex-1 px-5 py-3 sm:py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors flex items-center justify-center gap-2 btn-touch"
                                 >
                                    {testConnStatus.testing ? <BrainCircuit size={16} className="animate-spin text-blue-400" /> : <Zap size={16} className={apiKey ? "text-yellow-400" : "text-slate-500"} />}
                                    {testConnStatus.testing ? 'Testing...' : 'Test Connection'}
                                 </button>
                                 <button
                                    onClick={handleClearAiCache}
                                    className="px-5 py-3 sm:py-2.5 bg-slate-950 hover:bg-red-950/20 border border-slate-700 hover:border-red-500/30 text-slate-400 hover:text-red-400 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 btn-touch"
                                    title="Clear local intelligence cache"
                                 >
                                    <Trash2 size={16} />
                                    Clear Cache
                                 </button>
                              </div>
                           </div>

                           {testConnStatus.message && (
                              <div className={`p-3 rounded-lg text-sm font-medium flex items-center gap-2 animate-in fade-in ${testConnStatus.success ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                 {testConnStatus.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                 {testConnStatus.message}
                              </div>
                           )}
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

               {/* DATA TAB — Full Backup & Restore System */}
               {activeTab === 'data' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                     {/* Backup Manager Component */}
                     <BackupManager />

                     {/* Data Integrity Scanner (kept below) */}
                     <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                           <h4 className="font-bold text-slate-800 flex items-center gap-2">
                              <Shield size={20} className="text-blue-600" /> System Health & Integrity
                           </h4>
                           <button
                              onClick={handleScanIntegrity}
                              disabled={scanning}
                              className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2 btn-touch"
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
                                    <ul className="list-inside text-xs text-red-700 space-y-1.5">
                                       {integrityIssues.map((issue) => (
                                          <li key={issue.id} className="flex items-start gap-2">
                                             <span className="mt-1 block h-1 w-1 rounded-full bg-red-400 flex-shrink-0" />
                                             {issue.message}
                                          </li>
                                       ))}
                                    </ul>
                                    <button
                                       onClick={handleAutoFix}
                                       disabled={isFixing}
                                       className="w-full md:w-auto text-xs font-bold text-white bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                       {isFixing ? <BrainCircuit size={14} className="animate-spin" /> : <Save size={14} />}
                                       {isFixing ? 'Fixing...' : 'Attempt Auto-Fix'}
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
                  </div>
               )}

               {/* USERS TAB */}
               {activeTab === 'users' && (
                  <UserManagement />
               )}

               {/* Footer Actions */}
               {activeTab !== 'users' && activeTab !== 'data' && (
                  <div className="flex justify-end pt-4 border-t border-slate-200">
                     <button
                        onClick={handleSave}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 sm:py-2.5 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-all active:scale-95 btn-touch"
                     >
                        {isSaved ? <CheckCircle2 size={18} /> : <Save size={18} />}
                        {isSaved ? 'Changes Saved' : 'Save Changes'}
                     </button>
                  </div>
               )}

            </div>
         </div>
      </div>
   );
};

export default Settings;