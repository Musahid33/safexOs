// ─────────────────────────────────────────────────────────────
// SafetyOS — auto-save generated Near Miss reports to
// CSMS Documents / Near Miss / {year} / {month} /
// ─────────────────────────────────────────────────────────────
import type { Company, NearMiss, NearMissReportDoc } from "./types";
import { getSupabase } from "./supabase";
import { createEntity } from "./api";
import { db, forCompany } from "./store";
import { buildNearMissReportData, generateNearMissDocx, generateNearMissPdf } from "./report-generator";
import { csmsFolderFor, docxFileName, pdfFileName, safeFileName } from "./near-miss-workflow";

function blobUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

function fileSize(bytes: number): string {
  return bytes >= 1048576 ? (bytes / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(bytes / 1024)) + " KB";
}

/**
 * Generates the PDF + DOCX for a near miss and stores both under
 * CSMS Documents. In live mode files are uploaded to the
 * csms-documents bucket and a `documents` row is inserted; in
 * demo mode a local object URL is used and the store is updated.
 * Returns the updated report_documents metadata.
 */
export async function saveNearMissReports(nm: NearMiss, company: Company): Promise<NearMissReportDoc[]> {
  const data = buildNearMissReportData(nm, company.name);
  const folder = csmsFolderFor(nm);

  const [pdf, docx] = await Promise.all([
    generateNearMissPdf(data),
    generateNearMissDocx(data),
  ]);

  const docs: NearMissReportDoc[] = [];
  const sb = getSupabase();

  for (const [format, blob] of [["pdf", pdf], ["docx", docx]] as const) {
    const fileName = format === "pdf" ? pdfFileName(nm.report_number) : docxFileName(nm.report_number);
    let fileUrl = "";
    let storagePath = "";

    if (sb) {
      // bucket path: {company slug}/Near Miss/{year}/{month}/{file}
      const path = `${safeFileName(company.slug)}/${folder.path}/${fileName}`;
      const { error } = await sb.storage.from("csms-documents").upload(path, blob, {
        contentType: format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        upsert: true,
      });
      if (error) throw error;
      storagePath = path;
      fileUrl = sb.storage.from("csms-documents").getPublicUrl(path).data.publicUrl;
    } else {
      fileUrl = blobUrl(blob);
    }

    docs.push({
      name: fileName,
      format: format as "pdf" | "docx",
      path: storagePath || fileUrl,
      url: fileUrl,
      saved_at: new Date().toISOString(),
    });

    // One library row per format (CSMS Documents → Near Miss)
    const title = `Near Miss Investigation Report — ${nm.report_number} (${format.toUpperCase()})`;
    await createEntity("documents", {
      id: "doc-" + Date.now().toString(36) + "-" + format,
      company_id: company.id,
      title,
      category: "Near Miss Report",
      description: `${nm.report_number} · ${nm.category} · ${nm.location} · Auto-generated investigation report`,
      version: "v1.0",
      issued: new Date().toISOString().slice(0, 10),
      review_due: "",
      owner: company.name,
      downloads: 0,
      size: fileSize(blob.size),
      file_url: fileUrl,
      folder: `CSMS Documents/Near Miss/${folder.year}/${folder.month}`,
    });
  }

  // Demo mode: drop object URLs into the store's document list too.
  if (!sb) {
    const existing = forCompany(db.documents, company.id).filter((d) => d.category === "Near Miss Report");
    docs.forEach((d) => {
      const found = existing.find((e) => e.title.includes(d.name.split(".")[0]));
      if (found) found.file_url = d.url;
    });
  }

  return docs;
}
