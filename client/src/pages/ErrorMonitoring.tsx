/**
 * Error Monitoring Dashboard
 * 
 * Admin-only page for viewing error logs, statistics, and user-reported issues
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, CheckCircle, Clock, Users, TrendingUp, FileText } from "lucide-react";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

export default function ErrorMonitoring() {
  const [timeRange, setTimeRange] = useState<number>(7);
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Fetch error statistics
  const { data: stats, isLoading: statsLoading } = trpc.errorMonitoring.getErrorStats.useQuery({
    days: timeRange,
  });

  // Fetch error logs
  const { data: errorLogs, isLoading: logsLoading } = trpc.errorMonitoring.getErrorLogs.useQuery({
    severity: selectedSeverity === "all" ? undefined : selectedSeverity,
    resolved: selectedStatus === "resolved" ? true : selectedStatus === "unresolved" ? false : undefined,
    limit: 50,
  });

  // Fetch error reports
  const { data: errorReports, isLoading: reportsLoading } = trpc.errorMonitoring.getErrorReports.useQuery({
    limit: 50,
  });

  const utils = trpc.useUtils();

  const resolveErrorMutation = trpc.errorMonitoring.resolveError.useMutation({
    onSuccess: () => {
      utils.errorMonitoring.getErrorLogs.invalidate();
      utils.errorMonitoring.getErrorStats.invalidate();
    },
  });

  const updateReportStatusMutation = trpc.errorMonitoring.updateErrorReportStatus.useMutation({
    onSuccess: () => {
      utils.errorMonitoring.getErrorReports.invalidate();
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "destructive";
      case "investigating":
        return "default";
      case "resolved":
        return "secondary";
      case "wont_fix":
        return "outline";
      default:
        return "secondary";
    }
  };

  if (statsLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading error monitoring data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Error Monitoring</h1>
        <p className="text-muted-foreground mt-2">
          Monitor application errors and user-reported issues
        </p>
      </div>

      {/* Time Range Selector */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">Time Range:</span>
        <Select value={timeRange.toString()} onValueChange={(v) => setTimeRange(Number(v))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Last 24 hours</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalErrors || 0}</div>
            <p className="text-xs text-muted-foreground">
              Last {timeRange} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats?.bySeverity?.find(s => s.severity === "critical")?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Affected Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.affectedUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Unique users impacted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{errorReports?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              User-submitted feedback
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Error Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Error Trend</CardTitle>
            <CardDescription>Daily error count over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats?.dailyCounts || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Errors by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Top Error Types</CardTitle>
            <CardDescription>Most common errors</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats?.byType || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="errorType" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Error Logs and Reports */}
      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">Error Logs</TabsTrigger>
          <TabsTrigger value="reports">User Reports</TabsTrigger>
        </TabsList>

        {/* Error Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Error Logs</CardTitle>
                  <CardDescription>System-generated error logs</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="unresolved">Unresolved</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logsLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : errorLogs && errorLogs.length > 0 ? (
                    errorLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {format(new Date(log.createdAt), "MMM d, HH:mm")}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{log.errorType}</TableCell>
                        <TableCell className="max-w-md truncate">{log.errorMessage}</TableCell>
                        <TableCell>
                          <Badge variant={getSeverityColor(log.severity)}>
                            {log.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.resolved ? (
                            <Badge variant="secondary">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Resolved
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <Clock className="h-3 w-3 mr-1" />
                              Open
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {!log.resolved && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resolveErrorMutation.mutate({ errorId: log.id })}
                              disabled={resolveErrorMutation.isPending}
                            >
                              Resolve
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No errors found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User-Reported Issues</CardTitle>
              <CardDescription>Feedback submitted by users when encountering errors</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportsLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : errorReports && errorReports.length > 0 ? (
                    errorReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="text-sm">
                          {format(new Date(report.createdAt), "MMM d, HH:mm")}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{report.userName}</div>
                            <div className="text-xs text-muted-foreground">{report.userEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-md">
                          <div className="space-y-1">
                            <p className="text-sm">{report.userDescription}</p>
                            {report.userAction && (
                              <p className="text-xs text-muted-foreground">Action: {report.userAction}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={report.status}
                            onValueChange={(status: any) =>
                              updateReportStatusMutation.mutate({
                                reportId: report.id,
                                status,
                              })
                            }
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="investigating">Investigating</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="wont_fix">Won't Fix</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No user reports found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
