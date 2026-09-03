"use client";

// ─────────────────────────────────────────────────────────────
// SafetyOS — Audit detail (findings, NC/OFI, CAPA, evidence)
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Printer, ClipboardCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getEntity } from "@/lib/api";
import type { Audit } from "@/lib/types";
import { Badge, Button, Card, PageHeader, Progress } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { DetailGrid } from "@/components/module-kit";
import { Gauge } from "@/components/charts";
import { fmtDate } from "@/lib/utils";
import { db, forCompany } from "@/lib/store";

export default function AuditDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { company } = useAuth();
  const [audit, setAudit] = useState<Audit | null>(null);

  useEffect(() => {
    if (company) getEntity("audits", params.id, company.id).then(setAudit);
  }, [params.id, company]);

  if (!audit) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  const capas = forCompany(db.capas, company?.id ?? "");

  return (
    <div>
      <PageHeader
        title={audit.audit_number}
        subtitle={`${audit.audit_type} audit · ${fmtDate(audit.date_from)} – ${fmtDate(audit.date_to)}`}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => window.print()}><Printer className="h-3.5 w-3.5" /> PDF Report</Button>
            <Button variant="secondary" size="sm" onClick={() => router.back()}><ArrowLeft className="h-3.5 w-3.5" /> Back</Button>
          </>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <Badge tone={audit.audit_type === "ISO 45001" ? "blue" : audit.audit_type === "5S" ? "emerald" : "amber"}>{audit.audit_type}</Badge>
        <Badge tone={audit.status}>{audit.status}</Badge>
        <Badge tone={audit.score >= 85 ? "emerald" : audit.score >= 70 ? "amber" : "rose"}>{audit.score}% compliance</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <p className="mb-3 text-sm font-bold text-ink-800 dark:text-ink-100">Audit details</p>
            <DetailGrid items={[
              { label: "Audit No.", value: <span className="text-brand-700 dark:text-brand-300">{audit.audit_number}</span> },
              { label: "Type", value: audit.audit_type },
              { label: "Auditor", value: audit.auditor },
              { label: "Period", value: `${fmtDate(audit.date_from)} – ${fmtDate(audit.date_to)}` },
              { label: "Score", value: audit.score + "%" },
              { label: "Status", value: <Badge tone={audit.status}>{audit.status}</Badge> },
            ]} />
            <div className="mt-4 rounded-xl bg-ink-50/80 p-4 dark:bg-ink-800/60">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-ink-400">Scope</p>
              <p className="text-sm leading-relaxed text-ink-700 dark:text-ink-200">{audit.scope}</p>
            </div>
          </Card>
          <Card>
            <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ink-800 dark:text-ink-100"><ClipboardCheck className="h-4 w-4 text-brand-500" /> Findings & CAPA</p>
            <DataTable
              rows={audit.findings}
              emptyTitle="No findings — exemplary performance"
              columns={[
                { key: "type", label: "Type", sortValue: (r) => r.type, render: (r) => <Badge tone={r.type}>{r.type}</Badge> },
                { key: "description", label: "Finding", render: (r) => <span className="block max-w-[280px] truncate">{r.description}</span> },
                { key: "clause", label: "Clause" },
                { key: "severity", label: "Severity", render: (r) => <Badge tone={r.severity === "Critical" ? "rose" : r.severity === "Major" ? "amber" : "sky"}>{r.severity}</Badge> },
                { key: "capa_id", label: "CAPA", render: (r) => {
                  const capa = capas.find((c) => c.id === r.capa_id);
                  return capa ? <span className="font-semibold text-brand-700 dark:text-brand-300">{capa.capa_number}</span> : "—";
                } },
                { key: "status", label: "Status", sortValue: (r) => r.status, render: (r) => <Badge tone={r.status}>{r.status}</Badge> },
              ]}
            />
          </Card>
        </div>
        <div className="space-y-4">
          <Card className="flex flex-col items-center">
            <p className="mb-2 self-start text-sm font-bold text-ink-800 dark:text-ink-100">Compliance gauge</p>
            <Gauge value={audit.compliance} size={180} />
            <p className="mt-2 text-center text-[11px] text-ink-400">Compliance {audit.compliance}%</p>
          </Card>
          <Card>
            <p className="mb-3 text-sm font-bold text-ink-800 dark:text-ink-100">Finding mix</p>
            {["NC", "OFI", "Observation"].map((t) => {
              const count = audit.findings.filter((f) => f.type === t).length;
              const total = Math.max(1, audit.findings.length);
              return (
                <div key={t} className="mb-3">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-ink-500 dark:text-ink-300">{t}</span>
                    <span className="font-bold text-ink-800 dark:text-ink-100">{count}</span>
                  </div>
                  <Progress value={(count / total) * 100} tone={t === "NC" ? "rose" : t === "OFI" ? "amber" : "brand"} />
                </div>
              );
            })}
          </Card>
          <Card>
            <p className="mb-2 text-sm font-bold text-ink-800 dark:text-ink-100">Evidence</p>
            <div className="space-y-2">
              {audit.evidence.map((e) => (
                <div key={e.label} className="flex items-center gap-2 rounded-xl bg-ink-50/80 px-3 py-2 text-xs text-ink-600 dark:bg-ink-800/60 dark:text-ink-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> {e.label}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
