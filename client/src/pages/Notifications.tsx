import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { formatDistanceToNow } from "date-fns";

import { Bell, Check, Checks, Spinner } from "@phosphor-icons/react";
export default function Notifications() {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  
  const { data: notifications, isLoading, refetch } = trpc.notifications.list.useQuery({
    limit: 50,
    offset: 0,
    unreadOnly: filter === "unread",
  });
  
  const { data: unreadCount } = trpc.notifications.getUnreadCount.useQuery();
  
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });
  
  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });
  
  const handleMarkAsRead = (id: number) => {
    markAsReadMutation.mutate({ id });
  };
  
  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };
  
  const getNotificationIcon = (type: string) => {
    return <Bell className="h-5 w-5" />;
  };
  
  const getNotificationColor = (type: string) => {
    if (type.includes("alert") || type.includes("overdue")) return "destructive";
    if (type.includes("warning")) return "warning";
    return "default";
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "unread" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("unread")}
            >
              Unread {unreadCount ? `(${unreadCount})` : ""}
            </Button>
          </div>
          
          {unreadCount && unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
            >
              {markAllAsReadMutation.isPending ? (
                <Spinner className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Checks className="h-4 w-4 mr-2" />
              )}
              Mark all as read
            </Button>
          )}
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !notifications || notifications.length === 0 ? (
        <Card className="p-12 text-center">
          <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No notifications</h3>
          <p className="text-muted-foreground">
            {filter === "unread" 
              ? "You're all caught up! No unread notifications."
              : "You don't have any notifications yet."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`p-4 transition-colors ${
                !notification.isRead ? "bg-accent/50 border-l-4 border-l-primary" : ""
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-full ${
                  !notification.isRead ? "bg-primary/10" : "bg-muted"
                }`}>
                  {getNotificationIcon(notification.notificationType)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      {notification.title && (
                        <h3 className="font-semibold mb-1">{notification.title}</h3>
                      )}
                      {notification.message && (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {notification.message}
                        </p>
                      )}
                    </div>
                    
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                        disabled={markAsReadMutation.isPending}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Mark as read
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <Badge variant={getNotificationColor(notification.notificationType)} className="text-xs">
                      {notification.notificationType.replace(/_/g, " ")}
                    </Badge>
                    <span>
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                    {notification.isRead && notification.readAt && (
                      <span className="flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Read {formatDistanceToNow(new Date(notification.readAt), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
