import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { trpc } from "@/lib/trpc";

interface LocationPermission {
  locationId: number;
  canRead: boolean;
  canWrite: boolean;
}

interface LocationContextType {
  activeLocationId: number | null;
  setActiveLocationId: (locationId: number | null) => void;
  permissions: LocationPermission[];
  canWrite: boolean;
  isLoading: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [activeLocationId, setActiveLocationIdState] = useState<number | null>(null);
  
  // Check if user is authenticated
  const { data: user } = trpc.auth.me.useQuery();
  
  // Fetch user's location permissions only if authenticated
  const { data: permissions = [], isLoading } = trpc.roles.getMyPermissions.useQuery(
    undefined,
    { enabled: !!user }
  );

  // Load saved location from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("activeLocationId");
    if (saved) {
      setActiveLocationIdState(parseInt(saved));
    } else if (permissions.length > 0 && !activeLocationId) {
      // Auto-select first accessible location if none selected
      setActiveLocationIdState(permissions[0].locationId);
    }
  }, [permissions]);

  // Save to localStorage when changed
  const setActiveLocationId = (locationId: number | null) => {
    setActiveLocationIdState(locationId);
    if (locationId) {
      localStorage.setItem("activeLocationId", locationId.toString());
    } else {
      localStorage.removeItem("activeLocationId");
    }
  };

  // Check if user can write to active location
  const canWrite = permissions.find(p => p.locationId === activeLocationId)?.canWrite || false;

  return (
    <LocationContext.Provider
      value={{
        activeLocationId,
        setActiveLocationId,
        permissions,
        canWrite,
        isLoading,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
}
