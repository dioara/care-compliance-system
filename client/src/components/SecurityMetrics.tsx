import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Warning, ArrowsClockwise, Clock } from "@phosphor-icons/react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export function SecurityMetrics() {
  const [refreshKey, setRefreshKey] = useState(0);
  
  const { data: metrics, isLoading, refetch } = trpc.system.getSecurityMetrics.useQuery(
    undefined,
    { 
      refetchInterval: 60000, // Auto-refresh every minute
      queryKey: ["system.getSecurityMetrics", refreshKey]
    }
  );

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refetch();
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-5 w-5 text-primary" weight="bold" />
          <h3 className="text-lg font-semibold">Security Metrics</h3>
        </div>
        <div className="space-y-3">
          <div className="h-16 bg-muted animate-pulse rounded" />
          <div className="h-16 bg-muted animate-pulse rounded" />
          <div className="h-16 bg-muted animate-pulse rounded" />
        </div>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-5 w-5 text-primary" weight="bold" />
          <h3 className="text-lg font-semibold">Security Metrics</h3>
        </div>
        <p className="text-sm text-muted-foreground">No security data available</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-primary" weight="bold" />
          <h3 className="text-lg font-semibold">Security Metrics</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          className="h-8 w-8 p-0"
        >
          <ArrowsClockwise className="h-4 w-4" weight="bold" />
        </Button>
      </div>

      <div className="space-y-4">
        {/* Failed Login Attempts */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              metrics.failedLoginAttempts > 10 
                ? "bg-destructive/10 text-destructive" 
                : metrics.failedLoginAttempts > 5
                ? "bg-yellow-500/10 text-yellow-600"
                : "bg-green-500/10 text-green-600"
            }`}>
              <Warning className="h-4 w-4" weight="bold" />
            </div>
            <div>
              <p className="text-sm font-medium">Failed Login Attempts</p>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </div>
          </div>
          <span className={`text-2xl font-bold ${
            metrics.failedLoginAttempts > 10 
              ? "text-destructive" 
              : metrics.failedLoginAttempts > 5
              ? "text-yellow-600"
              : "text-green-600"
          }`}>
            {metrics.failedLoginAttempts}
          </span>
        </div>

        {/* Suspicious IPs */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              metrics.suspiciousIPs.length > 0 
                ? "bg-destructive/10 text-destructive" 
                : "bg-green-500/10 text-green-600"
            }`}>
              <Shield className="h-4 w-4" weight="bold" />
            </div>
            <div>
              <p className="text-sm font-medium">Suspicious IPs Blocked</p>
              <p className="text-xs text-muted-foreground">Active blocks</p>
            </div>
          </div>
          <span className={`text-2xl font-bold ${
            metrics.suspiciousIPs.length > 0 
              ? "text-destructive" 
              : "text-green-600"
          }`}>
            {metrics.suspiciousIPs.length}
          </span>
        </div>

        {/* Suspicious IPs List */}
        {metrics.suspiciousIPs.length > 0 && (
          <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
            <p className="text-sm font-medium text-destructive mb-2">Blocked IP Addresses:</p>
            <div className="space-y-1">
              {metrics.suspiciousIPs.map((ip, index) => (
                <div key={index} className="text-xs font-mono text-muted-foreground bg-background px-2 py-1 rounded">
                  {ip}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Security Events */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10 text-primary">
              <Clock className="h-4 w-4" weight="bold" />
            </div>
            <div>
              <p className="text-sm font-medium">Recent Security Events</p>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </div>
          </div>
          <span className="text-2xl font-bold text-primary">
            {metrics.recentEvents}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t">
        <p className="text-xs text-muted-foreground text-center">
          Auto-refreshes every minute • Last updated: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </Card>
  );
}
