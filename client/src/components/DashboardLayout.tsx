import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { LayoutDashboard, LogOut, PanelLeft, Users, Building2, MapPin, ClipboardCheck, ClipboardList, Brain, AlertTriangle, FileText, Heart, UserCheck, BarChart3, Shield, UserCog, Settings, Mail, ChevronRight, Moon, Sun, CreditCard, Menu, Calendar, Bug } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
// LocationSwitcher removed from header per user request
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { GlobalSearch } from './GlobalSearch';
import { QuickActions } from './QuickActions';
import { Button } from "./ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { NotificationCenter } from "./NotificationCenter";
import { OnboardingTour } from "./OnboardingTour";
import { TrialBanner } from "./TrialBanner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Theme toggle component for dropdown menu
function ThemeToggleItem() {
  const { theme, toggleTheme, switchable } = useTheme();
  
  if (!switchable || !toggleTheme) return null;
  
  return (
    <DropdownMenuItem
      onClick={toggleTheme}
      className="cursor-pointer"
    >
      {theme === "dark" ? (
        <>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light Mode</span>
        </>
      ) : (
        <>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark Mode</span>
        </>
      )}
    </DropdownMenuItem>
  );
}

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/", description: "Overview & metrics" },
  { icon: Heart, label: "Service Users", path: "/service-users", description: "Manage residents" },
  { icon: UserCheck, label: "Staff", path: "/staff", description: "Team management" },
  { icon: ClipboardList, label: "Audits", path: "/audits", description: "Compliance audits" },
  { icon: Calendar, label: "Audit Calendar", path: "/audit-calendar", description: "Schedule & track" },
  { icon: FileText, label: "Audit History", path: "/audit-history", description: "View all audits" },
  { icon: Brain, label: "AI Audits", path: "/ai-audits", description: "Smart analysis" },
  { icon: AlertTriangle, label: "Incidents", path: "/incidents", description: "Track incidents" },
  { icon: BarChart3, label: "Incident Analytics", path: "/incident-analytics", description: "Incident trends" },
  { icon: FileText, label: "Reports", path: "/reports", description: "Generate reports" },
  { icon: ClipboardCheck, label: "Action Log", path: "/action-log", description: "Track actions" },
];

// Admin-only menu items (shown only to super admins)
const adminMenuItems = [
  { icon: LayoutDashboard, label: "Admin Dashboard", path: "/admin-dashboard" },
  { icon: Building2, label: "Company Profile", path: "/company-profile" },
  { icon: MapPin, label: "Locations", path: "/locations" },
  { icon: Shield, label: "Role Management", path: "/role-management" },
  { icon: UserCog, label: "User Management", path: "/user-management" },
  { icon: CreditCard, label: "Subscription", path: "/admin/subscription" },
  { icon: Mail, label: "Email Settings", path: "/email-settings" },
  { icon: Bug, label: "Error Monitoring", path: "/admin/error-monitoring" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              Sign in to continue
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Access to this dashboard requires authentication. Continue to launch the login flow.
            </p>
          </div>
          <Button
            onClick={() => {
              setLocation("/login");
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <TooltipProvider delayDuration={0}>
        <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
          {children}
        </DashboardLayoutContent>
      </TooltipProvider>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  // Sidebar menu item component with proper tooltip support
  const SidebarNavItem = ({ item, isActive }: { item: typeof menuItems[0], isActive: boolean }) => {
    const content = (
      <SidebarMenuButton
        isActive={isActive}
        onClick={() => setLocation(item.path)}
        tooltip={item.label}
        className={`h-11 transition-all duration-200 font-normal rounded-xl group ${isCollapsed ? 'justify-center px-2' : ''} ${isActive ? "bg-primary/10 text-primary font-medium shadow-sm" : "hover:bg-accent"}`}
      >
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all shrink-0 ${isActive ? "bg-primary text-white shadow-sm" : "bg-muted/50 group-hover:bg-muted"}`}>
          <item.icon className="h-4 w-4" />
        </div>
        {!isCollapsed && (
          <>
            <span className="truncate">{item.label}</span>
            {isActive && <ChevronRight className="h-4 w-4 ml-auto opacity-50 shrink-0" />}
          </>
        )}
      </SidebarMenuButton>
    );

    // Show tooltip when collapsed
    if (isCollapsed && !isMobile) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center border-b border-sidebar-border/50">
            <div className="flex items-center gap-3 px-3 transition-all w-full">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleSidebar}
                    className="h-9 w-9 flex items-center justify-center hover:bg-primary/10 rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0 group"
                    aria-label="Toggle navigation"
                  >
                    <PanelLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                </TooltipContent>
              </Tooltip>
              {!isCollapsed && (
                <div className="flex items-center gap-2 min-w-0">
                  <img 
                    src="/logo.png" 
                    alt="CCMS Logo" 
                    className="h-8 w-8 shrink-0 object-contain"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold tracking-tight truncate text-sm">
                      CCMS
                    </span>
                    <span className="text-[10px] text-muted-foreground -mt-0.5 truncate">Care Compliance</span>
                  </div>
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 py-2">
            <SidebarMenu className="px-3 space-y-1">
              {menuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarNavItem item={item} isActive={isActive} />
                  </SidebarMenuItem>
                );
              })}
              
              {/* Admin-only menu items */}
              {user?.superAdmin && (
                <>
                  <div className="my-3 mx-1 border-t border-sidebar-border/50" />
                  {!isCollapsed && (
                    <div className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                      Administration
                    </div>
                  )}
                  {adminMenuItems.map(item => {
                    const isActive = location === item.path;
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarNavItem item={item} isActive={isActive} />
                      </SidebarMenuItem>
                    );
                  })}
                </>
              )}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3 border-t border-sidebar-border/50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-accent transition-all duration-200 w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isCollapsed ? "justify-center" : ""}`}>
                  <Avatar className="h-10 w-10 border-2 border-primary/20 shrink-0 shadow-sm">
                    <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate leading-none">
                        {user?.name || "-"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {user?.email || "-"}
                      </p>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  onClick={() => setLocation("/settings")}
                  className="cursor-pointer"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <ThemeToggleItem />
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        {!isCollapsed && (
          <div
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors"
            onMouseDown={() => {
              if (isCollapsed) return;
              setIsResizing(true);
            }}
            style={{ zIndex: 50 }}
          />
        )}
      </div>

      <SidebarInset className="flex flex-col">
        <TrialBanner />
        {/* Unified header for all screen sizes */}
        <header className="flex border-b h-14 items-center justify-between bg-background/95 px-3 md:px-4 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
          {/* Left side - mobile menu trigger and breadcrumb */}
          <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
            <SidebarTrigger className="h-9 w-9 rounded-lg md:hidden" />
            {children && (children as any).props?.breadcrumb}
          </div>
          
          {/* Right side - quick actions, search, notifications */}
          <div className="flex items-center gap-1 md:gap-2">
            <QuickActions />
            <GlobalSearch />
            <NotificationCenter />
          </div>
        </header>
        
        <main className="flex-1 p-3 md:p-4 lg:p-6">{children}</main>
        
        <footer className="border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>© 2025 Care Compliance Management System</span>
            </div>
            <div className="flex items-center gap-6">
              <a
                href="/help"
                className="hover:text-primary transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
                Help Center
              </a>
              <a
                href="/privacy-policy"
                className="hover:text-primary transition-colors"
              >
                Privacy
              </a>
              <a
                href="/terms-of-service"
                className="hover:text-primary transition-colors"
              >
                Terms
              </a>
            </div>
          </div>
        </footer>
        
        <OnboardingTour />
      </SidebarInset>
    </>
  );
}
