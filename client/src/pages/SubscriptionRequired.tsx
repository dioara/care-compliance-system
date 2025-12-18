import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { AlertTriangle, Check, CreditCard, Shield, Users, Zap, Clock, Building2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function SubscriptionRequired() {
  const { user, logout } = useAuth();
  const [licenseCount, setLicenseCount] = useState(5);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "annual">("monthly");
  const [isLoading, setIsLoading] = useState(false);

  const { data: trialStatus } = trpc.subscription.getTrialStatus.useQuery();
  const { data: pricing, isLoading: pricingLoading } = trpc.subscription.getPricing.useQuery(
    { quantity: licenseCount, billingInterval },
    { enabled: licenseCount > 0 }
  );

  const createCheckoutMutation = trpc.subscription.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create checkout session");
      setIsLoading(false);
    },
  });

  const handleSubscribe = () => {
    setIsLoading(true);
    createCheckoutMutation.mutate({ quantity: licenseCount, billingInterval });
  };

  const features = [
    { icon: Shield, text: "Full CQC compliance management" },
    { icon: Users, text: "Staff and service user tracking" },
    { icon: Zap, text: "AI-powered care plan auditing" },
    { icon: Clock, text: "Automated audit scheduling" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="CCMS" className="h-8 w-8" />
            <span className="font-semibold text-gray-900">CCMS</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={logout}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Trial Expired Alert */}
        <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-semibold text-amber-800 text-lg">
                {trialStatus?.isExpired ? "Your Free Trial Has Expired" : "Subscription Required"}
              </h2>
              <p className="text-amber-700 mt-1">
                {trialStatus?.isExpired 
                  ? "Your 30-day free trial has ended. Subscribe now to continue using CCMS and keep your compliance data safe."
                  : "A subscription is required to access CCMS. Choose a plan below to get started."}
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Pricing Card */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#1F7AE0]" />
                Choose Your Plan
              </CardTitle>
              <CardDescription>
                Select the number of licenses and billing frequency
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* License Count */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Number of Licenses</Label>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {licenseCount}
                  </Badge>
                </div>
                <Slider
                  value={[licenseCount]}
                  onValueChange={(value) => setLicenseCount(value[0])}
                  min={1}
                  max={50}
                  step={1}
                  className="w-full"
                />
                <p className="text-sm text-gray-500">
                  Each license allows one staff member to access the system
                </p>
              </div>

              {/* Billing Interval */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Billing Frequency</Label>
                <RadioGroup
                  value={billingInterval}
                  onValueChange={(value) => setBillingInterval(value as "monthly" | "annual")}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <RadioGroupItem value="monthly" id="monthly" />
                    <Label htmlFor="monthly" className="flex-1 cursor-pointer">
                      <span className="font-medium">Monthly</span>
                      <span className="text-gray-500 ml-2">Billed every month</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer border-green-200 bg-green-50">
                    <RadioGroupItem value="annual" id="annual" />
                    <Label htmlFor="annual" className="flex-1 cursor-pointer">
                      <span className="font-medium">Annual</span>
                      <Badge className="ml-2 bg-green-600">Save 15%</Badge>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Pricing Summary */}
              {pricing && !pricingLoading && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Price per license</span>
                    <span className="font-medium">{pricing.pricePerLicenseFormatted}/month</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Licenses</span>
                    <span className="font-medium">× {licenseCount}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="font-semibold">Total</span>
                      <div className="text-right">
                        <span className="font-bold text-lg text-[#1F7AE0]">
                          {pricing.totalBillingFormatted}
                        </span>
                        <span className="text-gray-500 text-sm ml-1">
                          /{billingInterval === "annual" ? "year" : "month"}
                        </span>
                      </div>
                    </div>
                    {pricing.savings > 0 && (
                      <p className="text-green-600 text-sm text-right mt-1">
                        You save {pricing.savingsFormatted}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Subscribe Button */}
              <Button
                onClick={handleSubscribe}
                disabled={isLoading || pricingLoading}
                className="w-full h-12 bg-[#1F7AE0] hover:bg-[#1a6bc7] text-white font-medium text-lg"
              >
                {isLoading ? "Redirecting to checkout..." : "Subscribe Now"}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Secure payment powered by Stripe. Cancel anytime.
              </p>
            </CardContent>
          </Card>

          {/* Features Card */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#1F7AE0]" />
                  What's Included
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1F7AE0]/10 flex items-center justify-center flex-shrink-0">
                        <feature.icon className="h-4 w-4 text-[#1F7AE0]" />
                      </div>
                      <span className="text-gray-700 pt-1">{feature.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Volume Discounts</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>1-5 licenses: £70/license/month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>6-10 licenses: 10% off (£63/license)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>11-20 licenses: 15% off (£59.50/license)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>21+ licenses: 20% off (£56/license)</span>
                  </li>
                </ul>
                <p className="text-xs text-gray-500 mt-3">
                  Plus an additional 15% off when you pay annually!
                </p>
              </CardContent>
            </Card>

            <div className="text-center text-sm text-gray-500">
              <p>Questions? Contact us at support@ccms.co.uk</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
