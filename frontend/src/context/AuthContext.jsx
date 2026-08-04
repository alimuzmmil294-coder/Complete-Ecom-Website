import { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as authService from "../services/authService";

const AuthContext = createContext(null);

/**
 * On mount, calls GET /auth/me to restore session state from the HTTP-only
 * cookie (the frontend can never read the JWT directly). Consumers must
 * wait for `loading` to become false before making any redirect decisions —
 * redirecting earlier would bounce a logged-in user to the login page
 * before we've had a chance to confirm they're authenticated.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const res = await authService.fetchMe();
      setUser(res.data);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (payload) => {
    const res = await authService.login(payload);
    setUser(res.data);
    return res.data;
  };

  const signup = async (payload) => {
    const res = await authService.signup(payload);
    setUser(res.data);
    return res.data;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    const res = await authService.fetchMe();
    setUser(res.data);
    return res.data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
