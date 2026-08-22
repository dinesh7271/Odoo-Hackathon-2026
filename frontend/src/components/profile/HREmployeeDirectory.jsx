import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../common/Toast';
import { EmployeeProfileView } from './EmployeeProfileView';
import {
  Users,
  Search,
  Filter,
  Building2,
  Mail,
  Phone,
  DollarSign,
  Edit3,
  Eye,
  Shield,
  UserPlus,
  Briefcase,
  X
} from 'lucide-react';

export function HREmployeeDirectory() {
  const { addToast } = useToast();
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const data = await api.employees.getAll({
        department: selectedDept === 'All' ? undefined : selectedDept,
        search: search || undefined,
      });
      setEmployees(data);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
      addToast('Failed to load employee directory', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEmployees();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, selectedDept]);

  const departments = ['All', 'Engineering', 'Design', 'Human Resources'];

  const handleOpenDetail = (empId) => {
    setSelectedEmployeeId(empId);
    setIsModalOpen(true);
  };

  const handleEmployeeUpdated = () => {
    fetchEmployees();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Employee Management Directory
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                View, filter, and manage organizational profiles, compensation, and credentials.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-mono font-bold">
              Total Staff: {employees.length}
            </span>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, role, email, or employee ID..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Department Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedDept === dept
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-bold'
                    : 'bg-slate-950/50 text-slate-400 hover:text-slate-200 border border-slate-800/80 hover:bg-slate-800/50'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Employees Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            <span className="text-xs font-medium text-slate-400">Loading directory...</span>
          </div>
        </div>
      ) : employees.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-200">No Employees Found</h4>
          <p className="text-xs text-slate-400 mt-1">Try refining your search query or department filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-5 shadow-xl backdrop-blur-xl hover:border-slate-700 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Top Info */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={emp.profile_picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face'}
                      alt={emp.name}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-800 group-hover:ring-purple-500/40 transition-all"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-slate-100 group-hover:text-purple-300 transition-colors">
                        {emp.name}
                      </h3>
                      <span className="text-[11px] text-indigo-400 font-semibold block leading-tight">
                        {emp.job_title || 'Position not set'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                        {emp.employee_id}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    emp.role === 'hr' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {emp.role || 'Staff'}
                  </span>
                </div>

                {/* Details List */}
                <div className="space-y-2 text-xs py-3 border-y border-slate-800/70">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" /> Department:
                    </span>
                    <span className="font-semibold text-slate-200">{emp.department || 'General'}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> Email:
                    </span>
                    <span className="font-medium text-slate-300 truncate max-w-[150px]">{emp.email}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Salary:
                    </span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {emp.salary ? `$${emp.salary.toLocaleString()}/yr` : '$0'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-2 flex items-center gap-2">
                <button
                  onClick={() => handleOpenDetail(emp.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition-all active:scale-95 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Inspect & Edit</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Detail & Edit Modal */}
      {isModalOpen && selectedEmployeeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-4xl w-full p-6 sm:p-8 relative overflow-hidden max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <EmployeeProfileView
              targetEmployeeId={selectedEmployeeId}
              onUpdated={handleEmployeeUpdated}
            />
          </div>
        </div>
      )}

    </div>
  );
}
