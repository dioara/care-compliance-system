import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "@/contexts/LocationContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileSpreadsheet, Download, Users, UserCheck, Loader2, AlertCircle, FileText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WarningCircle } from "@phosphor-icons/react";
import XLSX from "xlsx-js-style";

// Cell styles for conditional formatting
const styles = {
  compliant: {
    fill: { fgColor: { rgb: "C6EFCE" } }, // Light green
    font: { color: { rgb: "006100" }, bold: true },
    alignment: { horizontal: "center", vertical: "center" }
  },
  nonCompliant: {
    fill: { fgColor: { rgb: "FFC7CE" } }, // Light red
    font: { color: { rgb: "9C0006" }, bold: true },
    alignment: { horizontal: "center", vertical: "center" }
  },
  partial: {
    fill: { fgColor: { rgb: "FFEB9C" } }, // Light amber
    font: { color: { rgb: "9C5700" }, bold: true },
    alignment: { horizontal: "center", vertical: "center" }
  },
  notAssessed: {
    fill: { fgColor: { rgb: "E0E0E0" } }, // Light grey
    font: { color: { rgb: "666666" } },
    alignment: { horizontal: "center", vertical: "center" }
  },
  header: {
    fill: { fgColor: { rgb: "4472C4" } }, // Blue header
    font: { color: { rgb: "FFFFFF" }, bold: true },
    alignment: { horizontal: "center", vertical: "center" }
  },
  subHeader: {
    fill: { fgColor: { rgb: "8EA9DB" } }, // Lighter blue
    font: { color: { rgb: "000000" }, bold: true },
    alignment: { horizontal: "center", vertical: "center" }
  },
  percentage: {
    fill: { fgColor: { rgb: "F2F2F2" } },
    font: { bold: true },
    alignment: { horizontal: "center", vertical: "center" },
    numFmt: "0.0%"
  },
  percentageGood: {
    fill: { fgColor: { rgb: "C6EFCE" } },
    font: { color: { rgb: "006100" }, bold: true },
    alignment: { horizontal: "center", vertical: "center" }
  },
  percentageMedium: {
    fill: { fgColor: { rgb: "FFEB9C" } },
    font: { color: { rgb: "9C5700" }, bold: true },
    alignment: { horizontal: "center", vertical: "center" }
  },
  percentageLow: {
    fill: { fgColor: { rgb: "FFC7CE" } },
    font: { color: { rgb: "9C0006" }, bold: true },
    alignment: { horizontal: "center", vertical: "center" }
  },
  label: {
    font: { bold: true },
    alignment: { horizontal: "left", vertical: "center" }
  }
};

// Helper to get percentage style based on value
const getPercentageStyle = (percentage: number) => {
  if (percentage >= 80) return styles.percentageGood;
  if (percentage >= 50) return styles.percentageMedium;
  return styles.percentageLow;
};

