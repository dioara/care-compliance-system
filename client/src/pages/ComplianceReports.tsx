import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Download } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ComplianceReports() {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedLocations, setSelectedLocations] = useState<number[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: locations } = trpc.locations.list.useQuery(
    { tenantId: user?.tenantId || 0 },
    { enabled: !!user?.tenantId }
  );

  const { data: companyProfile } = trpc.company.getProfile.useQuery(
    undefined,
    { enabled: !!user?.tenantId }
  );

  const generatePDFReport = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select start and end dates");
      return;
    }

    setIsGenerating(true);

    try {
      // Fetch report data
      const auditData = await trpc.reports.getComplianceData.query({
        tenantId: user?.tenantId || 0,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        locationIds: selectedLocations.length > 0 ? selectedLocations : undefined,
      });

      const actionPlans = await trpc.reports.getActionPlans.query({
        tenantId: user?.tenantId || 0,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        locationIds: selectedLocations.length > 0 ? selectedLocations : undefined,
      });

      // Create PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;

      // Header with company branding
      doc.setFontSize(20);
      doc.setTextColor(31, 41, 55); // gray-800
      doc.text(companyProfile?.companyName || "Care Compliance Report", pageWidth / 2, yPos, {
        align: "center",
      });
      yPos += 10;

      doc.setFontSize(12);
      doc.setTextColor(107, 114, 128); // gray-500
      doc.text(
        `Report Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(
          endDate
        ).toLocaleDateString()}`,
        pageWidth / 2,
        yPos,
        { align: "center" }
      );
      yPos += 15;

      // Executive Summary
      doc.setFontSize(16);
      doc.setTextColor(31, 41, 55);
      doc.text("Executive Summary", 14, yPos);
      yPos += 10;

      const totalAudits = auditData?.length || 0;
      const completedAudits = auditData?.filter((a) => a.instance.status === "completed").length || 0;
      const completionRate = totalAudits > 0 ? ((completedAudits / totalAudits) * 100).toFixed(1) : "0";

      doc.setFontSize(11);
      doc.setTextColor(55, 65, 81);
      doc.text(`Total Audits Conducted: ${totalAudits}`, 14, yPos);
      yPos += 7;
      doc.text(`Completed Audits: ${completedAudits}`, 14, yPos);
      yPos += 7;
      doc.text(`Completion Rate: ${completionRate}%`, 14, yPos);
      yPos += 7;
      doc.text(`Total Action Plans: ${actionPlans?.length || 0}`, 14, yPos);
      yPos += 15;

      // RAG Status Breakdown
      doc.setFontSize(16);
      doc.setTextColor(31, 41, 55);
      doc.text("RAG Status Breakdown", 14, yPos);
      yPos += 10;

      const ragCounts = {
        red: actionPlans?.filter((ap) => ap.actionPlan.ragStatus === "red").length || 0,
        amber: actionPlans?.filter((ap) => ap.actionPlan.ragStatus === "amber").length || 0,
        green: actionPlans?.filter((ap) => ap.actionPlan.ragStatus === "green").length || 0,
      };

      autoTable(doc, {
        startY: yPos,
        head: [["Status", "Count", "Percentage"]],
        body: [
          [
            "Red (Critical)",
            ragCounts.red.toString(),
            `${((ragCounts.red / (actionPlans?.length || 1)) * 100).toFixed(1)}%`,
          ],
          [
            "Amber (Moderate)",
            ragCounts.amber.toString(),
            `${((ragCounts.amber / (actionPlans?.length || 1)) * 100).toFixed(1)}%`,
          ],
          [
            "Green (Low)",
            ragCounts.green.toString(),
            `${((ragCounts.green / (actionPlans?.length || 1)) * 100).toFixed(1)}%`,
          ],
        ],
        theme: "grid",
        headStyles: { fillColor: [31, 41, 55] },
        styles: { fontSize: 10 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Audit Summaries
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(16);
      doc.setTextColor(31, 41, 55);
      doc.text("Audit Summaries", 14, yPos);
      yPos += 10;

      if (auditData && auditData.length > 0) {
        const auditTableData = auditData.map((item) => [
          item.auditType?.name || "Unknown",
          item.location?.name || "N/A",
          new Date(item.instance.auditDate).toLocaleDateString(),
          item.instance.status,
          item.instance.overallScore ? `${item.instance.overallScore}%` : "N/A",
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [["Audit Type", "Location", "Date", "Status", "Score"]],
          body: auditTableData,
          theme: "grid",
          headStyles: { fillColor: [31, 41, 55] },
          styles: { fontSize: 9 },
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;
      } else {
        doc.setFontSize(10);
        doc.setTextColor(107, 114, 128);
        doc.text("No audits found for the selected period.", 14, yPos);
        yPos += 15;
      }

      // Action Plans
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(16);
      doc.setTextColor(31, 41, 55);
      doc.text("Action Plans", 14, yPos);
      yPos += 10;

      if (actionPlans && actionPlans.length > 0) {
        const actionTableData = actionPlans.map((item) => [
          item.actionPlan.issueDescription.substring(0, 50) + "...",
          item.location?.name || "N/A",
          item.actionPlan.ragStatus?.toUpperCase() || "N/A",
          item.actionPlan.status,
          new Date(item.actionPlan.targetCompletionDate).toLocaleDateString(),
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [["Issue", "Location", "RAG", "Status", "Target Date"]],
          body: actionTableData,
          theme: "grid",
          headStyles: { fillColor: [31, 41, 55] },
          styles: { fontSize: 8 },
          columnStyles: {
            0: { cellWidth: 60 },
          },
        });
      } else {
        doc.setFontSize(10);
        doc.setTextColor(107, 114, 128);
        doc.text("No action plans found for the selected period.", 14, yPos);
      }

      // Footer on all pages
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(107, 114, 128);
        doc.text(
          `Generated on ${new Date().toLocaleDateString()} | Page ${i} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
        doc.text(
          companyProfile?.companyName || "Care Compliance System",
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 15,
          { align: "center" }
        );
      }

      // Save PDF
      const filename = `Compliance_Report_${new Date(startDate).toISOString().split("T")[0]}_to_${
        new Date(endDate).toISOString().split("T")[0]
      }.pdf`;
      doc.save(filename);

      toast.success("Report generated successfully");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Compliance Reports</h1>
        <p className="text-muted-foreground mt-1">
          Generate comprehensive compliance reports for CQC submissions
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Report Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="locations">Locations (Optional)</Label>
                <Select
                  value={selectedLocations.length > 0 ? selectedLocations[0].toString() : "all"}
                  onValueChange={(value) => {
                    if (value === "all") {
                      setSelectedLocations([]);
                    } else {
                      setSelectedLocations([parseInt(value)]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All locations" />
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
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-2">Report Contents</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Executive Summary with completion rates
              </li>
              <li className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                RAG Status Breakdown (Red/Amber/Green)
              </li>
              <li className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Detailed Audit Summaries by type and location
              </li>
              <li className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Action Plans with target dates and status
              </li>
              <li className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Company branding and professional formatting
              </li>
            </ul>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              onClick={generatePDFReport}
              disabled={isGenerating || !startDate || !endDate}
              size="lg"
            >
              {isGenerating ? (
                <>Generating...</>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generate PDF Report
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
