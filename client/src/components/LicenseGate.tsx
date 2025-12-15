import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Lock, Mail } from "lucide-react";
import { useLocation } from "wouter";

interface LicenseGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function LicenseGate({ children, fallback }: LicenseGateProps) {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: licenseStatus, isLoading: licenseLoading } = trpc.subscription.checkUserLicense.useQuery(
    undefined,
    { enabled: !!user }
  );

  // Still loading
  if (authLoading || licenseLoading) {
    return <>{children}</>;
  }

  // Not logged in - let the auth flow handle it
  if (!user) {
    return <>{children}</>;
  }

  // User has license or is admin
  if (licenseStatus?.hasLicense) {
    return <>{children}</>;
  }

  // User doesn't have a license - show restricted message
  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-orange-600" />
          </div>
          <CardTitle className="text-xl">License Required</CardTitle>
          <CardDescription>
            You need an active license to access this feature
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="default" className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-orange-800">No License Assigned</AlertTitle>
            <AlertDescription className="text-orange-700">
              {licenseStatus?.reason || "Please contact your administrator to assign a license to your account."}
            </AlertDescription>
          </Alert>
          
          <div className="text-center text-sm text-muted-foreground">
            <p>Your administrator can assign a license from the</p>
            <p className="font-medium">Subscription Management</p>
            <p>section in the admin panel.</p>
          </div>

          <div className="flex flex-col gap-2">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setLocation("/")}
            >
              Return to Dashboard
            </Button>
            <Button 
              variant="ghost" 
              className="w-full text-muted-foreground"
              onClick={() => window.location.href = "mailto:support@example.com?subject=License Request"}
            >
              <Mail className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Hook to check license status
export function useLicenseStatus() {
  const { user } = useAuth();
  const { data: licenseStatus, isLoading } = trpc.subscription.checkUserLicense.useQuery(
    undefined,
    { enabled: !!user }
  );

  return {
    hasLicense: licenseStatus?.hasLicense ?? false,
    reason: licenseStatus?.reason,
    isLoading,
    isAdmin: user?.role === "admin" || user?.superAdmin,
  };
}
