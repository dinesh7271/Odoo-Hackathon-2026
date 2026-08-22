import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function EmployeePayrollView() {
  const { token } = useAuth();
  const [payroll, setPayroll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('salary');

  useEffect(() => {
    fetchPayroll();
  }, []);

  const fetchPayroll = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/payroll/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch payroll details');
      const data = await res.json();
      setPayroll(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500 border-r-2 border-transparent" />
        <span className="text-slate-400 text-xs font-semibold mt-4">Loading salary details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-950/20 border border-rose-900/40 text-rose-400 rounded-xl p-4 text-sm">
        {error}
      </div>
    );
  }

  if (!payroll) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">My Payroll</h2>
          <p className="text-xs text-slate-500 mt-0.5">Your salary structure and compensation details</p>
        </div>
        <div className="flex gap-2">
          {['salary', 'overview'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {tab === 'salary' ? '💵 Salary' : '📊 Overview'}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'salary' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Net Pay Big Widget */}
          <div className="bg-gradient-to-br from-slate-900/60 to-slate-950/60 border border-slate-800 rounded-3xl p-8 shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-emerald-500/5 blur-2xl pointer-events-none" />
            <div>
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest block font-bold">Total Net Compensation</span>
              <span className="text-5xl font-black text-white block mt-4 font-mono">
                ${payroll.net_salary?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-slate-500 block mt-2 font-mono">Calculated base net after deductions</span>
            </div>
            <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Effective Pay Date</span>
                <span className="text-xs font-bold text-slate-300 block mt-0.5">{payroll.effective_date}</span>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Active</span>
            </div>
          </div>

          {/* Structure Breakdown */}
          <div className="lg:col-span-2 bg-slate-900/30 border border-slate-800 rounded-3xl p-8 shadow-xl">
            <h3 className="text-lg font-bold text-slate-200 mb-6">Salary Structure Breakdown</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: '1. Base Salary', value: `$${payroll.basic_salary?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: 'text-indigo-400', desc: 'Guaranteed monthly basic rate' },
                { label: '2. Allowances (+)', value: `+$${payroll.allowances?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: 'text-emerald-400', desc: 'Health, travel & special allowances' },
                { label: '3. Deductions (-)', value: `-$${payroll.deductions?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: 'text-rose-400', desc: 'Provident fund, tax & health deductions' },
              ].map(({ label, value, color, desc }) => (
                <div key={label} className="bg-slate-950/60 rounded-2xl p-5 border border-slate-900/60">
                  <span className={`text-[10px] font-mono uppercase tracking-wider block font-bold ${color}`}>{label}</span>
                  <span className={`text-2xl font-bold block mt-3 font-mono ${color}`}>{value}</span>
                  <p className="text-[10px] text-slate-500 mt-2">{desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 bg-slate-950/40 rounded-xl p-4 border border-slate-900/60 flex items-start gap-3">
              <span className="text-lg">🔒</span>
              <div>
                <span className="text-xs font-semibold text-slate-300 block">Read-Only Employee Payroll Record</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  If you detect inaccuracies, please submit an amendment request to your HR Specialist.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Avg Attendance Rate</span>
            <span className="text-4xl font-extrabold text-indigo-400 font-mono block mt-4">96.5%</span>
            <div className="w-full bg-slate-950 h-2 rounded-full mt-4 overflow-hidden border border-slate-900">
              <div className="bg-indigo-500 h-full rounded-full" style={{ width: '96.5%' }} />
            </div>
            <p className="text-[10px] text-slate-500 mt-4">Consistently exceeding departmental average.</p>
          </div>
          <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Leave Balances</span>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <span className="text-2xl font-bold font-mono text-slate-100">12 / 15</span>
                <span className="text-[10px] text-slate-500 block uppercase font-mono mt-0.5">Annual Leave</span>
              </div>
              <div>
                <span className="text-2xl font-bold font-mono text-slate-100">5 / 7</span>
                <span className="text-[10px] text-slate-500 block uppercase font-mono mt-0.5">Sick Leave</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-4">Remaining balances expire Dec 31st.</p>
          </div>
          <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Assigned Position</span>
            <div className="mt-4 space-y-3">
              {[
                { label: 'Name', value: payroll.employee_name },
                { label: 'Job Title', value: payroll.job_title },
                { label: 'Department', value: payroll.department },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between border-b border-slate-900/60 pb-2">
                  <span className="text-xs text-slate-500">{label}</span>
                  <span className="text-xs font-semibold text-slate-200">{value || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
