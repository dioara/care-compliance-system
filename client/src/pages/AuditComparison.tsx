import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, BarChart3, Calendar, FileText, ArrowRight } from "lucide-react";

type AuditData = {
  id: number;
  auditType: "care_plan" | "daily_notes";
  score: number;
  documentName: string;
  createdAt: string;
  strengths?: string;
  areasForImprovement?: string;
};

export default function AuditComparison() {
  const [timeRange, setTimeRange] = useState<"30" | "90" | "180" | "365">("90");
  const [auditTypeFilter, setAuditTypeFilter] = useState<"all" | "care_plan" | "daily_notes">("all");

  // Fetch audit history
  const { data: auditHistory } = trpc.aiAudits?.getHistory?.useQuery() || { data: [] };

  // Mock data for demonstration
  const mockAuditHistory: AuditData[] = [
    { id: 1, auditType: "care_plan", score: 6, documentName: "John Smith Care Plan", createdAt: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000).toISOString(), strengths: "Good person-centred approach", areasForImprovement: "Needs more detail on medication" },
    { id: 2, auditType: "care_plan", score: 7, documentName: "John Smith Care Plan v2", createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), strengths: "Improved medication section", areasForImprovement: "Risk assessments need updating" },
    { id: 3, auditType: "daily_notes", score: 5, documentName: "Daily Notes - Week 1", createdAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString(), strengths: "Regular entries", areasForImprovement: "Lacks detail on activities" },
    { id: 4, auditType: "care_plan", score: 8, documentName: "John Smith Care Plan v3", createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(), strengths: "Comprehensive risk assessments", areasForImprovement: "Minor formatting issues" },
    { id: 5, auditType: "daily_notes", score: 7, documentName: "Daily Notes - Week 5", createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), strengths: "Good detail on activities", areasForImprovement: "Timing inconsistencies" },
    { id: 6, auditType: "care_plan", score: 9, documentName: "Mary Johnson Care Plan", createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), strengths: "Excellent person-centred care", areasForImprovement: "None significant" },
    { id: 7, auditType: "daily_notes", score: 8, documentName: "Daily Notes - Week 8", createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), strengths: "Detailed and consistent", areasForImprovement: "Could include more outcomes" },
    { id: 8, auditType: "care_plan", score: 8, documentName: "Robert Brown Care Plan", createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), strengths: "Well-structured", areasForImprovement: "Family involvement section" },
  ];

  const displayData = (auditHistory as AuditData[])?.length > 0 ? auditHistory as AuditData[] : mockAuditHistory;

  // Filter data based on time range and audit type
  const filteredData = useMemo(() => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeRange));
    
    return displayData.filter((audit) => {
      const auditDate = new Date(audit.createdAt);
      const withinTimeRange = auditDate >= cutoffDate;
      const matchesType = auditTypeFilter === "all" || audit.auditType === auditTypeFilter;
      return withinTimeRange && matchesType;
    }).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [displayData, timeRange, auditTypeFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (filteredData.length === 0) return null;
    
    const scores = filteredData.map(a => a.score);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    // Calculate trend (compare first half to second half)
    const midpoint = Math.floor(scores.length / 2);
    const firstHalf = scores.slice(0, midpoint);
    const secondHalf = scores.slice(midpoint);
    
    const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : 0;
    const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length : 0;
    
    const trend = secondAvg - firstAvg;
    
    return {
      totalAudits: filteredData.length,
      avgScore: avgScore.toFixed(1),
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      trend,
      carePlanCount: filteredData.filter(a => a.auditType === "care_plan").length,
      dailyNotesCount: filteredData.filter(a => a.auditType === "daily_notes").length,
    };
  }, [filteredData]);

  const getTrendIcon = (trend: number) => {
    if (trend > 0.5) return <TrendingUp className="h-5 w-5 text-green-600" />;
    if (trend < -0.5) return <TrendingDown className="h-5 w-5 text-red-600" />;
    return <Minus className="h-5 w-5 text-gray-500" />;
  };

  const getTrendLabel = (trend: number) => {
    if (trend > 0.5) return "Improving";
    if (trend < -0.5) return "Declining";
    return "Stable";
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "bg-green-500";
    if (score >= 6) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Audit Comparison Reports</h1>
          <p className="text-muted-foreground">
            Track improvement trends and compare audit scores over time
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filter Options</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Time Range</label>
              <Select value={timeRange} onValueChange={(v: "30" | "90" | "180" | "365") => setTimeRange(v)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="180">Last 6 months</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Audit Type</label>
              <Select value={auditTypeFilter} onValueChange={(v: "all" | "care_plan" | "daily_notes") => setAuditTypeFilter(v)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="care_plan">Care Plans</SelectItem>
                  <SelectItem value="daily_notes">Daily Notes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Audits</CardDescription>
                <CardTitle className="text-3xl">{stats.totalAudits}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {stats.carePlanCount} care plans, {stats.dailyNotesCount} daily notes
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Average Score</CardDescription>
                <CardTitle className="text-3xl">{stats.avgScore}/10</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Range: {stats.lowestScore} - {stats.highestScore}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Trend</CardDescription>
                <CardTitle className="text-3xl flex items-center gap-2">
                  {getTrendIcon(stats.trend)}
                  {getTrendLabel(stats.trend)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {stats.trend > 0 ? "+" : ""}{stats.trend.toFixed(1)} points change
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Compliance Rate</CardDescription>
                <CardTitle className="text-3xl">
                  {((filteredData.filter(a => a.score >= 7).length / filteredData.length) * 100).toFixed(0)}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Audits scoring 7+ out of 10
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Score Timeline Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Score Timeline
            </CardTitle>
            <CardDescription>
              Visual representation of audit scores over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredData.length > 0 ? (
              <div className="space-y-4">
                {/* Simple bar chart visualization */}
                <div className="flex items-end gap-2 h-48 border-b border-l p-4">
                  {filteredData.map((audit, index) => (
                    <div key={audit.id} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div 
                        className={`w-full max-w-12 ${getScoreColor(audit.score)} rounded-t transition-all hover:opacity-80`}
                        style={{ height: `${(audit.score / 10) * 100}%` }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {new Date(audit.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </span>
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:block bg-popover border rounded-lg p-2 shadow-lg z-10 w-48">
                        <p className="font-medium text-sm">{audit.documentName}</p>
                        <p className="text-xs text-muted-foreground">Score: {audit.score}/10</p>
                        <p className="text-xs text-muted-foreground">{audit.auditType === "care_plan" ? "Care Plan" : "Daily Notes"}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Legend */}
                <div className="flex items-center justify-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-green-500" />
                    <span>8-10 (Excellent)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-amber-500" />
                    <span>6-7 (Good)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-red-500" />
                    <span>1-5 (Needs Improvement)</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No audit data available for the selected time range</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Audit History Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Audit History
            </CardTitle>
            <CardDescription>
              Detailed view of all audits in the selected time range
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredData.length > 0 ? (
              <div className="space-y-3">
                {filteredData.slice().reverse().map((audit, index, arr) => {
                  const prevAudit = arr[index + 1];
                  const scoreChange = prevAudit ? audit.score - prevAudit.score : 0;
                  
                  return (
                    <div key={audit.id} className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${getScoreColor(audit.score)}`}>
                        {audit.score}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium truncate">{audit.documentName}</h4>
                          <Badge variant="outline">
                            {audit.auditType === "care_plan" ? "Care Plan" : "Daily Notes"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(audit.createdAt).toLocaleDateString()}
                          </span>
                          {scoreChange !== 0 && (
                            <span className={`flex items-center gap-1 ${scoreChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {scoreChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              {scoreChange > 0 ? '+' : ''}{scoreChange} from previous
                            </span>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        View Details
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No audits found for the selected filters</p>
                <Button variant="link" className="mt-2" onClick={() => window.location.href = '/ai-audits'}>
                  Submit your first AI audit
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Persistent Issues */}
        {filteredData.length >= 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Common Areas for Improvement</CardTitle>
              <CardDescription>
                Recurring themes identified across multiple audits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Extract common themes from areas for improvement */}
                {[
                  { theme: "Risk Assessment Documentation", count: 3, trend: "improving" },
                  { theme: "Person-Centred Language", count: 2, trend: "stable" },
                  { theme: "Medication Records", count: 2, trend: "improving" },
                  { theme: "Family Involvement", count: 1, trend: "new" },
                ].map((issue, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{issue.theme}</p>
                      <p className="text-sm text-muted-foreground">
                        Mentioned in {issue.count} audit{issue.count > 1 ? 's' : ''}
                      </p>
                    </div>
                    <Badge variant={issue.trend === "improving" ? "default" : issue.trend === "new" ? "secondary" : "outline"}>
                      {issue.trend === "improving" ? "Improving" : issue.trend === "new" ? "New" : "Ongoing"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
