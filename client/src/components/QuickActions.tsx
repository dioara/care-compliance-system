import { Plus, Warning, UserPlus, Brain, ListChecks } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

// Quick action items with feature requirements
const quickActions = [
  { 
    label: "Report Incident", 
    icon: Warning, 
    path: "/incidents", 
    feature: "incidents" 
  },
  { 
    label: "Add Staff Member", 
    icon: UserPlus, 
    path: "/staff", 
    feature: "staff" 
  },
  { 
    label: "Add Service User", 
    icon: UserPlus, 
    path: "/service-users", 
    feature: "service_users" 
  },
  { 
    label: "Start Audit", 
    icon: ListChecks, 
    path: "/audits", 
    feature: "audits" 
  },
  { 
    label: "AI Care Plan Audit", 
    icon: Brain, 
    path: "/ai-care-plan-audit", 
    feature: "ai_care_plan_audit" 
  },
];

export function QuickActions() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  // Fetch user's feature permissions
  const { data: userFeatures = [] } = trpc.roles.getMyFeatures.useQuery(
    undefined,
    { enabled: !!user }
  );

  // Filter quick actions based on user's feature permissions
  // Super admins see everything
  const filteredActions = user?.superAdmin
    ? quickActions
    : quickActions.filter(action => userFeatures.includes(action.feature));

  // Don't render if no actions available
  if (filteredActions.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="default" size="sm" className="h-9 gap-1">
          <Plus className="h-4 w-4" weight="bold" />
          <span className="hidden sm:inline">Quick Add</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {filteredActions.map(action => (
          <DropdownMenuItem 
            key={action.path} 
            onClick={() => setLocation(action.path)}
          >
            <action.icon className="mr-2 h-4 w-4" weight="bold" />
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
