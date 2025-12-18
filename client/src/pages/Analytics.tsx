import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ChartBar, TrendUp, Warning, CheckCircle } from "@phosphor-icons/react";
export default function Analytics() {
  // Fetch analytics data
  const { data: completionStats } = trpc.analytics.auditCompletion.useQuery({ days: 90 });
  const { data: trend = [] } = trpc.analytics.auditTrend.useQuery({ months: 6 });
  const { data: nonComplianceAreas = [] } = trpc.analytics.nonComplianceAreas.useQuery({ limit: 10 });
  const { data: actionPlanStats } = trpc.analytics.actionPlanStats.useQuery();
  const { data: auditsByType = [] } = trpc.analytics.auditsByType.useQuery();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Audit Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive insights into audit completion, compliance trends, and action plan progress
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionStats?.completionRate || 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {completionStats?.completed || 0} of {completionStats?.total || 0} audits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <ChartBar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionStats?.inProgress || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Active audits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Action Plans</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{actionPlanStats?.completed || 0}/{actionPlanStats?.total || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Actions</CardTitle>
            <Warning className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{actionPlanStats?.overdue || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Requiring attention</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="completion" className="space-y-4">
        <TabsList>
          <TabsTrigger value="completion">Completion Trend</TabsTrigger>
          <TabsTrigger value="noncompliance">Non-Compliance Areas</TabsTrigger>
          <TabsTrigger value="types">Audits by Type</TabsTrigger>
        </TabsList>

        <TabsContent value="completion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Completion Trend (Last 6 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              {trend.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No audit data available yet</p>
              ) : (
                <div className="space-y-4">
                  {trend.map((month) => {
                    const completionRate = month.total > 0 ? Math.round((month.completed / month.total) * 100) : 0;
                    return (
                      <div key={month.month} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{month.month}</span>
                          <span className="text-muted-foreground">
                            {month.completed} / {month.total} ({completionRate}%)
                          </span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${completionRate}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="noncompliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Common Non-Compliance Areas</CardTitle>
            </CardHeader>
            <CardContent>
              {nonComplianceAreas.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No non-compliance data available yet</p>
              ) : (
                <div className="space-y-4">
                  {nonComplianceAreas.map((area, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-start justify-between text-sm">
                        <span className="font-medium flex-1">{area.question}</span>
                        <span className="text-muted-foreground ml-4">
                          {area.nonCompliantCount} / {area.totalCount} ({area.nonComplianceRate}%)
                        </span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 transition-all"
                          style={{ width: `${area.nonComplianceRate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audits by Type</CardTitle>
            </CardHeader>
            <CardContent>
              {auditsByType.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No audit type data available yet</p>
              ) : (
                <div className="space-y-4">
                  {auditsByType.map((type) => {
                    const completionRate = type.count > 0 ? Math.round((type.completed / type.count) * 100) : 0;
                    return (
                      <div key={type.typeId} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{type.typeName}</span>
                          <span className="text-muted-foreground">
                            {type.completed} / {type.count} ({completionRate}%)
                          </span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 transition-all"
                            style={{ width: `${completionRate}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
