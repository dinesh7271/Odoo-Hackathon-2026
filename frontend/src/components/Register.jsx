import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Register({ onViewChange }) {
  const { register, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('employee'); // 'employee' or 'hr'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      await register(email, role, password);
      setSuccess('Account created successfully! Logging you in...');
      // Automatically log in the user after registration
      setTimeout(async () => {
        try {
          await login(email, password);
        } catch (loginErr) {
          setError('Account created, but automatic login failed. Please sign in manually.');
          onViewChange('login');
        }
      }, 1500);
    } catch (err) {
      setError(err.message || 'Registration failed.');
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="backdrop-blur-md bg-slate-900/40 border border-slate-900 rounded-3xl p-8 shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-slate-800">
        <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Create Account</h2>
          <p className="text-slate-400 text-sm mt-2">Get started with Dayflow HRM</p>
        </div>

        {error && (
          <div className="mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-3 rounded-xl font-medium">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950/60 border border-slate-900 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-sm transition-all"
              placeholder="name@company.com"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950/60 border border-slate-900 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-sm transition-all"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">Select System Role</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole('employee')}
                className={`p-4 rounded-2xl border text-left transition-all focus:outline-none cursor-pointer ${
                  role === 'employee'
                    ? 'border-indigo-500 bg-indigo-500/10 text-white'
                    : 'border-slate-900 bg-slate-950/30 text-slate-400 hover:border-slate-800'
                }`}
              >
                <div className="font-bold text-sm">Employee</div>
                <div className="text-[10px] mt-1 text-slate-500 leading-normal">Check-in, track hours, apply for leaves.</div>
              </button>
              <button
                type="button"
                onClick={() => setRole('hr')}
                className={`p-4 rounded-2xl border text-left transition-all focus:outline-none cursor-pointer ${
                  role === 'hr'
                    ? 'border-purple-500 bg-purple-500/10 text-white'
                    : 'border-slate-900 bg-slate-950/30 text-slate-400 hover:border-slate-800'
                }`}
              >
                <div className="font-bold text-sm">HR Manager</div>
                <div className="text-[10px] mt-1 text-slate-500 leading-normal">Manage database, approve leaves, payroll stats.</div>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all transform active:scale-98 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {submitting ? 'Registering...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-900/60 pt-6">
          <p className="text-slate-400 text-xs">
            Already have an account?{' '}
            <button
              onClick={() => onViewChange('login')}
              className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors focus:outline-none cursor-pointer"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
