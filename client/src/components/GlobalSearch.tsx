import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { MagnifyingGlass, Users, Warning, ClipboardText } from "@phosphor-icons/react";
import { useLocation } from "wouter";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  // Search staff
  const { data: staffResults, isLoading: staffLoading } = trpc.staff.list.useQuery(
    undefined,
    { enabled: open && searchQuery.length > 0 }
  );

  // Search incidents
  const { data: incidentResults, isLoading: incidentsLoading } = trpc.incidents.list.useQuery(
    undefined,
    { enabled: open && searchQuery.length > 0 }
  );

  // Search audits
  const { data: auditResults, isLoading: auditsLoading } = trpc.audits.list.useQuery(
    undefined,
    { enabled: open && searchQuery.length > 0 }
  );

  // Filter results based on search query
  const filteredStaff = staffResults?.filter(staff =>
    staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.role.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredIncidents = incidentResults?.filter(incident =>
    incident.serviceUserName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    incident.type.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredAudits = auditResults?.filter(audit =>
    audit.title.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (path: string) => {
    setOpen(false);
    setLocation(path);
  };

  const isLoading = staffLoading || incidentsLoading || auditsLoading;

  return (
    <>
      <Button
        variant="outline"
        className="h-9 w-9 md:w-auto md:justify-start md:px-3 text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <MagnifyingGlass className="h-4 w-4" weight="bold" />
        <span className="hidden md:inline ml-2">Search...</span>
        <kbd className="pointer-events-none hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-auto">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Search staff, incidents, audits..." 
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          {isLoading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          
          {!isLoading && searchQuery.length === 0 && (
            <CommandEmpty>Type to search across staff, incidents, and audits...</CommandEmpty>
          )}

          {!isLoading && searchQuery.length > 0 && filteredStaff.length === 0 && filteredIncidents.length === 0 && filteredAudits.length === 0 && (
            <CommandEmpty>No results found.</CommandEmpty>
          )}

          {filteredStaff.length > 0 && (
            <CommandGroup heading="Staff">
              {filteredStaff.slice(0, 5).map((staff) => (
                <CommandItem
                  key={staff.id}
                  onSelect={() => handleSelect(`/staff`)}
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" weight="bold" />
                  <div className="flex flex-col">
                    <span>{staff.name}</span>
                    <span className="text-xs text-muted-foreground">{staff.role}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {filteredIncidents.length > 0 && (
            <CommandGroup heading="Incidents">
              {filteredIncidents.slice(0, 5).map((incident) => (
                <CommandItem
                  key={incident.id}
                  onSelect={() => handleSelect(`/incidents`)}
                  className="flex items-center gap-2"
                >
                  <Warning className="h-4 w-4" weight="bold" />
                  <div className="flex flex-col">
                    <span>{incident.type} - {incident.serviceUserName}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(incident.dateOccurred).toLocaleDateString()}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {filteredAudits.length > 0 && (
            <CommandGroup heading="Audits">
              {filteredAudits.slice(0, 5).map((audit) => (
                <CommandItem
                  key={audit.id}
                  onSelect={() => handleSelect(`/audits`)}
                  className="flex items-center gap-2"
                >
                  <ClipboardText className="h-4 w-4" weight="bold" />
                  <div className="flex flex-col">
                    <span>{audit.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(audit.scheduledDate).toLocaleDateString()}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
