import React, { useState } from 'react';
import { apiApproveLeave, apiRejectLeave } from '../api/leaves';
import { useAuth } from '../context/AuthContext';
import {
  IconCheckCircle,
  IconXCircle,
  IconX,
  IconAlertCircle,
  IconUser,
  IconCalendar,
} from './Icons';

export function LeaveActionModal({ isOpen, onClose, leave, actionType, onSuccess }) {
  const { token } = useAuth();
  const [hrComments, setHrComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !leave) return null;

  const isApprove = actionType === 'approve';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      setIsSubmitting(true);
      if (isApprove) {
        await apiApproveLeave(token, leave.id, hrComments.trim());
      } else {
        await apiRejectLeave(token, leave.id, hrComments.trim());
      }

      setHrComments('');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || `Failed to ${actionType} leave request`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const employeeName = leave.employee?.name || `Employee #${leave.employee_id}`;
  const employeeCode = leave.employee?.employee_id || `ID: ${leave.employee_id}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Glowing Border */}
        <div
          className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
            isApprove
              ? 'from-emerald-500 via-teal-500 to-emerald-400'
              : 'from-rose-500 via-pink-500 to-rose-400'
          }`}
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                isApprove
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}
            >
              {isApprove ? (
                <IconCheckCircle className="w-5 h-5" />
              ) : (
                <IconXCircle className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">
                {isApprove ? 'Approve Leave Request' : 'Reject Leave Request'}
              </h2>
              <p className="text-xs text-slate-400">
                {isApprove
                  ? 'Confirm approval and optionally add comments for the employee'
                  : 'Provide rejection feedback or rationale for the employee'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {/* Target Request Summary Card */}
        <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800/80 mb-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <IconUser className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-200">{employeeName}</span>
                <span className="text-[10px] text-slate-500 font-mono ml-2">({employeeCode})</span>
              </div>
            </div>
            <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {leave.leave_type} Leave
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-900">
            <div>
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Duration</span>
              <span className="font-semibold text-slate-200">
                {leave.start_date} → {leave.end_date}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Employee Remarks</span>
              <span className="text-slate-300 italic truncate block">
                {leave.remarks || 'None'}
              </span>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3.5 bg-rose-950/40 border border-rose-800/50 rounded-xl flex items-start space-x-2.5 text-rose-300 text-xs">
            <IconAlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-400" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              HR Comments / Feedback <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={3}
              value={hrComments}
              onChange={(e) => setHrComments(e.target.value)}
              placeholder={
                isApprove
                  ? 'e.g. Approved. Have a great vacation and please hand off critical tasks.'
                  : 'e.g. Please reschedule due to sprint release schedule.'
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition resize-none"
            />
          </div>

          {/* Action Buttons */}
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
              disabled={isSubmitting}
              className={`cursor-pointer inline-flex items-center justify-center space-x-2 px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-lg active:scale-95 transition disabled:opacity-50 ${
                isApprove
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/20'
                  : 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 shadow-rose-600/20'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  {isApprove ? (
                    <IconCheckCircle className="w-4 h-4" />
                  ) : (
                    <IconXCircle className="w-4 h-4" />
                  )}
                  <span>{isApprove ? 'Confirm Approval' : 'Confirm Rejection'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
