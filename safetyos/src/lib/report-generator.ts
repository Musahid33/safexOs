// ─────────────────────────────────────────────────────────────
// SafetyOS — Near Miss Investigation Report generator
// Produces PDF (jsPDF) and DOCX (docx) clientside, so the same
// code works in demo mode and live mode. Libraries are imported
// lazily to keep the initial bundle small.
// ─────────────────────────────────────────────────────────────
import type { NearMiss } from "./types";
import { fmtDate } from "./utils";

export interface NearMissReportData {
  report_number: string;
  company_name: string;
  generated_on: string;
  status: string;
  category: string;
  severity: string;
  date: string;
  time: string;
  location: string;
  department: string;
  employee: string;
  reporter: string;
  description: string;
  investigator: string;
  immediate_action: string;
  root_cause: string;
  five_whys: { why: string; answer: string }[];
  corrective_action: string;
  preventive_action: string;
  responsible_person: string;
  target_date: string;
  officer_remarks: string;
  evidence: { label: string; type: string; name: string }[];
  photos_count: number;
}

export function buildNearMissReportData(nm: NearMiss, companyName: string): NearMissReportData {
  return {
    report_number: nm.report_number,
    company_name: companyName || "Company",
    generated_on: new Date().toLocaleString("en-IN", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    status: nm.status,
    category: nm.category,
    severity: nm.severity,
    date: fmtDate(nm.date),
    time: nm.time,
    location: nm.location,
    department: nm.department,
    employee: nm.employee_name,
    reporter: nm.timeline[0]?.actor ?? nm.employee_name,
    description: nm.description,
    investigator: nm.assigned_to,
    immediate_action: nm.immediate_action,
    root_cause: nm.root_cause,
    five_whys: nm.five_whys.filter((w) => w && (w.why || w.answer)),
    corrective_action: nm.corrective_action,
    preventive_action: nm.preventive_action,
    responsible_person: nm.responsible_person,
    target_date: nm.target_date ? fmtDate(nm.target_date) : "—",
    officer_remarks: nm.officer_remarks,
    evidence: nm.evidence.map((e) => ({ label: e.label, type: e.type, name: e.name })),
    photos_count: nm.photos.length,
  };
}

// ── PDF ──────────────────────────────────────────────────────
export async function generateNearMissPdf(d: NearMissReportData): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 48;

  // Header band
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, W, 86, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("NEAR MISS INVESTIGATION REPORT", M, 38);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`${d.company_name} · ${d.report_number}`, M, 56);
  doc.setFontSize(8.5);
  doc.text(`Generated: ${d.generated_on}`, M, 71);

  let y = 112;
  const section = (title: string) => {
    doc.setFillColor(37, 99, 235);
    doc.roundedRect(M, y - 12, 6, 12, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(title.toUpperCase(), M + 14, y);
    y += 20;
  };
  const kv = (rows: [string, string][]) => {
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      theme: "grid",
      styles: { font: "helvetica", fontSize: 8.5, cellPadding: 4, textColor: [30, 41, 59], lineColor: [226, 232, 240], lineWidth: 0.5 },
      headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: "bold", fontSize: 8 },
      head: [["Field", "Value"]],
      body: rows,
      columnStyles: { 0: { cellWidth: 140, fontStyle: "bold" } },
    });
    y = (doc as any).lastAutoTable.finalY + 22;
  };
  const para = (label: string, text: string) => {
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      theme: "grid",
      styles: { font: "helvetica", fontSize: 8.5, cellPadding: 5, textColor: [30, 41, 59], lineColor: [226, 232, 240], lineWidth: 0.5 },
      headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: "bold" },
      head: [[label]],
      body: [[text || "—"]],
    });
    y = (doc as any).lastAutoTable.finalY + 22;
  };

  section("1. Report Details");
  kv([
    ["Report Number", d.report_number],
    ["Status", d.status],
    ["Category", d.category],
    ["Severity", d.severity],
    ["Date & Time", `${d.date} · ${d.time}`],
    ["Location", d.location],
    ["Department", d.department],
    ["Reported By", d.reporter],
    ["Employee Involved", d.employee],
  ]);

  section("2. Description of Near Miss");
  para("What happened", d.description);

  section("3. Investigation");
  kv([
    ["Investigator", d.investigator || "—"],
    ["Immediate Action Taken", d.immediate_action || "—"],
  ]);
  if (d.five_whys.length) {
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      theme: "grid",
      styles: { font: "helvetica", fontSize: 8.5, cellPadding: 4, textColor: [30, 41, 59], lineColor: [226, 232, 240], lineWidth: 0.5 },
      headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: "bold" },
      head: [["#", "Why", "Answer"]],
      body: d.five_whys.map((w, i) => [String(i + 1), w.why, w.answer]),
      columnStyles: { 0: { cellWidth: 26 }, 1: { cellWidth: 180 } },
    });
    y = (doc as any).lastAutoTable.finalY + 22;
  }
  para("Root Cause", d.root_cause);

  section("4. Corrective & Preventive Actions");
  kv([
    ["Corrective Action", d.corrective_action || "—"],
    ["Preventive Action", d.preventive_action || "—"],
    ["Responsible Person", d.responsible_person || "—"],
    ["Target Date", d.target_date || "—"],
  ]);

  section("5. Evidence");
  kv([
    ["Photos Uploaded", String(d.photos_count)],
    ["Evidence Files", d.evidence.length ? d.evidence.map((e) => `${e.name} (${e.type})`).join("; ") : "—"],
  ]);

  section("6. Safety Officer Remarks");
  para("Remarks", d.officer_remarks);

  // Footer
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text("Generated by SafetyOS — CSMS Documents / Near Miss", M, doc.internal.pageSize.getHeight() - 28);

  return doc.output("blob");
}

