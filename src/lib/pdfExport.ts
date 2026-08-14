import { jsPDF } from "jspdf";
import type { Transaction, Farmer } from "@/types";
import { formatFarmerDisplayName } from "@/lib/farmerDisplay";
import { supabaseUrl } from "@/lib/supabase";

const MARGIN = 15;
const PAGE_WIDTH_P = 210;
const PAGE_HEIGHT_P = 297;
const PAGE_WIDTH_L = 297;
const PAGE_HEIGHT_L = 210;
const HEADER_HEIGHT = 45;
const FOOTER_HEIGHT = 34;
const CONTENT_TOP = MARGIN + HEADER_HEIGHT;
const CONTENT_BOTTOM = PAGE_HEIGHT_P - FOOTER_HEIGHT;
const ROW_HEIGHT = 8;
const HEADER_FONT = 10;
const BODY_FONT = 9;
const LOGOS_BUCKET = "logos";

function getPageDimensions(doc: jsPDF) {
  const isLandscape = doc.internal.pageSize.getWidth() > doc.internal.pageSize.getHeight();
  return {
    width: isLandscape ? PAGE_WIDTH_L : PAGE_WIDTH_P,
    height: isLandscape ? PAGE_HEIGHT_L : PAGE_HEIGHT_P,
    top: MARGIN + HEADER_HEIGHT,
    bottom: (isLandscape ? PAGE_HEIGHT_L : PAGE_HEIGHT_P) - FOOTER_HEIGHT,
  };
}

function buildLogoUrl(path: string): string {
  const base = supabaseUrl.replace(/\/$/, "");
  const cleanPath = path.replace(/^\//, "");
  return `${base}/storage/v1/object/public/${LOGOS_BUCKET}/${cleanPath}`;
}

function getLogoPaths(): string[] {
  const prefix = (import.meta.env.VITE_LOGOS_PATH_PREFIX as string) || "";
  const pathJoin = (p: string, n: string) => (p ? (p.endsWith("/") ? p + n : p + "/" + n) : n);
  // Required order: Agri Logo, City of Passi Logo, Palangga Passi Logo
  return ["agriculture-office-logo.png", "passi-city-logo.png", "palangga-passi-logo.png"].map((n) =>
    pathJoin(prefix, n)
  );
}

/** Fetch image as base64 for embedding in PDF */
async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** Add logo header and system name to PDF */
async function addPdfHeader(doc: jsPDF, reportTitle: string): Promise<void> {
  const { width } = getPageDimensions(doc);
  let y = MARGIN;

  // Set standard font for the entire header to ensure consistency across pages
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);

  // Try to add logos (center row)
  const logoPaths = getLogoPaths();
  const logoSize = 18;
  const logoGap = 8;
  const totalLogosWidth = logoPaths.length * logoSize + (logoPaths.length - 1) * logoGap;
  let startX = (width - totalLogosWidth) / 2;

  for (const path of logoPaths) {
    const url = buildLogoUrl(path);
    const base64 = await fetchImageAsBase64(url);
    if (base64) {
      try {
        doc.addImage(base64, "PNG", startX, y, logoSize, logoSize);
      } catch {
        // Skip if image fails to add
      }
    }
    startX += logoSize + logoGap;
  }

  y += logoSize + 4;

  // System name
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Farmers Record and Transactions System", width / 2, y, { align: "center" });
  y += 6;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("City of Passi Agriculture Office", width / 2, y, { align: "center" });
  y += 6;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Brgy. Sablogon, City of Passi, Iloilo", width / 2, y, { align: "center" });
  y += 6;

  // Report title
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(reportTitle, width / 2, y, { align: "center" });
  y += 6;

  // Horizontal line
  doc.setDrawColor(139, 115, 85);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, width - MARGIN, y);
  
  // Reset font to normal for the content that follows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(BODY_FONT);
}

