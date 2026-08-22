import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import EmployeeDashboard from './components/EmployeeDashboard';
import HRDashboard from './components/HRDashboard';

function AppContent() {
  const { user, loading, API_BASE } = useAuth();
  const [activeView, setActiveView] = useState('login'); // 'login' | 'register'
  const [backendStatus, setBackendStatus] = useState('loading'); // 'loading' | 'online' | 'offline'

  // Query backend health check to verify backend is reachable
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/health`);
        if (response.ok) {
          setBackendStatus('online');
        } else {
          setBackendStatus('offline');
        }
      } catch (err) {
        setBackendStatus('offline');
      }
    };
    checkHealth();
    // Run health check every 10 seconds to keep connection status active
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, [API_BASE]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center relative font-sans">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <span className="text-xs font-mono mt-4 text-slate-500 uppercase tracking-widest">Resolving Dayflow Profile...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-hidden relative font-sans">
      {/* Decorative ambient blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-fuchsia-500/10 blur-[120px] pointer-events-none" />

      {/* App Header */}
      <header className="border-b border-slate-900 backdrop-blur-md bg-slate-950/50 sticky top-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="text-white font-black text-xl">D</span>
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">Dayflow</span>
              <span className="text-[10px] block font-mono text-slate-500 uppercase tracking-widest leading-none mt-0.5">HRM System</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Live Backend Connection Indicator */}
            <div className="flex items-center space-x-2 bg-slate-900/60 border border-slate-800/80 px-3.5 py-1.5 rounded-full text-xs">
              <span className="relative flex h-2 w-2">
                {backendStatus === 'loading' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>}
                {backendStatus === 'online' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                {backendStatus === 'offline' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  backendStatus === 'loading' ? 'bg-amber-500' :
                  backendStatus === 'online' ? 'bg-emerald-500' : 'bg-rose-500'
                }`}></span>
              </span>
              <span className="text-slate-400 text-[10px] font-mono font-semibold uppercase tracking-wider">
                Backend: {backendStatus}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="flex-grow flex items-center justify-center p-6 z-10">
        {!user ? (
          activeView === 'login' ? (
            <Login onViewChange={setActiveView} />
          ) : (
            <Register onViewChange={setActiveView} />
          )
        ) : user.role === 'hr' ? (
          <HRDashboard />
        ) : (
          <EmployeeDashboard />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 px-6 py-4 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
          <p className="text-xs text-slate-600">
            &copy; {new Date().getFullYear()} Dayflow HRM System. Built for Hackathon 2026.
          </p>
          <div className="flex space-x-4 text-xs font-mono text-slate-500">
            <span>Stack: FastAPI + React + Tailwind v4</span>
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
