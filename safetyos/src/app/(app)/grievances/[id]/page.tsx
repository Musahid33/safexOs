"use client";

// ─────────────────────────────────────────────────────────────
// SafetyOS — Grievance detail (officer action + ack loop)
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Printer, CheckCircle2, MessageSquareHeart } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getEntity, updateEntity, logActivity } from "@/lib/api";
import type { Grievance } from "@/lib/types";
import { Badge, Button, Card, PageHeader, Select, Textarea, Toast } from "@/components/ui";
import { DetailGrid } from "@/components/module-kit";
import { fmtDate } from "@/lib/utils";

export default function GrievanceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, company } = useAuth();
  const [grv, setGrv] = useState<Grievance | null>(null);
  const [status, setStatus] = useState("");
  const [action, setAction] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (company) getEntity("grievances", params.id, company.id).then((r) => {
      setGrv(r);
      setStatus(r?.status ?? "");
      setAction(r?.action_taken ?? "");
    });
  }, [params.id, company]);

  if (!grv) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  const canAct = user && ["super_admin", "company_admin", "safety_officer"].includes(user.role);

  const save = async () => {
    await updateEntity("grievances", grv.id, {
      status, action_taken: action,
      resolved_on: status === "Resolved" || status === "Closed" ? new Date().toISOString().slice(0, 10) : grv.resolved_on,
    });
    Object.assign(grv, {
      status, action_taken: action,
      resolved_on: status === "Resolved" || status === "Closed" ? new Date().toISOString().slice(0, 10) : grv.resolved_on,
    });
    setGrv({ ...grv });
    logActivity(company!.id, user!.name, user!.role, "Updated", "Grievance", grv.grievance_number);
    setToast("Grievance updated — employee notified");
    setTimeout(() => setToast(null), 2200);
  };

  const acknowledge = async () => {
    await updateEntity("grievances", grv.id, { employee_ack: true });
    Object.assign(grv, { employee_ack: true });
    setGrv({ ...grv });
    setToast("Acknowledgement recorded ✓");
    setTimeout(() => setToast(null), 2200);
  };

  return (
    <div>
      <Toast msg={toast} />
      <PageHeader
        title={grv.grievance_number}
        subtitle={`Grievance · filed ${fmtDate(grv.filed_on)}`}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => window.print()}><Printer className="h-3.5 w-3.5" /> PDF</Button>
            <Button variant="secondary" size="sm" onClick={() => router.back()}><ArrowLeft className="h-3.5 w-3.5" /> Back</Button>
          </>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <Badge tone={grv.status}>{grv.status}</Badge>
        <Badge tone="blue">{grv.category}</Badge>
        <Badge tone={grv.employee_ack ? "emerald" : "amber"}>{grv.employee_ack ? "Employee acknowledged" : "Awaiting acknowledgement"}</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <p className="mb-3 text-sm font-bold text-ink-800 dark:text-ink-100">Grievance details</p>
            <DetailGrid items={[
              { label: "Grievance No.", value: <span className="text-brand-700 dark:text-brand-300">{grv.grievance_number}</span> },
              { label: "Employee", value: grv.anonymous ? "Anonymous" : grv.employee_name },
              { label: "Category", value: grv.category },
              { label: "Filed On", value: fmtDate(grv.filed_on) },
              { label: "Officer", value: grv.officer_name },
              { label: "Resolved On", value: grv.resolved_on ? fmtDate(grv.resolved_on) : "—" },
            ]} />
            <div className="mt-4 rounded-xl bg-ink-50/80 p-4 dark:bg-ink-800/60">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-ink-400">{grv.subject}</p>
              <p className="text-sm leading-relaxed text-ink-700 dark:text-ink-200">{grv.description}</p>
            </div>
          </Card>
          <Card>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-ink-800 dark:text-ink-100"><MessageSquareHeart className="h-4 w-4 text-accent-500" /> Officer action</p>
            <p className="text-sm leading-relaxed text-ink-600 dark:text-ink-300">{grv.action_taken || "No action recorded yet."}</p>
          </Card>
        </div>

        <div className="space-y-4">
          {canAct && (
            <Card>
              <p className="mb-3 text-sm font-bold text-ink-800 dark:text-ink-100">Officer update</p>
              <div className="space-y-3">
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-ink-600 dark:text-ink-300">Status</p>
                  <Select value={status} onChange={setStatus} options={["Open", "Acknowledged", "In Action", "Resolved", "Closed"].map((s) => ({ value: s, label: s }))} />
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-ink-600 dark:text-ink-300">Action taken</p>
                  <Textarea rows={4} value={action} onChange={(e) => setAction(e.target.value)} />
                </div>
                <Button className="w-full" onClick={save}>Save & notify employee</Button>
              </div>
            </Card>
          )}
          {!canAct && !grv.employee_ack && (
            <Card>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-ink-800 dark:text-ink-100"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Employee acknowledgement</p>
              <p className="mb-3 text-xs text-ink-500 dark:text-ink-400">Please confirm that the officer&apos;s action addresses your grievance.</p>
              <Button className="w-full" variant="success" onClick={acknowledge}>Acknowledge resolution</Button>
            </Card>
          )}
          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 !border-transparent text-white">
            <p className="text-xs font-bold uppercase tracking-widest text-white/80">SLA</p>
            <p className="mt-1 text-sm font-semibold">48-hour officer response</p>
            <p className="mt-0.5 text-[11px] text-white/75">30-day target resolution</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
