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

const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 ml-64 flex flex-col">
          <Header />
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/intelligence" element={<IntelligenceEngine />} />
              <Route path="/pipeline" element={<KanbanBoard />} />
              <Route path="/candidates" element={<CandidateList />} />
              <Route path="/candidates/:id" element={<CandidateDetail />} />
              <Route path="/jobs" element={<JobBoard />} />
              <Route path="/team-chat" element={<TeamChat />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </HashRouter>
  );
};

export default App;