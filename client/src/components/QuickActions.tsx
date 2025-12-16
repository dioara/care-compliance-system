import { Plus, AlertTriangle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";

export function QuickActions() {
  const [, setLocation] = useLocation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="default" size="sm" className="h-9 gap-1">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Quick Add</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => setLocation("/incidents")}>
          <AlertTriangle className="mr-2 h-4 w-4" />
          Report Incident
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocation("/staff")}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Staff Member
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocation("/service-users")}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Service User
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
