"use client";

// ─────────────────────────────────────────────────────────────
// SafetyOS — Grievance (submit → acknowledge → resolve flow)
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HeartHandshake, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { listEntities, createEntity, logActivity, nextReportNumber } from "@/lib/api";
import type { Grievance } from "@/lib/types";
import { Badge, Button, Card, Field, Input, Modal, PageHeader, Select, Textarea, Toast } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { ExportMenu, FilterBar, KpiRow } from "@/components/module-kit";
import { fmtDate, uid } from "@/lib/utils";
import { db } from "@/lib/store";

const CATEGORIES = ["Workplace Safety", "Welfare Facilities", "PPE Quality", "Work Hours", "Other"];

export default function GrievancesPage() {
  const { user, company } = useAuth();
  const router = useRouter();
  const [rows, setRows] = useState<Grievance[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [form, setForm] = useState({ subject: "", category: "", description: "", anonymous: false });

  useEffect(() => {
    if (company) listEntities("grievances", company.id).then(setRows);
  }, [company]);

  const canCreate = user && ["super_admin", "company_admin", "safety_officer", "supervisor", "employee"].includes(user.role);

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (!filters.q || (r.grievance_number + r.subject + r.employee_name).toLowerCase().includes(filters.q.toLowerCase())) &&
          (!filters.status || r.status === filters.status) &&
          (!filters.category || r.category === filters.category)
      ),
    [rows, filters]
  );

  const submit = async () => {
    if (!company || !user) return;
    const number = await nextReportNumber("grievances", company.id);
    const row: Grievance = {
      id: uid("grv-"), company_id: company.id, grievance_number: number,
      employee_name: form.anonymous ? "Anonymous" : user.name,
      department: "—", category: form.category, subject: form.subject, description: form.description,
      status: "Open", officer_name: "Anitha Kumar", action_taken: "",
      employee_ack: false, filed_on: new Date().toISOString().slice(0, 10), resolved_on: null,
      anonymous: form.anonymous,
    };
    await createEntity("grievances", row);
    db.grievances.unshift(row);
    setRows((r) => [row, ...r]);
    logActivity(company.id, user.name, user.role, "Created", "Grievance", number);
    setOpen(false);
    setForm({ subject: "", category: "", description: "", anonymous: false });
    setToast("Grievance submitted — officer has been notified");
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div>
      <Toast msg={toast} />
      <PageHeader
        title="Grievance"
        subtitle="Employees submit · officers act · acknowledgement closes the loop"
        actions={
          <>
            <ExportMenu rows={filtered} filename="grievances" columns={[
              { key: "grievance_number", label: "Grievance No." }, { key: "filed_on", label: "Filed On" },
              { key: "employee_name", label: "Employee" }, { key: "category", label: "Category" },
              { key: "subject", label: "Subject" }, { key: "status", label: "Status" },
              { key: "officer_name", label: "Officer" },
            ]} />
            {canCreate && <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" /> Submit Grievance</Button>}
          </>
        }
      />

      <KpiRow items={[
        { label: "Total", value: rows.length },
        { label: "Open", value: rows.filter((r) => r.status === "Open").length },
        { label: "In Action", value: rows.filter((r) => r.status === "Acknowledged" || r.status === "In Action").length },
        { label: "Resolved", value: rows.filter((r) => r.status === "Resolved" || r.status === "Closed").length },
      ]} />

      <Card className="mt-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input
            placeholder="Search grievance no., subject…"
            value={filters.q ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            className="w-full max-w-xs rounded-xl border-0 bg-ink-100/70 px-3.5 py-2.5 text-sm ring-1 ring-inset ring-ink-200 outline-none placeholder:text-ink-400 focus:bg-white focus:ring-2 focus:ring-brand-500 dark:bg-ink-800/70 dark:text-white dark:ring-ink-600/50 dark:focus:bg-ink-800"
          />
          <FilterBar
            filters={[
              { key: "status", label: "Status", options: ["Open", "Acknowledged", "In Action", "Resolved", "Closed"] },
              { key: "category", label: "Category", options: CATEGORIES },
            ]}
            values={filters}
            onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
          />
        </div>
        <DataTable
          rows={filtered}
          emptyTitle="No grievances match your filters"
          onRowClick={(r) => router.push("/grievances/" + r.id)}
          columns={[
            { key: "grievance_number", label: "Grievance No.", sortValue: (r) => r.grievance_number, render: (r) => <span className="font-semibold text-brand-700 dark:text-brand-300">{r.grievance_number}</span> },
            { key: "filed_on", label: "Filed", sortValue: (r) => r.filed_on, render: (r) => fmtDate(r.filed_on) },
            { key: "employee_name", label: "Employee", sortValue: (r) => r.employee_name, render: (r) => <span>{r.anonymous ? "Anonymous" : r.employee_name}{r.anonymous && <Badge tone="ink">anon</Badge>}</span> },
            { key: "category", label: "Category", sortValue: (r) => r.category },
            { key: "subject", label: "Subject", render: (r) => <span className="block max-w-[240px] truncate">{r.subject}</span> },
            { key: "status", label: "Status", sortValue: (r) => r.status, render: (r) => <Badge tone={r.status}>{r.status}</Badge> },
            { key: "employee_ack", label: "Acknowledged", sortValue: (r) => (r.employee_ack ? 1 : 0), render: (r) => (r.employee_ack ? <Badge tone="emerald">Yes</Badge> : <Badge tone="amber">Pending</Badge>) },
          ]}
        />
      </Card>

      <Card className="mt-4">
        <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-ink-800 dark:text-ink-100"><HeartHandshake className="h-4 w-4 text-accent-500" /> How grievances flow</p>
        <div className="grid gap-2 text-[11px] sm:grid-cols-5">
          {["1. Employee submits", "2. Officer notified", "3. Officer acts", "4. Employee acknowledges", "5. PDF record"].map((s, i) => (
            <div key={s} className="rounded-xl bg-ink-50/80 px-3 py-2.5 font-medium text-ink-600 dark:bg-ink-800/60 dark:text-ink-300">
              {s}
              {i < 4 && <span className="ml-2 text-brand-400">→</span>}
            </div>
          ))}
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Submit Grievance">
        <div className="space-y-3.5">
          <Field label="Subject" required><Input placeholder="Brief subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></Field>
          <Field label="Category" required>
            <Select value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={CATEGORIES.map((c) => ({ value: c, label: c }))} allLabel="Select…" />
          </Field>
          <Field label="Details" required><Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <label className="flex items-center gap-2 text-xs text-ink-500">
            <input type="checkbox" checked={form.anonymous} onChange={(e) => setForm({ ...form, anonymous: e.target.checked })} className="h-3.5 w-3.5 rounded accent-brand-600" />
            Submit anonymously
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={!form.subject || !form.category}>Submit</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
