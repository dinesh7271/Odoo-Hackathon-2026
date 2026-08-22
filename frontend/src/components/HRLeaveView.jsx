import React, { useState, useEffect } from 'react';
import { apiGetAllLeaves } from '../api/leaves';
import { useAuth } from '../context/AuthContext';
import { LeaveActionModal } from './LeaveActionModal';
import {
  IconShield,
  IconCalendar,
  IconClock,
  IconCheckCircle,
  IconXCircle,
  IconRefresh,
  IconSearch,
  IconFilter,
  IconUser,
  IconBriefcase,
  IconHeartPulse,
  IconFileText,
  IconAlertCircle,
  IconCheck,
  IconX,
} from './Icons';

export function HRLeaveView() {
  const { token, user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'Pending' | 'Approved' | 'Rejected'
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'Paid' | 'Sick' | 'Unpaid'
  const [searchQuery, setSearchQuery] = useState('');

  // Action Modal
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [actionType, setActionType] = useState('approve'); // 'approve' | 'reject'
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAllLeaves = async (isManual = false) => {
    if (!token) return;
    try {
      if (isManual) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);
      const data = await apiGetAllLeaves(token);
      setLeaves(data);
    } catch (err) {
      console.error('Failed to load HR leaves:', err);
      setError(err.message || 'Failed to fetch company-wide leave requests');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllLeaves();
  }, [token]);

  const openActionModal = (leave, type) => {
    setSelectedLeave(leave);
    setActionType(type);
    setIsModalOpen(true);
  };

  // Metrics
  const stats = {
    total: leaves.length,
    pending: leaves.filter((l) => l.status.toLowerCase() === 'pending').length,
    approved: leaves.filter((l) => l.status.toLowerCase() === 'approved').length,
    rejected: leaves.filter((l) => l.status.toLowerCase() === 'rejected').length,
  };

  // Filtering
  const filteredLeaves = leaves.filter((leave) => {
    const matchesStatus =
      statusFilter === 'ALL' || leave.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesType =
      typeFilter === 'ALL' || leave.leave_type.toLowerCase() === typeFilter.toLowerCase();

    const q = searchQuery.toLowerCase().trim();
    const emp = leave.employee || {};
    const matchesSearch =
      !q ||
      (emp.name && emp.name.toLowerCase().includes(q)) ||
      (emp.employee_id && emp.employee_id.toLowerCase().includes(q)) ||
      (emp.department && emp.department.toLowerCase().includes(q)) ||
      (emp.job_title && emp.job_title.toLowerCase().includes(q)) ||
      (leave.remarks && leave.remarks.toLowerCase().includes(q)) ||
      (leave.hr_comments && leave.hr_comments.toLowerCase().includes(q)) ||
      leave.start_date.includes(q) ||
      leave.end_date.includes(q);

    return matchesStatus && matchesType && matchesSearch;
  });

  const getLeaveTypeBadge = (type) => {
    switch (type.toLowerCase()) {
      case 'paid':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <IconBriefcase className="w-3.5 h-3.5" />
            <span>Paid</span>
          </span>
        );
      case 'sick':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <IconHeartPulse className="w-3.5 h-3.5" />
            <span>Sick</span>
          </span>
        );
      case 'unpaid':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <IconFileText className="w-3.5 h-3.5" />
            <span>Unpaid</span>
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
            <span>Pending Review</span>
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/50 border border-purple-500/30 p-6 rounded-3xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 h-full w-96 bg-gradient-to-l from-purple-500/10 to-transparent pointer-events-none" />

        <div>
          <div className="flex items-center space-x-2 text-xs text-purple-400 font-mono uppercase tracking-widest mb-1">
            <IconShield className="w-3.5 h-3.5" />
            <span>HR Administration Portal</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-purple-200">
            Leave & Time-Off Management
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Review company-wide leave applications, evaluate employee requests, and approve or reject with comments.
          </p>
        </div>

        <div className="flex items-center space-x-3 z-10">
          <button
            onClick={() => fetchAllLeaves(true)}
            disabled={isRefreshing}
            className="cursor-pointer inline-flex items-center space-x-2 px-4 py-2.5 text-xs font-bold text-slate-200 bg-slate-950/70 hover:bg-slate-800 border border-slate-800 rounded-2xl transition disabled:opacity-50"
          >
            <IconRefresh className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-purple-400' : ''}`} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Applications */}
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 md:p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Total Requests</span>
            <div className="w-8 h-8 rounded-xl bg-slate-800/80 flex items-center justify-center text-slate-300">
              <IconCalendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl md:text-3xl font-extrabold text-slate-100">{stats.total}</span>
            <span className="text-xs text-slate-500">all time</span>
          </div>
        </div>

        {/* Pending Action */}
        <div className="bg-slate-900/40 border border-amber-500/30 rounded-2xl p-4 md:p-5 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider font-bold">Needs Action</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <IconClock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl md:text-3xl font-extrabold text-amber-400">{stats.pending}</span>
            <span className="text-xs text-amber-400/70">pending approval</span>
          </div>
        </div>

        {/* Approved */}
        <div className="bg-slate-900/40 border border-emerald-500/20 rounded-2xl p-4 md:p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider">Approved</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <IconCheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl md:text-3xl font-extrabold text-emerald-400">{stats.approved}</span>
            <span className="text-xs text-emerald-400/70">granted</span>
          </div>
        </div>

        {/* Rejected */}
        <div className="bg-slate-900/40 border border-rose-500/20 rounded-2xl p-4 md:p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-rose-400 uppercase tracking-wider">Rejected</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
              <IconXCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl md:text-3xl font-extrabold text-rose-400">{stats.rejected}</span>
            <span className="text-xs text-rose-400/70">declined</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-slate-900/30 p-3 rounded-2xl border border-slate-800/60">
        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 lg:pb-0">
          {['ALL', 'Pending', 'Approved', 'Rejected'].map((status) => {
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {status === 'ALL' ? 'All Statuses' : status}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          {/* Leave Type Select */}
          <div className="w-full sm:w-auto">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full sm:w-auto bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 transition cursor-pointer"
            >
              <option value="ALL">All Leave Types</option>
              <option value="Paid">Paid Leave</option>
              <option value="Sick">Sick Leave</option>
              <option value="Unpaid">Unpaid Leave</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <IconSearch className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employee, dept..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 transition"
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-rose-950/30 border border-rose-800/40 rounded-2xl flex items-center space-x-3 text-rose-300 text-xs">
          <IconAlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Leave Requests Table */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl overflow-hidden backdrop-blur-md shadow-xl">
        {isLoading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400 font-mono">Loading all leave requests...</p>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center text-slate-500 mx-auto mb-3">
              <IconCalendar className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-200">No Leave Requests</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              {leaves.length === 0
                ? 'No employee has submitted a leave request yet.'
                : 'No requests match your selected filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Employee Details</th>
                  <th className="py-3.5 px-6">Leave Type</th>
                  <th className="py-3.5 px-6">Requested Dates</th>
                  <th className="py-3.5 px-6">Employee Reason</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">HR Comments</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredLeaves.map((leave) => {
                  const emp = leave.employee || {};
                  const dateInfo = formatDates(leave.start_date, leave.end_date);
                  const isPending = leave.status.toLowerCase() === 'pending';

                  return (
                    <tr
                      key={leave.id}
                      className="hover:bg-slate-800/30 transition group"
                    >
                      {/* Employee Information */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-xs">
                            {emp.name ? emp.name.charAt(0) : 'E'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-100 flex items-center space-x-1.5">
                              <span>{emp.name || 'Unnamed Employee'}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                                {emp.employee_id || `ID: ${leave.employee_id}`}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              {emp.email || 'No email'}
                              {emp.department ? ` • ${emp.department}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Leave Type */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        {getLeaveTypeBadge(leave.leave_type)}
                      </td>

                      {/* Requested Dates */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="font-semibold text-slate-200">{dateInfo.range}</div>
                        <div className="text-[11px] font-mono text-purple-400 mt-0.5">{dateInfo.days}</div>
                      </td>

                      {/* Employee Reason */}
                      <td className="py-4 px-6 max-w-xs">
                        <p className="text-slate-300 truncate" title={leave.remarks || ''}>
                          {leave.remarks || <span className="text-slate-600 italic">No remarks provided</span>}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        {getStatusBadge(leave.status)}
                      </td>

                      {/* HR Feedback */}
                      <td className="py-4 px-6 max-w-xs">
                        {leave.hr_comments ? (
                          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300">
                            <span className="line-clamp-2">{leave.hr_comments}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600 italic">No remarks</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 whitespace-nowrap text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => openActionModal(leave, 'approve')}
                              className="cursor-pointer inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 active:scale-95 transition"
                            >
                              <IconCheck className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => openActionModal(leave, 'reject')}
                              className="cursor-pointer inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 active:scale-95 transition"
                            >
                              <IconX className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => openActionModal(leave, leave.status.toLowerCase() === 'approved' ? 'reject' : 'approve')}
                            className="cursor-pointer text-[11px] font-semibold text-slate-400 hover:text-purple-400 hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-800 transition"
                          >
                            Change Decision
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Modal (Approve / Reject) */}
      <LeaveActionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLeave(null);
        }}
        leave={selectedLeave}
        actionType={actionType}
        onSuccess={() => fetchAllLeaves(true)}
      />
    </div>
  );
}
