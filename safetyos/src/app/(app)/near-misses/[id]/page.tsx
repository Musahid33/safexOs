"use client";

// ─────────────────────────────────────────────────────────────
// SafetyOS — Near Miss detail (workflow)
// NEW → UNDER INVESTIGATION → RCA COMPLETED → CLOSED
// Officer actions: edit, assign investigator, set severity,
// accept/reject, start investigation, complete RCA (5 Why),
// review approve/reopen, generate PDF + DOCX to CSMS Documents.
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Printer, ShieldAlert, Target, Wrench, GitBranch, CheckCircle2, XCircle,
  UserPlus, ClipboardList, FileText, FileType2, FolderTree, UploadCloud, Paperclip, RotateCcw,
  CheckCheck, PlayCircle, PencilLine, AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getEntity, updateEntity, logActivity } from "@/lib/api";
import { syncTenant } from "@/lib/sync";
import type { NearMiss } from "@/lib/types";
import { Badge, Button, Card, Field, Input, Modal, PageHeader, Select, Textarea, Toast, InfoNote } from "@/components/ui";
import { DetailGrid, PhotoUpload, Timeline } from "@/components/module-kit";
import { fmtDate, fmtDateTime, photoPlaceholder } from "@/lib/utils";
import { db, forCompany, liveLookups } from "@/lib/store";
import {
  NM_CATEGORIES, NM_WORKFLOW_STEPS, INVESTIGATOR_OPTIONS, csmsFolderFor, emptyFiveWhys,
  isNmClosed, nmStatusMeta,
} from "@/lib/near-miss-workflow";
import { saveNearMissReports } from "@/lib/report-saver";

const FIVE = emptyFiveWhys();