/** Add footer with page number and date */
function addPdfFooter(doc: jsPDF, pageNum: number, totalPages: number): void {
  const { width, height } = getPageDimensions(doc);
  const y = height - 8;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);

  const dateStr = new Date().toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
  doc.text(`Generated on: ${dateStr}`, MARGIN, y);
  doc.text(`Page ${pageNum} of ${totalPages}`, width - MARGIN, y, { align: "right" });
  doc.setTextColor(0, 0, 0);
}

/** Add signature block - ONLY on the last page */
function addSignatureToLastPageOnly(doc: jsPDF): void {
  const totalPages = doc.getNumberOfPages();
  if (totalPages === 0) return;

  // Set page to the last page and add signature
  doc.setPage(totalPages);
  const { width, height } = getPageDimensions(doc);
  
  const signatureLineY = height - 20;
  const signatureTextY = signatureLineY + 4;
  const signatureStartX = width - 95;
  const signatureEndX = width - MARGIN;
  
  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.3);
  doc.line(signatureStartX, signatureLineY, signatureEndX, signatureLineY);
  
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("LIELA A. ROSBERO", (signatureStartX + signatureEndX) / 2, signatureTextY, { align: "center" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(70, 70, 70);
  doc.text("( Senior Agriculturist)", (signatureStartX + signatureEndX) / 2, signatureTextY + 4, { align: "center" });
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
}

/** Max chars per column at 9pt (approx 2mm per char) - prevents overlap */
const MAX_CHARS: Record<string, number> = {
  date: 12,
  time: 12,
  farmer: 40,
  type: 25,
  desc: 50,
  notes: 40,
  dateVisit: 15,
  name: 30,
  gender: 10,
  barangay: 25,
  org: 30,
  phone: 15,
};

function truncateToFit(text: string, key: keyof typeof MAX_CHARS): string {
  const max = MAX_CHARS[key] ?? 20;
  if (text.length <= max) return text;
  return text.slice(0, max - 2) + "..";
}

function buildPdfTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

// Shared table style for all printable reports (keeps visual consistency)
const TABLE_HEADER_FILL: [number, number, number] = [232, 242, 255];
const TABLE_HEADER_TEXT: [number, number, number] = [30, 64, 175];
const TABLE_BODY_TEXT: [number, number, number] = [31, 41, 55];
const TABLE_BORDER: [number, number, number] = [191, 219, 254];

function drawStandardTableHeader(
  doc: jsPDF,
  y: number,
  headers: string[],
  colWidths: number[],
  paddingX = 2
): number {
  const contentWidth = colWidths.reduce((a, b) => a + b, 0);
  doc.setFontSize(HEADER_FONT);
  doc.setFont("helvetica", "bold");
  doc.setFillColor(...TABLE_HEADER_FILL);
  doc.setDrawColor(...TABLE_BORDER);
  doc.rect(MARGIN, y - 5, contentWidth, ROW_HEIGHT, "FD");
  doc.setTextColor(...TABLE_HEADER_TEXT);

  let x = MARGIN;
  headers.forEach((h, i) => {
    doc.text(h, x + paddingX, y + 2);
    x += colWidths[i];
  });
  doc.setTextColor(...TABLE_BODY_TEXT);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(BODY_FONT);
  return y + ROW_HEIGHT;
}

/** Add footer to all pages (page numbers and dates) and signature only to last page */
function addFootersToAllPages(doc: jsPDF): void {
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    addPdfFooter(doc, i, total);
  }
  // Add signature ONLY to the last page after all other footers are added
  addSignatureToLastPageOnly(doc);
}

