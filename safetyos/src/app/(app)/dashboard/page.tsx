"use client";

// ─────────────────────────────────────────────────────────────
// SafetyOS — Dashboard (role-aware KPIs, trends, heat map)
// ─────────────────────────────────────────────────────────────
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users, ShieldAlert, Flame, FileWarning, GraduationCap, ClipboardCheck, Timer, ShieldCheck,
  ListChecks, AlertOctagon, Activity, TrendingUp, Award, Megaphone,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { db, forCompany, tenantStats } from "@/lib/store";
import { Badge, Card, PageHeader, StatCard } from "@/components/ui";
import { Donut, HeatMap, TrendChart, Bars } from "@/components/charts";
import { fmtDate, fmtNum, monthKey, monthLabel, badgeTone } from "@/lib/utils";
import { RecentTable } from "@/components/module-kit";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function DashboardPage() {
  const { user, company } = useAuth();
  const router = useRouter();
  const [range, setRange] = useState<"6m" | "12m">("6m");
  if (!user || !company) return null;

  const stats = tenantStats(company.id);
  const nm = forCompany(db.nearMisses, company.id);
  const hz = forCompany(db.hazards, company.id);
  const inc = forCompany(db.incidents, company.id);
  const audits = forCompany(db.audits, company.id);
  const capas = forCompany(db.capas, company.id);

  const months = useMemo(() => {
    const now = new Date();
    const n = range === "6m" ? 6 : 12;
    return Array.from({ length: n }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1);
      return d.toISOString().slice(0, 7);
    });
  }, [range]);

  const trend = (rows: { date: string }[]) =>
    months.map((m) => rows.filter((r) => monthKey(r.date) === m).length);

  const severityData = useMemo(() => {
    const counts: Record<string, number> = { Low: 0, Medium: 0, High: 0, Critical: 0 };
    nm.forEach((n) => (counts[n.severity] = (counts[n.severity] ?? 0) + 1));
    return [
      { label: "Low", value: counts.Low, color: "#38bdf8" },
      { label: "Medium", value: counts.Medium, color: "#f59e0b" },
      { label: "High", value: counts.High, color: "#f97316" },
      { label: "Critical", value: counts.Critical, color: "#f43f5e" },
    ];
  }, [nm]);

  const deptData = useMemo(() => {
    const counts: Record<string, number> = {};
    [...nm, ...hz, ...inc].forEach((r) => {
      const dept = (r as any).department ?? "—";
      counts[dept] = (counts[dept] ?? 0) + 1;
    });
    return Object.entries(counts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [nm, hz, inc]);

  const heatmap = useMemo(() => {
    const locs = Array.from(new Set([...nm, ...hz, ...inc].map((r) => r.location))).slice(0, 7);
    const data: Record<string, number> = {};
    [...nm, ...hz, ...inc].forEach((r) => {
      const rdate = (r as any).date ?? (r as any).reported_on;
      const day = DAYS[(new Date(rdate).getDay() + 6) % 7];
      const key = `${r.location}|${day}`;
      data[key] = (data[key] ?? 0) + 1;
    });
    return { locs, data };
  }, [nm, hz, inc]);

  const openActions = useMemo(() => {
    const rows: any[] = [
      ...nm.filter((n) => n.status !== "Closed" && n.status !== "Verified").map((n) => ({
        id: n.id, kind: "Near Miss", title: n.report_number + " — " + n.category,
        meta: n.severity + " · " + fmtDate(n.date), status: n.status, tone: badgeTone(n.severity), href: "/near-misses/" + n.id,
      })),
      ...hz.filter((h) => h.status !== "Closed" && h.status !== "Mitigated").map((h) => ({
        id: h.id, kind: "Hazard", title: h.hazard_code + " — " + h.hazard_type,
        meta: h.risk_level + " risk · " + h.location, status: h.status, tone: badgeTone(h.risk_level), href: "/hazards/" + h.id,
      })),
      ...inc.filter((i) => i.status !== "Closed").map((i) => ({
        id: i.id, kind: "Incident", title: i.incident_number + " — " + i.type,
        meta: i.severity + " · " + fmtDate(i.date), status: i.status, tone: badgeTone(i.severity), href: "/incidents/" + i.id,
      })),
      ...capas.filter((c) => c.status !== "Closed").map((c) => ({
        id: c.id, kind: "CAPA", title: c.capa_number + " — " + c.source_type,
        meta: "Due " + fmtDate(c.due_date), status: c.status, tone: badgeTone(c.status), href: "/incidents/" + c.source_id,
      })),
    ];
    return rows.slice(0, 8);
  }, [nm, hz, inc, capas]);

  const compTrainings = forCompany(db.trainingSessions, company.id).filter((s) => s.status === "Completed");
  const avgImprovement = compTrainings.length
    ? Math.round(compTrainings.reduce((s, t) => s + (t.post_avg - t.pre_avg), 0) / compTrainings.length)
    : 0;

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        subtitle={`${company.name} · ${company.slug}.safetyos.com · Safety overview for ${fmtDate(new Date().toISOString())}`}
        actions={
          <div className="flex gap-1 rounded-xl bg-ink-100/70 p-1 dark:bg-ink-800/70">
            {(["6m", "12m"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${range === r ? "bg-white text-brand-700 shadow-sm dark:bg-ink-700 dark:text-white" : "text-ink-500"}`}
              >
                {r === "6m" ? "6 months" : "12 months"}
              </button>
            ))}
          </div>
        }
      />

      {/* Module KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Employees" value={fmtNum(stats.employees)} icon={<Users className="h-5 w-5" />} sub="active workforce" tone="brand" />
        <StatCard label="Near Misses" value={stats.nearMisses} icon={<ShieldAlert className="h-5 w-5" />} sub="reported this year" tone="sky" />
        <StatCard label="Hazards" value={stats.hazards} icon={<Flame className="h-5 w-5" />} sub={stats.criticalHazards + " critical open"} tone="accent" />
        <StatCard label="Incidents" value={stats.incidents} icon={<FileWarning className="h-5 w-5" />} sub="under investigation" tone="rose" />
        <StatCard label="Trainings" value={stats.trainings} icon={<GraduationCap className="h-5 w-5" />} sub={`+${avgImprovement} pts avg. post-test`} tone="violet" />
        <StatCard label="Audits" value={stats.audits} icon={<ClipboardCheck className="h-5 w-5" />} sub="completed this year" tone="emerald" />
      </div>

      {/* Safety KPIs */}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Card className="col-span-2 flex items-center justify-between bg-gradient-to-br from-emerald-500 to-emerald-600 !border-transparent text-white">
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-white/80"><Timer className="h-3.5 w-3.5" /> Safe Man Hours</p>
            <p className="mt-1 text-2xl font-extrabold">{fmtNum(stats.safeManHours)}</p>
            <p className="text-[11px] text-white/75">this month (8h × 24 days)</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15"><Timer className="h-6 w-6" /></div>
        </Card>
        <Card className="col-span-2 flex items-center justify-between bg-gradient-to-br from-brand-500 to-brand-700 !border-transparent text-white">
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-white/80"><ShieldCheck className="h-3.5 w-3.5" /> LTI Free Days</p>
            <p className="mt-1 text-2xl font-extrabold">{stats.ltiFreeDays}</p>
            <p className="text-[11px] text-white/75">since last lost-time injury</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15"><Award className="h-6 w-6" /></div>
        </Card>
        <Card>
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-ink-400"><ListChecks className="h-3.5 w-3.5" /> Open CAPA</p>
          <p className="mt-1 text-2xl font-extrabold text-ink-900 dark:text-white">{stats.openCapa}</p>
          <p className="text-[11px] text-ink-400">{stats.pendingActions} pending actions</p>
        </Card>
      </div>

      {/* Charts row */}
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-ink-800 dark:text-ink-100">Safety trends</p>
              <p className="text-[11px] text-ink-400">Near misses vs incidents · {range === "6m" ? "last 6 months" : "last 12 months"}</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-semibold text-ink-500">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand-500" /> Near Miss</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent-500" /> Incident</span>
            </div>
          </div>
          <TrendChart
            labels={months.map(monthLabel)}
            series={[
              { name: "Near Miss", color: "#3b82f6", data: trend(nm) },
              { name: "Incident", color: "#f97316", data: trend(inc) },
            ]}
          />
        </Card>
        <Card>
          <p className="mb-2 text-sm font-bold text-ink-800 dark:text-ink-100">Near miss severity</p>
          <p className="mb-4 text-[11px] text-ink-400">Distribution by severity class</p>
          <Donut data={severityData} />
        </Card>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <p className="mb-2 text-sm font-bold text-ink-800 dark:text-ink-100">Safety activity heat map</p>
          <p className="mb-4 text-[11px] text-ink-400">Near misses + hazards + incidents by location and weekday</p>
          <HeatMap rows={heatmap.locs} cols={DAYS} data={heatmap.data} />
        </Card>
        <Card>
          <p className="mb-2 text-sm font-bold text-ink-800 dark:text-ink-100">Department hotspots</p>
          <p className="mb-4 text-[11px] text-ink-400">Total safety events by department</p>
          <Bars data={deptData} tone="#f97316" height={220} />
        </Card>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <RecentTable
            title="Pending actions & open items"
            onViewAll={() => router.push("/search?q=&status=open")}
            rows={openActions}
            cols={[
              { key: "kind", label: "Type", render: (r) => <Badge tone="blue">{r.kind}</Badge> },
              { key: "title", label: "Item", render: (r) => <span className="block truncate text-xs font-semibold text-ink-800 dark:text-ink-100">{r.title}</span> },
              { key: "meta", label: "Detail", render: (r) => <span className="block truncate text-[11px] text-ink-400">{r.meta}</span> },
              { key: "status", label: "Status", render: (r) => <Badge tone={r.status}>{r.status}</Badge> },
            ]}
          />
        </Card>
        <Card>
          <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ink-800 dark:text-ink-100">
            <Megaphone className="h-4 w-4 text-accent-500" /> Safety announcements
          </p>
          <div className="space-y-2.5">
            {[
              { t: "Monthly mock drill", d: "Fire & evacuation drill on 25 Aug, all shifts.", tone: "accent" },
              { t: "Safety week 2026", d: "4–10 Sept — slogan, quiz & spot reward contests.", tone: "blue" },
              { t: "New SOP released", d: "LOTO Procedure v3.1 now in Document Library.", tone: "emerald" },
            ].map((a) => (
              <div key={a.t} className="rounded-xl bg-ink-50/80 p-3 dark:bg-ink-800/60">
                <p className="text-xs font-bold text-ink-800 dark:text-ink-100">{a.t}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-ink-500 dark:text-ink-400">{a.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 p-3.5 text-white">
            <p className="flex items-center gap-1.5 text-xs font-bold"><TrendingUp className="h-3.5 w-3.5" /> Reporting rate</p>
            <p className="mt-1 text-lg font-extrabold">{stats.employees ? ((stats.nearMisses / stats.employees) * 10).toFixed(1) : 0} / 100</p>
            <p className="text-[10px] text-white/70">near miss reports per 100 employees</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
