import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api, { setTokenGetter, setRefreshFn } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessTokenState] = useState(null);
  const [loading, setLoading] = useState(true);
  const tokenRef = useRef(null);

  const setAccessToken = useCallback((token) => {
    tokenRef.current = token;
    setAccessTokenState(token);
    // Keep API interceptors updated
    setTokenGetter(() => tokenRef.current);
  }, []);

  const getAccessToken = useCallback(() => tokenRef.current, []);

  const fetchUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
    } catch {
      setUser(null);
    }
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      const res = await api.post('/auth/refresh');
      const { accessToken: newToken } = res.data;
      setAccessToken(newToken);
      return newToken;
    } catch {
      setAccessToken(null);
      setUser(null);
      return null;
    }
  }, [setAccessToken]);

  // On mount: wire up API and try to restore session
  useEffect(() => {
    setTokenGetter(() => tokenRef.current);
    setRefreshFn(refreshToken);

    async function initAuth() {
      const token = await refreshToken();
      if (token) {
        await fetchUser();
      }
      setLoading(false);
    }
    initAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
    return res.data;
  }, [setAccessToken]);

  const register = useCallback(async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
    return res.data;
  }, [setAccessToken]);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    setAccessToken(null);
    setUser(null);
  }, [setAccessToken]);

  const value = {
    user,
    accessToken,
    setAccessToken,
    getAccessToken,
    refreshToken,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!accessToken && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
