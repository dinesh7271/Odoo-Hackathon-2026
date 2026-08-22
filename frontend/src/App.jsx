import React, { useState, useEffect } from 'react';

function App() {
  // Authentication & Session State
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('user_email') || '');
  const [userRole, setUserRole] = useState(() => localStorage.getItem('user_role') || '');
  
  // Login Form State
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // App Views: 
  // For HR: 'reports' | 'directory'
  // For Employee: 'salary' | 'overview'
  const [activeTab, setActiveTab] = useState('');

  // Payroll Data State
  const [payrolls, setPayrolls] = useState([]);
  const [myPayroll, setMyPayroll] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Editing Modal State
  const [editingPayroll, setEditingPayroll] = useState(null);
  const [editBasic, setEditBasic] = useState(0);
  const [editAllowances, setEditAllowances] = useState(0);
  const [editDeductions, setEditDeductions] = useState(0);
  const [editEffectiveDate, setEditEffectiveDate] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Set default tabs based on role
  useEffect(() => {
    if (token) {
      if (userRole === 'hr') {
        setActiveTab('reports');
      } else {
        setActiveTab('salary');
      }
    }
  }, [token, userRole]);

  // Fetch data depending on active tab/role
  useEffect(() => {
    if (!token) return;

    if (userRole === 'hr' && activeTab === 'directory') {
      fetchHRDirectory();
    } else if (userRole === 'hr' && activeTab === 'reports') {
      fetchHRDirectory(); // Reports need all payroll records to calculate aggregates
    } else if (userRole === 'employee' && activeTab === 'salary') {
      fetchEmployeePayroll();
    } else if (userRole === 'employee' && activeTab === 'overview') {
      fetchEmployeePayroll();
    }
  }, [token, activeTab, userRole]);

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailInput, password: passwordInput }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Invalid email or password');
      }

      const data = await response.json();
      
      // Store in state
      setToken(data.access_token);
      setUserEmail(data.email);
      setUserRole(data.role);
      
      // Store in localStorage
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user_email', data.email);
      localStorage.setItem('user_role', data.role);
    } catch (err) {
      setLoginError(err.message || 'Connection refused. Ensure backend is running.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    setToken('');
    setUserEmail('');
    setUserRole('');
    setPayrolls([]);
    setMyPayroll(null);
    localStorage.clear();
  };

  // Quick Login Helpers for Evaluators
  const quickLogin = (role) => {
    if (role === 'hr') {
      setEmailInput('hr@dayflow.com');
      setPasswordInput('hr123');
    } else {
      setEmailInput('employee@dayflow.com');
      setPasswordInput('emp123');
    }
  };

  // Fetch Employee Payroll
  const fetchEmployeePayroll = async () => {
    setLoadingData(true);
    setDataError('');
    try {
      const response = await fetch(`${API_URL}/api/payroll/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch salary details');
      }
      const data = await response.json();
      setMyPayroll(data);
    } catch (err) {
      setDataError(err.message);
    } finally {
      setLoadingData(false);
    }
  };

  // Fetch HR Directory
  const fetchHRDirectory = async () => {
    setLoadingData(true);
    setDataError('');
    try {
      const response = await fetch(`${API_URL}/api/payroll`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch employee payroll records');
      }
      const data = await response.json();
      setPayrolls(data);
    } catch (err) {
      setDataError(err.message);
    } finally {
      setLoadingData(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (payroll) => {
    setEditingPayroll(payroll);
    setEditBasic(payroll.basic_salary);
    setEditAllowances(payroll.allowances);
    setEditDeductions(payroll.deductions);
    setEditEffectiveDate(payroll.effective_date);
  };

  // Save Salary Structure
  const saveSalaryStructure = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setSuccessMessage('');
    setDataError('');

    try {
      const response = await fetch(`${API_URL}/api/payroll/${editingPayroll.employee_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          basic_salary: parseFloat(editBasic) || 0,
          allowances: parseFloat(editAllowances) || 0,
          deductions: parseFloat(editDeductions) || 0,
          effective_date: editEffectiveDate,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update salary structure');
      }

      const updated = await response.json();
      
      // Update local state list
      setPayrolls(prev => prev.map(item => item.employee_id === updated.employee_id ? updated : item));
      setEditingPayroll(null);
      setSuccessMessage(`Successfully updated salary structure for ${updated.employee_name}!`);
      
      // Auto-clear success message
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setDataError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper calculation for live net salary preview in modal
  const liveNetSalary = (parseFloat(editBasic) || 0) + (parseFloat(editAllowances) || 0) - (parseFloat(editDeductions) || 0);

  // Financial Metrics Calculations (HR Portal)
  const calculateHRMetrics = () => {
    if (payrolls.length === 0) return { total: 0, avg: 0, max: 0, min: 0 };
    const salaries = payrolls.map(p => p.net_salary);
    const total = salaries.reduce((acc, s) => acc + s, 0);
    const avg = total / salaries.length;
    const max = Math.max(...salaries);
    const min = Math.min(...salaries);
    return { total, avg, max, min };
  };

  const metrics = calculateHRMetrics();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-x-hidden relative font-sans">
      {/* Ambient background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-fuchsia-500/10 blur-[120px] pointer-events-none z-0" />

      {/* Header */}
      <header className="border-b border-slate-900 backdrop-blur-md bg-slate-950/50 sticky top-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="text-white font-black text-xl">D</span>
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">Dayflow</span>
              <span className="text-[10px] block font-mono text-slate-500 uppercase tracking-widest leading-none mt-0.5">HRM Portal</span>
            </div>
          </div>

          {token && (
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex flex-col items-end text-right">
                <span className="text-sm font-semibold text-slate-200">{userEmail}</span>
                <span className={`text-[10px] px-2 py-0.5 mt-0.5 rounded-full font-bold uppercase tracking-wider font-mono border ${
                  userRole === 'hr' 
                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  {userRole}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="cursor-pointer inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-xl text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 active:scale-95 transition-all"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-6 z-10">
        <div className="w-full max-w-6xl">
          
          {/* LOGIN SCREEN */}
          {!token ? (
            <div className="max-w-md mx-auto">
              <div className="backdrop-blur-md bg-slate-900/40 border border-slate-900 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-slate-800">
                <div className="absolute top-0 right-0 h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
                    Welcome Back
                  </h1>
                  <p className="text-slate-400 text-xs mt-2">
                    Enter your credentials to access the HRM Payroll Portal.
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                  {loginError && (
                    <div className="bg-rose-950/30 border border-rose-900/40 text-rose-400 rounded-xl p-3.5 text-xs font-mono">
                      {loginError}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 block">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. employee@dayflow.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-900 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 block">Password</label>
                    <input
                      type="password"
                      required
                      placeholder="Enter password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-900 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="cursor-pointer w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 active:scale-98 transition-all disabled:opacity-50"
                  >
                    {loginLoading ? 'Authenticating...' : 'Sign In'}
                  </button>
                </form>

                {/* Quick login buttons for tester */}
                <div className="mt-8 pt-8 border-t border-slate-900">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block text-center mb-3">Quick Demo Accounts</span>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => quickLogin('employee')}
                      className="cursor-pointer bg-slate-950 border border-slate-900 rounded-xl p-2.5 hover:border-slate-800 active:scale-95 transition-all text-left"
                    >
                      <span className="text-[10px] text-emerald-400 font-bold block">EMPLOYEE PORTAL</span>
                      <span className="text-xs font-mono text-slate-300 block mt-0.5">John Doe</span>
                      <span className="text-[9px] font-mono text-slate-600 block">employee@dayflow.com</span>
                    </button>
                    <button
                      onClick={() => quickLogin('hr')}
                      className="cursor-pointer bg-slate-950 border border-slate-900 rounded-xl p-2.5 hover:border-slate-800 active:scale-95 transition-all text-left"
                    >
                      <span className="text-[10px] text-purple-400 font-bold block">HR DASHBOARD</span>
                      <span className="text-xs font-mono text-slate-300 block mt-0.5">Sarah Jenkins</span>
                      <span className="text-[9px] font-mono text-slate-600 block">hr@dayflow.com</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            
            /* PORTAL DASHBOARD */
            <div className="space-y-6">
              
              {/* Tab Navigation & Title */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/20 border border-slate-900 rounded-2xl p-4 backdrop-blur-md">
                <div>
                  <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                    {userRole === 'hr' ? 'HR Management Hub' : 'Employee Salary Portal'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Dayflow HRMS Payroll Analytics & Controls System
                  </p>
                </div>
                
                {/* Tabs */}
                <div className="flex space-x-1 bg-slate-950/80 p-1 rounded-xl border border-slate-900 w-full md:w-auto">
                  {userRole === 'hr' ? (
                    <>
                      <button
                        onClick={() => setActiveTab('reports')}
                        className={`cursor-pointer flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                          activeTab === 'reports' 
                            ? 'bg-purple-600 text-white shadow-lg' 
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                        }`}
                      >
                        📈 Reports & Analytics
                      </button>
                      <button
                        onClick={() => setActiveTab('directory')}
                        className={`cursor-pointer flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                          activeTab === 'directory' 
                            ? 'bg-purple-600 text-white shadow-lg' 
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                        }`}
                      >
                        💼 Payroll Directory
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setActiveTab('salary')}
                        className={`cursor-pointer flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                          activeTab === 'salary' 
                            ? 'bg-emerald-600 text-white shadow-lg' 
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                        }`}
                      >
                        💵 My Salary Information
                      </button>
                      <button
                        onClick={() => setActiveTab('overview')}
                        className={`cursor-pointer flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                          activeTab === 'overview' 
                            ? 'bg-emerald-600 text-white shadow-lg' 
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                        }`}
                      >
                        📊 Attendance & Overview
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Toast Messages */}
              {successMessage && (
                <div className="bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 rounded-xl p-4 text-xs font-semibold animate-pulse">
                  {successMessage}
                </div>
              )}
              {dataError && (
                <div className="bg-rose-950/20 border border-rose-900/40 text-rose-400 rounded-xl p-4 text-xs font-mono">
                  {dataError}
                </div>
              )}

              {/* DYNAMIC VIEW BODY */}
              {loadingData && !myPayroll && payrolls.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-900/10 border border-slate-900 rounded-3xl backdrop-blur-md">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500 border-r-2 border-transparent" />
                  <span className="text-slate-400 text-xs font-semibold mt-4">Retrieving secured records...</span>
                </div>
              ) : (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* --- VIEW: Employee Salary (Read-Only) --- */}
                  {userRole === 'employee' && activeTab === 'salary' && myPayroll && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* Left: Net Pay Big Widget */}
                      <div className="backdrop-blur-md bg-gradient-to-br from-slate-900/60 to-slate-950/60 border border-slate-900 rounded-3xl p-8 shadow-xl flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-emerald-500/5 blur-2xl pointer-events-none" />
                        <div>
                          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest block font-bold">Total Net Compensation</span>
                          <span className="text-4xl md:text-5xl font-black text-white block mt-4 font-mono">
                            ${myPayroll.net_salary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-xs text-slate-500 block mt-2 font-mono">
                            Calculated base net after deductions
                          </span>
                        </div>
                        <div className="mt-8 pt-6 border-t border-slate-900 flex justify-between items-center">
                          <div>
                            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Effective Pay Date</span>
                            <span className="text-xs font-bold text-slate-300 block mt-0.5">{myPayroll.effective_date}</span>
                          </div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Active
                          </span>
                        </div>
                      </div>

                      {/* Right: Structure Details Breakdown */}
                      <div className="lg:col-span-2 backdrop-blur-md bg-slate-900/30 border border-slate-900 rounded-3xl p-8 shadow-xl">
                        <h3 className="text-lg font-bold text-slate-200 mb-6">Salary Structure Breakdown</h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          
                          {/* Basic Salary */}
                          <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-900/60 relative">
                            <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider block font-bold">1. Base Salary</span>
                            <span className="text-2xl font-bold text-slate-100 block mt-3 font-mono">
                              ${myPayroll.basic_salary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                            <p className="text-[10px] text-slate-500 mt-2">Guaranteed monthly basic rate</p>
                          </div>

                          {/* Allowances */}
                          <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-900/60 relative">
                            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block font-bold">2. Allowances (+)</span>
                            <span className="text-2xl font-bold text-emerald-400 block mt-3 font-mono">
                              +${myPayroll.allowances.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                            <p className="text-[10px] text-slate-500 mt-2">Health, travel & special allowances</p>
                          </div>

                          {/* Deductions */}
                          <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-900/60 relative">
                            <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider block font-bold">3. Deductions (-)</span>
                            <span className="text-2xl font-bold text-rose-400 block mt-3 font-mono">
                              -${myPayroll.deductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                            <p className="text-[10px] text-slate-500 mt-2">Provident fund, tax & health deductions</p>
                          </div>
                        </div>

                        {/* Read-Only Notice */}
                        <div className="mt-8 bg-slate-950/40 rounded-xl p-4 border border-slate-900/60 flex items-start gap-3">
                          <span className="text-lg">🔒</span>
                          <div>
                            <span className="text-xs font-semibold text-slate-300 block">Read-Only Employee Payroll Record</span>
                            <span className="text-[11px] text-slate-500 block mt-0.5">
                              Employee accounts are prohibited from modifying salary parameters. If you detect inaccuracies, please submit an amendment request to your designated HR Specialist.
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* --- VIEW: Employee Overview --- */}
                  {userRole === 'employee' && activeTab === 'overview' && myPayroll && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      
                      {/* Attendance Card */}
                      <div className="backdrop-blur-md bg-slate-900/30 border border-slate-900 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Average Attendance</span>
                        <div className="flex items-baseline space-x-2 mt-4">
                          <span className="text-4xl font-extrabold text-indigo-400 font-mono">96.5%</span>
                          <span className="text-xs text-slate-500 font-mono">this month</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full mt-4 overflow-hidden border border-slate-900">
                          <div className="bg-indigo-500 h-full rounded-full" style={{ width: '96.5%' }} />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-4 leading-relaxed">
                          Consistently exceeding departmental average. On-time record verified.
                        </p>
                      </div>

                      {/* Leaves Summary Card */}
                      <div className="backdrop-blur-md bg-slate-900/30 border border-slate-900 rounded-3xl p-6 shadow-xl relative overflow-hidden">
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
                        <p className="text-[10px] text-slate-500 mt-4 leading-relaxed">
                          3 paid annual leave days utilized. Remaining balances expire Dec 31st.
                        </p>
                      </div>

                      {/* Employee Profile Card */}
                      <div className="backdrop-blur-md bg-slate-900/30 border border-slate-900 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Assigned Position Details</span>
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between border-b border-slate-950/60 pb-2">
                            <span className="text-xs text-slate-500">Name</span>
                            <span className="text-xs font-semibold text-slate-200">{myPayroll.employee_name}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-950/60 pb-2">
                            <span className="text-xs text-slate-500">Job Title</span>
                            <span className="text-xs font-semibold text-slate-200">{myPayroll.job_title}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-slate-500">Department</span>
                            <span className="text-xs font-semibold text-slate-200">{myPayroll.department}</span>
                          </div>
                        </div>
                      </div>
                      
                    </div>
                  )}

                  {/* --- VIEW: HR Reports & Analytics --- */}
                  {userRole === 'hr' && activeTab === 'reports' && (
                    <div className="space-y-6">
                      
                      {/* Aggregate Metrics Widgets */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        
                        {/* Total Monthly Payroll Budget */}
                        <div className="backdrop-blur-md bg-slate-900/30 border border-slate-900 rounded-3xl p-6 shadow-xl">
                          <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider font-bold block">Total Monthly Budget</span>
                          <span className="text-3xl font-extrabold text-white block mt-3 font-mono">
                            ${metrics.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-1">Aggregate net payroll cost</span>
                        </div>

                        {/* Average Net Salary */}
                        <div className="backdrop-blur-md bg-slate-900/30 border border-slate-900 rounded-3xl p-6 shadow-xl">
                          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold block">Average Net Salary</span>
                          <span className="text-3xl font-extrabold text-emerald-400 block mt-3 font-mono">
                            ${metrics.avg.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-1">Mean employee net pay</span>
                        </div>

                        {/* Highest Payroll Record */}
                        <div className="backdrop-blur-md bg-slate-900/30 border border-slate-900 rounded-3xl p-6 shadow-xl">
                          <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider font-bold block">Maximum Pay</span>
                          <span className="text-3xl font-extrabold text-slate-100 block mt-3 font-mono">
                            ${metrics.max.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-1">Highest net compensation</span>
                        </div>

                        {/* Lowest Payroll Record */}
                        <div className="backdrop-blur-md bg-slate-900/30 border border-slate-900 rounded-3xl p-6 shadow-xl">
                          <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider font-bold block">Minimum Pay</span>
                          <span className="text-3xl font-extrabold text-slate-100 block mt-3 font-mono">
                            ${metrics.min.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-1">Lowest net compensation</span>
                        </div>

                      </div>

                      {/* Department and Operational Analytics */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Department Budget Share */}
                        <div className="backdrop-blur-md bg-slate-900/30 border border-slate-900 rounded-3xl p-8 shadow-xl">
                          <h3 className="text-base font-bold text-slate-200 mb-6">Department Staff Distribution</h3>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-400">Engineering</span>
                                <span className="text-slate-200 font-mono">1 Employee (50%)</span>
                              </div>
                              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-900">
                                <div className="bg-indigo-500 h-full rounded-full" style={{ width: '50%' }} />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-400">Human Resources</span>
                                <span className="text-slate-200 font-mono">1 Employee (50%)</span>
                              </div>
                              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-900">
                                <div className="bg-purple-500 h-full rounded-full" style={{ width: '50%' }} />
                              </div>
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-6 leading-relaxed">
                            Budget allocations are currently split between primary operations (Engineering) and administrative overhead (HR).
                          </p>
                        </div>

                        {/* Operational KPI Widget (Leave & Attendance Summary) */}
                        <div className="backdrop-blur-md bg-slate-900/30 border border-slate-900 rounded-3xl p-8 shadow-xl">
                          <h3 className="text-base font-bold text-slate-200 mb-6">Operational Attendance & Leaves Summary</h3>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-900/60 text-center">
                              <span className="text-[10px] font-mono text-slate-500 block uppercase">Avg attendance rate</span>
                              <span className="text-3xl font-extrabold text-indigo-400 block mt-2 font-mono">95.4%</span>
                              <span className="text-[9px] text-slate-600 block mt-1">Org-wide attendance</span>
                            </div>
                            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-900/60 text-center">
                              <span className="text-[10px] font-mono text-slate-500 block uppercase">Pending leave requests</span>
                              <span className="text-3xl font-extrabold text-amber-500 block mt-2 font-mono">0 requests</span>
                              <span className="text-[9px] text-slate-600 block mt-1">Zero backlog</span>
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-6 leading-relaxed">
                            Organisational attendance rate is within the target threshold of &gt;95%. Leaves review backlog is currently cleared.
                          </p>
                        </div>

                      </div>

                    </div>
                  )}

                  {/* --- VIEW: HR Payroll Directory (Lists all, allows editing) --- */}
                  {userRole === 'hr' && activeTab === 'directory' && (
                    <div className="backdrop-blur-md bg-slate-900/30 border border-slate-900 rounded-3xl shadow-xl overflow-hidden">
                      
                      <div className="p-6 border-b border-slate-900 bg-slate-900/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <h3 className="text-base font-bold text-slate-200">Employee Salaries Directory</h3>
                          <p className="text-xs text-slate-500">List of all active user payroll structures</p>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-900 text-slate-400 text-xs font-mono uppercase bg-slate-950/40">
                              <th className="py-4 px-6">Employee</th>
                              <th className="py-4 px-6">Base Salary</th>
                              <th className="py-4 px-6">Allowances (+)</th>
                              <th className="py-4 px-6">Deductions (-)</th>
                              <th className="py-4 px-6">Net Salary</th>
                              <th className="py-4 px-6">Effective Date</th>
                              <th className="py-4 px-6 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-900/60">
                            {payrolls.map((payroll) => (
                              <tr key={payroll.employee_id} className="hover:bg-slate-900/20 transition-colors text-slate-300 text-sm">
                                <td className="py-4 px-6">
                                  <div>
                                    <span className="font-semibold text-slate-200 block">{payroll.employee_name || 'N/A'}</span>
                                    <span className="text-[10px] font-mono text-slate-500 block uppercase">{payroll.employee_id} &bull; {payroll.job_title || 'Staff'} &bull; {payroll.department || 'N/A'}</span>
                                  </div>
                                </td>
                                <td className="py-4 px-6 font-mono">${payroll.basic_salary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td className="py-4 px-6 font-mono text-emerald-400">+${payroll.allowances.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td className="py-4 px-6 font-mono text-rose-400">-${payroll.deductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td className="py-4 px-6 font-mono text-slate-100 font-semibold">${payroll.net_salary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td className="py-4 px-6 font-mono text-xs text-slate-500">{payroll.effective_date}</td>
                                <td className="py-4 px-6 text-right">
                                  <button
                                    onClick={() => openEditModal(payroll)}
                                    className="cursor-pointer inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-semibold rounded-lg text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500 hover:text-white transition-all active:scale-95"
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

                </div>
              )}

            </div>
          )}

        </div>
      </main>

      {/* EDIT MODAL DIALOG */}
      {editingPayroll && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-scale-in relative">
            <div className="absolute top-0 right-0 h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-100">Modify Salary Structure</h3>
                  <span className="text-xs text-slate-500 font-mono mt-1 block">
                    Editing: {editingPayroll.employee_name} ({editingPayroll.employee_id})
                  </span>
                </div>
                <button
                  onClick={() => setEditingPayroll(null)}
                  className="cursor-pointer text-slate-500 hover:text-slate-300 text-xl font-bold"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={saveSalaryStructure} className="space-y-5">
                
                {/* Basic Salary */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 block">Basic Salary ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editBasic}
                    onChange={(e) => setEditBasic(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                  />
                </div>

                {/* Allowances */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 block">Allowances ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editAllowances}
                    onChange={(e) => setEditAllowances(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                  />
                </div>

                {/* Deductions */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 block">Deductions ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editDeductions}
                    onChange={(e) => setEditDeductions(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                  />
                </div>

                {/* Effective Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 block">Effective Date</label>
                  <input
                    type="date"
                    required
                    value={editEffectiveDate}
                    onChange={(e) => setEditEffectiveDate(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                  />
                </div>

                {/* Live Net Salary Preview */}
                <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-850 flex justify-between items-center mt-2">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 block uppercase">Autocalculated Net Pay</span>
                    <span className="text-xs text-slate-400 block">Basic + Allowances - Deductions</span>
                  </div>
                  <span className="text-2xl font-bold font-mono text-white">
                    ${liveNetSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Submit Actions */}
                <div className="pt-4 flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setEditingPayroll(null)}
                    className="cursor-pointer flex-1 py-3 px-4 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-sm font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="cursor-pointer flex-1 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 active:scale-98 transition-all disabled:opacity-50"
                  >
                    {isUpdating ? 'Saving...' : 'Apply Changes'}
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 px-6 py-4 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
          <p className="text-xs text-slate-600">
            &copy; {new Date().getFullYear()} Dayflow HRM System. Built for Hackathon 2026.
          </p>
          <div className="flex space-x-4 text-xs font-mono text-slate-500">
            <span>Stack: FastAPI + React + Tailwind v4</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
