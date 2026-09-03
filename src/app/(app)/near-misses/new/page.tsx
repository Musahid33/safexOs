"use client";

// ─────────────────────────────────────────────────────────────
// SafetyOS — Report a Near Miss (with photo compression)
// ─────────────────────────────────────────────────────────────
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { createEntity, logActivity, nextReportNumber } from "@/lib/api";
import { Button, Card, Field, Input, PageHeader, Select, Textarea, Toast } from "@/components/ui";
import { PhotoUpload } from "@/components/module-kit";
import { uid } from "@/lib/utils";
import { db, forCompany } from "@/lib/store";
import { isSupabaseMode } from "@/lib/supabase";
import { syncTenant } from "@/lib/sync";

const CATEGORIES = ["Slip / Trip", "Falling Object", "Equipment Failure", "Vehicle Movement", "Chemical Exposure", "Fire / Smoke", "Electrical", "Ergonomic", "Housekeeping"];

export default function NewNearMissPage() {
  const router = useRouter();
  const { user, company } = useAuth();
  const [toast, setToast] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [form, setForm] = useState({
    location: "", department: "", category: "", severity: "Medium",
    description: "", employee_name: "", time: new Date().toTimeString().slice(0, 5),
  });

  const employees = useMemo(() => forCompany(db.employees, company?.id ?? "").map((e) => e.name), [company]);
  const locations = useMemo(() => Array.from(new Set(forCompany(db.nearMisses, company?.id ?? "").map((r) => r.location))), [company]);
  const departments = useMemo(() => Array.from(new Set(forCompany(db.employees, company?.id ?? "").map((r) => r.department))), [company]);

  const submit = async () => {
    if (!company || !user) return;
    const number = await nextReportNumber("near-misses", company.id);
    const row = {
      id: uid("nm-"), company_id: company.id, report_number: number,
      date: new Date().toISOString().slice(0, 10), time: form.time,
      location: form.location || "Unspecified", department: form.department || "—",
      employee_name: form.employee_name || user.name,
      description: form.description, category: form.category || "Other", severity: form.severity,
      photos, status: "NEW", assigned_to: "",
      immediate_action: "", root_cause: "", five_whys: [], corrective_action: "",
      preventive_action: "", responsible_person: "", target_date: "",
      evidence: [], report_documents: [], rejection_reason: "", capa_id: null,
      officer_remarks: "",
      timeline: [{ date: new Date().toISOString().slice(0, 10), event: "Reported", note: "Near miss report submitted (photo + description + location)", actor: user.name }],
    };
    await createEntity("near-misses", row);
    db.nearMisses.unshift(row as any);
    if (isSupabaseMode) await syncTenant(company.id).catch(() => {});
    logActivity(company.id, user.name, user.role, "Created", "Near Miss", number);
    setToast("Near miss " + number + " submitted — status NEW ✓");
    setTimeout(() => router.push("/near-misses/" + row.id), 900);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Toast msg={toast} />
      <PageHeader title="Report a Near Miss" subtitle="You noticed it. You report it. You may have just saved a life." />
      <Card>
        <div className="mb-5 flex items-center gap-3 rounded-xl bg-brand-50 p-3.5 ring-1 ring-inset ring-brand-100 dark:bg-brand-500/10 dark:ring-brand-400/20">
          <ShieldAlert className="h-5 w-5 shrink-0 text-brand-600 dark:text-brand-400" />
          <p className="text-xs leading-relaxed text-brand-800 dark:text-brand-200">
            Near miss reporting is <strong>non-punitive</strong>. Your identity is protected under the company safety policy.
          </p>
        </div>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Location" required>
              <Select value={form.location} onChange={(v) => setForm({ ...form, location: v })} options={locations.map((l) => ({ value: l, label: l }))} allLabel="Select location…" />
            </Field>
            <Field label="Department">
              <Select value={form.department} onChange={(v) => setForm({ ...form, department: v })} options={departments.map((d) => ({ value: d, label: d }))} allLabel="Select…" />
            </Field>
            <Field label="Category" required>
              <Select value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={CATEGORIES.map((c) => ({ value: c, label: c }))} allLabel="Select category…" />
            </Field>
            <Field label="Potential severity" required>
              <Select value={form.severity} onChange={(v) => setForm({ ...form, severity: v })} options={["Low", "Medium", "High", "Critical"].map((s) => ({ value: s, label: s }))} />
            </Field>
            <Field label="Employee (if any)">
              <Select value={form.employee_name} onChange={(v) => setForm({ ...form, employee_name: v })} options={employees.map((n) => ({ value: n, label: n }))} allLabel="Anonymous / not applicable" />
            </Field>
            <Field label="Time"><Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></Field>
          </div>
          <Field label="What happened?" required hint="Describe the situation, what could have gone wrong, and what you did.">
            <Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. A pallet of boxes was left on the edge of the mezzanine walkway…" />
          </Field>
          <Field label="Photos / evidence">
            <PhotoUpload photos={photos} onAdd={(p) => setPhotos((x) => [...x, p])} />
          </Field>
          <div className="flex justify-end gap-2 border-t border-ink-100 pt-4 dark:border-ink-800">
            <Button variant="secondary" onClick={() => router.back()}>Cancel</Button>
            <Button onClick={submit} disabled={!form.description || !form.category}>Submit report</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
