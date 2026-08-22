import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  User, Users, Clock, CalendarCheck,
  CalendarDays, FileCheck, DollarSign,
  BarChart2, LayoutDashboard, Shield
} from 'lucide-react';

export function Sidebar({ activeTab, setActiveTab }) {
  const { isHR, employee } = useAuth();

  const employeeNav = [
    { id: 'dashboard',   label: 'Dashboard',           icon: LayoutDashboard, desc: 'Summary & recent activity'      },
    { id: 'profile',     label: 'My Profile',          icon: User,            desc: 'Personal & job details'         },
    { id: 'attendance',  label: 'Attendance',          icon: Clock,           desc: 'Daily check-in & weekly view'   },
    { id: 'leaves',      label: 'My Leaves',           icon: CalendarDays,    desc: 'Apply & track leave requests'   },
    { id: 'payroll',     label: 'My Payroll',          icon: DollarSign,      desc: 'Salary & compensation details'  },
  ];

  const hrNav = [
    { id: 'dashboard',      label: 'HR Dashboard',          icon: LayoutDashboard, desc: 'Company-wide overview'           },
    { id: 'profile',        label: 'My Profile',            icon: User,            desc: 'Your personal employee card'     },
    { id: 'directory',      label: 'Employee Directory',    icon: Users,           desc: 'Manage & edit all staff profiles' },
    { id: 'attendance',     label: 'My Attendance',         icon: Clock,           desc: 'Your personal attendance logs'   },
    { id: 'hr-attendance',  label: 'Attendance Dashboard',  icon: CalendarCheck,   desc: 'Company-wide logs & daily stats' },
    { id: 'leaves',         label: 'My Leaves',             icon: CalendarDays,    desc: 'Your own leave requests'         },
    { id: 'hr-leaves',      label: 'Leave Approvals',       icon: FileCheck,       desc: 'Approve / reject leave requests' },
    { id: 'hr-payroll',     label: 'Payroll Management',    icon: BarChart2,       desc: 'Manage salaries & analytics'     },
  ];

  const navItems = isHR ? hrNav : employeeNav;

  return (
    <aside className="w-full lg:w-72 shrink-0">
      <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-5 space-y-5 sticky top-20 shadow-xl">

        {/* User Card */}
        <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <div className="relative">
            <img
              src={employee?.profile_picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=face'}
              alt={employee?.name || 'User'}
              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-500/40"
            />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-slate-100 truncate">{employee?.name || 'Loading...'}</h4>
            <p className="text-xs text-indigo-400 font-medium truncate">{employee?.job_title || 'Dayflow Staff'}</p>
            <span className="inline-block mt-0.5 text-[10px] font-mono text-slate-500 uppercase">
              {employee?.department || 'Operations'}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold px-3 block mb-2">
            Module Navigation
          </span>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-start gap-3.5 px-3.5 py-2.5 rounded-2xl text-left transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/20 text-white border border-indigo-500/40 shadow-lg font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <div className={`p-1.5 rounded-xl shrink-0 mt-0.5 ${isActive ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30' : 'bg-slate-800/80 text-slate-400'}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className={`block text-xs font-bold ${isActive ? 'text-white' : 'text-slate-200'}`}>{item.label}</span>
                    <span className="block text-[10px] text-slate-400 font-normal truncate mt-0.5">{item.desc}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Access Badge */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-200 block">
                {isHR ? 'HR Administration Mode' : 'Employee Access Mode'}
              </span>
              <span className="text-[10px] text-slate-400 block leading-tight">
                {isHR ? 'Full access to company HR data' : 'Personal data & self-service'}
              </span>
            </div>
          </div>
        </div>

      </div>
    </aside>
  );
}
