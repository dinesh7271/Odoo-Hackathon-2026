import React, { useState, useEffect } from 'react';
import { apiGetMyLeaves } from '../api/leaves';
import { useAuth } from '../context/AuthContext';
import { ApplyLeaveModal } from './ApplyLeaveModal';
import {
  IconCalendar,
  IconClock,
  IconCheckCircle,
  IconXCircle,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconBriefcase,
  IconHeartPulse,
  IconFileText,
  IconAlertCircle,
} from './Icons';

export function EmployeeLeaveView() {
  const { token, user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'Pending' | 'Approved' | 'Rejected'
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLeaves = async (isManual = false) => {
    if (!token) return;
    try {
      if (isManual) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);
      const data = await apiGetMyLeaves(token);
      setLeaves(data);
    } catch (err) {
      console.error('Failed to load employee leaves:', err);
      setError(err.message || 'Failed to fetch personal leave requests');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [token]);

  // Calculate statistics
  const stats = {
    total: leaves.length,
    pending: leaves.filter((l) => l.status.toLowerCase() === 'pending').length,
    approved: leaves.filter((l) => l.status.toLowerCase() === 'approved').length,
    rejected: leaves.filter((l) => l.status.toLowerCase() === 'rejected').length,
    totalDaysTaken: leaves
      .filter((l) => l.status.toLowerCase() === 'approved')
      .reduce((acc, l) => {
        const start = new Date(l.start_date);
        const end = new Date(l.end_date);
        const diff = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
        return acc + diff;
      }, 0),
  };

  // Filter leaves
  const filteredLeaves = leaves.filter((leave) => {
    const matchesStatus =
      statusFilter === 'ALL' || leave.status.toLowerCase() === statusFilter.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      leave.leave_type.toLowerCase().includes(query) ||
      (leave.remarks && leave.remarks.toLowerCase().includes(query)) ||
      (leave.hr_comments && leave.hr_comments.toLowerCase().includes(query)) ||
      leave.start_date.includes(query) ||
      leave.end_date.includes(query);

    return matchesStatus && matchesSearch;
  });

  const getLeaveTypeBadge = (type) => {
    switch (type.toLowerCase()) {
      case 'paid':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <IconBriefcase className="w-3.5 h-3.5" />
            <span>Paid Leave</span>
          </span>
        );
      case 'sick':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <IconHeartPulse className="w-3.5 h-3.5" />
            <span>Sick Leave</span>
          </span>
        );
      case 'unpaid':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <IconFileText className="w-3.5 h-3.5" />
            <span>Unpaid Leave</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
            {type}
          </span>
        );
    }
  };

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span>Pending</span>
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <IconCheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Approved</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <IconXCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Rejected</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400">
            {status}
          </span>
        );
    }
  };

  const formatDates = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.ceil(Math.abs(e - s) / (1000 * 60 * 60 * 24)) + 1;

    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    const sStr = s.toLocaleDateString('en-US', options);
    const eStr = e.toLocaleDateString('en-US', options);

    return {
      range: sStr === eStr ? sStr : `${sStr} → ${eStr}`,
      days: `${diff} ${diff === 1 ? 'day' : 'days'}`,
    };
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/50 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-md">
        <div>
          <div className="flex items-center space-x-2 text-xs text-indigo-400 font-mono uppercase tracking-widest mb-1">
            <IconCalendar className="w-3.5 h-3.5" />
            <span>Employee Self-Service</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300">
            My Leaves & Time-Off
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Manage your annual, sick, and unpaid leave requests and track approvals in real time.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchLeaves(true)}
            disabled={isRefreshing}
            className="p-3 text-slate-400 hover:text-slate-200 bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 rounded-2xl transition cursor-pointer disabled:opacity-50"
            title="Refresh requests"
          >
            <IconRefresh className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="cursor-pointer inline-flex items-center justify-center space-x-2 px-5 py-3 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 rounded-2xl shadow-lg shadow-indigo-500/20 active:scale-95 transition"
          >
            <IconPlus className="w-4 h-4" />
            <span>Apply for Leave</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Leaves */}
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 md:p-5 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Total Applied</span>
            <div className="w-8 h-8 rounded-xl bg-slate-800/80 flex items-center justify-center text-slate-300">
              <IconCalendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl md:text-3xl font-extrabold text-slate-100">{stats.total}</span>
            <span className="text-xs text-slate-500">requests</span>
          </div>
        </div>

        {/* Pending Requests */}
        <div className="bg-slate-900/40 border border-amber-500/20 rounded-2xl p-4 md:p-5 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-amber-400/90 uppercase tracking-wider">Pending HR</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <IconClock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl md:text-3xl font-extrabold text-amber-400">{stats.pending}</span>
            <span className="text-xs text-amber-400/60">awaiting review</span>
          </div>
        </div>

        {/* Approved Leaves */}
        <div className="bg-slate-900/40 border border-emerald-500/20 rounded-2xl p-4 md:p-5 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-emerald-400/90 uppercase tracking-wider">Approved</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <IconCheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl md:text-3xl font-extrabold text-emerald-400">{stats.approved}</span>
            <span className="text-xs text-emerald-400/60">{stats.totalDaysTaken} days total</span>
          </div>
        </div>

        {/* Rejected Leaves */}
        <div className="bg-slate-900/40 border border-rose-500/20 rounded-2xl p-4 md:p-5 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-rose-400/90 uppercase tracking-wider">Rejected</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
              <IconXCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl md:text-3xl font-extrabold text-rose-400">{stats.rejected}</span>
            <span className="text-xs text-rose-400/60">declined</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/30 p-3 rounded-2xl border border-slate-800/60">
        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'Pending', 'Approved', 'Rejected'].map((status) => {
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {status === 'ALL' ? 'All Requests' : status}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-xs">
          <IconSearch className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search remarks, dates..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-rose-950/30 border border-rose-800/40 rounded-2xl flex items-center space-x-3 text-rose-300 text-xs">
          <IconAlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Leaves List / Table */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl overflow-hidden backdrop-blur-md shadow-xl">
        {isLoading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400 font-mono">Loading leave requests...</p>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center text-slate-500 mx-auto mb-3">
              <IconCalendar className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-200">No Leave Requests Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-5">
              {leaves.length === 0
                ? "You haven't submitted any leave requests yet. Click 'Apply for Leave' to get started."
                : 'No requests match your current filter and search criteria.'}
            </p>
            {leaves.length === 0 && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="cursor-pointer inline-flex items-center space-x-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition"
              >
                <IconPlus className="w-4 h-4" />
                <span>Apply for Leave</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Leave Type</th>
                  <th className="py-3.5 px-6">Dates & Duration</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Remarks / Reason</th>
                  <th className="py-3.5 px-6">HR Feedback</th>
                  <th className="py-3.5 px-6">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredLeaves.map((leave) => {
                  const dateInfo = formatDates(leave.start_date, leave.end_date);
                  const appliedDate = new Date(leave.applied_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <tr
                      key={leave.id}
                      className="hover:bg-slate-800/30 transition group"
                    >
                      {/* Leave Type */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        {getLeaveTypeBadge(leave.leave_type)}
                      </td>

                      {/* Dates */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="font-semibold text-slate-200">{dateInfo.range}</div>
                        <div className="text-[11px] font-mono text-indigo-400 mt-0.5">{dateInfo.days}</div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        {getStatusBadge(leave.status)}
                      </td>

                      {/* Remarks */}
                      <td className="py-4 px-6 max-w-xs">
                        <p className="text-slate-300 truncate" title={leave.remarks || ''}>
                          {leave.remarks || <span className="text-slate-600 italic">No remarks provided</span>}
                        </p>
                      </td>

                      {/* HR Feedback */}
                      <td className="py-4 px-6 max-w-xs">
                        {leave.hr_comments ? (
                          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300">
                            <span className="text-[10px] block font-mono text-indigo-400 font-semibold mb-0.5 uppercase">
                              HR Note:
                            </span>
                            <span className="line-clamp-2">{leave.hr_comments}</span>
                          </div>
                        ) : leave.status.toLowerCase() === 'pending' ? (
                          <span className="text-slate-600 italic">Awaiting review...</span>
                        ) : (
                          <span className="text-slate-600 italic">No comments</span>
                        )}
                      </td>

                      {/* Submitted At */}
                      <td className="py-4 px-6 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                        {appliedDate}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Apply Leave Modal */}
      <ApplyLeaveModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchLeaves(true)}
      />
    </div>
  );
}