// ── DOCX ─────────────────────────────────────────────────────
export async function generateNearMissDocx(d: NearMissReportData): Promise<Blob> {
  const docx = await import("docx");
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } = docx;

  const H = (text: string) =>
    new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 260, after: 100 }, children: [new TextRun({ text, bold: true, color: "1D4ED8", size: 24 })] });
  const P = (text: string) =>
    new Paragraph({ spacing: { after: 90 }, children: [new TextRun({ text: text || "—", size: 21 })] });
  const KV = (label: string, value: string) =>
    new Paragraph({ spacing: { after: 70 }, children: [
      new TextRun({ text: label + ": ", bold: true, size: 21 }),
      new TextRun({ text: value || "—", size: 21 }),
    ] });

  const cell = (text: string, bold = false) =>
    new TableCell({
      width: { size: 50, type: WidthType.PERCENTAGE },
      borders: { top: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" }, bottom: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" }, left: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" }, right: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" } },
      children: [new Paragraph({ children: [new TextRun({ text, bold, size: 20 })] })],
    });

  const kids: any[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: "NEAR MISS INVESTIGATION REPORT", bold: true, size: 36, color: "0F172A" })],
    }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: `${d.company_name} · ${d.report_number}`, size: 22, color: "475569" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [new TextRun({ text: `Generated: ${d.generated_on}`, size: 18, color: "94A3B8" })] }),

    H("1. Report Details"),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: [cell("Report Number", true), cell(d.report_number)] }),
        new TableRow({ children: [cell("Status", true), cell(d.status)] }),
        new TableRow({ children: [cell("Category", true), cell(d.category)] }),
        new TableRow({ children: [cell("Severity", true), cell(d.severity)] }),
        new TableRow({ children: [cell("Date & Time", true), cell(`${d.date} · ${d.time}`)] }),
        new TableRow({ children: [cell("Location", true), cell(d.location)] }),
        new TableRow({ children: [cell("Department", true), cell(d.department)] }),
        new TableRow({ children: [cell("Reported By", true), cell(d.reporter)] }),
        new TableRow({ children: [cell("Employee Involved", true), cell(d.employee)] }),
      ],
    }),

    H("2. Description of Near Miss"),
    P(d.description),

    H("3. Investigation"),
    KV("Investigator", d.investigator),
    KV("Immediate Action Taken", d.immediate_action),
    ...(d.five_whys.length
      ? [
          P("Root Cause Analysis — 5 Why"),
          ...d.five_whys.map((w, i) => new Paragraph({ spacing: { after: 60 }, children: [
            new TextRun({ text: `${i + 1}. ${w.why}`, bold: true, size: 20 }),
            new TextRun({ text: `  →  ${w.answer}`, size: 20 }),
          ] })),
        ]
      : []),
    P(`Root Cause: ${d.root_cause}`),

    H("4. Corrective & Preventive Actions"),
    KV("Corrective Action", d.corrective_action),
    KV("Preventive Action", d.preventive_action),
    KV("Responsible Person", d.responsible_person),
    KV("Target Date", d.target_date),

    H("5. Evidence"),
    KV("Photos Uploaded", String(d.photos_count)),
    KV("Evidence Files", d.evidence.length ? d.evidence.map((e) => `${e.name} (${e.type})`).join("; ") : "—"),

    H("6. Safety Officer Remarks"),
    P(d.officer_remarks),
  ];

  const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 21 } } } },
    sections: [{ properties: {}, children: kids }],
  });
  return Packer.toBlob(doc);
}
