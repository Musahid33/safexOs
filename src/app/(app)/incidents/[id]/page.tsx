"use client";

// ─────────────────────────────────────────────────────────────
// SafetyOS — Incident detail (5-Why, Fishbone, actions, evidence)
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Printer, Search, ClipboardList, Wrench, ShieldAlert, FileText, Camera, Video, Paperclip } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getEntity } from "@/lib/api";
import type { Incident } from "@/lib/types";
import { Badge, Button, Card, PageHeader, Tabs } from "@/components/ui";
import { ActionList, DetailGrid, Timeline } from "@/components/module-kit";
import { Fishbone } from "@/components/fishbone";
import { fmtDate } from "@/lib/utils";

export default function IncidentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { company } = useAuth();
  const [inc, setInc] = useState<Incident | null>(null);
  const [tab, setTab] = useState("investigation");

  useEffect(() => {
    if (company) getEntity("incidents", params.id, company.id).then(setInc);
  }, [params.id, company]);

  if (!inc) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  const inv = inc.investigation;

  return (
    <div>
      <PageHeader
        title={inc.incident_number}
        subtitle={`${inc.type} incident · ${fmtDate(inc.date)} at ${inc.time} · ${inc.location}`}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => window.print()}><Printer className="h-3.5 w-3.5" /> PDF Report</Button>
            <Button variant="secondary" size="sm" onClick={() => router.back()}><ArrowLeft className="h-3.5 w-3.5" /> Back</Button>
          </>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <Badge tone={inc.type}>{inc.type}</Badge>
        <Badge tone={inc.severity}>{inc.severity}</Badge>
        <Badge tone={inc.status}>{inc.status}</Badge>
        {inc.lost_days > 0 && <Badge tone="rose">{inc.lost_days} lost days</Badge>}
      </div>

      <Card className="mb-4">
        <p className="mb-3 text-sm font-bold text-ink-800 dark:text-ink-100">Incident overview</p>
        <DetailGrid items={[
          { label: "Incident No.", value: <span className="text-rose-600 dark:text-rose-400">{inc.incident_number}</span> },
          { label: "Date & Time", value: `${fmtDate(inc.date)} · ${inc.time}` },
          { label: "Location", value: inc.location },
          { label: "Department", value: inc.department },
          { label: "Type", value: inc.type },
          { label: "Severity", value: <Badge tone={inc.severity}>{inc.severity}</Badge> },
          { label: "Reported By", value: inc.reported_by },
          { label: "Injured Person", value: inc.injured_person ?? "—" },
          { label: "Injury Type", value: inc.injury_type ?? "—" },
          { label: "Lost Days", value: inc.lost_days },
          { label: "Investigator", value: inv.investigator },
          { label: "Status", value: <Badge tone={inc.status}>{inc.status}</Badge> },
        ]} />
        <div className="mt-4 rounded-xl bg-ink-50/80 p-4 dark:bg-ink-800/60">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-ink-400">Description</p>
          <p className="text-sm leading-relaxed text-ink-700 dark:text-ink-200">{inc.description}</p>
        </div>
      </Card>

      <div className="mb-4">
        <Tabs
          active={tab}
          onChange={setTab}
          tabs={[
            { key: "investigation", label: "Investigation & 5-Why" },
            { key: "fishbone", label: "Fishbone Diagram" },
            { key: "actions", label: "Corrective / Preventive" },
            { key: "evidence", label: "Evidence" },
            { key: "timeline", label: "Timeline" },
          ]}
        />
      </div>

      {tab === "investigation" && (
        <div className="space-y-4">
          <Card>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-ink-800 dark:text-ink-100">
              <Search className="h-4 w-4 text-brand-500" /> Investigation summary
            </p>
            <p className="text-sm leading-relaxed text-ink-600 dark:text-ink-300">{inv.summary}</p>
            <div className="mt-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-ink-400">Immediate causes</p>
              <div className="flex flex-wrap gap-2">
                {inv.immediate_causes.map((c) => <Badge key={c} tone="amber">{c}</Badge>)}
              </div>
            </div>
          </Card>
          <Card>
            <p className="mb-4 flex items-center gap-1.5 text-sm font-bold text-ink-800 dark:text-ink-100">
              <ClipboardList className="h-4 w-4 text-accent-500" /> 5-Why root cause analysis
            </p>
            <ol className="relative space-y-0 border-l-2 border-brand-200 pl-6 dark:border-brand-800">
              {inv.five_whys.map((w, i) => (
                <li key={i} className="relative pb-5 last:pb-0">
                  <span className="absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white ring-4 ring-white dark:ring-ink-950">
                    {i + 1}
                  </span>
                  <p className="text-xs font-bold text-brand-700 dark:text-brand-300">{w.why}</p>
                  <p className="mt-1 text-sm text-ink-700 dark:text-ink-200">{w.answer}</p>
                </li>
              ))}
            </ol>
            <div className="mt-5 rounded-xl bg-gradient-to-r from-rose-500 to-accent-500 p-4 text-white">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/80">Root cause</p>
              <p className="mt-1 text-sm font-semibold leading-relaxed">{inv.five_whys[inv.five_whys.length - 1]?.answer}</p>
            </div>
          </Card>
        </div>
      )}

      {tab === "fishbone" && (
        <Card>
          <p className="mb-1 text-sm font-bold text-ink-800 dark:text-ink-100">Ishikawa (Fishbone) diagram</p>
          <p className="mb-4 text-[11px] text-ink-400">Cause-and-effect analysis across 6M categories</p>
          <Fishbone categories={inv.fishbone} problem={`${inc.type} incident at ${inc.location}`} />
        </Card>
      )}

      {tab === "actions" && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ink-800 dark:text-ink-100"><Wrench className="h-4 w-4 text-accent-500" /> Corrective actions</p>
            <ActionList items={inv.corrective_actions.map((a) => ({ action: a.action, meta: `${a.owner} · due ${fmtDate(a.due)}`, done: a.status === "Done" }))} />
          </Card>
          <Card>
            <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ink-800 dark:text-ink-100"><ShieldAlert className="h-4 w-4 text-emerald-500" /> Preventive actions</p>
            <ActionList items={inv.preventive_actions.map((a) => ({ action: a.action, meta: `${a.owner} · due ${fmtDate(a.due)}`, done: a.status === "Done" }))} />
          </Card>
        </div>
      )}

      {tab === "evidence" && (
        <Card>
          <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ink-800 dark:text-ink-100"><FileText className="h-4 w-4 text-brand-500" /> Evidence register</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {inv.evidence.map((e) => (
              <div key={e.label} className="flex flex-col items-center gap-2 rounded-xl bg-ink-50/80 p-4 text-center ring-1 ring-inset ring-ink-100 transition hover:ring-brand-300 dark:bg-ink-800/60 dark:ring-ink-700">
                {e.type === "photo" ? <Camera className="h-6 w-6 text-brand-500" /> : e.type === "video" ? <Video className="h-6 w-6 text-accent-500" /> : <Paperclip className="h-6 w-6 text-emerald-500" />}
                <p className="text-xs font-semibold text-ink-700 dark:text-ink-200">{e.label}</p>
                <p className="text-[10px] uppercase tracking-widest text-ink-400">{e.type}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "timeline" && (
        <Card>
          <p className="mb-4 text-sm font-bold text-ink-800 dark:text-ink-100">Incident timeline</p>
          <Timeline events={inc.timeline} />
        </Card>
      )}
    </div>
  );
}
