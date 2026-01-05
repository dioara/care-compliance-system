import { useState } from "react";
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CQC_KLOES } from "@/../../shared/kloes";

interface KloeMultiSelectProps {
  value: string; // Comma-separated string of KLOE values
  onChange: (value: string) => void;
  placeholder?: string;
}

// Color mapping for KLOE categories
const categoryColors = {
  safe: "bg-green-100 text-green-800 hover:bg-green-100",
  effective: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  caring: "bg-purple-100 text-purple-800 hover:bg-purple-100",
  responsive: "bg-red-100 text-red-800 hover:bg-red-100",
  well_led: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
} as const;

// Group KLOEs by category
const groupedKloes = {
  safe: CQC_KLOES.filter(k => k.category === "safe"),
  effective: CQC_KLOES.filter(k => k.category === "effective"),
  caring: CQC_KLOES.filter(k => k.category === "caring"),
  responsive: CQC_KLOES.filter(k => k.category === "responsive"),
  well_led: CQC_KLOES.filter(k => k.category === "well_led"),
};

const categoryLabels = {
  safe: "Safe",
  effective: "Effective",
  caring: "Caring",
  responsive: "Responsive",
  well_led: "Well-led",
};

export function KloeMultiSelect({ value, onChange, placeholder = "Select KLOEs..." }: KloeMultiSelectProps) {
  const [open, setOpen] = useState(false);

  // Parse selected KLOEs from comma-separated string
  const selectedKloes = value ? value.split(",").map(k => k.trim()).filter(Boolean) : [];

  // Toggle KLOE selection
  const toggleKloe = (kloeValue: string) => {
    const newSelected = selectedKloes.includes(kloeValue)
      ? selectedKloes.filter(k => k !== kloeValue)
      : [...selectedKloes, kloeValue];
    
    onChange(newSelected.join(","));
  };

  // Remove a specific KLOE
  const removeKloe = (kloeValue: string) => {
    const newSelected = selectedKloes.filter(k => k !== kloeValue);
    onChange(newSelected.join(","));
  };

  return (
    <div className="space-y-2">
      {/* Selected KLOEs as removable tags */}
      {selectedKloes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedKloes.map((kloeValue) => {
            const kloe = CQC_KLOES.find(k => k.value === kloeValue);
            if (!kloe) return null;

            const colorClass = categoryColors[kloe.category] || "bg-gray-100 text-gray-800";

            return (
              <Badge
                key={kloeValue}
                variant="secondary"
                className={`${colorClass} text-xs font-normal pr-1`}
              >
                {kloe.label}
                <button
                  type="button"
                  onClick={() => removeKloe(kloeValue)}
                  className="ml-1 rounded-full hover:bg-black/10 p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Dropdown selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedKloes.length > 0
              ? `${selectedKloes.length} KLOE${selectedKloes.length > 1 ? 's' : ''} selected`
              : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[500px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search KLOEs..." />
            <CommandEmpty>No KLOE found.</CommandEmpty>
            
            {/* Group by category */}
            {Object.entries(groupedKloes).map(([category, kloes]) => (
              <CommandGroup key={category} heading={categoryLabels[category as keyof typeof categoryLabels]}>
                {kloes.map((kloe) => {
                  const isSelected = selectedKloes.includes(kloe.value);
                  return (
                    <CommandItem
                      key={kloe.value}
                      value={kloe.label}
                      onSelect={() => toggleKloe(kloe.value)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <div className={`flex h-4 w-4 items-center justify-center rounded-sm border ${
                          isSelected ? "bg-primary border-primary" : "border-input"
                        }`}>
                          {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <span className="text-sm">{kloe.label}</span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
