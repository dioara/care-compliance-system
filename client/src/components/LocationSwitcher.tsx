import { useLocation } from "@/contexts/LocationContext";
import { trpc } from "@/lib/trpc";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Lock } from "lucide-react";

export function LocationSwitcher() {
  const { activeLocationId, setActiveLocationId, permissions, canWrite, isLoading } = useLocation();
  
  // Fetch all locations for the tenant
  const { data: allLocations = [] } = trpc.company.listLocations.useQuery();

  // Filter to only show accessible locations
  const accessibleLocations = allLocations.filter(loc =>
    permissions.some(p => p.locationId === loc.id)
  );

  if (isLoading || accessibleLocations.length === 0) {
    return null;
  }

  const activeLocation = accessibleLocations.find(loc => loc.id === activeLocationId);

  return (
    <div className="flex items-center gap-2">
      <MapPin className="h-4 w-4 text-muted-foreground" />
      <Select
        value={activeLocationId?.toString() || ""}
        onValueChange={(value) => setActiveLocationId(parseInt(value))}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select location" />
        </SelectTrigger>
        <SelectContent>
          {accessibleLocations.map((location) => {
            const permission = permissions.find(p => p.locationId === location.id);
            return (
              <SelectItem key={location.id} value={location.id.toString()}>
                <div className="flex items-center justify-between w-full">
                  <span>{location.name}</span>
                  {permission && !permission.canWrite && (
                    <Lock className="h-3 w-3 ml-2 text-muted-foreground" />
                  )}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      {activeLocation && !canWrite && (
        <Badge variant="secondary" className="text-xs">
          <Lock className="h-3 w-3 mr-1" />
          Read Only
        </Badge>
      )}
    </div>
  );
}
