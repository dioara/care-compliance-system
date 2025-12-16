import { ChevronRight, Home } from "lucide-react";
import { Link } from "wouter";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground">
      <Link href="/dashboard" className="hover:text-foreground transition-colors flex items-center gap-1">
        <Home className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Home</span>
      </Link>
      
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <div key={index} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            {item.href && !isLast ? (
              <Link href={item.href} className="hover:text-foreground transition-colors truncate max-w-[150px] sm:max-w-none">
                {item.label}
              </Link>
            ) : (
              <span className={`truncate max-w-[150px] sm:max-w-none ${isLast ? 'text-foreground font-medium' : ''}`}>
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
