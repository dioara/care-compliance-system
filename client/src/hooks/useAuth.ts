import { trpc } from "@/lib/trpc";
import { useEffect } from "react";

export function useAuth() {
  const { data: user, isLoading, error, refetch } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    console.log("[useAuth] Auth state:", { user, isLoading, error, isAuthenticated: !!user });
  }, [user, isLoading, error]);

  return {
    user: user || null,
    loading: isLoading,
    error,
    isAuthenticated: !!user,
    refetch,
  };
}