/** Export visits list (by day or month) to PDF */
export async function exportVisitsToPdf(
  visits: Array<Transaction & { farmerName: string }>,
  options: { month: number | null; year: number; day?: number }
): Promise<void> {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const { top, bottom } = getPageDimensions(doc);

  let periodLabel = `${options.year}`;
  if (options.month !== null) {
    periodLabel = options.day !== undefined
      ? new Date(options.year, options.month - 1, options.day).toLocaleDateString("en-PH", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : new Date(options.year, options.month - 1).toLocaleDateString("en-PH", {
          year: "numeric",
          month: "long",
        });
  }

  await addPdfHeader(doc, "Visits Report");
  let y = top;

  doc.setFontSize(BODY_FONT);
  doc.setFont("helvetica", "normal");
  doc.text(`Period: ${periodLabel}`, MARGIN, y);
  doc.text(`Total visits: ${visits.length}`, MARGIN, y + 6);
  y += 18;

  const monthStr = options.month !== null ? `-${options.month}` : "";
  const dayStr = options.day !== undefined ? `-${options.day}` : "";
  const filename = `visits-${options.year}${monthStr}${dayStr}.pdf`;

  if (visits.length === 0) {
    doc.text("No visits recorded for this period.", MARGIN, y);
    addFootersToAllPages(doc);
    doc.save(filename);
    return;
  }

  const colWidths = [26, 20, 54, 34, 70, 63];
  const headers = ["Date", "Time", "Farmer", "Type", "Description", "Notes"];
  const lineHeight = 4;
  const cellPaddingX = 2;
  const cellPaddingTop = 3;
  const rowBottomPadding = 2;

  const drawHeader = () => {
    y = drawStandardTableHeader(doc, y, headers, colWidths, cellPaddingX);
  };

  drawHeader();

  const rows = visits.map((v) => {
    const date = new Date(v.officeVisitAt || v.createdAt);
    const dateStr = date.toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "2-digit",
    });
    const timeStr = date.toLocaleTimeString("en-PH", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return [
      dateStr,
      timeStr,
      v.farmerName || "-",
      v.transactionType || "-",
      v.description || "-",
      v.notes || "-",
    ];
  });

  for (const row of rows) {
    const rowLines = row.map((text, i) =>
      doc.splitTextToSize(String(text), Math.max(8, colWidths[i] - cellPaddingX * 2))
    );
    const maxLines = Math.max(...rowLines.map((lines) => lines.length), 1);
    const rowHeight = cellPaddingTop + maxLines * lineHeight + rowBottomPadding;

    if (y + rowHeight > bottom) {
      doc.addPage();
      await addPdfHeader(doc, "Visits Report (continued)");
      y = top + 6; // Add spacing after header
      drawHeader();
    }

    let x = MARGIN;
    rowLines.forEach((lines, i) => {
      doc.text(lines, x + cellPaddingX, y + cellPaddingTop);
      x += colWidths[i];
    });
    y += rowHeight;
  }

  addFootersToAllPages(doc);
  doc.save(filename);
}

