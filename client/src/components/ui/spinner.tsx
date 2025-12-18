import { Spinner as PhosphorSpinner } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";

function Spinner({ className, ...props }: React.ComponentProps<typeof PhosphorSpinner>) {
  return (
    <PhosphorSpinner
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      weight="bold"
      {...props}
    />
  );
}

export { Spinner };
