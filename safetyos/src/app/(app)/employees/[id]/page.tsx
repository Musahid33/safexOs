"use client";

// ─────────────────────────────────────────────────────────────
// SafetyOS — Employee detail (history tabs + QR profile)
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, QrCode, Printer, GraduationCap, HeartPulse, HardHat, ShieldAlert, Award, FileText, BadgeCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getEntity } from "@/lib/api";
import type { Employee } from "@/lib/types";
import { Avatar, Badge, Button, Card, PageHeader, Tabs } from "@/components/ui";
import { DetailGrid } from "@/components/module-kit";
import { DataTable } from "@/components/data-table";
import { fmtDate } from "@/lib/utils";

export default function EmployeeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { company } = useAuth();
  const [emp, setEmp] = useState<Employee | null>(null);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    if (company) getEntity("employees", params.id, company.id).then(setEmp);
  }, [params.id, company]);

  if (!emp) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  const profileUrl = `https://${company?.slug}.safetyos.com/e/${emp.qr_token}`;
  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "training", label: `Training (${emp.trainings.length})` },
    { key: "medical", label: `Medical (${emp.medical.length})` },
    { key: "ppe", label: `PPE (${emp.ppe.length})` },
    { key: "violations", label: `Violations (${emp.violations.length})` },
    { key: "rewards", label: `Rewards (${emp.rewards.length})` },
    { key: "certs", label: `Certificates (${emp.certificates.length})` },
    { key: "documents", label: `Documents (${emp.documents.length})` },
    { key: "qr", label: "QR Profile" },
  ];

  return (
    <div>
      <PageHeader
        title={emp.name}
        subtitle={`${emp.employee_code} · ${emp.designation}, ${emp.department}`}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => window.print()}><Printer className="h-3.5 w-3.5" /> Print profile</Button>
            <Button variant="secondary" size="sm" onClick={() => router.back()}><ArrowLeft className="h-3.5 w-3.5" /> Back</Button>
          </>
        }
      />

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={emp.name} size={64} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-ink-900 dark:text-white">{emp.name}</h2>
              <Badge tone={emp.status}>{emp.status}</Badge>
              {emp.contractor && <Badge tone="violet">Contractor: {emp.contractor}</Badge>}
            </div>
            <p className="mt-0.5 text-sm text-ink-400">{emp.designation} · {emp.department} · Joined {fmtDate(emp.joining_date)}</p>
            <p className="mt-1 text-xs text-ink-400">{emp.email} · {emp.phone}</p>
          </div>
        </div>
      </Card>

      <div className="mb-4"><Tabs tabs={tabs} active={tab} onChange={setTab} /></div>

      {tab === "overview" && (
        <div className="space-y-4">
          <Card>
            <p className="mb-3 text-sm font-bold text-ink-800 dark:text-ink-100">Personal details</p>
            <DetailGrid items={[
              { label: "Employee ID", value: <span className="text-brand-700 dark:text-brand-300">{emp.employee_code}</span> },
              { label: "Blood Group", value: emp.blood_group },
              { label: "Date of Birth", value: fmtDate(emp.dob) },
              { label: "Joining Date", value: fmtDate(emp.joining_date) },
              { label: "Department", value: emp.department },
              { label: "Designation", value: emp.designation },
              { label: "Contractor", value: emp.contractor ?? "—" },
              { label: "Phone", value: emp.phone },
            ]} />
          </Card>
          <Card>
            <p className="mb-3 text-sm font-bold text-ink-800 dark:text-ink-100">Emergency contact</p>
            <DetailGrid items={[
              { label: "Contact Person", value: emp.emergency_name },
              { label: "Phone", value: emp.emergency_phone },
            ]} />
          </Card>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { icon: <GraduationCap className="h-5 w-5" />, label: "Trainings", value: emp.trainings.length, tone: "bg-violet-500" },
              { icon: <HeartPulse className="h-5 w-5" />, label: "Medical Records", value: emp.medical.length, tone: "bg-rose-500" },
              { icon: <HardHat className="h-5 w-5" />, label: "PPE Issued", value: emp.ppe.length, tone: "bg-accent-500" },
              { icon: <ShieldAlert className="h-5 w-5" />, label: "Violations", value: emp.violations.length, tone: "bg-brand-600" },
            ].map((s) => (
              <Card key={s.label} className="flex items-center gap-3 !p-4">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-white ${s.tone}`}>{s.icon}</span>
                <span>
                  <span className="block text-lg font-bold text-ink-900 dark:text-white">{s.value}</span>
                  <span className="block text-[11px] text-ink-400">{s.label}</span>
                </span>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === "training" && (
        <Card>
          <p className="mb-3 text-sm font-bold text-ink-800 dark:text-ink-100">Training history & competency</p>
          <DataTable
            rows={emp.trainings.map((t, i) => ({ id: String(i), ...t }))}
            columns={[
              { key: "program", label: "Program" },
              { key: "date", label: "Date", sortValue: (r) => r.date, render: (r) => fmtDate(r.date) },
              { key: "score", label: "Score", sortValue: (r) => r.score, render: (r) => <Badge tone={r.score >= 80 ? "emerald" : r.score >= 60 ? "amber" : "rose"}>{r.score}%</Badge> },
              { key: "certificate", label: "Certificate" },
              { key: "valid_until", label: "Valid Until", render: (r) => fmtDate(r.valid_until) },
            ]}
          />
        </Card>
      )}

      {tab === "medical" && (
        <Card>
          <p className="mb-3 text-sm font-bold text-ink-800 dark:text-ink-100">Medical history</p>
          <DataTable
            rows={emp.medical.map((m, i) => ({ id: String(i), ...m }))}
            columns={[
              { key: "date", label: "Date", render: (r) => fmtDate(r.date) },
              { key: "type", label: "Examination" },
              { key: "result", label: "Result", render: (r) => <Badge tone={r.result.startsWith("Fit") ? "emerald" : "amber"}>{r.result}</Badge> },
              { key: "next_due", label: "Next Due", render: (r) => fmtDate(r.next_due) },
            ]}
          />
        </Card>
      )}

      {tab === "ppe" && (
        <Card>
          <p className="mb-3 text-sm font-bold text-ink-800 dark:text-ink-100">PPE history</p>
          <DataTable
            rows={emp.ppe.map((p, i) => ({ id: String(i), ...p }))}
            columns={[
              { key: "item", label: "Item" },
              { key: "issue_date", label: "Issued", render: (r) => fmtDate(r.issue_date) },
              { key: "expiry_date", label: "Expiry", render: (r) => fmtDate(r.expiry_date) },
              { key: "status", label: "Status", render: (r) => <Badge tone={r.status}>{r.status}</Badge> },
            ]}
          />
        </Card>
      )}

      {tab === "violations" && (
        <Card>
          <p className="mb-3 text-sm font-bold text-ink-800 dark:text-ink-100">Violation history</p>
          <DataTable
            rows={emp.violations.map((v, i) => ({ id: String(i), ...v }))}
            emptyTitle="No violations — clean record"
            columns={[
              { key: "date", label: "Date", render: (r) => fmtDate(r.date) },
              { key: "type", label: "Violation" },
              { key: "severity", label: "Severity", render: (r) => <Badge tone={r.severity}>{r.severity}</Badge> },
              { key: "action", label: "Action Taken" },
              { key: "status", label: "Status", render: (r) => <Badge tone={r.status}>{r.status}</Badge> },
            ]}
          />
        </Card>
      )}

      {tab === "rewards" && (
        <Card>
          <p className="mb-3 text-sm font-bold text-ink-800 dark:text-ink-100">Reward history</p>
          <DataTable
            rows={emp.rewards.map((r, i) => ({ id: String(i), ...r }))}
            emptyTitle="No rewards yet"
            columns={[
              { key: "date", label: "Date", render: (r) => fmtDate(r.date) },
              { key: "type", label: "Reward" },
              { key: "reason", label: "Reason" },
              { key: "points", label: "Points", render: (r) => <Badge tone="accent">+{r.points} pts</Badge> },
            ]}
          />
        </Card>
      )}

      {tab === "certs" && (
        <Card>
          <p className="mb-3 text-sm font-bold text-ink-800 dark:text-ink-100">Certificates</p>
          <DataTable
            rows={emp.certificates.map((c, i) => ({ id: String(i), ...c }))}
            emptyTitle="No certificates uploaded"
            columns={[
              { key: "title", label: "Certificate" },
              { key: "issuer", label: "Issuer" },
              { key: "issued", label: "Issued", render: (r) => fmtDate(r.issued) },
              { key: "expiry", label: "Expiry", render: (r) => fmtDate(r.expiry) },
            ]}
          />
        </Card>
      )}

      {tab === "documents" && (
        <Card>
          <p className="mb-3 text-sm font-bold text-ink-800 dark:text-ink-100">Documents</p>
          <DataTable
            rows={emp.documents.map((d, i) => ({ id: String(i), ...d }))}
            emptyTitle="No documents uploaded"
            columns={[
              { key: "title", label: "Document" },
              { key: "type", label: "Type", render: (r) => <Badge tone="blue">{r.type}</Badge> },
              { key: "added", label: "Added", render: (r) => fmtDate(r.added) },
            ]}
          />
        </Card>
      )}

      {tab === "qr" && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="flex flex-col items-center justify-center py-8">
            <p className="mb-1 flex items-center gap-1.5 text-sm font-bold text-ink-800 dark:text-ink-100"><QrCode className="h-4 w-4 text-brand-600" /> Employee QR Profile</p>
            <p className="mb-4 text-[11px] text-ink-400">Scan to open the digital safety profile</p>
            <div className="rounded-2xl bg-white p-4 shadow-glass ring-1 ring-ink-100 dark:ring-ink-800">
              <QRCodeSVG value={profileUrl} size={190} fgColor="#0f172a" level="M" />
            </div>
            <p className="mt-4 break-all rounded-lg bg-ink-50 px-3 py-1.5 text-[10px] text-ink-400 dark:bg-ink-800">{profileUrl}</p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => window.print()}>Print QR card</Button>
            </div>
          </Card>
          <div className="space-y-3">
            <Card>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-ink-800 dark:text-ink-100"><BadgeCheck className="h-4 w-4 text-emerald-500" /> Profile completeness</p>
              {[
                { label: "Personal details", done: true },
                { label: "Emergency contact", done: true },
                { label: "Medical records", done: emp.medical.length > 0 },
                { label: "PPE issued", done: emp.ppe.length > 0 },
                { label: "Training records", done: emp.trainings.length > 0 },
              ].map((p) => (
                <div key={p.label} className="flex items-center gap-2 py-1 text-xs">
                  <span className={`h-1.5 w-1.5 rounded-full ${p.done ? "bg-emerald-500" : "bg-ink-300"}`} />
                  <span className="text-ink-600 dark:text-ink-300">{p.label}</span>
                  <span className="ml-auto font-semibold text-ink-400">{p.done ? "✓" : "Pending"}</span>
                </div>
              ))}
            </Card>
            <Card>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-ink-800 dark:text-ink-100"><FileText className="h-4 w-4 text-brand-500" /> How it works</p>
              <p className="text-xs leading-relaxed text-ink-500 dark:text-ink-400">
                Each employee gets a unique QR code printed on their ID card. Supervisors and emergency responders can scan it
                to instantly view training, medical and emergency contact details — even from the mobile app.
              </p>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