// Helper to get cell style based on status
const getStatusStyle = (status: string) => {
  switch (status) {
    case "C": return styles.compliant;
    case "NC": return styles.nonCompliant;
    case "P": return styles.partial;
    default: return styles.notAssessed;
  }
};

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

      // Group questions by section
      const questionsBySection = new Map<number, typeof serviceUserData.questions>();
      serviceUserData.questions.forEach(q => {
        if (!questionsBySection.has(q.sectionId)) {
          questionsBySection.set(q.sectionId, []);
        }
        questionsBySection.get(q.sectionId)!.push(q);
      });

      // Calculate total questions count
      const totalQuestions = serviceUserData.questions.length;
      const fixedCols = 2; // Name, Location

      // Build matrix data with styles
      const matrixData: any[][] = [];
      
      // Header row 1: Name, Location, Section IDs, then "% Compliant"
      const headerRow1 = [
        { v: "Service User", s: styles.header },
        { v: "Location", s: styles.header }
      ];
      
      serviceUserData.sections.forEach(section => {
        const sectionQuestions = questionsBySection.get(section.id) || [];
        sectionQuestions.forEach((_, idx) => {
          if (idx === 0) {
            headerRow1.push({ v: `S${section.sectionNumber}`, s: styles.header });
          } else {
            headerRow1.push({ v: "", s: styles.header });
          }
        });
      });
      headerRow1.push({ v: "% Compliant", s: styles.header });

      // Header row 2: Empty, Empty, Question numbers, then empty
      const headerRow2 = [
        { v: "", s: styles.subHeader },
        { v: "", s: styles.subHeader }
      ];
      
      serviceUserData.sections.forEach(section => {
        const sectionQuestions = questionsBySection.get(section.id) || [];
        sectionQuestions.forEach(q => {
          headerRow2.push({ v: q.questionNumber, s: styles.subHeader });
        });
      });
      headerRow2.push({ v: "", s: styles.subHeader });

      matrixData.push(headerRow1);
      matrixData.push(headerRow2);

      // Data rows with compliance calculations
      serviceUserData.serviceUsers.forEach(su => {
        const row: any[] = [
          { v: su.name, s: styles.label },
          { v: su.locationName, s: { alignment: { horizontal: "left" } } }
        ];
        
        let compliantCount = 0;
        let assessedCount = 0;
        
        serviceUserData.sections.forEach(section => {
          const sectionQuestions = questionsBySection.get(section.id) || [];
          sectionQuestions.forEach(q => {
            const assessment = serviceUserData.assessments.find(
              a => a.serviceUserId === su.id && a.questionId === q.id
            );
            
            let status = "NA";
            if (assessment) {
              const statusMap: Record<string, string> = {
                compliant: "C",
                non_compliant: "NC",
                partial: "P",
                not_assessed: "NA"
              };
              status = statusMap[assessment.complianceStatus] || "NA";
            }
            
            // Count for percentage calculation
            if (status !== "NA") {
              assessedCount++;
              if (status === "C") compliantCount++;
              if (status === "P") compliantCount += 0.5; // Partial counts as 50%
            }
            
            row.push({ v: status, s: getStatusStyle(status) });
          });
        });
        
        // Calculate and add percentage
        const percentage = assessedCount > 0 ? (compliantCount / assessedCount) * 100 : 0;
        row.push({ 
          v: `${percentage.toFixed(1)}%`, 
          s: getPercentageStyle(percentage)
        });
        
        matrixData.push(row);
      });

      // Section compliance summary row
      const sectionSummaryRow: any[] = [
        { v: "Section Compliance %", s: { ...styles.header, alignment: { horizontal: "left" } } },
        { v: "", s: styles.header }
      ];
      
      let overallCompliant = 0;
      let overallAssessed = 0;
      
      serviceUserData.sections.forEach(section => {
        const sectionQuestions = questionsBySection.get(section.id) || [];
        sectionQuestions.forEach(q => {
          let sectionCompliant = 0;
          let sectionAssessed = 0;
          
          serviceUserData.serviceUsers.forEach(su => {
            const assessment = serviceUserData.assessments.find(
              a => a.serviceUserId === su.id && a.questionId === q.id
            );
            
            if (assessment && assessment.complianceStatus !== "not_assessed") {
              sectionAssessed++;
              overallAssessed++;
              if (assessment.complianceStatus === "compliant") {
                sectionCompliant++;
                overallCompliant++;
              }
              if (assessment.complianceStatus === "partial") {
                sectionCompliant += 0.5;
                overallCompliant += 0.5;
              }
            }
          });
          
          const percentage = sectionAssessed > 0 ? (sectionCompliant / sectionAssessed) * 100 : 0;
          sectionSummaryRow.push({ 
            v: `${percentage.toFixed(0)}%`, 
            s: getPercentageStyle(percentage)
          });
        });
      });
      
      // Overall percentage
      const overallPercentage = overallAssessed > 0 ? (overallCompliant / overallAssessed) * 100 : 0;
      sectionSummaryRow.push({ 
        v: `${overallPercentage.toFixed(1)}%`, 
        s: { ...getPercentageStyle(overallPercentage), font: { ...getPercentageStyle(overallPercentage).font, sz: 12 } }
      });
      
      matrixData.push(sectionSummaryRow);

      const matrixSheet = XLSX.utils.aoa_to_sheet(matrixData);
      
      // Set column widths
      matrixSheet["!cols"] = [
        { wch: 25 }, // Service User name
        { wch: 20 }, // Location
        ...Array(totalQuestions).fill({ wch: 6 }),
        { wch: 12 } // Percentage column
      ];

      // Merge cells for section headers
      const merges: XLSX.Range[] = [];
      let colIndex = fixedCols;
      serviceUserData.sections.forEach(section => {
        const sectionQuestions = questionsBySection.get(section.id) || [];
        if (sectionQuestions.length > 1) {
          merges.push({
            s: { r: 0, c: colIndex },
            e: { r: 0, c: colIndex + sectionQuestions.length - 1 }
          });
        }
        colIndex += sectionQuestions.length;
      });
      matrixSheet["!merges"] = merges;

      XLSX.utils.book_append_sheet(workbook, matrixSheet, "Compliance Matrix");

      // Sheet 2: Question Reference
      const referenceData: any[][] = [
        [
          { v: "Section", s: styles.header },
          { v: "Section Name", s: styles.header },
          { v: "Question No.", s: styles.header },
          { v: "Question Text", s: styles.header },
          { v: "Evidence Required", s: styles.header }
        ]
      ];

      serviceUserData.sections.forEach(section => {
        const sectionQuestions = questionsBySection.get(section.id) || [];
        sectionQuestions.forEach(q => {
          referenceData.push([
            { v: `S${section.sectionNumber}`, s: { alignment: { horizontal: "center" } } },
            { v: section.sectionName },
            { v: q.questionNumber, s: { alignment: { horizontal: "center" } } },
            { v: q.questionText },
            { v: q.evidenceRequirement || "" }
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
      const summaryData: any[][] = [
        [{ v: "Service User Compliance Summary Report", s: { font: { bold: true, sz: 14 } } }],
        [{ v: "Generated:", s: styles.label }, { v: new Date().toLocaleDateString("en-GB") }],
        [{ v: "Location:", s: styles.label }, { v: selectedLocationId ? accessibleLocations.find(l => l.id === selectedLocationId)?.name || "All Locations" : "All Locations" }],
        [{ v: "" }],
        [{ v: "Total Service Users:", s: styles.label }, { v: serviceUserData.serviceUsers.length }],
        [{ v: "Total Sections:", s: styles.label }, { v: serviceUserData.sections.length }],
        [{ v: "Total Questions:", s: styles.label }, { v: serviceUserData.questions.length }],
        [{ v: "Overall Compliance:", s: styles.label }, { v: `${overallPercentage.toFixed(1)}%`, s: getPercentageStyle(overallPercentage) }],
        [{ v: "" }],
        [{ v: "Status Legend:", s: { font: { bold: true } } }],
        [{ v: "C", s: styles.compliant }, { v: "Compliant" }],
        [{ v: "NC", s: styles.nonCompliant }, { v: "Non-Compliant" }],
        [{ v: "P", s: styles.partial }, { v: "Partial" }],
        [{ v: "NA", s: styles.notAssessed }, { v: "Not Assessed" }],
        [{ v: "" }],
        [{ v: "Colour Coding:", s: { font: { bold: true } } }],
        [{ v: "≥80%", s: styles.percentageGood }, { v: "Good compliance" }],
        [{ v: "50-79%", s: styles.percentageMedium }, { v: "Needs improvement" }],
        [{ v: "<50%", s: styles.percentageLow }, { v: "Critical attention required" }]
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

      // Group questions by section
      const questionsBySection = new Map<number, typeof staffData.questions>();
      staffData.questions.forEach(q => {
        if (!questionsBySection.has(q.sectionId)) {
          questionsBySection.set(q.sectionId, []);
        }
        questionsBySection.get(q.sectionId)!.push(q);
      });

      const totalQuestions = staffData.questions.length;
      const fixedCols = 3; // Name, Role, Location

      // Build matrix data
      const matrixData: any[][] = [];
      
      // Header row 1
      const headerRow1 = [
        { v: "Staff Member", s: styles.header },
        { v: "Role", s: styles.header },
        { v: "Location", s: styles.header }
      ];
      
      staffData.sections.forEach(section => {
        const sectionQuestions = questionsBySection.get(section.id) || [];
        sectionQuestions.forEach((_, idx) => {
          if (idx === 0) {
            headerRow1.push({ v: `S${section.sectionNumber}`, s: styles.header });
          } else {
            headerRow1.push({ v: "", s: styles.header });
          }
        });
      });
      headerRow1.push({ v: "% Compliant", s: styles.header });

      // Header row 2
      const headerRow2 = [
        { v: "", s: styles.subHeader },
        { v: "", s: styles.subHeader },
        { v: "", s: styles.subHeader }
      ];
      
      staffData.sections.forEach(section => {
        const sectionQuestions = questionsBySection.get(section.id) || [];
        sectionQuestions.forEach(q => {
          headerRow2.push({ v: q.questionNumber, s: styles.subHeader });
        });
      });
      headerRow2.push({ v: "", s: styles.subHeader });

      matrixData.push(headerRow1);
      matrixData.push(headerRow2);

      // Data rows
      staffData.staffMembers.forEach(staff => {
        const row: any[] = [
          { v: staff.name, s: styles.label },
          { v: staff.role || "", s: { alignment: { horizontal: "left" } } },
          { v: staff.locationName, s: { alignment: { horizontal: "left" } } }
        ];
        
        let compliantCount = 0;
        let assessedCount = 0;
        
        staffData.sections.forEach(section => {
          const sectionQuestions = questionsBySection.get(section.id) || [];
          sectionQuestions.forEach(q => {
            const assessment = staffData.assessments.find(
              a => a.staffMemberId === staff.id && a.questionId === q.id
            );
            
            let status = "NA";
            if (assessment) {
              const statusMap: Record<string, string> = {
                compliant: "C",
                non_compliant: "NC",
                partial: "P",
                not_assessed: "NA"
              };
              status = statusMap[assessment.complianceStatus] || "NA";
            }
            
            if (status !== "NA") {
              assessedCount++;
              if (status === "C") compliantCount++;
              if (status === "P") compliantCount += 0.5;
            }
            
            row.push({ v: status, s: getStatusStyle(status) });
          });
        });
        
        const percentage = assessedCount > 0 ? (compliantCount / assessedCount) * 100 : 0;
        row.push({ 
          v: `${percentage.toFixed(1)}%`, 
          s: getPercentageStyle(percentage)
        });
        
        matrixData.push(row);
      });

      // Section compliance summary row
      const sectionSummaryRow: any[] = [
        { v: "Section Compliance %", s: { ...styles.header, alignment: { horizontal: "left" } } },
        { v: "", s: styles.header },
        { v: "", s: styles.header }
      ];
      
      let overallCompliant = 0;
      let overallAssessed = 0;
      
      staffData.sections.forEach(section => {
        const sectionQuestions = questionsBySection.get(section.id) || [];
        sectionQuestions.forEach(q => {
          let sectionCompliant = 0;
          let sectionAssessed = 0;
          
          staffData.staffMembers.forEach(staff => {
            const assessment = staffData.assessments.find(
              a => a.staffMemberId === staff.id && a.questionId === q.id
            );
            
            if (assessment && assessment.complianceStatus !== "not_assessed") {
              sectionAssessed++;
              overallAssessed++;
              if (assessment.complianceStatus === "compliant") {
                sectionCompliant++;
                overallCompliant++;
              }
              if (assessment.complianceStatus === "partial") {
                sectionCompliant += 0.5;
                overallCompliant += 0.5;
              }
            }
          });
          
          const percentage = sectionAssessed > 0 ? (sectionCompliant / sectionAssessed) * 100 : 0;
          sectionSummaryRow.push({ 
            v: `${percentage.toFixed(0)}%`, 
            s: getPercentageStyle(percentage)
          });
        });
      });
      
      const overallPercentage = overallAssessed > 0 ? (overallCompliant / overallAssessed) * 100 : 0;
      sectionSummaryRow.push({ 
        v: `${overallPercentage.toFixed(1)}%`, 
        s: { ...getPercentageStyle(overallPercentage), font: { ...getPercentageStyle(overallPercentage).font, sz: 12 } }
      });
      
      matrixData.push(sectionSummaryRow);

      const matrixSheet = XLSX.utils.aoa_to_sheet(matrixData);
      matrixSheet["!cols"] = [
        { wch: 25 },
        { wch: 20 },
        { wch: 20 },
        ...Array(totalQuestions).fill({ wch: 6 }),
        { wch: 12 }
      ];

      // Merge cells for section headers
      const merges: XLSX.Range[] = [];
      let colIndex = fixedCols;
      staffData.sections.forEach(section => {
        const sectionQuestions = questionsBySection.get(section.id) || [];
        if (sectionQuestions.length > 1) {
          merges.push({
            s: { r: 0, c: colIndex },
            e: { r: 0, c: colIndex + sectionQuestions.length - 1 }
          });
        }
        colIndex += sectionQuestions.length;
      });
      matrixSheet["!merges"] = merges;

      XLSX.utils.book_append_sheet(workbook, matrixSheet, "Compliance Matrix");

      // Sheet 2: Question Reference
      const referenceData: any[][] = [
        [
          { v: "Section", s: styles.header },
          { v: "Section Name", s: styles.header },
          { v: "Question No.", s: styles.header },
          { v: "Question Text", s: styles.header },
          { v: "Evidence Required", s: styles.header }
        ]
      ];

      staffData.sections.forEach(section => {
        const sectionQuestions = questionsBySection.get(section.id) || [];
        sectionQuestions.forEach(q => {
          referenceData.push([
            { v: `S${section.sectionNumber}`, s: { alignment: { horizontal: "center" } } },
            { v: section.sectionName },
            { v: q.questionNumber, s: { alignment: { horizontal: "center" } } },
            { v: q.questionText },
            { v: q.evidenceRequirement || "" }
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
      const summaryData: any[][] = [
        [{ v: "Staff Compliance Summary Report", s: { font: { bold: true, sz: 14 } } }],
        [{ v: "Generated:", s: styles.label }, { v: new Date().toLocaleDateString("en-GB") }],
        [{ v: "Location:", s: styles.label }, { v: selectedLocationId ? accessibleLocations.find(l => l.id === selectedLocationId)?.name || "All Locations" : "All Locations" }],
        [{ v: "" }],
        [{ v: "Total Staff Members:", s: styles.label }, { v: staffData.staffMembers.length }],
        [{ v: "Total Sections:", s: styles.label }, { v: staffData.sections.length }],
        [{ v: "Total Questions:", s: styles.label }, { v: staffData.questions.length }],
        [{ v: "Overall Compliance:", s: styles.label }, { v: `${overallPercentage.toFixed(1)}%`, s: getPercentageStyle(overallPercentage) }],
        [{ v: "" }],
        [{ v: "Status Legend:", s: { font: { bold: true } } }],
        [{ v: "C", s: styles.compliant }, { v: "Compliant" }],
        [{ v: "NC", s: styles.nonCompliant }, { v: "Non-Compliant" }],
        [{ v: "P", s: styles.partial }, { v: "Partial" }],
        [{ v: "NA", s: styles.notAssessed }, { v: "Not Assessed" }],
        [{ v: "" }],
        [{ v: "Colour Coding:", s: { font: { bold: true } } }],
        [{ v: "≥80%", s: styles.percentageGood }, { v: "Good compliance" }],
        [{ v: "50-79%", s: styles.percentageMedium }, { v: "Needs improvement" }],
        [{ v: "<50%", s: styles.percentageLow }, { v: "Critical attention required" }]
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
            Download compliance assessment reports in Excel format with colour coding
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
                  <li>Colour-coded compliance matrix (green/amber/red)</li>
                  <li>Compliance % per person and per section</li>
                  <li>Question reference sheet with full text</li>
                  <li>Summary with overall compliance statistics</li>
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
                  <li>Colour-coded compliance matrix (green/amber/red)</li>
                  <li>Compliance % per person and per section</li>
                  <li>Question reference sheet with full text</li>
                  <li>Summary with overall compliance statistics</li>
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
                Cells are colour-coded: green (compliant), amber (partial), red (non-compliant).
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Percentage Calculations</h4>
              <p className="text-sm text-muted-foreground">
                Each row shows the person's overall compliance %. 
                Bottom row shows compliance % per question across all people.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Colour Coding</h4>
              <div className="text-sm space-y-1">
                <p><span className="inline-block w-4 h-4 bg-green-200 rounded mr-2 align-middle"></span>≥80% - Good compliance</p>
                <p><span className="inline-block w-4 h-4 bg-amber-200 rounded mr-2 align-middle"></span>50-79% - Needs improvement</p>
                <p><span className="inline-block w-4 h-4 bg-red-200 rounded mr-2 align-middle"></span>&lt;50% - Critical attention</p>
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
