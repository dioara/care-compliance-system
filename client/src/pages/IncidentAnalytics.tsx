import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

import { TrendUp, Clock, CheckCircle, MapPin, Calendar, DownloadSimple, Warning, ChartBar, ChartPie, ChartLine } from "@phosphor-icons/react";
import {
  BarChart, Bar, PieChart as RechartsPie, Pie, Cell, LineChart as RechartsLine, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

const COLORS = {
  fall: "#3b82f6",
  medication_error: "#ef4444",
  safeguarding: "#f59e0b",
  pressure_ulcer: "#8b5cf6",
  infection: "#ec4899",
  challenging_behaviour: "#f97316",
  missing_person: "#14b8a6",
  equipment_failure: "#6366f1",
  near_miss: "#10b981",
  complaint: "#84cc16",
  death: "#64748b",
  other: "#94a3b8",
};

const SEVERITY_COLORS = {
  low: "#3b82f6",
  medium: "#f59e0b",
  high: "#f97316",
  critical: "#ef4444",
};

const INCIDENT_TYPE_LABELS: Record<string, string> = {
  fall: "Fall",
  medication_error: "Medication Error",
  safeguarding: "Safeguarding",
  pressure_ulcer: "Pressure Ulcer",
  infection: "Infection",
  challenging_behaviour: "Challenging Behaviour",
  missing_person: "Missing Person",
  equipment_failure: "Equipment Failure",
  near_miss: "Near Miss",
  complaint: "Complaint",
  death: "Death",
  other: "Other",
};

export default function IncidentAnalytics() {
  const [dateRange, setDateRange] = useState("30");
  const [locationId, setLocationId] = useState<number | undefined>(undefined);

  // Calculate date range
  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = new Date();
    
    if (dateRange === "7") {
      start.setDate(start.getDate() - 7);
    } else if (dateRange === "30") {
      start.setDate(start.getDate() - 30);
    } else if (dateRange === "90") {
      start.setDate(start.getDate() - 90);
    } else if (dateRange === "365") {
      start.setFullYear(start.getFullYear() - 1);
    }
    
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  }, [dateRange]);

  // Fetch data
  const { data: analytics, isLoading } = trpc.analytics.incidentAnalytics.useQuery({
    locationId,
    startDate,
    endDate,
  });

  const { data: locations = [] } = trpc.locations.list.useQuery();

  // Transform data for charts
  const typeChartData = useMemo(() => {
    if (!analytics?.byType) return [];
    return Object.entries(analytics.byType).map(([type, count]) => ({
      name: INCIDENT_TYPE_LABELS[type] || type,
      value: count,
      fill: COLORS[type as keyof typeof COLORS] || "#94a3b8",
    }));
  }, [analytics]);

  const severityChartData = useMemo(() => {
    if (!analytics?.bySeverity) return [];
    return Object.entries(analytics.bySeverity).map(([severity, count]) => ({
      name: severity.charAt(0).toUpperCase() + severity.slice(1),
      value: count,
      fill: SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS] || "#94a3b8",
    }));
  }, [analytics]);

  const locationChartData = useMemo(() => {
    if (!analytics?.byLocation) return [];
    return Object.entries(analytics.byLocation).map(([id, data]) => ({
      name: data.locationName || `Location ${id}`,
      count: data.count,
    }));
  }, [analytics]);

  const timeSeriesData = useMemo(() => {
    if (!analytics?.timeSeries) return [];
    return analytics.timeSeries.map((item) => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count: item.count,
    }));
  }, [analytics]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Incident Analytics</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/3 animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Incident Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Visualise incident trends and patterns across your organisation
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Select 
            value={locationId?.toString() || "all"} 
            onValueChange={(val) => setLocationId(val === "all" ? undefined : Number(val))}
          >
            <SelectTrigger className="w-[200px]">
              <MapPin className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All locations</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id.toString()}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Incidents</CardTitle>
            <Warning className="h-4 w-4 text-muted-foreground" weight="bold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalIncidents || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              In selected period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Incidents</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.openIncidents || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting resolution
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Incidents</CardTitle>
            <Warning className="h-4 w-4 text-destructive" weight="bold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{analytics?.criticalIncidents || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Requiring immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
            <TrendUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.avgResolutionDays || 0} days</div>
            <p className="text-xs text-muted-foreground mt-1">
              For closed incidents
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Incidents by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartPie className="h-5 w-5" weight="bold" />
              Incidents by Type
            </CardTitle>
            <CardDescription>Distribution of incident types</CardDescription>
          </CardHeader>
          <CardContent>
            {typeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPie>
                  <Pie
                    data={typeChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {typeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPie>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Incidents by Severity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartBar className="h-5 w-5" weight="bold" />
              Incidents by Severity
            </CardTitle>
            <CardDescription>Severity level distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {severityChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={severityChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {severityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Incident Trend Over Time */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartLine className="h-5 w-5" weight="bold" />
              Incident Trend Over Time
            </CardTitle>
            <CardDescription>Daily incident count in selected period</CardDescription>
          </CardHeader>
          <CardContent>
            {timeSeriesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsLine data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Incidents"
                  />
                </RechartsLine>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Incidents by Location */}
        {!locationId && locationChartData.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Incidents by Location
              </CardTitle>
              <CardDescription>Comparison across all locations</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={locationChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
