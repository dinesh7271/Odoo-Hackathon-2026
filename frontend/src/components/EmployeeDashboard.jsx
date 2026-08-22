import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function EmployeeDashboard() {
  const { token, logout, API_BASE } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkedIn, setCheckedIn] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/dashboard/employee`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load dashboard data.');
      }

      const resData = await response.json();
      setData(resData);
      setCheckedIn(resData.attendance.checked_in_today);
    } catch (err) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCheckInToggle = () => {
    // Mock check-in toggle action since endpoint logic isn't completed yet
    setCheckedIn(!checkedIn);
    if (data) {
      setData({
        ...data,
        attendance: {
          ...data.attendance,
          checked_in_today: !checkedIn,
          check_in_time: !checkedIn ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto mt-10 backdrop-blur-md bg-rose-950/10 border border-rose-900/20 text-rose-400 p-6 rounded-2xl text-center">
        <h3 className="font-bold text-lg mb-2">Error Loading Dashboard</h3>
        <p className="text-sm mb-4">{error || 'Could not fetch records.'}</p>
        <button onClick={fetchDashboardData} className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-xl text-xs font-semibold transition-all cursor-pointer">
          Try Again
        </button>
      </div>
    );
  }

  const { profile, attendance, leave, payroll, recent_activity } = data;

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Top Welcome Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/40 border border-slate-900 rounded-3xl p-6 md:p-8 backdrop-blur-md">
        <div>
          <span className="text-indigo-400 text-xs font-mono uppercase tracking-widest">Employee Workspace</span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1">Hello, {profile.name}!</h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1">Manage your profiles, track attendance, and request leaves in one place.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleCheckInToggle}
            className={`px-6 py-3 rounded-xl text-xs font-semibold shadow-lg transition-all transform active:scale-95 cursor-pointer ${
              checkedIn
                ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30'
                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
            }`}
          >
            {checkedIn ? 'Check Out' : 'Check In'}
          </button>
          <button
            onClick={logout}
            className="px-5 py-3 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Stats Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Profile Card */}
        <div className="md:col-span-1 bg-slate-900/40 border border-slate-900 rounded-3xl p-6 backdrop-blur-md space-y-6">
          <h3 className="text-sm font-mono text-slate-400 uppercase tracking-wider border-b border-slate-900/60 pb-3">My Profile</h3>
          
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-extrabold text-2xl">
              {profile.name.charAt(0)}
            </div>
            <div>
              <h4 className="font-bold text-slate-100 text-lg leading-tight">{profile.name}</h4>
              <p className="text-xs text-indigo-400 font-medium mt-1">{profile.job_title}</p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">{profile.department}</p>
            </div>
          </div>

          <div className="space-y-3 text-xs pt-2">
            <div className="flex justify-between">
              <span className="text-slate-500">ID:</span>
              <span className="font-mono text-slate-300">{profile.employee_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Email:</span>
              <span className="text-slate-300">{profile.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Phone:</span>
              <span className="text-slate-300">{profile.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Address:</span>
              <span className="text-slate-300 text-right truncate max-w-[180px]">{profile.address}</span>
            </div>
          </div>
        </div>

        {/* Attendance Summary */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 backdrop-blur-md flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-mono text-slate-400 uppercase tracking-wider border-b border-slate-900/60 pb-3 mb-4">Attendance Rate</h3>
            <div className="flex items-baseline space-x-3">
              <span className="text-4xl font-black text-white">{attendance.attendance_rate}</span>
              <span className="text-xs text-emerald-400 font-semibold font-mono">ON TRACK</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Hours logged this week: <span className="text-slate-300 font-semibold">{attendance.total_hours_this_week} hrs</span></p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-900/40 text-xs space-y-2">
            <div className="flex justify-between text-slate-400">
              <span>Status Today:</span>
              <span className={`font-bold ${checkedIn ? 'text-emerald-400' : 'text-slate-500'}`}>
                {checkedIn ? `Logged In (${attendance.check_in_time || '09:05 AM'})` : 'Logged Out'}
              </span>
            </div>
          </div>
        </div>

        {/* Leave Balances */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 backdrop-blur-md flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-mono text-slate-400 uppercase tracking-wider border-b border-slate-900/60 pb-3 mb-4">Leave Balances</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-900/60">
                <span className="text-[10px] text-slate-500 font-mono block uppercase">Casual Leave</span>
                <span className="text-2xl font-bold text-slate-200 mt-1 block">{leave.casual_leave_remaining} days</span>
              </div>
              <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-900/60">
                <span className="text-[10px] text-slate-500 font-mono block uppercase">Medical Leave</span>
                <span className="text-2xl font-bold text-slate-200 mt-1 block">{leave.medical_leave_remaining} days</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-900/40 text-xs flex justify-between text-slate-400">
            <span>Pending Applications:</span>
            <span className="font-bold text-indigo-400">{leave.pending_applications} active</span>
          </div>
        </div>
      </div>

      {/* Attendance & Leave Detailed Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Attendance Logs */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 backdrop-blur-md">
          <h3 className="text-sm font-mono text-slate-400 uppercase tracking-wider border-b border-slate-900/60 pb-3 mb-4">Weekly Time Logs</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-900 text-slate-500">
                  <th className="py-2">Date</th>
                  <th className="py-2">Check In</th>
                  <th className="py-2">Check Out</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/40 text-slate-300 font-mono">
                {attendance.recent_history.map((log, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5">{log.date}</td>
                    <td className="py-2.5">{log.check_in}</td>
                    <td className="py-2.5">{log.check_out}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Leaves Table */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 backdrop-blur-md">
          <h3 className="text-sm font-mono text-slate-400 uppercase tracking-wider border-b border-slate-900/60 pb-3 mb-4">Recent Leaves</h3>
          <div className="space-y-3">
            {leave.recent_applications.map((app, idx) => (
              <div key={idx} className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex justify-between items-center text-xs">
                <div>
                  <div className="font-semibold text-slate-200">{app.type}</div>
                  <div className="text-[10px] text-slate-500 mt-1 font-mono">{app.start_date} to {app.end_date}</div>
                  <div className="text-[10px] text-slate-400 italic mt-0.5">"{app.reason}"</div>
                </div>
                <div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                    app.status === 'Approved'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                  }`}>
                    {app.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payroll Component */}
      <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 backdrop-blur-md">
        <h3 className="text-sm font-mono text-slate-400 uppercase tracking-wider border-b border-slate-900/60 pb-3 mb-4">Payroll Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-900/60">
            <span className="text-[10px] text-slate-500 font-mono block uppercase">Base Payout</span>
            <span className="text-lg font-bold text-slate-300 mt-1 block">${payroll.base_salary.toLocaleString()}</span>
          </div>
          <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-900/60">
            <span className="text-[10px] text-slate-500 font-mono block uppercase">Allowances</span>
            <span className="text-lg font-bold text-slate-300 mt-1 block">+${payroll.allowances.toLocaleString()}</span>
          </div>
          <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-900/60">
            <span className="text-[10px] text-slate-500 font-mono block uppercase">Deductions</span>
            <span className="text-lg font-bold text-slate-300 mt-1 block">-${payroll.deductions.toLocaleString()}</span>
          </div>
          <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-900/60">
            <span className="text-[10px] text-slate-500 font-mono block uppercase">Net Disbursed</span>
            <span className="text-lg font-bold text-indigo-400 mt-1 block">${payroll.net_salary.toLocaleString()}</span>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-slate-900/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs text-slate-500 font-mono">
          <span>Last payment cycle disbursed on: <span className="text-slate-300 font-semibold">{payroll.last_payout_date}</span></span>
          <span className="flex items-center gap-1.5">
            Status: 
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-emerald-400 font-bold uppercase">{payroll.payment_status}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
