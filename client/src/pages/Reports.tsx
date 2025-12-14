import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, AlertCircle } from "lucide-react";

export default function Reports() {
  const reportTypes = [
    { name: "Compliance Summary Report", description: "Overall compliance status with RAG ratings" },
    { name: "Intervention Plan Report", description: "Full intervention plan with company branding" },
    { name: "Audit Results Report", description: "Detailed audit findings and recommendations" },
    { name: "Incident Report", description: "Incident log with categorization and actions" },
    { name: "Staff Training Matrix", description: "Staff training compliance and gaps" },
    { name: "Risk Notification Log", description: "All risks reported to local authority" },
    { name: "CQC Notification Log", description: "All notifications sent to CQC" },
    { name: "Master Action Plan", description: "All outstanding actions across audits" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground mt-2">
          Generate branded compliance reports for CQC, regulators, and internal use
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
          <CardDescription>
            All reports include your company logo and branding
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {reportTypes.map((report, index) => (
              <div key={index} className="flex items-start justify-between p-4 rounded-lg border">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{report.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <AlertCircle className="inline h-4 w-4 mr-2" />
              Report generation with company branding coming soon. Supports PDF, Word, and Excel formats.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Report Customization</CardTitle>
          <CardDescription>
            Customize report content and branding
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Period</label>
              <select className="w-full p-2 rounded-md border">
                <option>Last 30 days</option>
                <option>Last 90 days</option>
                <option>Last 6 months</option>
                <option>Last year</option>
                <option>Custom range</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <select className="w-full p-2 rounded-md border">
                <option>All locations</option>
                <option>Main Care Home</option>
                <option>Supported Living Unit</option>
              </select>
            </div>
          </div>
          <Button className="w-full">
            <FileText className="mr-2 h-4 w-4" />
            Generate Custom Report
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
