import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Shield, CheckCircle, XCircle, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [resendSuccess, setResendSuccess] = useState(false);

  // Get token from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    setToken(tokenParam);
  }, []);

  const verifyMutation = trpc.auth.verifyEmail.useMutation({
    onSuccess: () => {
      // Redirect to login after 3 seconds
      setTimeout(() => setLocation("/login"), 3000);
    },
  });

  const resendMutation = trpc.auth.resendVerification.useMutation({
    onSuccess: () => {
      setResendSuccess(true);
    },
  });

  // Auto-verify when token is present
  useEffect(() => {
    if (token && !verifyMutation.isSuccess && !verifyMutation.isError) {
      verifyMutation.mutate({ token });
    }
  }, [token]);

  const handleResend = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      resendMutation.mutate({ email });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="p-6">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <Shield className="h-8 w-8 text-[#1F7AE0]" />
          <span className="text-xl font-semibold text-gray-900">CCMS</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Verifying with token */}
            {token && verifyMutation.isPending && (
              <div className="text-center">
                <Loader2 className="h-16 w-16 text-[#1F7AE0] animate-spin mx-auto mb-4" />
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                  Verifying Your Email
                </h1>
                <p className="text-gray-500">Please wait...</p>
              </div>
            )}

            {/* Verification Success */}
            {token && verifyMutation.isSuccess && (
              <div className="text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                  Email Verified!
                </h1>
                <p className="text-gray-500 mb-6">
                  Your email has been verified successfully. You can now log in to your account.
                </p>
                <Link href="/login">
                  <Button className="w-full bg-[#1F7AE0] hover:bg-[#1a6bc7]">
                    Go to Login
                  </Button>
                </Link>
                <p className="text-sm text-gray-400 mt-4">
                  Redirecting automatically in 3 seconds...
                </p>
              </div>
            )}

            {/* Verification Error */}
            {token && verifyMutation.isError && (
              <div className="text-center">
                <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                  Verification Failed
                </h1>
                <p className="text-gray-500 mb-6">
                  {verifyMutation.error?.message || "The verification link is invalid or has expired."}
                </p>
                <div className="border-t pt-6 mt-6">
                  <p className="text-sm text-gray-600 mb-4">
                    Need a new verification link?
                  </p>
                  <form onSubmit={handleResend} className="space-y-4">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <Button 
                      type="submit" 
                      className="w-full bg-[#1F7AE0] hover:bg-[#1a6bc7]"
                      disabled={resendMutation.isPending}
                    >
                      {resendMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Sending...
                        </>
                      ) : (
                        "Resend Verification Email"
                      )}
                    </Button>
                  </form>
                </div>
              </div>
            )}

            {/* No token - show resend form */}
            {!token && (
              <div className="text-center">
                <Mail className="h-16 w-16 text-[#1F7AE0] mx-auto mb-4" />
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                  Verify Your Email
                </h1>
                
                {resendSuccess ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
                    <p className="text-green-700">
                      Verification email sent! Please check your inbox.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-500 mb-6">
                      Enter your email address to receive a new verification link.
                    </p>
                    <form onSubmit={handleResend} className="space-y-4">
                      <Input
                        type="email"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                      <Button 
                        type="submit" 
                        className="w-full bg-[#1F7AE0] hover:bg-[#1a6bc7]"
                        disabled={resendMutation.isPending}
                      >
                        {resendMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Sending...
                          </>
                        ) : (
                          "Send Verification Email"
                        )}
                      </Button>
                    </form>
                  </>
                )}

                {resendMutation.isError && (
                  <p className="text-red-500 text-sm mt-4">
                    {resendMutation.error?.message || "Failed to send verification email"}
                  </p>
                )}

                <div className="mt-6 pt-6 border-t">
                  <Link href="/login" className="text-[#1F7AE0] hover:underline text-sm">
                    Back to Login
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center">
        <p className="text-gray-400 text-sm">
          © {new Date().getFullYear()} CCMS. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
