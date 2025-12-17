import PDFDocument from 'pdfkit';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addDays } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

interface AuditForPdf {
  id: number;
  auditName: string;
  scheduledDate: Date;
  status: string;
  auditorName: string | null;
  serviceUserName: string | null;
}

interface GroupedAudit {
  auditName: string;
  count: number;
  status: string;
}

// Color scheme for audit statuses
const STATUS_COLORS = {
  scheduled: { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' }, // Blue
  'in progress': { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' }, // Amber
  completed: { bg: '#d1fae5', text: '#065f46', border: '#10b981' }, // Green
  overdue: { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' }, // Red
};

export async function generateCalendarGridPdf(
  locationName: string,
  startDate: Date,
  endDate: Date,
  audits: AuditForPdf[]
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4',
        layout: 'landscape', // Landscape for better calendar view
        margins: { top: 40, bottom: 40, left: 40, right: 40 }
      });
      
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Title
      const dateRangeText = `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`;
      doc.fontSize(18)
        .font('Helvetica-Bold')
        .text(`${locationName} - Audit Calendar`, { align: 'center' });
      
      doc.fontSize(12)
        .font('Helvetica')
        .fillColor('#6b7280')
        .text(dateRangeText, { align: 'center' });
      
      doc.moveDown(0.5);

      // Add color legend
      drawLegend(doc);
      doc.moveDown(1);

      // Group audits by date and type
      const auditsByDate = groupAuditsByDate(audits);

      // Determine if we're showing a month view or custom range
      const isMonthView = format(startDate, 'yyyy-MM') === format(endDate, 'yyyy-MM');
      
      if (isMonthView) {
        // Draw single month calendar
        drawMonthCalendar(doc, startDate, auditsByDate);
      } else {
        // Draw multi-month or custom range calendars
        let currentDate = startOfMonth(startDate);
        const finalDate = endOfMonth(endDate);
        
        while (currentDate <= finalDate) {
          drawMonthCalendar(doc, currentDate, auditsByDate);
          currentDate = addDays(endOfMonth(currentDate), 1);
          
          if (currentDate <= finalDate) {
            doc.addPage();
          }
        }
      }

      // Footer - place at current Y position with some spacing
      doc.moveDown(1);
      doc.fontSize(8)
        .fillColor('#9ca3af')
        .text(
          `Generated on ${formatInTimeZone(new Date(), 'Europe/London', 'MMM d, yyyy HH:mm')} GMT`,
          { align: 'center' }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function drawLegend(doc: PDFKit.PDFDocument) {
  const legendY = doc.y;
  const legendX = 40;
  const boxSize = 12;
  const spacing = 100;

  doc.fontSize(10).font('Helvetica-Bold').fillColor('#000').text('Status Legend:', legendX, legendY);
  
  let x = legendX + 95;
  const statuses = [
    { label: 'Scheduled', key: 'scheduled' },
    { label: 'In Progress', key: 'in progress' },
    { label: 'Completed', key: 'completed' },
    { label: 'Overdue', key: 'overdue' },
  ];

  statuses.forEach((status) => {
    const colors = STATUS_COLORS[status.key as keyof typeof STATUS_COLORS];
    
    // Draw colored box
    doc.rect(x, legendY, boxSize, boxSize)
      .fillAndStroke(colors.bg, colors.border);
    
    // Draw label
    doc.fontSize(9)
      .font('Helvetica')
      .fillColor('#000')
      .text(status.label, x + boxSize + 5, legendY + 1);
    
    x += spacing;
  });

  doc.y = legendY + boxSize + 5;
}

function groupAuditsByDate(audits: AuditForPdf[]): Record<string, GroupedAudit[]> {
  const grouped: Record<string, Record<string, GroupedAudit>> = {};

  audits.forEach(audit => {
    const dateKey = format(new Date(audit.scheduledDate), 'yyyy-MM-dd');
    
    if (!grouped[dateKey]) {
      grouped[dateKey] = {};
    }

    const auditKey = `${audit.auditName}-${audit.status}`;
    
    if (!grouped[dateKey][auditKey]) {
      grouped[dateKey][auditKey] = {
        auditName: audit.auditName,
        count: 0,
        status: audit.status.toLowerCase(),
      };
    }

    grouped[dateKey][auditKey].count++;
  });

  // Convert to array format
  const result: Record<string, GroupedAudit[]> = {};
  Object.keys(grouped).forEach(dateKey => {
    result[dateKey] = Object.values(grouped[dateKey]);
  });

  return result;
}

function drawMonthCalendar(
  doc: PDFKit.PDFDocument,
  monthDate: Date,
  auditsByDate: Record<string, GroupedAudit[]>
) {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  
  // Month title
  doc.fontSize(14)
    .font('Helvetica-Bold')
    .fillColor('#000')
    .text(format(monthDate, 'MMMM yyyy'), { align: 'center' });
  
  doc.moveDown(0.5);

  // Calendar grid dimensions
  const startX = 40;
  const startY = doc.y;
  const cellWidth = (doc.page.width - 80) / 7; // 7 days
  const cellHeight = 90;
  const headerHeight = 25;

  // Draw day headers
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  dayNames.forEach((day, index) => {
    const x = startX + (index * cellWidth);
    doc.fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#374151')
      .text(day, x + 5, startY, { width: cellWidth - 10, align: 'center' });
  });

  // Draw grid and dates
  let currentY = startY + headerHeight;
  const firstDayOfWeek = getDay(monthStart);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  let dayIndex = 0;
  let weekRow = 0;

  // Fill empty cells before month starts
  for (let i = 0; i < firstDayOfWeek; i++) {
    const x = startX + (i * cellWidth);
    doc.rect(x, currentY, cellWidth, cellHeight).stroke('#e5e7eb');
  }

  // Draw each day
  daysInMonth.forEach((day, index) => {
    const dayOfWeek = (firstDayOfWeek + index) % 7;
    const x = startX + (dayOfWeek * cellWidth);
    const y = currentY + (Math.floor((firstDayOfWeek + index) / 7) * cellHeight);

    // Draw cell border
    doc.rect(x, y, cellWidth, cellHeight).stroke('#e5e7eb');

    // Draw day number
    doc.fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#374151')
      .text(format(day, 'd'), x + 5, y + 5, { width: cellWidth - 10, align: 'right' });

    // Draw audits for this day
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayAudits = auditsByDate[dateKey] || [];
    
    let auditY = y + 22;
    dayAudits.slice(0, 3).forEach(audit => { // Show max 3 audits per day
      const colors = STATUS_COLORS[audit.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.scheduled;
      const auditText = audit.count > 1 ? `${audit.auditName} (${audit.count})` : audit.auditName;
      
      // Draw colored badge
      const badgeX = x + 3;
      const badgeWidth = cellWidth - 6;
      const badgeHeight = 16;
      
      doc.roundedRect(badgeX, auditY, badgeWidth, badgeHeight, 3)
        .fillAndStroke(colors.bg, colors.border);
      
      // Draw audit text
      doc.fontSize(7)
        .font('Helvetica')
        .fillColor(colors.text)
        .text(auditText, badgeX + 3, auditY + 4, {
          width: badgeWidth - 6,
          height: badgeHeight,
          ellipsis: true,
        });
      
      auditY += badgeHeight + 2;
    });

    // Show "+X more" if there are more audits
    if (dayAudits.length > 3) {
      doc.fontSize(7)
        .font('Helvetica')
        .fillColor('#6b7280')
        .text(`+${dayAudits.length - 3} more`, x + 5, auditY, {
          width: cellWidth - 10,
        });
    }
  });

  // Move to next position
  const totalWeeks = Math.ceil((firstDayOfWeek + daysInMonth.length) / 7);
  doc.y = currentY + (totalWeeks * cellHeight) + 20;
}
