import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useToast } from '../common/Toast';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Building2,
  DollarSign,
  FileText,
  Edit3,
  Shield,
  CheckCircle2,
  X,
  Lock,
  Calendar,
  Sparkles,
  Download,
  Eye,
  Camera
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=300&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&h=300&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&h=300&fit=crop&crop=face',
];

export function EmployeeProfileView({ targetEmployeeId, isReadOnly = false, onUpdated }) {
  const { user, employee: currentEmployee, isHR, refreshProfile, setEmployee: setContextEmployee } = useAuth();
  const { addToast } = useToast();

  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit form state
  const [formData, setFormData] = useState({
    // Employee editable
    phone: '',
    address: '',
    profile_picture: '',
    // HR editable
    name: '',
    email: '',
    job_title: '',
    department: '',
    salary: '',
  });

  const isViewingSelf = !targetEmployeeId || (currentEmployee && targetEmployeeId === currentEmployee.id);
  const canEditAsHR = isHR;

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      if (isViewingSelf) {
        const data = await api.employees.getMyProfile();
        setProfile(data);
      } else {
        const data = await api.employees.getById(targetEmployeeId);
        setProfile(data);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      addToast(err.message || 'Failed to load profile data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [targetEmployeeId, user?.email]);

  const openEditModal = () => {
    if (!profile) return;
    setFormData({
      phone: profile.phone || '',
      address: profile.address || '',
      profile_picture: profile.profile_picture || '',
      name: profile.name || '',
      email: profile.email || '',
      job_title: profile.job_title || '',
      department: profile.department || '',
      salary: profile.salary ? String(profile.salary) : '',
    });
    setIsEditModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let updated;
      if (isViewingSelf && !isHR) {
        // Regular employee self-update (Address, Phone, Profile Picture ONLY)
        updated = await api.employees.updateMyProfile({
          phone: formData.phone,
          address: formData.address,
          profile_picture: formData.profile_picture,
        });
        setContextEmployee(updated);
        addToast('Your profile was updated successfully!', 'success');
      } else {
        // HR editing (any employee or self as HR)
        const payload = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          job_title: formData.job_title,
          department: formData.department,
          salary: formData.salary ? parseFloat(formData.salary) : null,
          profile_picture: formData.profile_picture,
        };
        const empIdToUpdate = profile.id;
        updated = await api.employees.updateByHR(empIdToUpdate, payload);
        if (isViewingSelf) {
          setContextEmployee(updated);
        }
        addToast(`Profile for ${updated.name} updated successfully!`, 'success');
      }

      setProfile(updated);
      setIsEditModalOpen(false);
      if (onUpdated) onUpdated(updated);
    } catch (err) {
      addToast(err.message || 'Failed to save profile changes', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Parse documents safely
  let documentsList = [];
  if (profile?.documents) {
    try {
      documentsList = typeof profile.documents === 'string' ? JSON.parse(profile.documents) : profile.documents;
    } catch (e) {
      documentsList = [{ title: 'Employment Document', type: 'pdf', date: '2025-01-01', size: '1.2 MB' }];
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <span className="text-sm font-medium text-slate-400">Loading profile details...</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-10 text-center">
        <User className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-200">No Profile Found</h3>
        <p className="text-sm text-slate-400 mt-1">
          The requested employee profile could not be located.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Header Banner & Profile Card */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/40 border border-slate-800/80 shadow-2xl backdrop-blur-xl">
        {/* Ambient Top Glow */}
        <div className="h-32 w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-80 relative">
          <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
        </div>

        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 -mt-16 mb-4">
            
            {/* Avatar & Identifiers */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
              <div className="relative group">
                <img
                  src={profile.profile_picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face'}
                  alt={profile.name}
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover ring-4 ring-slate-950 shadow-2xl bg-slate-900"
                />
                <button
                  onClick={openEditModal}
                  className="absolute bottom-2 right-2 p-2 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 hover:bg-indigo-500 transition-transform active:scale-95 cursor-pointer"
                  title="Change avatar & edit profile"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {profile.name}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {profile.employee_id}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    profile.role === 'hr'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {profile.role === 'hr' ? 'HR Management' : 'Staff Member'}
                  </span>
                </div>
                <p className="text-base font-semibold text-indigo-400">
                  {profile.job_title || 'Position not set'}
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {profile.department || 'General'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {profile.address || 'Address on file'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {!isReadOnly && (
              <button
                onClick={openEditModal}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 active:scale-95 transition-all cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>{canEditAsHR && !isViewingSelf ? 'Edit Staff Profile (HR)' : 'Edit My Profile'}</span>
              </button>
            )}

          </div>
        </div>
      </div>

      {/* 2. Bento Grid: 4 Core Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card A: Personal Details */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl backdrop-blur-xl hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Personal Details</h3>
                <span className="text-xs text-slate-400">Contact and residential information</span>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              Verified
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/40 border border-slate-800/60">
              <Mail className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Official Email</span>
                <span className="text-sm font-semibold text-slate-200 truncate block">{profile.email}</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/40 border border-slate-800/60">
              <Phone className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Phone Number</span>
                  <span className="text-[9px] text-emerald-400 font-medium">Self-Editable</span>
                </div>
                <span className="text-sm font-semibold text-slate-200 block">
                  {profile.phone || <span className="text-slate-400 italic">Not provided</span>}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/40 border border-slate-800/60">
              <MapPin className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Residential Address</span>
                  <span className="text-[9px] text-emerald-400 font-medium">Self-Editable</span>
                </div>
                <span className="text-sm font-semibold text-slate-200 block">
                  {profile.address || <span className="text-slate-400 italic">Not provided</span>}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card B: Job & Organization Details */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl backdrop-blur-xl hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Job Details</h3>
                <span className="text-xs text-slate-400">Position and organizational mapping</span>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
              HR Managed
            </span>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/60">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Employee ID</span>
                <span className="text-sm font-bold text-indigo-400 font-mono mt-0.5 block">{profile.employee_id}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/60">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Department</span>
                <span className="text-sm font-bold text-slate-200 mt-0.5 block">{profile.department || 'Operations'}</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/60">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Official Designation</span>
              <span className="text-sm font-semibold text-slate-200 mt-0.5 block">{profile.job_title || 'Employee'}</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Employment Status</span>
                <span className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" /> Full-Time Active
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Role Permission</span>
                <span className="text-xs font-mono font-bold text-slate-300 uppercase">{profile.role || 'employee'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card C: Salary & Compensation */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl backdrop-blur-xl hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Salary & Compensation</h3>
                <span className="text-xs text-slate-400">Payroll structure & annual CTC</span>
              </div>
            </div>
            <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Lock className="w-3 h-3" /> Confidential
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1">
              Annual Base CTC
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {profile.salary ? `$${profile.salary.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00'}
              </span>
              <span className="text-xs text-slate-400 font-medium">/ year</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-800/80 text-xs">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Monthly Est. Gross</span>
                <span className="font-bold text-slate-200">
                  {profile.salary ? `$${Math.round(profile.salary / 12).toLocaleString()}` : '$0'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Payment Cycle</span>
                <span className="font-bold text-indigo-400">Monthly (End of Month)</span>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
            <Shield className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Salary records are viewable by you and confidential HR administrators only.</span>
          </div>
        </div>

        {/* Card D: Documents & Compliance */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl backdrop-blur-xl hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Documents & Records</h3>
                <span className="text-xs text-slate-400">Signed contracts & certifications</span>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              {documentsList.length} Files
            </span>
          </div>

          <div className="space-y-2.5">
            {documentsList.map((doc, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/50 border border-slate-800/70 hover:border-slate-700 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-200 block truncate group-hover:text-pink-300 transition-colors">
                      {doc.title}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {doc.size || '1.0 MB'} • Uploaded {doc.date || '2025'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => addToast(`Opening preview for ${doc.title}`, 'info')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Download / View document"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}

            {documentsList.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-xs italic">
                No documents uploaded yet.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 3. Edit Profile Modal (Role-Restricted or HR Full Edit) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-8 relative overflow-hidden max-h-[90vh] flex flex-col">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {canEditAsHR && !isViewingSelf ? `Edit ${profile.name} (HR Edit)` : 'Edit Profile Information'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {canEditAsHR && !isViewingSelf
                      ? 'As HR Administrator, you can modify all organization and personal fields.'
                      : 'Employees can update Address, Phone, and Profile Avatar.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="overflow-y-auto py-4 space-y-4 flex-1 pr-1">
              
              {/* Avatar Selector */}
              <div>
                <label className="text-xs font-mono font-semibold text-slate-300 block mb-2 uppercase tracking-wider">
                  Select Profile Avatar
                </label>
                <div className="flex items-center gap-3 mb-3 overflow-x-auto pb-2">
                  {PRESET_AVATARS.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt="Avatar option"
                      onClick={() => setFormData({ ...formData, profile_picture: url })}
                      className={`w-12 h-12 rounded-2xl object-cover cursor-pointer transition-all ${
                        formData.profile_picture === url
                          ? 'ring-4 ring-indigo-500 scale-105 shadow-lg shadow-indigo-500/40'
                          : 'opacity-70 hover:opacity-100 hover:scale-100'
                      }`}
                    />
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Or enter custom image URL"
                  value={formData.profile_picture}
                  onChange={(e) => setFormData({ ...formData, profile_picture: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Editable Fields: Phone & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Residential Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="City, State, Country"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* HR ONLY FIELDS */}
              {canEditAsHR ? (
                <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                    <Shield className="w-4 h-4" />
                    <span>HR Administrator Privileged Fields</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1.5">Full Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1.5">Official Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1.5">Job Title</label>
                      <input
                        type="text"
                        value={formData.job_title}
                        onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1.5">Department</label>
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1.5">Annual Salary ($)</label>
                      <input
                        type="number"
                        value={formData.salary}
                        onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3 text-xs text-slate-400">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Job designation, department, and salary fields are locked for self-editing and can only be updated by the HR Department.
                  </span>
                </div>
              )}

              {/* Submit & Cancel */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? 'Saving Changes...' : 'Save Profile'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
