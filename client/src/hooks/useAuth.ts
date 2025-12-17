import { trpc } from "@/lib/trpc";
import { useEffect } from "react";

export function useAuth() {
  const { data: user, isLoading, error, refetch } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation();

  useEffect(() => {
    console.log("[useAuth] Auth state:", { user, isLoading, error, isAuthenticated: !!user });
  }, [user, isLoading, error]);

  const logout = async () => {
    try {
      // Clear token from localStorage
      localStorage.removeItem('auth_token');
      console.log('[useAuth] Token removed from localStorage');
      // Call backend logout
      await logoutMutation.mutateAsync();
    } catch (error) {
      console.error('[useAuth] Logout error:', error);
      // Even if backend logout fails, still clear local state and redirect
    } finally {
      // Always redirect to login
      window.location.href = '/login';
    }
  };

  return {
    user: user || null,
    loading: isLoading,
    error,
    isAuthenticated: !!user,
    refetch,
    logout,
  };
}
