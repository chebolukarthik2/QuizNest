import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";

export function useAuth() {
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.currentUserProfile);
  const { signIn, signOut } = useAuthActions();

  const isLoading = isAuthLoading || user === undefined;

  const role = user?.role ?? null;
  const isStudent = role === "student";
  const isAdmin = role === "admin";

  return {
    isLoading,
    isAuthenticated,
    user,
    role,
    isStudent,
    isAdmin,
    signIn,
    signOut,
  };
}
