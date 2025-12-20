import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "@/contexts/LocationContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileSpreadsheet, Download, Users, UserCheck, Loader2, AlertCircle, FileText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WarningCircle } from "@phosphor-icons/react";
import * as XLSX from "xlsx";

export default function Reports() {
  const { activeLocationId, permissions, isLoading: locationLoading } = useLocation();
  const [selectedLocationId, setSelectedLocationId] = useState<number | undefined>(undefined);

  // Get locations list from permissions
  const { data: locationsData } = trpc.locations.list.useQuery();
  const accessibleLocations = locationsData?.filter(loc => 
    permissions.some(p => p.locationId === loc.id)
  ) || [];

  // Set initial location when data loads
  useEffect(() => {
    if (activeLocationId && !selectedLocationId) {
      setSelectedLocationId(activeLocationId);
    }
  }, [activeLocationId, selectedLocationId]);
  const [isGeneratingServiceUser, setIsGeneratingServiceUser] = useState(false);
  const [isGeneratingStaff, setIsGeneratingStaff] = useState(false);

  // Fetch report data
  const { data: serviceUserData, isLoading: loadingServiceUser, error: serviceUserError } = trpc.reports.serviceUserCompliance.useQuery(
    { locationId: selectedLocationId },
    { enabled: true }
  );

  const { data: staffData, isLoading: loadingStaff, error: staffError } = trpc.reports.staffCompliance.useQuery(
    { locationId: selectedLocationId },
    { enabled: true }
  );

  // Generate Service User Compliance Excel
  const generateServiceUserExcel = () => {
    if (!serviceUserData) return;
    setIsGeneratingServiceUser(true);

    try {
      const workbook = XLSX.utils.book_new();

      // Sheet 1: Compliance Matrix
      const matrixData: any[][] = [];
      
      // Header row: Name, Location, then question numbers grouped by section
      const headerRow1 = ["Service User", "Location"];
      const headerRow2 = ["", ""];
      
      // Group questions by section for headers
      const questionsBySection = new Map<number, typeof serviceUserData.questions>();
      serviceUserData.questions.forEach(q => {
        if (!questionsBySection.has(q.sectionId)) {
          questionsBySection.set(q.sectionId, []);
        }
        questionsBySection.get(q.sectionId)!.push(q);
      });

      // Build headers with section grouping
      serviceUserData.sections.forEach(section => {
        const sectionQuestions = questionsBySection.get(section.id) || [];
        sectionQuestions.forEach(q => {
          headerRow1.push(`S${section.sectionNumber}`);
          headerRow2.push(q.questionNumber);
        });
      });

      matrixData.push(headerRow1);
      matrixData.push(headerRow2);

      // Data rows: one per service user
      serviceUserData.serviceUsers.forEach(su => {
        const row = [su.name, su.locationName];
        
        serviceUserData.sections.forEach(section => {
          const sectionQuestions = questionsBySection.get(section.id) || [];
          sectionQuestions.forEach(q => {
            const assessment = serviceUserData.assessments.find(
              a => a.serviceUserId === su.id && a.questionId === q.id
            );
            if (assessment) {
              // Use status abbreviations: C=Compliant, NC=Non-Compliant, P=Partial, NA=Not Assessed
              const statusMap: Record<string, string> = {
                compliant: "C",
                non_compliant: "NC",
                partial: "P",
                not_assessed: "NA"
              };
              row.push(statusMap[assessment.complianceStatus] || "NA");
            } else {
              row.push("NA");
            }
          });
        });
        
        matrixData.push(row);
      });

      const matrixSheet = XLSX.utils.aoa_to_sheet(matrixData);
      
      // Set column widths
      matrixSheet["!cols"] = [
        { wch: 25 }, // Service User name
        { wch: 20 }, // Location
        ...Array(serviceUserData.questions.length).fill({ wch: 6 })
      ];

      XLSX.utils.book_append_sheet(workbook, matrixSheet, "Compliance Matrix");

      // Sheet 2: Question Reference
      const referenceData = [
        ["Section", "Section Name", "Question No.", "Question Text", "Evidence Required"]
      ];

      serviceUserData.sections.forEach(section => {
        const sectionQuestions = questionsBySection.get(section.id) || [];
        sectionQuestions.forEach(q => {
          referenceData.push([
            `S${section.sectionNumber}`,
            section.sectionName,
            q.questionNumber,
            q.questionText,
            q.evidenceRequirement || ""
          ]);
        });
      });

      const referenceSheet = XLSX.utils.aoa_to_sheet(referenceData);
      referenceSheet["!cols"] = [
        { wch: 10 },
        { wch: 30 },
        { wch: 12 },
        { wch: 80 },
        { wch: 50 }
      ];

      XLSX.utils.book_append_sheet(workbook, referenceSheet, "Question Reference");

      // Sheet 3: Summary Statistics
      const summaryData = [
        ["Service User Compliance Summary Report"],
        ["Generated:", new Date().toLocaleDateString("en-GB")],
        ["Location:", selectedLocationId ? accessibleLocations.find(l => l.id === selectedLocationId)?.name || "All Locations" : "All Locations"],
        [""],
        ["Total Service Users:", serviceUserData.serviceUsers.length],
        ["Total Sections:", serviceUserData.sections.length],
        ["Total Questions:", serviceUserData.questions.length],
        [""],
        ["Status Legend:"],
        ["C", "Compliant"],
        ["NC", "Non-Compliant"],
        ["P", "Partial"],
        ["NA", "Not Assessed"]
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet["!cols"] = [{ wch: 25 }, { wch: 40 }];

      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

      // Download
      const fileName = `Service_User_Compliance_Report_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error("Error generating Excel:", error);
    } finally {
      setIsGeneratingServiceUser(false);
    }
  };

  // Generate Staff Compliance Excel
  const generateStaffExcel = () => {
    if (!staffData) return;
    setIsGeneratingStaff(true);

    try {
      const workbook = XLSX.utils.book_new();

      // Sheet 1: Compliance Matrix
      const matrixData: any[][] = [];
      
      // Header rows
      const headerRow1 = ["Staff Member", "Role", "Location"];
      const headerRow2 = ["", "", ""];
      
      // Group questions by section
      const questionsBySection = new Map<number, typeof staffData.questions>();
      staffData.questions.forEach(q => {
        if (!questionsBySection.has(q.sectionId)) {
          questionsBySection.set(q.sectionId, []);
        }
        questionsBySection.get(q.sectionId)!.push(q);
      });

      // Build headers
      staffData.sections.forEach(section => {
        const sectionQuestions = questionsBySection.get(section.id) || [];
        sectionQuestions.forEach(q => {
          headerRow1.push(`S${section.sectionNumber}`);
          headerRow2.push(q.questionNumber);
        });
      });

      matrixData.push(headerRow1);
      matrixData.push(headerRow2);

      // Data rows
      staffData.staffMembers.forEach(staff => {
        const row = [staff.name, staff.role || "", staff.locationName];
        
        staffData.sections.forEach(section => {
          const sectionQuestions = questionsBySection.get(section.id) || [];
          sectionQuestions.forEach(q => {
            const assessment = staffData.assessments.find(
              a => a.staffMemberId === staff.id && a.questionId === q.id
            );
            if (assessment) {
              const statusMap: Record<string, string> = {
                compliant: "C",
                non_compliant: "NC",
                partial: "P",
                not_assessed: "NA"
              };
              row.push(statusMap[assessment.complianceStatus] || "NA");
            } else {
              row.push("NA");
            }
          });
        });
        
        matrixData.push(row);
      });

      const matrixSheet = XLSX.utils.aoa_to_sheet(matrixData);
      matrixSheet["!cols"] = [
        { wch: 25 },
        { wch: 20 },
        { wch: 20 },
        ...Array(staffData.questions.length).fill({ wch: 6 })
      ];

      XLSX.utils.book_append_sheet(workbook, matrixSheet, "Compliance Matrix");

      // Sheet 2: Question Reference
      const referenceData = [
        ["Section", "Section Name", "Question No.", "Question Text", "Evidence Required"]
      ];

      staffData.sections.forEach(section => {
        const sectionQuestions = questionsBySection.get(section.id) || [];
        sectionQuestions.forEach(q => {
          referenceData.push([
            `S${section.sectionNumber}`,
            section.sectionName,
            q.questionNumber,
            q.questionText,
            q.evidenceRequirement || ""
          ]);
        });
      });

      const referenceSheet = XLSX.utils.aoa_to_sheet(referenceData);
      referenceSheet["!cols"] = [
        { wch: 10 },
        { wch: 30 },
        { wch: 12 },
        { wch: 80 },
        { wch: 50 }
      ];

      XLSX.utils.book_append_sheet(workbook, referenceSheet, "Question Reference");

      // Sheet 3: Summary
      const summaryData = [
        ["Staff Compliance Summary Report"],
        ["Generated:", new Date().toLocaleDateString("en-GB")],
        ["Location:", selectedLocationId ? accessibleLocations.find(l => l.id === selectedLocationId)?.name || "All Locations" : "All Locations"],
        [""],
        ["Total Staff Members:", staffData.staffMembers.length],
        ["Total Sections:", staffData.sections.length],
        ["Total Questions:", staffData.questions.length],
        [""],
        ["Status Legend:"],
        ["C", "Compliant"],
        ["NC", "Non-Compliant"],
        ["P", "Partial"],
        ["NA", "Not Assessed"]
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet["!cols"] = [{ wch: 25 }, { wch: 40 }];

      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

      // Download
      const fileName = `Staff_Compliance_Report_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error("Error generating Excel:", error);
    } finally {
      setIsGeneratingStaff(false);
    }
  };

  const isLoading = loadingServiceUser || loadingStaff;
  const hasError = serviceUserError || staffError;

  // Other report types (placeholders for future)
  const otherReportTypes = [
    { name: "Compliance Summary Report", description: "Overall compliance status with RAG ratings" },
    { name: "Intervention Plan Report", description: "Full intervention plan with company branding" },
    { name: "Audit Results Report", description: "Detailed audit findings and recommendations" },
    { name: "Incident Report", description: "Incident log with categorisation and actions" },
    { name: "Risk Notification Log", description: "All risks reported to local authority" },
    { name: "CQC Notification Log", description: "All notifications sent to CQC" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Compliance Reports</h1>
          <p className="text-muted-foreground">
            Download compliance assessment reports in Excel format
          </p>
        </div>

        <div className="w-full sm:w-64">
          <Select
            value={selectedLocationId?.toString() || "all"}
            onValueChange={(value) => setSelectedLocationId(value === "all" ? undefined : parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {accessibleLocations.map((location) => (
                <SelectItem key={location.id} value={location.id.toString()}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {hasError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load report data. Please try again later.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Service User Compliance Report */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>Service User Compliance Report</CardTitle>
                <CardDescription>
                  Compliance status for all service users across {serviceUserData?.sections.length || 0} sections
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-muted-foreground">Service Users</p>
                  <p className="text-2xl font-bold">{serviceUserData?.serviceUsers.length || 0}</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-muted-foreground">Questions</p>
                  <p className="text-2xl font-bold">{serviceUserData?.questions.length || 0}</p>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>The Excel report includes:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Compliance matrix with all service users and questions</li>
                  <li>Question reference sheet with full question text</li>
                  <li>Summary statistics</li>
                </ul>
              </div>

              <Button
                onClick={generateServiceUserExcel}
                disabled={isLoading || isGeneratingServiceUser || !serviceUserData}
                className="w-full"
              >
                {isGeneratingServiceUser ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download Excel Report
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Staff Compliance Report */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle>Staff Compliance Report</CardTitle>
                <CardDescription>
                  Compliance status for all staff members across {staffData?.sections.length || 0} sections
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-muted-foreground">Staff Members</p>
                  <p className="text-2xl font-bold">{staffData?.staffMembers.length || 0}</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-muted-foreground">Questions</p>
                  <p className="text-2xl font-bold">{staffData?.questions.length || 0}</p>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>The Excel report includes:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Compliance matrix with all staff and questions</li>
                  <li>Question reference sheet with full question text</li>
                  <li>Summary statistics</li>
                </ul>
              </div>

              <Button
                onClick={generateStaffExcel}
                disabled={isLoading || isGeneratingStaff || !staffData}
                className="w-full"
              >
                {isGeneratingStaff ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download Excel Report
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Format Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Report Format</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <h4 className="font-medium mb-2">Compliance Matrix Sheet</h4>
              <p className="text-sm text-muted-foreground">
                Shows each person as a row with columns for each compliance question. 
                Section numbers (S1, S2, etc.) group the questions, with question numbers below.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Question Reference Sheet</h4>
              <p className="text-sm text-muted-foreground">
                Full text of each compliance question organised by section, 
                including evidence requirements for easy reference.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Status Codes</h4>
              <div className="text-sm space-y-1">
                <p><span className="font-mono bg-green-100 text-green-800 px-1 rounded">C</span> - Compliant</p>
                <p><span className="font-mono bg-red-100 text-red-800 px-1 rounded">NC</span> - Non-Compliant</p>
                <p><span className="font-mono bg-amber-100 text-amber-800 px-1 rounded">P</span> - Partial</p>
                <p><span className="font-mono bg-gray-100 text-gray-800 px-1 rounded">NA</span> - Not Assessed</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Other Reports (Coming Soon) */}
      <Card>
        <CardHeader>
          <CardTitle>Other Reports</CardTitle>
          <CardDescription>
            Additional reports with company branding (coming soon)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {otherReportTypes.map((report, index) => (
              <div key={index} className="flex items-start justify-between p-4 rounded-lg border">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{report.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" disabled>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <WarningCircle className="inline h-4 w-4 mr-2" />
              Additional report types with PDF, Word, and branded exports coming soon.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
