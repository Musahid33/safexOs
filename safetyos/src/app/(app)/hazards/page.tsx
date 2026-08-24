"use client";

// ─────────────────────────────────────────────────────────────
// SafetyOS — Hazard Reporting (list + risk analytics)
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Flame, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { listEntities } from "@/lib/api";
import type { Hazard } from "@/lib/types";
import { Badge, Button, Card, PageHeader } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { ExportMenu, FilterBar, KpiRow } from "@/components/module-kit";
import { Donut } from "@/components/charts";
import { fmtDate } from "@/lib/utils";

export default function HazardsPage() {
  const { user, company } = useAuth();
  const router = useRouter();
  const [rows, setRows] = useState<Hazard[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});

  useEffect(() => {
    if (company) listEntities("hazards", company.id).then(setRows);
  }, [company]);

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (!filters.q || (r.hazard_code + r.description + r.hazard_type).toLowerCase().includes(filters.q.toLowerCase())) &&
          (!filters.status || r.status === filters.status) &&
          (!filters.risk_level || r.risk_level === filters.risk_level) &&
          (!filters.hazard_type || r.hazard_type === filters.hazard_type)
      ),
    [rows, filters]
  );

  const analytics = useMemo(() => {
    const open = rows.filter((r) => r.status === "Open" || r.status === "In Progress").length;
    const high = rows.filter((r) => r.risk_level === "High" || r.risk_level === "Extreme").length;
    const byRisk = ["Low", "Medium", "High", "Extreme"].map((l) => ({
      label: l,
      value: rows.filter((r) => r.risk_level === l).length,
      color: l === "Low" ? "#38bdf8" : l === "Medium" ? "#f59e0b" : l === "High" ? "#f97316" : "#f43f5e",
    }));
    return { open, high, byRisk };
  }, [rows]);

  return (
    <div>
      <PageHeader
        title="Hazard Reporting"
        subtitle="Identify, assess and mitigate workplace hazards"
        actions={
          <>
            <ExportMenu rows={filtered} filename="hazards" columns={[
              { key: "hazard_code", label: "Hazard ID" }, { key: "location", label: "Location" },
              { key: "hazard_type", label: "Type" }, { key: "risk_level", label: "Risk Level" },
              { key: "status", label: "Status" }, { key: "description", label: "Description" },
            ]} />
            {user && ["super_admin", "company_admin", "safety_officer", "supervisor", "employee"].includes(user.role) && (
              <Button size="sm" onClick={() => router.push("/hazards?new=1")}><Plus className="h-3.5 w-3.5" /> Report Hazard</Button>
            )}
          </>
        }
      />

      <KpiRow items={[
        { label: "Total Hazards", value: rows.length },
        { label: "Open", value: analytics.open },
        { label: "High / Extreme", value: analytics.high },
        { label: "Mitigation Rate", value: rows.length ? Math.round(((rows.length - analytics.open) / rows.length) * 100) + "%" : "—" },
      ]} />

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <p className="mb-2 text-sm font-bold text-ink-800 dark:text-ink-100">Hazard register</p>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <input
              placeholder="Search hazard ID, type, description…"
              value={filters.q ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
              className="w-full max-w-xs rounded-xl border-0 bg-ink-100/70 px-3.5 py-2.5 text-sm ring-1 ring-inset ring-ink-200 outline-none placeholder:text-ink-400 focus:bg-white focus:ring-2 focus:ring-brand-500 dark:bg-ink-800/70 dark:text-white dark:ring-ink-600/50 dark:focus:bg-ink-800"
            />
            <FilterBar
              filters={[
                { key: "status", label: "Status", options: ["Open", "In Progress", "Mitigated", "Closed"] },
                { key: "risk_level", label: "Risk", options: ["Low", "Medium", "High", "Extreme"] },
                { key: "hazard_type", label: "Type", options: Array.from(new Set(rows.map((r) => r.hazard_type))) },
              ]}
              values={filters}
              onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
            />
          </div>
          <DataTable
            rows={filtered}
            emptyTitle="No hazards match your filters"
            onRowClick={(r) => router.push("/hazards/" + r.id)}
            columns={[
              { key: "hazard_code", label: "Hazard ID", sortValue: (r) => r.hazard_code, render: (r) => <span className="font-semibold text-brand-700 dark:text-brand-300">{r.hazard_code}</span> },
              { key: "location", label: "Location", sortValue: (r) => r.location },
              { key: "hazard_type", label: "Type", sortValue: (r) => r.hazard_type },
              { key: "risk_level", label: "Risk Level", sortValue: (r) => ["Low", "Medium", "High", "Extreme"].indexOf(r.risk_level), render: (r) => <Badge tone={r.risk_level}>{r.risk_level}</Badge> },
              { key: "assigned_officer", label: "Assigned Officer", render: (r) => <span className="text-xs text-ink-500">{r.assigned_officer}</span> },
              { key: "reported_on", label: "Reported", sortValue: (r) => r.reported_on, render: (r) => fmtDate(r.reported_on) },
              { key: "status", label: "Status", sortValue: (r) => r.status, render: (r) => <Badge tone={r.status}>{r.status}</Badge> },
            ]}
          />
        </Card>
        <div className="space-y-3">
          <Card>
            <p className="mb-2 text-sm font-bold text-ink-800 dark:text-ink-100">Risk distribution</p>
            <Donut data={analytics.byRisk} size={140} />
          </Card>
          <Card className="bg-gradient-to-br from-accent-500 to-accent-600 !border-transparent text-white">
            <Flame className="h-6 w-6 text-white/80" />
            <p className="mt-2 text-sm font-bold">Critical hazards need action</p>
            <p className="mt-1 text-xs leading-relaxed text-white/80">
              {analytics.high} high/extreme risk hazard{analytics.high === 1 ? "" : "s"} currently in the register. Mitigate immediately and verify controls.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
