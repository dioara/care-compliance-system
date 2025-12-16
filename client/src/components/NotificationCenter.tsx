import { useState } from "react";
import { Bell, AlertTriangle, ClipboardCheck, Clock, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: "alert" | "audit" | "action" | "reminder";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  severity?: "low" | "medium" | "high" | "critical";
  link?: string;
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  
  // Fetch dashboard stats for notifications
  const { data: dashboardStats } = trpc.dashboard.getStats.useQuery();
  const { data: alertStatus } = trpc.notifications.getAlertStatus.useQuery({ threshold: 80 });
  // Build notifications from real data
  const notifications: Notification[] = [];
  
  // Add compliance alerts
  if (alertStatus?.hasAlerts && alertStatus.alerts) {
    alertStatus.alerts.forEach((alert, index) => {
      notifications.push({
        id: `alert-${index}`,
        type: "alert",
        title: "Compliance Alert",
        message: alert.message,
        timestamp: new Date(),
        read: false,
        severity: alert.severity === "critical" ? "critical" : "high",
      });
    });
  }
  
  // Add overdue actions
  if (dashboardStats?.overdueActions && dashboardStats.overdueActions > 0) {
    notifications.push({
      id: "overdue-actions",
      type: "action",
      title: "Overdue Actions",
      message: `You have ${dashboardStats.overdueActions} overdue action${dashboardStats.overdueActions > 1 ? "s" : ""} that need attention`,
      timestamp: new Date(),
      read: false,
      severity: "high",
      link: "/action-log",
    });
  }
  
  // Add upcoming audits
  if (dashboardStats?.upcomingAudits && dashboardStats.upcomingAudits > 0) {
    notifications.push({
      id: "upcoming-audits",
      type: "audit",
      title: "Upcoming Audits",
      message: `${dashboardStats.upcomingAudits} audit${dashboardStats.upcomingAudits > 1 ? "s" : ""} scheduled in the next 7 days`,
      timestamp: new Date(),
      read: false,
      severity: "medium",
      link: "/audits",
    });
  }
  
  // Add recent incidents
  if (dashboardStats?.recentIncidents && dashboardStats.recentIncidents > 0) {
    notifications.push({
      id: "recent-incidents",
      type: "alert",
      title: "Recent Incidents",
      message: `${dashboardStats.recentIncidents} incident${dashboardStats.recentIncidents > 1 ? "s" : ""} reported this month`,
      timestamp: new Date(),
      read: false,
      severity: "medium",
      link: "/incidents",
    });
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string, severity?: string) => {
    switch (type) {
      case "alert":
        return <AlertTriangle className={`h-4 w-4 ${severity === "critical" ? "text-red-500" : "text-orange-500"}`} />;
      case "audit":
        return <ClipboardCheck className="h-4 w-4 text-blue-500" />;
      case "action":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "reminder":
        return <Bell className="h-4 w-4 text-primary" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
      case "medium":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
      case "low":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-lg hover:bg-accent">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
        </div>
        
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
              <p className="text-sm font-medium">All caught up!</p>
              <p className="text-xs text-muted-foreground mt-1">
                No new notifications at this time
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 hover:bg-accent/50 transition-colors cursor-pointer ${
                    !notification.read ? "bg-primary/5" : ""
                  }`}
                  onClick={() => {
                    if (notification.link) {
                      window.location.href = notification.link;
                    }
                  }}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getIcon(notification.type, notification.severity)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium truncate">
                          {notification.title}
                        </p>
                        {notification.severity && (
                          <Badge className={`text-[10px] px-1.5 py-0 ${getSeverityColor(notification.severity)}`}>
                            {notification.severity}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1.5">
                        {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="flex-shrink-0">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
          <div className="px-4 py-3 border-t bg-muted/30">
            <Button variant="ghost" size="sm" className="w-full text-xs">
              View all notifications
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
