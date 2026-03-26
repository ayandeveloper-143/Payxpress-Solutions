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

function loadUserFromStorage(): AuthUser | null {
  try {
    const saved = localStorage.getItem("user");
    return saved ? (JSON.parse(saved) as AuthUser) : null;
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(loadUserFromStorage);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Verify token in background and refresh stored user data.
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

    // No token — clear any stale user data
    if (!token && localStorage.getItem("user")) {
      localStorage.removeItem("user");
      setUser(null);
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
    localStorage.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isAuthLoading,
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
