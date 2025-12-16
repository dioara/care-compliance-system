import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { 
  Users, 
  Shield, 
  MapPin, 
  UserCheck, 
  Clock, 
  Activity,
  Loader2,
  Crown,
  UserCog
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { SecurityMetrics } from "@/components/SecurityMetrics";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: stats, isLoading } = trpc.admin.getStats.useQuery();

  if (!user?.superAdmin) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Only super administrators can access this page.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          System overview and user management statistics.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.recentSignups || 0} new in last 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
            <Crown className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.superAdminCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Full system access
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRoles || 0}</div>
            <p className="text-xs text-muted-foreground">
              Custom permission sets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalLocations || 0}</div>
            <p className="text-xs text-muted-foreground">
              Registered care locations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Security Metrics Widget */}
      <SecurityMetrics />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Users by Role */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Users by Role
            </CardTitle>
            <CardDescription>
              Distribution of users across system roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.usersByRole?.map((item: any) => (
                <div key={item.role} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {item.role?.replace('_', ' ') || 'Unknown'}
                    </Badge>
                  </div>
                  <span className="font-semibold">{item.count}</span>
                </div>
              ))}
              {(!stats?.usersByRole || stats.usersByRole.length === 0) && (
                <p className="text-sm text-muted-foreground">No users found</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Custom Roles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Custom Roles
            </CardTitle>
            <CardDescription>
              Roles with assigned users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.rolesWithCounts?.map((role: any) => (
                <div key={role.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{role.name}</p>
                    {role.description && (
                      <p className="text-xs text-muted-foreground">{role.description}</p>
                    )}
                  </div>
                  <Badge variant="secondary">{role.userCount} users</Badge>
                </div>
              ))}
              {(!stats?.rolesWithCounts || stats.rolesWithCounts.length === 0) && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-2">No custom roles created</p>
                  <button 
                    onClick={() => setLocation('/role-management')}
                    className="text-sm text-primary hover:underline"
                  >
                    Create your first role →
                  </button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent User Activity
          </CardTitle>
          <CardDescription>
            Last 10 user sign-ins
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.recentActivity?.map((activity: any) => (
              <div key={activity.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserCheck className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{activity.name || 'Unknown User'}</p>
                    <p className="text-xs text-muted-foreground">{activity.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {activity.lastSignedIn 
                    ? new Date(activity.lastSignedIn).toLocaleString()
                    : 'Never'
                  }
                </div>
              </div>
            ))}
            {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent activity recorded
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <button 
              onClick={() => setLocation('/user-management')}
              className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors text-left"
            >
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Manage Users</p>
                <p className="text-xs text-muted-foreground">Add, edit, or remove users</p>
              </div>
            </button>
            
            <button 
              onClick={() => setLocation('/role-management')}
              className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors text-left"
            >
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Manage Roles</p>
                <p className="text-xs text-muted-foreground">Configure permissions</p>
              </div>
            </button>
            
            <button 
              onClick={() => setLocation('/locations')}
              className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors text-left"
            >
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Manage Locations</p>
                <p className="text-xs text-muted-foreground">Add or edit locations</p>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
