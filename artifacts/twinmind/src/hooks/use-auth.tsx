import React, { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { useGetMe } from "@workspace/api-client-react";
import { getToken, clearToken } from "@/lib/auth";
import { useLocation } from "wouter";

interface AuthContextType {
  user: any | null;
  isLoading: boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(getToken());
  const [, setLocation] = useLocation();

  const { data: user, isLoading: isUserLoading, error } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    },
  });

  const logout = () => {
    clearToken();
    setTokenState(null);
    setLocation("/login");
  };

  useEffect(() => {
    if (error) {
      logout();
    }
  }, [error]);

  const value = {
    user: user || null,
    isLoading: isUserLoading && !!token,
    isAuthenticated: !!token && !!user,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
