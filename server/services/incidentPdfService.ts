/**
 * PDF Generation Service for Incident Reports
 * Generates professional PDF reports with company branding
 */

import PDFDocument from "pdfkit";

interface IncidentItem {
  id: number;
  incidentNumber: string | null;
  incidentType: string;
  description: string | null;
  incidentDate: Date | string;
  incidentTime: string | null;
  severity: string | null;
  status: string | null;
  locationDescription?: string | null;
  affectedPersonType?: string | null;
  affectedPersonName?: string | null;
  immediateActions?: string | null;
  reportedToCqc?: boolean | null;
  reportedToCouncil?: boolean | null;
  reportedToPolice?: boolean | null;
  reportedToFamily?: boolean | null;
}

interface IncidentReportData {
  incidents: IncidentItem[];
  companyName: string;
  companyLogo?: string;
  locationName?: string;
  generatedBy: string;
  dateRange?: { from: Date; to: Date };
}

const COLORS = {
  primary: "#1e40af",
  secondary: "#3b82f6",
  success: "#16a34a",
  warning: "#d97706",
  danger: "#dc2626",
  text: "#1f2937",
  textLight: "#6b7280",
  border: "#e5e7eb",
  headerBg: "#7c3aed",
  rowAlt: "#f9fafb",
};

/**
 * Generate a PDF report for incidents
 */
