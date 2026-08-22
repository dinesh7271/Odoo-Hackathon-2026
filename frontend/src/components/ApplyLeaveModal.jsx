import React, { useState } from 'react';
import { apiApplyLeave } from '../api/leaves';
import { useAuth } from '../context/AuthContext';
import {
  IconCalendar,
  IconBriefcase,
  IconHeartPulse,
  IconFileText,
  IconX,
  IconAlertCircle,
  IconCheckCircle,
} from './Icons';

const LEAVE_TYPES = [
  {
    id: 'Paid',
    name: 'Paid Leave',
    desc: 'Annual paid vacation or standard personal off',
    icon: IconBriefcase,
    color: 'indigo',
    border: 'border-indigo-500/30',
    bg: 'bg-indigo-500/10',
    activeBg: 'bg-indigo-500/20',
    activeBorder: 'border-indigo-500',
    text: 'text-indigo-400',
  },
  {
    id: 'Sick',
    name: 'Sick Leave',
    desc: 'Medical recovery, doctor visit, or wellness off',
    icon: IconHeartPulse,
    color: 'emerald',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
    activeBg: 'bg-emerald-500/20',
    activeBorder: 'border-emerald-500',
    text: 'text-emerald-400',
  },
  {
    id: 'Unpaid',
    name: 'Unpaid Leave',
    desc: 'Time off without pay or extended personal leave',
    icon: IconFileText,
    color: 'amber',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    activeBg: 'bg-amber-500/20',
    activeBorder: 'border-amber-500',
    text: 'text-amber-400',
  },
];

export function ApplyLeaveModal({ isOpen, onClose, onSuccess }) {
  const { token } = useAuth();
  const [leaveType, setLeaveType] = useState('Paid');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  // Calculate day count
  const calculateDays = () => {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return -1;
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const daysCount = calculateDays();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!startDate || !endDate) {
      setError('Please select both start and end dates.');
      return;
    }

    if (daysCount < 1) {
      setError('End date cannot be earlier than start date.');
      return;
    }

    try {
      setIsSubmitting(true);
      await apiApplyLeave(token, {
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        remarks: remarks.trim() || undefined,
      });

      // Reset form
      setStartDate('');
      setEndDate('');
      setRemarks('');
      setLeaveType('Paid');

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit leave request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <IconCalendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">Apply for Leave</h2>
              <p className="text-xs text-slate-400">Submit a new time-off request for HR approval</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3.5 bg-rose-950/40 border border-rose-800/50 rounded-xl flex items-start space-x-2.5 text-rose-300 text-xs">
            <IconAlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-400" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Leave Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
              Select Leave Type
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {LEAVE_TYPES.map((type) => {
                const isSelected = leaveType === type.id;
                const IconComponent = type.icon;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setLeaveType(type.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition cursor-pointer ${
                      isSelected
                        ? `${type.activeBg} ${type.activeBorder} ring-1 ring-indigo-500/40`
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl ${type.bg} flex items-center justify-center mb-1.5 ${type.text}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-200">{type.name}</span>
                    <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{type.id}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Start Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition [color-scheme:dark]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                End Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition [color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          {/* Duration Summary */}
          {daysCount !== null && (
            <div
              className={`p-3 rounded-xl text-xs font-medium flex items-center justify-between border ${
                daysCount > 0
                  ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
              }`}
            >
              <span>Calculated Leave Duration:</span>
              <span className="font-bold font-mono">
                {daysCount > 0 ? `${daysCount} ${daysCount === 1 ? 'Day' : 'Days'}` : 'Invalid Date Range'}
              </span>
            </div>
          )}

          {/* Remarks Textarea */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Remarks / Reason <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Taking family vacation, doctor appointment, etc."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (daysCount !== null && daysCount < 1)}
              className="cursor-pointer inline-flex items-center justify-center space-x-2 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <IconCheckCircle className="w-4 h-4" />
                  <span>Submit Leave Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
