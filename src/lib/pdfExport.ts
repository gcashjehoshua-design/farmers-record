import { jsPDF } from "jspdf";
import type { Transaction } from "@/types";
import { formatFarmerDisplayName } from "@/lib/farmerDisplay";
import { supabaseUrl } from "@/lib/supabase";

const MARGIN = 15;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const HEADER_HEIGHT = 45;
const FOOTER_HEIGHT = 15;
const CONTENT_TOP = MARGIN + HEADER_HEIGHT;
const CONTENT_BOTTOM = PAGE_HEIGHT - FOOTER_HEIGHT;
const ROW_HEIGHT = 8;
const HEADER_FONT = 10;
const BODY_FONT = 9;
const LOGOS_BUCKET = "logos";

function buildLogoUrl(path: string): string {
  const base = supabaseUrl.replace(/\/$/, "");
  const cleanPath = path.replace(/^\//, "");
  return `${base}/storage/v1/object/public/${LOGOS_BUCKET}/${cleanPath}`;
}

function getLogoPaths(): string[] {
  const prefix = (import.meta.env.VITE_LOGOS_PATH_PREFIX as string) || "";
  const pathJoin = (p: string, n: string) => (p ? (p.endsWith("/") ? p + n : p + "/" + n) : n);
  return ["passi-city-logo.png", "palangga-passi-logo.png", "agriculture-office-logo.png"].map((n) =>
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
  let y = MARGIN;

  // Try to add logos (center row)
  const logoPaths = getLogoPaths();
  const logoSize = 12;
  const logoGap = 8;
  const totalLogosWidth = logoPaths.length * logoSize + (logoPaths.length - 1) * logoGap;
  let startX = (PAGE_WIDTH - totalLogosWidth) / 2;

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
  doc.text("Farmers Record and Transactions System", PAGE_WIDTH / 2, y, { align: "center" });
  y += 6;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("City of Passi Agriculture Office", PAGE_WIDTH / 2, y, { align: "center" });
  y += 6;

  // Report title
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(reportTitle, PAGE_WIDTH / 2, y, { align: "center" });
  y += 6;

  // Horizontal line
  doc.setDrawColor(139, 115, 85);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
}

/** Add footer with page number and date */
function addPdfFooter(doc: jsPDF, pageNum: number, totalPages: number): void {
  const y = PAGE_HEIGHT - 8;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Page ${pageNum} of ${totalPages} | Generated: ${new Date().toLocaleDateString("en-PH", { dateStyle: "medium" })}`,
    PAGE_WIDTH / 2,
    y,
    { align: "center" }
  );
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

/** Add footer to all pages */
function addFootersToAllPages(doc: jsPDF): void {
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    addPdfFooter(doc, i, total);
  }
}

/** Export visits list (by day or month) to PDF */
export async function exportVisitsToPdf(
  visits: Array<Transaction & { farmerName: string }>,
  options: { month: number | null; year: number; day?: number }
): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

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
  let y = CONTENT_TOP;

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

  const colWidths = [20, 18, 50, 30, 35, 30]; // Adjusted widths to sum up to approx 180 (page width minus margins)
  const headers = ["Date", "Time", "Farmer", "Type", "Description", "Notes"];

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
      truncateToFit(dateStr, "date"),
      truncateToFit(timeStr, "time"),
      truncateToFit(v.farmerName, "farmer"),
      truncateToFit(v.transactionType, "type"),
      truncateToFit(v.description || "-", "desc"),
      truncateToFit(v.notes || "-", "notes"),
    ];
  });

  for (const row of rows) {
    if (y > CONTENT_BOTTOM - ROW_HEIGHT) {
      doc.addPage();
      await addPdfHeader(doc, "Visits Report (continued)");
      y = CONTENT_TOP;
    }
    doc.setFontSize(BODY_FONT);
    let x = MARGIN;
    row.forEach((cell, i) => {
      doc.text(String(cell), x + 2, y + 2);
      x += colWidths[i];
    });
    y += ROW_HEIGHT;
  }

  addFootersToAllPages(doc);
  doc.save(filename);
}

/** Export a single farmer's transaction history to PDF */
export async function exportProfileTransactionsToPdf(
  farmerName: string,
  transactions: Transaction[]
): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  await addPdfHeader(doc, "Transaction History");
  let y = CONTENT_TOP;

  doc.setFontSize(BODY_FONT);
  doc.setFont("helvetica", "bold");
  doc.text(`Farmer: ${farmerName}`, MARGIN, y);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleDateString("en-PH", { dateStyle: "long" })}`, MARGIN, y + 6);
  y += 18;

  if (transactions.length === 0) {
    doc.text("No transactions recorded.", MARGIN, y);
    addFootersToAllPages(doc);
    doc.save(`transaction-history-${farmerName.replace(/\s+/g, "-")}.pdf`);
    return;
  }

  const colWidths = [35, 20, 30, 50, 45];
  const headers = ["Date of Visit", "Time", "Type", "Description", "Notes"];

  doc.setFontSize(HEADER_FONT);
  doc.setFont("helvetica", "bold");
  doc.setFillColor(238, 245, 238);
  doc.rect(MARGIN, y - 5, colWidths.reduce((a, b) => a + b, 0), ROW_HEIGHT, "F");
  let x = MARGIN;
  headers.forEach((h, i) => {
    doc.text(h, x + 2, y + 2);
    x += colWidths[i];
  });
  y += ROW_HEIGHT;
  doc.setFont("helvetica", "normal");

  const sorted = [...transactions].sort((a, b) => new Date(b.officeVisitAt || b.createdAt).getTime() - new Date(a.officeVisitAt || a.createdAt).getTime());
  const rows = sorted.map((tx) => {
    const date = new Date(tx.officeVisitAt || tx.createdAt);
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
      truncateToFit(dateStr, "dateVisit"),
      truncateToFit(timeStr, "time"),
      truncateToFit(tx.transactionType, "type"),
      truncateToFit(tx.description || "-", "desc"),
      truncateToFit(tx.notes || "-", "notes"),
    ];
  });

  for (const row of rows) {
    if (y > CONTENT_BOTTOM - ROW_HEIGHT) {
      doc.addPage();
      await addPdfHeader(doc, "Transaction History (continued)");
      y = CONTENT_TOP;
    }
    doc.setFontSize(BODY_FONT);
    let x = MARGIN;
    row.forEach((cell, i) => {
      doc.text(String(cell), x + 2, y + 2);
      x += colWidths[i];
    });
    y += ROW_HEIGHT;
  }

  addFootersToAllPages(doc);
  doc.save(`transaction-history-${farmerName.replace(/\s+/g, "-")}.pdf`);
}

