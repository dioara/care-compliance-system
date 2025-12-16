/**
 * PDF Generation Service for Incident Reports
 * Generates professional PDF reports with company branding
 * Uses clean white background to work with any logo color
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
  serviceUserId?: number | null;
  staffInvolved?: string | null;
  immediateActions?: string | null;
  witnessStatements?: string | null;
  // Notifications
  reportedToCqc?: boolean | null;
  cqcNotifiedAt?: Date | string | null;
  cqcNotificationDetails?: string | null;
  reportedToCouncil?: boolean | null;
  councilNotifiedAt?: Date | string | null;
  councilNotificationDetails?: string | null;
  reportedToPolice?: boolean | null;
  policeNotifiedAt?: Date | string | null;
  policeNotificationDetails?: string | null;
  reportedToFamily?: boolean | null;
  familyNotifiedAt?: Date | string | null;
  familyNotificationDetails?: string | null;
  reportedToIco?: boolean | null;
  icoNotifiedAt?: Date | string | null;
  icoNotificationDetails?: string | null;
  // Investigation
  investigationRequired?: boolean | null;
  investigationNotes?: string | null;
  investigationCompletedAt?: Date | string | null;
  // Actions and follow-up
  actionRequired?: string | null;
  assignedToId?: number | null;
  assignedToName?: string | null;
  targetCompletionDate?: Date | string | null;
  lessonsLearned?: string | null;
  // Metadata
  reportedById?: number | null;
  reportedByName?: string | null;
  closedById?: number | null;
  closedByName?: string | null;
  closedAt?: Date | string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  // Attachments and Signatures (for single incident reports)
  attachments?: Array<{
    id: number;
    fileName: string;
    fileType: string;
    fileUrl: string;
    description?: string | null;
    createdAt: Date | string;
  }>;
  signatures?: Array<{
    id: number;
    signatureType: string;
    signedByName: string;
    signedByRole?: string | null;
    signatureData: string;
    signedAt: Date | string;
    notes?: string | null;
  }>;
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
  secondary: "#6366f1",
  accent: "#7c3aed",
  success: "#16a34a",
  warning: "#d97706",
  danger: "#dc2626",
  text: "#1f2937",
  textLight: "#6b7280",
  textMuted: "#9ca3af",
  border: "#e5e7eb",
  borderLight: "#f3f4f6",
  white: "#ffffff",
  background: "#fafafa",
};

/**
 * Generate a PDF report for incidents - detailed narrative format
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
        layout: "portrait",
        margin: 50,
        bufferPages: true, // Enable page buffering for page numbers
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

      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const margin = 50;
      const contentWidth = pageWidth - (margin * 2);

      // Process each incident as a separate detailed report
      data.incidents.forEach((incident, index) => {
        if (index > 0) {
          doc.addPage();
        }

        renderIncidentReport(doc, incident, data, logoBuffer, {
          pageWidth,
          pageHeight,
          margin,
          contentWidth,
        });
      });

      // Add page numbers to all pages
      const range = doc.bufferedPageRange();
      const totalPages = range.start + range.count;
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        
        // Footer with page numbers
        const footerY = pageHeight - 35;
        doc.fontSize(8).font("Helvetica").fillColor(COLORS.textMuted);
        doc.text(`${data.companyName} - Confidential`, margin, footerY, { width: contentWidth / 2 });
        doc.text(`Page ${i + 1} of ${totalPages}`, pageWidth - margin - 100, footerY, { width: 100, align: "right" });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function renderIncidentReport(
  doc: PDFKit.PDFDocument,
  incident: IncidentItem,
  data: IncidentReportData,
  logoBuffer: Buffer | null,
  dims: { pageWidth: number; pageHeight: number; margin: number; contentWidth: number }
) {
  const { pageWidth, pageHeight, margin, contentWidth } = dims;
  let y = margin;

  // Footer will be added at the bottom of content areas
  // No page-level footer to avoid pagination issues

  // ===== HEADER (White background) =====
  // Logo and company name
  let headerTextX = margin;
  let logoWidth = 0;
  if (logoBuffer) {
    try {
      // Render logo with fixed width to prevent overlap
      doc.image(logoBuffer, margin, y, { height: 50, width: 50 });
      logoWidth = 60; // Logo width + padding
      headerTextX = margin + logoWidth;
    } catch (e) {
      console.error("Failed to render logo:", e);
    }
  }

  // Company name with proper spacing from logo
  const headerTextWidth = contentWidth - logoWidth - 160; // Leave space for right-side metadata
  doc.fontSize(18).font("Helvetica-Bold").fillColor(COLORS.text);
  doc.text(data.companyName, headerTextX, y + 5, { width: headerTextWidth });
  
  doc.fontSize(10).font("Helvetica").fillColor(COLORS.textLight);
  doc.text("Incident Report", headerTextX, y + 28);

  // Report metadata on the right
  const dateStr = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  doc.fontSize(9).fillColor(COLORS.textLight);
  doc.text(`Generated: ${dateStr}`, pageWidth - margin - 150, y + 5, { width: 150, align: "right" });
  if (data.locationName) {
    doc.text(`Location: ${data.locationName}`, pageWidth - margin - 150, y + 18, { width: 150, align: "right" });
  }
  doc.text(`By: ${data.generatedBy}`, pageWidth - margin - 150, y + 31, { width: 150, align: "right" });

  y += 65;

  // Divider line
  doc.moveTo(margin, y).lineTo(pageWidth - margin, y).strokeColor(COLORS.border).lineWidth(1).stroke();
  y += 15;

  // ===== INCIDENT REFERENCE BANNER =====
  const severityColor = getSeverityColor(incident.severity);
  const statusColor = getStatusColor(incident.status);
  
  doc.fontSize(14).font("Helvetica-Bold").fillColor(COLORS.text);
  doc.text(`Incident Reference: ${incident.incidentNumber || `INC-${incident.id}`}`, margin, y);
  y += 25;

  // Status and Severity badges inline
  const badgeY = y;
  
  // Severity badge
  doc.roundedRect(margin, badgeY, 80, 22, 3).fill(severityColor);
  doc.fontSize(9).font("Helvetica-Bold").fillColor(COLORS.white);
  doc.text(formatSeverity(incident.severity), margin + 5, badgeY + 6, { width: 70, align: "center" });

  // Status badge
  doc.roundedRect(margin + 90, badgeY, 90, 22, 3).fill(statusColor);
  doc.text(formatStatus(incident.status), margin + 95, badgeY + 6, { width: 80, align: "center" });

  // Type badge
  doc.roundedRect(margin + 190, badgeY, 100, 22, 3).fill(COLORS.secondary);
  doc.text(formatIncidentType(incident.incidentType), margin + 195, badgeY + 6, { width: 90, align: "center" });

  y += 40;

  // ===== SECTION: INCIDENT DETAILS =====
  y = renderSection(doc, "INCIDENT DETAILS", y, margin, contentWidth);
  
  y = renderField(doc, "Date of Incident", formatDate(incident.incidentDate), y, margin, contentWidth);
  y = renderField(doc, "Time of Incident", incident.incidentTime || "Not specified", y, margin, contentWidth);
  y = renderField(doc, "Location", incident.locationDescription || "Not specified", y, margin, contentWidth);
  y += 10;

  // ===== SECTION: AFFECTED PERSON =====
  y = renderSection(doc, "AFFECTED PERSON", y, margin, contentWidth);
  
  y = renderField(doc, "Person Type", formatPersonType(incident.affectedPersonType), y, margin, contentWidth);
  y = renderField(doc, "Name", incident.affectedPersonName || "Not specified", y, margin, contentWidth);
  if (incident.staffInvolved) {
    y = renderField(doc, "Staff Involved", stripHtml(incident.staffInvolved), y, margin, contentWidth);
  }
  y += 10;

  // ===== SECTION: INCIDENT DESCRIPTION =====
  y = renderSection(doc, "INCIDENT DESCRIPTION", y, margin, contentWidth);
  y = renderTextBlock(doc, stripHtml(incident.description) || "No description provided.", y, margin, contentWidth);
  y += 15;

  // ===== SECTION: IMMEDIATE ACTIONS TAKEN =====
  y = renderSection(doc, "IMMEDIATE ACTIONS TAKEN", y, margin, contentWidth);
  y = renderTextBlock(doc, stripHtml(incident.immediateActions) || "No immediate actions recorded.", y, margin, contentWidth);
  y += 15;

  // ===== SECTION: WITNESS STATEMENTS =====
  if (incident.witnessStatements) {
    y = checkPageBreak(doc, y, 100, dims);
    y = renderSection(doc, "WITNESS STATEMENTS", y, margin, contentWidth);
    
    try {
      const witnesses = JSON.parse(incident.witnessStatements);
      if (Array.isArray(witnesses) && witnesses.length > 0) {
        witnesses.forEach((witness: any, idx: number) => {
          y = checkPageBreak(doc, y, 60, dims);
          doc.fontSize(10).font("Helvetica-Bold").fillColor(COLORS.text);
          doc.text(`Witness ${idx + 1}: ${witness.name || "Anonymous"}`, margin, y);
          y += 15;
          doc.fontSize(10).font("Helvetica").fillColor(COLORS.textLight);
          doc.text(witness.statement || "No statement provided.", margin + 10, y, { width: contentWidth - 10 });
          y += doc.heightOfString(witness.statement || "No statement provided.", { width: contentWidth - 10 }) + 10;
        });
      } else {
        y = renderTextBlock(doc, "No witness statements recorded.", y, margin, contentWidth);
      }
    } catch {
      y = renderTextBlock(doc, stripHtml(incident.witnessStatements), y, margin, contentWidth);
    }
    y += 10;
  }

  // ===== SECTION: NOTIFICATIONS =====
  y = checkPageBreak(doc, y, 120, dims);
  y = renderSection(doc, "NOTIFICATIONS & REPORTING", y, margin, contentWidth);
  
  const notifications = [
    { label: "CQC", reported: incident.reportedToCqc, date: incident.cqcNotifiedAt, details: incident.cqcNotificationDetails },
    { label: "Local Authority/Council", reported: incident.reportedToCouncil, date: incident.councilNotifiedAt, details: incident.councilNotificationDetails },
    { label: "Police", reported: incident.reportedToPolice, date: incident.policeNotifiedAt, details: incident.policeNotificationDetails },
    { label: "Family/Next of Kin", reported: incident.reportedToFamily, date: incident.familyNotifiedAt, details: incident.familyNotificationDetails },
    { label: "ICO (Data Protection)", reported: incident.reportedToIco, date: incident.icoNotifiedAt, details: incident.icoNotificationDetails },
  ];

  notifications.forEach(notif => {
    const status = notif.reported ? "Yes" : "No";
    const statusColor = notif.reported ? COLORS.success : COLORS.textMuted;
    
    doc.fontSize(10).font("Helvetica-Bold").fillColor(COLORS.text);
    doc.text(`${notif.label}:`, margin, y, { continued: true });
    doc.font("Helvetica").fillColor(statusColor);
    doc.text(` ${status}`, { continued: false });
    
    if (notif.reported && notif.date) {
      doc.fontSize(9).fillColor(COLORS.textLight);
      doc.text(`  Notified on: ${formatDate(notif.date)}`, margin + 200, y);
    }
    y += 18;
    
    if (notif.reported && notif.details) {
      doc.fontSize(9).font("Helvetica").fillColor(COLORS.textLight);
      doc.text(`Details: ${stripHtml(notif.details)}`, margin + 15, y, { width: contentWidth - 15 });
      y += doc.heightOfString(`Details: ${stripHtml(notif.details)}`, { width: contentWidth - 15 }) + 5;
    }
  });
  y += 10;

  // ===== SECTION: INVESTIGATION =====
  y = checkPageBreak(doc, y, 100, dims);
  y = renderSection(doc, "INVESTIGATION", y, margin, contentWidth);
  
  y = renderField(doc, "Investigation Required", incident.investigationRequired ? "Yes" : "No", y, margin, contentWidth);
  if (incident.investigationCompletedAt) {
    y = renderField(doc, "Investigation Completed", formatDate(incident.investigationCompletedAt), y, margin, contentWidth);
  }
  if (incident.investigationNotes) {
    doc.fontSize(10).font("Helvetica-Bold").fillColor(COLORS.text);
    doc.text("Investigation Notes:", margin, y);
    y += 15;
    y = renderTextBlock(doc, stripHtml(incident.investigationNotes), y, margin, contentWidth);
  } else {
    y = renderTextBlock(doc, "No investigation notes recorded.", y, margin, contentWidth);
  }
  y += 10;

  // ===== SECTION: ACTIONS & FOLLOW-UP =====
  y = checkPageBreak(doc, y, 100, dims);
  y = renderSection(doc, "ACTIONS & FOLLOW-UP", y, margin, contentWidth);
  
  if (incident.actionRequired) {
    doc.fontSize(10).font("Helvetica-Bold").fillColor(COLORS.text);
    doc.text("Actions Required:", margin, y);
    y += 15;
    y = renderTextBlock(doc, stripHtml(incident.actionRequired), y, margin, contentWidth);
  } else {
    y = renderTextBlock(doc, "No actions specified.", y, margin, contentWidth);
  }
  
  if (incident.assignedToName) {
    y = renderField(doc, "Assigned To", incident.assignedToName, y + 5, margin, contentWidth);
  }
  if (incident.targetCompletionDate) {
    y = renderField(doc, "Target Completion Date", formatDate(incident.targetCompletionDate), y, margin, contentWidth);
  }
  y += 10;

  // ===== SECTION: LESSONS LEARNED =====
  if (incident.lessonsLearned) {
    y = checkPageBreak(doc, y, 80, dims);
    y = renderSection(doc, "LESSONS LEARNED", y, margin, contentWidth);
    y = renderTextBlock(doc, stripHtml(incident.lessonsLearned), y, margin, contentWidth);
    y += 10;
  }

  // ===== SECTION: RECORD INFORMATION =====
  y = checkPageBreak(doc, y, 100, dims);
  y = renderSection(doc, "RECORD INFORMATION", y, margin, contentWidth);
  
  y = renderField(doc, "Reported By", incident.reportedByName || "Not specified", y, margin, contentWidth);
  y = renderField(doc, "Date Reported", formatDate(incident.createdAt), y, margin, contentWidth);
  if (incident.closedAt) {
    y = renderField(doc, "Closed By", incident.closedByName || "Not specified", y, margin, contentWidth);
    y = renderField(doc, "Date Closed", formatDate(incident.closedAt), y, margin, contentWidth);
  }
  if (incident.updatedAt) {
    y = renderField(doc, "Last Updated", formatDate(incident.updatedAt), y, margin, contentWidth);
  }

  // ===== SECTION: ATTACHMENTS =====
  if (incident.attachments && incident.attachments.length > 0) {
    y = checkPageBreak(doc, y, 80, dims);
    y = renderSection(doc, "ATTACHMENTS", y, margin, contentWidth);
    
    for (const attachment of incident.attachments) {
      y = checkPageBreak(doc, y, 40, dims);
      doc.fontSize(10).font("Helvetica-Bold").fillColor(COLORS.text);
      doc.text(`• ${attachment.fileName}`, margin, y);
      y += 15;
      
      if (attachment.description) {
        doc.fontSize(9).font("Helvetica").fillColor(COLORS.textLight);
        doc.text(`  ${attachment.description}`, margin + 10, y);
        y += 12;
      }
      
      doc.fontSize(8).font("Helvetica").fillColor(COLORS.textMuted);
      doc.text(`  Uploaded: ${formatDate(attachment.createdAt)}`, margin + 10, y);
      y += 15;
    }
    y += 10;
  }

  // ===== SIGNATURE SECTION =====
  y = checkPageBreak(doc, y, 150, dims);
  y += 20;
  
  doc.moveTo(margin, y).lineTo(pageWidth - margin, y).strokeColor(COLORS.border).stroke();
  y += 20;

  doc.fontSize(10).font("Helvetica-Bold").fillColor(COLORS.text);
  doc.text("AUTHORISATION & SIGNATURES", margin, y);
  y += 20;

  // Check if we have actual digital signatures
  if (incident.signatures && incident.signatures.length > 0) {
    // Render actual digital signatures
    for (const sig of incident.signatures) {
      y = checkPageBreak(doc, y, 80, dims);
      
      const sigTypeLabel = sig.signatureType === 'manager' ? 'Manager/Supervisor' 
        : sig.signatureType === 'reviewer' ? 'Reviewer' 
        : 'Witness';
      
      doc.fontSize(9).font("Helvetica-Bold").fillColor(COLORS.text);
      doc.text(`${sigTypeLabel}:`, margin, y);
      y += 5;
      
      // Draw signature image if it's base64 data
      if (sig.signatureData && sig.signatureData.startsWith('data:image')) {
        try {
          const base64Data = sig.signatureData.split(',')[1];
          const sigBuffer = Buffer.from(base64Data, 'base64');
          doc.image(sigBuffer, margin, y, { height: 40 });
          y += 45;
        } catch (e) {
          // If image fails, show placeholder
          doc.moveTo(margin, y + 20).lineTo(margin + 150, y + 20).stroke();
          y += 25;
        }
      } else {
        doc.moveTo(margin, y + 20).lineTo(margin + 150, y + 20).stroke();
        y += 25;
      }
      
      doc.fontSize(8).font("Helvetica").fillColor(COLORS.textLight);
      doc.text(`${sig.signedByName}${sig.signedByRole ? ` (${sig.signedByRole})` : ''}`, margin, y);
      y += 12;
      doc.text(`Signed: ${formatDate(sig.signedAt)}`, margin, y);
      y += 12;
      
      if (sig.notes) {
        doc.fontSize(8).font("Helvetica-Oblique").fillColor(COLORS.textMuted);
        doc.text(`"${sig.notes}"`, margin, y);
        y += 12;
      }
      y += 10;
    }
    
    // Show which signatures are still pending
    const signedTypes = incident.signatures.map(s => s.signatureType);
    const pendingTypes = ['manager', 'reviewer', 'witness'].filter(t => !signedTypes.includes(t));
    
    if (pendingTypes.length > 0) {
      y = checkPageBreak(doc, y, 60, dims);
      doc.fontSize(9).font("Helvetica").fillColor(COLORS.textMuted);
      doc.text("Pending signatures:", margin, y);
      y += 15;
      
      for (const type of pendingTypes) {
        const label = type === 'manager' ? 'Manager/Supervisor' : type === 'reviewer' ? 'Reviewer' : 'Witness';
        doc.text(`• ${label}`, margin + 10, y);
        y += 12;
      }
    }
  } else {
    // No digital signatures - show blank signature lines
    const sigWidth = (contentWidth - 40) / 2;
    
    doc.fontSize(9).font("Helvetica").fillColor(COLORS.textLight);
    doc.text("Manager/Supervisor Signature:", margin, y);
    doc.moveTo(margin, y + 30).lineTo(margin + sigWidth, y + 30).stroke();
    doc.text("Date:", margin, y + 40);
    doc.moveTo(margin + 35, y + 40).lineTo(margin + sigWidth, y + 40).stroke();

    doc.text("Reviewed By:", margin + sigWidth + 40, y);
    doc.moveTo(margin + sigWidth + 40, y + 30).lineTo(pageWidth - margin, y + 30).stroke();
    doc.text("Date:", margin + sigWidth + 40, y + 40);
    doc.moveTo(margin + sigWidth + 75, y + 40).lineTo(pageWidth - margin, y + 40).stroke();
  }
}

// Helper functions
function renderSection(doc: PDFKit.PDFDocument, title: string, y: number, margin: number, contentWidth: number): number {
  doc.fontSize(11).font("Helvetica-Bold").fillColor(COLORS.primary);
  doc.text(title, margin, y);
  y += 5;
  doc.moveTo(margin, y + 10).lineTo(margin + contentWidth, y + 10).strokeColor(COLORS.borderLight).lineWidth(0.5).stroke();
  return y + 20;
}

function renderField(doc: PDFKit.PDFDocument, label: string, value: string, y: number, margin: number, contentWidth: number): number {
  doc.fontSize(10).font("Helvetica-Bold").fillColor(COLORS.text);
  doc.text(`${label}: `, margin, y, { continued: false });
  doc.font("Helvetica").fillColor(COLORS.textLight);
  doc.text(value, margin + 150, y, { width: contentWidth - 150 });
  const textHeight = doc.heightOfString(value, { width: contentWidth - 150 });
  return y + Math.max(18, textHeight + 8);
}

function renderTextBlock(doc: PDFKit.PDFDocument, text: string, y: number, margin: number, contentWidth: number): number {
  doc.fontSize(10).font("Helvetica").fillColor(COLORS.text);
  doc.text(text, margin, y, { width: contentWidth, lineGap: 3 });
  return y + doc.heightOfString(text, { width: contentWidth, lineGap: 3 }) + 5;
}

function checkPageBreak(doc: PDFKit.PDFDocument, y: number, requiredSpace: number, dims: { pageHeight: number; margin: number }): number {
  if (y + requiredSpace > dims.pageHeight - 60) {
    doc.addPage();
    return dims.margin;
  }
  return y;
}

function stripHtml(text: string | null | undefined): string {
  if (!text) return "";
  return text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "Not specified";
  const d = new Date(date);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function formatSeverity(severity: string | null | undefined): string {
  const map: Record<string, string> = { critical: "CRITICAL", high: "HIGH", medium: "MEDIUM", low: "LOW" };
  return map[severity || ""] || severity?.toUpperCase() || "UNKNOWN";
}

function formatStatus(status: string | null | undefined): string {
  const map: Record<string, string> = { open: "OPEN", under_investigation: "INVESTIGATING", resolved: "RESOLVED", closed: "CLOSED" };
  return map[status || ""] || status?.toUpperCase() || "UNKNOWN";
}

function formatIncidentType(type: string | null | undefined): string {
  if (!type) return "Unknown";
  return type.replace(/_/g, " ").split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

function formatPersonType(type: string | null | undefined): string {
  const map: Record<string, string> = { 
    service_user: "Service User", 
    staff: "Staff Member", 
    visitor: "Visitor", 
    other: "Other" 
  };
  return map[type || ""] || type || "Not specified";
}

function getSeverityColor(severity: string | null | undefined): string {
  const map: Record<string, string> = { 
    critical: COLORS.danger, 
    high: COLORS.warning, 
    medium: "#f59e0b", 
    low: COLORS.success 
  };
  return map[severity || ""] || COLORS.textMuted;
}

function getStatusColor(status: string | null | undefined): string {
  const map: Record<string, string> = { 
    open: COLORS.accent, 
    under_investigation: COLORS.warning, 
    resolved: COLORS.success, 
    closed: COLORS.textLight 
  };
  return map[status || ""] || COLORS.textMuted;
}
