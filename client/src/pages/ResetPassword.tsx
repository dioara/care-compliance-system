import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Shield, Lock, CheckCircle, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const token = new URLSearchParams(search).get("token") || "";
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Verify token on mount
  const { isLoading: isVerifying, error: tokenError } = trpc.auth.verifyResetToken.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  const resetMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      setIsSuccess(true);
      toast.success("Password reset successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to reset password");
      setIsLoading(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    
    setIsLoading(true);
    resetMutation.mutate({ token, newPassword: password });
  };

  // Invalid or expired token
  if (!token || tokenError) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="p-6">
          <div className="flex items-center gap-2">
            <Shield className="h-7 w-7 text-[#1F7AE0]" />
            <span className="text-xl font-semibold text-gray-900">CCMS</span>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Invalid or Expired Link</h2>
            <p className="text-gray-600 mb-8">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Button
              onClick={() => setLocation("/forgot-password")}
              className="w-full h-11 bg-[#1F7AE0] hover:bg-[#1a6bc7] text-white"
            >
              Request New Link
            </Button>
          </div>
        </div>

        <footer className="p-6 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} CCMS. All rights reserved.</p>
        </footer>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="p-6">
          <div className="flex items-center gap-2">
            <Shield className="h-7 w-7 text-[#1F7AE0]" />
            <span className="text-xl font-semibold text-gray-900">CCMS</span>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Password Reset Complete</h2>
            <p className="text-gray-600 mb-8">
              Your password has been successfully reset. You can now sign in with your new password.
            </p>
            <Button
              onClick={() => setLocation("/login")}
              className="w-full h-11 bg-[#1F7AE0] hover:bg-[#1a6bc7] text-white"
            >
              Sign In
            </Button>
          </div>
        </div>

        <footer className="p-6 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} CCMS. All rights reserved.</p>
        </footer>
      </div>
    );
  }

  // Loading state
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="p-6">
          <div className="flex items-center gap-2">
            <Shield className="h-7 w-7 text-[#1F7AE0]" />
            <span className="text-xl font-semibold text-gray-900">CCMS</span>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-[#1F7AE0] animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Verifying reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="p-6">
        <div className="flex items-center gap-2">
          <Shield className="h-7 w-7 text-[#1F7AE0]" />
          <span className="text-xl font-semibold text-gray-900">CCMS</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            {/* Icon */}
            <div className="w-12 h-12 bg-[#1F7AE0]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-6 h-6 text-[#1F7AE0]" />
            </div>

            <h1 className="text-xl font-semibold text-gray-900 text-center mb-2">
              Set new password
            </h1>
            <p className="text-gray-600 text-center mb-6">
              Enter your new password below
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-11 pr-10 bg-gray-50 border-gray-200 focus:bg-white focus:border-[#1F7AE0] focus:ring-[#1F7AE0]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500">Must be at least 8 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11 bg-gray-50 border-gray-200 focus:bg-white focus:border-[#1F7AE0] focus:ring-[#1F7AE0]"
                />
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-11 bg-[#1F7AE0] hover:bg-[#1a6bc7] text-white font-medium mt-2"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Resetting...
                  </div>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="p-6 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} CCMS. All rights reserved.</p>
      </footer>
    </div>
  );
}
