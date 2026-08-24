"use client";

// ─────────────────────────────────────────────────────────────
// SafetyOS — Hazard detail (risk controls + history)
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Flame, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getEntity, updateEntity, logActivity } from "@/lib/api";
import type { Hazard } from "@/lib/types";
import { Badge, Button, Card, PageHeader, Select, Textarea, Toast } from "@/components/ui";
import { DetailGrid, Timeline } from "@/components/module-kit";
import { fmtDate, photoPlaceholder } from "@/lib/utils";

export default function HazardDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, company } = useAuth();
  const [hz, setHz] = useState<Hazard | null>(null);
  const [status, setStatus] = useState("");
  const [action, setAction] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (company) getEntity("hazards", params.id, company.id).then((r) => {
      setHz(r);
      setStatus(r?.status ?? "");
      setAction(r?.corrective_action ?? "");
    });
  }, [params.id, company]);

  if (!hz) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  const canAct = user && ["super_admin", "company_admin", "safety_officer"].includes(user.role);

  const save = async () => {
    const entry = { date: new Date().toISOString().slice(0, 10), from: hz.status, to: status, note: action || "Status updated", actor: user!.name };
    await updateEntity("hazards", hz.id, { status, corrective_action: action, history: [...hz.history, entry] });
    Object.assign(hz, { status, corrective_action: action, history: [...hz.history, entry] });
    setHz({ ...hz });
    logActivity(company!.id, user!.name, user!.role, "Updated", "Hazard", hz.hazard_code);
    setToast("Hazard updated");
    setTimeout(() => setToast(null), 2200);
  };

  return (
    <div>
      <Toast msg={toast} />
      <PageHeader
        title={hz.hazard_code}
        subtitle={`Hazard · ${hz.hazard_type} · reported ${fmtDate(hz.reported_on)} by ${hz.reported_by}`}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => window.print()}>PDF Report</Button>
            <Button variant="secondary" size="sm" onClick={() => router.back()}><ArrowLeft className="h-3.5 w-3.5" /> Back</Button>
          </>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <Badge tone={hz.risk_level}>{hz.risk_level} risk</Badge>
        <Badge tone={hz.status}>{hz.status}</Badge>
        <Badge tone="blue">{hz.hazard_type}</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <p className="mb-3 text-sm font-bold text-ink-800 dark:text-ink-100">Hazard details</p>
            <DetailGrid items={[
              { label: "Hazard ID", value: <span className="text-brand-700 dark:text-brand-300">{hz.hazard_code}</span> },
              { label: "Location", value: hz.location },
              { label: "Type", value: hz.hazard_type },
              { label: "Risk Level", value: <Badge tone={hz.risk_level}>{hz.risk_level}</Badge> },
              { label: "Assigned Officer", value: hz.assigned_officer },
              { label: "Reported By", value: hz.reported_by },
              { label: "Reported On", value: fmtDate(hz.reported_on) },
              { label: "Status", value: <Badge tone={hz.status}>{hz.status}</Badge> },
            ]} />
            <div className="mt-4 rounded-xl bg-ink-50/80 p-4 dark:bg-ink-800/60">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-ink-400">Description</p>
              <p className="text-sm leading-relaxed text-ink-700 dark:text-ink-200">{hz.description}</p>
            </div>
            {hz.photos.length > 0 && (
              <div className="mt-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoPlaceholder(hz.location, 25)} alt="Hazard evidence" className="h-40 w-full rounded-xl object-cover ring-1 ring-ink-200 dark:ring-ink-700" />
              </div>
            )}
          </Card>
          <Card>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-ink-800 dark:text-ink-100"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Corrective action</p>
            <p className="text-sm leading-relaxed text-ink-600 dark:text-ink-300">{hz.corrective_action || "No corrective action recorded yet."}</p>
          </Card>
          <Card>
            <p className="mb-4 text-sm font-bold text-ink-800 dark:text-ink-100">Status history</p>
            <Timeline events={hz.history.map((h) => ({ date: h.date, event: `${h.from} → ${h.to}`, note: h.note, actor: h.actor }))} />
          </Card>
        </div>

        {canAct && (
          <Card className="h-fit">
            <p className="mb-3 text-sm font-bold text-ink-800 dark:text-ink-100">Officer action</p>
            <div className="space-y-3">
              <div>
                <p className="mb-1.5 text-xs font-semibold text-ink-600 dark:text-ink-300">Status</p>
                <Select value={status} onChange={setStatus} options={["Open", "In Progress", "Mitigated", "Closed"].map((s) => ({ value: s, label: s }))} />
              </div>
              <div>
                <p className="mb-1.5 text-xs font-semibold text-ink-600 dark:text-ink-300">Corrective action</p>
                <Textarea rows={3} value={action} onChange={(e) => setAction(e.target.value)} />
              </div>
              <Button className="w-full" onClick={save}>Save update</Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
