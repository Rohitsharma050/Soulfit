import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check current session from HttpOnly cookie on initial mount
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authService.getMe();
      if (res.success && res.data) {
        setUser(res.data);
        setError(null);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login handler
  const login = async ({ email, password, rememberMe = false }) => {
    setError(null);
    const res = await authService.login({ email, password, rememberMe });
    if (res.success && res.data) {
      setUser(res.data);
      setError(null);
      return { success: true, user: res.data };
    }
    const message = res.error || 'Authentication failed. Please verify your credentials.';
    setError(message);
    return { success: false, error: message, errors: res.errors || [] };
  };

  // Register handler
  const register = async ({ name, email, password, confirmPassword }) => {
    setError(null);
    const res = await authService.register({ name, email, password, confirmPassword });
    if (res.success && res.data) {
      setUser(res.data);
      setError(null);
      return { success: true, user: res.data };
    }
    const message = res.error || 'Registration failed. Please check your details.';
    setError(message);
    return { success: false, error: message, errors: res.errors || [] };
  };

  // Logout handler
  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      // Proceed with local state clearing even if network fails
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setError(null);
    }
    return { success: true };
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser: checkAuth,
    clearError: () => setError(null),
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

export default AuthContext;
