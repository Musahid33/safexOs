"use client";

// ─────────────────────────────────────────────────────────────
// SafetyOS — Vehicle Inspection (daily checklist + defects)
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useMemo, useState } from "react";
import { Truck, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { listEntities, createEntity, logActivity } from "@/lib/api";
import type { VehicleInspection } from "@/lib/types";
import { Badge, Button, Card, Field, Input, Modal, PageHeader, Select, Textarea, Toast } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { ExportMenu, FilterBar, KpiRow } from "@/components/module-kit";
import { fmtDate, uid } from "@/lib/utils";
import { db } from "@/lib/store";

const CHECKLIST = ["Brakes & steering", "Horn & reverse alarm", "Lights & indicators", "Tyres condition", "Hydraulic leaks", "Fire extinguisher", "Seat belt / ROP", "Battery & cables", "Mirrors & visibility", "Load chart present"];

export default function VehicleInspectionsPage() {
  const { user, company } = useAuth();
  const [rows, setRows] = useState<VehicleInspection[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [form, setForm] = useState({ vehicle_number: "", vehicle_type: "Forklift", driver: "" });
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (company) listEntities("vehicle-inspections", company.id).then(setRows);
  }, [company]);

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (!filters.q || (r.vehicle_number + r.driver + r.vehicle_type).toLowerCase().includes(filters.q.toLowerCase())) &&
          (!filters.status || r.status === filters.status) &&
          (!filters.vehicle_type || r.vehicle_type === filters.vehicle_type)
      ),
    [rows, filters]
  );

  const defects = rows.flatMap((r) => r.defects);

  const submit = async () => {
    if (!company || !user) return;
    const checklist = CHECKLIST.map((item) => ({ item, ok: checks[item] ?? true, remark: "" }));
    const row: VehicleInspection = {
      id: uid("veh-"), company_id: company.id, vehicle_number: form.vehicle_number,
      vehicle_type: form.vehicle_type, date: new Date().toISOString().slice(0, 10), driver: form.driver,
      checklist, defects: checklist.filter((c) => !c.ok).map((c) => c.item), photos: [],
      inspected_by: user.name, approved_by: null,
      status: checklist.every((c) => c.ok) ? "Pending Approval" : "Pending Approval",
      remarks: remarks || "Daily inspection completed.",
    };
    await createEntity("vehicle-inspections", row);
    db.vehicleInspections.unshift(row);
    setRows((r) => [row, ...r]);
    logActivity(company.id, user.name, user.role, "Created", "Vehicle Inspection", form.vehicle_number);
    setOpen(false);
    setForm({ vehicle_number: "", vehicle_type: "Forklift", driver: "" });
    setChecks({});
    setRemarks("");
    setToast("Inspection recorded — sent for approval");
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div>
      <Toast msg={toast} />
      <PageHeader
        title="Vehicle Inspection"
        subtitle="Daily pre-use checklists, defects & approval workflow"
        actions={
          <>
            <ExportMenu rows={filtered} filename="vehicle-inspections" columns={[
              { key: "vehicle_number", label: "Vehicle" }, { key: "vehicle_type", label: "Type" },
              { key: "date", label: "Date" }, { key: "driver", label: "Driver" },
              { key: "inspected_by", label: "Inspected By" }, { key: "status", label: "Status" },
            ]} />
            {user && ["super_admin", "company_admin", "safety_officer", "supervisor"].includes(user.role) && (
              <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" /> New Inspection</Button>
            )}
          </>
        }
      />

      <KpiRow items={[
        { label: "Inspections", value: rows.length },
        { label: "Approved", value: rows.filter((r) => r.status === "Approved").length },
        { label: "Pending Approval", value: rows.filter((r) => r.status === "Pending Approval").length },
        { label: "Defects Found", value: defects.length },
      ]} />

      <Card className="mt-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input
            placeholder="Search vehicle, driver…"
            value={filters.q ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            className="w-full max-w-xs rounded-xl border-0 bg-ink-100/70 px-3.5 py-2.5 text-sm ring-1 ring-inset ring-ink-200 outline-none placeholder:text-ink-400 focus:bg-white focus:ring-2 focus:ring-brand-500 dark:bg-ink-800/70 dark:text-white dark:ring-ink-600/50 dark:focus:bg-ink-800"
          />
          <FilterBar
            filters={[
              { key: "status", label: "Status", options: ["Pending Approval", "Approved", "Rejected"] },
              { key: "vehicle_type", label: "Vehicle Type", options: Array.from(new Set(rows.map((r) => r.vehicle_type))) },
            ]}
            values={filters}
            onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
          />
        </div>
        <DataTable
          rows={filtered}
          emptyTitle="No inspections recorded"
          columns={[
            { key: "vehicle_number", label: "Vehicle", sortValue: (r) => r.vehicle_number, render: (r) => <span className="font-semibold text-brand-700 dark:text-brand-300">{r.vehicle_number}</span> },
            { key: "vehicle_type", label: "Type", sortValue: (r) => r.vehicle_type },
            { key: "date", label: "Date", sortValue: (r) => r.date, render: (r) => fmtDate(r.date) },
            { key: "driver", label: "Driver" },
            { key: "defects", label: "Defects", sortValue: (r) => r.defects.length, render: (r) => r.defects.length ? <Badge tone="rose">{r.defects.length} defects</Badge> : <Badge tone="emerald">Clear</Badge> },
            { key: "inspected_by", label: "Inspected By" },
            { key: "status", label: "Status", sortValue: (r) => r.status, render: (r) => <Badge tone={r.status}>{r.status}</Badge> },
          ]}
        />
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Daily Vehicle Inspection" wide>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Vehicle number" required><Input placeholder="TN-05-AB-1234" value={form.vehicle_number} onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })} /></Field>
            <Field label="Vehicle type">
              <Select value={form.vehicle_type} onChange={(v) => setForm({ ...form, vehicle_type: v })} options={["Forklift", "Hydra Crane", "Truck", "Tanker"].map((t) => ({ value: t, label: t }))} />
            </Field>
            <Field label="Driver / operator" className="col-span-2"><Input placeholder="Driver name" value={form.driver} onChange={(e) => setForm({ ...form, driver: e.target.value })} /></Field>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-ink-400">Checklist</p>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {CHECKLIST.map((c) => (
                <label key={c} className="flex items-center gap-2.5 rounded-xl bg-ink-50/80 px-3 py-2 text-xs font-medium text-ink-700 dark:bg-ink-800/60 dark:text-ink-200">
                  <input
                    type="checkbox"
                    checked={checks[c] ?? true}
                    onChange={(e) => setChecks((x) => ({ ...x, [c]: e.target.checked }))}
                    className="h-3.5 w-3.5 rounded accent-brand-600"
                  />
                  {c}
                </label>
              ))}
            </div>
          </div>
          <Field label="Remarks"><Textarea rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} /></Field>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={!form.vehicle_number}>Submit for approval</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
