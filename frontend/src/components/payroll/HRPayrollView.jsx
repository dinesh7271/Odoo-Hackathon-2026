import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function HRPayrollView() {
  const { token } = useAuth();
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('directory');
  const [editingPayroll, setEditingPayroll] = useState(null);
  const [editBasic, setEditBasic] = useState(0);
  const [editAllowances, setEditAllowances] = useState(0);
  const [editDeductions, setEditDeductions] = useState(0);
  const [editEffectiveDate, setEditEffectiveDate] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const fetchPayrolls = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/payroll`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch employee payroll records');
      const data = await res.json();
      setPayrolls(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (payroll) => {
    setEditingPayroll(payroll);
    setEditBasic(payroll.basic_salary);
    setEditAllowances(payroll.allowances);
    setEditDeductions(payroll.deductions);
    setEditEffectiveDate(payroll.effective_date);
  };

  const saveSalaryStructure = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/payroll/${editingPayroll.employee_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          basic_salary: parseFloat(editBasic) || 0,
          allowances: parseFloat(editAllowances) || 0,
          deductions: parseFloat(editDeductions) || 0,
          effective_date: editEffectiveDate,
        }),
      });
      if (!res.ok) throw new Error('Failed to update salary structure');
      const updated = await res.json();
      setPayrolls((prev) => prev.map((p) => (p.employee_id === updated.employee_id ? updated : p)));
      setEditingPayroll(null);
      setSuccess(`Successfully updated salary for ${updated.employee_name}!`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const liveNet = (parseFloat(editBasic) || 0) + (parseFloat(editAllowances) || 0) - (parseFloat(editDeductions) || 0);

  const metrics = payrolls.length > 0 ? {
    total: payrolls.reduce((a, p) => a + p.net_salary, 0),
    avg: payrolls.reduce((a, p) => a + p.net_salary, 0) / payrolls.length,
    max: Math.max(...payrolls.map((p) => p.net_salary)),
    min: Math.min(...payrolls.map((p) => p.net_salary)),
  } : { total: 0, avg: 0, max: 0, min: 0 };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500 border-r-2 border-transparent" />
        <span className="text-slate-400 text-xs font-semibold mt-4">Loading payroll data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">HR Payroll Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage salaries and payroll analytics across the organization</p>
        </div>
        <div className="flex gap-2">
          {[{ id: 'directory', label: '💼 Directory' }, { id: 'reports', label: '📈 Reports' }].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === id ? 'bg-purple-600 text-white shadow-lg' : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Toast messages */}
      {success && <div className="bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 rounded-xl p-4 text-xs font-semibold">{success}</div>}
      {error && <div className="bg-rose-950/20 border border-rose-900/40 text-rose-400 rounded-xl p-4 text-xs font-mono">{error}</div>}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Monthly Budget', value: `$${metrics.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, color: 'text-indigo-400' },
              { label: 'Average Net Salary', value: `$${metrics.avg.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, color: 'text-emerald-400' },
              { label: 'Maximum Pay', value: `$${metrics.max.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, color: 'text-purple-400' },
              { label: 'Minimum Pay', value: `$${metrics.min.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, color: 'text-rose-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-slate-900/30 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <span className={`text-[10px] font-mono uppercase tracking-wider font-bold block ${color}`}>{label}</span>
                <span className={`text-3xl font-extrabold block mt-3 font-mono ${color}`}>{value}</span>
              </div>
            ))}
          </div>
          <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-200 mb-4">All Employee Payroll Summary</h3>
            <div className="space-y-3">
              {payrolls.map((p) => (
                <div key={p.employee_id} className="flex items-center justify-between bg-slate-950/50 rounded-2xl p-4 border border-slate-900">
                  <div>
                    <span className="text-sm font-semibold text-slate-200">{p.employee_name || 'N/A'}</span>
                    <span className="text-[10px] font-mono text-slate-500 block">{p.employee_id} · {p.department || 'N/A'}</span>
                  </div>
                  <span className="text-lg font-bold font-mono text-slate-100">
                    ${p.net_salary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Directory Tab */}
      {activeTab === 'directory' && (
        <div className="bg-slate-900/30 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-200">Employee Salaries Directory</h3>
            <p className="text-xs text-slate-500 mt-0.5">Full payroll directory — click "Edit" to update salary structures</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs font-mono uppercase bg-slate-950/40">
                  <th className="py-4 px-6">Employee</th>
                  <th className="py-4 px-6">Base Salary</th>
                  <th className="py-4 px-6">Allowances (+)</th>
                  <th className="py-4 px-6">Deductions (-)</th>
                  <th className="py-4 px-6">Net Salary</th>
                  <th className="py-4 px-6">Eff. Date</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {payrolls.map((p) => (
                  <tr key={p.employee_id} className="hover:bg-slate-900/20 transition-colors text-slate-300 text-sm">
                    <td className="py-4 px-6">
                      <span className="font-semibold text-slate-200 block">{p.employee_name || 'N/A'}</span>
                      <span className="text-[10px] font-mono text-slate-500 block">{p.employee_id} · {p.job_title || 'Staff'}</span>
                    </td>
                    <td className="py-4 px-6 font-mono">${p.basic_salary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="py-4 px-6 font-mono text-emerald-400">+${p.allowances.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="py-4 px-6 font-mono text-rose-400">-${p.deductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="py-4 px-6 font-mono text-slate-100 font-semibold">${p.net_salary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-500">{p.effective_date}</td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => openEditModal(p)}
                        className="cursor-pointer inline-flex items-center px-3.5 py-1.5 text-xs font-semibold rounded-lg text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500 hover:text-white transition-all"
                      >
                        Edit Salary
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingPayroll && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 right-0 h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-100">Modify Salary Structure</h3>
                  <span className="text-xs text-slate-500 font-mono mt-1 block">
                    Editing: {editingPayroll.employee_name} ({editingPayroll.employee_id})
                  </span>
                </div>
                <button onClick={() => setEditingPayroll(null)} className="cursor-pointer text-slate-500 hover:text-slate-300 text-xl font-bold">&times;</button>
              </div>
              <form onSubmit={saveSalaryStructure} className="space-y-4">
                {[
                  { label: 'Basic Salary ($)', val: editBasic, set: setEditBasic },
                  { label: 'Allowances ($)', val: editAllowances, set: setEditAllowances },
                  { label: 'Deductions ($)', val: editDeductions, set: setEditDeductions },
                ].map(({ label, val, set }) => (
                  <div key={label} className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 block">{label}</label>
                    <input
                      type="number" step="0.01" min="0" required value={val}
                      onChange={(e) => set(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-all font-mono"
                    />
                  </div>
                ))}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 block">Effective Date</label>
                  <input
                    type="date" required value={editEffectiveDate}
                    onChange={(e) => setEditEffectiveDate(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-all font-mono"
                  />
                </div>
                <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-900 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 block uppercase">Live Net Pay</span>
                    <span className="text-xs text-slate-400">Basic + Allowances − Deductions</span>
                  </div>
                  <span className="text-2xl font-bold font-mono text-white">
                    ${liveNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setEditingPayroll(null)}
                    className="cursor-pointer flex-1 py-3 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-sm font-semibold transition-all">
                    Cancel
                  </button>
                  <button type="submit" disabled={isUpdating}
                    className="cursor-pointer flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-50 transition-all">
                    {isUpdating ? 'Saving...' : 'Apply Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
