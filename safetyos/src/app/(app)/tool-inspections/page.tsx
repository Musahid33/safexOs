"use client";

// ─────────────────────────────────────────────────────────────
// SafetyOS — Tool Inspection
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useMemo, useState } from "react";
import { Wrench, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { listEntities, createEntity, logActivity } from "@/lib/api";
import type { ToolInspection } from "@/lib/types";
import { Badge, Button, Card, Field, Input, Modal, PageHeader, Select, Textarea, Toast } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { ExportMenu, FilterBar, KpiRow } from "@/components/module-kit";
import { fmtDate, uid } from "@/lib/utils";
import { db } from "@/lib/store";

const CHECKLIST = ["Guarding intact", "Power cable condition", "Earthing / insulation", "Moving parts smooth", "Test certificate valid", "Storage condition", "Marking / tagging present"];
const TOOL_CATS = ["Power Tool", "Lifting Tackle", "Access Equipment", "Hand Tool"];

export default function ToolInspectionsPage() {
  const { user, company } = useAuth();
  const [rows, setRows] = useState<ToolInspection[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [form, setForm] = useState({ tool_name: "", category: "Power Tool" });
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (company) listEntities("tool-inspections", company.id).then(setRows);
  }, [company]);

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (!filters.q || (r.tool_name + r.tool_code).toLowerCase().includes(filters.q.toLowerCase())) &&
          (!filters.status || r.status === filters.status) &&
          (!filters.category || r.category === filters.category)
      ),
    [rows, filters]
  );

  const submit = async () => {
    if (!company || !user) return;
    const checklist = CHECKLIST.map((item) => ({ item, ok: checks[item] ?? true, remark: "" }));
    const okCount = checklist.filter((c) => c.ok).length;
    const row: ToolInspection = {
      id: uid("tol-"), company_id: company.id, tool_name: form.tool_name,
      tool_code: "TL-" + Date.now().toString(36).toUpperCase(), category: form.category,
      date: new Date().toISOString().slice(0, 10), checklist, photos: [],
      status: okCount === CHECKLIST.length ? "Pass" : okCount >= 5 ? "Repair" : "Fail",
      remarks: remarks || "Tool inspection completed.", inspector: user.name,
    };
    await createEntity("tool-inspections", row);
    db.toolInspections.unshift(row);
    setRows((r) => [row, ...r]);
    logActivity(company.id, user.name, user.role, "Created", "Tool Inspection", form.tool_name);
    setOpen(false);
    setToast("Tool inspection recorded");
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div>
      <Toast msg={toast} />
      <PageHeader
        title="Tool Inspection"
        subtitle="Checklists for power tools, lifting tackle & access equipment"
        actions={
          <>
            <ExportMenu rows={filtered} filename="tool-inspections" columns={[
              { key: "tool_name", label: "Tool" }, { key: "tool_code", label: "Code" },
              { key: "category", label: "Category" }, { key: "date", label: "Date" },
              { key: "status", label: "Result" }, { key: "inspector", label: "Inspector" },
            ]} />
            {user && ["super_admin", "company_admin", "safety_officer", "supervisor"].includes(user.role) && (
              <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" /> New Inspection</Button>
            )}
          </>
        }
      />

      <KpiRow items={[
        { label: "Inspections", value: rows.length },
        { label: "Pass", value: rows.filter((r) => r.status === "Pass").length },
        { label: "Repair", value: rows.filter((r) => r.status === "Repair").length },
        { label: "Fail / Quarantined", value: rows.filter((r) => r.status === "Fail").length },
      ]} />

      <Card className="mt-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input
            placeholder="Search tool…"
            value={filters.q ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            className="w-full max-w-xs rounded-xl border-0 bg-ink-100/70 px-3.5 py-2.5 text-sm ring-1 ring-inset ring-ink-200 outline-none placeholder:text-ink-400 focus:bg-white focus:ring-2 focus:ring-brand-500 dark:bg-ink-800/70 dark:text-white dark:ring-ink-600/50 dark:focus:bg-ink-800"
          />
          <FilterBar
            filters={[
              { key: "status", label: "Result", options: ["Pass", "Repair", "Fail"] },
              { key: "category", label: "Category", options: TOOL_CATS },
            ]}
            values={filters}
            onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
          />
        </div>
        <DataTable
          rows={filtered}
          emptyTitle="No tool inspections recorded"
          columns={[
            { key: "tool_name", label: "Tool", sortValue: (r) => r.tool_name, render: (r) => <span className="font-semibold text-ink-800 dark:text-ink-100">{r.tool_name}</span> },
            { key: "tool_code", label: "Code" },
            { key: "category", label: "Category", sortValue: (r) => r.category },
            { key: "date", label: "Date", sortValue: (r) => r.date, render: (r) => fmtDate(r.date) },
            { key: "inspector", label: "Inspector" },
            { key: "remarks", label: "Remarks", render: (r) => <span className="block max-w-[200px] truncate text-xs text-ink-500">{r.remarks}</span> },
            { key: "status", label: "Result", sortValue: (r) => r.status, render: (r) => <Badge tone={r.status}>{r.status}</Badge> },
          ]}
        />
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Tool Inspection" wide>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tool name" required><Input placeholder="e.g. Pedestal Grinder" value={form.tool_name} onChange={(e) => setForm({ ...form, tool_name: e.target.value })} /></Field>
            <Field label="Category">
              <Select value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={TOOL_CATS.map((t) => ({ value: t, label: t }))} />
            </Field>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-ink-400">Checklist</p>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {CHECKLIST.map((c) => (
                <label key={c} className="flex items-center gap-2.5 rounded-xl bg-ink-50/80 px-3 py-2 text-xs font-medium text-ink-700 dark:bg-ink-800/60 dark:text-ink-200">
                  <input type="checkbox" checked={checks[c] ?? true} onChange={(e) => setChecks((x) => ({ ...x, [c]: e.target.checked }))} className="h-3.5 w-3.5 rounded accent-brand-600" />
                  {c}
                </label>
              ))}
            </div>
          </div>
          <Field label="Remarks"><Textarea rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} /></Field>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={!form.tool_name}>Save inspection</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
