import { ReactNode } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Spinner } from "@phosphor-icons/react";

interface ProtectedRouteProps {
  children: ReactNode;
  feature: string;
}

/**
 * ProtectedRoute component that checks if the user has access to a specific feature.
 * Super admins always have access. Regular users need the feature permission from their roles.
 */
export function ProtectedRoute({ children, feature }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  // Fetch user's feature permissions
  const { data: userFeatures = [], isLoading: featuresLoading } = trpc.roles.getMyFeatures.useQuery(
    undefined,
    { enabled: !!user }
  );

  // Show loading while checking permissions
  if (authLoading || featuresLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Super admins always have access
  if (user?.superAdmin) {
    return <>{children}</>;
  }

  // Check if user has the required feature permission
  const hasAccess = userFeatures.includes(feature);

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <ShieldCheck className="h-6 w-6 text-destructive" weight="bold" />
            </div>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription className="mt-2">
              You don't have permission to access this feature. Please contact your administrator to request access.
            </CardDescription>
            <Button 
              className="mt-4" 
              onClick={() => setLocation("/")}
            >
              Return to Dashboard
            </Button>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

// Feature constants for easy reference
export const FEATURES = {
  STAFF: "staff",
  SERVICE_USERS: "service_users",
  AUDITS: "audits",
  AI_CARE_PLAN_AUDIT: "ai_care_plan_audit",
  AI_CARE_NOTES_AUDIT: "ai_care_notes_audit",
  INCIDENTS: "incidents",
  REPORTS: "reports",
} as const;
