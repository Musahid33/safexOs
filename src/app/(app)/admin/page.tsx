"use client";

// ─────────────────────────────────────────────────────────────
// SafetyOS — Admin dashboard (platform-wide, multi-tenant view)
// ─────────────────────────────────────────────────────────────
import React, { useMemo } from "react";
import { Building2, Users, IndianRupee, Activity, TrendingUp } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { db, forCompany, tenantStats } from "@/lib/store";
import { Badge, Card, PageHeader, StatCard } from "@/components/ui";
import { Bars, Donut } from "@/components/charts";
import { fmtINR } from "@/lib/utils";

export default function AdminDashboardPage() {
  const { company } = useAuth();

  const platform = useMemo(() => {
    const totalEmps = db.employees.length;
    const totalEvents = db.nearMisses.length + db.hazards.length + db.incidents.length;
    const mrr = db.companies.reduce((s, c) => s + (c.plan === "starter" ? 2999 : c.plan === "growth" ? 5999 : 25000), 0);
    const byCompany = db.companies.map((c) => ({
      label: c.name.split(" ")[0],
      value: forCompany(db.employees, c.id).length + forCompany(db.nearMisses, c.id).length + forCompany(db.hazards, c.id).length + forCompany(db.incidents, c.id).length,
    }));
    const planMix = [
      { label: "Starter", value: db.companies.filter((c) => c.plan === "starter").length, color: "#38bdf8" },
      { label: "Growth", value: db.companies.filter((c) => c.plan === "growth").length, color: "#f59e0b" },
      { label: "Enterprise", value: db.companies.filter((c) => c.plan === "enterprise").length, color: "#2563eb" },
    ];
    return { totalEmps, totalEvents, mrr, byCompany, planMix };
  }, []);

  const latest = db.activityLogs.slice(0, 8);

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Platform-wide operations across all tenants"
      />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Tenants" value={db.companies.length} icon={<Building2 className="h-5 w-5" />} tone="brand" sub={db.companies.filter((c) => c.status === "trial").length + " in trial"} />
        <StatCard label="Users / Employees" value={db.employees.length} icon={<Users className="h-5 w-5" />} tone="emerald" />
        <StatCard label="Safety Records" value={platform.totalEvents} icon={<Activity className="h-5 w-5" />} tone="accent" />
        <StatCard label="MRR" value={fmtINR(platform.mrr)} icon={<IndianRupee className="h-5 w-5" />} tone="violet" sub="indicative billing" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <p className="mb-2 text-sm font-bold text-ink-800 dark:text-ink-100">Records per tenant</p>
          <Bars data={platform.byCompany} height={230} tone="#f97316" />
        </Card>
        <div className="space-y-4">
          <Card>
            <p className="mb-2 text-sm font-bold text-ink-800 dark:text-ink-100">Plan mix</p>
            <Donut data={platform.planMix} size={130} />
          </Card>
          <Card className="bg-gradient-to-br from-violet-500 to-violet-600 !border-transparent text-white">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-white/80"><TrendingUp className="h-3.5 w-3.5" /> Growth</p>
            <p className="mt-2 text-sm leading-relaxed text-white/90">
              2 new tenants this quarter. ABC Logistics is in trial — convert before 30 Aug.
            </p>
          </Card>
        </div>
      </div>

      <Card className="mt-4">
        <p className="mb-3 text-sm font-bold text-ink-800 dark:text-ink-100">Tenant health</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-ink-100 dark:border-ink-800">
                {["Tenant", "Subdomain", "Plan", "Employees", "Open CAPA", "LTI Free Days", "Status"].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-ink-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {db.companies.map((c) => {
                const s = tenantStats(c.id);
                return (
                  <tr key={c.id} className="border-b border-ink-50 dark:border-ink-800/50">
                    <td className="px-3 py-3 text-xs font-semibold text-ink-800 dark:text-ink-100">{c.name}</td>
                    <td className="px-3 py-3 text-xs text-brand-600 dark:text-brand-400">{c.slug}.safetyos.com</td>
                    <td className="px-3 py-3"><Badge tone={c.plan === "enterprise" ? "blue" : c.plan === "growth" ? "amber" : "sky"}>{c.plan}</Badge></td>
                    <td className="px-3 py-3 text-xs text-ink-600 dark:text-ink-300">{s.employees}</td>
                    <td className="px-3 py-3 text-xs text-ink-600 dark:text-ink-300">{s.openCapa}</td>
                    <td className="px-3 py-3 text-xs font-semibold text-emerald-600">{s.ltiFreeDays} days</td>
                    <td className="px-3 py-3"><Badge tone={c.status}>● {c.status}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-4">
        <p className="mb-3 text-sm font-bold text-ink-800 dark:text-ink-100">Latest platform activity</p>
        <div className="space-y-1.5">
          {latest.map((l) => (
            <div key={l.id} className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs hover:bg-ink-50 dark:hover:bg-ink-800/60">
              <span className="w-28 shrink-0 font-semibold text-ink-700 dark:text-ink-200">{l.user}</span>
              <span className="min-w-0 flex-1 truncate text-ink-500 dark:text-ink-400">{l.details}</span>
              <Badge tone="ink">{l.entity}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
