import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrapAuth() {
      const token = localStorage.getItem('hrms_access_token');

      try {
        if (token) {
          const { data } = await api.get('/auth/me');
          setUser(data.user);
        } else {
          const { data } = await api.post('/auth/refresh');
          localStorage.setItem('hrms_access_token', data.accessToken);
          setUser(data.user);
        }
      } catch (error) {
        localStorage.removeItem('hrms_access_token');
      } finally {
        setLoading(false);
      }
    }

    bootstrapAuth();
  }, []);

  const value = useMemo(() => {
    const permissions = user?.permissions || {};

    function hasPermission(moduleKey, action = 'view') {
      if (!user) return false;
      if (user.role === 'admin') return true;

      const modulePermission = permissions[moduleKey];
      if (!modulePermission?.enabled) return false;
      return (modulePermission.actions || []).includes(action);
    }

    function canSeeModule(moduleKey, requiredAction = 'view') {
      if (!user) return false;
      if (user.role === 'admin') return true;

      const modulePermission = permissions[moduleKey];
      if (!modulePermission?.enabled || !modulePermission?.showInSidebar) return false;
      return (modulePermission.actions || []).includes(requiredAction);
    }

    return {
      user,
      loading,
      permissions,
      isAuthenticated: Boolean(user),
      hasPermission,
      canSeeModule,
      async login(credentials) {
        const { data } = await api.post('/auth/login', credentials);
        localStorage.setItem('hrms_access_token', data.accessToken);
        setUser(data.user);
        return data;
      },
      async logout() {
        try {
          await api.post('/auth/logout');
        } finally {
          localStorage.removeItem('hrms_access_token');
          setUser(null);
        }
      },
      async refreshProfile() {
        const { data } = await api.get('/auth/me');
        setUser(data.user);
        return data.user;
      },
      canApproveAdvance() {
        return hasPermission('advance', 'approve');
      },
      canPayAdvance() {
        return hasPermission('advance', 'pay');
      }
    };
  }, [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
