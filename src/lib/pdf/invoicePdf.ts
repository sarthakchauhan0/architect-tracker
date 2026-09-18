import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Client, Payment, Expense, ArchitectSettings } from '@/types';
import { formatDate, formatPdfCurrency } from '../formatters';

export const generateInvoicePdf = (
  client: Client,
  payments: Payment[],
  expenses: Expense[],
  settings: ArchitectSettings,
  invoiceNumber: string,
  invoiceDate: string = new Date().toISOString()
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const currencySymbol = settings.currencySymbol || '₹';

  // 1. Header Banner - Architect Branding
  doc.setFillColor(15, 23, 42); // Obsidian Slate
  doc.rect(0, 0, pageWidth, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text(settings.firmName.toUpperCase(), 14, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`${settings.architectName} | Principal Architect`, 14, 19);
  doc.text(`${settings.phone} | ${settings.email}`, 14, 24);
  doc.text(settings.address, 14, 28.5);

  // Right-aligned INVOICE watermark/text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(217, 119, 6); // Warm Amber
  doc.text('INVOICE', pageWidth - 14, 18, { align: 'right' });

  // 2. Metadata Section: Invoice # & Dates vs Bill To
  let currentY = 42;

  // Invoice Details Box (Right side)
  const metaBoxX = pageWidth / 2 + 10;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(metaBoxX, currentY, pageWidth - metaBoxX - 14, 30, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Invoice Number:', metaBoxX + 5, currentY + 8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(invoiceNumber, metaBoxX + 35, currentY + 8);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Invoice Date:', metaBoxX + 5, currentY + 16);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(formatDate(invoiceDate), metaBoxX + 35, currentY + 16);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Project Status:', metaBoxX + 5, currentY + 24);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(client.status, metaBoxX + 35, currentY + 24);

  // Bill To (Left side)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.text('BILLED TO:', 14, currentY + 4);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(client.name, 14, currentY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Project: ${client.projectName}`, 14, currentY + 17);
  if (client.phone) doc.text(`Phone: ${client.phone}`, 14, currentY + 22);
  const addressLines = doc.splitTextToSize(`Site: ${client.address || 'Site Address'}`, 80);
  doc.text(addressLines, 14, currentY + 27);

  // 3. Line Items: Agreed Fee & Billable Expenses
  currentY = 80;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Professional Architectural Services & Expenses', 14, currentY);

  const totalFee = Number(client.totalProjectAmount) || 0;
  const billableExpenses = expenses.filter((e) => e.billableToClient);
  const totalBillableExpenses = billableExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const chargesTable: (string | number)[][] = [
    [
      '1',
      `Architectural Consultation & Project Scope\nProject: ${client.projectName} (${client.projectType})`,
      formatPdfCurrency(totalFee, currencySymbol),
    ],
  ];

  billableExpenses.forEach((exp, idx) => {
    chargesTable.push([
      String(idx + 2),
      `Reimbursable Site Expense: ${exp.description} (${formatDate(exp.date)})`,
      formatPdfCurrency(Number(exp.amount), currencySymbol),
    ]);
  });

  const grossPayable = totalFee + totalBillableExpenses;

  autoTable(doc, {
    startY: currentY + 4,
    head: [['#', 'Item Description & Scope', 'Amount']],
    body: chargesTable,
    margin: { left: 14, right: 14 },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 41, 59],
      cellPadding: 3.5,
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 44, halign: 'right', fontStyle: 'bold' },
    },
    theme: 'striped',
  });

  let nextY = (doc as any).lastAutoTable?.finalY || currentY + 30;

  // 4. Payments Received Table
  nextY += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Record of Payments Received to Date', 14, nextY);

  const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const paymentsTableData = payments.map((p, idx) => [
    `#${idx + 1}`,
    formatDate(p.date),
    p.type,
    p.mode,
    p.note || '-',
    formatPdfCurrency(Number(p.amount), currencySymbol),
  ]);

  if (paymentsTableData.length === 0) {
    paymentsTableData.push(['-', '-', 'No payments recorded yet', '-', '-', formatPdfCurrency(0, currencySymbol)]);
  }

  autoTable(doc, {
    startY: nextY + 4,
    head: [['#', 'Date', 'Stage / Type', 'Payment Mode', 'Reference / Note', 'Amount Paid']],
    body: paymentsTableData,
    margin: { left: 14, right: 14 },
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 24 },
      2: { cellWidth: 26 },
      3: { cellWidth: 26 },
      4: { cellWidth: 'auto' },
      5: { cellWidth: 38, halign: 'right', fontStyle: 'bold' },
    },
    theme: 'plain',
  });

  nextY = (doc as any).lastAutoTable?.finalY || nextY + 30;

  // 5. Total Computation & Net Balance Due Box
  const balanceDue = grossPayable - totalPaid;

  const summaryBoxWidth = 88;
  const summaryBoxX = pageWidth - 14 - summaryBoxWidth;
  nextY += 6;

  // Gross, Paid, Balance summary
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(summaryBoxX, nextY, summaryBoxWidth, 38, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Total Agreed Fee:', summaryBoxX + 6, nextY + 7);
  doc.text(formatPdfCurrency(totalFee, currencySymbol), summaryBoxX + summaryBoxWidth - 6, nextY + 7, { align: 'right' });

  doc.text('Billable Site Expenses:', summaryBoxX + 6, nextY + 13);
  doc.text(formatPdfCurrency(totalBillableExpenses, currencySymbol), summaryBoxX + summaryBoxWidth - 6, nextY + 13, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129); // Green for payments
  doc.text('Less: Total Payments Received:', summaryBoxX + 6, nextY + 20);
  doc.text(`- ${formatPdfCurrency(totalPaid, currencySymbol)}`, summaryBoxX + summaryBoxWidth - 6, nextY + 20, { align: 'right' });

  // Prominent Balance Due Banner inside box
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(summaryBoxX + 4, nextY + 24, summaryBoxWidth - 8, 10, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('BALANCE DUE:', summaryBoxX + 7, nextY + 30.5);
  doc.setTextColor(245, 158, 11); // Amber
  doc.text(formatPdfCurrency(balanceDue, currencySymbol), summaryBoxX + summaryBoxWidth - 7, nextY + 30.5, { align: 'right' });

  // 6. Bank Details hidden for now
  // 7. Footer Sign-off
  const footerY = nextY + 50;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Thank you for partnering with us on your architecture project.', 14, footerY);

  doc.setDrawColor(203, 213, 225);
  doc.line(pageWidth - 65, footerY - 5, pageWidth - 14, footerY - 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(settings.architectName, pageWidth - 65, footerY);
  doc.text(settings.firmName, pageWidth - 65, footerY + 4);

  // Trigger download
  const safeProjectName = client.projectName.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`${invoiceNumber}_${safeProjectName}_Invoice.pdf`);
};
