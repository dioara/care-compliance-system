/**
 * PDF Generation Service for Completed Audit Reports
 * Generates professional PDF reports with all audit responses and company branding
 */

import PDFDocument from "pdfkit";

interface AuditQuestion {
  id: number;
  questionNumber: string;
  questionText: string;
}

interface AuditResponse {
  questionId: number;
  questionNumber: string;
  questionText: string;
  response: string | null;
  observations: string | null;
  actionRequired: string | null;
}

interface AuditSection {
  id: number;
  sectionTitle: string;
  questions: AuditQuestion[];
}

interface AuditReportData {
  auditId: number;
  auditTypeName: string;
  auditDate: Date | string;
  locationName: string;
  completionRate: number;
  overallScore: number;
  status: string;
  conductedBy?: string;
  sections: AuditSection[];
  responses: AuditResponse[];
  companyName: string;
  companyLogo?: string;
  generatedBy: string;
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
  headerBg: "#ffffff", // Changed to white for glossy white background
  rowAlt: "#fafafa", // Very light gray for alternating rows
  greenBg: "#dcfce7",
  redBg: "#fee2e2",
  amberBg: "#fef3c7",
};

/**
 * Generate a PDF report for a completed audit
 */
export async function generateAuditReportPDF(data: AuditReportData): Promise<Buffer> {
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
        layout: "portrait",
        margin: 50,
        bufferPages: true,
        info: {
          Title: `${data.auditTypeName} - Audit Report`,
          Author: data.companyName,
          Subject: "Audit Report",
          Creator: "Care Compliance Management System",
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const pageWidth = 595.28; // A4 portrait width
      const pageHeight = 841.89; // A4 portrait height
      const margin = 50;
      const contentWidth = pageWidth - (margin * 2);

      // Header Section
      drawHeader(doc, data, contentWidth, margin, logoBuffer, pageWidth);

      // Summary Statistics
      drawSummaryStats(doc, data, contentWidth, margin);

      // Audit Details
      drawAuditDetails(doc, data, contentWidth, margin);

      // Responses by Section
      drawResponses(doc, data, contentWidth, margin, pageHeight);

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

function drawHeader(doc: PDFKit.PDFDocument, data: AuditReportData, contentWidth: number, margin: number, logoBuffer: Buffer | null, pageWidth: number) {
  // Header background - white with border
  doc.rect(0, 0, pageWidth, 100).fillAndStroke(COLORS.headerBg, COLORS.border);

  let textStartX = margin;
  
  // Company logo (if provided)
  if (logoBuffer) {
    try {
      doc.image(logoBuffer, margin, 20, { height: 60 });
      textStartX = margin + 80;
    } catch (e) {
      console.error("Failed to render company logo:", e);
    }
  }

  // Company name
  doc.fontSize(22).font("Helvetica-Bold").fillColor(COLORS.text);
  doc.text(data.companyName, textStartX, 25, { width: contentWidth - 100 - (textStartX - margin) });

  // Report title
  doc.fontSize(14).font("Helvetica").fillColor(COLORS.primary);
  doc.text("Audit Report", textStartX, 55);

  // Date on the right
  doc.fontSize(10).fillColor(COLORS.text);
  const dateStr = new Date(data.auditDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  doc.text(`Audit Date: ${dateStr}`, pageWidth - margin - 150, 30, { width: 150, align: "right" });
  doc.text(`Location: ${data.locationName}`, pageWidth - margin - 150, 45, { width: 150, align: "right" });
  doc.text(`Generated: ${new Date().toLocaleDateString("en-GB")}`, pageWidth - margin - 150, 60, { width: 150, align: "right" });

  doc.y = 115;
}

function drawSummaryStats(doc: PDFKit.PDFDocument, data: AuditReportData, contentWidth: number, margin: number) {
  const startY = doc.y;
  
  // Title
  doc.fontSize(16).font("Helvetica-Bold").fillColor(COLORS.text);
  doc.text(data.auditTypeName, margin, startY);
  doc.y = startY + 25;

  // Stats boxes
  const boxWidth = (contentWidth - 30) / 4;
  const boxHeight = 55;
  const statsY = doc.y;

  // Completion Rate
  drawStatBox(doc, margin, statsY, boxWidth, boxHeight, "Completion", `${data.completionRate}%`, COLORS.primary);
  
  // Overall Score
  const scoreColor = data.overallScore >= 80 ? COLORS.success : data.overallScore >= 60 ? COLORS.warning : COLORS.danger;
  drawStatBox(doc, margin + boxWidth + 10, statsY, boxWidth, boxHeight, "Overall Score", `${data.overallScore}%`, scoreColor);
  
  // Status
  const statusLabel = data.status === "completed" ? "Completed" : data.status === "in_progress" ? "In Progress" : "Not Started";
  const statusColor = data.status === "completed" ? COLORS.success : COLORS.warning;
  drawStatBox(doc, margin + (boxWidth + 10) * 2, statsY, boxWidth, boxHeight, "Status", statusLabel, statusColor);
  
  // Total Questions
  const totalQuestions = data.sections.reduce((sum, s) => sum + s.questions.length, 0);
  drawStatBox(doc, margin + (boxWidth + 10) * 3, statsY, boxWidth, boxHeight, "Questions", totalQuestions.toString(), COLORS.secondary);

  doc.y = statsY + boxHeight + 20;
}

function drawStatBox(doc: PDFKit.PDFDocument, x: number, y: number, width: number, height: number, label: string, value: string, color: string) {
  // Box background
  doc.rect(x, y, width, height).fillAndStroke("#ffffff", COLORS.border);
  
  // Colored top border
  doc.rect(x, y, width, 4).fill(color);
  
  // Value
  doc.fontSize(18).font("Helvetica-Bold").fillColor(color);
  doc.text(value, x, y + 15, { width: width, align: "center" });
  
  // Label
  doc.fontSize(9).font("Helvetica").fillColor(COLORS.textLight);
  doc.text(label, x, y + 38, { width: width, align: "center" });
}

function drawAuditDetails(doc: PDFKit.PDFDocument, data: AuditReportData, contentWidth: number, margin: number) {
  const startY = doc.y;
  
  // Section title
  doc.fontSize(12).font("Helvetica-Bold").fillColor(COLORS.text);
  doc.text("Audit Details", margin, startY);
  
  doc.y = startY + 18;
  
  // Details in a bordered box
  const detailsY = doc.y;
  const detailsHeight = 50;
  doc.rect(margin, detailsY, contentWidth, detailsHeight).stroke(COLORS.border);
  
  doc.fontSize(9).font("Helvetica").fillColor(COLORS.textLight);
  
  // Column 1
  doc.text("Audit Type:", margin + 10, detailsY + 10);
  doc.font("Helvetica-Bold").fillColor(COLORS.text);
  doc.text(data.auditTypeName, margin + 10, detailsY + 22);
  
  // Column 2
  doc.font("Helvetica").fillColor(COLORS.textLight);
  doc.text("Location:", margin + contentWidth / 3, detailsY + 10);
  doc.font("Helvetica-Bold").fillColor(COLORS.text);
  doc.text(data.locationName, margin + contentWidth / 3, detailsY + 22);
  
  // Column 3
  doc.font("Helvetica").fillColor(COLORS.textLight);
  doc.text("Conducted By:", margin + (contentWidth / 3) * 2, detailsY + 10);
  doc.font("Helvetica-Bold").fillColor(COLORS.text);
  doc.text(data.conductedBy || data.generatedBy, margin + (contentWidth / 3) * 2, detailsY + 22);

  doc.y = detailsY + detailsHeight + 20;
}

function drawResponses(doc: PDFKit.PDFDocument, data: AuditReportData, contentWidth: number, margin: number, pageHeight: number) {
  // Create a map of responses by question ID
  const responseMap = new Map<number, AuditResponse>();
  data.responses.forEach(r => responseMap.set(r.questionId, r));

  // Section title
  doc.fontSize(12).font("Helvetica-Bold").fillColor(COLORS.text);
  doc.text("Audit Responses", margin, doc.y);
  doc.y += 15;

  data.sections.forEach((section, sectionIndex) => {
    // Check if we need a new page for section header
    if (doc.y > pageHeight - 150) {
      doc.addPage();
      doc.y = 50;
    }

    // Section header - white background with border
    const sectionY = doc.y;
    doc.rect(margin, sectionY, contentWidth, 28).fillAndStroke("#f8fafc", COLORS.primary);
    doc.fontSize(11).font("Helvetica-Bold").fillColor(COLORS.primary);
    doc.text(section.sectionTitle, margin + 10, sectionY + 8, { width: contentWidth - 100 });
    
    // Question count badge
    const answeredInSection = section.questions.filter(q => responseMap.has(q.id)).length;
    doc.fontSize(9).font("Helvetica").fillColor(COLORS.textLight);
    doc.text(`${answeredInSection}/${section.questions.length} answered`, margin + contentWidth - 100, sectionY + 10, { width: 90, align: "right" });

    doc.y = sectionY + 35;

    // Questions in this section
    section.questions.forEach((question, qIndex) => {
      const response = responseMap.get(question.id);
      
      // Calculate required height for this question
      let requiredHeight = 45; // Base height
      if (response?.observations) requiredHeight += 30;
      if (response?.actionRequired) requiredHeight += 30;

      // Check if we need a new page
      if (doc.y + requiredHeight > pageHeight - 60) {
        doc.addPage();
        doc.y = 50;
      }

      const questionY = doc.y;
      const bgColor = qIndex % 2 === 0 ? "#ffffff" : COLORS.rowAlt;
      
      // Question box
      doc.rect(margin, questionY, contentWidth, requiredHeight).fillAndStroke(bgColor, COLORS.border);

      // Question number and text
      doc.fontSize(9).font("Helvetica-Bold").fillColor(COLORS.primary);
      doc.text(question.questionNumber, margin + 8, questionY + 8, { width: 35 });
      
      doc.font("Helvetica").fillColor(COLORS.text);
      const questionTextWidth = contentWidth - 130;
      doc.text(question.questionText, margin + 45, questionY + 8, { width: questionTextWidth });

      // Response badge
      if (response) {
        const badgeX = margin + contentWidth - 70;
        const badgeY = questionY + 6;
        const badgeWidth = 55;
        const badgeHeight = 18;
        
        let badgeColor = COLORS.textLight;
        let badgeText = response.response || "N/A";
        let badgeBg = "#f3f4f6";
        
        if (response.response === "yes") {
          badgeColor = COLORS.success;
          badgeText = "Yes";
          badgeBg = COLORS.greenBg;
        } else if (response.response === "no") {
          badgeColor = COLORS.danger;
          badgeText = "No";
          badgeBg = COLORS.redBg;
        } else if (response.response === "na") {
          badgeText = "N/A";
        } else if (response.response === "partial") {
          badgeColor = COLORS.warning;
          badgeText = "Partial";
          badgeBg = COLORS.amberBg;
        }

        doc.rect(badgeX, badgeY, badgeWidth, badgeHeight).fillAndStroke(badgeBg, badgeColor);
        doc.fontSize(8).font("Helvetica-Bold").fillColor(badgeColor);
        doc.text(badgeText, badgeX, badgeY + 5, { width: badgeWidth, align: "center" });
      } else {
        // Not answered
        const badgeX = margin + contentWidth - 70;
        const badgeY = questionY + 6;
        doc.rect(badgeX, badgeY, 55, 18).fillAndStroke("#f3f4f6", COLORS.border);
        doc.fontSize(8).font("Helvetica").fillColor(COLORS.textLight);
        doc.text("Not Answered", badgeX, badgeY + 5, { width: 55, align: "center" });
      }

      // Observations and Action Required
      let detailY = questionY + 30;
      
      if (response?.observations) {
        doc.fontSize(8).font("Helvetica-Bold").fillColor(COLORS.textLight);
        doc.text("Observations:", margin + 45, detailY);
        doc.font("Helvetica").fillColor(COLORS.text);
        doc.text(response.observations, margin + 110, detailY, { width: contentWidth - 130 });
        detailY += 20;
      }
      
      if (response?.actionRequired) {
        doc.fontSize(8).font("Helvetica-Bold").fillColor(COLORS.warning);
        doc.text("Action Required:", margin + 45, detailY);
        doc.font("Helvetica").fillColor(COLORS.text);
        doc.text(response.actionRequired, margin + 125, detailY, { width: contentWidth - 145 });
      }

      doc.y = questionY + requiredHeight + 2;
    });

    doc.y += 10;
  });
}

function drawFooter(doc: PDFKit.PDFDocument, data: AuditReportData, pageWidth: number, pageHeight: number, margin: number, pageNum: number, totalPages: number) {
  const footerY = pageHeight - 35;

  // Footer line
  doc.moveTo(margin, footerY - 5).lineTo(pageWidth - margin, footerY - 5).stroke(COLORS.border);

  // Left side - company info
  doc.fontSize(7).font("Helvetica").fillColor(COLORS.textLight);
  doc.text(`${data.companyName} - ${data.auditTypeName}`, margin, footerY, { width: 200 });

  // Center - confidentiality notice
  doc.text("Confidential - For Internal Use Only", pageWidth / 2 - 75, footerY, { width: 150, align: "center" });

  // Right side - page number
  doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin - 100, footerY, { width: 100, align: "right" });
}
