"use client";

// ─────────────────────────────────────────────────────────────
// SafetyOS — Near Miss detail (CAPA, timeline, remarks, PDF)
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Printer, ShieldAlert, Target, Wrench, GitBranch, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getEntity, updateEntity, logActivity } from "@/lib/api";
import type { NearMiss } from "@/lib/types";
import { Badge, Button, Card, PageHeader, Select, Textarea, Toast } from "@/components/ui";
import { DetailGrid, PhotoUpload, Timeline } from "@/components/module-kit";
import { fmtDate, fmtDateTime, photoPlaceholder, printPage } from "@/lib/utils";
import { db, forCompany } from "@/lib/store";

export default function NearMissDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, company } = useAuth();
  const [nm, setNm] = useState<NearMiss | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [remarks, setRemarks] = useState("");
  const [newStatus, setNewStatus] = useState("");

  useEffect(() => {
    if (company) getEntity("near-misses", params.id, company.id).then((r) => {
      setNm(r);
      setRemarks(r?.officer_remarks ?? "");
      setNewStatus(r?.status ?? "");
    });
  }, [params.id, company]);

  if (!nm) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  const capa = nm.capa_id ? forCompany(db.capas, company?.id ?? "").find((c) => c.id === nm.capa_id) : null;
  const canAct = user && ["super_admin", "company_admin", "safety_officer"].includes(user.role);

  const saveOfficerUpdate = async () => {
    await updateEntity("near-misses", nm.id, {
      status: newStatus,
      officer_remarks: remarks,
      timeline: [...nm.timeline, {
        date: new Date().toISOString().slice(0, 10),
        event: newStatus === "Verified" ? "Verified" : "Status updated",
        note: remarks || "Officer updated the record",
        actor: user!.name,
      }],
    });
    Object.assign(nm, {
      status: newStatus,
      officer_remarks: remarks,
      timeline: [...nm.timeline, {
        date: new Date().toISOString().slice(0, 10),
        event: newStatus === "Verified" ? "Verified" : "Status updated",
        note: remarks || "Officer updated the record",
        actor: user!.name,
      }],
    });
    setNm({ ...nm });
    logActivity(company!.id, user!.name, user!.role, "Updated", "Near Miss", nm.report_number);
    setToast("Officer update saved");
    setTimeout(() => setToast(null), 2200);
  };

  return (
    <div>
      <Toast msg={toast} />
      <PageHeader
        title={nm.report_number}
        subtitle={`Near Miss · ${nm.category} · ${fmtDate(nm.date)} at ${nm.time}`}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={printPage}><Printer className="h-3.5 w-3.5" /> PDF Report</Button>
            <Button variant="secondary" size="sm" onClick={() => router.back()}><ArrowLeft className="h-3.5 w-3.5" /> Back</Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Badge tone={nm.severity}>{nm.severity} severity</Badge>
        <Badge tone={nm.status}>{nm.status}</Badge>
        <Badge tone="blue">{nm.category}</Badge>
        {nm.capa_id && <Badge tone="violet">CAPA linked</Badge>}
      </div>

      <div className="print-area grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <p className="mb-3 text-sm font-bold text-ink-800 dark:text-ink-100">Report details</p>
            <DetailGrid items={[
              { label: "Report Number", value: <span className="text-brand-700 dark:text-brand-300">{nm.report_number}</span> },
              { label: "Date & Time", value: `${fmtDate(nm.date)} · ${nm.time}` },
              { label: "Location", value: nm.location },
              { label: "Department", value: nm.department },
              { label: "Employee", value: nm.employee_name },
              { label: "Assigned To", value: nm.assigned_to },
              { label: "Category", value: nm.category },
              { label: "Severity", value: <Badge tone={nm.severity}>{nm.severity}</Badge> },
            ]} />
            <div className="mt-4 rounded-xl bg-ink-50/80 p-4 dark:bg-ink-800/60">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-ink-400">Description</p>
              <p className="text-sm leading-relaxed text-ink-700 dark:text-ink-200">{nm.description}</p>
            </div>
            {nm.photos.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {nm.photos.map((_, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={photoPlaceholder(nm.location, 40 + i * 60)} alt="Near miss evidence" className="h-32 w-full rounded-xl object-cover ring-1 ring-ink-200 dark:ring-ink-700" />
                ))}
              </div>
            )}
          </Card>

          <Card>
            <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ink-800 dark:text-ink-100"><Target className="h-4 w-4 text-rose-500" /> Root cause analysis</p>
            <div className="space-y-3 text-sm">
              {[
                { label: "Root Cause", value: nm.root_cause || "Pending investigation", icon: <GitBranch className="h-4 w-4 text-brand-500" /> },
                { label: "Corrective Action", value: nm.corrective_action || "Pending", icon: <Wrench className="h-4 w-4 text-accent-500" /> },
                { label: "Preventive Action", value: nm.preventive_action || "Pending", icon: <ShieldAlert className="h-4 w-4 text-emerald-500" /> },
              ].map((b) => (
                <div key={b.label} className="rounded-xl bg-ink-50/80 p-3.5 dark:bg-ink-800/60">
                  <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-ink-400">{b.icon}{b.label}</p>
                  <p className="text-xs leading-relaxed text-ink-700 dark:text-ink-200">{b.value}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <p className="mb-4 text-sm font-bold text-ink-800 dark:text-ink-100">Timeline</p>
            <Timeline events={nm.timeline} />
          </Card>
        </div>

        <div className="space-y-4">
          {canAct && (
            <Card>
              <p className="mb-3 text-sm font-bold text-ink-800 dark:text-ink-100">Officer action</p>
              <div className="space-y-3">
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-ink-600 dark:text-ink-300">Update status</p>
                  <Select value={newStatus} onChange={setNewStatus} options={["Open", "Under Review", "CAPA Pending", "Closed", "Verified"].map((s) => ({ value: s, label: s }))} />
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-ink-600 dark:text-ink-300">Officer remarks</p>
                  <Textarea rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Investigation findings, remarks…" />
                </div>
                <Button className="w-full" onClick={saveOfficerUpdate}>Save update</Button>
              </div>
            </Card>
          )}

          {capa && (
            <Card>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-ink-800 dark:text-ink-100">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Linked CAPA
              </p>
              <p className="text-xs font-semibold text-brand-700 dark:text-brand-300">{capa.capa_number}</p>
              <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">{capa.description}</p>
              <div className="mt-2 space-y-1">
                {capa.actions.map((a, i) => (
                  <p key={i} className="text-[11px] text-ink-500 dark:text-ink-400">{a.done ? "✓" : "•"} {a.action}</p>
                ))}
              </div>
              <Badge tone={capa.status}>{capa.status}</Badge>
            </Card>
          )}

          <Card>
            <p className="mb-2 text-sm font-bold text-ink-800 dark:text-ink-100">Officer remarks</p>
            <p className="text-xs leading-relaxed text-ink-500 dark:text-ink-400">
              {nm.officer_remarks || "No remarks recorded yet."}
            </p>
          </Card>

          <Card>
            <p className="mb-2 text-sm font-bold text-ink-800 dark:text-ink-100">Record info</p>
            <p className="text-[11px] text-ink-400">Last event: {fmtDateTime(nm.timeline[nm.timeline.length - 1]?.date ?? nm.date)}</p>
            <p className="mt-1 text-[11px] text-ink-400">Soft-delete & audit logging enabled</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
