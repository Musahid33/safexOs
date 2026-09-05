"use client";

// ─────────────────────────────────────────────────────────────
// SafetyOS — Reports builder (filters + CSV/Excel + PDF/print)
// ─────────────────────────────────────────────────────────────
import React, { useMemo, useState } from "react";
import { FileText, FileSpreadsheet, Printer } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { db, forCompany } from "@/lib/store";
import { Badge, Card, PageHeader, Select, Toast } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { downloadCSV, fmtDate } from "@/lib/utils";

const ENTITIES = [
  { key: "near-misses", label: "Near Miss", source: () => db.nearMisses as any[] },
  { key: "hazards", label: "Hazard Report", source: () => db.hazards as any[] },
  { key: "incidents", label: "Incident", source: () => db.incidents as any[] },
  { key: "grievances", label: "Grievance", source: () => db.grievances as any[] },
  { key: "employees", label: "Employee Register", source: () => db.employees as any[] },
  { key: "ppe-issues", label: "PPE Issues", source: () => db.ppeIssues as any[] },
  { key: "vehicle-inspections", label: "Vehicle Inspections", source: () => db.vehicleInspections as any[] },
  { key: "tool-inspections", label: "Tool Inspections", source: () => db.toolInspections as any[] },
  { key: "audits", label: "Audit Register", source: () => db.audits as any[] },
  { key: "training-sessions", label: "Training Sessions", source: () => db.trainingSessions as any[] },
];