/** Export all transactions list (from history page) to PDF */
export async function exportAllTransactionsToPdf(
  transactions: Array<Transaction & { farmerName: string; barangay?: string; agency?: string }>,
  appliedFilters: string[]
): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  await addPdfHeader(doc, "Transaction History Report");
  let y = CONTENT_TOP;

  // Add filters info
  if (appliedFilters.length > 0) {
    doc.setFontSize(BODY_FONT);
    doc.setFont("helvetica", "bold");
    doc.text("Applied Filters:", MARGIN, y);
    y += 6;
    
    doc.setFont("helvetica", "normal");
    for (const filter of appliedFilters) {
      if (y > CONTENT_BOTTOM - 10) {
        doc.addPage();
        await addPdfHeader(doc, "Transaction History Report (continued)");
        y = CONTENT_TOP;
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
    doc.save(`transaction-history-report.pdf`);
    return;
  }

  const colWidths = [45, 30, 30, 30, 45]; // Total 180
  const headers = ["Farmer Name", "Barangay", "Agency", "Type", "Date of Visit"];

  doc.setFontSize(HEADER_FONT);
  doc.setFont("helvetica", "bold");
  doc.setFillColor(238, 245, 238);
  doc.rect(MARGIN, y - 5, colWidths.reduce((a, b) => a + b, 0), ROW_HEIGHT, "F");
  let x = MARGIN;
  headers.forEach((h, i) => {
    doc.text(h, x + 2, y + 2);
    x += colWidths[i];
  });
  y += ROW_HEIGHT;
  doc.setFont("helvetica", "normal");

  for (const tx of transactions) {
    if (y > CONTENT_BOTTOM - ROW_HEIGHT) {
      doc.addPage();
      await addPdfHeader(doc, "Transaction History Report (continued)");
      y = CONTENT_TOP;
    }
    
    const date = new Date(tx.officeVisitAt || tx.createdAt);
    const dateStr = date.toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const rowData = [
      truncateToFit(tx.farmerName, "farmer"),
      truncateToFit(tx.barangay || "-", "date"), // reuse max chars for barangay
      truncateToFit(tx.agency || "-", "type"), // reuse max chars for agency
      truncateToFit(tx.transactionType, "type"),
      dateStr
    ];

    doc.setFontSize(BODY_FONT);
    let xRow = MARGIN;
    rowData.forEach((cell, i) => {
      doc.text(String(cell), xRow + 2, y + 2);
      xRow += colWidths[i];
    });
    y += ROW_HEIGHT;
  }

  addFootersToAllPages(doc);
  doc.save(`transaction-history-report.pdf`);
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
      y = CONTENT_TOP;
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
