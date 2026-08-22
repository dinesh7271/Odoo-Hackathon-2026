import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function HRDashboard() {
  const { token, logout, API_BASE } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Local state to mock leaf approvals/rejections in real time
  const [leavesList, setLeavesList] = useState([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/dashboard/hr`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load HR dashboard data.');
      }

      const resData = await response.json();
      setData(resData);
      setLeavesList(resData.pending_leaves_list);
    } catch (err) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleApproveLeave = (id) => {
    // Mock approve in local state to simulate responsive HR action
    setLeavesList(leavesList.map(item => 
      item.id === id ? { ...item, status: 'Approved' } : item
    ));
    // Simulate updating counts
    if (data) {
      setData({
        ...data,
        stats: {
          ...data.stats,
          pending_leaves: Math.max(0, data.stats.pending_leaves - 1)
        }
      });
    }
  };

  const handleRejectLeave = (id) => {
    // Mock reject in local state
    setLeavesList(leavesList.map(item => 
      item.id === id ? { ...item, status: 'Rejected' } : item
    ));
    if (data) {
      setData({
        ...data,
        stats: {
          ...data.stats,
          pending_leaves: Math.max(0, data.stats.pending_leaves - 1)
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

  const { stats, attendance_overview, payroll_overview } = data;

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Welcome & Navigation Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/40 border border-slate-900 rounded-3xl p-6 md:p-8 backdrop-blur-md">
        <div>
          <span className="text-purple-400 text-xs font-mono uppercase tracking-widest">HR Management Hub</span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1">HR Administration</h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1">Review team presence, process pending leaves, and inspect payroll totals.</p>
        </div>
        <div>
          <button
            onClick={logout}
            className="px-5 py-3 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Analytics Card Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        
        {/* Total Employees */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 backdrop-blur-md">
          <span className="text-[10px] text-slate-500 font-mono block uppercase">Total Headcount</span>
          <div className="text-4xl font-black text-white mt-2">{stats.total_employees}</div>
          <p className="text-[10px] text-slate-500 mt-2 font-mono">Registered Employees</p>
        </div>

        {/* Present Today */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 backdrop-blur-md">
          <span className="text-[10px] text-slate-500 font-mono block uppercase">Attendance Rate</span>
          <div className="text-4xl font-black text-emerald-400 mt-2">{stats.attendance_today}</div>
          <p className="text-[10px] text-slate-500 mt-2 font-mono">{attendance_overview.present_today} Present / {attendance_overview.absent_today} Absent</p>
        </div>

        {/* Pending Approvals */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 backdrop-blur-md">
          <span className="text-[10px] text-slate-500 font-mono block uppercase">Pending Leaves</span>
          <div className="text-4xl font-black text-amber-400 mt-2">{stats.pending_leaves}</div>
          <p className="text-[10px] text-slate-500 mt-2 font-mono">Requires Action</p>
        </div>

        {/* Total Payroll Budget */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 backdrop-blur-md">
          <span className="text-[10px] text-slate-500 font-mono block uppercase">Total Payroll Cost</span>
          <div className="text-4xl font-black text-indigo-400 mt-2">${stats.total_payroll.toLocaleString()}</div>
          <p className="text-[10px] text-slate-500 mt-2 font-mono">Monthly Aggregate Salary</p>
        </div>
      </div>

      {/* Main Action Workspaces */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Pending Leaves Management Table */}
        <div className="md:col-span-2 bg-slate-900/40 border border-slate-900 rounded-3xl p-6 backdrop-blur-md">
          <h3 className="text-sm font-mono text-slate-400 uppercase tracking-wider border-b border-slate-900/60 pb-3 mb-4">Pending Leave Applications</h3>
          
          <div className="space-y-4">
            {leavesList.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No leave applications require approval.</p>
            ) : (
              leavesList.map((app) => (
                <div key={app.id} className="bg-slate-950/40 border border-slate-900 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">{app.employee_name}</span>
                      <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded font-mono">{app.department}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-2 font-mono">
                      Requesting {app.type} ({app.duration}) starting {app.start_date}
                    </div>
                  </div>

                  <div className="flex gap-2 self-end sm:self-center">
                    {app.status === 'Pending' ? (
                      <>
                        <button
                          onClick={() => handleApproveLeave(app.id)}
                          className="px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 rounded-xl font-bold transition-all cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectLeave(app.id)}
                          className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 rounded-xl font-bold transition-all cursor-pointer"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                        app.status === 'Approved'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                      }`}>
                        {app.status}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Real-time Feeds (Attendance check-ins) */}
        <div className="md:col-span-1 bg-slate-900/40 border border-slate-900 rounded-3xl p-6 backdrop-blur-md flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-mono text-slate-400 uppercase tracking-wider border-b border-slate-900/60 pb-3 mb-4">Today's Presence Feed</h3>
            
            <div className="space-y-4 text-xs font-mono">
              {attendance_overview.recent_check_ins.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-950/20 p-3 rounded-xl border border-slate-900/40">
                  <div>
                    <span className="text-slate-300 block font-sans font-medium">{item.employee_name}</span>
                    <span className="text-[10px] text-slate-500 mt-1 block">Checked in at {item.time}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-900/40 text-xs text-slate-500 text-center leading-normal">
            Presence overview refreshes dynamically.
          </div>
        </div>
      </div>

      {/* Payroll Budgets Breakdown */}
      <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 backdrop-blur-md">
        <h3 className="text-sm font-mono text-slate-400 uppercase tracking-wider border-b border-slate-900/60 pb-3 mb-4">Salary Disbursal Breakdown</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {payroll_overview.department_payouts.map((dept, idx) => (
            <div key={idx} className="bg-slate-950/40 p-4 rounded-2xl border border-slate-900/60">
              <span className="text-[10px] text-slate-500 font-mono block uppercase">{dept.department} Division</span>
              <span className="text-xl font-bold text-slate-300 mt-1 block">${dept.payout.toLocaleString()}</span>
              <span className="text-[9px] text-slate-600 block mt-1 font-mono">Allocated Budget</span>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t border-slate-900/40 flex justify-between items-center text-xs text-slate-500 font-mono">
          <span>Next salary cycle execution date: <span className="text-slate-300 font-semibold">{payroll_overview.next_cycle_date}</span></span>
          <span className="font-bold text-indigo-400 uppercase">Operational ({payroll_overview.currency})</span>
        </div>
      </div>
    </div>
  );
}
