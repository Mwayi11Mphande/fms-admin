// components/auth/auth-provider.tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { verifySession, logoutUser } from "@/actions/auth";

interface User {
  uid: string;
  email: string;
  name: string;
  role: string;
  isAdmin: boolean;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const checkAuth = async () => {
    try {
      const result = await verifySession();
      
      if (result.valid && result.user) {
        setUser(result.user as User);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [pathname]);

  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const refresh = async () => {
    await checkAuth();
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}