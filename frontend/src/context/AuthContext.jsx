import React, { createContext, useContext, useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Compat alias for leave-management components
export const DEMO_USERS = {
  employee: { email: 'alex@dayflow.com', password: 'Password123!', role: 'employee', name: 'Alex Morgan' },
  hr:       { email: 'hr@dayflow.com',   password: 'Password123!', role: 'hr',       name: 'Eleanor Vance' },
};
const AuthContext = createContext(null);

export const DEMO_ACCOUNTS = [
  {
    email: 'hr@dayflow.com',
    password: 'Password123!',
    role: 'hr',
    name: 'Eleanor Vance',
    title: 'Head of People & Culture',
    department: 'Human Resources',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face',
    badge: 'HR Admin'
  },
  {
    email: 'alex@dayflow.com',
    password: 'Password123!',
    role: 'employee',
    name: 'Alex Morgan',
    title: 'Senior Frontend Engineer',
    department: 'Engineering',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
    badge: 'Employee'
  },
  {
    email: 'sarah@dayflow.com',
    password: 'Password123!',
    role: 'employee',
    name: 'Sarah Jenkins',
    title: 'Lead Product Designer',
    department: 'Design',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face',
    badge: 'Employee'
  },
];

async function apiCall(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

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

  // On startup: verify existing token or auto-login demo user
  useEffect(() => {
    async function initAuth() {
      const storedToken = localStorage.getItem('dayflow_token');
      if (!storedToken) {
        try {
          await loginWithCredentials('alex@dayflow.com', 'Password123!');
        } catch {
          // Demo user not seeded yet; show login form
        }
        setIsLoading(false);
        return;
      }
      try {
        const data = await apiCall('/api/auth/me', {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        setUser(data.user);
        setEmployee(data.employee || null);
        localStorage.setItem('dayflow_user', JSON.stringify(data.user));
        if (data.employee) localStorage.setItem('dayflow_employee', JSON.stringify(data.employee));
      } catch {
        // Token expired — try auto-login
        try {
          await loginWithCredentials('alex@dayflow.com', 'Password123!');
        } catch {
          logout();
        }
      } finally {
        setIsLoading(false);
      }
    }
    initAuth();
  }, []);

  const loginWithCredentials = async (email, password) => {
    const data = await apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('dayflow_token', data.access_token);
    localStorage.setItem('dayflow_user', JSON.stringify(data.user));
    if (data.employee) localStorage.setItem('dayflow_employee', JSON.stringify(data.employee));
    setToken(data.access_token);
    setUser(data.user);
    setEmployee(data.employee || null);
    return data;
  };

  const login = async (email, password) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const data = await loginWithCredentials(email, password);
      return data;
    } catch (err) {
      setAuthError(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email, password, role = 'employee') => {
    setAuthError(null);
    setIsLoading(true);
    try {
      await apiCall('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, role }),
      });
      // Auto-login after registration
      return await loginWithCredentials(email, password);
    } catch (err) {
      setAuthError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const switchDemoAccount = async (email) => {
    const acc = DEMO_ACCOUNTS.find((a) => a.email === email);
    if (!acc) return;
    setIsLoading(true);
    try {
      await loginWithCredentials(email, acc.password);
    } catch {
      // If user doesn't exist in DB, register then login
      try {
        await apiCall('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ email, password: acc.password, role: acc.role }),
        });
        await loginWithCredentials(email, acc.password);
      } catch (err) {
        setAuthError(`Failed to switch to ${acc.name}: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
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
    if (!token) return;
    try {
      const emp = await apiCall('/api/employees/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployee(emp);
      localStorage.setItem('dayflow_employee', JSON.stringify(emp));
      return emp;
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
  };

  const isHR = (user?.role || '').toLowerCase() === 'hr';

  // Compat aliases for leave-management components
  const switchDemoRole = (role) => {
    const acc = Object.values(DEMO_USERS).find((u) => u.role === role);
    if (acc) switchDemoAccount(acc.email);
  };
  const loadUser = async (tok) => {
    const data = await apiCall('/api/auth/me', { headers: { Authorization: `Bearer ${tok}` } });
    setUser(data.user);
    setEmployee(data.employee || null);
  };

  const value = {
    token,
    user,
    employee,
    role: user?.role || 'employee',
    isHR,
    isAuthenticated: !!token && !!user,
    isLoading,
    authError,
    error: authError,
    login,
    register,
    logout,
    switchDemoAccount,
    switchDemoRole,
    loadUser,
    refreshProfile,
    setEmployee,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
