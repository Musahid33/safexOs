"use client";

// ─────────────────────────────────────────────────────────────
// SafetyOS — app shell: sidebar + topbar + tenant switcher
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Search, FileText, Bell, ShieldAlert, Flame, FileWarning, ClipboardCheck,
  Users, HeartHandshake, GraduationCap, HardHat, Truck, Wrench, FolderOpen, ShieldCheck,
  Building2, CreditCard, Activity, Settings, LogOut, Sun, Moon, Menu, X, ChevronDown,
  Globe, CheckCheck, Shield, Zap,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { navForRole, ROLE_LABELS } from "@/lib/roles";
import { db, forCompany } from "@/lib/store";
import { syncTenant } from "@/lib/sync";
import { cx, relativeTime } from "@/lib/utils";
import { Avatar, Badge } from "./ui";
import type { Role } from "@/lib/types";

const ICONS: Record<string, React.ReactNode> = {
  dashboard: <LayoutDashboard className="h-[17px] w-[17px]" />,
  search: <Search className="h-[17px] w-[17px]" />,
  filetext: <FileText className="h-[17px] w-[17px]" />,
  bell: <Bell className="h-[17px] w-[17px]" />,
  alert: <ShieldAlert className="h-[17px] w-[17px]" />,
  flame: <Flame className="h-[17px] w-[17px]" />,
  filewarning: <FileWarning className="h-[17px] w-[17px]" />,
  clipboard: <ClipboardCheck className="h-[17px] w-[17px]" />,
  users: <Users className="h-[17px] w-[17px]" />,
  heart: <HeartHandshake className="h-[17px] w-[17px]" />,
  gradcap: <GraduationCap className="h-[17px] w-[17px]" />,
  hardhat: <HardHat className="h-[17px] w-[17px]" />,
  truck: <Truck className="h-[17px] w-[17px]" />,
  wrench: <Wrench className="h-[17px] w-[17px]" />,
  folder: <FolderOpen className="h-[17px] w-[17px]" />,
  shield: <Shield className="h-[17px] w-[17px]" />,
  building: <Building2 className="h-[17px] w-[17px]" />,
  creditcard: <CreditCard className="h-[17px] w-[17px]" />,
  shieldcheck: <ShieldCheck className="h-[17px] w-[17px]" />,
  activity: <Activity className="h-[17px] w-[17px]" />,
  settings: <Settings className="h-[17px] w-[17px]" />,
};

