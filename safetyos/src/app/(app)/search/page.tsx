"use client";

// ─────────────────────────────────────────────────────────────
// SafetyOS — Global search (all modules, grouped results)
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Users, ShieldAlert, Flame, FileWarning, FolderOpen, HeartHandshake } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { db, forCompany } from "@/lib/store";
import { Badge, Card, PageHeader } from "@/components/ui";
import { fmtDate } from "@/lib/utils";

function SearchResults() {
  const params = useSearchParams();
  const router = useRouter();
  const { company } = useAuth();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [dept, setDept] = useState("");
  const [status, setStatus] = useState("");

  const companyId = company?.id ?? "";
  const query = q.trim().toLowerCase();

  const groups = useMemo(() => {
    if (!companyId) return [];
    const match = (hay: string) => !query || hay.toLowerCase().includes(query);
    const okDept = (d: string) => !dept || d === dept;
    const okStatus = (s: string) => !status || s === s && (s.toLowerCase() === status.toLowerCase());

    const employees = forCompany(db.employees, companyId).filter(
      (e) => okDept(e.department) && match(e.name + " " + e.employee_code + " " + e.designation + " " + e.department)
    ).map((e) => ({ id: e.id, title: e.name, sub: e.employee_code + " · " + e.designation, meta: e.department, tone: "blue", href: "/employees/" + e.id, icon: "users" }));

    const nearMisses = forCompany(db.nearMisses, companyId).filter(
      (r) => okDept(r.department) && okStatus(r.status) && match(r.report_number + " " + r.description + " " + r.category + " " + r.location)
    ).map((r) => ({ id: r.id, title: r.report_number, sub: r.category + " · " + r.location, meta: r.severity, tone: r.severity, href: "/near-misses/" + r.id, icon: "alert" }));

    const hazards = forCompany(db.hazards, companyId).filter(
      (r) => okStatus(r.status) && match(r.hazard_code + " " + r.description + " " + r.hazard_type + " " + r.location)
    ).map((r) => ({ id: r.id, title: r.hazard_code, sub: r.hazard_type + " · " + r.location, meta: r.risk_level, tone: r.risk_level, href: "/hazards/" + r.id, icon: "flame" }));

    const incidents = forCompany(db.incidents, companyId).filter(
      (r) => okDept(r.department) && okStatus(r.status) && match(r.incident_number + " " + r.description + " " + r.type + " " + r.location)
    ).map((r) => ({ id: r.id, title: r.incident_number, sub: r.type + " · " + r.location, meta: r.status, tone: r.status, href: "/incidents/" + r.id, icon: "filewarning" }));

    const grievances = forCompany(db.grievances, companyId).filter(
      (r) => okStatus(r.status) && match(r.grievance_number + " " + r.subject + " " + r.category)
    ).map((r) => ({ id: r.id, title: r.grievance_number, sub: r.subject, meta: r.status, tone: r.status, href: "/grievances/" + r.id, icon: "heart" }));

    const documents = forCompany(db.documents, companyId).filter(
      (d) => match(d.title + " " + d.description + " " + d.category)
    ).map((d) => ({ id: d.id, title: d.title, sub: d.category + " · " + d.version, meta: d.size, tone: "emerald", href: "/documents", icon: "folder" }));

    return [
      { name: "Employees", icon: <Users className="h-4 w-4" />, items: employees.slice(0, 6) },
      { name: "Near Misses", icon: <ShieldAlert className="h-4 w-4" />, items: nearMisses.slice(0, 6) },
      { name: "Hazards", icon: <Flame className="h-4 w-4" />, items: hazards.slice(0, 6) },
      { name: "Incidents", icon: <FileWarning className="h-4 w-4" />, items: incidents.slice(0, 6) },
      { name: "Grievances", icon: <HeartHandshake className="h-4 w-4" />, items: grievances.slice(0, 6) },
      { name: "Documents", icon: <FolderOpen className="h-4 w-4" />, items: documents.slice(0, 6) },
    ].filter((g) => g.items.length > 0);
  }, [companyId, q, dept, status]);

  const depts = Array.from(new Set(forCompany(db.employees, companyId).map((e) => e.department)));
  const total = groups.reduce((s, g) => s + g.items.length, 0);

  return (
    <div>
      <PageHeader
        title="Global Search"
        subtitle={`Search across all modules in ${company?.name ?? ""}`}
      />
      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by employee, department, contractor, date, location, report number, status…"
              className="w-full rounded-xl border-0 bg-ink-100/70 py-2.5 pl-9 pr-3 text-sm ring-1 ring-inset ring-ink-200 outline-none placeholder:text-ink-400 focus:bg-white focus:ring-2 focus:ring-brand-500 dark:bg-ink-800/70 dark:text-white dark:ring-ink-600/50 dark:focus:bg-ink-800"
            />
          </div>
          <select value={dept} onChange={(e) => setDept(e.target.value)} className="rounded-xl border-0 bg-ink-100/70 px-3 py-2.5 text-sm ring-1 ring-inset ring-ink-200 outline-none dark:bg-ink-800/70 dark:text-white dark:ring-ink-600/50">
            <option value="">All departments</option>
            {depts.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border-0 bg-ink-100/70 px-3 py-2.5 text-sm ring-1 ring-inset ring-ink-200 outline-none dark:bg-ink-800/70 dark:text-white dark:ring-ink-600/50">
            <option value="">All statuses</option>
            {["Open", "Closed", "Under Review", "In Progress", "Verified"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <p className="mt-3 text-xs text-ink-400">{total} result{total === 1 ? "" : "s"} across {groups.length} module{groups.length === 1 ? "" : "s"}</p>
      </Card>

      <div className="space-y-4">
        {groups.map((g) => (
          <Card key={g.name}>
            <p className="mb-3 flex items-center gap-2 text-sm font-bold text-ink-800 dark:text-ink-100">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">{g.icon}</span>
              {g.name}
              <Badge tone="ink">{g.items.length}</Badge>
            </p>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {g.items.map((it) => (
                <button
                  key={it.id}
                  onClick={() => router.push(it.href)}
                  className="flex items-center gap-3 rounded-xl bg-ink-50/70 p-3 text-left transition hover:bg-brand-50/80 hover:ring-1 hover:ring-brand-200 dark:bg-ink-800/50 dark:hover:bg-brand-500/10 dark:hover:ring-brand-500/30"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold text-ink-800 dark:text-ink-100">{it.title}</span>
                    <span className="block truncate text-[11px] text-ink-400">{it.sub}</span>
                  </span>
                  <Badge tone={it.tone}>{it.meta}</Badge>
                </button>
              ))}
            </div>
          </Card>
        ))}
        {groups.length === 0 && (
          <Card className="py-16 text-center">
            <Search className="mx-auto h-8 w-8 text-ink-300" />
            <p className="mt-3 text-sm font-semibold text-ink-500 dark:text-ink-300">No results found</p>
            <p className="mt-1 text-xs text-ink-400">Try a different keyword, or clear the filters.</p>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" /></div>}>
      <SearchResults />
    </Suspense>
  );
}
