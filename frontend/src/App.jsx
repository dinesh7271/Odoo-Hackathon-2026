import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth, DEMO_ACCOUNTS } from './context/AuthContext';
import { ToastProvider } from './components/common/Toast';

// Layout
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';

// Auth / Login
import { AuthModal } from './components/AuthModal';

// Profile & Directory
import { EmployeeProfileView } from './components/profile/EmployeeProfileView';
import { HREmployeeDirectory } from './components/profile/HREmployeeDirectory';

// Attendance
import { EmployeeAttendance } from './components/attendance/EmployeeAttendance';
import { HRAttendanceDashboard } from './components/attendance/HRAttendanceDashboard';

// Leave Management
import { EmployeeLeaveView } from './components/EmployeeLeaveView';
import { HRLeaveView } from './components/HRLeaveView';

// Payroll
import { EmployeePayrollView } from './components/payroll/EmployeePayrollView';
import { HRPayrollView } from './components/payroll/HRPayrollView';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function MainLayout() {
  const { user, employee, isHR, isLoading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState(() => isHR ? 'dashboard' : 'dashboard');
  const [apiStatus, setApiStatus] = useState('checking');

  // Check backend health
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`${API_URL}/api/health`);
        setApiStatus(res.ok ? 'online' : 'offline');
      } catch {
        setApiStatus('offline');
      }
    };
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  // Reset to default tab when role changes
  useEffect(() => {
    setActiveTab('dashboard');
  }, [isHR]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-200">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center animate-pulse shadow-lg" style={{background:'linear-gradient(135deg,#B8860B,#8B6914)',boxShadow:'0 8px 32px #B8860B30'}}>
            <span className="font-black text-2xl" style={{color:'#EEE5D3', fontFamily:'Playfair Display, serif'}}>D</span>
          </div>
          <p className="text-sm font-semibold text-slate-400">Authenticating Dayflow HRMS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative selection:bg-indigo-500 selection:text-white">
      {/* Ambient background glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none" style={{background:'radial-gradient(circle, #B8860B18 0%, transparent 70%)'}} />
      <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none" style={{background:'radial-gradient(circle, #9E603018 0%, transparent 70%)'}} />

      {/* Navbar */}
      {isAuthenticated && <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />}

      {/* Main content */}
      {!isAuthenticated ? (
        /* ── Logged-out: show auth modal ── */
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="text-center max-w-xl mb-10">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold border mb-4" style={{background:'#B8860B15',color:'#D4A017',borderColor:'#B8860B30'}}>
              <span>Hackathon 2026</span><span>•</span><span>Dayflow HRMS</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight" style={{fontFamily:'Playfair Display, serif', background:'linear-gradient(135deg,#EEE5D3 0%,#C4A882 50%,#A08060 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>
              Dayflow HRMS
            </h1>
            <p className="text-sm text-slate-400 mt-3">
              Premium Human Resource Management — attendance, leaves, payroll &amp; more.
            </p>
          </div>
          <AuthModal />
        </div>
      ) : (
        /* ── Logged-in: sidebar + main content ── */
        <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col lg:flex-row gap-6 relative z-10">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
          <main className="flex-1 min-w-0">
            {/* EMPLOYEE TABS */}
            {activeTab === 'dashboard'     && !isHR && <EmployeeDashboardSummary />}
            {activeTab === 'profile'       && <EmployeeProfileView />}
            {activeTab === 'attendance'    && <EmployeeAttendance />}
            {activeTab === 'leaves'        && <EmployeeLeaveView />}
            {activeTab === 'payroll'       && !isHR && <EmployeePayrollView />}

            {/* HR TABS */}
            {activeTab === 'dashboard'     && isHR && <HRDashboardSummary />}
            {activeTab === 'directory'     && isHR && <HREmployeeDirectory />}
            {activeTab === 'hr-attendance' && isHR && <HRAttendanceDashboard />}
            {activeTab === 'hr-leaves'     && isHR && <HRLeaveView />}
            {activeTab === 'hr-payroll'    && isHR && <HRPayrollView />}
          </main>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 px-6 py-4 bg-slate-950/90 backdrop-blur-xl mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-500">
          <span>&copy; {new Date().getFullYear()} Dayflow HRMS. Built for Hackathon 2026.</span>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${apiStatus === 'online' ? 'bg-emerald-400' : apiStatus === 'offline' ? 'bg-rose-500' : 'bg-amber-400 animate-pulse'}`} />
              API: <span className={apiStatus === 'online' ? 'text-emerald-400' : 'text-rose-400'}>{apiStatus}</span>
            </span>
            <span>React + Vite + FastAPI + PostgreSQL</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Inline mini dashboards (summary cards pulling from existing endpoints) ──

function EmployeeDashboardSummary() {
  const { employee, token } = useAuth();
  const API_URL_LOCAL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`${API_URL_LOCAL}/api/dashboard/employee`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, [token]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">
          Welcome back, {employee?.name?.split(' ')[0] || 'there'} 👋
        </h2>
        <p className="text-xs text-slate-500 mt-1">Here's your overview for today</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Attendance Rate', value: data?.attendance?.attendance_rate || '—', color: 'text-indigo-400' },
          { label: 'Hours This Week', value: data?.attendance?.total_hours_this_week ? `${data.attendance.total_hours_this_week}h` : '—', color: 'text-purple-400' },
          { label: 'Leave Remaining', value: data?.leave?.casual_leave_remaining != null ? `${data.leave.casual_leave_remaining} days` : '—', color: 'text-emerald-400' },
          { label: 'Net Salary', value: data?.payroll?.net_salary ? `$${data.payroll.net_salary.toLocaleString()}` : '—', color: 'text-amber-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">{label}</span>
            <span className={`text-2xl font-bold font-mono block mt-2 ${color}`}>{value}</span>
          </div>
        ))}
      </div>
      {data?.recent_activity && (
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-slate-200 mb-3">Recent Activity</h3>
          <div className="space-y-2">
            {data.recent_activity.map((a, i) => (
              <div key={i} className="flex items-start gap-3 text-xs">
                <span className="text-slate-500 font-mono w-40 shrink-0">{a.time}</span>
                <span className="text-slate-300">{a.event}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function HRDashboardSummary() {
  const { token } = useAuth();
  const API_URL_LOCAL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`${API_URL_LOCAL}/api/dashboard/hr`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, [token]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">HR Dashboard 🏢</h2>
        <p className="text-xs text-slate-500 mt-1">Organization-wide summary</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Employees', value: data?.stats?.total_employees ?? '—', color: 'text-indigo-400' },
          { label: 'Attendance Today', value: data?.stats?.attendance_today || '—', color: 'text-emerald-400' },
          { label: 'Pending Leaves', value: data?.stats?.pending_leaves ?? '—', color: 'text-amber-400' },
          { label: 'Total Payroll', value: data?.stats?.total_payroll ? `$${Number(data.stats.total_payroll).toLocaleString()}` : '—', color: 'text-purple-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">{label}</span>
            <span className={`text-2xl font-bold font-mono block mt-2 ${color}`}>{value}</span>
          </div>
        ))}
      </div>
      {data?.pending_leaves_list && (
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-slate-200 mb-3">Pending Leave Requests</h3>
          <div className="space-y-2">
            {data.pending_leaves_list.map((l) => (
              <div key={l.id} className="flex items-center justify-between text-xs bg-slate-950/50 rounded-xl px-4 py-3">
                <div>
                  <span className="font-semibold text-slate-200">{l.employee_name}</span>
                  <span className="text-slate-500 ml-2">{l.type} · {l.duration}</span>
                </div>
                <span className="text-amber-400 font-mono font-bold">{l.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
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
