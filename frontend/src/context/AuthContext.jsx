import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check current session on initial mount (supports HttpOnly cookie, URL token handoff, and stored token)
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Capture token from OAuth redirect query param if present (cross-domain handoff)
      if (typeof window !== 'undefined' && window.location.search) {
        const urlParams = new URLSearchParams(window.location.search);
        const oauthToken = urlParams.get('token');
        if (oauthToken) {
          localStorage.setItem('soulfit_auth_token', oauthToken);
          urlParams.delete('token');
          const remaining = urlParams.toString();
          const cleanUrl = window.location.pathname + (remaining ? `?${remaining}` : '') + window.location.hash;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      }

      const res = await authService.getMe();
      if (res.success && res.data) {
        const userObj = res.data.user || res.data;
        setUser(userObj);
        if (res.data.token) {
          localStorage.setItem('soulfit_auth_token', res.data.token);
        }
        setError(null);
      } else {
        setUser(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('soulfit_auth_token');
          localStorage.removeItem('harmony_auth_token');
        }
      }
    } catch (err) {
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('soulfit_auth_token');
        localStorage.removeItem('harmony_auth_token');
      }
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
      const userObj = res.data.user || res.data;
      setUser(userObj);
      if (res.data.token) {
        localStorage.setItem('soulfit_auth_token', res.data.token);
      }
      setError(null);
      return { success: true, user: userObj };
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
      const userObj = res.data.user || res.data;
      setUser(userObj);
      if (res.data.token) {
        localStorage.setItem('soulfit_auth_token', res.data.token);
      }
      setError(null);
      return { success: true, user: userObj };
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
      if (typeof window !== 'undefined') {
        localStorage.removeItem('soulfit_auth_token');
        localStorage.removeItem('harmony_auth_token');
      }
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
