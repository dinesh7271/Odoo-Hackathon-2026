import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { EmployeeLeaveView } from './components/EmployeeLeaveView';
import { AuthModal } from './components/AuthModal';
import { IconShield, IconUser, IconCalendar } from './components/Icons';

import { HRLeaveView } from './components/HRLeaveView';

function AppContent() {
  const { isAuthenticated, role, user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState(() => (role === 'hr' ? 'hr' : 'employee'));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-x-hidden relative font-sans">
      {/* Decorative ambient background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/10 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-500/10 blur-[140px] pointer-events-none" />

      {/* Top Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Container */}
      <main className="flex-grow p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full z-10">
        {!isAuthenticated ? (
          <div className="py-8 md:py-12 flex flex-col items-center justify-center">
            <div className="text-center max-w-xl mx-auto mb-8">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-3">
                <span>Hackathon 2026</span>
                <span>•</span>
                <span>Leave & Time-Off System</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400 tracking-tight">
                Dayflow HRMS
              </h1>
              <p className="text-sm md:text-base text-slate-400 mt-2">
                Automated Leave Application, Approval Workflow, and Time-Off Tracking with Real-Time Status Synchronization.
              </p>
            </div>

            <AuthModal />
          </div>
        ) : (
          <div>
            {activeTab === 'employee' ? (
              <EmployeeLeaveView />
            ) : (
              <HRLeaveView />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 px-6 py-4 bg-slate-950/80 backdrop-blur-md z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-xs text-slate-600">
            &copy; {new Date().getFullYear()} Dayflow HRMS. Built for Leave & Time-Off Management.
          </p>
          <div className="flex items-center space-x-4 text-xs font-mono text-slate-500">
            <span>FastAPI + PostgreSQL + React</span>
            <span>•</span>
            <span className="text-indigo-400">Phase 2 Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
