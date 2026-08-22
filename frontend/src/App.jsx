import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/common/Toast';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { EmployeeProfileView } from './components/profile/EmployeeProfileView';
import { HREmployeeDirectory } from './components/profile/HREmployeeDirectory';
import { Clock, Shield, Sparkles, User, Users, Calendar, ArrowRight } from 'lucide-react';

function MainLayout() {
  const { user, employee, isHR, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-200">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center animate-pulse shadow-lg shadow-indigo-500/30">
            <span className="text-white font-black text-2xl">D</span>
          </div>
          <p className="text-sm font-semibold text-slate-400">Authenticating Dayflow HRMS Session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative selection:bg-indigo-500 selection:text-white">
      {/* Decorative ambient background glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[140px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[140px] pointer-events-none" />
      <div className="fixed top-[40%] left-[30%] w-[400px] h-[400px] rounded-full bg-pink-600/5 blur-[160px] pointer-events-none" />

      {/* Top Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col lg:flex-row gap-6 relative z-10">
        
        {/* Left Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          
          {/* Tab 1: My Profile */}
          {activeTab === 'profile' && (
            <EmployeeProfileView />
          )}

          {/* Tab 2: HR Employee Directory (HR Only) */}
          {activeTab === 'directory' && isHR && (
            <HREmployeeDirectory />
          )}

          {/* Tab 3: Attendance (Placeholder preview for Phase 3) */}
          {(activeTab === 'attendance' || activeTab === 'hr-attendance') && (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 backdrop-blur-xl shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-6 border-b border-slate-800">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {activeTab === 'hr-attendance' ? 'Company Attendance Management' : 'Attendance & Time Tracking'}
                    </h2>
                    <p className="text-xs text-slate-400">
                      Phase 1 backend endpoints are online. Phase 3 will launch the interactive check-in/out widgets.
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-mono font-bold">
                  Phase 3 Target
                </span>
              </div>

              {/* Status Preview Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Today's Date</span>
                  <span className="text-base font-bold text-white mt-1 block">
                    {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Supported Statuses</span>
                  <span className="text-xs font-semibold text-emerald-400 mt-1 block">
                    Present • Absent • Half-day • Leave
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Backend APIs</span>
                  <span className="text-xs font-mono text-indigo-300 mt-1 block">
                    /api/attendance/check-in & /me
                  </span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-950/50 border border-indigo-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Interactive Attendance UI in Phase 3
                  </h4>
                  <p className="text-xs text-slate-400">
                    Will feature live stopwatch clock-in/out button, weekly hours calendar, and HR daily aggregate metrics.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('profile')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>View Profile First</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-900 px-6 py-4 bg-slate-950/90 backdrop-blur-xl mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-500">
          <span>&copy; {new Date().getFullYear()} Dayflow HRMS. Built with React + Vite + Tailwind + FastAPI.</span>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span>FastAPI: <span className="text-emerald-400 font-semibold">Active</span></span>
            <span>JWT Auth: <span className="text-indigo-400 font-semibold">Protected</span></span>
            <span>Phase 2: <span className="text-purple-400 font-semibold">Profile Complete</span></span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </ToastProvider>
  );
}
