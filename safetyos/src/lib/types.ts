// ─────────────────────────────────────────────────────────────
// SafetyOS — Core domain types (mirror of the Supabase schema)
// ─────────────────────────────────────────────────────────────

export type Role =
  | "super_admin"
  | "company_admin"
  | "safety_officer"
  | "supervisor"
  | "employee"
  | "guest";

export interface Company {
  id: string;
  name: string;
  slug: string; // subdomain, e.g. "emveess" -> emveess.safetyos.com
  industry: string;
  plan: "starter" | "growth" | "enterprise";
  employeesLimit: number;
  accent: string; // brand accent hue
  status: "active" | "trial" | "suspended";
  city: string;
  since: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  companyId: string;
  avatarHue?: number;
}

export interface Employee {
  id: string;
  company_id: string;
  employee_code: string;
  name: string;
  department: string;
  designation: string;
  blood_group: string;
  dob: string;
  joining_date: string;
  contractor: string | null;
  phone: string;
  email: string;
  emergency_name: string;
  emergency_phone: string;
  status: "active" | "inactive";
  qr_token: string;
  violations: { date: string; type: string; severity: string; action: string; status: string }[];
  rewards: { date: string; type: string; reason: string; points: number }[];
  trainings: { program: string; date: string; score: number; certificate: string; valid_until: string }[];
  medical: { date: string; type: string; result: string; next_due: string }[];
  ppe: { item: string; issue_date: string; expiry_date: string; status: string }[];
  certificates: { title: string; issuer: string; issued: string; expiry: string }[];
  documents: { title: string; type: string; added: string }[];
}

export interface NearMiss {
  id: string;
  company_id: string;
  report_number: string;
  date: string;
  time: string;
  location: string;
  department: string;
  employee_name: string;
  description: string;
  category: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  photos: string[];
  root_cause: string;
  corrective_action: string;
  preventive_action: string;
  capa_id: string | null;
  status: "Open" | "Under Review" | "CAPA Pending" | "Closed" | "Verified";
  assigned_to: string;
  officer_remarks: string;
  timeline: { date: string; event: string; note: string; actor: string }[];
}

export interface Hazard {
  id: string;
  company_id: string;
  hazard_code: string;
  location: string;
  risk_level: "Low" | "Medium" | "High" | "Extreme";
  hazard_type: string;
  description: string;
  photos: string[];
  assigned_officer: string;
  corrective_action: string;
  status: "Open" | "In Progress" | "Mitigated" | "Closed";
  reported_by: string;
  reported_on: string;
  history: { date: string; from: string; to: string; note: string; actor: string }[];
}

export interface Incident {
  id: string;
  company_id: string;
  incident_number: string;
  date: string;
  time: string;
  location: string;
  department: string;
  type: "First Aid" | "MTC" | "LTI" | "Property Damage" | "Fire" | "Spill" | "Road" | "Near Miss Escalation";
  severity: "Low" | "Medium" | "High" | "Critical";
  description: string;
  reported_by: string;
  injured_person: string | null;
  injury_type: string | null;
  lost_days: number;
  status: "Under Investigation" | "Investigation Done" | "CAPA Pending" | "Closed";
  investigation: {
    investigator: string;
    started: string;
    summary: string;
    immediate_causes: string[];
    five_whys: { why: string; answer: string }[];
    fishbone: { category: string; causes: string[] }[];
    corrective_actions: { action: string; owner: string; due: string; status: string }[];
    preventive_actions: { action: string; owner: string; due: string; status: string }[];
    evidence: { label: string; type: string }[];
  };
  timeline: { date: string; event: string; note: string; actor: string }[];
}

export interface Grievance {
  id: string;
  company_id: string;
  grievance_number: string;
  employee_name: string;
  department: string;
  category: string;
  subject: string;
  description: string;
  status: "Open" | "Acknowledged" | "In Action" | "Resolved" | "Closed";
  officer_name: string;
  action_taken: string;
  employee_ack: boolean;
  filed_on: string;
  resolved_on: string | null;
  anonymous: boolean;
}

