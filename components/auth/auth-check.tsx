// components/auth/auth-check.tsx
"use client";

import { useEffect } from "react";
import { useSession } from "@/components/providers/session-provider";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function AuthCheck({ 
  children, 
  requireAdmin = false 
}: { 
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const { user, loading } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in, redirect to login
        router.push('/login');
      } else if (requireAdmin && !user.isAdmin) {
        // Not admin, redirect to home or unauthorized page
        router.push('/unauthorized');
      }
    }
  }, [user, loading, router, requireAdmin, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-sm text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Redirect will happen in useEffect
  }

  if (requireAdmin && !user.isAdmin) {
    return null; // Redirect will happen in useEffect
  }

  return <>{children}</>;
}