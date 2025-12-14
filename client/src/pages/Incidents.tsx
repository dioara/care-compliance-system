import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Plus, AlertCircle } from "lucide-react";

export default function Incidents() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Incident Reporting</h1>
          <p className="text-muted-foreground mt-2">
            Log and track incidents with automatic categorization and regulatory reporting
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Report Incident
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Incidents
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground mt-1">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Reported to CQC
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground mt-1">
              Requiring notification
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Open Actions
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting completion
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Incidents</CardTitle>
          <CardDescription>
            Latest incident reports and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { type: "Medication Error", severity: "High", reportedTo: ["CQC"], status: "Under Investigation" },
              { type: "Fall", severity: "Medium", reportedTo: ["Council"], status: "Completed" },
              { type: "Safeguarding Concern", severity: "High", reportedTo: ["CQC", "Council"], status: "Open" },
            ].map((incident, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-1">
                  <p className="font-medium">{incident.type}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={incident.severity === "High" ? "destructive" : "secondary"}>
                      {incident.severity}
                    </Badge>
                    {incident.reportedTo.map((org) => (
                      <Badge key={org} variant="outline" className="text-xs">
                        {org}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Badge variant={incident.status === "Completed" ? "default" : "secondary"}>
                  {incident.status}
                </Badge>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <AlertCircle className="inline h-4 w-4 mr-2" />
              Full incident management functionality coming soon. Includes automatic feeds to Risk Notification Log, CQC Log, and Master Action Log.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
