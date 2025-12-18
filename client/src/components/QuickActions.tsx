import { Plus, Warning, UserPlus } from "@phosphor-icons/react";
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
          <Plus className="h-4 w-4" weight="bold" />
          <span className="hidden sm:inline">Quick Add</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => setLocation("/incidents")}>
          <Warning className="mr-2 h-4 w-4" weight="bold" />
          Report Incident
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocation("/staff")}>
          <UserPlus className="mr-2 h-4 w-4" weight="bold" />
          Add Staff Member
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocation("/service-users")}>
          <UserPlus className="mr-2 h-4 w-4" weight="bold" />
          Add Service User
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
