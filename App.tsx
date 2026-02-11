import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import CandidateList from './components/CandidateList';
import CandidateDetail from './components/CandidateDetail';
import JobBoard from './components/JobBoard';
import TeamChat from './components/TeamChat';
import KanbanBoard from './components/KanbanBoard';
import IntelligenceEngine from './components/IntelligenceEngine';
import Settings from './components/Settings';
import PartnerManager from './components/PartnerManager';
import FinanceLedger from './components/FinanceLedger';
import Breadcrumbs from './components/Breadcrumbs';
import Login from './components/Login';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DigitalApplicationForm from './components/DigitalApplicationForm';

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <div className="flex min-h-screen bg-slate-50 relative overflow-hidden">
                  {/* Overlay for mobile sidebar */}
                  {isSidebarOpen && (
                    <div
                      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
                      onClick={() => setIsSidebarOpen(false)}
                    />
                  )}

                  <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

                  <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 lg:ml-64">
                    <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
                    <div className="lg:ml-0">
                      <Breadcrumbs />
                    </div>
                    <main className="flex-1 overflow-y-auto">
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/intelligence" element={<IntelligenceEngine />} />
                        <Route path="/pipeline" element={<KanbanBoard />} />
                        <Route path="/candidates" element={<CandidateList />} />
                        <Route path="/candidates/:id" element={<CandidateDetail />} />
                        <Route path="/applications/new" element={<DigitalApplicationForm />} />
                        <Route path="/jobs" element={<JobBoard />} />
                        <Route path="/partners/:id?" element={<PartnerManager />} />
                        <Route path="/finance" element={<FinanceLedger />} />
                        <Route path="/team-chat" element={<TeamChat />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;