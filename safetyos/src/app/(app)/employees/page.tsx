"use client";

// ─────────────────────────────────────────────────────────────
// SafetyOS — Employee Master (list + create + filters)
// ─────────────────────────────────────────────────────────────
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, UserPlus, QrCode, Award, ShieldAlert, Download } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { listEntities, createEntity, logActivity, nextReportNumber } from "@/lib/api";
import type { Employee } from "@/lib/types";
import { Avatar, Badge, Button, Card, Field, Input, Modal, PageHeader, Select, StatCard, Toast } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { FilterBar } from "@/components/module-kit";
import { downloadCSV, fmtDate, fmtNum, uid } from "@/lib/utils";
import { db, forCompany } from "@/lib/store";

export default function EmployeesPage() {
  const { user, company } = useAuth();
  const router = useRouter();
  const [rows, setRows] = useState<Employee[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", department: "", designation: "", phone: "", blood_group: "" });

  React.useEffect(() => {
    if (company) listEntities("employees", company.id, filters).then((r) => setRows(r));
  }, [company, filters]);

  const depts = useMemo(() => Array.from(new Set(rows.map((r) => r.department))), [rows]);
  const contractors = useMemo(() => Array.from(new Set(rows.map((r) => r.contractor).filter(Boolean) as string[])), [rows]);
  const stats = useMemo(() => {
    const active = rows.filter((r) => r.status === "active").length;
    const withViolations = rows.filter((r) => r.violations.length > 0).length;
    const rewarded = rows.filter((r) => r.rewards.length > 0).length;
    return { total: rows.length, active, withViolations, rewarded };
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) =>
      (!filters.q || (r.name + r.employee_code + r.designation + r.department).toLowerCase().includes(filters.q.toLowerCase())) &&
      (!filters.department || r.department === filters.department) &&
      (!filters.contractor || r.contractor === filters.contractor) &&
      (!filters.status || r.status === filters.status)
    );
  }, [rows, filters]);

  const create = () => {
    const code = company ? (company.slug.slice(0, 3).toUpperCase() + "-" + String(rows.length + 1).padStart(3, "0")) : "EMP-001";
    const emp: Employee = {
      id: uid("emp-"), company_id: company!.id, employee_code: code,
      name: form.name, department: form.department || "Production", designation: form.designation || "Operator",
      blood_group: form.blood_group || "O+", dob: "1995-05-12", joining_date: new Date().toISOString().slice(0, 10),
      contractor: null, phone: form.phone || "+91 90000 00000", email: form.name.toLowerCase().replace(/ /g, ".") + "@" + company!.slug + ".com",
      emergency_name: "—", emergency_phone: "—", status: "active", qr_token: uid("qr-"),
      violations: [], rewards: [], trainings: [], medical: [], ppe: [], certificates: [], documents: [],
    };
    createEntity("employees", emp).then(() => {
      db.employees.unshift(emp);
      setRows((r) => [emp, ...r]);
      logActivity(company!.id, user!.name, user!.role, "Created", "Employee", emp.employee_code);
      setOpen(false);
      setForm({ name: "", department: "", designation: "", phone: "", blood_group: "" });
      setToast("Employee " + emp.name + " added");
      setTimeout(() => setToast(null), 2500);
    });
  };

  return (
    <div>
      <Toast msg={toast} />
      <PageHeader
        title="Employee Master"
        subtitle={`${company?.name ?? ""} · centralised employee safety records with QR profiles`}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => downloadCSV("employees.csv", filtered, [
              { key: "employee_code", label: "Employee ID" }, { key: "name", label: "Name" },
              { key: "department", label: "Department" }, { key: "designation", label: "Designation" },
              { key: "blood_group", label: "Blood Group" }, { key: "phone", label: "Phone" },
              { key: "status", label: "Status" },
            ])}><Download className="h-3.5 w-3.5" /> Export</Button>
            <Button size="sm" onClick={() => setOpen(true)}><UserPlus className="h-3.5 w-3.5" /> Add Employee</Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total Employees" value={fmtNum(stats.total)} icon={<Users className="h-5 w-5" />} tone="brand" />
        <StatCard label="Active" value={fmtNum(stats.active)} icon={<Users className="h-5 w-5" />} tone="emerald" />
        <StatCard label="With Violations" value={stats.withViolations} icon={<ShieldAlert className="h-5 w-5" />} tone="rose" />
        <StatCard label="Rewarded" value={stats.rewarded} icon={<Award className="h-5 w-5" />} tone="accent" />
      </div>

      <Card>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Input placeholder="Search name, ID, designation…" value={filters.q ?? ""} onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))} className="max-w-xs" />
          <FilterBar
            filters={[
              { key: "department", label: "Departments", options: depts },
              { key: "contractor", label: "Contractors", options: contractors },
              { key: "status", label: "Status", options: ["active", "inactive"] },
            ]}
            values={filters}
            onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
          />
        </div>
        <DataTable
          rows={filtered}
          emptyTitle="No employees match your filters"
          onRowClick={(r) => router.push("/employees/" + r.id)}
          columns={[
            { key: "employee_code", label: "Employee ID", sortValue: (r) => r.employee_code, render: (r) => <span className="font-semibold text-brand-700 dark:text-brand-300">{r.employee_code}</span> },
            { key: "name", label: "Name", sortValue: (r) => r.name, render: (r) => (
              <span className="flex items-center gap-2.5"><Avatar name={r.name} size={28} /><span className="font-medium text-ink-800 dark:text-ink-100">{r.name}</span></span>
            ) },
            { key: "department", label: "Department", sortValue: (r) => r.department },
            { key: "designation", label: "Designation", sortValue: (r) => r.designation },
            { key: "contractor", label: "Contractor", render: (r) => r.contractor ?? <span className="text-ink-300">—</span> },
            { key: "blood_group", label: "Blood Group" },
            { key: "violations", label: "Violations", sortValue: (r) => r.violations.length, render: (r) => r.violations.length ? <Badge tone="rose">{r.violations.length} open</Badge> : <Badge tone="emerald">0</Badge> },
            { key: "status", label: "Status", sortValue: (r) => r.status, render: (r) => <Badge tone={r.status}>{r.status}</Badge> },
            { key: "qr", label: "QR", render: () => <QrCode className="h-4 w-4 text-ink-400" /> },
          ]}
        />
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Employee">
        <div className="space-y-3.5">
          <Field label="Full name" required><Input placeholder="e.g. Ramesh Kumar" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Department" required>
              <Select value={form.department} onChange={(v) => setForm({ ...form, department: v })} options={["Production", "Maintenance", "EHS", "Warehouse", "Quality", "HR", "Logistics"].map((d) => ({ value: d, label: d }))} allLabel="Select…" />
            </Field>
            <Field label="Designation"><Input placeholder="e.g. Operator" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} /></Field>
            <Field label="Phone"><Input placeholder="+91 …" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Blood group">
              <Select value={form.blood_group} onChange={(v) => setForm({ ...form, blood_group: v })} options={["A+", "B+", "O+", "AB+", "A-", "O-"].map((b) => ({ value: b, label: b }))} />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create} disabled={!form.name}>Save employee</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
