import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";

interface RequireAuthProps {
  children: ReactNode;
  requiredRole?: "student" | "admin";
}

export function RequireAuth({ children, requiredRole }: RequireAuthProps) {
  const { isLoading, isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/auth?returnTo=${encodeURIComponent(returnTo)}`}
        replace
      />
    );
  }

  // Role-based protection
  if (requiredRole && role !== requiredRole) {
    if (role === "student") {
      return <Navigate to="/student/dashboard" replace />;
    }
    if (role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
