import PDFDocument from 'pdfkit';
import { format } from 'date-fns';

interface AuditForPdf {
  id: number;
  auditName: string;
  scheduledDate: string;
  status: string;
  auditorName?: string;
  serviceUserName?: string;
}

interface CalendarPdfOptions {
  locationName: string;
  startDate: Date;
  endDate: Date;
  audits: AuditForPdf[];
  viewType: 'month' | 'week' | 'day';
}

export async function generateCalendarPdf(options: CalendarPdfOptions): Promise<Buffer> {
  const { locationName, startDate, endDate, audits, viewType } = options;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margins: { top: 40, bottom: 40, left: 40, right: 40 },
    });

    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Header
    const startY = doc.y;
    doc.fontSize(20).font('Helvetica-Bold').text('Audit Calendar', 40, startY, { align: 'center', width: doc.page.width - 80 });
    doc.moveDown(0.5);
    doc.fontSize(14).font('Helvetica').text(locationName, { align: 'center', width: doc.page.width - 80 });
    doc.moveDown(0.3);
    
    // Date range
    const dateRangeText = `Full Year ${format(startDate, 'yyyy')} Calendar`;
    doc.fontSize(12).text(dateRangeText, { align: 'center', width: doc.page.width - 80 });
    doc.moveDown(1);

    // Group audits by date
    const auditsByDate: Record<string, AuditForPdf[]> = {};
    audits.forEach(audit => {
      const dateKey = format(new Date(audit.scheduledDate), 'yyyy-MM-dd');
      if (!auditsByDate[dateKey]) {
        auditsByDate[dateKey] = [];
      }
      auditsByDate[dateKey].push(audit);
    });

    // Sort dates
    const sortedDates = Object.keys(auditsByDate).sort();

    // Render audits by date
    doc.fontSize(10).font('Helvetica');
    
    sortedDates.forEach((dateKey, index) => {
      const date = new Date(dateKey);
      const dayAudits = auditsByDate[dateKey];

      // Check if we need a new page (leave space for footer)
      if (doc.y > doc.page.height - 100) {
        doc.addPage();
      }

      // Date header
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#1e40af')
        .text(format(date, 'EEEE, MMMM d, yyyy'), { continued: false });
      
      doc.moveDown(0.3);

      // Audits for this date
      dayAudits.forEach(audit => {
        // Status color
        let statusColor = '#6b7280'; // gray
        if (audit.status === 'completed') statusColor = '#16a34a'; // green
        else if (audit.status === 'in_progress') statusColor = '#2563eb'; // blue
        else if (audit.status === 'overdue') statusColor = '#dc2626'; // red

        doc.fontSize(10)
          .font('Helvetica')
          .fillColor('#000000')
          .text(`• ${audit.auditName}`, { indent: 20, continued: true });
        
        doc.fillColor(statusColor)
          .text(` [${audit.status.replace('_', ' ').toUpperCase()}]`, { continued: false });

        if (audit.auditorName) {
          doc.fontSize(9)
            .fillColor('#6b7280')
            .text(`  Auditor: ${audit.auditorName}`, { indent: 30 });
        }

        if (audit.serviceUserName) {
          doc.fontSize(9)
            .fillColor('#6b7280')
            .text(`  Service User: ${audit.serviceUserName}`, { indent: 30 });
        }

        doc.moveDown(0.3);
      });

      doc.moveDown(0.5);
    });

    // If no audits
    if (sortedDates.length === 0) {
      doc.fontSize(12)
        .fillColor('#6b7280')
        .text('No audits scheduled for this period.', { align: 'center' });
    }

    // Footer - add on current page without creating new page
    const footerY = doc.page.height - 30;
    if (doc.y < footerY - 20) {
      doc.fontSize(8)
        .fillColor('#9ca3af')
        .text(
          `Generated on ${format(new Date(), 'MMM d, yyyy HH:mm')}`,
          40,
          footerY,
          { align: 'center', width: doc.page.width - 80 }
        );
    }

    doc.end();
  });
}
