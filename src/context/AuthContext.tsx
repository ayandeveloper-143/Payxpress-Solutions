import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { AuthUser, AuthContextType } from "@/types/auth";
import { ApiRequestError } from "@/lib/api";
import type { AuthUserResponse } from "@/lib/api";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  startForgotPassword,
  startSignup,
  verifySignupLink,
} from "@/lib/api";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function loadUserFromStorage(): AuthUser | null {
  try {
    const saved = localStorage.getItem("user");
    return saved ? (JSON.parse(saved) as AuthUser) : null;
  } catch {
    return null;
  }
}

const mapUserFromApi = (user: AuthUserResponse): AuthUser => ({
  id: user.id,
  email: user.email,
  name: user.name,
  orderHistory: Array.isArray(user.orderHistory) ? user.orderHistory : [],
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(loadUserFromStorage);
  const [isAuthLoading, setIsAuthLoading] = useState(() => Boolean(localStorage.getItem("auth_token")));


  // Helper to refresh user/order history on demand
  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setUser(null);
      setIsAuthLoading(false);
      return;
    }
    setIsAuthLoading(true);
    try {
      const response = await getCurrentUser();
      const authUser = mapUserFromApi(response.user);
      setUser(authUser);
      localStorage.setItem("user", JSON.stringify(authUser));
    } catch (error) {
      // Only force logout on token/auth failures. For transient/network/server
      // errors, keep existing session data to avoid unexpected logout loops.
      if (error instanceof ApiRequestError && (error.status === 401 || error.status === 403)) {
        setUser(null);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
      }
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginUser({ email, password });
    const authUser = mapUserFromApi(response.user);
    setUser(authUser);
    localStorage.setItem("auth_token", response.token);
    localStorage.setItem("user", JSON.stringify(authUser));
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    const response = await startSignup({ name, email, password });
    return {
      requiresEmailVerification: response.requiresEmailVerification,
      email: response.email,
    };
  }, []);

  const verifySignupToken = useCallback(async (token: string) => {
    const response = await verifySignupLink({ token });
    return response.message;
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await startForgotPassword({ email });
  }, []);

  const logout = useCallback(() => {
    logoutUser().catch(() => {
      // Ignore network/logout errors and clear local state anyway.
    });
    setUser(null);
    localStorage.clear();
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoggedIn: !!user,
      isAuthLoading,
      login,
      signup,
      verifySignupToken,
      forgotPassword,
      logout,
      refreshUser,
    }),
    [user, isAuthLoading, login, signup, verifySignupToken, forgotPassword, logout, refreshUser]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
