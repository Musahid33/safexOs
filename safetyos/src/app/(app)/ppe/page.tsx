"use client";

// ─────────────────────────────────────────────────────────────
// SafetyOS — PPE Management (issues, stock, expiry, vendors)
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useMemo, useState } from "react";
import { HardHat, PackageX, AlertTriangle, IndianRupee } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { listEntities } from "@/lib/api";
import type { PPEIssue, PPEStock } from "@/lib/types";
import { Badge, Card, PageHeader, StatCard, Tabs } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { ExportMenu, FilterBar } from "@/components/module-kit";
import { fmtDate, fmtINR } from "@/lib/utils";
import { db, forCompany } from "@/lib/store";

export default function PPEPage() {
  const { company } = useAuth();
  const [issues, setIssues] = useState<PPEIssue[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [tab, setTab] = useState("issues");

  useEffect(() => {
    if (company) listEntities("ppe-issues", company.id).then(setIssues);
  }, [company]);

  const stock = useMemo(() => forCompany(db.ppeStock, company?.id ?? ""), [company]);

  const expiringSoon = useMemo(
    () => issues.filter((i) => i.expiry_date && new Date(i.expiry_date).getTime() - Date.now() < 90 * 86400000 && i.status === "Issued"),
    [issues]
  );
  const totalCost = issues.reduce((s, i) => s + i.cost, 0);
  const lowStock = stock.filter((s) => s.status !== "In Stock");
  const stockValue = stock.reduce((s, i) => s + i.quantity * i.cost_per_unit, 0);

  const filtered = useMemo(
    () =>
      issues.filter(
        (r) =>
          (!filters.q || (r.employee_name + r.item).toLowerCase().includes(filters.q.toLowerCase())) &&
          (!filters.status || r.status === filters.status) &&
          (!filters.department || r.department === filters.department)
      ),
    [issues, filters]
  );

  return (
    <div>
      <PageHeader
        title="PPE Management"
        subtitle="Issue · return · inspect · track expiry, stock, vendors & cost"
        actions={
          <ExportMenu rows={filtered} filename="ppe-issues" columns={[
            { key: "employee_name", label: "Employee" }, { key: "department", label: "Department" },
            { key: "item", label: "Item" }, { key: "issue_date", label: "Issued" },
            { key: "expiry_date", label: "Expiry" }, { key: "status", label: "Status" },
            { key: "vendor", label: "Vendor" }, { key: "cost", label: "Cost (₹)" },
          ]} />
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Issues (YTD)" value={issues.length} icon={<HardHat className="h-5 w-5" />} tone="accent" />
        <StatCard label="Expiring ≤ 90 days" value={expiringSoon.length} icon={<AlertTriangle className="h-5 w-5" />} tone="rose" />
        <StatCard label="Low / Out of Stock" value={lowStock.length} icon={<PackageX className="h-5 w-5" />} tone="amber" />
        <StatCard label="Stock Value" value={fmtINR(stockValue)} icon={<IndianRupee className="h-5 w-5" />} tone="emerald" sub={fmtINR(totalCost) + " issued cost"} />
      </div>

      <div className="mb-4"><Tabs active={tab} onChange={setTab} tabs={[
        { key: "issues", label: `Issues (${issues.length})` },
        { key: "stock", label: `Stock (${stock.length})` },
        { key: "expiry", label: `Expiry Tracker (${expiringSoon.length})` },
      ]} /></div>

      {tab === "issues" && (
        <Card>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <input
              placeholder="Search employee, item…"
              value={filters.q ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
              className="w-full max-w-xs rounded-xl border-0 bg-ink-100/70 px-3.5 py-2.5 text-sm ring-1 ring-inset ring-ink-200 outline-none placeholder:text-ink-400 focus:bg-white focus:ring-2 focus:ring-brand-500 dark:bg-ink-800/70 dark:text-white dark:ring-ink-600/50 dark:focus:bg-ink-800"
            />
            <FilterBar
              filters={[
                { key: "status", label: "Status", options: ["Issued", "Returned", "Replaced", "Expired"] },
                { key: "department", label: "Department", options: Array.from(new Set(issues.map((i) => i.department))) },
              ]}
              values={filters}
              onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
            />
          </div>
          <DataTable
            rows={filtered}
            emptyTitle="No PPE issues recorded"
            columns={[
              { key: "employee_name", label: "Employee", sortValue: (r) => r.employee_name, render: (r) => <span className="font-medium text-ink-800 dark:text-ink-100">{r.employee_name}</span> },
              { key: "department", label: "Department" },
              { key: "item", label: "Item", sortValue: (r) => r.item },
              { key: "issue_date", label: "Issued", sortValue: (r) => r.issue_date, render: (r) => fmtDate(r.issue_date) },
              { key: "expiry_date", label: "Expiry", sortValue: (r) => r.expiry_date, render: (r) => <span className={new Date(r.expiry_date).getTime() - Date.now() < 90 * 86400000 ? "font-semibold text-rose-600" : ""}>{fmtDate(r.expiry_date)}</span> },
              { key: "condition", label: "Condition" },
              { key: "vendor", label: "Vendor" },
              { key: "cost", label: "Cost", sortValue: (r) => r.cost, render: (r) => fmtINR(r.cost) },
              { key: "status", label: "Status", sortValue: (r) => r.status, render: (r) => <Badge tone={r.status}>{r.status}</Badge> },
            ]}
          />
        </Card>
      )}

      {tab === "stock" && (
        <Card>
          <DataTable
            rows={stock}
            columns={[
              { key: "item", label: "Item", sortValue: (r) => r.item, render: (r) => <span className="font-semibold text-ink-800 dark:text-ink-100">{r.item}</span> },
              { key: "quantity", label: "Qty", sortValue: (r) => r.quantity, render: (r) => <span className={r.quantity <= r.reorder_level ? "font-bold text-rose-600" : ""}>{r.quantity}</span> },
              { key: "reorder_level", label: "Reorder Level" },
              { key: "cost_per_unit", label: "Unit Cost", sortValue: (r) => r.cost_per_unit, render: (r) => fmtINR(r.cost_per_unit) },
              { key: "vendor", label: "Vendor" },
              { key: "value", label: "Value", render: (r) => fmtINR((r as any).quantity * (r as any).cost_per_unit) },
              { key: "status", label: "Status", sortValue: (r) => r.status, render: (r) => <Badge tone={r.status}>{r.status}</Badge> },
            ]}
          />
        </Card>
      )}

      {tab === "expiry" && (
        <Card>
          <p className="mb-3 text-sm font-bold text-ink-800 dark:text-ink-100">Items expiring within 90 days</p>
          <DataTable
            rows={expiringSoon}
            emptyTitle="Nothing expiring soon — all good"
            columns={[
              { key: "employee_name", label: "Employee" },
              { key: "item", label: "Item" },
              { key: "issue_date", label: "Issued", render: (r) => fmtDate(r.issue_date) },
              { key: "expiry_date", label: "Expires", sortValue: (r) => r.expiry_date, render: (r) => <Badge tone="rose">{fmtDate(r.expiry_date)}</Badge> },
              { key: "vendor", label: "Vendor" },
            ]}
          />
        </Card>
      )}
    </div>
  );
}
