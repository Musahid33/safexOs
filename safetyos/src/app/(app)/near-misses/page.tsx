"use client";

// ─────────────────────────────────────────────────────────────
// SafetyOS — Near Miss (list + analytics)
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Plus, TrendingUp } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { listEntities, severityOrder } from "@/lib/api";
import type { NearMiss } from "@/lib/types";
import { Badge, Button, Card, PageHeader, StatCard } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { ExportMenu, FilterBar, KpiRow } from "@/components/module-kit";
import { Bars, Donut } from "@/components/charts";
import { fmtDate, monthKey, monthLabel } from "@/lib/utils";

export default function NearMissPage() {
  const { user, company } = useAuth();
  const router = useRouter();
  const [rows, setRows] = useState<NearMiss[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});

  useEffect(() => {
    if (company) listEntities("near-misses", company.id).then(setRows);
  }, [company]);

  const canCreate = user && ["super_admin", "company_admin", "safety_officer", "supervisor", "employee"].includes(user.role);

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (!filters.q || (r.report_number + r.description + r.employee_name + r.category).toLowerCase().includes(filters.q.toLowerCase())) &&
          (!filters.status || r.status === filters.status) &&
          (!filters.severity || r.severity === filters.severity) &&
          (!filters.category || r.category === filters.category) &&
          (!filters.department || r.department === filters.department)
      ),
    [rows, filters]
  );

  const analytics = useMemo(() => {
    const open = rows.filter((r) => r.status !== "Closed" && r.status !== "Verified").length;
    const closed = rows.length - open;
    const byCategory = Object.entries(
      rows.reduce<Record<string, number>>((a, r) => ((a[r.category] = (a[r.category] ?? 0) + 1), a), {})
    )
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
    const bySeverity = severityOrder.map((s) => ({
      label: s,
      value: rows.filter((r) => r.severity === s).length,
      color: s === "Low" ? "#38bdf8" : s === "Medium" ? "#f59e0b" : s === "High" ? "#f97316" : "#f43f5e",
    }));
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return d.toISOString().slice(0, 7);
    });
    const monthly = months.map((m) => rows.filter((r) => monthKey(r.date) === m).length);
    return { open, closed, byCategory, bySeverity, months, monthly };
  }, [rows]);

  return (
    <div>
      <PageHeader
        title="Near Miss"
        subtitle="Report, investigate and close near misses before they become incidents"
        actions={
          <>
            <ExportMenu rows={filtered} filename="near-misses" columns={[
              { key: "report_number", label: "Report Number" }, { key: "date", label: "Date" },
              { key: "location", label: "Location" }, { key: "department", label: "Department" },
              { key: "employee_name", label: "Employee" }, { key: "category", label: "Category" },
              { key: "severity", label: "Severity" }, { key: "status", label: "Status" },
              { key: "description", label: "Description" },
            ]} />
            {canCreate && (
              <Button size="sm" onClick={() => router.push("/near-misses/new")}>
                <Plus className="h-3.5 w-3.5" /> Report Near Miss
              </Button>
            )}
          </>
        }
      />

      <KpiRow items={[
        { label: "Total Reports", value: rows.length },
        { label: "Open", value: analytics.open },
        { label: "Closed / Verified", value: analytics.closed },
        { label: "Closure Rate", value: rows.length ? Math.round((analytics.closed / rows.length) * 100) + "%" : "—" },
      ]} />

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <p className="mb-2 text-sm font-bold text-ink-800 dark:text-ink-100">Monthly reporting trend</p>
          <Bars data={analytics.months.map((m, i) => ({ label: monthLabel(m), value: analytics.monthly[i] }))} height={210} />
        </Card>
        <Card>
          <p className="mb-2 text-sm font-bold text-ink-800 dark:text-ink-100">Severity distribution</p>
          <Donut data={analytics.bySeverity} size={140} />
        </Card>
      </div>

      <Card className="mt-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input
            placeholder="Search report no., description, employee…"
            value={filters.q ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            className="w-full max-w-xs rounded-xl border-0 bg-ink-100/70 px-3.5 py-2.5 text-sm ring-1 ring-inset ring-ink-200 outline-none placeholder:text-ink-400 focus:bg-white focus:ring-2 focus:ring-brand-500 dark:bg-ink-800/70 dark:text-white dark:ring-ink-600/50 dark:focus:bg-ink-800"
          />
          <FilterBar
            filters={[
              { key: "status", label: "Status", options: ["Open", "Under Review", "CAPA Pending", "Closed", "Verified"] },
              { key: "severity", label: "Severity", options: ["Low", "Medium", "High", "Critical"] },
              { key: "category", label: "Category", options: Array.from(new Set(rows.map((r) => r.category))) },
              { key: "department", label: "Department", options: Array.from(new Set(rows.map((r) => r.department))) },
            ]}
            values={filters}
            onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
          />
        </div>
        <DataTable
          rows={filtered}
          emptyTitle="No near misses match your filters"
          emptyBody={canCreate ? "Report the first one to start building your safety culture." : undefined}
          onRowClick={(r) => router.push("/near-misses/" + r.id)}
          columns={[
            { key: "report_number", label: "Report No.", sortValue: (r) => r.report_number, render: (r) => <span className="font-semibold text-brand-700 dark:text-brand-300">{r.report_number}</span> },
            { key: "date", label: "Date", sortValue: (r) => r.date, render: (r) => <span>{fmtDate(r.date)}<span className="ml-1.5 text-[10px] text-ink-400">{r.time}</span></span> },
            { key: "location", label: "Location", sortValue: (r) => r.location },
            { key: "category", label: "Category", sortValue: (r) => r.category },
            { key: "employee_name", label: "Employee", sortValue: (r) => r.employee_name },
            { key: "severity", label: "Severity", sortValue: (r) => severityOrder.indexOf(r.severity), render: (r) => <Badge tone={r.severity}>{r.severity}</Badge> },
            { key: "status", label: "Status", sortValue: (r) => r.status, render: (r) => <Badge tone={r.status}>{r.status}</Badge> },
            { key: "assigned_to", label: "Assigned To", render: (r) => <span className="text-xs text-ink-500">{r.assigned_to}</span> },
          ]}
        />
      </Card>

      <Card className="mt-4">
        <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ink-800 dark:text-ink-100">
          <TrendingUp className="h-4 w-4 text-accent-500" /> Category breakdown
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          <Bars data={analytics.byCategory} tone="#3b82f6" height={180} />
          <div className="rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 p-4 text-white">
            <p className="text-xs font-bold uppercase tracking-widest text-white/80">Insight</p>
            <p className="mt-2 text-sm leading-relaxed text-white/90">
              {analytics.byCategory[0]
                ? `"${analytics.byCategory[0].label}" is your top near-miss category (${analytics.byCategory[0].value} reports). Consider a targeted toolbox talk this week.`
                : "Start reporting near misses to unlock analytics."}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
