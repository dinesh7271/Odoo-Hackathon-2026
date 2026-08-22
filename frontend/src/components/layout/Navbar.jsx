import React, { useState } from 'react';
import { useAuth, DEMO_ACCOUNTS } from '../../context/AuthContext';
import { ShieldCheck, UserCheck, ChevronDown, LogOut, RefreshCw, Sparkles, Building2 } from 'lucide-react';
import { useToast } from '../common/Toast';

export function Navbar({ activeTab, setActiveTab }) {
  const { user, employee, isHR, switchDemoAccount, logout } = useAuth();
  const { addToast } = useToast();
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const handleSwitch = async (acc) => {
    try {
      setIsSwitching(true);
      await switchDemoAccount(acc.email);
      addToast(`Switched account to ${acc.name} (${acc.badge})`, 'info');
      setIsSwitcherOpen(false);
    } catch (err) {
      addToast('Failed to switch demo account', 'error');
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ring-1" style={{background:'linear-gradient(135deg,#B8860B,#7A4A1E)',boxShadow:'0 4px 20px #B8860B25',ringColor:'#B8860B30'}}>
            <span className="font-black text-xl" style={{color:'#EEE5D3',fontFamily:'Playfair Display,serif'}}>D</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight" style={{fontFamily:'Playfair Display,serif',background:'linear-gradient(135deg,#EEE5D3,#C4A882)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>
                Dayflow
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider" style={{background:'#B8860B15',color:'#D4A017',border:'1px solid #B8860B30'}}>
                HRMS
              </span>
            </div>
            <span className="text-[11px] block font-medium text-slate-400">
              Human Resource Management
            </span>
          </div>
        </div>

        {/* Center: Demo Account Switcher */}
        <div className="relative">
          <button
            onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
            className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/60 hover:border-slate-600 text-xs font-semibold text-slate-200 transition-all hover:bg-slate-800 shadow-sm cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="hidden sm:inline text-slate-400">Viewing as:</span>
            <span className="text-white font-bold">{employee?.name || user?.email}</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-mono font-bold ${
              isHR ? 'text-amber-300 border border-amber-500/30 bg-amber-500/10' : 'text-emerald-300 border border-emerald-500/30 bg-emerald-500/10'
            }`}>
              {isHR ? 'HR Admin' : 'Employee'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Switcher Dropdown */}
          {isSwitcherOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                  Quick Hackathon Role Switcher
                </span>
              </div>
              <div className="py-1 space-y-1">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    onClick={() => handleSwitch(acc)}
                    disabled={isSwitching}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs transition-all cursor-pointer ${
                      user?.email === acc.email
                        ? 'bg-indigo-600/20 border border-indigo-500/40 text-white'
                        : 'hover:bg-slate-800/70 text-slate-300'
                    }`}
                  >
                    <img
                      src={acc.avatar}
                      alt={acc.name}
                      className="w-8 h-8 rounded-full object-cover border border-slate-700"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-100 truncate">{acc.name}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-mono font-semibold ${
                          acc.role === 'hr' ? 'text-amber-300 bg-amber-500/20' : 'text-emerald-300 bg-emerald-500/20'
                        }`}>
                          {acc.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{acc.title}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Active User Details & Logout */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2.5 pl-3 border-l border-slate-800">
            <img
              src={employee?.profile_picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face'}
              alt="Avatar"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/30"
            />
            <div className="text-right">
              <span className="text-xs font-semibold text-slate-200 block leading-tight">
                {employee?.name || user?.email}
              </span>
              <span className="text-[10px] text-slate-400 font-mono block leading-tight">
                {employee?.employee_id || user?.role}
              </span>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
}
