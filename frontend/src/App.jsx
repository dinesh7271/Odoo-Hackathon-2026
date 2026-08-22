import React, { useState, useEffect } from 'react';

function App() {
  const [backendStatus, setBackendStatus] = useState('loading'); // 'loading' | 'reachable' | 'offline'
  const [backendData, setBackendData] = useState(null);
  const [latency, setLatency] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkHealth = async () => {
    setIsRefreshing(true);
    setBackendStatus('loading');
    setError(null);
    const startTime = performance.now();
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

      const response = await fetch(`${apiUrl}/api/health`, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      const endTime = performance.now();
      
      setLatency(Math.round(endTime - startTime));
      setBackendData(data);
      setBackendStatus('reachable');
    } catch (err) {
      console.error('Backend health check failed:', err);
      setError(err.name === 'AbortError' ? 'Connection timed out (3s)' : err.message || 'Failed to connect to backend server');
      setBackendStatus('offline');
      setBackendData(null);
      setLatency(null);
    } finally {
      setLastChecked(new Date().toLocaleTimeString());
      setTimeout(() => setIsRefreshing(false), 600); // Keep rotation smooth
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-hidden relative font-sans">
      {/* Decorative ambient blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-fuchsia-500/10 blur-[120px] pointer-events-none" />

      {/* Header */}
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
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Hackathon Skeleton
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-6 z-10">
        <div className="w-full max-w-xl">
          {/* Dashboard Greeting Card */}
          <div className="backdrop-blur-md bg-slate-900/40 border border-slate-900 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-slate-800">
            <div className="absolute top-0 right-0 h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            
            <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 mb-2">
              Welcome to Dayflow
            </h1>
            <p className="text-slate-400 text-sm md:text-base mb-8">
              This is the initial React + FastAPI boilerplate for our Human Resource Management System. Check the backend connection status below.
            </p>

            {/* Health Status Block */}
            <div className="bg-slate-950/60 rounded-2xl p-6 border border-slate-900/60 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  {/* Status Indicator Dot */}
                  <div className="relative flex h-4 w-4">
                    {backendStatus === 'loading' && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    )}
                    {backendStatus === 'reachable' && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    )}
                    {backendStatus === 'offline' && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    )}
                    <span className={`relative inline-flex rounded-full h-4 w-4 ${
                      backendStatus === 'loading' ? 'bg-amber-500' :
                      backendStatus === 'reachable' ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}></span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-200">Backend Connection</h3>
                    <p className="text-xs text-slate-500 font-mono">
                      Last check: {lastChecked || 'Never'}
                    </p>
                  </div>
                </div>

                <div>
                  <button
                    onClick={checkHealth}
                    disabled={isRefreshing}
                    className="cursor-pointer inline-flex items-center justify-center space-x-2 px-4 py-2 text-xs font-semibold rounded-xl text-slate-200 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <svg
                      className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : 'text-slate-400'}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3"
                      />
                    </svg>
                    <span>Check Status</span>
                  </button>
                </div>
              </div>

              {/* Status details */}
              <div className="mt-6 pt-6 border-t border-slate-900/60 grid grid-cols-2 gap-4">
                <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-900/40">
                  <span className="text-[10px] font-mono text-slate-500 block uppercase tracking-wider mb-1">Status</span>
                  <span className={`text-sm font-bold capitalize ${
                    backendStatus === 'loading' ? 'text-amber-400' :
                    backendStatus === 'reachable' ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {backendStatus}
                  </span>
                </div>
                <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-900/40">
                  <span className="text-[10px] font-mono text-slate-500 block uppercase tracking-wider mb-1">Latency</span>
                  <span className="text-sm font-bold text-slate-200">
                    {latency !== null ? `${latency} ms` : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Diagnostic data / error */}
              {backendStatus === 'reachable' && backendData && (
                <div className="mt-4 bg-slate-900/20 p-4 rounded-xl border border-slate-900/30">
                  <span className="text-[10px] font-mono text-slate-500 block uppercase tracking-wider mb-1.5">API Response Payload</span>
                  <pre className="text-xs text-indigo-300 font-mono overflow-x-auto p-2 bg-slate-950/40 rounded border border-slate-900/60">
                    {JSON.stringify(backendData, null, 2)}
                  </pre>
                </div>
              )}

              {backendStatus === 'offline' && (
                <div className="mt-4 bg-rose-950/10 p-4 rounded-xl border border-rose-900/20">
                  <span className="text-[10px] font-mono text-rose-500 block uppercase tracking-wider mb-1">Error Message</span>
                  <p className="text-xs text-rose-400 font-mono">
                    {error || 'Connection refused. Ensure backend is running.'}
                  </p>
                </div>
              )}
            </div>

            {/* Diagnostics instructions for hackathon setup */}
            <div className="text-xs text-slate-500 leading-relaxed bg-slate-900/20 p-4 rounded-xl border border-slate-900/20">
              <span className="font-semibold text-slate-400 block mb-1">Setup Instructions:</span>
              <ul className="list-disc pl-4 space-y-1">
                <li>Run FastAPI backend inside <code className="bg-slate-950 px-1 py-0.5 rounded text-indigo-300">backend/</code> using: <code className="text-slate-300">uvicorn app.main:app --reload --port 8000</code></li>
                <li>Verify endpoint at <a href="http://localhost:8000/api/health" target="_blank" rel="noreferrer" className="text-indigo-400 underline hover:text-indigo-300">http://localhost:8000/api/health</a></li>
                <li>Or simply run the entire stack via <code className="text-slate-300">docker-compose up --build</code></li>
              </ul>
            </div>
          </div>
        </div>
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

export default App;
