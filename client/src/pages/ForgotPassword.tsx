import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Shield, Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const requestResetMutation = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: () => {
      setIsSubmitted(true);
      toast.success("Check your email for the reset link");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send reset email");
      setIsLoading(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    requestResetMutation.mutate({ email });
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="p-6">
          <div className="flex items-center gap-2">
            <Shield className="h-7 w-7 text-[#1F7AE0]" />
            <span className="text-xl font-semibold text-gray-900">CCMS</span>
          </div>
        </header>

        {/* Success Content */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Check your email</h2>
            <p className="text-gray-600 mb-2">
              We've sent a password reset link to:
            </p>
            <p className="font-medium text-gray-900 mb-6">{email}</p>
            <p className="text-sm text-gray-500 mb-8">
              Didn't receive the email? Check your spam folder or try again.
            </p>
            
            <div className="space-y-3">
              <Button
                onClick={() => {
                  setIsSubmitted(false);
                  setIsLoading(false);
                }}
                variant="outline"
                className="w-full h-11 border-gray-200"
              >
                Try another email
              </Button>
              <button
                onClick={() => setLocation("/login")}
                className="text-[#1F7AE0] hover:text-[#1a6bc7] font-medium text-sm flex items-center gap-2 mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="p-6 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} CCMS. Built by <a href="https://lampstand.consulting" target="_blank" rel="noopener noreferrer" className="hover:text-[#1F7AE0] transition-colors">Lampstand Consulting</a>.</p>
        </footer>
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
              <Mail className="w-6 h-6 text-[#1F7AE0]" />
            </div>

            <h1 className="text-xl font-semibold text-gray-900 text-center mb-2">
              Forgot your password?
            </h1>
            <p className="text-gray-600 text-center mb-6">
              Enter your email and we'll send you a reset link
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

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-11 bg-[#1F7AE0] hover:bg-[#1a6bc7] text-white font-medium"
              >
                {isLoading ? "Sending..." : "Send reset link"}
              </Button>
            </form>

            {/* Back to Login */}
            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <button
                onClick={() => setLocation("/login")}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2 mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="p-6 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} CCMS. Built by <a href="https://lampstand.consulting" target="_blank" rel="noopener noreferrer" className="hover:text-[#1F7AE0] transition-colors">Lampstand Consulting</a>.</p>
      </footer>
    </div>
  );
}
