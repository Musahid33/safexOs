"use client";

// ─────────────────────────────────────────────────────────────
// SafetyOS — UI primitives (glassmorphism design system)
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useState } from "react";
import { X, ChevronDown, Search, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { cx, badgeTone, initials } from "@/lib/utils";

export function Button({
  children, onClick, variant = "primary", size = "md", className, type = "button", disabled, title,
}: {
  children: React.ReactNode; onClick?: () => void; variant?: "primary" | "secondary" | "ghost" | "danger" | "accent" | "success";
  size?: "sm" | "md" | "lg"; className?: string; type?: "button" | "submit"; disabled?: boolean; title?: string;
}) {
  const base = "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 disabled:opacity-50 disabled:cursor-not-allowed select-none";
  const sizes = { sm: "text-xs px-2.5 py-1.5", md: "text-sm px-3.5 py-2", lg: "text-sm px-5 py-2.5" };
  const variants = {
    primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm shadow-brand-600/30",
    accent: "bg-accent-500 text-white hover:bg-accent-600 shadow-sm shadow-accent-500/30",
    secondary: "bg-white text-ink-700 ring-1 ring-ink-200 hover:bg-ink-50 dark:bg-ink-800/80 dark:text-ink-100 dark:ring-ink-600/60 dark:hover:bg-ink-700/80",
    ghost: "text-ink-600 hover:bg-ink-100/70 dark:text-ink-300 dark:hover:bg-ink-800",
    danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-600/30",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/30",
  };
  return (
    <button type={type} title={title} disabled={disabled} onClick={onClick} className={cx(base, sizes[size], variants[variant], className)}>
      {children}
    </button>
  );
}

export function Card({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cx(
        "glass rounded-2xl p-5 transition-all duration-200",
        onClick && "cursor-pointer hover:-translate-y-0.5 hover:shadow-glass-lg",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Badge({ children, tone }: { children: React.ReactNode; tone?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset whitespace-nowrap", badgeTone(String(tone))) }>
      {children}
    </span>
  );
}

export function Dot({ tone }: { tone: string }) {
  return <span className={cx("inline-block h-1.5 w-1.5 rounded-full", badgeTone(tone).split(" ").find((c) => c.startsWith("bg-")))} />;
}

export function Avatar({ name, hue, size = 36 }: { name: string; hue?: number; size?: number }) {
  const h = hue ?? (name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360);
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white shadow-sm"
      style={{ width: size, height: size, fontSize: size * 0.36, background: `linear-gradient(135deg, hsl(${h},70%,52%), hsl(${(h + 50) % 360},70%,44%))` }}
    >
      {initials(name)}
    </div>
  );
}

export function StatCard({ label, value, sub, icon, trend, tone = "brand" }: {
  label: string; value: React.ReactNode; sub?: string; icon?: React.ReactNode; trend?: number; tone?: string;
}) {
  const tones: Record<string, string> = {
    brand: "from-blue-500 to-blue-600", accent: "from-orange-500 to-orange-600",
    emerald: "from-emerald-500 to-emerald-600", rose: "from-rose-500 to-rose-600",
    violet: "from-violet-500 to-violet-600", sky: "from-sky-500 to-sky-600", amber: "from-amber-500 to-amber-600",
  };
  return (
    <Card className="animate-fade-up">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-400 dark:text-ink-400">{label}</p>
          <p className="mt-1.5 text-2xl font-bold text-ink-900 dark:text-white">{value}</p>
          {sub && <p className="mt-1 text-xs text-ink-400">{sub}</p>}
          {trend !== undefined && (
            <p className={cx("mt-1 text-[11px] font-semibold", trend >= 0 ? "text-emerald-600" : "text-rose-600")}>
              {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}% vs last month
            </p>
          )}
        </div>
        {icon && (
          <div className={cx("flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md", tones[tone] ?? tones.brand)}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

// ── Form controls ────────────────────────────────────────────
export function Field({ label, children, required, hint, className }: { label: string; children: React.ReactNode; required?: boolean; hint?: string; className?: string }) {
  return (
    <label className={cx("block", className)}>
      <span className="mb-1.5 block text-xs font-semibold text-ink-600 dark:text-ink-300">
        {label} {required && <span className="text-accent-500">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-ink-400">{hint}</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border-0 bg-ink-100/70 px-3.5 py-2.5 text-sm text-ink-900 ring-1 ring-inset ring-ink-200 placeholder:text-ink-400 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition dark:bg-ink-800/70 dark:text-white dark:ring-ink-600/50 dark:focus:bg-ink-800";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return <input {...rest} className={cx(inputCls, className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return <textarea {...rest} className={cx(inputCls, "min-h-[90px] resize-y", className)} />;
}

export function Select({ value, onChange, options, className, allLabel }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
  className?: string; allLabel?: string;
}) {
  return (
    <div className={cx("relative", className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cx(inputCls, "appearance-none pr-8 cursor-pointer")}
      >
        {allLabel && <option value="">{allLabel}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder, className }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  return (
    <div className={cx("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Search…"}
        className={cx(inputCls, "pl-9")}
      />
    </div>
  );
}

export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cx(
        "relative inline-flex h-5.5 w-10 items-center rounded-full transition-colors duration-200 h-6",
        checked ? "bg-brand-600" : "bg-ink-300 dark:bg-ink-600"
      )}
    >
      <span className={cx("inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200", checked ? "translate-x-5" : "translate-x-1")} />
    </button>
  );
}

// ── Modal ────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, wide }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", fn); document.body.style.overflow = ""; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cx("glass-strong relative z-10 max-h-[88vh] w-full overflow-y-auto rounded-2xl p-6 shadow-glass-lg animate-fade-up", wide ? "max-w-3xl" : "max-w-lg")}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-ink-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Tabs ─────────────────────────────────────────────────────
export function Tabs({ tabs, active, onChange }: {
  tabs: { key: string; label: React.ReactNode }[]; active: string; onChange: (k: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-xl bg-ink-100/70 p-1 dark:bg-ink-800/70">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cx(
            "rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all",
            active === t.key
              ? "bg-white text-brand-700 shadow-sm dark:bg-ink-700 dark:text-white"
              : "text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-200"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── Page scaffolding ─────────────────────────────────────────
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-ink-900 dark:text-white sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ icon, title, body, action }: { icon?: React.ReactNode; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 py-16 text-center dark:border-ink-700">
      {icon && <div className="mb-3 text-ink-300 dark:text-ink-600">{icon}</div>}
      <p className="text-sm font-semibold text-ink-600 dark:text-ink-300">{title}</p>
      {body && <p className="mt-1 max-w-sm text-xs text-ink-400">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-ink-100 pt-3 dark:border-ink-700/60">
      <p className="text-xs text-ink-400">Page {page} of {pages}</p>
      <div className="flex gap-1.5">
        <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}><ChevronLeft className="h-3.5 w-3.5" /></Button>
        <Button size="sm" variant="secondary" disabled={page >= pages} onClick={() => onPage(page + 1)}><ChevronRight className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}

export function Progress({ value, tone = "brand" }: { value: number; tone?: string }) {
  const tones: Record<string, string> = { brand: "bg-brand-500", emerald: "bg-emerald-500", amber: "bg-amber-500", rose: "bg-rose-500", accent: "bg-accent-500" };
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
      <div className={cx("h-full rounded-full transition-all duration-500", tones[tone] ?? tones.brand)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function InfoNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-sky-50 px-3.5 py-2.5 text-xs text-sky-800 ring-1 ring-inset ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/20">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

export function Toast({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 animate-fade-up rounded-xl bg-ink-900 px-4 py-2.5 text-sm font-medium text-white shadow-glass-lg dark:bg-white dark:text-ink-900">
      {msg}
    </div>
  );
}
