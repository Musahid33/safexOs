"use client";

// ─────────────────────────────────────────────────────────────
// SafetyOS — Admin: Companies (tenant management)
// ─────────────────────────────────────────────────────────────
import React, { useState } from "react";
import { Building2, Plus, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/store";
import { Badge, Button, Card, Field, Input, Modal, PageHeader, Select, Toast } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { fmtDate, fmtINR } from "@/lib/utils";
import { logActivity } from "@/lib/api";

export default function CompaniesPage() {
  const { user, switchCompany } = useAuth();
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", industry: "Manufacturing", plan: "starter" });

  const create = () => {
    const id = form.slug.toLowerCase().replace(/[^a-z0-9-]/g, "") || "tenant" + (db.companies.length + 1);
    db.companies.push({
      id, name: form.name, slug: id, industry: form.industry,
      plan: form.plan as any,
      employeesLimit: form.plan === "starter" ? 100 : form.plan === "growth" ? 500 : 99999,
      accent: "#2563eb", status: "trial", city: "—", since: new Date().toISOString().slice(0, 10),
    });
    logActivity(id, user!.name, user!.role, "Created", "Company", form.name);
    setOpen(false);
    setForm({ name: "", slug: "", industry: "Manufacturing", plan: "starter" });
    setToast("Tenant created: " + form.slug + ".safetyos.com");
    setTimeout(() => setToast(null), 2800);
  };

  return (
    <div>
      <Toast msg={toast} />
      <PageHeader
        title="Companies"
        subtitle="Provision and manage tenants — each with isolated data, branding & users"
        actions={<Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" /> Add Company</Button>}
      />

      <Card>
        <DataTable
          rows={db.companies}
          columns={[
            { key: "name", label: "Company", sortValue: (r) => r.name, render: (r) => (
              <span className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-bold text-white" style={{ background: r.accent }}>
                  {r.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                </span>
                <span className="font-semibold text-ink-800 dark:text-ink-100">{r.name}</span>
              </span>
            ) },
            { key: "slug", label: "Subdomain", render: (r) => <span className="text-xs font-medium text-brand-600 dark:text-brand-400">{r.slug}.safetyos.com</span> },
            { key: "industry", label: "Industry" },
            { key: "plan", label: "Plan", sortValue: (r) => r.plan, render: (r) => <Badge tone={r.plan === "enterprise" ? "blue" : r.plan === "growth" ? "amber" : "sky"}>{r.plan}</Badge> },
            { key: "city", label: "Location" },
            { key: "since", label: "Since", sortValue: (r) => r.since, render: (r) => fmtDate(r.since) },
            { key: "status", label: "Status", sortValue: (r) => r.status, render: (r) => <Badge tone={r.status}>● {r.status}</Badge> },
            { key: "login", label: "", render: (r) => (
              <button
                onClick={() => { switchCompany(r.id); setToast("Switched into " + r.name); setTimeout(() => setToast(null), 2200); }}
                className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-brand-700"
              >
                Login as <ArrowRight className="h-3 w-3" />
              </button>
            ) },
          ]}
        />
      </Card>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          { t: "Provisioning", d: "New tenants get isolated schema rows, storage folders and branding instantly via company_id + RLS." },
          { t: "Custom domains", d: "Enterprise tenants can map their own domain with automatic SSL on Vercel." },
          { t: "Billing", d: `Starter ${fmtINR(2999)}/mo · Growth ${fmtINR(5999)}/mo · Enterprise custom.` },
        ].map((c) => (
          <Card key={c.t}>
            <p className="mb-1 flex items-center gap-1.5 text-sm font-bold text-ink-800 dark:text-ink-100"><Building2 className="h-4 w-4 text-brand-500" /> {c.t}</p>
            <p className="text-xs leading-relaxed text-ink-500 dark:text-ink-400">{c.d}</p>
          </Card>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Company">
        <div className="space-y-3.5">
          <Field label="Company name" required><Input placeholder="e.g. Sunrise Cements Ltd" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Subdomain" required hint="Will be created as {subdomain}.safetyos.com">
            <Input placeholder="sunrise" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Industry">
              <Select value={form.industry} onChange={(v) => setForm({ ...form, industry: v })} options={["Manufacturing", "Mining", "Steel Plant", "Construction", "Warehousing", "Logistics", "EPC", "Renewable Energy"].map((i) => ({ value: i, label: i }))} />
            </Field>
            <Field label="Plan">
              <Select value={form.plan} onChange={(v) => setForm({ ...form, plan: v })} options={[{ value: "starter", label: "Starter — ₹2,999/mo" }, { value: "growth", label: "Growth — ₹5,999/mo" }, { value: "enterprise", label: "Enterprise — Custom" }]} />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create} disabled={!form.name}>Create tenant</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