export default function NearMissDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, company } = useAuth();
  const [nm, setNm] = useState<NearMiss | null>(null);
  const [tab, setTab] = useState("overview");
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Edit report modal
  const [editOpen, setEditOpen] = useState(false);
  const [edit, setEdit] = useState({ description: "", category: "", location: "", department: "", employee_name: "", date: "", time: "" });

  // Reject modal
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Investigation modal
  const [invOpen, setInvOpen] = useState(false);
  const [inv, setInv] = useState({
    fiveWhys: [] as { why: string; answer: string }[],
    immediateAction: "",
    correctiveAction: "",
    preventiveAction: "",
    responsiblePerson: "",
    targetDate: "",
    evidence: [] as { label: string; type: string; name: string; size: number; url: string }[],
    photos: [] as string[],
  });

  const [assigned, setAssigned] = useState("");
  const [severity, setSeverity] = useState("Medium");

  useEffect(() => {
    if (company) getEntity("near-misses", params.id, company.id).then((r) => {
      setNm(r);
      setAssigned(r?.assigned_to ?? "");
      setSeverity(r?.severity ?? "Medium");
    });
  }, [params.id, company]);

  const investigatorOptions = useMemo(() => {
    const set = new Set<string>(INVESTIGATOR_OPTIONS);
    liveLookups.profiles.forEach((name) => set.add(name));
    return Array.from(set);
  }, []);

  const departments = useMemo(() => Array.from(new Set(forCompany(db.employees, company?.id ?? "").map((e) => e.department))), [company]);
  const employees = useMemo(() => forCompany(db.employees, company?.id ?? "").map((e) => e.name), [company]);
  const locations = useMemo(() => Array.from(new Set([
    ...forCompany(db.nearMisses, company?.id ?? "").map((r) => r.location),
    ...forCompany(db.hazards, company?.id ?? "").map((r) => r.location),
  ])), [company]);

  if (!nm || !company || !user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  const canAct = ["super_admin", "company_admin", "safety_officer"].includes(user.role);
  const meta = nmStatusMeta(nm.status);
  const folder = csmsFolderFor(nm);
  const capa = nm.capa_id ? forCompany(db.capas, company.id).find((c) => c.id === nm.capa_id) : null;

  // ── helpers ────────────────────────────────────────────────
  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2600); };
  const actor = user.name;

  const patch = async (row: Record<string, any>, event: string, note: string, nextStatus?: string) => {
    setBusy(true);
    const timelineEntry = { date: new Date().toISOString().slice(0, 10), event, note: note || event, actor };
    const patchData = {
      ...row,
      ...(nextStatus ? { status: nextStatus } : {}),
      timeline: [...nm.timeline, timelineEntry],
      updated_at: new Date().toISOString(),
    };
    await updateEntity("near-misses", nm.id, patchData);
    Object.assign(nm, patchData);
    setNm({ ...nm });
    logActivity(company.id, actor, user.role, event, "Near Miss", nm.report_number);
    if (liveReady()) await syncTenant(company.id).catch(() => {});
    setBusy(false);
  };

  const liveReady = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.NEXT_PUBLIC_DEMO_MODE !== "true");

  // ── officer actions ────────────────────────────────────────
  const accept = () => patch({}, "Accepted", "Accepted for investigation by safety officer", "UNDER INVESTIGATION").then(() => flash("Accepted — status set to UNDER INVESTIGATION"));
  const reject = () => {
    if (!rejectReason.trim()) { flash("Please enter a rejection reason"); return; }
    patch({ rejection_reason: rejectReason }, "Rejected", "Rejected: " + rejectReason, "REJECTED")
      .then(() => { setRejectOpen(false); flash("Report rejected"); });
  };
  const startInvestigation = () => {
    if (!assigned) { flash("Assign an investigator first"); return; }
    patch({ assigned_to: assigned }, "Investigation started", "Investigator " + assigned + " started the investigation", "UNDER INVESTIGATION")
      .then(() => flash("Investigation started"));
  };
  const assignInvestigator = (name: string) => {
    setAssigned(name);
    patch({ assigned_to: name }, "Investigator assigned", "Investigator reassigned to " + (name || "—"))
      .then(() => flash("Investigator assigned"));
  };
  const changeSeverity = (s: string) => {
    setSeverity(s);
    patch({ severity: s }, "Severity updated", "Potential severity set to " + s)
      .then(() => flash("Severity updated"));
  };
  const reopen = () => {
    if (!confirm("Reopen this near miss? It will be sent back for investigation.")) return;
    patch({ rejection_reason: "" }, "Reopened", "Reopened by safety officer", "UNDER INVESTIGATION")
      .then(() => flash("Report reopened — back to UNDER INVESTIGATION"));
  };
  const approve = () => patch({}, "Approved & closed", "RCA reviewed and approved by safety officer", "CLOSED").then(() => flash("Approved — status set to CLOSED"));

  const openEdit = () => {
    setEdit({ description: nm.description, category: nm.category, location: nm.location, department: nm.department, employee_name: nm.employee_name, date: nm.date, time: nm.time });
    setEditOpen(true);
  };
  const saveEdit = async () => {
    if (!edit.description.trim()) { flash("Description is required"); return; }
    await patch({
      description: edit.description, category: edit.category, location: edit.location,
      department: edit.department, employee_name: edit.employee_name, date: edit.date, time: edit.time,
    }, "Report edited", "Report details updated by safety officer");
    setEditOpen(false);
    flash("Report updated");
  };

  const openInvestigation = () => {
    setInv({
      fiveWhys: nm.five_whys.length ? nm.five_whys.map((w) => ({ ...w })) : FIVE.map((w) => ({ ...w })),
      immediateAction: nm.immediate_action || "",
      correctiveAction: nm.corrective_action || "",
      preventiveAction: nm.preventive_action || "",
      responsiblePerson: nm.responsible_person || "",
      targetDate: nm.target_date || "",
      evidence: nm.evidence.map((e) => ({ ...e })),
      photos: [],
    });
    setInvOpen(true);
  };

  const handleEvFile = async (file: File) => {
    const type = file.type.startsWith("image/") ? "image" : file.type === "application/pdf" ? "pdf" : file.type.includes("word") || file.name.endsWith(".docx") ? "doc" : "other";
    let url = "";
    if (liveReady()) {
      const sb = (await import("@/lib/supabase")).getSupabase();
      if (sb) {
        const path = `${company.slug}/Near Miss/${folder.year}/${folder.month}/Evidence/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
        const { error } = await sb.storage.from("csms-documents").upload(path, file, { upsert: true, contentType: file.type || "application/octet-stream" });
        if (error) throw error;
        url = sb.storage.from("csms-documents").getPublicUrl(path).data.publicUrl;
      }
    } else {
      url = await new Promise<string>((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result as string); fr.onerror = rej; fr.readAsDataURL(file); });
    }
    setInv((s) => ({ ...s, evidence: [...s.evidence, { label: file.name, type, name: file.name, size: file.size, url }] }));
  };

  const saveInvestigation = async () => {
    const whys = inv.fiveWhys.filter((w) => (w.why || "").trim() && (w.answer || "").trim());
    if (!whys.length) { flash("Complete at least one Why question"); return; }
    if (!inv.immediateAction.trim() || !inv.correctiveAction.trim() || !inv.preventiveAction.trim()) { flash("Immediate, corrective and preventive actions are required"); return; }
    if (!inv.responsiblePerson || !inv.targetDate) { flash("Responsible person and target date are required"); return; }
    setBusy(true);
    const patchData = {
      immediate_action: inv.immediateAction,
      root_cause: whys[whys.length - 1].answer,
      five_whys: whys,
      corrective_action: inv.correctiveAction,
      preventive_action: inv.preventiveAction,
      responsible_person: inv.responsiblePerson,
      target_date: inv.targetDate,
      evidence: inv.evidence,
      photos: [...nm.photos, ...inv.photos],
      status: "RCA COMPLETED",
      timeline: [...nm.timeline, { date: new Date().toISOString().slice(0, 10), event: "RCA completed", note: "Root cause analysis completed — 5 Why", actor }],
      updated_at: new Date().toISOString(),
    };
    await updateEntity("near-misses", nm.id, patchData);
    Object.assign(nm, patchData);
    setNm({ ...nm });
    logActivity(company.id, actor, user.role, "RCA completed", "Near Miss", nm.report_number);
    if (liveReady()) await syncTenant(company.id).catch(() => {});
    setInvOpen(false);
    setBusy(false);
    flash("Investigation saved — status set to RCA COMPLETED");
  };

  const generateReports = async () => {
    setBusy(true);
    try {
      const reportDocs = await saveNearMissReports(nm, company);
      await patch({ report_documents: reportDocs }, "Report generated", `Near Miss Investigation Report (PDF & DOCX) saved to ${folder.label}`);
      flash(`Reports saved → ${folder.label} (PDF + DOCX)`);
    } catch (e: any) {
      flash("Report generation failed: " + (e?.message ?? e));
    } finally {
      setBusy(false);
    }
  };

  const stepIndex = meta.step;

  return (
    <div>
      <Toast msg={toast} />
      <PageHeader
        title={nm.report_number}
        subtitle={`Near Miss · ${nm.category} · ${fmtDate(nm.date)} at ${nm.time}`}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => window.print()}><Printer className="h-3.5 w-3.5" /> Print</Button>
            <Button variant="secondary" size="sm" onClick={() => router.back()}><ArrowLeft className="h-3.5 w-3.5" /> Back</Button>
          </>
        }
      />

      {/* Workflow stepper */}
      <Card className="mb-4 !p-4">
        <div className="flex items-center gap-1 sm:gap-2">
          {NM_WORKFLOW_STEPS.map((s, i) => {
            const done = stepIndex > i || (nm.status === "CLOSED");
            const active = stepIndex === i && nm.status !== "REJECTED";
            return (
              <React.Fragment key={s}>
                <div className="flex flex-1 items-center gap-2">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ring-2 ${done ? "bg-emerald-500 text-white ring-emerald-500/30" : active ? "bg-brand-600 text-white ring-brand-500/30" : "bg-ink-100 text-ink-400 ring-ink-200 dark:bg-ink-800 dark:ring-ink-700"}`}>
                    {done ? "✓" : i + 1}
                  </div>
                  <div className="hidden sm:block">
                    <p className={`text-[11px] font-bold ${done || active ? "text-ink-900 dark:text-white" : "text-ink-400"}`}>{s}</p>
                  </div>
                </div>
                {i < NM_WORKFLOW_STEPS.length - 1 && <div className={`h-0.5 w-6 sm:w-14 rounded ${stepIndex > i ? "bg-emerald-500" : "bg-ink-200 dark:bg-ink-700"}`} />}
              </React.Fragment>
            );
          })}
          {nm.status === "REJECTED" && <Badge tone="rose">Rejected — {nm.rejection_reason || "not a valid near miss"}</Badge>}
        </div>
        <p className="mt-2 text-[11px] text-ink-400">{meta.desc}</p>
      </Card>

      <div className="mb-4 flex flex-wrap gap-2">
        <Badge tone={nm.severity}>{nm.severity} severity</Badge>
        <Badge tone={nm.status}>{nm.status}</Badge>
        <Badge tone="blue">{nm.category}</Badge>
        {nm.assigned_to && <Badge tone="violet"><UserPlus className="h-3 w-3" /> {nm.assigned_to}</Badge>}
        {nm.target_date && <Badge tone="amber">Target {fmtDate(nm.target_date)}</Badge>}
        {nm.capa_id && <Badge tone="violet">CAPA linked</Badge>}
      </div>

      <div className="mb-4">
        <div className="flex flex-wrap gap-1 rounded-xl bg-ink-100/70 p-1 dark:bg-ink-800/70">
          {[
            { key: "overview", label: "Overview" },
            { key: "investigation", label: "Investigation & 5-Why" },
            { key: "reports", label: "Reports (CSMS)" },
            { key: "timeline", label: "Timeline" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${tab === t.key ? "bg-white text-brand-700 shadow-sm dark:bg-ink-700 dark:text-white" : "text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-200"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "overview" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Card>
              <p className="mb-3 text-sm font-bold text-ink-800 dark:text-ink-100">Report details</p>
              <DetailGrid items={[
                { label: "Report Number", value: <span className="text-brand-700 dark:text-brand-300">{nm.report_number}</span> },
                { label: "Date & Time", value: `${fmtDate(nm.date)} · ${nm.time}` },
                { label: "Location", value: nm.location },
                { label: "Department", value: nm.department },
                { label: "Employee", value: nm.employee_name },
                { label: "Investigator", value: nm.assigned_to || "Not assigned" },
                { label: "Responsible Person", value: nm.responsible_person || "—" },
                { label: "Category", value: nm.category },
                { label: "Severity", value: <Badge tone={nm.severity}>{nm.severity}</Badge> },
                { label: "Target Date", value: nm.target_date ? fmtDate(nm.target_date) : "—" },
              ]} />
              <div className="mt-4 rounded-xl bg-ink-50/80 p-4 dark:bg-ink-800/60">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-ink-400">Description</p>
                <p className="text-sm leading-relaxed text-ink-700 dark:text-ink-200">{nm.description}</p>
              </div>
              {nm.photos.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {nm.photos.map((p, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={p.startsWith("p") ? photoPlaceholder(nm.location, 40 + i * 60) : p} alt="Near miss evidence" className="h-32 w-full rounded-xl object-cover ring-1 ring-ink-200 dark:ring-ink-700" />
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <p className="mb-2 text-sm font-bold text-ink-800 dark:text-ink-100">Officer remarks</p>
              <Textarea
                rows={3}
                value={nm.officer_remarks}
                onChange={(e) => setNm({ ...nm, officer_remarks: e.target.value })}
                placeholder="Investigation findings, review remarks…"
              />
              <div className="mt-3 flex justify-end">
                <Button size="sm" variant="secondary" disabled={busy} onClick={() => patch({ officer_remarks: nm.officer_remarks }, "Remarks updated", "Officer remarks updated").then(() => flash("Remarks saved"))}>Save remarks</Button>
              </div>
            </Card>

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
          </div>

          <div className="space-y-4">
            {canAct && (
              <Card>
                <p className="mb-3 text-sm font-bold text-ink-800 dark:text-ink-100">Officer action</p>

                {nm.status === "NEW" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="secondary" size="sm" onClick={openEdit}><PencilLine className="h-3.5 w-3.5" /> Edit report</Button>
                      <Button variant="success" size="sm" onClick={accept} disabled={busy}><CheckCheck className="h-3.5 w-3.5" /> Accept</Button>
                    </div>
                    <Field label="Assign investigator">
                      <Select value={assigned} onChange={(v) => setAssigned(v)} options={investigatorOptions.map((n) => ({ value: n, label: n }))} allLabel="Select investigator…" />
                    </Field>
                    <div className="grid grid-cols-[1fr_auto] items-end gap-2">
                      <Field label="Potential severity">
                        <Select value={severity} onChange={(v) => setSeverity(v)} options={["Low", "Medium", "High", "Critical"].map((s) => ({ value: s, label: s }))} />
                      </Field>
                      <Button size="sm" variant="secondary" disabled={busy} onClick={() => changeSeverity(severity)}>Set</Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="accent" size="sm" onClick={startInvestigation} disabled={busy}><PlayCircle className="h-3.5 w-3.5" /> Start investigation</Button>
                      <Button variant="danger" size="sm" onClick={() => setRejectOpen(true)} disabled={busy}><XCircle className="h-3.5 w-3.5" /> Reject</Button>
                    </div>
                  </div>
                )}

                {nm.status === "UNDER INVESTIGATION" && (
                  <div className="space-y-3">
                    <Button className="w-full" variant="accent" onClick={openInvestigation} disabled={busy}><ClipboardList className="h-4 w-4" /> Investigation & 5-Why</Button>
                    <Button className="w-full" variant="secondary" size="sm" onClick={openEdit} disabled={busy}><PencilLine className="h-3.5 w-3.5" /> Edit report</Button>
                    <Field label="Investigator">
                      <Select value={assigned} onChange={(v) => setAssigned(v)} options={investigatorOptions.map((n) => ({ value: n, label: n }))} allLabel="Select investigator…" />
                    </Field>
                    <div className="grid grid-cols-[1fr_auto] items-end gap-2">
                      <Field label="Potential severity">
                        <Select value={severity} onChange={(v) => setSeverity(v)} options={["Low", "Medium", "High", "Critical"].map((s) => ({ value: s, label: s }))} />
                      </Field>
                      <Button size="sm" variant="secondary" disabled={busy} onClick={() => changeSeverity(severity)}>Set</Button>
                    </div>
                    <Button className="w-full" variant="secondary" size="sm" onClick={() => assignInvestigator(assigned)} disabled={busy}><UserPlus className="h-3.5 w-3.5" /> Update investigator</Button>
                  </div>
                )}

                {nm.status === "RCA COMPLETED" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="secondary" size="sm" onClick={reopen} disabled={busy}><RotateCcw className="h-3.5 w-3.5" /> Reopen</Button>
                      <Button variant="success" size="sm" onClick={approve} disabled={busy}><CheckCheck className="h-3.5 w-3.5" /> Approve</Button>
                    </div>
                    <Button className="w-full" variant="secondary" size="sm" onClick={openInvestigation} disabled={busy}><PencilLine className="h-3.5 w-3.5" /> Edit investigation</Button>
                  </div>
                )}

                {nm.status === "CLOSED" && (
                  <div className="space-y-3">
                    <Button className="w-full" variant="accent" onClick={generateReports} disabled={busy}>
                      <FileText className="h-4 w-4" /> {busy ? "Generating…" : "Generate Report (PDF & DOCX)"}
                    </Button>
                    <Button className="w-full" variant="secondary" size="sm" onClick={reopen} disabled={busy}><RotateCcw className="h-3.5 w-3.5" /> Reopen</Button>
                  </div>
                )}

                {nm.status === "REJECTED" && (
                  <div className="space-y-3">
                    <InfoNote>Rejection reason: {nm.rejection_reason || "not provided"}</InfoNote>
                    <Button className="w-full" variant="secondary" onClick={reopen} disabled={busy}><RotateCcw className="h-3.5 w-3.5" /> Reopen</Button>
                  </div>
                )}
              </Card>
            )}

            <Card>
              <p className="mb-2 text-sm font-bold text-ink-800 dark:text-ink-100">CSMS Documents</p>
              <div className="flex items-center gap-2 rounded-xl bg-ink-50/80 p-3 text-xs text-ink-600 dark:bg-ink-800/60 dark:text-ink-300">
                <FolderTree className="h-4 w-4 shrink-0 text-brand-500" />
                <p className="font-medium">{folder.label}</p>
              </div>
              {nm.report_documents.length > 0 ? (
                <div className="mt-2 space-y-1.5">
                  {nm.report_documents.map((d) => (
                    <a key={d.name} href={d.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-brand-700 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-500/10">
                      {d.format === "pdf" ? <FileType2 className="h-3.5 w-3.5 text-rose-500" /> : <FileText className="h-3.5 w-3.5 text-sky-500" />}
                      {d.name}
                    </a>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-[11px] text-ink-400">No report generated yet. Close the report and click Generate Report.</p>
              )}
            </Card>

            <Card>
              <p className="mb-2 text-sm font-bold text-ink-800 dark:text-ink-100">Record info</p>
              <p className="text-[11px] text-ink-400">Last event: {fmtDateTime(nm.timeline[nm.timeline.length - 1]?.date ?? nm.date)}</p>
              <p className="mt-1 text-[11px] text-ink-400">Soft-delete & audit logging enabled</p>
            </Card>
          </div>
        </div>
      )}

      {tab === "investigation" && (
        <div className="space-y-4">
          <Card>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-ink-800 dark:text-ink-100">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Immediate action
            </p>
            <p className="text-sm leading-relaxed text-ink-700 dark:text-ink-200">{nm.immediate_action || "Not recorded yet"}</p>
          </Card>
          <Card>
            <p className="mb-4 flex items-center gap-1.5 text-sm font-bold text-ink-800 dark:text-ink-100">
              <ClipboardList className="h-4 w-4 text-accent-500" /> Root cause analysis — 5 Why
            </p>
            {nm.five_whys.length ? (
              <ol className="relative space-y-0 border-l-2 border-brand-200 pl-6 dark:border-brand-800">
                {nm.five_whys.map((w, i) => (
                  <li key={i} className="relative pb-5 last:pb-0">
                    <span className="absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white ring-4 ring-white dark:ring-ink-950">
                      {i + 1}
                    </span>
                    <p className="text-xs font-bold text-brand-700 dark:text-brand-300">{w.why}</p>
                    <p className="mt-1 text-sm text-ink-700 dark:text-ink-200">{w.answer}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-ink-400">Root cause analysis pending — start the investigation to complete the 5 Why.</p>
            )}
          </Card>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ink-800 dark:text-ink-100"><Wrench className="h-4 w-4 text-accent-500" /> Corrective action</p>
              <p className="text-sm leading-relaxed text-ink-700 dark:text-ink-200">{nm.corrective_action || "Pending"}</p>
            </Card>
            <Card>
              <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ink-800 dark:text-ink-100"><ShieldAlert className="h-4 w-4 text-emerald-500" /> Preventive action</p>
              <p className="text-sm leading-relaxed text-ink-700 dark:text-ink-200">{nm.preventive_action || "Pending"}</p>
            </Card>
          </div>
          <Card>
            <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ink-800 dark:text-ink-100"><Target className="h-4 w-4 text-rose-500" /> Root cause</p>
            <p className="text-sm leading-relaxed text-ink-700 dark:text-ink-200">{nm.root_cause || "Pending investigation"}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-ink-50/80 p-3.5 dark:bg-ink-800/60">
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink-400">Responsible person</p>
                <p className="mt-1 text-sm text-ink-700 dark:text-ink-200">{nm.responsible_person || "—"}</p>
              </div>
              <div className="rounded-xl bg-ink-50/80 p-3.5 dark:bg-ink-800/60">
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink-400">Target date</p>
                <p className="mt-1 text-sm text-ink-700 dark:text-ink-200">{nm.target_date ? fmtDate(nm.target_date) : "—"}</p>
              </div>
            </div>
          </Card>
          <Card>
            <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ink-800 dark:text-ink-100"><Paperclip className="h-4 w-4 text-brand-500" /> Evidence ({nm.evidence.length})</p>
            {nm.evidence.length ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {nm.evidence.map((e, i) => (
                  <a key={i} href={e.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl bg-ink-50/80 px-3 py-2 text-xs text-ink-700 hover:bg-ink-100 dark:bg-ink-800/60 dark:text-ink-200">
                    {e.type === "image" ? <UploadCloud className="h-3.5 w-3.5 text-sky-500" /> : e.type === "pdf" ? <FileType2 className="h-3.5 w-3.5 text-rose-500" /> : <FileText className="h-3.5 w-3.5 text-amber-500" />}
                    <span className="truncate">{e.name}</span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-400">No evidence files uploaded.</p>
            )}
          </Card>
          {canAct && nm.status !== "CLOSED" && (
            <Button variant="accent" onClick={openInvestigation} disabled={busy}>
              {nm.status === "NEW" ? "Start investigation" : nm.status === "UNDER INVESTIGATION" ? "Complete investigation" : "Edit investigation"}
            </Button>
          )}
        </div>
      )}

      {tab === "reports" && (
        <div className="space-y-4">
          <Card>
            <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ink-800 dark:text-ink-100"><FolderTree className="h-4 w-4 text-brand-500" /> CSMS Documents</p>
            <div className="rounded-xl border border-ink-100 p-4 text-xs dark:border-ink-800">
              <p className="font-medium text-ink-500 dark:text-ink-400">CSMS Documents</p>
              <p className="ml-4 font-medium text-ink-600 dark:text-ink-300">└── Near Miss</p>
              <p className="ml-8 font-medium text-ink-600 dark:text-ink-300">└── {folder.year}</p>
              <p className="ml-12 font-medium text-ink-600 dark:text-ink-300">└── {folder.month}</p>
              {nm.report_documents.length ? (
                <div className="ml-16 mt-1 space-y-1">
                  {nm.report_documents.map((d) => (
                    <a key={d.name} href={d.url} target="_blank" rel="noreferrer" className="flex w-fit items-center gap-1.5 text-brand-700 hover:underline dark:text-brand-300">
                      {d.format === "pdf" ? <FileType2 className="h-3.5 w-3.5 text-rose-500" /> : <FileText className="h-3.5 w-3.5 text-sky-500" />}
                      {d.name}
                    </a>
                  ))}
                </div>
              ) : (
                <p className="ml-16 mt-1 text-ink-400">└── (no reports yet)</p>
              )}
            </div>
            {nm.status === "CLOSED" && canAct && (
              <div className="mt-4">
                <Button variant="accent" onClick={generateReports} disabled={busy}>
                  <FileText className="h-4 w-4" /> {busy ? "Generating…" : "Generate Report (PDF & DOCX)"}
                </Button>
                <p className="mt-2 text-[11px] text-ink-400">Both files are created automatically and saved under {folder.label}.</p>
              </div>
            )}
          </Card>

          <Card>
            <p className="mb-3 text-sm font-bold text-ink-800 dark:text-ink-100">Report contents</p>
            <ul className="space-y-1.5 text-xs text-ink-600 dark:text-ink-300">
              <li>• Report details (number, date, location, department, reporter)</li>
              <li>• Description of the near miss & photos</li>
              <li>• Investigation — immediate action, 5-Why root cause analysis</li>
              <li>• Corrective action, preventive action, responsible person & target date</li>
              <li>• Evidence files & safety officer remarks</li>
            </ul>
          </Card>
        </div>
      )}

      {tab === "timeline" && (
        <Card>
          <p className="mb-4 text-sm font-bold text-ink-800 dark:text-ink-100">Timeline</p>
          <Timeline events={nm.timeline} />
        </Card>
      )}

      {/* ── Edit report modal ── */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit report" wide>
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Date"><Input type="date" value={edit.date} onChange={(e) => setEdit({ ...edit, date: e.target.value })} /></Field>
            <Field label="Time"><Input type="time" value={edit.time} onChange={(e) => setEdit({ ...edit, time: e.target.value })} /></Field>
            <Field label="Location">
              <Select value={edit.location} onChange={(v) => setEdit({ ...edit, location: v })} options={locations.map((l) => ({ value: l, label: l }))} allLabel="Select location…" />
            </Field>
            <Field label="Department">
              <Select value={edit.department} onChange={(v) => setEdit({ ...edit, department: v })} options={departments.map((d) => ({ value: d, label: d }))} allLabel="Select department…" />
            </Field>
            <Field label="Employee">
              <Select value={edit.employee_name} onChange={(v) => setEdit({ ...edit, employee_name: v })} options={employees.map((n) => ({ value: n, label: n }))} allLabel="Anonymous / not applicable" />
            </Field>
            <Field label="Category">
              <Select value={edit.category} onChange={(v) => setEdit({ ...edit, category: v })} options={NM_CATEGORIES.map((c) => ({ value: c, label: c }))} allLabel="Select category…" />
            </Field>
          </div>
          <Field label="Description" required>
            <Textarea rows={4} value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={busy}>Save changes</Button>
          </div>
        </div>
      </Modal>

      {/* ── Reject modal ── */}
      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="Reject near miss report">
        <div className="space-y-3">
          <InfoNote>Rejecting sets the status to REJECTED and records the reason on the timeline.</InfoNote>
          <Field label="Rejection reason" required>
            <Textarea rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g. No safety exposure — duplicate report…" />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={reject} disabled={busy}>Reject report</Button>
          </div>
        </div>
      </Modal>

      {/* ── Investigation modal ── */}
      <Modal open={invOpen} onClose={() => setInvOpen(false)} title="Investigation — Root Cause Analysis" wide>
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold text-ink-700 dark:text-ink-200">5 Why root cause analysis</p>
              <Button size="sm" variant="ghost" onClick={() => setInv((s) => ({ ...s, fiveWhys: [...s.fiveWhys, { why: "Why did that happen?", answer: "" }] }))}>+ Add why</Button>
            </div>
            <div className="space-y-2">
              {inv.fiveWhys.map((w, i) => (
                <div key={i} className="grid gap-2 rounded-xl bg-ink-50/80 p-3 sm:grid-cols-[110px_1fr_34px] dark:bg-ink-800/60">
                  <Input value={w.why} onChange={(e) => setInv((s) => ({ ...s, fiveWhys: s.fiveWhys.map((x, j) => j === i ? { ...x, why: e.target.value } : x) }))} placeholder={`Why ${i + 1}?`} />
                  <Input value={w.answer} onChange={(e) => setInv((s) => ({ ...s, fiveWhys: s.fiveWhys.map((x, j) => j === i ? { ...x, answer: e.target.value } : x) }))} placeholder="Because…" />
                  <button className="text-ink-400 hover:text-rose-500" onClick={() => setInv((s) => ({ ...s, fiveWhys: s.fiveWhys.filter((_, j) => j !== i) }))}><XCircle className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>

          <Field label="Immediate action" required hint="What was done right away to make the area safe?">
            <Textarea rows={2} value={inv.immediateAction} onChange={(e) => setInv({ ...inv, immediateAction: e.target.value })} placeholder="e.g. Area barricaded, work stopped, supervisor informed…" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Corrective action" required>
              <Textarea rows={3} value={inv.correctiveAction} onChange={(e) => setInv({ ...inv, correctiveAction: e.target.value })} placeholder="Fix the root cause…" />
            </Field>
            <Field label="Preventive action" required>
              <Textarea rows={3} value={inv.preventiveAction} onChange={(e) => setInv({ ...inv, preventiveAction: e.target.value })} placeholder="Prevent recurrence…" />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Responsible person" required>
              <Select value={inv.responsiblePerson} onChange={(v) => setInv({ ...inv, responsiblePerson: v })} options={[...investigatorOptions, ...employees].filter((v, i, a) => a.indexOf(v) === i).map((n) => ({ value: n, label: n }))} allLabel="Select responsible person…" />
            </Field>
            <Field label="Target date" required>
              <Input type="date" value={inv.targetDate} onChange={(e) => setInv({ ...inv, targetDate: e.target.value })} />
            </Field>
          </div>

          <Field label="Upload photos">
            <PhotoUpload photos={inv.photos} onAdd={(p) => setInv((s) => ({ ...s, photos: [...s.photos, p] }))} />
          </Field>

          <Field label="Upload evidence" hint="PDF, images, docs — stored under the CSMS Documents evidence folder">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink-200 py-4 text-xs font-semibold text-ink-400 transition hover:border-brand-400 hover:text-brand-500 dark:border-ink-700">
              <UploadCloud className="h-5 w-5" /> Choose evidence files
              <input type="file" multiple className="hidden" onChange={(e) => { const files = Array.from(e.target.files ?? []); files.forEach((f) => handleEvFile(f).catch(() => flash("Could not upload " + f.name))); e.target.value = ""; }} />
            </label>
            {inv.evidence.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {inv.evidence.map((e, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-ink-50/80 px-3 py-2 text-xs text-ink-700 dark:bg-ink-800/60 dark:text-ink-200">
                    <Paperclip className="h-3.5 w-3.5 shrink-0 text-brand-500" />
                    <span className="truncate">{e.name} ({e.type})</span>
                    <button className="ml-auto text-ink-400 hover:text-rose-500" onClick={() => setInv((s) => ({ ...s, evidence: s.evidence.filter((_, j) => j !== i) }))}><XCircle className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </Field>

          <div className="flex justify-end gap-2 border-t border-ink-100 pt-4 dark:border-ink-800">
            <Button variant="secondary" onClick={() => setInvOpen(false)}>Cancel</Button>
            <Button variant="accent" onClick={saveInvestigation} disabled={busy}>Save & mark RCA COMPLETED</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
