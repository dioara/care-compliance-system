/**
 * PDF Generation Service for AI Audit Reports
 * Generates downloadable PDF reports with anonymized AI feedback
 */

import PDFDocument from "pdfkit";

interface AuditReportData {
  auditId: number;
  auditType: "care_plan" | "daily_notes";
  documentName: string;
  score: number;
  strengths: string[];
  areasForImprovement: string[];
  recommendations: string[];
  cqcComplianceNotes?: string;
  anonymizationReport?: string;
  createdAt: Date;
  companyName?: string;
  companyLogo?: string;
}

/**
 * Generate a PDF report for an AI audit
 */
export async function generateAuditPDF(data: AuditReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
        info: {
          Title: `AI Audit Report - ${data.documentName}`,
          Author: data.companyName || "Care Compliance System",
          Subject: `${data.auditType === "care_plan" ? "Care Plan" : "Daily Notes"} Quality Audit`,
          Creator: "Care Compliance Management System",
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Header
      doc.fontSize(20).font("Helvetica-Bold").fillColor("#1a365d");
      doc.text("AI Audit Report", { align: "center" });
      doc.moveDown(0.5);

      // Company name if provided
      if (data.companyName) {
        doc.fontSize(12).font("Helvetica").fillColor("#4a5568");
        doc.text(data.companyName, { align: "center" });
      }

      doc.moveDown(1);

      // Audit Details Box
      doc.rect(50, doc.y, 495, 80).fillAndStroke("#f7fafc", "#e2e8f0");
      const boxY = doc.y + 10;
      doc.fillColor("#2d3748").fontSize(10).font("Helvetica");
      doc.text(`Document: ${data.documentName}`, 60, boxY);
      doc.text(`Audit Type: ${data.auditType === "care_plan" ? "Care Plan Review" : "Daily Notes Review"}`, 60, boxY + 15);
      doc.text(`Date: ${new Date(data.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`, 60, boxY + 30);
      doc.text(`Report ID: #${data.auditId}`, 60, boxY + 45);

      doc.y = boxY + 80;
      doc.moveDown(1);

      // Score Section
      const scoreColor = data.score >= 8 ? "#38a169" : data.score >= 6 ? "#d69e2e" : data.score >= 4 ? "#dd6b20" : "#e53e3e";
      const scoreLabel = data.score >= 8 ? "Excellent" : data.score >= 6 ? "Good" : data.score >= 4 ? "Needs Improvement" : "Poor";

      doc.fontSize(14).font("Helvetica-Bold").fillColor("#1a365d");
      doc.text("Quality Score", { align: "center" });
      doc.moveDown(0.3);

      doc.fontSize(48).font("Helvetica-Bold").fillColor(scoreColor);
      doc.text(`${data.score}/10`, { align: "center" });
      doc.fontSize(14).font("Helvetica").fillColor(scoreColor);
      doc.text(scoreLabel, { align: "center" });
      doc.moveDown(1);

      // Strengths Section
      if (data.strengths && data.strengths.length > 0) {
        doc.fontSize(14).font("Helvetica-Bold").fillColor("#38a169");
        doc.text("✓ Strengths");
        doc.moveDown(0.3);
        doc.fontSize(10).font("Helvetica").fillColor("#2d3748");
        data.strengths.forEach((strength) => {
          doc.text(`• ${strength}`, { indent: 20 });
          doc.moveDown(0.2);
        });
        doc.moveDown(0.5);
      }

      // Areas for Improvement Section
      if (data.areasForImprovement && data.areasForImprovement.length > 0) {
        doc.fontSize(14).font("Helvetica-Bold").fillColor("#dd6b20");
        doc.text("⚠ Areas for Improvement");
        doc.moveDown(0.3);
        doc.fontSize(10).font("Helvetica").fillColor("#2d3748");
        data.areasForImprovement.forEach((area) => {
          doc.text(`• ${area}`, { indent: 20 });
          doc.moveDown(0.2);
        });
        doc.moveDown(0.5);
      }

      // Recommendations Section
      if (data.recommendations && data.recommendations.length > 0) {
        doc.fontSize(14).font("Helvetica-Bold").fillColor("#3182ce");
        doc.text("→ Recommendations");
        doc.moveDown(0.3);
        doc.fontSize(10).font("Helvetica").fillColor("#2d3748");
        data.recommendations.forEach((rec) => {
          doc.text(`• ${rec}`, { indent: 20 });
          doc.moveDown(0.2);
        });
        doc.moveDown(0.5);
      }

      // CQC Compliance Notes
      if (data.cqcComplianceNotes) {
        doc.fontSize(14).font("Helvetica-Bold").fillColor("#1a365d");
        doc.text("CQC Compliance Notes");
        doc.moveDown(0.3);
        doc.fontSize(10).font("Helvetica").fillColor("#4a5568");
        doc.text(data.cqcComplianceNotes, { indent: 20 });
        doc.moveDown(1);
      }

      // Footer - Privacy Notice
      doc.fontSize(8).font("Helvetica").fillColor("#718096");
      doc.text("─".repeat(80), { align: "center" });
      doc.moveDown(0.3);
      doc.text("Privacy Notice: This report contains anonymised AI-generated feedback. All personal names have been", { align: "center" });
      doc.text("converted to initials and personal identifiable information has been redacted for GDPR compliance.", { align: "center" });
      doc.moveDown(0.3);
      doc.text(`Generated by Care Compliance Management System on ${new Date().toLocaleDateString("en-GB")}`, { align: "center" });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
