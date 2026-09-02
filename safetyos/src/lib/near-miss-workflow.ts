// ─────────────────────────────────────────────────────────────
// SafetyOS — Near Miss investigation workflow
// NEW → UNDER INVESTIGATION → RCA COMPLETED → CLOSED
// (REJECTED is terminal until an officer reopens it)
// ─────────────────────────────────────────────────────────────
import type { NearMiss, NearMissStatus } from "./types";

export const NM_WORKFLOW_STEPS = ["NEW", "UNDER INVESTIGATION", "RCA COMPLETED", "CLOSED"] as const;
export type NmWorkflowStep = (typeof NM_WORKFLOW_STEPS)[number];

export const NM_STATUS_META: Record<NearMissStatus, { label: string; tone: string; step: number; desc: string }> = {
  "NEW": { label: "NEW", tone: "sky", step: 0, desc: "Submitted by employee — awaiting safety officer triage" },
  "UNDER INVESTIGATION": { label: "UNDER INVESTIGATION", tone: "violet", step: 1, desc: "Investigator assigned — root cause analysis in progress" },
  "RCA COMPLETED": { label: "RCA COMPLETED", tone: "blue", step: 2, desc: "Investigation submitted — awaiting officer review" },
  "CLOSED": { label: "CLOSED", tone: "emerald", step: 3, desc: "Approved and closed" },
  "REJECTED": { label: "REJECTED", tone: "rose", step: -1, desc: "Rejected — not a valid near-miss report" },
  // legacy statuses (mapped onto the new pipeline)
  "Open": { label: "NEW", tone: "sky", step: 0, desc: "Submitted by employee — awaiting safety officer triage" },
  "Under Review": { label: "UNDER INVESTIGATION", tone: "violet", step: 1, desc: "Investigator assigned — root cause analysis in progress" },
  "CAPA Pending": { label: "RCA COMPLETED", tone: "blue", step: 2, desc: "RCA completed — remediation pending" },
  "Closed": { label: "CLOSED", tone: "emerald", step: 3, desc: "Approved and closed" },
  "Verified": { label: "CLOSED", tone: "emerald", step: 3, desc: "Approved and closed" },
};

export const nmStatusMeta = (status: string): (typeof NM_STATUS_META)[NearMissStatus] =>
  NM_STATUS_META[status as NearMissStatus] ?? NM_STATUS_META.NEW;

export const isNmClosed = (status: string) =>
  status === "CLOSED" || status === "Closed" || status === "Verified";

export const isNmRejected = (status: string) => status === "REJECTED";

export const isNmOpen = (status: string) => !isNmClosed(status) && !isNmRejected(status);

/** Step index of the live workflow (legacy statuses are mapped). */
export const nmStepIndex = (status: string) => nmStatusMeta(status).step;

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** CSMS Documents → Near Miss → 2026 → September */
export function csmsFolderFor(nm: { date?: string; report_number?: string }): { year: string; month: string; label: string; path: string } {
  const d = nm.date && nm.date.length >= 7 ? new Date(nm.date + (nm.date.length === 7 ? "-15" : "")) : new Date();
  const year = String(d.getFullYear());
  const month = MONTHS[d.getMonth()];
  return { year, month, label: `CSMS Documents/Near Miss/${year}/${month}`, path: `Near Miss/${year}/${month}` };
}

export const safeFileName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, "-");
export const pdfFileName = (reportNumber: string) => `${reportNumber}.pdf`;
export const docxFileName = (reportNumber: string) => `${reportNumber}.docx`;

/** Repository of people who can be assigned as investigator (demo + live). */
export const INVESTIGATOR_OPTIONS = [
  "Karthik Selvam",
  "Mahesh Rao",
  "Deepa Nair",
  "Anitha Kumar",
  "Rajesh Iyer",
];

export const NM_CATEGORIES = ["Slip / Trip", "Falling Object", "Equipment Failure", "Vehicle Movement", "Chemical Exposure", "Fire / Smoke", "Electrical", "Ergonomic", "Housekeeping"];

export const emptyFiveWhys = () => [
  { why: "Why did the near miss occur?", answer: "" },
  { why: "Why did that happen?", answer: "" },
  { why: "Why did that happen?", answer: "" },
  { why: "Why did that happen?", answer: "" },
  { why: "Why did that happen? (root cause)", answer: "" },
];
