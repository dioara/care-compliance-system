import { trpc } from "@/lib/trpc";
import { Clock, Warning, CreditCard, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useState } from "react";

export function TrialBanner() {
  const { data: trialStatus, isLoading } = trpc.subscription.getTrialStatus.useQuery();
  const { data: user } = trpc.auth.me.useQuery();
  const [dismissed, setDismissed] = useState(false);

  if (isLoading || !trialStatus || !trialStatus.isTrial || dismissed) {
    return null;
  }

  const isExpired = trialStatus.isExpired;
  const daysRemaining = trialStatus.daysRemaining;
  const isUrgent = daysRemaining <= 7 && !isExpired;
  const isAdmin = user?.role === "admin";

  // Expired trial
  if (isExpired) {
    return (
      <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-full bg-red-500/20">
              <Warning className="h-4 w-4 text-red-500" weight="bold" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                Your free trial has expired
              </p>
              <p className="text-xs text-red-500/80">
                {isAdmin 
                  ? "Subscribe now to continue using all features" 
                  : "Contact your administrator to activate a subscription"}
              </p>
            </div>
          </div>
          {isAdmin && (
            <Link href="/admin/subscription">
              <Button size="sm" variant="destructive" className="gap-2">
                <CreditCard className="h-4 w-4" weight="bold" />
                Subscribe Now
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Active trial - urgent (7 days or less)
  if (isUrgent) {
    return (
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-full bg-amber-500/20">
              <Warning className="h-4 w-4 text-amber-500" weight="bold" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                {daysRemaining === 1 
                  ? "Your free trial ends tomorrow!" 
                  : `Your free trial ends in ${daysRemaining} days`}
              </p>
              <p className="text-xs text-amber-500/80">
                {trialStatus.trialLicensesCount} trial licenses • Expires {new Date(trialStatus.trialEndsAt!).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link href="/admin/subscription">
                <Button size="sm" variant="outline" className="gap-2 border-amber-500/50 text-amber-600 hover:bg-amber-500/10">
                  <CreditCard className="h-4 w-4" weight="bold" />
                  Upgrade Now
                </Button>
              </Link>
            )}
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 w-8 p-0 text-amber-500/60 hover:text-amber-500"
              onClick={() => setDismissed(true)}
            >
              <X className="h-4 w-4" weight="bold" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Active trial - normal
  return (
    <div className="bg-[#1F7AE0]/10 border-b border-[#1F7AE0]/20 px-4 py-2.5">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-full bg-[#1F7AE0]/20">
            <Clock className="h-4 w-4 text-[#1F7AE0]" weight="bold" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#1F7AE0] dark:text-[#1F7AE0]">
              Free Trial • {daysRemaining} days remaining
            </p>
            <p className="text-xs text-[#1F7AE0]/80">
              {trialStatus.trialLicensesCount} licenses included • Full access to all features
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link href="/admin/subscription">
              <Button size="sm" variant="outline" className="gap-2 border-[#1F7AE0]/50 text-[#1F7AE0] hover:bg-[#1F7AE0]/10">
                <CreditCard className="h-4 w-4" weight="bold" />
                View Plans
              </Button>
            </Link>
          )}
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 w-8 p-0 text-[#1F7AE0]/60 hover:text-[#1F7AE0]"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" weight="bold" />
          </Button>
        </div>
      </div>
    </div>
  );
}
