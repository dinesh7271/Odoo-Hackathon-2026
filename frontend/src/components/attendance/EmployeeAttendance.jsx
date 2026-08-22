import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  CalendarDays,
  ArrowRight,
  Sparkles,
  TrendingUp,
  History,
  Timer,
  LogIn,
  LogOut,
  ChevronLeft,
  ChevronRight,
  FileText
} from 'lucide-react';

export function EmployeeAttendance() {
  const { user, employee } = useAuth();
  const { addToast } = useToast();

  // Current live time
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Attendance state
  const [todayRecord, setTodayRecord] = useState(null);
  const [weeklyData, setWeeklyData] = useState(null);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkInNote, setCheckInNote] = useState('');
  const [checkOutNote, setCheckOutNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [selectedWeekOffset, setSelectedWeekOffset] = useState(0); // 0 = current week, -1 = last week

  // Clock interval
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch employee's attendance data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch recent attendance history (contains today's record if any)
      const records = await api.attendance.getMyAttendance({ limit: 30 });
      setHistoryRecords(records || []);

      const todayStr = new Date().toISOString().split('T')[0];
      const today = (records || []).find((r) => r.date === todayStr);
      setTodayRecord(today || null);

      // 2. Fetch weekly summary
      const targetDate = new Date();
      if (selectedWeekOffset !== 0) {
        targetDate.setDate(targetDate.getDate() + selectedWeekOffset * 7);
      }
      const targetDateStr = targetDate.toISOString().split('T')[0];
      const weekly = await api.attendance.getMyWeekly(targetDateStr);
      setWeeklyData(weekly);
    } catch (err) {
      console.error('Failed to load attendance data:', err);
      addToast(err.message || 'Failed to load attendance logs', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.email, selectedWeekOffset]);

  // Handle Check-in
  const handleCheckIn = async () => {
    setIsSubmitting(true);
    try {
      const res = await api.attendance.checkIn(checkInNote);
      setTodayRecord(res);
      addToast('Checked in successfully! Status: Present', 'success');
      setCheckInNote('');
      setShowNoteInput(false);
      fetchData();
    } catch (err) {
      addToast(err.message || 'Check-in failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Check-out
  const handleCheckOut = async () => {
    setIsSubmitting(true);
    try {
      const res = await api.attendance.checkOut(checkOutNote);
      setTodayRecord(res);
      addToast(`Checked out successfully! Total Hours: ${res.work_hours} hrs (${res.status})`, 'success');
      setCheckOutNote('');
      setShowNoteInput(false);
      fetchData();
    } catch (err) {
      addToast(err.message || 'Check-out failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate elapsed time if currently checked in
  const getElapsedTimeString = () => {
    if (!todayRecord || !todayRecord.check_in || todayRecord.check_out) {
      return null;
    }
    const checkInDate = new Date(todayRecord.check_in);
    const diffMs = Math.max(0, currentTime.getTime() - checkInDate.getTime());
    const totalSecs = Math.floor(diffMs / 1000);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const isCheckedIn = !!todayRecord?.check_in && !todayRecord?.check_out;
  const isShiftCompleted = !!todayRecord?.check_in && !!todayRecord?.check_out;
  const isNotCheckedIn = !todayRecord?.check_in;

  const formatTime = (isoString) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Present':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Half-day':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Absent':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'Leave':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Live Check-in & Time Tracker Hero Card */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        {/* Ambient Back Glow */}
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          
          {/* Left: Clock & Employee Status */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Real-Time Attendance Terminal</span>
            </div>
            
            <div className="flex items-baseline gap-3">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
                {currentTime.toLocaleTimeString()}
              </h1>
              <span className="text-xs sm:text-sm text-slate-400 font-medium">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <span className="text-xs text-slate-300">Current Shift Status:</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono uppercase tracking-wider border ${
                isCheckedIn
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 animate-pulse'
                  : isShiftCompleted
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {isCheckedIn ? '● Checked In / Working' : isShiftCompleted ? '✓ Shift Completed' : 'Not Checked In'}
              </span>
            </div>
          </div>

          {/* Right: Check-in / Check-out Action Center */}
          <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            
            {/* Live Stopwatch if Checked In */}
            {isCheckedIn && (
              <div className="px-5 py-3 rounded-2xl bg-slate-950/80 border border-emerald-500/30 flex items-center gap-3">
                <Timer className="w-5 h-5 text-emerald-400 animate-spin" style={{ animationDuration: '3s' }} />
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Time on Shift</span>
                  <span className="text-base font-bold font-mono text-emerald-300">
                    {getElapsedTimeString() || '00:00:00'}
                  </span>
                </div>
              </div>
            )}

            {/* Check-in button */}
            {isNotCheckedIn && (
              <button
                onClick={handleCheckIn}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                <span>{isSubmitting ? 'Checking In...' : 'Check In Now'}</span>
              </button>
            )}

            {/* Check-out button */}
            {isCheckedIn && (
              <button
                onClick={handleCheckOut}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-sm shadow-xl shadow-rose-600/30 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                <span>{isSubmitting ? 'Checking Out...' : 'Check Out Now'}</span>
              </button>
            )}

            {/* Shift completed badge */}
            {isShiftCompleted && (
              <div className="px-5 py-3 rounded-2xl bg-slate-950/80 border border-indigo-500/30 text-xs">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Today's Summary</span>
                <span className="font-bold text-indigo-300">
                  {todayRecord.work_hours} hrs ({todayRecord.status})
                </span>
              </div>
            )}

          </div>

        </div>

        {/* Today's Timestamps Details */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800/60">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Check In Time</span>
            <span className="text-sm font-bold text-slate-200 mt-0.5 block">
              {todayRecord?.check_in ? formatTime(todayRecord.check_in) : '--:--'}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800/60">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Check Out Time</span>
            <span className="text-sm font-bold text-slate-200 mt-0.5 block">
              {todayRecord?.check_out ? formatTime(todayRecord.check_out) : '--:--'}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800/60">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Recorded Work Hours</span>
            <span className="text-sm font-bold text-emerald-400 mt-0.5 block font-mono">
              {todayRecord?.work_hours ? `${todayRecord.work_hours} hrs` : isCheckedIn ? 'In Progress' : '0.0 hrs'}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800/60">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Today's Status</span>
            <span className={`text-xs font-bold mt-1 inline-block px-2 py-0.5 rounded border ${getStatusBadge(todayRecord?.status || 'Absent')}`}>
              {todayRecord?.status || (isCheckedIn ? 'Present' : 'Not Recorded')}
            </span>
          </div>
        </div>

      </div>

      {/* 2. Weekly Attendance Calendar & Summary */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
        
        {/* Weekly Header & Week Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Weekly Attendance View</h3>
              <p className="text-xs text-slate-400">
                {weeklyData
                  ? `${new Date(weeklyData.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(weeklyData.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                  : 'Loading week...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedWeekOffset((prev) => prev - 1)}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Previous Week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedWeekOffset(0)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                selectedWeekOffset === 0
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              Current Week
            </button>
            <button
              onClick={() => setSelectedWeekOffset((prev) => prev + 1)}
              disabled={selectedWeekOffset >= 0}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all disabled:opacity-30 cursor-pointer"
              title="Next Week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Weekly Metrics Summary Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Total Work Hours</span>
            <span className="text-lg font-bold text-indigo-300 font-mono mt-0.5 block">
              {weeklyData?.total_work_hours || 0} hrs
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Present Days</span>
            <span className="text-lg font-bold text-emerald-400 mt-0.5 block">
              {weeklyData?.days_present || 0}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Half-Day Shifts</span>
            <span className="text-lg font-bold text-amber-400 mt-0.5 block">
              {weeklyData?.days_half_day || 0}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Approved Leave</span>
            <span className="text-lg font-bold text-purple-400 mt-0.5 block">
              {weeklyData?.days_leave || 0}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Absent Days</span>
            <span className="text-lg font-bold text-rose-400 mt-0.5 block">
              {weeklyData?.days_absent || 0}
            </span>
          </div>
        </div>

        {/* 7-Day Visual Calendar Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-3 pt-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayName, idx) => {
            // Find corresponding record from weeklyData.records
            let dayRecord = null;
            let dateObj = null;

            if (weeklyData?.start_date) {
              const start = new Date(weeklyData.start_date);
              dateObj = new Date(start);
              dateObj.setDate(start.getDate() + idx);
              const dateStr = dateObj.toISOString().split('T')[0];
              dayRecord = (weeklyData.records || []).find((r) => r.date === dateStr);
            }

            const isToday = dateObj && dateObj.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
            const isWeekend = idx >= 5;

            return (
              <div
                key={dayName}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between min-h-[120px] ${
                  isToday
                    ? 'bg-gradient-to-b from-indigo-950/40 to-slate-950 border-indigo-500/50 ring-2 ring-indigo-500/20'
                    : isWeekend
                    ? 'bg-slate-950/30 border-slate-800/40 opacity-70'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-bold ${isToday ? 'text-indigo-400' : 'text-slate-300'}`}>
                      {dayName}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {dateObj ? dateObj.getDate() : ''}
                    </span>
                  </div>

                  {dayRecord ? (
                    <div className="space-y-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border block text-center ${getStatusBadge(dayRecord.status)}`}>
                        {dayRecord.status}
                      </span>
                      <span className="text-[11px] text-slate-300 block font-mono text-center">
                        {dayRecord.work_hours} hrs
                      </span>
                    </div>
                  ) : isWeekend ? (
                    <span className="text-[10px] text-slate-400 text-center block pt-2 italic">Weekend</span>
                  ) : (
                    <span className="text-[10px] text-slate-400 text-center block pt-2">No Record</span>
                  )}
                </div>

                {dayRecord?.check_in && (
                  <div className="pt-2 border-t border-slate-800/60 text-[9px] font-mono text-slate-400 flex justify-between">
                    <span>{formatTime(dayRecord.check_in)}</span>
                    <span>{formatTime(dayRecord.check_out)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* 3. Historical Attendance Log Table */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Attendance Log History</h3>
              <p className="text-xs text-slate-400">Past 30 days of employee attendance records</p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {historyRecords.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Check In</th>
                <th className="py-3 px-4">Check Out</th>
                <th className="py-3 px-4">Total Hours</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {historyRecords.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-200 font-mono">
                    {new Date(r.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">
                    {r.check_in ? formatTime(r.check_in) : '--:--'}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">
                    {r.check_out ? formatTime(r.check_out) : '--:--'}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                    {r.work_hours ? `${r.work_hours} hrs` : '0.0 hrs'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(r.status)}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 truncate max-w-[200px]">
                    {r.notes || '-'}
                  </td>
                </tr>
              ))}

              {historyRecords.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                    No attendance records found. Click Check In to start your first shift.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
