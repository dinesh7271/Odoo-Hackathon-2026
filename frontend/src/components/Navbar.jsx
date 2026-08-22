import React from 'react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import {
  IconUser,
  IconShield,
  IconLogOut,
  IconBriefcase,
} from './Icons';

export function Navbar({ activeTab, setActiveTab }) {
  const { user, role, logout, switchDemoRole, isAuthenticated, isLoading } = useAuth();

  return (
    <header className="border-b border-slate-900 backdrop-blur-md bg-slate-950/70 sticky top-0 z-40 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-white font-black text-lg">D</span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Dayflow
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
                HRMS
              </span>
            </div>
            <span className="text-[10px] block font-mono text-slate-500 leading-none mt-0.5">
              Leave & Time-Off Management
            </span>
          </div>
        </div>

        {/* View Switcher Tabs & Role Context */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Quick Role / Demo Switcher for Hackathon Evaluation */}
          <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-2xl p-1 shadow-inner">
            <button
              onClick={() => {
                setActiveTab('employee');
                if (role !== 'employee') switchDemoRole('employee');
              }}
              disabled={isLoading}
              className={`cursor-pointer flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                role === 'employee'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <IconUser className="w-3.5 h-3.5" />
              <span>Employee Portal</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('hr');
                if (role !== 'hr') switchDemoRole('hr');
              }}
              disabled={isLoading}
              className={`cursor-pointer flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                role === 'hr'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <IconShield className="w-3.5 h-3.5" />
              <span>HR Admin</span>
            </button>
          </div>

          {/* User Profile Pill */}
          {user && (
            <div className="hidden md:flex items-center space-x-2 bg-slate-900/60 border border-slate-800/80 px-3 py-1.5 rounded-2xl text-xs text-slate-300">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                {user.email.charAt(0)}
              </div>
              <span className="font-medium text-slate-300 max-w-[120px] truncate">{user.email}</span>
            </div>
          )}

          {/* Logout */}
          {isAuthenticated && (
            <button
              onClick={logout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 rounded-xl transition cursor-pointer"
            >
              <IconLogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
