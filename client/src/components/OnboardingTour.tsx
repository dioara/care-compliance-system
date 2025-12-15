import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  LayoutDashboard, Heart, UserCheck, ClipboardList, AlertTriangle, 
  ClipboardCheck, ChevronRight, ChevronLeft, X, Sparkles, CheckCircle2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight?: string;
  tip?: string;
}

const tourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Care Compliance",
    description: "Your comprehensive compliance management system for care homes. Let's take a quick tour of the key features to help you get started.",
    icon: <Sparkles className="h-8 w-8 text-primary" />,
    tip: "This tour will only take about 2 minutes",
  },
  {
    id: "dashboard",
    title: "Dashboard Overview",
    description: "Your dashboard provides a real-time snapshot of compliance status, upcoming audits, recent incidents, and action items that need attention.",
    icon: <LayoutDashboard className="h-8 w-8 text-blue-500" />,
    highlight: "Dashboard",
    tip: "Check your dashboard daily to stay on top of compliance",
  },
  {
    id: "service-users",
    title: "Service Users",
    description: "Manage all your service users (residents) in one place. Track their care plans, compliance records, and important documentation.",
    icon: <Heart className="h-8 w-8 text-pink-500" />,
    highlight: "Service Users",
    tip: "Keep service user records up-to-date for CQC inspections",
  },
  {
    id: "staff",
    title: "Staff Management",
    description: "Track staff compliance including DBS checks, training records, and employment documentation. Never miss an expiring certificate again.",
    icon: <UserCheck className="h-8 w-8 text-green-500" />,
    highlight: "Staff",
    tip: "Set up alerts for expiring DBS certificates and training",
  },
  {
    id: "audits",
    title: "Compliance Audits",
    description: "Conduct and manage audits across all your locations. Choose from pre-built audit templates or create custom ones for your specific needs.",
    icon: <ClipboardList className="h-8 w-8 text-violet-500" />,
    highlight: "Audits",
    tip: "Schedule regular audits to maintain continuous compliance",
  },
  {
    id: "incidents",
    title: "Incident Reporting",
    description: "Log and track incidents with comprehensive documentation. The system helps ensure proper reporting to CQC and other regulatory bodies.",
    icon: <AlertTriangle className="h-8 w-8 text-orange-500" />,
    highlight: "Incidents",
    tip: "Report incidents promptly - delays can affect compliance ratings",
  },
  {
    id: "action-log",
    title: "Action Log",
    description: "Track all action items from audits and incidents in one central location. Assign tasks, set deadlines, and monitor progress.",
    icon: <ClipboardCheck className="h-8 w-8 text-amber-500" />,
    highlight: "Action Log",
    tip: "Review the action log weekly to ensure nothing falls through the cracks",
  },
  {
    id: "complete",
    title: "You're All Set!",
    description: "You now know the key features of Care Compliance. Start by exploring the dashboard and scheduling your first audit. We're here to help!",
    icon: <CheckCircle2 className="h-8 w-8 text-green-500" />,
    tip: "Need help? Contact support anytime from the settings menu",
  },
];

export function OnboardingTour() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompletedTour, setHasCompletedTour] = useState(true);

  // Check if user has completed the tour
  useEffect(() => {
    if (user) {
      const tourCompleted = localStorage.getItem(`tour_completed_${user.id}`);
      if (!tourCompleted) {
        // Show tour after a short delay for new users
        const timer = setTimeout(() => {
          setHasCompletedTour(false);
          setIsOpen(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  const completeTour = () => {
    if (user) {
      localStorage.setItem(`tour_completed_${user.id}`, "true");
    }
    setHasCompletedTour(true);
    setIsOpen(false);
    setCurrentStep(0);
  };

  const skipTour = () => {
    completeTour();
  };

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = ((currentStep + 1) / tourSteps.length) * 100;
  const step = tourSteps[currentStep];

  if (!isOpen || hasCompletedTour) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={skipTour}
      />
      
      {/* Tour Card */}
      <Card className="relative z-10 w-full max-w-lg mx-4 shadow-2xl border-0 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <CardHeader className="pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-inner">
                {step.icon}
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  Step {currentStep + 1} of {tourSteps.length}
                </p>
                <CardTitle className="text-xl">{step.title}</CardTitle>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-muted"
              onClick={skipTour}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="pb-4">
          <p className="text-muted-foreground leading-relaxed">
            {step.description}
          </p>
          
          {step.tip && (
            <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-sm text-primary flex items-start gap-2">
                <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span><strong>Pro tip:</strong> {step.tip}</span>
              </p>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between pt-2 pb-6 border-t bg-muted/30">
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button
                variant="ghost"
                onClick={prevStep}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            {currentStep === 0 && (
              <Button
                variant="ghost"
                onClick={skipTour}
                className="text-muted-foreground"
              >
                Skip tour
              </Button>
            )}
          </div>
          
          <Button onClick={nextStep} className="gap-1 shadow-md">
            {currentStep === tourSteps.length - 1 ? (
              <>
                Get Started
                <CheckCircle2 className="h-4 w-4" />
              </>
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Hook to manually trigger the tour
export function useOnboardingTour() {
  const { user } = useAuth();
  
  const resetTour = () => {
    if (user) {
      localStorage.removeItem(`tour_completed_${user.id}`);
      window.location.reload();
    }
  };
  
  return { resetTour };
}