export async function generateIncidentPDF(data: IncidentReportData): Promise<Buffer> {
  // Pre-fetch logo if provided
  let logoBuffer: Buffer | null = null;
  if (data.companyLogo) {
    try {
      const response = await fetch(data.companyLogo);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        logoBuffer = Buffer.from(arrayBuffer);
      }
    } catch (e) {
      console.error("Failed to fetch company logo:", e);
    }
  }

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margin: 40,
        info: {
          Title: `Incident Report - ${data.companyName}`,
          Author: data.companyName,
          Subject: "Incident Report",
          Creator: "Care Compliance Management System",
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const pageWidth = 841.89;
      const pageHeight = 595.28;
      const margin = 40;
      const contentWidth = pageWidth - (margin * 2);

      // Header
      doc.rect(0, 0, pageWidth, 80).fill(COLORS.headerBg);

      let textStartX = margin;
      if (logoBuffer) {
        try {
          doc.image(logoBuffer, margin, 15, { height: 50 });
          textStartX = margin + 70;
        } catch (e) {
          console.error("Failed to render logo:", e);
        }
      }

      doc.fontSize(24).font("Helvetica-Bold").fillColor("#ffffff");
      doc.text(data.companyName, textStartX, 20, { width: contentWidth - 200 });

      doc.fontSize(12).font("Helvetica").fillColor("#c4b5fd");
      doc.text("Incident Report", textStartX, 50);

      const dateStr = new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      doc.fontSize(10).fillColor("#ffffff");
      doc.text(`Generated: ${dateStr}`, pageWidth - margin - 200, 25, { width: 200, align: "right" });
      if (data.locationName) {
        doc.text(`Location: ${data.locationName}`, pageWidth - margin - 200, 40, { width: 200, align: "right" });
      }
      doc.text(`By: ${data.generatedBy}`, pageWidth - margin - 200, 55, { width: 200, align: "right" });

      doc.y = 95;

      // Summary Statistics
      const total = data.incidents.length;
      const critical = data.incidents.filter(i => i.severity === "critical").length;
      const high = data.incidents.filter(i => i.severity === "high").length;
      const open = data.incidents.filter(i => i.status === "open" || i.status === "under_investigation").length;
      const resolved = data.incidents.filter(i => i.status === "resolved" || i.status === "closed").length;

      const boxWidth = (contentWidth - 40) / 5;
      const boxHeight = 50;
      const startY = doc.y;

      // Stat boxes
      drawStatBox(doc, margin, startY, boxWidth, boxHeight, "Total Incidents", total.toString(), COLORS.primary);
      drawStatBox(doc, margin + boxWidth + 10, startY, boxWidth, boxHeight, "Critical", critical.toString(), COLORS.danger);
      drawStatBox(doc, margin + (boxWidth + 10) * 2, startY, boxWidth, boxHeight, "High Severity", high.toString(), COLORS.warning);
      drawStatBox(doc, margin + (boxWidth + 10) * 3, startY, boxWidth, boxHeight, "Open", open.toString(), "#7c3aed");
      drawStatBox(doc, margin + (boxWidth + 10) * 4, startY, boxWidth, boxHeight, "Resolved", resolved.toString(), COLORS.success);

      doc.y = startY + boxHeight + 20;

      // Table
      const columns = [
        { header: "Reference", width: 70, key: "incidentNumber" },
        { header: "Date", width: 70, key: "incidentDate" },
        { header: "Type", width: 90, key: "incidentType" },
        { header: "Location", width: 100, key: "locationDescription" },
        { header: "Severity", width: 60, key: "severity" },
        { header: "Status", width: 80, key: "status" },
        { header: "Affected Person", width: 100, key: "affectedPersonName" },
        { header: "Description", width: 200, key: "description" },
      ];

      const tableTop = doc.y;
      const rowHeight = 25;
      const headerHeight = 30;

      // Table header
      let x = margin;
      doc.rect(margin, tableTop, contentWidth, headerHeight).fill(COLORS.primary);
      columns.forEach(col => {
        doc.fontSize(8).font("Helvetica-Bold").fillColor("#ffffff");
        doc.text(col.header, x + 4, tableTop + 10, { width: col.width - 8, align: "left" });
        x += col.width;
      });

      // Table rows
      let y = tableTop + headerHeight;
      let rowIndex = 0;

      data.incidents.forEach((incident) => {
        if (y + rowHeight > pageHeight - 60) {
          doc.addPage();
          y = 40;
          x = margin;
          doc.rect(margin, y, contentWidth, headerHeight).fill(COLORS.primary);
          columns.forEach(col => {
            doc.fontSize(8).font("Helvetica-Bold").fillColor("#ffffff");
            doc.text(col.header, x + 4, y + 10, { width: col.width - 8, align: "left" });
            x += col.width;
          });
          y += headerHeight;
          rowIndex = 0;
        }

        if (rowIndex % 2 === 1) {
          doc.rect(margin, y, contentWidth, rowHeight).fill(COLORS.rowAlt);
        }
        doc.rect(margin, y, contentWidth, rowHeight).stroke(COLORS.border);

        x = margin;
        columns.forEach(col => {
          let value = "";
          let textColor = COLORS.text;

          switch (col.key) {
            case "incidentNumber":
              value = incident.incidentNumber || `INC-${incident.id}`;
              doc.font("Helvetica-Bold");
              break;
            case "incidentDate":
              value = incident.incidentDate ? new Date(incident.incidentDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "";
              doc.font("Helvetica");
              break;
            case "incidentType":
              value = (incident.incidentType || "").replace(/_/g, " ");
              value = value.charAt(0).toUpperCase() + value.slice(1);
              doc.font("Helvetica");
              break;
            case "locationDescription":
              value = incident.locationDescription || "";
              if (value.length > 20) value = value.substring(0, 17) + "...";
              doc.font("Helvetica");
              break;
            case "severity":
              const severityMap: Record<string, string> = { critical: "Critical", high: "High", medium: "Medium", low: "Low" };
              value = severityMap[incident.severity || ""] || incident.severity || "";
              textColor = incident.severity === "critical" ? COLORS.danger : incident.severity === "high" ? COLORS.warning : COLORS.text;
              doc.font("Helvetica-Bold");
              break;
            case "status":
              const statusMap: Record<string, string> = { open: "Open", under_investigation: "Investigating", resolved: "Resolved", closed: "Closed" };
              value = statusMap[incident.status || ""] || incident.status || "";
              textColor = incident.status === "resolved" || incident.status === "closed" ? COLORS.success : "#7c3aed";
              doc.font("Helvetica-Bold");
              break;
            case "affectedPersonName":
              value = incident.affectedPersonName || "";
              doc.font("Helvetica");
              break;
            case "description":
              // Strip HTML tags from rich text
              value = (incident.description || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
              if (value.length > 50) value = value.substring(0, 47) + "...";
              doc.font("Helvetica");
              break;
            default:
              value = "";
          }

          doc.fontSize(7).fillColor(textColor);
          doc.text(value, x + 4, y + 8, { width: col.width - 8, align: "left" });
          x += col.width;
        });

        y += rowHeight;
        rowIndex++;
      });

      // Footer on each page
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        const footerY = pageHeight - 30;
        doc.moveTo(margin, footerY - 5).lineTo(pageWidth - margin, footerY - 5).stroke(COLORS.border);
        doc.fontSize(7).font("Helvetica").fillColor(COLORS.textLight);
        doc.text(`${data.companyName} - Incident Report`, margin, footerY, { width: 300 });
        doc.text("Confidential - For Internal Use Only", pageWidth / 2 - 75, footerY, { width: 150, align: "center" });
        doc.text(`Page ${i + 1} of ${pageCount}`, pageWidth - margin - 100, footerY, { width: 100, align: "right" });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function drawStatBox(doc: PDFKit.PDFDocument, x: number, y: number, width: number, height: number, label: string, value: string, color: string) {
  doc.rect(x, y, width, height).fillAndStroke("#ffffff", COLORS.border);
  doc.rect(x, y, width, 4).fill(color);
  doc.fontSize(20).font("Helvetica-Bold").fillColor(color);
  doc.text(value, x, y + 12, { width: width, align: "center" });
  doc.fontSize(8).font("Helvetica").fillColor(COLORS.textLight);
  doc.text(label, x, y + 35, { width: width, align: "center" });
}