export interface TrainingProgram {
  id: string;
  company_id: string;
  title: string;
  category: string;
  trainer: string;
  duration_hours: number;
  validity_months: number;
  description: string;
}

export interface TrainingSession {
  id: string;
  company_id: string;
  program: string;
  date: string;
  time: string;
  venue: string;
  trainer: string;
  status: "Scheduled" | "Completed" | "Cancelled";
  attendees: number;
  capacity: number;
  pre_avg: number;
  post_avg: number;
  nominees: { name: string; status: "Nominated" | "Attended" | "Absent"; pre: number; post: number; certificate: string | null }[];
}

export interface PPEItem {
  id: string;
  company_id: string;
  name: string;
  type: string;
  standard: string;
  validity_months: number;
}

export interface PPEIssue {
  id: string;
  company_id: string;
  employee_name: string;
  department: string;
  item: string;
  issue_date: string;
  expiry_date: string;
  status: "Issued" | "Returned" | "Replaced" | "Expired";
  cost: number;
  vendor: string;
  last_inspection: string | null;
  condition: string;
}

export interface PPEStock {
  id: string;
  company_id: string;
  item: string;
  quantity: number;
  reorder_level: number;
  cost_per_unit: number;
  vendor: string;
  status: "In Stock" | "Low Stock" | "Out of Stock";
}

export interface VehicleInspection {
  id: string;
  company_id: string;
  vehicle_number: string;
  vehicle_type: string;
  date: string;
  driver: string;
  checklist: { item: string; ok: boolean; remark: string }[];
  defects: string[];
  photos: string[];
  inspected_by: string;
  approved_by: string | null;
  status: "Pending Approval" | "Approved" | "Rejected";
  remarks: string;
}

export interface ToolInspection {
  id: string;
  company_id: string;
  tool_name: string;
  tool_code: string;
  category: string;
  date: string;
  checklist: { item: string; ok: boolean; remark: string }[];
  photos: string[];
  status: "Pass" | "Fail" | "Repair";
  remarks: string;
  inspector: string;
}

export interface AuditFinding {
  id: string;
  type: "NC" | "OFI" | "Observation";
  description: string;
  clause: string;
  severity: string;
  capa_id: string | null;
  status: "Open" | "In Progress" | "Closed";
}

export interface Audit {
  id: string;
  company_id: string;
  audit_number: string;
  audit_type: "ISO 45001" | "5S" | "CSMS" | "Internal" | "Customer";
  scope: string;
  auditor: string;
  date_from: string;
  date_to: string;
  score: number;
  compliance: number;
  status: "Planned" | "In Progress" | "Completed" | "Closed";
  findings: AuditFinding[];
  evidence: { label: string; type: string }[];
}

export interface DocItem {
  id: string;
  company_id: string;
  title: string;
  category: "SOP" | "JSA" | "HIRA" | "MSDS" | "Policy" | "Manual" | "Training Material";
  description: string;
  version: string;
  issued: string;
  review_due: string;
  owner: string;
  downloads: number;
  size: string;
}

export interface NotificationItem {
  id: string;
  company_id: string;
  user: string; // "all" | role
  title: string;
  body: string;
  type: "email" | "sms" | "browser";
  read: boolean;
  created: string;
  link: string;
}

export interface ActivityLog {
  id: string;
  company_id: string;
  user: string;
  role: string;
  action: string;
  entity: string;
  entity_id: string;
  details: string;
  created: string;
}

export interface Capa {
  id: string;
  company_id: string;
  capa_number: string;
  source_type: string;
  source_id: string;
  description: string;
  owner: string;
  due_date: string;
  status: "Open" | "In Progress" | "Verified" | "Closed";
  actions: { action: string; done: boolean }[];
}

export interface Plan {
  id: string;
  name: string;
  price: number | null;
  priceLabel: string;
  employees: number | "Unlimited";
  features: string[];
  highlight?: boolean;
}
