import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Client, Visit, Issue, ArchitectSettings } from '@/types';
import { formatDate } from '../formatters';

export const generateProgressUpdatePdf = (
  client: Client,
  visits: Visit[],
  issues: Issue[],
  settings: ArchitectSettings,
  includeIssues: boolean = true
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 18;

  // Header - Firm & Architect Branding
  doc.setFillColor(15, 23, 42); // Dark Obsidian Slate
  doc.rect(0, 0, pageWidth, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text((settings.firmName || 'Rahul Sharma Architects').toUpperCase(), 14, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`${settings.architectName || 'Ar. Rahul Sharma'} | Principal Architect`, 14, 19);
  doc.text(`${settings.phone || '+91 8130950761'} | ${settings.email || 'connect@rahulsharmaarchitects.com'}`, 14, 24);
  doc.text(settings.address || 'B-1, Janak Puri, New Delhi, 110059', 14, 28.5);

  // Document Title Banner
  currentY = 42;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('PROJECT PROGRESS & SITE VISIT REPORT', 14, currentY);

  const reportDate = formatDate(new Date());
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on: ${reportDate}`, pageWidth - 14, currentY, { align: 'right' });

  // Project Details Card
  currentY += 8;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, pageWidth - 28, 38, 2, 2, 'FD');

  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);

  // Left Column
  doc.setFont('helvetica', 'bold');
  doc.text('Client Name:', 18, currentY + 8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(client.name, 48, currentY + 8);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Project:', 18, currentY + 16);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${client.projectName} (${client.projectType})`, 48, currentY + 16);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Site Address:', 18, currentY + 24);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  const addressLines = doc.splitTextToSize(client.address || 'N/A', 80);
  doc.text(addressLines, 48, currentY + 24);

  // Right Column
  const rightColX = pageWidth / 2 + 10;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Project Status:', rightColX, currentY + 8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(client.status === 'Completed' ? 16 : 217, client.status === 'Completed' ? 185 : 119, client.status === 'Completed' ? 129 : 6);
  doc.text(client.status.toUpperCase(), rightColX + 32, currentY + 8);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Start Date:', rightColX, currentY + 16);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(formatDate(client.startDate), rightColX + 32, currentY + 16);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Target Finish:', rightColX, currentY + 24);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(formatDate(client.estimatedCompletionDate), rightColX + 32, currentY + 24);

  // Visit Progress Summary Bar
  currentY += 46;
  const visitsDone = visits.length;
  const visitsPlanned = client.totalVisitsPlanned || 1;
  const progressPct = Math.min(100, Math.round((visitsDone / visitsPlanned) * 100));

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, currentY, pageWidth - 28, 16, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`Site Visit Progress: ${visitsDone} of ${client.totalVisitsPlanned} Visits Completed (${progressPct}%)`, 18, currentY + 10);

  // Progress Bar Graphics
  const barWidth = 60;
  const barX = pageWidth - 14 - barWidth - 6;
  doc.setFillColor(203, 213, 225);
  doc.roundedRect(barX, currentY + 5, barWidth, 6, 1, 1, 'F');
  if (progressPct > 0) {
    doc.setFillColor(217, 119, 6); // Warm Amber
    doc.roundedRect(barX, currentY + 5, (barWidth * progressPct) / 100, 6, 1, 1, 'F');
  }

  // Site Visits Table
  currentY += 24;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Record of Site Visits & Inspections', 14, currentY);

  const visitsTableData = visits.map((v, index) => [
    `#${visits.length - index}`,
    formatDate(v.date),
    v.purpose || 'Site Inspection',
    v.notes || 'Routine progress review & quality check.',
  ]);

  if (visitsTableData.length === 0) {
    visitsTableData.push(['-', '-', 'No site visits recorded yet', '-']);
  }

  autoTable(doc, {
    startY: currentY + 4,
    head: [['Visit', 'Date', 'Purpose', 'Observations & Action Notes']],
    body: visitsTableData,
    margin: { left: 14, right: 14 },
    headStyles: {
      fillColor: [24, 32, 47],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 16, halign: 'center' },
      1: { cellWidth: 26 },
      2: { cellWidth: 44 },
      3: { cellWidth: 'auto' },
    },
    theme: 'striped',
  });

  let finalY = (doc as any).lastAutoTable?.finalY || currentY + 20;

  // Optional: Issues / Notes section
  if (includeIssues && issues.length > 0) {
    if (finalY > 230) {
      doc.addPage();
      finalY = 20;
    } else {
      finalY += 10;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('Site Coordination & Follow-up Items', 14, finalY);

    const issuesData = issues.map((item) => [
      formatDate(item.date),
      item.description,
      item.status.toUpperCase(),
      item.resolutionNote || '-',
    ]);

    autoTable(doc, {
      startY: finalY + 4,
      head: [['Date', 'Item Description', 'Status', 'Resolution / Status Note']],
      body: issuesData,
      margin: { left: 14, right: 14 },
      headStyles: {
        fillColor: [71, 85, 105],
        textColor: [255, 255, 255],
        fontSize: 8.5,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59],
      },
      columnStyles: {
        0: { cellWidth: 26 },
        1: { cellWidth: 60 },
        2: { cellWidth: 24, halign: 'center' },
        3: { cellWidth: 'auto' },
      },
      theme: 'grid',
    });

    finalY = (doc as any).lastAutoTable?.finalY || finalY + 20;
  }

  // Footer & Sign-off
  if (finalY > 250) {
    doc.addPage();
    finalY = 30;
  } else {
    finalY += 18;
  }

  doc.setDrawColor(203, 213, 225);
  doc.line(pageWidth - 65, finalY, pageWidth - 14, finalY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(settings.architectName, pageWidth - 65, finalY + 5);
  doc.text(`Principal Architect, ${settings.firmName}`, pageWidth - 65, finalY + 9);

  // Trigger download
  const safeProjectName = client.projectName.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`${safeProjectName}_Progress_Report_${reportDate}.pdf`);
};
