import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Calendar, AlertCircle } from "lucide-react";

export default function Audits() {
  const auditTypes = [
    { name: "Care Plan Audit", category: "Monthly", isAI: true },
    { name: "Medication Audit", category: "Monthly", isAI: false },
    { name: "Daily Notes Audit", category: "Monthly", isAI: true },
    { name: "Staff File Audit", category: "Monthly", isAI: false },
    { name: "Infection Control Audit", category: "Monthly", isAI: false },
    { name: "Health & Safety Audit", category: "Quarterly", isAI: false },
    { name: "Safeguarding Audit", category: "Quarterly", isAI: false },
    { name: "Dignity Audit", category: "Quarterly", isAI: false },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Management</h1>
        <p className="text-muted-foreground mt-2">
          Schedule and track 25 different audit types across your locations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audit Types</CardTitle>
          <CardDescription>
            Comprehensive audit framework covering all aspects of care quality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {auditTypes.map((audit, index) => (
              <button
                key={index}
                className="flex flex-col gap-2 p-4 rounded-lg border hover:bg-accent transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <ClipboardList className="h-5 w-5 text-muted-foreground" />
                  {audit.isAI && (
                    <Badge variant="secondary" className="text-xs">AI-Powered</Badge>
                  )}
                </div>
                <div>
                  <p className="font-medium">{audit.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <Calendar className="inline h-3 w-3 mr-1" />
                    {audit.category}
                  </p>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <AlertCircle className="inline h-4 w-4 mr-2" />
              Full audit scheduling, templates, and tracking functionality coming soon.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
