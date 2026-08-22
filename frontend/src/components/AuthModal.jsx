import React, { useState } from 'react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import {
  IconUser,
  IconShield,
  IconAlertCircle,
  IconCheckCircle,
} from './Icons';

export function AuthModal() {
  const { login, register, switchDemoRole, isLoading, error } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('employee');
  const [localError, setLocalError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    try {
      if (isLoginMode) {
        await login(email, password);
      } else {
        await register(email, password, role);
      }
    } catch (err) {
      setLocalError(err.message || 'Authentication failed');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
      {/* Top Ambient Glow */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 mx-auto mb-3 text-white font-black text-xl">
          D
        </div>
        <h2 className="text-2xl font-bold text-slate-100">
          {isLoginMode ? 'Sign in to Dayflow' : 'Create an Account'}
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {isLoginMode
            ? 'Access Leave & Time-Off Management portal'
            : 'Register as an Employee or HR administrator'}
        </p>
      </div>

      {/* 1-Click Quick Demo Switchers for Hackathon */}
      <div className="mb-6 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
        <span className="text-[10px] font-mono text-indigo-400 block uppercase tracking-wider mb-2 font-bold text-center">
          1-Click Demo Evaluation Sign-in:
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => switchDemoRole('employee')}
            disabled={isLoading}
            className="cursor-pointer flex items-center justify-center space-x-1.5 p-2 rounded-xl text-xs font-bold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 active:scale-95 transition disabled:opacity-50"
          >
            <IconUser className="w-3.5 h-3.5" />
            <span>Demo Employee</span>
          </button>
          <button
            type="button"
            onClick={() => switchDemoRole('hr')}
            disabled={isLoading}
            className="cursor-pointer flex items-center justify-center space-x-1.5 p-2 rounded-xl text-xs font-bold bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 active:scale-95 transition disabled:opacity-50"
          >
            <IconShield className="w-3.5 h-3.5" />
            <span>Demo HR Admin</span>
          </button>
        </div>
      </div>

      <div className="relative flex py-2 items-center mb-4">
        <div className="flex-grow border-t border-slate-800"></div>
        <span className="flex-shrink mx-3 text-[10px] font-mono text-slate-500 uppercase">Or with credentials</span>
        <div className="flex-grow border-t border-slate-800"></div>
      </div>

      {/* Error Alert */}
      {(localError || error) && (
        <div className="mb-4 p-3 bg-rose-950/40 border border-rose-800/50 rounded-xl flex items-start space-x-2 text-rose-300 text-xs">
          <IconAlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-400" />
          <span>{localError || error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="user@dayflow.local"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {!isLoginMode && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Account Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('employee')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                  role === 'employee'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <IconUser className="w-3.5 h-3.5" />
                <span>Employee</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('hr')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                  role === 'hr'
                    ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <IconShield className="w-3.5 h-3.5" />
                <span>HR Admin</span>
              </button>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="cursor-pointer w-full mt-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/20 active:scale-98 transition disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : isLoginMode ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      <div className="mt-5 text-center">
        <button
          type="button"
          onClick={() => {
            setIsLoginMode(!isLoginMode);
            setLocalError(null);
          }}
          className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
        >
          {isLoginMode
            ? "Don't have an account? Sign up"
            : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
