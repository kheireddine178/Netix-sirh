"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "admin" | "rh" | "manager" | "direction" | "salarie";

export interface UserSession {
  id: string;
  nom: string;
  email: string;
  role: UserRole;
  poste: string;
}

interface AuthContextType {
  user: UserSession;
  setRole: (role: UserRole) => void;
  canAccess: (requiredRoles: UserRole[]) => boolean;
}

const DEFAULT_USER: UserSession = {
  id: "usr-admin-1",
  nom: "Kharrouby Kheireddine",
  email: "k.kharrouby@netix-sirh.dz",
  role: "admin",
  poste: "Responsable RH & Paie",
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("netix_user_role");
      if (saved && ["admin", "rh", "manager", "direction", "salarie"].includes(saved)) {
        return { ...DEFAULT_USER, role: saved as UserRole };
      }
    }
    return DEFAULT_USER;
  });

  const setRole = (newRole: UserRole) => {
    setUser((prev) => {
      const updated = { ...prev, role: newRole };
      if (typeof window !== "undefined") {
        localStorage.setItem("netix_user_role", newRole);
      }
      return updated;
    });
  };

  const canAccess = (requiredRoles: UserRole[]) => {
    return requiredRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, setRole, canAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
