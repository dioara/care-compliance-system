import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function Register() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    companyAddress: "",
    companyTelephone: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      toast.success("Registration successful! Please log in.");
      setLocation("/login");
    },
    onError: (error) => {
      toast.error(error.message || "Registration failed");
      setIsLoading(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (!agreeToTerms) {
      toast.error("Please agree to the terms and conditions");
      return;
    }

    setIsLoading(true);
    registerMutation.mutate({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      companyName: formData.companyName,
      companyAddress: formData.companyAddress,
      companyTelephone: formData.companyTelephone,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header with logo */}
      <header className="p-6">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="CCMS" className="h-8 w-8" />
          <span className="font-semibold text-gray-900">CCMS</span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          {/* Card */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Create your account
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Register your care organisation to get started
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Full name
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="John Smith"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className="h-11 bg-gray-50 border-gray-200 focus:bg-white focus:border-[#1F7AE0] focus:ring-[#1F7AE0]"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className="h-11 bg-gray-50 border-gray-200 focus:bg-white focus:border-[#1F7AE0] focus:ring-[#1F7AE0]"
                />
              </div>

              {/* Company Name */}
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-sm font-medium text-gray-700">
                  Company name
                </Label>
                <Input
                  id="companyName"
                  name="companyName"
                  placeholder="Your Care Home Ltd"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className="h-11 bg-gray-50 border-gray-200 focus:bg-white focus:border-[#1F7AE0] focus:ring-[#1F7AE0]"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className="h-11 bg-gray-50 border-gray-200 focus:bg-white focus:border-[#1F7AE0] focus:ring-[#1F7AE0]"
                />
                <p className="text-xs text-gray-500">Must be at least 8 characters</p>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirm password
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className="h-11 bg-gray-50 border-gray-200 focus:bg-white focus:border-[#1F7AE0] focus:ring-[#1F7AE0]"
                />
              </div>

              {/* Terms checkbox */}
              <div className="flex items-start gap-2 pt-2">
                <Checkbox 
                  id="terms" 
                  checked={agreeToTerms}
                  onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                  className="mt-0.5"
                />
                <Label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer leading-tight">
                  I agree to the{" "}
                  <a href="/terms" className="text-[#1F7AE0] hover:text-[#1a6bc7]">Terms of Service</a>
                  {" "}and{" "}
                  <a href="/privacy" className="text-[#1F7AE0] hover:text-[#1a6bc7]">Privacy Policy</a>
                </Label>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading || !agreeToTerms}
                className="w-full h-11 bg-[#1F7AE0] hover:bg-[#1a6bc7] text-white font-medium mt-2"
              >
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
            </form>



            {/* Login link */}
            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <button 
                  type="button"
                  onClick={() => setLocation("/login")} 
                  className="text-[#1F7AE0] hover:text-[#1a6bc7] font-medium"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} CCMS. Built by Lampstand Consulting.</p>
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
