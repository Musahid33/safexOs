"use client";

// ─────────────────────────────────────────────────────────────
// SafetyOS — Admin: Subscriptions & billing
// ─────────────────────────────────────────────────────────────
import React from "react";
import { Check, IndianRupee } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/store";
import { Badge, Button, Card, PageHeader, Toast } from "@/components/ui";
import { cx, fmtINR } from "@/lib/utils";
import { useState } from "react";

export default function SubscriptionsPage() {
  const { company } = useAuth();
  const [toast, setToast] = useState<string | null>(null);

  return (
    <div>
      <Toast msg={toast} />
      <PageHeader title="Subscriptions" subtitle="Plan management & billing across tenants" />

      <div className="grid gap-4 lg:grid-cols-3">
        {db.plans.map((p) => (
          <Card key={p.id} className={cx("relative flex flex-col", p.highlight && "ring-2 ring-brand-500 shadow-glow")}>
            {p.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-brand-600 to-brand-500 px-3 py-1 text-[10px] font-bold text-white shadow-md">
                MOST POPULAR
              </span>
            )}
            <p className="text-sm font-bold text-ink-800 dark:text-ink-100">{p.name}</p>
            <p className="mt-1 flex items-baseline gap-1">
              {p.price !== null && <IndianRupee className="h-3.5 w-3.5 text-ink-400" />}
              <span className="text-2xl font-extrabold text-ink-900 dark:text-white">{p.price !== null ? p.price.toLocaleString("en-IN") : "Custom"}</span>
              <span className="text-xs text-ink-400">/month</span>
            </p>
            <p className="text-[11px] text-ink-400">{p.employees === "Unlimited" ? "Unlimited employees" : `Up to ${p.employees} employees`}</p>
            <ul className="mt-4 flex-1 space-y-2">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-ink-600 dark:text-ink-300">
                  <span className="mt-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300">
                    <Check className="h-2.5 w-2.5" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <Button variant={p.highlight ? "primary" : "secondary"} className="mt-5 w-full" onClick={() => { setToast("Billing engine coming soon — plans are live in the schema"); setTimeout(() => setToast(null), 2500); }}>
              {p.price === null ? "Contact sales" : "Choose " + p.name}
            </Button>
          </Card>
        ))}
      </div>

      <Card className="mt-4">
        <p className="mb-3 text-sm font-bold text-ink-800 dark:text-ink-100">Tenant subscriptions</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-ink-100 dark:border-ink-800">
                {["Tenant", "Plan", "Billing", "Employees Used", "Renewal"].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-ink-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {db.companies.map((c) => {
                const used = db.employees.filter((e) => e.company_id === c.id).length;
                const limit = c.plan === "starter" ? 100 : c.plan === "growth" ? 500 : 99999;
                const price = c.plan === "starter" ? 2999 : c.plan === "growth" ? 5999 : 25000;
                return (
                  <tr key={c.id} className="border-b border-ink-50 dark:border-ink-800/50">
                    <td className="px-3 py-3 text-xs font-semibold text-ink-800 dark:text-ink-100">{c.name}</td>
                    <td className="px-3 py-3"><Badge tone={c.plan === "enterprise" ? "blue" : c.plan === "growth" ? "amber" : "sky"}>{c.plan}</Badge></td>
                    <td className="px-3 py-3 text-xs text-ink-600 dark:text-ink-300">{c.plan === "enterprise" ? "Custom invoice" : fmtINR(price) + " /mo"}</td>
                    <td className="px-3 py-3 text-xs text-ink-600 dark:text-ink-300">{used} / {limit === 99999 ? "∞" : limit} <span className="ml-1 text-[10px] text-ink-400">({Math.round((used / Math.max(1, limit)) * 100)}%)</span></td>
                    <td className="px-3 py-3 text-xs text-ink-600 dark:text-ink-300">Monthly · auto-renew</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
