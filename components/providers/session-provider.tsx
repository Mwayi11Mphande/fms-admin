// components/providers/session-provider.tsx
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { verifySession, logoutUser } from "@/actions/auth";

interface UserSession {
  uid: string;
  email: string;
  name: string;
  role: string;
  status: string;
  permissions: string[];
  isAdmin: boolean;
  loginTime: string;
}

interface SessionContextType {
  user: UserSession | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Check session on mount and route change
  useEffect(() => {
    checkSession();
  }, [pathname]);

  const checkSession = async () => {
    try {
      setLoading(true);
      const result = await verifySession();
      
      if (result.valid && result.user) {
        setUser(result.user as UserSession);
      } else {
        setUser(null);
        
        // If on protected route, redirect to login
        const isProtectedRoute = pathname.startsWith('/dashboard/admin') || 
                                pathname.startsWith('/settings') || 
                                pathname.startsWith('/users');
        
        if (isProtectedRoute) {
          router.push('/login');
        }
      }
    } catch (error) {
      console.error("Session check error:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const refreshSession = async () => {
    await checkSession();
  };

  return (
    <SessionContext.Provider value={{ user, loading, logout, refreshSession }}>
      {children}
    </SessionContext.Provider>
  );
}