import React, { Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Breadcrumbs from './components/Breadcrumbs';
import Login from './components/Login';
import { AuthProvider } from './context/AuthContext';
import { CandidateProvider } from './context/CandidateContext';
import ProtectedRoute from './components/ProtectedRoute';

import ErrorBoundary from './components/ErrorBoundary';
import { logger } from './services/loggerService';

// Lazy load route components for code splitting
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const CandidateList = React.lazy(() => import('./components/CandidateList'));
const CandidateDetail = React.lazy(() => import('./components/CandidateDetail'));
const JobBoard = React.lazy(() => import('./components/JobBoard'));
const TeamChat = React.lazy(() => import('./components/TeamChat'));
const PipelineBoard = React.lazy(() => import('./components/PipelineBoard'));
const IntelligenceEngine = React.lazy(() => import('./components/IntelligenceEngine'));
const Settings = React.lazy(() => import('./components/Settings'));
const PartnerManager = React.lazy(() => import('./components/PartnerManager'));
const FinanceLedger = React.lazy(() => import('./components/FinanceLedger'));
const DigitalApplicationForm = React.lazy(() => import('./components/DigitalApplicationForm'));
const QuickAddForm = React.lazy(() => import('./components/QuickAddForm'));
// DevTools removed
const ComponentShowcase = React.lazy(() => import('./components/ComponentShowcase'));

// Loading fallback component
const PageLoader = () => {
  React.useEffect(() => {
    logger.debug('PageLoader mounted');
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <p className="mt-2 text-sm text-slate-600">Loading...</p>
      </div>
    </div>
  );
};

import MobileNav from './components/MobileNav';

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <CandidateProvider>
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
                        <main className="flex-1 overflow-y-auto pb-safe md:pb-0">
                          <div className="pb-24 md:pb-0 min-h-full">
                            <Suspense fallback={<PageLoader />}>
                              <Routes>
                                <Route path="/" element={<Dashboard />} />
                                <Route path="/analytics" element={<IntelligenceEngine />} />
                                <Route path="/pipeline" element={<PipelineBoard />} />
                                <Route path="/candidates" element={<CandidateList />} />
                                <Route path="/candidates/:id" element={<CandidateDetail />} />
                                <Route path="/candidates/quick-add" element={<QuickAddForm />} />
                                <Route path="/applications/new" element={<DigitalApplicationForm />} />
                                <Route path="/jobs" element={<JobBoard />} />
                                <Route path="/partners/:id?" element={<PartnerManager />} />
                                <Route path="/finance" element={<FinanceLedger />} />
                                <Route path="/team-chat" element={<TeamChat />} />
                                <Route path="/settings" element={<Settings />} />
                                <Route path="/showcase" element={<ComponentShowcase />} />
                                <Route path="*" element={<Navigate to="/" replace />} />
                              </Routes>
                            </Suspense>
                          </div>
                        </main>
                        <MobileNav />
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </HashRouter>
        </CandidateProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};


export default App;