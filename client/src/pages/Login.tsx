import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { AlertCircle, Mail, RefreshCw } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");

  const utils = trpc.useUtils();
  
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      toast.success("Login successful!");
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }
      await utils.auth.me.invalidate();
      setLocation("/");
    },
    onError: (error) => {
      // Check if the error is about email verification
      if (error.message?.toLowerCase().includes('verify your email') || 
          error.message?.toLowerCase().includes('verification')) {
        setShowVerificationMessage(true);
        setUnverifiedEmail(email);
      } else {
        toast.error(error.message || "Login failed");
      }
      setIsLoading(false);
    },
  });

  const resendVerificationMutation = trpc.auth.resendVerification.useMutation({
    onSuccess: () => {
      toast.success("Verification email sent! Please check your inbox.");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to resend verification email");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowVerificationMessage(false);
    setIsLoading(true);
    loginMutation.mutate({ email, password, rememberMe });
  };

  const handleResendVerification = () => {
    if (unverifiedEmail) {
      resendVerificationMutation.mutate({ email: unverifiedEmail });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header with logo */}
      <header className="p-6">
        <a href="https://ccms.co.uk" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-80 transition-opacity w-fit">
          <img src="/logo.png" alt="CCMS" className="h-8 w-8" />
          <span className="font-semibold text-gray-900">CCMS</span>
        </a>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">
          {/* Email Verification Required Message */}
          {showVerificationMessage && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium text-amber-800">Email Verification Required</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    Please verify your email address before signing in. We sent a verification link to <strong>{unverifiedEmail}</strong>.
                  </p>
                  <p className="text-sm text-amber-700 mt-2">
                    Check your inbox and spam folder for the verification email.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResendVerification}
                    disabled={resendVerificationMutation.isPending}
                    className="mt-3 text-amber-700 border-amber-300 hover:bg-amber-100"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${resendVerificationMutation.isPending ? 'animate-spin' : ''}`} />
                    {resendVerificationMutation.isPending ? "Sending..." : "Resend Verification Email"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Card */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Sign in to your account
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Enter your credentials to access your dashboard
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11 bg-gray-50 border-gray-200 focus:bg-white focus:border-[#1F7AE0] focus:ring-[#1F7AE0]"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <button 
                    type="button" 
                    onClick={() => setLocation("/forgot-password")} 
                    className="text-sm text-[#1F7AE0] hover:text-[#1a6bc7] font-medium"
                  >
                    Forgot your password?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11 bg-gray-50 border-gray-200 focus:bg-white focus:border-[#1F7AE0] focus:ring-[#1F7AE0]"
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox 
                  id="remember" 
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
                  Remember me on this device
                </Label>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-11 bg-[#1F7AE0] hover:bg-[#1a6bc7] text-white font-medium"
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            {/* Register link */}
            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600">
                New to CCMS?{" "}
                <button 
                  type="button"
                  onClick={() => setLocation("/register")} 
                  className="text-[#1F7AE0] hover:text-[#1a6bc7] font-medium"
                >
                  Create account
                </button>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} CCMS. Built by <a href="https://lampstand.consulting" target="_blank" rel="noopener noreferrer" className="hover:text-[#1F7AE0] transition-colors">Lampstand Consulting</a>.</p>
            <div className="mt-2 space-x-4">
              <a href="/privacy" className="hover:text-gray-700">Privacy</a>
              <a href="/terms" className="hover:text-gray-700">Terms</a>
              <a href="/help" className="hover:text-gray-700">Help</a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
