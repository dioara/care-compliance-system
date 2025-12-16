import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useLocation as useLocationContext } from "@/contexts/LocationContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Bell,
  X,
  Building2,
  Activity,
  ChevronRight,
  Shield,
  BarChart3,
  Sparkles
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { activeLocationId, setActiveLocationId, accessibleLocations } = useLocationContext();
  const { data: profile } = trpc.company.getProfile.useQuery();
  const { data: locations } = trpc.locations.list.useQuery();
  const { data: dashboardStats, isLoading: statsLoading } = trpc.dashboard.getStats.useQuery(
    activeLocationId ? { locationId: activeLocationId } : undefined
  );
  
  
  // Compliance alerts
  const { data: alertStatus } = trpc.notifications.getAlertStatus.useQuery(
    { threshold: 80, locationId: activeLocationId || undefined }
  );
  const sendNotification = trpc.notifications.checkComplianceAndNotify.useMutation();
  const [alertDismissed, setAlertDismissed] = useState(false);
  
  const handleSendAlert = async () => {
    try {
      const result = await sendNotification.mutateAsync({
        threshold: 80,
        locationId: activeLocationId || undefined
      });
      if (result.sent) {
        toast.success("Alert Sent", {
          description: "Compliance alert email has been sent.",
        });
      } else {
        toast.info("No Alert Needed", {
          description: result.reason || "Compliance is within acceptable levels.",
        });
      }
    } catch (error) {
      toast.error("Error", {
        description: "Failed to send notification.",
      });
    }
  };

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

  const getComplianceColor = (value: number) => {
    if (value >= 80) return "text-green-600";
    if (value >= 60) return "text-amber-600";
    return "text-red-600";
  };

  const getComplianceGradient = (value: number) => {
    if (value >= 80) return "from-green-500 to-emerald-600";
    if (value >= 60) return "from-amber-500 to-orange-600";
    return "from-red-500 to-rose-600";
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Compliance Alert Banner */}
      {alertStatus?.hasAlerts && !alertDismissed && (
        <Alert variant="destructive" className="relative border-red-200 bg-red-50 shadow-sm">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="flex items-center justify-between text-red-800">
            <span className="font-semibold">Compliance Alerts Detected</span>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleSendAlert}
                disabled={sendNotification.isPending}
                className="border-red-300 hover:bg-red-100 text-red-700"
              >
                <Bell className="h-4 w-4 mr-1" />
                {sendNotification.isPending ? "Sending..." : "Send Alert"}
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => setAlertDismissed(true)}
                className="hover:bg-red-100 text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </AlertTitle>
          <AlertDescription className="text-red-700">
            <ul className="mt-2 space-y-1">
              {alertStatus.alerts.map((alert, i) => (
                <li key={i} className={`flex items-center gap-2 ${alert.severity === 'critical' ? 'font-semibold' : ''}`}>
                  <span className={`w-2 h-2 rounded-full ${alert.severity === 'critical' ? 'bg-red-600' : 'bg-amber-500'}`} />
                  {alert.message}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3 md:gap-4">
            <div className="p-2 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl shrink-0">
              <Activity className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Welcome back, {user?.name?.split(' ')[0] || 'User'}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={activeLocationId?.toString() || "all"}
              onValueChange={(value) => setActiveLocationId(value === "all" ? null : parseInt(value))}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations?.map((location) => (
                  <SelectItem key={location.id} value={location.id.toString()}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            {profile?.name ? `Managing compliance for ${profile.name}` : 'Compliance Management Dashboard'}
          </p>
        </div>
      </div>

      {/* Key Metrics - Redesigned */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Overall Compliance - Featured Card */}
        <Card className="col-span-2 lg:col-span-1 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Overall Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-bold">{stats.overallCompliance}</span>
              <span className="text-2xl font-bold text-slate-400 mb-1">%</span>
            </div>
            <Progress 
              value={stats.overallCompliance} 
              className="mt-4 h-2 bg-slate-700" 
            />
            <p className="text-xs text-slate-400 mt-3">
              {stats.compliantSections} of {stats.totalSections} sections compliant
            </p>
          </CardContent>
        </Card>

        {/* Overdue Actions */}
        <Card className={`border-2 transition-all hover:shadow-lg ${stats.overdueActions > 0 ? 'border-red-200 bg-red-50/50' : 'border-transparent'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue Actions
            </CardTitle>
            <div className={`p-2 rounded-lg ${stats.overdueActions > 0 ? 'bg-red-100' : 'bg-muted'}`}>
              <AlertCircle className={`h-4 w-4 ${stats.overdueActions > 0 ? 'text-red-600' : 'text-muted-foreground'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-4xl font-bold ${stats.overdueActions > 0 ? 'text-red-600' : ''}`}>
              {stats.overdueActions}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.overdueActions > 0 ? 'Require immediate attention' : 'All actions on track'}
            </p>
          </CardContent>
        </Card>

        {/* Upcoming Audits */}
        <Card className="border-2 border-transparent hover:border-blue-200 transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Upcoming Audits
            </CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats.upcomingAudits}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Due in next 30 days
            </p>
          </CardContent>
        </Card>

        {/* Recent Incidents */}
        <Card className={`border-2 transition-all hover:shadow-lg ${stats.recentIncidents > 0 ? 'border-amber-200 bg-amber-50/50' : 'border-transparent'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recent Incidents
            </CardTitle>
            <div className={`p-2 rounded-lg ${stats.recentIncidents > 0 ? 'bg-amber-100' : 'bg-muted'}`}>
              <AlertTriangle className={`h-4 w-4 ${stats.recentIncidents > 0 ? 'text-amber-600' : 'text-muted-foreground'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-4xl font-bold ${stats.recentIncidents > 0 ? 'text-amber-600' : ''}`}>
              {stats.recentIncidents}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              In the last 7 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* RAG Status & Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* RAG Status Overview - Redesigned */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Compliance Status
                </CardTitle>
                <CardDescription className="mt-1">
                  RAG breakdown across all sections
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Green */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />
                  <span className="text-sm font-medium">Compliant</span>
                </div>
                <span className="text-2xl font-bold text-green-600">{ragStatus.green}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats.totalSections > 0 ? (ragStatus.green / stats.totalSections) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Amber */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
                  <span className="text-sm font-medium">Partial Compliance</span>
                </div>
                <span className="text-2xl font-bold text-amber-600">{ragStatus.amber}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats.totalSections > 0 ? (ragStatus.amber / stats.totalSections) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Red */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
                  <span className="text-sm font-medium">Non-Compliant</span>
                </div>
                <span className="text-2xl font-bold text-red-600">{ragStatus.red}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-500 to-rose-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats.totalSections > 0 ? (ragStatus.red / stats.totalSections) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="pt-4 border-t flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Sections Assessed</span>
              <span className="text-xl font-bold">{stats.totalSections}</span>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions - Redesigned */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <button 
              onClick={() => setLocation('/audits')}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-transparent bg-gradient-to-r from-blue-50 to-indigo-50 hover:border-blue-200 hover:shadow-md transition-all group"
            >
              <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                <ClipboardCheck className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-gray-900">Schedule Audit</p>
                <p className="text-sm text-muted-foreground">Start a new compliance audit</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-blue-600 transition-colors" />
            </button>
            
            <button 
              onClick={() => setLocation('/ai-audits')}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-transparent bg-gradient-to-r from-purple-50 to-pink-50 hover:border-purple-200 hover:shadow-md transition-all group"
            >
              <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-gray-900">AI Care Plan Audit</p>
                <p className="text-sm text-muted-foreground">Get quality feedback in minutes</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-purple-600 transition-colors" />
            </button>
            
            <button 
              onClick={() => setLocation('/incidents')}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-transparent bg-gradient-to-r from-amber-50 to-orange-50 hover:border-amber-200 hover:shadow-md transition-all group"
            >
              <div className="p-3 bg-amber-100 rounded-xl group-hover:bg-amber-200 transition-colors">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-gray-900">Report Incident</p>
                <p className="text-sm text-muted-foreground">Log and track incidents</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-amber-600 transition-colors" />
            </button>
            
            <button 
              onClick={() => setLocation('/reports')}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-transparent bg-gradient-to-r from-green-50 to-emerald-50 hover:border-green-200 hover:shadow-md transition-all group"
            >
              <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-gray-900">Generate Report</p>
                <p className="text-sm text-muted-foreground">Export branded reports for CQC</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-green-600 transition-colors" />
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Locations Overview - Redesigned */}
      {locations && locations.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Your Locations
                </CardTitle>
                <CardDescription className="mt-1">
                  {locations.length} location{locations.length !== 1 ? 's' : ''} registered
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setLocation('/locations')}>
                Manage Locations
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {locations.map((location) => (
                <div 
                  key={location.id} 
                  className="flex items-start gap-4 p-4 rounded-xl border-2 border-transparent bg-muted/30 hover:border-primary/20 hover:bg-muted/50 transition-all cursor-pointer"
                  onClick={() => {
                    setActiveLocationId(location.id);
                    toast.success(`Switched to ${location.name}`);
                  }}
                >
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{location.name}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {location.serviceUserCount || 0} users
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {location.staffCount || 0} staff
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Getting Started - Redesigned */}
      {(!locations || locations.length === 0) && (
        <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Getting Started
            </CardTitle>
            <CardDescription>
              Complete these steps to set up your compliance management system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Company profile created</p>
                <p className="text-sm text-green-600">Your organisation is set up</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg border">
              <div className="h-6 w-6 rounded-full border-2 border-primary flex items-center justify-center">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <div>
                <p className="font-medium">Add your first location</p>
                <p className="text-sm text-muted-foreground">Set up care home locations</p>
              </div>
              <Button size="sm" className="ml-auto" onClick={() => setLocation('/locations')}>
                Add Location
              </Button>
            </div>
            <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg border opacity-60">
              <div className="h-6 w-6 rounded-full border-2 border-muted-foreground flex items-center justify-center">
                <span className="text-xs font-bold text-muted-foreground">3</span>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Complete initial compliance assessment</p>
                <p className="text-sm text-muted-foreground">Assess your current compliance status</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg border opacity-60">
              <div className="h-6 w-6 rounded-full border-2 border-muted-foreground flex items-center justify-center">
                <span className="text-xs font-bold text-muted-foreground">4</span>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Set up audit schedules</p>
                <p className="text-sm text-muted-foreground">Automate your compliance monitoring</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
