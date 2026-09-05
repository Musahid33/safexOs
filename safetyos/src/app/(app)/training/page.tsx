"use client";

// ─────────────────────────────────────────────────────────────
// SafetyOS — Training (calendar, matrix, effectiveness)
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useMemo, useState } from "react";
import { GraduationCap, TrendingUp, Users, CalendarDays } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { listEntities } from "@/lib/api";
import type { TrainingSession } from "@/lib/types";
import { Badge, Card, PageHeader, Progress, StatCard, Tabs } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { Bars } from "@/components/charts";
import { cx, fmtDate } from "@/lib/utils";
import { db, forCompany } from "@/lib/store";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function TrainingPage() {
  const { company } = useAuth();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [tab, setTab] = useState("calendar");

  useEffect(() => {
    if (company) listEntities("training-sessions", company.id).then(setSessions);
  }, [company]);

  const programs = useMemo(() => forCompany(db.trainingPrograms, company?.id ?? ""), [company]);

  const completed = sessions.filter((s) => s.status === "Completed");
  const effectiveness = useMemo(() => {
    const byProgram = programs.map((p) => {
      const ss = completed.filter((s) => s.program === p.title);
      const pre = ss.length ? Math.round(ss.reduce((a, s) => a + s.pre_avg, 0) / ss.length) : 0;
      const post = ss.length ? Math.round(ss.reduce((a, s) => a + s.post_avg, 0) / ss.length) : 0;
      return { program: p.title, pre, post, sessions: ss.length };
    });
    return byProgram;
  }, [programs, completed]);

  // calendar grid for current month (Aug 2026)
  const calDays = useMemo(() => {
    const year = new Date().getFullYear();
    const month = new Date().getMonth();
    const first = new Date(year, month, 1);
    const days = new Date(year, month + 1, 0).getDate();
    const offset = first.getDay();
    return { year, month, days, offset };
  }, []);

  const sessionOn = (day: number) =>
    sessions.filter((s) => {
      const d = new Date(s.date);
      return d.getFullYear() === calDays.year && d.getMonth() === calDays.month && d.getDate() === day;
    });

  const attendanceRate = completed.length
    ? Math.round(completed.reduce((a, s) => a + (s.attendees / s.capacity) * 100, 0) / completed.length)
    : 0;
  const avgGain = completed.length
    ? Math.round(completed.reduce((a, s) => a + (s.post_avg - s.pre_avg), 0) / completed.length)
    : 0;

  return (
    <div>
      <PageHeader
        title="Training Management"
        subtitle="Calendar · nominations · attendance · pre/post tests · certificates"
      />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Sessions" value={sessions.length} icon={<GraduationCap className="h-5 w-5" />} tone="violet" />
        <StatCard label="Completed" value={completed.length} sub="this year" tone="emerald" />
        <StatCard label="Avg. Attendance" value={attendanceRate + "%"} icon={<Users className="h-5 w-5" />} tone="sky" />
        <StatCard label="Avg. Score Gain" value={"+" + avgGain + " pts"} sub="pre → post test" icon={<TrendingUp className="h-5 w-5" />} tone="accent" />
      </div>

      <div className="mb-4"><Tabs active={tab} onChange={setTab} tabs={[
        { key: "calendar", label: "Training Calendar" },
        { key: "sessions", label: "Sessions" },
        { key: "matrix", label: "Training Matrix" },
        { key: "effectiveness", label: "Effectiveness" },
      ]} /></div>

      {tab === "calendar" && (
        <div className="grid gap-3 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ink-800 dark:text-ink-100">
              <CalendarDays className="h-4 w-4 text-brand-500" />
              {new Date(calDays.year, calDays.month).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
            </p>
            <div className="grid grid-cols-7 gap-1.5">
              {WEEKDAYS.map((d) => <p key={d} className="pb-1 text-center text-[10px] font-bold uppercase text-ink-400">{d}</p>)}
              {Array.from({ length: calDays.offset }).map((_, i) => <div key={"e" + i} />)}
              {Array.from({ length: calDays.days }).map((_, i) => {
                const day = i + 1;
                const daySessions = sessionOn(day);
                const today = new Date().getDate() === day;
                return (
                  <div key={day} className={cx(
                    "min-h-[74px] rounded-xl p-1.5 ring-1 ring-inset ring-ink-100 transition dark:ring-ink-800",
                    today && "ring-2 ring-brand-500",
                    daySessions.length > 0 && "bg-brand-50/70 dark:bg-brand-500/10"
                  )}>
                    <p className={cx("text-[11px] font-bold", today ? "text-brand-600" : "text-ink-500 dark:text-ink-400")}>{day}</p>
                    {daySessions.map((s) => (
                      <p key={s.id} className="mt-0.5 truncate rounded-md bg-white/90 px-1 py-0.5 text-[9px] font-semibold text-brand-700 shadow-sm ring-1 ring-brand-100 dark:bg-ink-800 dark:text-brand-300 dark:ring-brand-400/20" title={s.program}>
                        {s.program}
                      </p>
                    ))}
                  </div>
                );
              })}
            </div>
          </Card>
          <Card>
            <p className="mb-3 text-sm font-bold text-ink-800 dark:text-ink-100">Upcoming sessions</p>
            <div className="space-y-2.5">
              {sessions.filter((s) => s.status === "Scheduled").slice(0, 5).map((s) => (
                <div key={s.id} className="rounded-xl bg-ink-50/80 p-3 dark:bg-ink-800/60">
                  <p className="text-xs font-bold text-ink-800 dark:text-ink-100">{s.program}</p>
                  <p className="mt-0.5 text-[11px] text-ink-500 dark:text-ink-400">{fmtDate(s.date)} · {s.time} · {s.venue}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Badge tone="sky">Scheduled</Badge>
                    <span className="text-[10px] text-ink-400">{s.nominees.filter((n) => n.status === "Nominated").length} nominated</span>
                  </div>
                </div>
              ))}
              {sessions.filter((s) => s.status === "Scheduled").length === 0 && (
                <p className="text-xs text-ink-400">No upcoming sessions.</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {tab === "sessions" && (
        <Card>
          <DataTable
            rows={sessions}
            onRowClick={() => {}}
            columns={[
              { key: "program", label: "Program", sortValue: (r) => r.program, render: (r) => <span className="font-semibold text-ink-800 dark:text-ink-100">{r.program}</span> },
              { key: "date", label: "Date", sortValue: (r) => r.date, render: (r) => fmtDate(r.date) },
              { key: "venue", label: "Venue" },
              { key: "trainer", label: "Trainer" },
              { key: "attendees", label: "Attended", sortValue: (r) => r.attendees, render: (r) => <span>{r.attendees} / {r.capacity}</span> },
              { key: "pre_avg", label: "Pre-Test Avg", sortValue: (r) => r.pre_avg, render: (r) => (r.status === "Completed" ? r.pre_avg + "%" : "—") },
              { key: "post_avg", label: "Post-Test Avg", sortValue: (r) => r.post_avg, render: (r) => (r.status === "Completed" ? <span className="font-semibold text-emerald-600">{r.post_avg}%</span> : "—") },
              { key: "status", label: "Status", sortValue: (r) => r.status, render: (r) => <Badge tone={r.status}>{r.status}</Badge> },
            ]}
          />
        </Card>
      )}

      {tab === "matrix" && (
        <Card>
          <p className="mb-3 text-sm font-bold text-ink-800 dark:text-ink-100">Training matrix — employees vs programs</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-ink-100 dark:border-ink-800">
                  <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-ink-400">Program</th>
                  {programs.map((p) => (
                    <th key={p.id} className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-ink-400">{p.title.split(" ")[0]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {forCompany(db.employees, company?.id ?? "").slice(0, 8).map((e) => (
                  <tr key={e.id} className="border-b border-ink-50 dark:border-ink-800/50">
                    <td className="px-3 py-2.5 text-xs font-medium text-ink-700 dark:text-ink-200">{e.name}</td>
                    {programs.map((p) => {
                      const done = e.trainings.some((t) => t.program === p.title);
                      return (
                        <td key={p.id} className="px-3 py-2.5">
                          <span className={cx(
                            "inline-flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold",
                            done ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" : "bg-ink-100 text-ink-300 dark:bg-ink-800 dark:text-ink-600"
                          )}>
                            {done ? "✓" : "–"}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-ink-400">
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-emerald-100 ring-1 ring-emerald-200 dark:bg-emerald-500/20 dark:ring-emerald-500/30" /> Trained</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-ink-100 dark:bg-ink-800" /> Not yet trained</span>
          </div>
        </Card>
      )}

      {tab === "effectiveness" && (
        <div className="grid gap-3 lg:grid-cols-2">
          <Card>
            <p className="mb-2 text-sm font-bold text-ink-800 dark:text-ink-100">Pre vs post test scores by program</p>
            <Bars
              data={effectiveness.map((e) => ({ label: e.program, value: e.post }))}
              tone="#10b981"
              height={240}
            />
          </Card>
          <div className="space-y-3">
            <Card>
              <p className="mb-3 text-sm font-bold text-ink-800 dark:text-ink-100">Effectiveness scorecard</p>
              {effectiveness.map((e) => {
                const gain = e.post - e.pre;
                return (
                  <div key={e.program} className="mb-3">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-semibold text-ink-700 dark:text-ink-200">{e.program}</span>
                      <span className="font-bold text-emerald-600">+{gain} pts</span>
                    </div>
                    <Progress value={e.post} tone={gain >= 20 ? "emerald" : gain >= 10 ? "amber" : "rose"} />
                  </div>
                );
              })}
            </Card>
            <Card className="bg-gradient-to-br from-violet-500 to-violet-600 !border-transparent text-white">
              <p className="text-xs font-bold uppercase tracking-widest text-white/80">Competency insight</p>
              <p className="mt-2 text-sm leading-relaxed text-white/90">
                Average post-test score of {Math.round(effectiveness.reduce((a, e) => a + e.post, 0) / Math.max(1, effectiveness.length))}% with a
                +{avgGain} point gain. Programs with &lt;10 pt gain should be redesigned.
              </p>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
