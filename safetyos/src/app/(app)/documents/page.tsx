"use client";

// ─────────────────────────────────────────────────────────────
// SafetyOS — Document Library (SOP / JSA / HIRA / MSDS / …)
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useMemo, useState } from "react";
import { FileText, Download, FolderOpen, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { listEntities } from "@/lib/api";
import type { DocItem } from "@/lib/types";
import { Badge, Card, PageHeader, StatCard, Toast } from "@/components/ui";
import { fmtDate } from "@/lib/utils";

const CATS: { key: DocItem["category"]; tone: string; icon: React.ReactNode }[] = [
  { key: "SOP", tone: "blue", icon: <ShieldCheck className="h-4 w-4" /> },
  { key: "JSA", tone: "amber", icon: <FileText className="h-4 w-4" /> },
  { key: "HIRA", tone: "orange", icon: <FileText className="h-4 w-4" /> },
  { key: "MSDS", tone: "rose", icon: <FileText className="h-4 w-4" /> },
  { key: "Policy", tone: "violet", icon: <FileText className="h-4 w-4" /> },
  { key: "Manual", tone: "emerald", icon: <FileText className="h-4 w-4" /> },
  { key: "Training Material", tone: "sky", icon: <FileText className="h-4 w-4" /> },
  { key: "Near Miss Report", tone: "amber", icon: <FileText className="h-4 w-4" /> },
];

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** CSMS tree: Near Miss → {year} → {month} → files */
function csmsTree(docs: DocItem[]) {
  const reports = docs.filter((d) => d.category === "Near Miss Report");
  const tree = new Map<string, Map<string, DocItem[]>>();
  reports.forEach((d) => {
    const folder = d.folder || "";
    const m = folder.match(/Near Miss\/(\d{4})\/([A-Za-z]+)/);
    const year = m?.[1] ?? "2026";
    const month = m?.[2] ?? MONTHS[new Date(d.issued || Date.now()).getMonth()];
    if (!tree.has(year)) tree.set(year, new Map());
    const months = tree.get(year)!;
    if (!months.has(month)) months.set(month, []);
    months.get(month)!.push(d);
  });
  return tree;
}

export default function DocumentsPage() {
  const { company } = useAuth();
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [cat, setCat] = useState("");
  const [q, setQ] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (company) listEntities("documents", company.id).then(setDocs);
  }, [company]);

  const filtered = useMemo(
    () =>
      docs.filter(
        (d) =>
          (!cat || d.category === cat) &&
          (!q || (d.title + d.description).toLowerCase().includes(q.toLowerCase()))
      ),
    [docs, cat, q]
  );

  const stats = useMemo(() => ({
    total: docs.length,
    sop: docs.filter((d) => d.category === "SOP").length,
    reviewDue: docs.filter((d) => new Date(d.review_due).getTime() - Date.now() < 90 * 86400000).length,
    downloads: docs.reduce((s, d) => s + d.downloads, 0),
  }), [docs]);

  return (
    <div>
      <Toast msg={toast} />
      <PageHeader
        title="Document Library"
        subtitle="Controlled documents — SOPs, JSAs, HIRAs, MSDS, policies & manuals"
      />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Documents" value={stats.total} icon={<FolderOpen className="h-5 w-5" />} tone="brand" />
        <StatCard label="SOPs" value={stats.sop} tone="sky" />
        <StatCard label="Review Due ≤ 90d" value={stats.reviewDue} tone="amber" />
        <StatCard label="Total Downloads" value={stats.downloads} tone="emerald" />
      </div>

      <Card className="mb-4">
        <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ink-800 dark:text-ink-100">
          <FolderOpen className="h-4 w-4 text-brand-500" /> CSMS Documents
        </p>
        <div className="rounded-xl bg-ink-50/60 p-4 text-xs dark:bg-ink-900/40">
          <p className="font-semibold text-ink-700 dark:text-ink-200">📁 CSMS Documents</p>
          <p className="ml-5 font-semibold text-ink-600 dark:text-ink-300">└── 📁 Near Miss</p>
          {(() => {
            const tree = csmsTree(docs);
            if (!tree.size) return <p className="ml-10 text-ink-400">└── (auto-saved here when a near miss is closed &amp; report generated)</p>;
            return Array.from(tree.entries()).map(([year, months]) => (
              <div key={year}>
                <p className="ml-10 font-medium text-ink-600 dark:text-ink-300">└── 📁 {year}</p>
                {Array.from(months.entries()).map(([month, files]) => (
                  <div key={month}>
                    <p className="ml-15 pl-5 font-medium text-ink-600 dark:text-ink-300">└── 📁 {month}</p>
                    <div className="ml-15 pl-10 space-y-1">
                      {files.map((f) => (
                        <a key={f.id} href={f.file_url || "#"} target="_blank" rel="noreferrer" className="flex w-fit items-center gap-1.5 text-brand-700 hover:underline dark:text-brand-300">
                          {f.title.includes("(PDF)") ? <FileText className="h-3 w-3 text-rose-500" /> : <FileText className="h-3 w-3 text-sky-500" />}
                          {f.title.split(" — ")[1]?.split(" (")[0] || f.title}
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ));
          })()}
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <input
            placeholder="Search documents…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full max-w-xs rounded-xl border-0 bg-ink-100/70 px-3.5 py-2.5 text-sm ring-1 ring-inset ring-ink-200 outline-none placeholder:text-ink-400 focus:bg-white focus:ring-2 focus:ring-brand-500 dark:bg-ink-800/70 dark:text-white dark:ring-ink-600/50 dark:focus:bg-ink-800"
          />
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setCat("")} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${!cat ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300"}`}>All</button>
            {CATS.map((c) => (
              <button key={c.key} onClick={() => setCat(c.key)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${cat === c.key ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300"}`}>
                {c.key}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((d) => {
            const meta = CATS.find((c) => c.key === d.category);
            return (
              <div key={d.id} className="group rounded-2xl bg-ink-50/70 p-4 ring-1 ring-inset ring-ink-100 transition hover:ring-brand-300 hover:shadow-glass dark:bg-ink-800/50 dark:ring-ink-700/60 dark:hover:ring-brand-500/40">
                <div className="flex items-start justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm ring-1 ring-ink-100 dark:bg-ink-900 dark:ring-ink-700">{meta?.icon}</span>
                  <Badge tone={meta?.tone}>{d.category}</Badge>
                </div>
                <p className="mt-3 text-sm font-bold leading-snug text-ink-800 dark:text-ink-100">{d.title}</p>
                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-ink-400">{d.description}</p>
                <div className="mt-3 flex items-center gap-2 text-[10px] text-ink-400">
                  <span className="font-semibold text-brand-600 dark:text-brand-400">{d.version}</span>
                  <span>·</span><span>{d.size}</span>
                  <span>·</span><span>{d.downloads} downloads</span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-ink-100 pt-2.5 dark:border-ink-700/60">
                  <span className="text-[10px] text-ink-400">Issued {fmtDate(d.issued)} · Review {fmtDate(d.review_due)}</span>
                  <button
                    onClick={() => { if (d.file_url) window.open(d.file_url, "_blank"); else { setToast("Downloading " + d.title + " (demo)"); setTimeout(() => setToast(null), 2200); } }}
                    className="flex items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1.5 text-[10px] font-bold text-white opacity-0 transition group-hover:opacity-100 hover:bg-brand-700"
                  >
                    <Download className="h-3 w-3" /> Download
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <div className="py-14 text-center text-sm text-ink-400">No documents match your search.</div>
        )}
      </Card>
    </div>
  );
}
