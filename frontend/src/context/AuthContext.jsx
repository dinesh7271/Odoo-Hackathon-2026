import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiLogin, apiRegister, apiGetMe } from '../api/auth';

const AuthContext = createContext(null);

export const DEMO_USERS = {
  employee: {
    email: 'sarah.connor@dayflow.local',
    password: 'Password123!',
    role: 'employee',
    name: 'Sarah Connor',
  },
  hr: {
    email: 'hr.manager@dayflow.local',
    password: 'AdminPassword123!',
    role: 'hr',
    name: 'HR Manager',
  },
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('dayflow_token') || null);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(() => localStorage.getItem('dayflow_role') || 'employee');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Validate or fetch user details on load
  const loadUser = async (authToken) => {
    try {
      setIsLoading(true);
      const userData = await apiGetMe(authToken);
      setUser(userData);
      setRole(userData.role);
      localStorage.setItem('dayflow_role', userData.role);
    } catch (err) {
      console.warn('Session expired or invalid:', err.message);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadUser(token);
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    setError(null);
    setIsLoading(true);
    try {
      const data = await apiLogin(email, password);
      localStorage.setItem('dayflow_token', data.access_token);
      localStorage.setItem('dayflow_role', data.role);
      setToken(data.access_token);
      setRole(data.role);
      await loadUser(data.access_token);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email, password, userRole = 'employee') => {
    setError(null);
    setIsLoading(true);
    try {
      const registered = await apiRegister(email, password, userRole);
      // Auto-login after registration
      return await login(email, password);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('dayflow_token');
    localStorage.removeItem('dayflow_role');
    setToken(null);
    setUser(null);
    setRole('employee');
  };

  // Quick switch for hackathon evaluation: logs in as demo user or registers if not existing
  const switchDemoRole = async (targetRole) => {
    const demo = DEMO_USERS[targetRole];
    if (!demo) return;
    try {
      setIsLoading(true);
      try {
        await login(demo.email, demo.password);
      } catch {
        // If demo user doesn't exist yet, auto-register then login
        await apiRegister(demo.email, demo.password, demo.role);
        await login(demo.email, demo.password);
      }
    } catch (err) {
      setError(`Failed switching to demo ${targetRole}: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        role,
        isAuthenticated: !!token,
        isLoading,
        error,
        login,
        register,
        logout,
        switchDemoRole,
        loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
