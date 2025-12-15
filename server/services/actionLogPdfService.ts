/**
 * PDF Generation Service for Action Log Reports
 * Generates beautiful landscape PDF reports with company branding
 */

import PDFDocument from "pdfkit";

interface ActionItem {
  id: number;
  issueNumber?: string;
  issueDescription: string;
  auditOrigin?: string;
  locationName?: string;
  ragStatus: string;
  responsiblePersonName?: string;
  targetCompletionDate: Date | string;
  status: string;
  actionTaken?: string;
  actualCompletionDate?: Date | string;
}

interface ActionLogReportData {
  actions: ActionItem[];
  companyName: string;
  companyLogo?: string;
  locationName?: string;
  generatedBy: string;
  filterInfo?: string;
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
  headerBg: "#1e3a8a",
  rowAlt: "#f9fafb",
};

/**
 * Generate a PDF report for the Action Log
 */
export async function generateActionLogPDF(data: ActionLogReportData): Promise<Buffer> {
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
          Title: `Action Log Report - ${data.companyName}`,
          Author: data.companyName,
          Subject: "Action Log Report",
          Creator: "Care Compliance Management System",
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const pageWidth = 841.89; // A4 landscape width
      const pageHeight = 595.28; // A4 landscape height
      const margin = 40;
      const contentWidth = pageWidth - (margin * 2);

      // Header Section
      drawHeader(doc, data, contentWidth, margin, logoBuffer);

      // Summary Statistics
      drawSummaryStats(doc, data.actions, contentWidth, margin);

      // Table
      drawActionTable(doc, data.actions, contentWidth, margin, pageHeight);

      // Footer on each page
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        drawFooter(doc, data, pageWidth, pageHeight, margin, i + 1, pageCount);
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function drawHeader(doc: PDFKit.PDFDocument, data: ActionLogReportData, contentWidth: number, margin: number, logoBuffer: Buffer | null) {
  // Header background
  doc.rect(0, 0, 841.89, 80).fill(COLORS.headerBg);

  let textStartX = margin;
  
  // Company logo (if provided)
  if (logoBuffer) {
    try {
      doc.image(logoBuffer, margin, 15, { height: 50 });
      textStartX = margin + 70; // Move text to the right of logo
    } catch (e) {
      console.error("Failed to render company logo:", e);
    }
  }

  // Company name
  doc.fontSize(24).font("Helvetica-Bold").fillColor("#ffffff");
  doc.text(data.companyName, textStartX, 20, { width: contentWidth - 200 - (textStartX - margin) });

  // Report title
  doc.fontSize(12).font("Helvetica").fillColor("#93c5fd");
  doc.text("Master Action Log Report", textStartX, 50);

  // Date and location on the right
  doc.fontSize(10).fillColor("#ffffff");
  const dateStr = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  doc.text(`Generated: ${dateStr}`, 841.89 - margin - 200, 25, { width: 200, align: "right" });
  if (data.locationName) {
    doc.text(`Location: ${data.locationName}`, 841.89 - margin - 200, 40, { width: 200, align: "right" });
  }
  doc.text(`By: ${data.generatedBy}`, 841.89 - margin - 200, 55, { width: 200, align: "right" });

  doc.y = 95;
}

function drawSummaryStats(doc: PDFKit.PDFDocument, actions: ActionItem[], contentWidth: number, margin: number) {
  const total = actions.length;
  const completed = actions.filter(a => a.status === "completed").length;
  const inProgress = actions.filter(a => a.status === "in_progress").length;
  const overdue = actions.filter(a => {
    if (a.status === "completed") return false;
    return new Date(a.targetCompletionDate) < new Date();
  }).length;
  const highPriority = actions.filter(a => a.ragStatus === "red").length;

  const boxWidth = (contentWidth - 40) / 5;
  const boxHeight = 50;
  const startY = doc.y;

  // Total Actions
  drawStatBox(doc, margin, startY, boxWidth, boxHeight, "Total Actions", total.toString(), COLORS.primary);
  
  // Completed
  drawStatBox(doc, margin + boxWidth + 10, startY, boxWidth, boxHeight, "Completed", completed.toString(), COLORS.success);
  
  // In Progress
  drawStatBox(doc, margin + (boxWidth + 10) * 2, startY, boxWidth, boxHeight, "In Progress", inProgress.toString(), COLORS.secondary);
  
  // Overdue
  drawStatBox(doc, margin + (boxWidth + 10) * 3, startY, boxWidth, boxHeight, "Overdue", overdue.toString(), COLORS.danger);
  
  // High Priority
  drawStatBox(doc, margin + (boxWidth + 10) * 4, startY, boxWidth, boxHeight, "High Priority", highPriority.toString(), COLORS.warning);

  doc.y = startY + boxHeight + 20;
}

function drawStatBox(doc: PDFKit.PDFDocument, x: number, y: number, width: number, height: number, label: string, value: string, color: string) {
  // Box background
  doc.rect(x, y, width, height).fillAndStroke("#ffffff", COLORS.border);
  
  // Colored top border
  doc.rect(x, y, width, 4).fill(color);
  
  // Value
  doc.fontSize(20).font("Helvetica-Bold").fillColor(color);
  doc.text(value, x, y + 12, { width: width, align: "center" });
  
  // Label
  doc.fontSize(8).font("Helvetica").fillColor(COLORS.textLight);
  doc.text(label, x, y + 35, { width: width, align: "center" });
}

function drawActionTable(doc: PDFKit.PDFDocument, actions: ActionItem[], contentWidth: number, margin: number, pageHeight: number) {
  // Column definitions
  const columns = [
    { header: "Issue #", width: 55, key: "issueNumber" },
    { header: "Description", width: 180, key: "issueDescription" },
    { header: "Audit Origin", width: 100, key: "auditOrigin" },
    { header: "Location", width: 80, key: "locationName" },
    { header: "Priority", width: 55, key: "ragStatus" },
    { header: "Assigned To", width: 90, key: "responsiblePersonName" },
    { header: "Target Date", width: 70, key: "targetCompletionDate" },
    { header: "Status", width: 70, key: "status" },
    { header: "Completion", width: 70, key: "actualCompletionDate" },
  ];

  const tableTop = doc.y;
  const rowHeight = 25;
  const headerHeight = 30;

  // Draw table header
  let x = margin;
  doc.rect(margin, tableTop, contentWidth, headerHeight).fill(COLORS.primary);
  
  columns.forEach(col => {
    doc.fontSize(8).font("Helvetica-Bold").fillColor("#ffffff");
    doc.text(col.header, x + 4, tableTop + 10, { width: col.width - 8, align: "left" });
    x += col.width;
  });

  // Draw rows
  let y = tableTop + headerHeight;
  let rowIndex = 0;

  actions.forEach((action, index) => {
    // Check if we need a new page
    if (y + rowHeight > pageHeight - 60) {
      doc.addPage();
      y = 40;
      
      // Redraw header on new page
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

    // Alternate row background
    if (rowIndex % 2 === 1) {
      doc.rect(margin, y, contentWidth, rowHeight).fill(COLORS.rowAlt);
    }

    // Row border
    doc.rect(margin, y, contentWidth, rowHeight).stroke(COLORS.border);

    // Draw cell content
    x = margin;
    columns.forEach(col => {
      let value = "";
      let textColor = COLORS.text;

      switch (col.key) {
        case "issueNumber":
          value = action.issueNumber || `ACT-${action.id}`;
          doc.font("Helvetica-Bold");
          break;
        case "issueDescription":
          value = action.issueDescription || "";
          if (value.length > 50) value = value.substring(0, 47) + "...";
          doc.font("Helvetica");
          break;
        case "auditOrigin":
          value = action.auditOrigin || "";
          if (value.length > 25) value = value.substring(0, 22) + "...";
          doc.font("Helvetica");
          break;
        case "locationName":
          value = action.locationName || "";
          doc.font("Helvetica");
          break;
        case "ragStatus":
          value = action.ragStatus === "red" ? "High" : action.ragStatus === "amber" ? "Medium" : "Low";
          textColor = action.ragStatus === "red" ? COLORS.danger : action.ragStatus === "amber" ? COLORS.warning : COLORS.success;
          doc.font("Helvetica-Bold");
          break;
        case "responsiblePersonName":
          value = action.responsiblePersonName || "Unassigned";
          doc.font("Helvetica");
          break;
        case "targetCompletionDate":
          value = action.targetCompletionDate ? new Date(action.targetCompletionDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "";
          const isOverdue = action.status !== "completed" && new Date(action.targetCompletionDate) < new Date();
          textColor = isOverdue ? COLORS.danger : COLORS.text;
          doc.font(isOverdue ? "Helvetica-Bold" : "Helvetica");
          break;
        case "status":
          const statusMap: Record<string, string> = {
            not_started: "Not Started",
            in_progress: "In Progress",
            partially_completed: "Partial",
            completed: "Completed",
          };
          value = statusMap[action.status] || action.status;
          textColor = action.status === "completed" ? COLORS.success : action.status === "in_progress" ? COLORS.secondary : COLORS.textLight;
          doc.font("Helvetica-Bold");
          break;
        case "actualCompletionDate":
          value = action.actualCompletionDate ? new Date(action.actualCompletionDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-";
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

  doc.y = y + 10;
}

function drawFooter(doc: PDFKit.PDFDocument, data: ActionLogReportData, pageWidth: number, pageHeight: number, margin: number, pageNum: number, totalPages: number) {
  const footerY = pageHeight - 30;

  // Footer line
  doc.moveTo(margin, footerY - 5).lineTo(pageWidth - margin, footerY - 5).stroke(COLORS.border);

  // Left side - company info
  doc.fontSize(7).font("Helvetica").fillColor(COLORS.textLight);
  doc.text(`${data.companyName} - Action Log Report`, margin, footerY, { width: 300 });

  // Center - confidentiality notice
  doc.text("Confidential - For Internal Use Only", pageWidth / 2 - 75, footerY, { width: 150, align: "center" });

  // Right side - page number
  doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin - 100, footerY, { width: 100, align: "right" });
}
