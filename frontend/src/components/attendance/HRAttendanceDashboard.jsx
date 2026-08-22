import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../common/Toast';
import {
  CalendarCheck,
  Search,
  Filter,
  Building2,
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Calendar,
  Clock,
  Edit3,
  PlusCircle,
  X,
  FileText,
  Shield,
  Download
} from 'lucide-react';

export function HRAttendanceDashboard() {
  const { addToast } = useToast();

  const [records, setRecords] = useState([]);
  const [dailyStats, setDailyStats] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [search, setSearch] = useState('');

  // Manual Adjustment Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modalForm, setModalForm] = useState({
    employee_id: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Present',
    work_hours: '8.0',
    notes: '',
  });

  const departments = ['All', 'Engineering', 'Design', 'Human Resources'];
  const statuses = ['All', 'Present', 'Half-day', 'Absent', 'Leave'];

  // Fetch employees list for dropdown and initial data
  useEffect(() => {
    async function loadEmployees() {
      try {
        const emps = await api.employees.getAll();
        setEmployees(emps || []);
        if (emps && emps.length > 0) {
          setModalForm((prev) => ({ ...prev, employee_id: String(emps[0].id) }));
        }
      } catch (err) {
        console.error('Failed to load employees for HR dashboard:', err);
      }
    }
    loadEmployees();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch daily stats for selected date
      const stats = await api.attendance.getDailySummary(selectedDate);
      setDailyStats(stats);

      // 2. Fetch records with filters
      const data = await api.attendance.getAll({
        date: selectedDate || undefined,
        department: selectedDept === 'All' ? undefined : selectedDept,
        status: selectedStatus === 'All' ? undefined : selectedStatus,
      });

      // Filter locally for search text (employee name, code, job title)
      let filtered = data || [];
      if (search.trim()) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (r) =>
            (r.employee_name && r.employee_name.toLowerCase().includes(q)) ||
            (r.employee_code && r.employee_code.toLowerCase().includes(q)) ||
            (r.department && r.department.toLowerCase().includes(q))
        );
      }

      setRecords(filtered);
    } catch (err) {
      console.error('Failed to load HR attendance data:', err);
      addToast('Failed to load company attendance logs', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 150);
    return () => clearTimeout(timer);
  }, [selectedDate, selectedDept, selectedStatus, search]);

  const handleOpenAdjustModal = (record = null) => {
    if (record) {
      setModalForm({
        employee_id: String(record.employee_id),
        date: record.date,
        status: record.status || 'Present',
        work_hours: record.work_hours ? String(record.work_hours) : '8.0',
        notes: record.notes || '',
      });
    } else {
      setModalForm({
        employee_id: employees.length > 0 ? String(employees[0].id) : '',
        date: selectedDate || new Date().toISOString().split('T')[0],
        status: 'Present',
        work_hours: '8.0',
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveManualAttendance = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        employee_id: parseInt(modalForm.employee_id, 10),
        date: modalForm.date,
        status: modalForm.status,
        work_hours: parseFloat(modalForm.work_hours) || 0.0,
        notes: modalForm.notes || undefined,
      };

      await api.attendance.manual(payload);
      addToast('Attendance record saved successfully!', 'success');
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      addToast(err.message || 'Failed to save attendance adjustment', 'error');
    } finally {
      setIsSaving(false);
    }
  };

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
      
      {/* 1. Header & Summary Stats Bar */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                HR Attendance Management Dashboard
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Live organization check-ins, daily metrics, and manual attendance adjustments.
              </p>
            </div>
          </div>

          {/* Action: Manual Record Button */}
          <button
            onClick={() => handleOpenAdjustModal()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 active:scale-95 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Record / Adjust Attendance</span>
          </button>
        </div>

        {/* Daily Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Total Headcount</span>
            <span className="text-2xl font-extrabold text-white mt-1 block">
              {dailyStats?.total_employees || employees.length || 0}
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-emerald-500/20">
            <span className="text-[10px] font-mono text-emerald-400 uppercase block">Present Today</span>
            <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">
              {dailyStats?.present || 0}
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-amber-500/20">
            <span className="text-[10px] font-mono text-amber-400 uppercase block">Half-Day</span>
            <span className="text-2xl font-extrabold text-amber-400 mt-1 block">
              {dailyStats?.half_day || 0}
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-purple-500/20">
            <span className="text-[10px] font-mono text-purple-400 uppercase block">On Leave</span>
            <span className="text-2xl font-extrabold text-purple-400 mt-1 block">
              {dailyStats?.on_leave || 0}
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-rose-500/20 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-mono text-rose-400 uppercase block">Absent / Pending</span>
            <span className="text-2xl font-extrabold text-rose-400 mt-1 block">
              {dailyStats?.absent || 0}
            </span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Date Picker */}
          <div>
            <label className="text-[10px] font-mono uppercase text-slate-400 font-semibold block mb-1">
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Department Filter */}
          <div>
            <label className="text-[10px] font-mono uppercase text-slate-400 font-semibold block mb-1">
              Department
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-[10px] font-mono uppercase text-slate-400 font-semibold block mb-1">
              Status Filter
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div>
            <label className="text-[10px] font-mono uppercase text-slate-400 font-semibold block mb-1">
              Search Employee
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name or ID..."
                className="w-full text-xs pl-8 pr-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

      </div>

      {/* 2. All-Employees Attendance Table */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Staff Attendance Records</h3>
              <p className="text-xs text-slate-400">
                Filtered logs for {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400 font-semibold">
            {records.length} records found
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              <span className="text-xs text-slate-400 font-medium">Loading attendance logs...</span>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Check In</th>
                  <th className="py-3 px-4">Check Out</th>
                  <th className="py-3 px-4">Total Hours</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-white font-bold text-[11px]">
                          {r.employee_name ? r.employee_name[0] : 'E'}
                        </div>
                        <div>
                          <span className="font-bold text-slate-200 block">{r.employee_name || 'Staff Member'}</span>
                          <span className="text-[10px] font-mono text-slate-400">{r.employee_code || `ID: ${r.employee_id}`}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-medium">
                      {r.department || 'General'}
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
                    <td className="py-3 px-4 text-slate-400 truncate max-w-[150px]">
                      {r.notes || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenAdjustModal(r)}
                        className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold transition-all cursor-pointer"
                        title="Adjust employee attendance status"
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                ))}

                {records.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400 italic">
                      No attendance records match the selected date or filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Manual Attendance Adjustment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 relative overflow-hidden">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Record / Adjust Attendance</h3>
                  <p className="text-xs text-slate-400">HR Administrator manual attendance override</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualAttendance} className="py-4 space-y-4">
              
              {/* Employee Selection */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Select Employee</label>
                <select
                  value={modalForm.employee_id}
                  onChange={(e) => setModalForm({ ...modalForm, employee_id: e.target.value })}
                  required
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employee_id}) - {emp.department}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Date</label>
                  <input
                    type="date"
                    value={modalForm.date}
                    onChange={(e) => setModalForm({ ...modalForm, date: e.target.value })}
                    required
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Attendance Status</label>
                  <select
                    value={modalForm.status}
                    onChange={(e) => setModalForm({ ...modalForm, status: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Present">Present</option>
                    <option value="Half-day">Half-day</option>
                    <option value="Leave">Leave</option>
                    <option value="Absent">Absent</option>
                  </select>
                </div>
              </div>

              {/* Work Hours & Reason */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Work Hours</label>
                <input
                  type="number"
                  step="0.5"
                  value={modalForm.work_hours}
                  onChange={(e) => setModalForm({ ...modalForm, work_hours: e.target.value })}
                  placeholder="8.0"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Adjustment Notes / Justification</label>
                <textarea
                  rows={2}
                  value={modalForm.notes}
                  onChange={(e) => setModalForm({ ...modalForm, notes: e.target.value })}
                  placeholder="e.g. Approved medical leave / manual shift override"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? 'Saving...' : 'Save Attendance'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
