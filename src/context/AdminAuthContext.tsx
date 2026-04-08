import React, { createContext, useContext, useState } from "react";
import { adminLogin, ApiRequestError } from "@/lib/api";

interface AdminAuthContextType {
    isAdminLoggedIn: boolean;
    adminToken: string | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

function loadAdminToken(): string | null {
    try {
        return localStorage.getItem("admin_token");
    } catch {
        return null;
    }
}

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [adminToken, setAdminToken] = useState<string | null>(loadAdminToken);

    const login = async (username: string, password: string) => {
        const res = await adminLogin({ username, password });
        localStorage.setItem("admin_token", res.token);
        setAdminToken(res.token);
    };

    const logout = () => {
        localStorage.removeItem("admin_token");
        setAdminToken(null);
    };

    return (
        <AdminAuthContext.Provider value={{ isAdminLoggedIn: Boolean(adminToken), adminToken, login, logout }}>
            {children}
        </AdminAuthContext.Provider>
    );
};

export const useAdminAuth = (): AdminAuthContextType => {
    const context = useContext(AdminAuthContext);
    if (!context) {
        throw new Error("useAdminAuth must be used within AdminAuthProvider");
    }
    return context;
};
