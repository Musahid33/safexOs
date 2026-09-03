"use client";

// ─────────────────────────────────────────────────────────────
// SafetyOS — Login (email + password, demo accounts, OTP/Google placeholders)
// ─────────────────────────────────────────────────────────────
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Mail, Lock, Eye, EyeOff, ArrowRight, Factory, Truck, HardHat, BarChart3, ShieldCheck, Globe } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/roles";
import { Button, Field, Input, Toast } from "@/components/ui";
import { cx } from "@/lib/utils";
import type { Role } from "@/lib/types";

const DEMO_ACCOUNTS: { email: string; role: Role }[] = [
  { email: "superadmin@demo.com", role: "super_admin" },
  { email: "admin@demo.com", role: "company_admin" },
  { email: "officer@demo.com", role: "safety_officer" },
  { email: "supervisor@demo.com", role: "supervisor" },
  { email: "employee@demo.com", role: "employee" },
  { email: "guest@demo.com", role: "guest" },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, demoMode } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e?: React.FormEvent, quick?: string) => {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(quick ?? email, password || "demo1234");
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message ?? "Login failed. Check credentials.");
    }
    setBusy(false);
  };

  return (
    <div className="auth-bg flex min-h-screen items-center justify-center p-4">
      <Toast msg={error} />
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl shadow-glass-lg lg:grid-cols-2">
        {/* Brand panel */}
        <div className="relative hidden flex-col justify-between bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 p-10 text-white lg:flex">
          <div className="absolute inset-0 opacity-15" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px)", backgroundSize: "26px 26px" }} />
          <div className="relative">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
                <Shield className="h-5.5 w-5.5 h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-extrabold tracking-tight">Safety<span className="text-accent-300">OS</span></p>
                <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-white/70">One Platform. Complete Workplace Safety.</p>
              </div>
            </div>
            <h1 className="mt-10 text-3xl font-bold leading-snug">
              Digitize every safety process.<br />Eliminate paper records.
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              Multi-tenant HSE management for Manufacturing, Mining, Construction, Warehousing, Logistics & Process Plants.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3 text-xs">
              {[
                { icon: <Factory className="h-4 w-4" />, label: "Incidents, Near Miss & Hazards" },
                { icon: <HardHat className="h-4 w-4" />, label: "Training, PPE & Inspections" },
                { icon: <BarChart3 className="h-4 w-4" />, label: "Dashboards & Analytics" },
                { icon: <ShieldCheck className="h-4 w-4" />, label: "Row-Level Security per tenant" },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2.5 ring-1 ring-white/10 backdrop-blur">
                  <span className="text-accent-300">{f.icon}</span>
                  <span className="font-medium text-white/85">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative flex items-center gap-4 text-[11px] text-white/60">
            <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> emveess.safetyos.com · revathi.safetyos.com · abc.safetyos.com</span>
          </div>
        </div>

        {/* Form panel */}
        <div className="bg-white/80 p-8 backdrop-blur-2xl dark:bg-ink-900/80 sm:p-10">
          <div className="mb-7 lg:hidden">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-extrabold tracking-tight text-ink-900 dark:text-white">Safety<span className="text-brand-600 dark:text-brand-400">OS</span></p>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-bold text-ink-900 dark:text-white">Welcome back</h2>
          <p className="mt-1 text-sm text-ink-400">Sign in to your safety platform</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label="Email address" required>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <Input type="email" required placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" />
              </div>
            </Field>
            <Field label="Password" required>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <Input type={show ? "text" : "password"} required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10" />
                <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-ink-500 dark:text-ink-400">
                <input type="checkbox" defaultChecked className="h-3.5 w-3.5 rounded accent-brand-600" /> Remember me
              </label>
              <Link href="/forgot-password" className="font-semibold text-brand-600 hover:underline">Forgot password?</Link>
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"} {!busy && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-ink-300">
            <span className="h-px flex-1 bg-ink-200 dark:bg-ink-700" /> or <span className="h-px flex-1 bg-ink-200 dark:bg-ink-700" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" size="sm" disabled title="Coming soon">Google Login</Button>
            <Button variant="secondary" size="sm" disabled title="Coming soon">OTP Login</Button>
          </div>

          {demoMode && (
            <div className="mt-6 rounded-2xl bg-brand-50/80 p-3.5 ring-1 ring-inset ring-brand-100 dark:bg-brand-500/10 dark:ring-brand-400/20">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-brand-700 dark:text-brand-300">
                Demo accounts — click to sign in
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {DEMO_ACCOUNTS.map((a) => (
                  <button
                    key={a.email}
                    onClick={() => submit(undefined, a.email)}
                    className={cx(
                      "rounded-lg px-2.5 py-1.5 text-left text-[11px] font-medium transition",
                      "bg-white text-ink-700 ring-1 ring-inset ring-brand-200 hover:ring-brand-400 dark:bg-ink-800 dark:text-ink-200 dark:ring-brand-400/30"
                    )}
                  >
                    <span className="block font-semibold">{ROLE_LABELS[a.role]}</span>
                    <span className="block text-[9.5px] text-ink-400">{a.email}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="mt-6 text-center text-[11px] text-ink-400">
            Protected by tenant isolation & row-level security · <span className="font-semibold">SafetyOS v1.0</span>
          </p>
        </div>
      </div>
    </div>
  );
}
