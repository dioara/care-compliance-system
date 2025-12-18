import { useState } from "react";
import { useLocation } from "wouter";
import { Bell, Check, Eye } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { formatDistanceToNow } from "date-fns";

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();
  
  // Fetch real notifications from database
  const { data: notifications, refetch } = trpc.notifications.list.useQuery({
    limit: 10,
    offset: 0,
  });
  
  const { data: unreadCount } = trpc.notifications.getUnreadCount.useQuery();
  
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });
  
  const handleMarkAsRead = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    markAsReadMutation.mutate({ id });
  };
  
  const handleViewAll = () => {
    setIsOpen(false);
    setLocation("/notifications");
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-lg hover:bg-accent">
          <Bell className="h-5 w-5" weight="bold" />
          {unreadCount && unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" weight="bold" />
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount && unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
        </div>
        
        <ScrollArea className="max-h-[400px]">
          {!notifications || notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Bell className="h-6 w-6 text-muted-foreground" weight="bold" />
              </div>
              <p className="text-sm font-medium">No notifications</p>
              <p className="text-xs text-muted-foreground mt-1">
                You're all caught up!
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 hover:bg-accent/50 transition-colors ${
                    !notification.isRead ? "bg-primary/5 border-l-2 border-l-primary" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-medium">
                          {notification.title || "Notification"}
                        </p>
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={(e) => handleMarkAsRead(e, notification.id)}
                          >
                            <Check className="h-3 w-3 mr-1" weight="bold" />
                            Mark read
                          </Button>
                        )}
                      </div>
                      {notification.message && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {notification.message}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {notification.notificationType.replace(/_/g, " ")}
                        </Badge>
                        <p className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {notifications && notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-4 py-3 bg-muted/30">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-xs"
                onClick={handleViewAll}
              >
                <Eye className="h-3 w-3 mr-2" weight="bold" />
                View all notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
