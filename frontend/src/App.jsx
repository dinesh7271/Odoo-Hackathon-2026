import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/common/Toast';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { EmployeeProfileView } from './components/profile/EmployeeProfileView';
import { HREmployeeDirectory } from './components/profile/HREmployeeDirectory';
import { EmployeeAttendance } from './components/attendance/EmployeeAttendance';
import { HRAttendanceDashboard } from './components/attendance/HRAttendanceDashboard';

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

          {/* Tab 3: Employee Attendance & Time Tracking */}
          {activeTab === 'attendance' && (
            <EmployeeAttendance />
          )}

          {/* Tab 4: HR Attendance Dashboard (HR Only) */}
          {activeTab === 'hr-attendance' && isHR && (
            <HRAttendanceDashboard />
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
            <span>All 3 Phases: <span className="text-purple-400 font-semibold">Complete</span></span>
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
