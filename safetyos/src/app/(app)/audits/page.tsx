"use client";

// ─────────────────────────────────────────────────────────────
// SafetyOS — Audit (ISO / 5S / CSMS / Internal / Customer)
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { listEntities } from "@/lib/api";
import type { Audit } from "@/lib/types";
import { Badge, Card, PageHeader, StatCard } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { ExportMenu, FilterBar } from "@/components/module-kit";
import { Gauge } from "@/components/charts";
import { fmtDate } from "@/lib/utils";

export default function AuditsPage() {
  const { company } = useAuth();
  const router = useRouter();
  const [rows, setRows] = useState<Audit[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});

  useEffect(() => {
    if (company) listEntities("audits", company.id).then(setRows);
  }, [company]);

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (!filters.q || (r.audit_number + r.scope).toLowerCase().includes(filters.q.toLowerCase())) &&
          (!filters.status || r.status === filters.status) &&
          (!filters.audit_type || r.audit_type === filters.audit_type)
      ),
    [rows, filters]
  );

  const completed = rows.filter((r) => r.status === "Completed" || r.status === "Closed");
  const avgScore = completed.length ? Math.round(completed.reduce((s, a) => s + a.score, 0) / completed.length) : 0;
  const openFindings = rows.flatMap((a) => a.findings).filter((f) => f.status !== "Closed");
  const ncCount = openFindings.filter((f) => f.type === "NC").length;

  return (
    <div>
      <PageHeader
        title="Audit"
        subtitle="ISO 45001 · 5S · CSMS · Internal · Customer — findings, OFI & CAPA"
        actions={
          <ExportMenu rows={filtered} filename="audits" columns={[
            { key: "audit_number", label: "Audit No." }, { key: "audit_type", label: "Type" },
            { key: "scope", label: "Scope" }, { key: "auditor", label: "Auditor" },
            { key: "score", label: "Score %" }, { key: "compliance", label: "Compliance %" },
            { key: "status", label: "Status" },
          ]} />
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Audits" value={rows.length} icon={<ClipboardCheck className="h-5 w-5" />} tone="emerald" />
        <StatCard label="Avg. Score" value={avgScore + "%"} sub="completed audits" tone="brand" />
        <StatCard label="Open Findings" value={openFindings.length} sub={ncCount + " non-conformances"} tone="amber" />
        <StatCard label="OFI Raised" value={rows.flatMap((a) => a.findings).filter((f) => f.type === "OFI").length} tone="violet" />
      </div>

      <div className="mb-4 grid gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <p className="mb-3 text-sm font-bold text-ink-800 dark:text-ink-100">Audit register</p>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <input
              placeholder="Search audit no., scope…"
              value={filters.q ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
              className="w-full max-w-xs rounded-xl border-0 bg-ink-100/70 px-3.5 py-2.5 text-sm ring-1 ring-inset ring-ink-200 outline-none placeholder:text-ink-400 focus:bg-white focus:ring-2 focus:ring-brand-500 dark:bg-ink-800/70 dark:text-white dark:ring-ink-600/50 dark:focus:bg-ink-800"
            />
            <FilterBar
              filters={[
                { key: "status", label: "Status", options: ["Planned", "In Progress", "Completed", "Closed"] },
                { key: "audit_type", label: "Type", options: ["ISO 45001", "5S", "CSMS", "Internal", "Customer"] },
              ]}
              values={filters}
              onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
            />
          </div>
          <DataTable
            rows={filtered}
            emptyTitle="No audits match your filters"
            onRowClick={(r) => router.push("/audits/" + r.id)}
            columns={[
              { key: "audit_number", label: "Audit No.", sortValue: (r) => r.audit_number, render: (r) => <span className="font-semibold text-brand-700 dark:text-brand-300">{r.audit_number}</span> },
              { key: "audit_type", label: "Type", sortValue: (r) => r.audit_type, render: (r) => <Badge tone={r.audit_type === "ISO 45001" ? "blue" : r.audit_type === "5S" ? "emerald" : r.audit_type === "Internal" ? "violet" : "amber"}>{r.audit_type}</Badge> },
              { key: "date_from", label: "Date", sortValue: (r) => r.date_from, render: (r) => fmtDate(r.date_from) },
              { key: "auditor", label: "Auditor" },
              { key: "findings", label: "Findings", sortValue: (r) => r.findings.length, render: (r) => <Badge tone={r.findings.filter((f) => f.type === "NC").length ? "rose" : "sky"}>{r.findings.length} ({r.findings.filter((f) => f.type === "NC").length} NC)</Badge> },
              { key: "score", label: "Score", sortValue: (r) => r.score, render: (r) => <span className={`font-bold ${r.score >= 85 ? "text-emerald-600" : r.score >= 70 ? "text-amber-600" : "text-rose-600"}`}>{r.score}%</span> },
              { key: "status", label: "Status", sortValue: (r) => r.status, render: (r) => <Badge tone={r.status}>{r.status}</Badge> },
            ]}
          />
        </Card>
        <Card className="flex flex-col items-center">
          <p className="mb-2 self-start text-sm font-bold text-ink-800 dark:text-ink-100">Compliance score</p>
          <Gauge value={avgScore} />
          <p className="mt-2 text-center text-[11px] text-ink-400">Average across {completed.length} completed audit{completed.length === 1 ? "" : "s"}</p>
          <div className="mt-4 w-full space-y-2">
            {[
              { label: "ISO 45001", v: completed.filter((a) => a.audit_type === "ISO 45001")[0]?.score },
              { label: "5S", v: completed.filter((a) => a.audit_type === "5S")[0]?.score },
              { label: "Internal", v: completed.filter((a) => a.audit_type === "Internal")[0]?.score },
            ].map((t) => (
              <div key={t.label} className="flex items-center justify-between text-xs">
                <span className="text-ink-500 dark:text-ink-300">{t.label}</span>
                <span className="font-bold text-ink-800 dark:text-ink-100">{t.v ?? "—"}{t.v ? "%" : ""}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