export function Logo({ small }: { small?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 text-white shadow-md shadow-brand-600/40">
        <Shield className="h-5 w-5" />
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-accent-500 ring-2 ring-white dark:ring-ink-950" />
      </div>
      {!small && (
        <div className="leading-tight">
          <p className="text-[15px] font-extrabold tracking-tight text-ink-900 dark:text-white">
            Safety<span className="text-brand-600 dark:text-brand-400">OS</span>
          </p>
          <p className="text-[9px] font-medium uppercase tracking-widest text-ink-400">Complete Workplace Safety</p>
        </div>
      )}
    </div>
  );
}

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { user, company } = useAuth();
  if (!user) return null;
  const groups = navForRole(user.role);

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-ink-950/40 backdrop-blur-sm lg:hidden" onClick={onClose} />}
      <aside
        className={cx(
          "fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-ink-200/60 bg-white/80 backdrop-blur-xl transition-transform duration-200 dark:border-ink-800 dark:bg-ink-950/80 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/dashboard"><Logo /></Link>
          <button className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 lg:hidden dark:hover:bg-ink-800" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-6 pt-2">
          {groups.map((g) => (
            <div key={g.group}>
              <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-ink-400">{g.group}</p>
              <div className="space-y-0.5">
                {g.items.map((item) => {
                  const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cx(
                        "flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-all",
                        active
                          ? "bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md shadow-brand-600/30"
                          : "text-ink-600 hover:bg-ink-100/80 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-800/70 dark:hover:text-white"
                      )}
                    >
                      {ICONS[item.icon]}
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        {company && (
          <div className="border-t border-ink-200/60 p-3 dark:border-ink-800">
            <div className="glass rounded-xl px-3 py-2.5">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-700 dark:text-ink-200">
                <Globe className="h-3 w-3 text-brand-500" />
                {company.slug}.safetyos.com
              </p>
              <p className="mt-0.5 truncate text-[10px] text-ink-400">{company.name}</p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

function TenantSwitcher() {
  const { user, companies, company, switchCompany } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  if (!user || !company) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-ink-700 ring-1 ring-inset ring-ink-200 transition hover:bg-ink-50 dark:text-ink-200 dark:ring-ink-700 dark:hover:bg-ink-800"
      >
        <span className="h-2 w-2 rounded-full" style={{ background: company.accent }} />
        <span className="hidden max-w-[120px] truncate sm:block">{company.name}</span>
        <ChevronDown className="h-3.5 w-3.5 text-ink-400" />
      </button>
      {open && (
        <div className="glass-strong absolute left-0 top-full z-50 mt-2 w-64 rounded-xl p-1.5 shadow-glass-lg animate-fade-up">
          <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-ink-400">Switch Tenant</p>
          {companies.map((c) => (
            <button
              key={c.id}
              onClick={() => { switchCompany(c.id); setOpen(false); }}
              className={cx(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs transition",
                c.id === company.id ? "bg-brand-50 dark:bg-brand-500/10" : "hover:bg-ink-50 dark:hover:bg-ink-800"
              )}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-bold text-white" style={{ background: c.accent }}>
                {c.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-semibold text-ink-800 dark:text-ink-100">{c.name}</span>
                <span className="block text-[10px] text-ink-400">{c.slug}.safetyos.com · {c.plan}</span>
              </span>
              {c.id === company.id && <CheckCheck className="ml-auto h-3.5 w-3.5 text-brand-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationsBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  if (!user) return null;
  const notifs = forCompany(db.notifications, user.companyId)
    .filter((n) => n.user === "all" || n.user_id == null || ["safety_officer", "company_admin", "super_admin"].includes(user.role))
    .slice(0, 6);
  const unread = notifs.filter((n) => !n.read).length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-xl p-2 text-ink-500 transition hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[9px] font-bold text-white ring-2 ring-white dark:ring-ink-950">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="glass-strong absolute right-0 top-full z-50 mt-2 w-80 rounded-xl p-1.5 shadow-glass-lg animate-fade-up">
          <div className="flex items-center justify-between px-3 py-2">
            <p className="text-xs font-bold text-ink-800 dark:text-ink-100">Notifications</p>
            <button className="text-[11px] font-semibold text-brand-600 hover:underline" onClick={() => notifs.forEach((n) => (n.read = true))}>
              Mark all read
            </button>
          </div>
          {notifs.map((n) => (
            <button
              key={n.id}
              onClick={() => { n.read = true; router.push(n.link); setOpen(false); }}
              className={cx(
                "flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left transition hover:bg-ink-50 dark:hover:bg-ink-800",
                !n.read && "bg-brand-50/60 dark:bg-brand-500/10"
              )}
            >
              <span className={cx("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.read ? "bg-ink-200 dark:bg-ink-600" : "bg-brand-500")} />
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold text-ink-800 dark:text-ink-100">{n.title}</span>
                <span className="mt-0.5 block text-[11px] leading-snug text-ink-500 dark:text-ink-400">{n.body}</span>
                <span className="mt-1 flex items-center gap-2 text-[10px] text-ink-400">
                  {relativeTime(n.created)}
                  <Badge tone={n.type}>{n.type}</Badge>
                </span>
              </span>
            </button>
          ))}
          <Link href="/notifications" onClick={() => setOpen(false)} className="block px-3 py-2 text-center text-[11px] font-semibold text-brand-600 hover:underline">
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}

function UserMenu() {
  const { user, logout, switchRole, demoMode, switchCompany } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-xl p-1 transition hover:bg-ink-100 dark:hover:bg-ink-800">
        <Avatar name={user.name} hue={user.avatarHue} size={32} />
        <span className="hidden text-left md:block">
          <span className="block text-xs font-semibold leading-tight text-ink-800 dark:text-ink-100">{user.name}</span>
          <span className="block text-[10px] leading-tight text-brand-600 dark:text-brand-400">{ROLE_LABELS[user.role]}</span>
        </span>
      </button>
      {open && (
        <div className="glass-strong absolute right-0 top-full z-50 mt-2 w-60 rounded-xl p-1.5 shadow-glass-lg animate-fade-up">
          <div className="border-b border-ink-100 px-3 py-2.5 dark:border-ink-800">
            <p className="text-xs font-bold text-ink-800 dark:text-ink-100">{user.name}</p>
            <p className="text-[11px] text-ink-400">{user.email}</p>
            <Badge tone="blue">{ROLE_LABELS[user.role]}</Badge>
          </div>
          {demoMode && (
            <div className="border-b border-ink-100 px-3 py-2 dark:border-ink-800">
              <p className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-ink-400">
                <Zap className="h-3 w-3 text-accent-500" /> Demo — preview role
              </p>
              <div className="flex flex-wrap gap-1">
                {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => { switchRole(r); setOpen(false); }}
                    className={cx(
                      "rounded-md px-2 py-1 text-[10px] font-semibold transition",
                      user.role === r
                        ? "bg-brand-600 text-white"
                        : "bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300"
                    )}
                  >
                    {ROLE_LABELS[r]}
                  </button>
                ))}
              </div>
            </div>
          )}
          <button
            onClick={() => { setOpen(false); router.push("/settings"); }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-ink-600 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800"
          >
            <Settings className="h-4 w-4" /> Settings
          </button>
          <button
            onClick={async () => { await logout(); router.push("/login"); }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("safetyos.theme");
    const isDark = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("safetyos.theme", next ? "dark" : "light");
  };
  return (
    <button
      onClick={toggle}
      title="Toggle dark mode"
      className="rounded-xl p-2 text-ink-500 transition hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
    >
      {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  const { user, demoMode } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [q, setQ] = useState("");

  useEffect(() => {
    // Close mobile nav on route change
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    // Keep the shared store in sync with the live tenant
    if (!demoMode && user) syncTenant(user.companyId);
  }, [demoMode, user, user?.companyId]);

  if (!user) return null;

  return (
    <div className="min-h-screen">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-ink-200/60 bg-white/70 px-4 backdrop-blur-xl dark:border-ink-800 dark:bg-ink-950/70 sm:px-6">
          <button className="rounded-xl p-2 text-ink-500 hover:bg-ink-100 lg:hidden dark:hover:bg-ink-800" onClick={() => setNavOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="relative hidden max-w-md flex-1 sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { router.push("/search?q=" + encodeURIComponent(q)); setQ(""); } }}
              placeholder="Search employees, near misses, incidents, reports…"
              className="w-full rounded-xl border-0 bg-ink-100/70 py-2 pl-9 pr-3 text-sm text-ink-900 ring-1 ring-inset ring-ink-200 outline-none transition placeholder:text-ink-400 focus:bg-white focus:ring-2 focus:ring-brand-500 dark:bg-ink-800/70 dark:text-white dark:ring-ink-600/50 dark:focus:bg-ink-800"
            />
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <TenantSwitcher />
            <NotificationsBell />
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>
        <main className="mx-auto max-w-[1400px] p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
