import { Badge } from "@/components/ui/badge";
import { CQC_KLOES } from "@/../../shared/kloes";

interface KloeTagsProps {
  kloes?: string | null;
  className?: string;
}

// Color mapping for KLOE categories
const categoryColors = {
  safe: "bg-green-100 text-green-800 hover:bg-green-100",
  effective: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  caring: "bg-purple-100 text-purple-800 hover:bg-purple-100",
  responsive: "bg-red-100 text-red-800 hover:bg-red-100",
  well_led: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
} as const;

export function KloeTags({ kloes, className = "" }: KloeTagsProps) {
  // If no KLOEs, don't render anything
  if (!kloes || kloes.trim() === "") {
    return null;
  }

  // Parse comma-separated KLOE values
  const kloeValues = kloes.split(",").map(k => k.trim()).filter(Boolean);

  // If no valid KLOEs after parsing, don't render
  if (kloeValues.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {kloeValues.map((kloeValue) => {
        // Find the KLOE definition
        const kloe = CQC_KLOES.find(k => k.value === kloeValue);
        
        // If KLOE not found, skip it
        if (!kloe) {
          return null;
        }

        // Get the color for this category
        const colorClass = categoryColors[kloe.category] || "bg-gray-100 text-gray-800 hover:bg-gray-100";

        return (
          <Badge
            key={kloeValue}
            variant="secondary"
            className={`${colorClass} text-xs font-normal`}
          >
            {kloe.label}
          </Badge>
        );
      })}
    </div>
  );
}
