"use client";

// ─────────────────────────────────────────────────────────────
// SafetyOS — Incident Management (list + analytics)
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileWarning } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { listEntities } from "@/lib/api";
import type { Incident } from "@/lib/types";
import { Badge, Card, PageHeader, StatCard } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { ExportMenu, FilterBar } from "@/components/module-kit";
import { TrendChart } from "@/components/charts";
import { fmtDate, monthKey, monthLabel } from "@/lib/utils";

export default function IncidentsPage() {
  const { user, company } = useAuth();
  const router = useRouter();
  const [rows, setRows] = useState<Incident[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});

  useEffect(() => {
    if (company) listEntities("incidents", company.id).then(setRows);
  }, [company]);

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (!filters.q || (r.incident_number + r.description + r.type).toLowerCase().includes(filters.q.toLowerCase())) &&
          (!filters.status || r.status === filters.status) &&
          (!filters.severity || r.severity === filters.severity) &&
          (!filters.type || r.type === filters.type) &&
          (!filters.department || r.department === filters.department)
      ),
    [rows, filters]
  );

  const analytics = useMemo(() => {
    const lti = rows.filter((r) => r.type === "LTI");
    const lostDays = lti.reduce((s, r) => s + r.lost_days, 0);
    const months = Array.from({ length: 8 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (7 - i));
      return d.toISOString().slice(0, 7);
    });
    const monthly = months.map((m) => rows.filter((r) => monthKey(r.date) === m).length);
    return { lti: lti.length, lostDays, months, monthly };
  }, [rows]);

  return (
    <div>
      <PageHeader
        title="Incident Management"
        subtitle="Investigate, analyse root causes and drive CAPA to closure"
        actions={
          <ExportMenu rows={filtered} filename="incidents" columns={[
            { key: "incident_number", label: "Incident No." }, { key: "date", label: "Date" },
            { key: "type", label: "Type" }, { key: "severity", label: "Severity" },
            { key: "location", label: "Location" }, { key: "department", label: "Department" },
            { key: "lost_days", label: "Lost Days" }, { key: "status", label: "Status" },
          ]} />
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total Incidents" value={rows.length} icon={<FileWarning className="h-5 w-5" />} tone="rose" />
        <StatCard label="Lost-Time Injuries" value={analytics.lti} sub="critical" tone="accent" />
        <StatCard label="Total Lost Days" value={analytics.lostDays} sub="man-days lost" tone="amber" />
        <StatCard label="LTI Frequency" value={analytics.lti ? (analytics.lti / 1).toFixed(1) : "0.0"} sub="per year (indicative)" tone="brand" />
      </div>

      <div className="mb-4 grid gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <p className="mb-2 text-sm font-bold text-ink-800 dark:text-ink-100">Incident trend — last 8 months</p>
          <TrendChart labels={analytics.months.map(monthLabel)} series={[{ name: "Incidents", color: "#f97316", data: analytics.monthly }]} height={180} />
        </Card>
        <Card>
          <p className="mb-3 text-sm font-bold text-ink-800 dark:text-ink-100">Incident pyramid</p>
          {[
            { label: "LTI (lost time)", value: analytics.lti, color: "#f43f5e" },
            { label: "MTC (medical treatment)", value: rows.filter((r) => r.type === "MTC").length, color: "#f97316" },
            { label: "First Aid", value: rows.filter((r) => r.type === "First Aid").length, color: "#f59e0b" },
            { label: "Near Misses reported", value: 12, color: "#38bdf8" },
          ].map((l, i) => (
            <div key={l.label} className="mb-2">
              <div className="mb-1 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-ink-600 dark:text-ink-300">{l.label}</span>
                <span className="font-bold text-ink-800 dark:text-ink-100">{l.value}</span>
              </div>
              <div className="h-3 rounded-full bg-ink-100 dark:bg-ink-800" style={{ width: `${100 - i * 18}%` }}>
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, (l.value / Math.max(1, 12)) * 100)}%`, background: l.color }} />
              </div>
            </div>
          ))}
          <p className="mt-3 text-[10px] leading-relaxed text-ink-400">Heinrich-style view: strong near-miss reporting is your leading indicator.</p>
        </Card>
      </div>

      <Card>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input
            placeholder="Search incident no., type…"
            value={filters.q ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            className="w-full max-w-xs rounded-xl border-0 bg-ink-100/70 px-3.5 py-2.5 text-sm ring-1 ring-inset ring-ink-200 outline-none placeholder:text-ink-400 focus:bg-white focus:ring-2 focus:ring-brand-500 dark:bg-ink-800/70 dark:text-white dark:ring-ink-600/50 dark:focus:bg-ink-800"
          />
          <FilterBar
            filters={[
              { key: "status", label: "Status", options: ["Under Investigation", "Investigation Done", "CAPA Pending", "Closed"] },
              { key: "severity", label: "Severity", options: ["Low", "Medium", "High", "Critical"] },
              { key: "type", label: "Type", options: Array.from(new Set(rows.map((r) => r.type))) },
              { key: "department", label: "Department", options: Array.from(new Set(rows.map((r) => r.department))) },
            ]}
            values={filters}
            onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
          />
        </div>
        <DataTable
          rows={filtered}
          emptyTitle="No incidents match your filters"
          onRowClick={(r) => router.push("/incidents/" + r.id)}
          columns={[
            { key: "incident_number", label: "Incident No.", sortValue: (r) => r.incident_number, render: (r) => <span className="font-semibold text-rose-600 dark:text-rose-400">{r.incident_number}</span> },
            { key: "date", label: "Date", sortValue: (r) => r.date, render: (r) => <span>{fmtDate(r.date)}<span className="ml-1.5 text-[10px] text-ink-400">{r.time}</span></span> },
            { key: "type", label: "Type", sortValue: (r) => r.type, render: (r) => <Badge tone={r.type}>{r.type}</Badge> },
            { key: "severity", label: "Severity", sortValue: (r) => r.severity, render: (r) => <Badge tone={r.severity}>{r.severity}</Badge> },
            { key: "location", label: "Location", sortValue: (r) => r.location },
            { key: "injured_person", label: "Injured", render: (r) => r.injured_person ?? "—" },
            { key: "lost_days", label: "Lost Days", sortValue: (r) => r.lost_days, render: (r) => r.lost_days ? <span className="font-semibold text-rose-600">{r.lost_days}</span> : "0" },
            { key: "status", label: "Status", sortValue: (r) => r.status, render: (r) => <Badge tone={r.status}>{r.status}</Badge> },
          ]}
        />
      </Card>
    </div>
  );
}
