import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login({ onViewChange }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(email, password);
      // AuthProvider will automatically trigger effect to fetch user and update layout
    } catch (err) {
      setError(err.message || 'Login failed.');
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="backdrop-blur-md bg-slate-900/40 border border-slate-900 rounded-3xl p-8 shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-slate-800">
        <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Welcome Back</h2>
          <p className="text-slate-400 text-sm mt-2">Sign in to manage your day flow</p>
        </div>

        {error && (
          <div className="mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-4 py-3 rounded-xl">
            {error}
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

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all transform active:scale-98 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {submitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-900/60 pt-6">
          <p className="text-slate-400 text-xs">
            Don't have an account?{' '}
            <button
              onClick={() => onViewChange('register')}
              className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors focus:outline-none cursor-pointer"
            >
              Register here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
