"use client";

// ─────────────────────────────────────────────────────────────
// SafetyOS — Settings (company profile, branding, notifications)
// ─────────────────────────────────────────────────────────────
import React, { useState } from "react";
import { Save, Building2, Palette, Bell, Database } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Badge, Button, Card, Field, Input, PageHeader, Select, Toast, Toggle } from "@/components/ui";
import { db } from "@/lib/store";

export default function SettingsPage() {
  const { company, user } = useAuth();
  const [toast, setToast] = useState<string | null>(null);
  const [name, setName] = useState(company?.name ?? "");
  const [industry, setIndustry] = useState(company?.industry ?? "Manufacturing");
  const [accent, setAccent] = useState(company?.accent ?? "#2563eb");
  const [prefs, setPrefs] = useState({
    emailNearMiss: true, smsCritical: true, browserAll: true, whatsapp: false,
    weeklyDigest: true, incidentAlerts: true,
  });

  if (!company) return null;

  const save = () => {
    Object.assign(company, { name, industry, accent });
    setToast("Settings saved ✓");
    setTimeout(() => setToast(null), 2200);
  };

  return (
    <div>
      <Toast msg={toast} />
      <PageHeader
        title="Settings"
        subtitle="Company profile, branding & notification preferences"
        actions={<Button size="sm" onClick={save}><Save className="h-3.5 w-3.5" /> Save changes</Button>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <p className="mb-4 flex items-center gap-1.5 text-sm font-bold text-ink-800 dark:text-ink-100"><Building2 className="h-4 w-4 text-brand-500" /> Company profile</p>
            <div className="space-y-4">
              <Field label="Company name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Industry">
                  <Select value={industry} onChange={setIndustry} options={["Manufacturing", "Mining", "Steel Plant", "Construction", "Warehousing", "Logistics", "EPC", "Renewable Energy"].map((i) => ({ value: i, label: i }))} />
                </Field>
                <Field label="Subdomain" hint="Your unique tenant URL">
                  <Input value={company.slug + ".safetyos.com"} disabled className="opacity-60" />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Plan"><Input value={company.plan + " plan"} disabled className="opacity-60" /></Field>
                <Field label="Member since"><Input value={company.since} disabled className="opacity-60" /></Field>
              </div>
            </div>
          </Card>

          <Card>
            <p className="mb-4 flex items-center gap-1.5 text-sm font-bold text-ink-800 dark:text-ink-100"><Bell className="h-4 w-4 text-accent-500" /> Notification preferences</p>
            <div className="space-y-3">
              {[
                { key: "emailNearMiss", label: "Email — new near miss reports", desc: "Instant email when a near miss is filed" },
                { key: "smsCritical", label: "SMS — critical events only", desc: "SMS alerts for critical hazards & incidents" },
                { key: "browserAll", label: "Browser notifications", desc: "In-app + browser push notifications" },
                { key: "whatsapp", label: "WhatsApp (future)", desc: "Coming soon — WhatsApp Business integration" },
                { key: "weeklyDigest", label: "Weekly safety digest", desc: "Monday morning summary of all safety activity" },
                { key: "incidentAlerts", label: "Incident alerts", desc: "Immediate alert for any reported incident" },
              ].map((p) => (
                <div key={p.key} className="flex items-center justify-between gap-4 rounded-xl bg-ink-50/70 px-4 py-3 dark:bg-ink-800/50">
                  <div>
                    <p className="text-xs font-semibold text-ink-700 dark:text-ink-200">{p.label}</p>
                    <p className="text-[11px] text-ink-400">{p.desc}</p>
                  </div>
                  <Toggle checked={(prefs as any)[p.key]} onChange={(v) => setPrefs((x) => ({ ...x, [p.key]: v }))} />
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <p className="mb-4 flex items-center gap-1.5 text-sm font-bold text-ink-800 dark:text-ink-100"><Database className="h-4 w-4 text-emerald-500" /> Data & retention</p>
            <div className="space-y-3">
              <Field label="Record retention period">
                <Select value="5" onChange={() => {}} options={[{ value: "5", label: "5 years (recommended)" }, { value: "3", label: "3 years" }, { value: "10", label: "10 years" }]} />
              </Field>
              <p className="rounded-xl bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-800 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20">
                ✓ Row-level security active — data is isolated to <strong>{company.slug}</strong> tenant. All records carry company_id, created_by, updated_by and audit timestamps.
              </p>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <p className="mb-4 flex items-center gap-1.5 text-sm font-bold text-ink-800 dark:text-ink-100"><Palette className="h-4 w-4 text-violet-500" /> Branding</p>
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-extrabold text-white shadow-md" style={{ background: accent }}>
                {company.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
              </div>
              <div>
                <p className="text-sm font-bold text-ink-800 dark:text-ink-100">{company.name}</p>
                <p className="text-[11px] text-ink-400">Logo & accent colour</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="mb-1.5 text-xs font-semibold text-ink-600 dark:text-ink-300">Accent colour</p>
              <div className="flex flex-wrap gap-2">
                {["#2563eb", "#0d9488", "#7c3aed", "#f97316", "#dc2626", "#16a34a", "#0ea5e9"].map((c) => (
                  <button key={c} onClick={() => setAccent(c)} className="h-8 w-8 rounded-lg ring-2 ring-offset-2 transition dark:ring-offset-ink-950" style={{ background: c, boxShadow: accent === c ? "0 0 0 2px white, 0 0 0 4px " + c : "none" }} />
                ))}
              </div>
            </div>
            <p className="mt-3 text-[11px] text-ink-400">White-labelling: logo upload & custom domain available on Enterprise.</p>
          </Card>

          <Card>
            <p className="mb-3 text-sm font-bold text-ink-800 dark:text-ink-100">Tenant summary</p>
            <div className="space-y-2 text-xs">
              {[
                ["Subdomain", company.slug + ".safetyos.com"],
                ["Plan", company.plan],
                ["Status", company.status],
                ["Employees limit", String(company.employeesLimit)],
                ["City", company.city],
                ["Customer since", company.since],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-ink-400">{k}</span>
                  <span className="font-semibold text-ink-700 dark:text-ink-200">{v}</span>
                </div>
              ))}
            </div>
            <div className="mt-3"><Badge tone={company.status}>● {company.status}</Badge></div>
          </Card>

          <Card className="bg-gradient-to-br from-brand-600 to-brand-700 !border-transparent text-white">
            <p className="text-xs font-bold uppercase tracking-widest text-white/80">Signed in as</p>
            <p className="mt-1 text-sm font-bold">{user?.name}</p>
            <p className="text-[11px] text-white/70">{user?.email}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
