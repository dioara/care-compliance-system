import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  TrendingUp,
  FileText,
  Users,
  ClipboardCheck,
  AlertTriangle,
  Loader2
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: profile } = trpc.company.getProfile.useQuery();
  const { data: locations } = trpc.locations.list.useQuery();
  const { data: dashboardStats, isLoading: statsLoading } = trpc.dashboard.getStats.useQuery();

  // Use real data from database
  const stats = dashboardStats || {
    overallCompliance: 0,
    compliantSections: 0,
    totalSections: 0,
    overdueActions: 0,
    upcomingAudits: 0,
    recentIncidents: 0,
  };

  const ragStatus = dashboardStats?.ragStatus || {
    green: 0,
    amber: 0,
    red: 0,
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.name || 'User'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {profile?.name ? `Managing compliance for ${profile.name}` : 'Compliance Management Dashboard'}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Overall Compliance
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overallCompliance}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.compliantSections} of {stats.totalSections} sections compliant
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Overdue Actions
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.overdueActions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Audits
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingAudits}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Due in next 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recent Incidents
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentIncidents}</div>
            <p className="text-xs text-muted-foreground mt-1">
              In the last 7 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* RAG Status Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Compliance Status (RAG)</CardTitle>
            <CardDescription>
              Current status across all compliance sections
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-green-500" />
                <span className="text-sm font-medium">Compliant (Green)</span>
              </div>
              <span className="text-2xl font-bold">{ragStatus.green}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-amber-500" />
                <span className="text-sm font-medium">Partial (Amber)</span>
              </div>
              <span className="text-2xl font-bold">{ragStatus.amber}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-red-500" />
                <span className="text-sm font-medium">Non-Compliant (Red)</span>
              </div>
              <span className="text-2xl font-bold">{ragStatus.red}</span>
            </div>
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Sections</span>
                <span className="text-2xl font-bold">{stats.totalSections}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <button className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors">
              <ClipboardCheck className="h-5 w-5 text-muted-foreground" />
              <div className="text-left">
                <p className="text-sm font-medium">Start Compliance Assessment</p>
                <p className="text-xs text-muted-foreground">Review and update compliance status</p>
              </div>
            </button>
            
            <button className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div className="text-left">
                <p className="text-sm font-medium">Upload Care Plan for AI Audit</p>
                <p className="text-xs text-muted-foreground">Get quality feedback in minutes</p>
              </div>
            </button>
            
            <button className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
              <div className="text-left">
                <p className="text-sm font-medium">Report Incident</p>
                <p className="text-xs text-muted-foreground">Log and track incidents</p>
              </div>
            </button>
            
            <button className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div className="text-left">
                <p className="text-sm font-medium">Generate Compliance Report</p>
                <p className="text-xs text-muted-foreground">Export branded reports for CQC</p>
              </div>
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Locations Overview */}
      {locations && locations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Locations</CardTitle>
            <CardDescription>
              {locations.length} location{locations.length !== 1 ? 's' : ''} registered
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {locations.map((location) => (
                <div key={location.id} className="flex items-start gap-3 p-3 rounded-lg border">
                  <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{location.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {location.serviceUserCount || 0} service users • {location.staffCount || 0} staff
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Getting Started */}
      {(!locations || locations.length === 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Complete these steps to set up your compliance management system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-sm">Company profile created</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
              <span className="text-sm text-muted-foreground">Add your first location</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
              <span className="text-sm text-muted-foreground">Complete initial compliance assessment</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
              <span className="text-sm text-muted-foreground">Set up audit schedules</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