/** Export farmers list to PDF with current filters */
export async function exportFarmersToPdf(
  farmers: Farmer[],
  filters: { barangay: string; gender: string; agency: string }
): Promise<void> {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const { top, bottom } = getPageDimensions(doc);

  await addPdfHeader(doc, "Farmers Record List Report");
  let y = top;

  doc.setFontSize(BODY_FONT);
  doc.setFont("helvetica", "bold");

  const filterLines: string[] = [];
  if (filters.barangay && filters.barangay !== "all") filterLines.push(`Barangay: ${filters.barangay}`);
  if (filters.gender && filters.gender !== "all") filterLines.push(`Gender: ${filters.gender}`);
  if (filters.agency && filters.agency !== "all") filterLines.push(`Agency: ${filters.agency}`);

  if (filterLines.length > 0) {
    doc.text("Applied Filters:", MARGIN, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    for (const line of filterLines) {
      doc.text(`• ${line}`, MARGIN + 4, y);
      y += 5;
    }
    y += 2;
  }
  doc.setFont("helvetica", "bold");
  doc.text(`Total farmers: ${farmers.length}`, MARGIN, y);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleDateString("en-PH", { dateStyle: "long" })}`, MARGIN, y + 6);
  y += 12;

  const filename = `farmers-directory-${buildPdfTimestamp()}.pdf`;

  if (farmers.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(BODY_FONT);
    doc.text("No farmers found matching the criteria.", MARGIN, y);
    addFootersToAllPages(doc);
    doc.save(filename);
    return;
  }

  // Landscape A4 width is 297mm. Margins 15mm each -> 267mm available.
  const colWidths = [72, 22, 45, 50, 30, 48];
  const headers = ["Farmer Name", "Gender", "Barangay", "Agency", "Phone", "Date Encoded"];
  const lineHeight = 4;
  const cellPaddingX = 2;
  const cellPaddingTop = 3;
  const rowBottomPadding = 2;

  const drawHeader = () => {
    y = drawStandardTableHeader(doc, y, headers, colWidths, cellPaddingX);
  };

  drawHeader();

  for (const f of farmers) {
    const dateEncoded =
      f.dateEncoded != null
        ? new Date(f.dateEncoded).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
        : "-";
    const row = [
      formatFarmerDisplayName(f) || "-",
      f.gender || "-",
      f.farmerAddress1 || "-",
      f.agency || "-",
      f.phone || "-",
      dateEncoded,
    ];
    const rowLines = row.map((text, i) =>
      doc.splitTextToSize(String(text), Math.max(6, colWidths[i] - cellPaddingX * 2))
    );
    const maxLines = Math.max(...rowLines.map((lines) => lines.length), 1);
    const rowHeight = cellPaddingTop + maxLines * lineHeight + rowBottomPadding;

    if (y + rowHeight > bottom) {
      doc.addPage();
      await addPdfHeader(doc, "Farmers Record List Report (continued)");
      y = top + 6; // Add spacing after header
      drawHeader();
    }

    let x = MARGIN;
    rowLines.forEach((lines, i) => {
      doc.text(lines, x + cellPaddingX, y + cellPaddingTop);
      x += colWidths[i];
    });
    y += rowHeight;
  }

  addFootersToAllPages(doc);
  doc.save(filename);
}

/** Export a single farmer's transaction history to PDF */
export async function exportProfileTransactionsToPdf(
  farmerName: string,
  transactions: Transaction[],
  farmerMeta?: { barangay?: string; agency?: string }
): Promise<void> {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const { top, bottom } = getPageDimensions(doc);

  await addPdfHeader(doc, "Transaction History Report");
  let y = top;

  doc.setFontSize(BODY_FONT);
  doc.setFont("helvetica", "bold");
  doc.text(`Farmer: ${farmerName}`, MARGIN, y);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleDateString("en-PH", { dateStyle: "long" })}`, MARGIN, y + 6);
  y += 18;

  if (transactions.length === 0) {
    doc.text("No transactions recorded.", MARGIN, y);
    addFootersToAllPages(doc);
    doc.save(`transaction-history-${farmerName.replace(/\s+/g, "-")}-${buildPdfTimestamp()}.pdf`);
    return;
  }

  const colWidths = [58, 32, 32, 40, 24, 24, 57];
  const headers = ["Farmer Name", "Barangay", "Agency", "Transaction Type", "Status", "Date of Visit", "Notes"];
  const lineHeight = 4;
  const cellPaddingX = 2;
  const cellPaddingTop = 3;
  const rowBottomPadding = 2;

  const drawHeader = () => {
    y = drawStandardTableHeader(doc, y, headers, colWidths, cellPaddingX);
  };

  drawHeader();

  const sorted = [...transactions].sort((a, b) => new Date(b.officeVisitAt || b.createdAt).getTime() - new Date(a.officeVisitAt || a.createdAt).getTime());
  for (const tx of sorted) {
    const date = new Date(tx.officeVisitAt || tx.createdAt);
    const dateStr = date.toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const rowData = [
      farmerName || "-",
      farmerMeta?.barangay || "-",
      farmerMeta?.agency || "-",
      tx.transactionType || "-",
      tx.status === "done" ? "Done" : "Ongoing",
      dateStr,
      tx.notes || "-",
    ];
    const rowLines = rowData.map((text, i) =>
      doc.splitTextToSize(String(text), Math.max(6, colWidths[i] - cellPaddingX * 2))
    );
    const maxLines = Math.max(...rowLines.map((lines) => lines.length), 1);
    const rowHeight = cellPaddingTop + maxLines * lineHeight + rowBottomPadding;

    if (y + rowHeight > bottom) {
      doc.addPage();
      await addPdfHeader(doc, "Transaction History Report (continued)");
      y = top + 6; // Add spacing after header
      drawHeader();
    }

    let x = MARGIN;
    rowLines.forEach((lines, i) => {
      doc.text(lines, x + cellPaddingX, y + cellPaddingTop);
      x += colWidths[i];
    });
    y += rowHeight;
  }

  addFootersToAllPages(doc);
  doc.save(`transaction-history-${farmerName.replace(/\s+/g, "-")}-${buildPdfTimestamp()}.pdf`);
}