export default function ReportsPage() {
  const { company } = useAuth();
  const [entity, setEntity] = useState("near-misses");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [dept, setDept] = useState("");
  const [contractor, setContractor] = useState("");
  const [status, setStatus] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const companyId = company?.id ?? "";
  const cfg = ENTITIES.find((e) => e.key === entity)!;

  const rows = useMemo(() => {
    let r = forCompany(cfg.source(), companyId);
    if (from) r = r.filter((x: any) => (x.date ?? x.filed_on ?? x.reported_on ?? x.issued) >= from);
    if (to) r = r.filter((x: any) => (x.date ?? x.filed_on ?? x.reported_on ?? x.issued) <= to);
    if (dept) r = r.filter((x: any) => x.department === dept);
    if (contractor) r = r.filter((x: any) => x.contractor === contractor);
    if (status) r = r.filter((x: any) => x.status === status);
    return r;
  }, [cfg, companyId, from, to, dept, contractor, status]);

  const depts = Array.from(new Set(forCompany(db.employees, companyId).map((e) => e.department)));
  const contractors = Array.from(new Set(forCompany(db.employees, companyId).map((e) => e.contractor).filter(Boolean) as string[]));
  const statuses = Array.from(new Set(rows.map((r: any) => r.status)));

  const columns = useMemo(() => {
    const base: Record<string, { key: string; label: string }> = {
      "near-misses": { key: "report_number", label: "Report Number" },
      hazards: { key: "hazard_code", label: "Hazard ID" },
      incidents: { key: "incident_number", label: "Incident No." },
      grievances: { key: "grievance_number", label: "Grievance No." },
      employees: { key: "employee_code", label: "Employee ID" },
      "ppe-issues": { key: "employee_name", label: "Employee" },
      "vehicle-inspections": { key: "vehicle_number", label: "Vehicle" },
      "tool-inspections": { key: "tool_name", label: "Tool" },
      audits: { key: "audit_number", label: "Audit No." },
      "training-sessions": { key: "program", label: "Program" },
    };
    const common: Record<string, string> = {
      name: "Name", date: "Date", filed_on: "Filed On", reported_on: "Reported On",
      location: "Location", department: "Department", severity: "Severity", risk_level: "Risk",
      category: "Category", type: "Type", status: "Status", description: "Description",
    };
    const keys = Array.from(new Set(rows.flatMap((r: any) => Object.keys(r)))).filter((k) =>
      k === base[entity].key || Object.keys(common).includes(k)
    );
    return keys.map((k) => ({ key: k, label: common[k] ?? base[entity].label }));
  }, [rows, entity]);

  const exportRows = rows.map((r: any) => {
    const out: Record<string, any> = {};
    columns.forEach((c) => (out[c.key] = r[c.key] ?? ""));
    return out;
  });

  return (
    <div>
      <Toast msg={toast} />
      <PageHeader
        title="Reports"
        subtitle="Build filtered reports and export to PDF, Excel or CSV"
        actions={
          <>
            <button
              onClick={() => { downloadCSV(`safetyos-${entity}.csv`, exportRows, columns); setToast("CSV downloaded (opens in Excel)"); setTimeout(() => setToast(null), 2200); }}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-sm font-medium text-ink-700 ring-1 ring-ink-200 transition hover:bg-ink-50 dark:bg-ink-800/80 dark:text-ink-100 dark:ring-ink-600/60"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" /> Excel / CSV
            </button>
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-sm font-medium text-ink-700 ring-1 ring-ink-200 transition hover:bg-ink-50 dark:bg-ink-800/80 dark:text-ink-100 dark:ring-ink-600/60">
              <Printer className="h-3.5 w-3.5 text-brand-500" /> PDF / Print
            </button>
          </>
        }
      />

      <Card className="mb-4">
        <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ink-800 dark:text-ink-100"><FileText className="h-4 w-4 text-brand-500" /> Report filters</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <p className="mb-1.5 text-xs font-semibold text-ink-600 dark:text-ink-300">Report type</p>
            <Select value={entity} onChange={setEntity} options={ENTITIES.map((e) => ({ value: e.key, label: e.label }))} />
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold text-ink-600 dark:text-ink-300">From date</p>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full rounded-xl border-0 bg-ink-100/70 px-3 py-2 text-sm ring-1 ring-inset ring-ink-200 outline-none dark:bg-ink-800/70 dark:text-white dark:ring-ink-600/50" />
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold text-ink-600 dark:text-ink-300">To date</p>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full rounded-xl border-0 bg-ink-100/70 px-3 py-2 text-sm ring-1 ring-inset ring-ink-200 outline-none dark:bg-ink-800/70 dark:text-white dark:ring-ink-600/50" />
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold text-ink-600 dark:text-ink-300">Department</p>
            <Select value={dept} onChange={setDept} allLabel="All" options={depts.map((d) => ({ value: d, label: d }))} />
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold text-ink-600 dark:text-ink-300">Contractor</p>
            <Select value={contractor} onChange={setContractor} allLabel="All" options={contractors.map((c) => ({ value: c, label: c }))} />
          </div>
          <div className="sm:col-span-2 lg:col-span-6">
            <p className="mb-1.5 text-xs font-semibold text-ink-600 dark:text-ink-300">Status</p>
            <Select value={status} onChange={setStatus} allLabel="All statuses" options={statuses.map((s) => ({ value: s, label: s }))} className="max-w-xs" />
          </div>
        </div>
      </Card>

      <div className="print-area">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold text-ink-800 dark:text-ink-100">
              {cfg.label} report <Badge tone="blue">{rows.length} rows</Badge>
            </p>
            <p className="text-[10px] text-ink-400">Generated {fmtDate(new Date().toISOString())} · SafetyOS</p>
          </div>
          <DataTable
            rows={rows as any}
            emptyTitle="No records for the selected filters"
            columns={columns.map((c) => ({
              key: c.key,
              label: c.label,
              render: (r: any) =>
                ["date", "filed_on", "reported_on", "issue_date"].includes(c.key) ? fmtDate(r[c.key]) :
                ["status", "severity", "risk_level"].includes(c.key) ? <Badge tone={r[c.key]}>{r[c.key]}</Badge> :
                ["description", "subject", "scope"].includes(c.key) ? <span className="block max-w-[260px] truncate">{r[c.key]}</span> :
                String(r[c.key] ?? "—"),
            }))}
          />
        </Card>
      </div>
    </div>
  );
}
