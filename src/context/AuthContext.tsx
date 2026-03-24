import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthUser, AuthContextType } from "@/types/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
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
    // Mock login - in production, this would call a backend API
    if (!email || !password) {
      throw new Error("Email and password are required");
    }
    const authUser: AuthUser = { id: Date.now().toString(), email, name: email.split("@")[0] };
    setUser(authUser);
    localStorage.setItem("user", JSON.stringify(authUser));
  };

  const signup = async (email: string, password: string, name: string) => {
    // Mock signup - in production, this would call a backend API
    if (!email || !password || !name) {
      throw new Error("All fields are required");
    }
    const authUser: AuthUser = { id: Date.now().toString(), email, name };
    setUser(authUser);
    localStorage.setItem("user", JSON.stringify(authUser));
  };

  const forgotPassword = async (email: string) => {
    // Mock forgot password - in production, this would send an email
    if (!email) {
      throw new Error("Email is required");
    }
    // Just show a success message
    console.log("Password reset email sent to:", email);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, signup, forgotPassword, logout }}>
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