/** Export all transactions list (from history page) to PDF */
export async function exportAllTransactionsToPdf(
  transactions: Array<Transaction & { farmerName: string; barangay?: string; agency?: string }>,
  appliedFilters: string[]
): Promise<void> {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const { top, bottom } = getPageDimensions(doc);

  await addPdfHeader(doc, "Transaction History Report");
  let y = top;

  // Add filters info
  if (appliedFilters.length > 0) {
    doc.setFontSize(BODY_FONT);
    doc.setFont("helvetica", "bold");
    doc.text("Applied Filters:", MARGIN, y);
    y += 6;
    
    doc.setFont("helvetica", "normal");
    for (const filter of appliedFilters) {
      if (y > bottom - 10) {
        doc.addPage();
        await addPdfHeader(doc, "Transaction History Report (continued)");
        y = top + 6; // Add spacing after header
      }
      doc.text(`• ${filter}`, MARGIN + 4, y);
      y += 5;
    }
    y += 5;
  }

  doc.setFontSize(BODY_FONT);
  doc.setFont("helvetica", "bold");
  doc.text(`Total Records: ${transactions.length}`, MARGIN, y);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleDateString("en-PH", { dateStyle: "long" })}`, MARGIN, y + 6);
  y += 18;

  if (transactions.length === 0) {
    doc.text("No records match the selected filters.", MARGIN, y);
    addFootersToAllPages(doc);
    doc.save(`transaction-history-report-${buildPdfTimestamp()}.pdf`);
    return;
  }

  // Landscape A4: 297mm width -> 267mm usable width with 15mm margins.
  const colWidths = [58, 32, 32, 40, 24, 24, 57];
  const headers = ["Farmer Name", "Barangay", "Agency", "Transaction Type", "Status", "Date of Visit", "Notes"];
  const contentWidth = colWidths.reduce((a, b) => a + b, 0);
  const lineHeight = 4;
  const cellPaddingX = 2;
  const cellPaddingTop = 3;
  const rowBottomPadding = 2;

  const drawHeader = () => {
    doc.setFontSize(HEADER_FONT);
    doc.setFont("helvetica", "bold");
    doc.setFillColor(238, 245, 238);
    doc.rect(MARGIN, y - 5, contentWidth, ROW_HEIGHT, "F");
    let x = MARGIN;
    headers.forEach((h, i) => {
      doc.text(h, x + cellPaddingX, y + 2);
      x += colWidths[i];
    });
    y += ROW_HEIGHT;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(BODY_FONT);
  };

  drawHeader();

  for (const tx of transactions) {
    const date = new Date(tx.officeVisitAt || tx.createdAt);
    const dateStr = date.toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const rowData = [
      tx.farmerName || "-",
      tx.barangay || "-",
      tx.agency || "-",
      tx.transactionType || "-",
      tx.status === "done" ? "Done" : "Ongoing",
      dateStr,
      tx.notes || "-",
    ];

    const rowLines = rowData.map((text, i) =>
      doc.splitTextToSize(String(text), Math.max(6, colWidths[i] - cellPaddingX * 2))
    );
    const maxLines = Math.max(...rowLines.map((lines) => lines.length), 1);
    const rowHeight = cellPaddingTop + maxLines * lineHeight + rowBottomPadding;

    if (y + rowHeight > bottom) {
      doc.addPage();
      await addPdfHeader(doc, "Transaction History Report (continued)");
      y = top + 6; // Add spacing after header
      drawHeader();
    }

    let xRow = MARGIN;
    rowLines.forEach((lines, i) => {
      doc.text(lines, xRow + cellPaddingX, y + cellPaddingTop);
      xRow += colWidths[i];
    });
    y += rowHeight;
  }

  addFootersToAllPages(doc);
  doc.save(`transaction-history-report-${buildPdfTimestamp()}.pdf`);
}

/** Export filtered farmers list to PDF */
export async function exportFilteredFarmersToPdf(
  farmers: Array<any>,
  appliedFilters: string[]
): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  await addPdfHeader(doc, "Farmers Record List Report");
  let y = CONTENT_TOP;

  // Add filters info
  if (appliedFilters.length > 0) {
    doc.setFontSize(BODY_FONT);
    doc.setFont("helvetica", "bold");
    doc.text("Applied Filters:", MARGIN, y);
    y += 6;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    for (const filter of appliedFilters) {
      const [label, value] = filter.split(":");
      doc.text(`${label}: ${value}`, MARGIN + 5, y);
      y += 4;
    }
    y += 4;
  }

  doc.setFontSize(BODY_FONT);
  doc.setFont("helvetica", "normal");
  doc.text(`Total Farmers: ${farmers.length}`, MARGIN, y);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-PH", { dateStyle: "long" })}`, MARGIN, y + 6);
  y += 18;

  if (farmers.length === 0) {
    doc.text("No records match the selected filters.", MARGIN, y);
    addFootersToAllPages(doc);
    doc.save("farmers-record-list.pdf");
    return;
  }

  // Table headers
  const colWidths = [28, 12, 18, 25, 25, 32];
  const headers = ["Full Name", "Gender", "Farm Type", "Barangay", "Organization", "Phone"];

  doc.setFontSize(HEADER_FONT);
  doc.setFont("helvetica", "bold");
  doc.setFillColor(238, 245, 238); // farm-50
  doc.rect(MARGIN, y - 5, colWidths.reduce((a, b) => a + b, 0), ROW_HEIGHT, "F");
  let x = MARGIN;
  headers.forEach((h, i) => {
    doc.text(h, x + 2, y + 2);
    x += colWidths[i];
  });
  y += ROW_HEIGHT;
  doc.setFont("helvetica", "normal");

  // Table rows
  for (const farmer of farmers) {
    if (y > CONTENT_BOTTOM - ROW_HEIGHT) {
      doc.addPage();
      await addPdfHeader(doc, "Farmers Record List Report (continued)");
      y = CONTENT_TOP + 6; // Add spacing after header
    }
    
    doc.setFontSize(BODY_FONT);
    const row = [
      truncateToFit(formatFarmerDisplayName(farmer) || "-", "name"),
      truncateToFit(farmer.gender || "-", "gender"),
      truncateToFit(farmer.farmType || "-", "type"),
      truncateToFit(farmer.barangay || "-", "barangay"),
      truncateToFit(farmer.organization || "-", "org"),
      truncateToFit(farmer.phone || "-", "phone"),
    ];
    
    x = MARGIN;
    row.forEach((cell, i) => {
      doc.text(String(cell), x + 2, y + 2);
      x += colWidths[i];
    });
    y += ROW_HEIGHT;
  }

  addFootersToAllPages(doc);
  doc.save("farmers-record-list.pdf");
}
