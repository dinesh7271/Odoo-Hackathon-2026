import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const DEMO_ACCOUNTS = [
  {
    email: 'hr@dayflow.com',
    role: 'hr',
    name: 'Eleanor Vance',
    title: 'Head of People & Culture',
    department: 'Human Resources',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face',
    badge: 'HR Admin'
  },
  {
    email: 'alex@dayflow.com',
    role: 'employee',
    name: 'Alex Morgan',
    title: 'Senior Frontend Engineer',
    department: 'Engineering',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
    badge: 'Employee'
  },
  {
    email: 'sarah@dayflow.com',
    role: 'employee',
    name: 'Sarah Jenkins',
    title: 'Lead Product Designer',
    department: 'Design',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face',
    badge: 'Employee'
  },
  {
    email: 'david@dayflow.com',
    role: 'employee',
    name: 'David Kim',
    title: 'Staff Backend Architect',
    department: 'Engineering',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    badge: 'Employee'
  },
];

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('dayflow_token'));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('dayflow_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [employee, setEmployee] = useState(() => {
    const saved = localStorage.getItem('dayflow_employee');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Initialize and verify user on load
  useEffect(() => {
    async function initAuth() {
      const storedToken = localStorage.getItem('dayflow_token');
      if (!storedToken) {
        // Auto-login as demo employee Alex for instant hackathon showcase
        await switchDemoAccount('alex@dayflow.com');
        setIsLoading(false);
        return;
      }

      try {
        const data = await api.auth.getMe();
        setUser(data.user);
        setEmployee(data.employee);
        localStorage.setItem('dayflow_user', JSON.stringify(data.user));
        if (data.employee) {
          localStorage.setItem('dayflow_employee', JSON.stringify(data.employee));
        }
      } catch (err) {
        console.warn('Session expired or backend restarted. Logging in demo user...');
        await switchDemoAccount('alex@dayflow.com');
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (email, password = 'Password123!') => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const data = await api.auth.login(email, password);
      localStorage.setItem('dayflow_token', data.access_token);
      localStorage.setItem('dayflow_user', JSON.stringify(data.user));
      if (data.employee) {
        localStorage.setItem('dayflow_employee', JSON.stringify(data.employee));
      }
      setToken(data.access_token);
      setUser(data.user);
      setEmployee(data.employee);
      return data;
    } catch (err) {
      setAuthError(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const switchDemoAccount = async (email) => {
    return login(email, 'Password123!');
  };

  const logout = () => {
    localStorage.removeItem('dayflow_token');
    localStorage.removeItem('dayflow_user');
    localStorage.removeItem('dayflow_employee');
    setToken(null);
    setUser(null);
    setEmployee(null);
  };

  const refreshProfile = async () => {
    try {
      const data = await api.employees.getMyProfile();
      setEmployee(data);
      localStorage.setItem('dayflow_employee', JSON.stringify(data));
      return data;
    } catch (err) {
      console.error('Failed to refresh employee profile:', err);
    }
  };

  const isHR = (user?.role || '').toLowerCase() === 'hr';

  const value = {
    token,
    user,
    employee,
    role: user?.role || 'employee',
    isHR,
    isAuthenticated: !!token && !!user,
    isLoading,
    authError,
    login,
    logout,
    switchDemoAccount,
    refreshProfile,
    setEmployee,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
