import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthUser, AuthContextType } from "@/types/auth";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  startForgotPassword,
  startSignup,
  verifySignupLink,
} from "@/lib/api";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  // Restore auth state from JWT and fallback stored user data.
  useEffect(() => {
    const token = localStorage.getItem("auth_token");

    if (token) {
      getCurrentUser()
        .then((response) => {
          const authUser: AuthUser = {
            id: response.user.id,
            email: response.user.email,
            name: response.user.name,
          };
          setUser(authUser);
          localStorage.setItem("user", JSON.stringify(authUser));
        })
        .catch(() => {
          setUser(null);
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user");
        });
      return;
    }

    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Failed to load user from localStorage", error);
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await loginUser({ email, password });
    const authUser: AuthUser = {
      id: response.user.id,
      email: response.user.email,
      name: response.user.name,
    };
    setUser(authUser);
    localStorage.setItem("auth_token", response.token);
    localStorage.setItem("user", JSON.stringify(authUser));
  };

  const signup = async (email: string, password: string, name: string) => {
    const response = await startSignup({ name, email, password });
    return {
      requiresEmailVerification: response.requiresEmailVerification,
      email: response.email,
    };
  };

  const verifySignupToken = async (token: string) => {
    const response = await verifySignupLink({ token });
    const authUser: AuthUser = {
      id: response.user.id,
      email: response.user.email,
      name: response.user.name,
    };

    setUser(authUser);
    localStorage.setItem("auth_token", response.token);
    localStorage.setItem("user", JSON.stringify(authUser));
    return response.message;
  };

  const forgotPassword = async (email: string) => {
    await startForgotPassword({ email });
  };

  const logout = () => {
    logoutUser().catch(() => {
      // Ignore network/logout errors and clear local state anyway.
    });
    setUser(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        login,
        signup,
        verifySignupToken,
        forgotPassword,
        logout,
      }}
    >
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
