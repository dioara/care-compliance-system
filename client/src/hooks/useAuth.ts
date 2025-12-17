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
      console.log('[useAuth] Starting logout...');
      
      // Call backend logout first
      await logoutMutation.mutateAsync();
      console.log('[useAuth] Backend logout successful');
    } catch (error) {
      console.error('[useAuth] Backend logout error:', error);
      // Continue with local cleanup even if backend fails
    } finally {
      // Clear token from localStorage
      localStorage.removeItem('auth_token');
      console.log('[useAuth] Token removed from localStorage');
      
      // Clear all tRPC cache to remove user data
      localStorage.removeItem('trpc-cache');
      sessionStorage.clear();
      
      // Clear all cookies by setting them to expire
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      console.log('[useAuth] All cookies cleared');
      
      // Force a hard reload to clear all state and redirect to login
      console.log('[useAuth] Redirecting to login...');
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
