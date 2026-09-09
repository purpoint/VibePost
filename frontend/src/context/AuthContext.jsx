import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, setUnauthorizedHandler } from '../services/api.js';
import { getStoredToken, setStoredToken, clearStoredToken } from '../utils/tokenStorage.js';
import { useToast } from './ToastContext.jsx';

const AuthContext = createContext(null);

/**
 * Owns the authenticated user for the whole app.
 *
 * `initialising` covers the first /auth/me call after a page load. Routes wait
 * on it so a logged-in user is never flashed the login screen on refresh.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => getStoredToken());
  const [initialising, setInitialising] = useState(true);
  const { showError } = useToast();

  const applySession = useCallback((session) => {
    setStoredToken(session.token);
    setToken(session.token);
    setUser(session.user);
  }, []);

  const logout = useCallback(() => {
    clearStoredToken();
    setToken(null);
    setUser(null);
  }, []);

  // Restore the session on load; an invalid or expired token is discarded.
  useEffect(() => {
    let cancelled = false;

    async function restore() {
      if (!getStoredToken()) {
        setInitialising(false);
        return;
      }
      try {
        const { user: currentUser } = await authApi.me();
        if (!cancelled) setUser(currentUser);
      } catch {
        if (!cancelled) logout();
      } finally {
        if (!cancelled) setInitialising(false);
      }
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, [logout]);

  // An expired token on any request ends the session immediately.
  useEffect(() => {
    setUnauthorizedHandler((message) => {
      if (getStoredToken()) {
        logout();
        showError(message);
      }
    });
    return () => setUnauthorizedHandler(null);
  }, [logout, showError]);

  const login = useCallback(
    async (credentials) => {
      applySession(await authApi.login(credentials));
    },
    [applySession]
  );

  const signup = useCallback(
    async (details) => {
      applySession(await authApi.signup(details));
    },
    [applySession]
  );

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user),
      initialising,
      login,
      signup,
      logout,
    }),
    [user, token, initialising, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
