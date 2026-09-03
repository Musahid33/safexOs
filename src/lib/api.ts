// ─────────────────────────────────────────────────────────────
// SafetyOS — data access layer
// In demo mode reads/writes the in-memory store.
// When Supabase is configured (and DEMO_MODE off) it queries the
// live database (schema: supabase/schema.sql) with tenant scoping.
// DB rows are mapped to the app's domain shape (names for FKs,
// "date" fields, etc.) so every page works identically in both modes.
// ─────────────────────────────────────────────────────────────
import { db, forCompany, liveLookups } from "./store";
import { getSupabase } from "./supabase";

const DELAY = 140;
const tick = () => new Promise((r) => setTimeout(r, DELAY));

export const SUPABASE_TABLES: Record<string, string> = {
  employees: "employees",
  "near-misses": "near_misses",
  hazards: "hazards",
  incidents: "incidents",
  grievances: "grievances",
  "training-programs": "training_programs",
  "training-sessions": "training_sessions",
  "ppe-issues": "ppe_issues",
  "ppe-stock": "ppe_stock",
  "vehicle-inspections": "vehicle_inspections",
  "tool-inspections": "tool_inspections",
  audits: "audits",
  documents: "documents",
  notifications: "notifications",
  "activity-logs": "activity_logs",
  capas: "capas",
};

export type EntityKey = keyof typeof SUPABASE_TABLES | "plans" | "companies";

export interface Filters {
  q?: string;
  status?: string;
  severity?: string;
  department?: string;
  from?: string;
  to?: string;
  type?: string;
  category?: string;
  location?: string;
}

export const severityOrder = ["Low", "Medium", "High", "Critical", "Extreme"];

function matchesFilters(row: Record<string, any>, f: Filters): boolean {
  if (f.status && row.status !== f.status) return false;
  if (f.severity && row.severity !== f.severity) return false;
  if (f.department && row.department !== f.department) return false;
  if (f.type && row.type !== f.type && row.audit_type !== f.type && row.vehicle_type !== f.type) return false;
  if (f.category && row.category !== f.category) return false;
  if (f.location && row.location !== f.location) return false;
  if (f.from && row.date && row.date < f.from) return false;
  if (f.to && row.date && row.date > f.to) return false;
  if (f.q) {
    const q = f.q.toLowerCase();
    const hay = JSON.stringify(Object.values(row)).toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

// ── DB row → app shape mapping ───────────────────────────────
const lkName = (m: Map<string, string> | undefined, id: any) =>
  id == null ? null : m?.get(String(id)) ?? "—";

function mapRow(table: string, r: any): any {
  const L = liveLookups;
  switch (table) {
    case "near_misses":
      return {
        ...r,
        date: r.nm_date ?? r.date,
        time: r.nm_time ?? r.time,
        location: lkName(L.locations, r.location_id),
        department: lkName(L.departments, r.department_id),
        employee_name: lkName(L.employees, r.employee_id),
        assigned_to: lkName(L.profiles, r.assigned_to),
        five_whys: r.five_whys ?? [],
        evidence: r.evidence ?? [],
        report_documents: r.report_documents ?? [],
        responsible_person: r.responsible_person ?? "",
      };
    case "hazards":
      return {
        ...r,
        location: lkName(L.locations, r.location_id),
        assigned_officer: lkName(L.profiles, r.assigned_officer),
        reported_by: lkName(L.profiles, r.reported_by),
      };
    case "incidents":
      return {
        ...r,
        date: r.inc_date ?? r.date,
        time: r.inc_time ?? r.time,
        location: lkName(L.locations, r.location_id),
        department: lkName(L.departments, r.department_id),
        injured_person: lkName(L.employees, r.injured_person),
        investigation: r.investigation ?? null,
      };
    case "grievances":
      return {
        ...r,
        employee_name: lkName(L.employees, r.employee_id),
        department: lkName(L.departments, r.department_id),
        officer_name: lkName(L.profiles, r.officer_id),
      };
    case "training_sessions":
      return {
        ...r,
        date: r.session_date ?? r.date,
        time: r.session_time ?? r.time,
        program: lkName(L.programs, r.program_id),
      };
    case "ppe_issues":
      return {
        ...r,
        employee_name: lkName(L.employees, r.employee_id),
        department: lkName(L.departments, r.department_id),
        item: lkName(L.ppe, r.ppe_id),
        vendor: lkName(L.vendors, r.vendor_id),
      };
    case "ppe_stock":
      return { ...r, item: lkName(L.ppe, r.ppe_id), vendor: lkName(L.vendors, r.vendor_id) };
    case "vehicle_inspections":
      return {
        ...r,
        date: r.inspection_date ?? r.date,
        inspected_by: lkName(L.profiles, r.inspected_by),
        approved_by: lkName(L.profiles, r.approved_by),
      };
    case "tool_inspections":
      return { ...r, date: r.inspection_date ?? r.date, inspector: lkName(L.profiles, r.inspector) };
    case "employees":
      return {
        ...r,
        department: lkName(L.departments, r.department_id),
        contractor: lkName(L.contractors, r.contractor_id),
      };
    case "activity_logs":
      return { ...r, user: r.user_name ?? "system", created: r.created_at };
    case "notifications":
      return { ...r, type: r.channel ?? "browser" };
    case "capas":
      return { ...r, owner: lkName(L.profiles, r.owner_id) };
    case "documents":
      return {
        ...r,
        issued: r.issued_date ?? r.issued,
        review_due: r.review_due ?? "",
      };
    default:
      return r;
  }
}

// ── list ──────────────────────────────────────────────────────
export async function listEntities(
  entity: EntityKey,
  companyId: string,
  filters: Filters = {}
): Promise<any[]> {
  const sb = getSupabase();
  if (sb && SUPABASE_TABLES[entity]) {
    const table = SUPABASE_TABLES[entity];
    const noSoft = table === "notifications" || table === "activity_logs";
    let query = sb.from(table).select("*").eq("company_id", companyId);
    if (!noSoft) query = query.is("deleted_at", null);
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) {
      console.error("[supabase]", error.message);
      return [];
    }
    let rows = (data ?? []).map((r) => mapRow(table, r));

    // Attach nested findings + investigation for detail-ready rows
    if (entity === "audits") {
      const { data: fdata } = await sb
        .from("audit_findings").select("*")
        .eq("company_id", companyId).is("deleted_at", null);
      rows = rows.map((a) => ({
        ...a,
        findings: (fdata ?? [])
          .filter((f) => f.audit_id === a.id)
          .map((f) => ({
            id: f.id, type: f.finding_type, description: f.description,
            clause: f.clause, severity: f.severity, capa_id: f.capa_id, status: f.status,
          })),
      }));
    }
    if (entity === "incidents") {
      const { data: idata } = await sb
        .from("incident_investigations").select("*")
        .eq("company_id", companyId).is("deleted_at", null);
      rows = rows.map((i) => {
        const inv = (idata ?? []).find((x) => x.incident_id === i.id);
        if (!inv) return i;
        return {
          ...i,
          investigation: {
            investigator: lkName(liveLookups.profiles, inv.investigator),
            started: i.date,
            summary: inv.summary ?? "",
            immediate_causes: inv.immediate_causes ?? [],
            five_whys: inv.five_whys ?? [],
            fishbone: inv.fishbone ?? [],
            corrective_actions: inv.corrective_actions ?? [],
            preventive_actions: inv.preventive_actions ?? [],
            evidence: inv.evidence ?? [],
          },
        };
      });
    }
    return rows.filter((r) => matchesFilters(r, filters));
  }

  await tick();
  const source = mockSource(entity);
  return forCompany(source, companyId)
    .filter((r) => matchesFilters(r, filters))
    .sort((a, b) => String(b.created ?? b.date ?? b.id).localeCompare(String(a.created ?? a.date ?? a.id)));
}

export async function getEntity(entity: EntityKey, id: string, companyId: string): Promise<any | null> {
  const sb = getSupabase();
  if (sb && SUPABASE_TABLES[entity]) {
    if (entity === "employees") return getEmployeeLive(id, companyId);
    const rows = await listEntities(entity, companyId);
    return rows.find((r) => r.id === id) ?? null;
  }
  await tick();
  return mockSource(entity).find((r) => r.id === id && r.company_id === companyId) ?? null;
}

async function getEmployeeLive(id: string, companyId: string): Promise<any | null> {
  const sb = getSupabase()!;
  const emp = (await listEntities("employees", companyId)).find((r) => r.id === id);
  if (!emp) return null;
  const [tr, md, vl, rw, dc, ppe] = await Promise.all([
    sb.from("employee_trainings").select("*").eq("employee_id", id).is("deleted_at", null),
    sb.from("employee_medical").select("*").eq("employee_id", id).is("deleted_at", null),
    sb.from("employee_violations").select("*").eq("employee_id", id).is("deleted_at", null),
    sb.from("employee_rewards").select("*").eq("employee_id", id).is("deleted_at", null),
    sb.from("employee_documents").select("*").eq("employee_id", id).is("deleted_at", null),
    sb.from("ppe_issues").select("*").eq("employee_id", id).is("deleted_at", null),
  ]);
  const docs = dc.data ?? [];
  return {
    ...emp,
    trainings: (tr.data ?? []).map((t) => ({
      program: t.program ?? "Training", date: t.training_date ?? "",
      score: Number(t.score) || 0, certificate: t.certificate_no ?? "", valid_until: t.valid_until ?? "",
    })),
    medical: (md.data ?? []).map((m) => ({
      date: m.exam_date ?? "", type: m.exam_type ?? "", result: m.result ?? "", next_due: m.next_due ?? "",
    })),
    violations: (vl.data ?? []).map((v) => ({
      date: v.violation_date ?? "", type: v.violation_type ?? "", severity: v.severity ?? "",
      action: v.action_taken ?? "", status: v.status ?? "",
    })),
    rewards: (rw.data ?? []).map((r) => ({
      date: r.reward_date ?? "", type: r.reward_type ?? "", reason: r.reason ?? "", points: r.points ?? 0,
    })),
    certificates: docs
      .filter((d) => d.doc_type === "certificate")
      .map((d) => ({ title: d.title ?? "", issuer: "—", issued: d.issued_date ?? "", expiry: d.expiry_date ?? "" })),
    documents: docs.map((d) => ({ title: d.title ?? "", type: d.doc_type ?? "", added: d.created_at ?? "" })),
    ppe: (ppe.data ?? []).map((p) => ({
      item: lkName(liveLookups.ppe, p.ppe_id) ?? "PPE",
      issue_date: p.issue_date ?? "", expiry_date: p.expiry_date ?? "", status: p.status ?? "",
    })),
  };
}

// ── create / update ──────────────────────────────────────────
function revId(m: Map<string, string>, v: any): string | null {
  if (v == null) return null;
  for (const [id, nm] of m.entries()) if (nm === v) return id;
  return null;
}

function toDbRow(entity: string, row: any): any {
  const L = liveLookups;
  const base = { company_id: row.company_id };
  switch (entity) {
    case "near-misses":
      return {
        ...base,
        report_number: row.report_number,
        nm_date: row.date, nm_time: row.time,
        location_id: revId(L.locations, row.location),
        department_id: revId(L.departments, row.department),
        employee_id: revId(L.employees, row.employee_name),
        description: row.description, category: row.category, severity: row.severity,
        photos: row.photos ?? [],
        status: row.status ?? "NEW",
        assigned_to: revId(L.profiles, row.assigned_to),
        immediate_action: row.immediate_action ?? "",
        root_cause: row.root_cause ?? "",
        five_whys: row.five_whys ?? [],
        corrective_action: row.corrective_action ?? "",
        preventive_action: row.preventive_action ?? "",
        responsible_person: row.responsible_person ?? "",
        target_date: row.target_date ?? null,
        evidence: row.evidence ?? [],
        report_documents: row.report_documents ?? [],
        rejection_reason: row.rejection_reason ?? "",
        capa_id: null,
        officer_remarks: row.officer_remarks ?? "",
        timeline: row.timeline ?? [],
        search_text: [row.report_number, row.category, row.description, row.location].filter(Boolean).join(" "),
      };
    case "grievances":
      return {
        ...base,
        grievance_number: row.grievance_number,
        employee_id: revId(L.employees, row.employee_name),
        category: row.category, subject: row.subject, description: row.description,
        status: "Open", officer_id: revId(L.profiles, row.officer_name),
        action_taken: "", employee_ack: false, filed_on: row.filed_on, anonymous: row.anonymous ?? false,
      };
    case "employees":
      return {
        ...base,
        employee_code: row.employee_code, name: row.name,
        department_id: revId(L.departments, row.department),
        designation: row.designation, blood_group: row.blood_group,
        dob: row.dob, joining_date: row.joining_date,
        phone: row.phone, email: row.email,
        emergency_name: "—", emergency_phone: "—", status: "active",
        qr_token: row.qr_token ?? Math.random().toString(36).slice(2) + Date.now().toString(36),
        search_text: [row.employee_code, row.name, row.designation, row.department].filter(Boolean).join(" "),
      };
    case "vehicle-inspections":
      return {
        ...base,
        vehicle_number: row.vehicle_number, vehicle_type: row.vehicle_type,
        inspection_date: row.date, driver: row.driver,
        checklist: row.checklist ?? [], defects: row.defects ?? [], photos: [],
        inspected_by: revId(L.profiles, row.inspected_by),
        status: "Pending Approval", remarks: row.remarks ?? "",
      };
    case "tool-inspections":
      return {
        ...base,
        tool_name: row.tool_name, tool_code: row.tool_code, category: row.category,
        inspection_date: row.date, checklist: row.checklist ?? [], photos: [],
        status: row.status ?? "Pass", remarks: row.remarks ?? "",
        inspector: revId(L.profiles, row.inspector),
      };
    case "documents":
      return {
        ...base,
        title: row.title,
        category: row.category ?? "Manual",
        description: row.description ?? "",
        file_url: row.file_url ?? null,
        version: row.version ?? "v1.0",
        issued_date: row.issued ?? null,
        review_due: row.review_due ?? null,
        owner: row.owner ?? "",
        search_text: [row.title, row.category, row.description ?? ""].filter(Boolean).join(" "),
      };
    default:
      return row;
  }
}

export async function createEntity(entity: EntityKey, row: Record<string, any>): Promise<any> {
  const sb = getSupabase();
  if (sb && SUPABASE_TABLES[entity]) {
    const { data, error } = await sb
      .from(SUPABASE_TABLES[entity]).insert(toDbRow(entity, row)).select().single();
    if (error) throw error;
    return data;
  }
  await tick();
  const src = mockSource(entity) as any[];
  src.unshift(row);
  return row;
}

/** Maps display values (names) back to DB ids for live-mode updates. */
function toDbPatch(entity: string, patch: Record<string, any>): Record<string, any> {
  if (entity !== "near-misses") return patch;
  const p = { ...patch };
  if ("assigned_to" in p) p.assigned_to = revId(liveLookups.profiles, p.assigned_to) ?? null;
  return p;
}

export async function updateEntity(entity: EntityKey, id: string, patch: Record<string, any>): Promise<void> {
  const sb = getSupabase();
  if (sb && SUPABASE_TABLES[entity]) {
    const { error } = await sb.from(SUPABASE_TABLES[entity]).update(toDbPatch(entity, patch)).eq("id", id);
    if (error) console.error("[supabase]", error.message);
    return;
  }
  await tick();
  const src = mockSource(entity) as any[];
  const row = src.find((r) => r.id === id);
  if (row) Object.assign(row, patch);
}

// ── mock sources ──────────────────────────────────────────────
export function mockSource(entity: EntityKey): any[] {
  switch (entity) {
    case "employees": return db.employees;
    case "near-misses": return db.nearMisses;
    case "hazards": return db.hazards;
    case "incidents": return db.incidents;
    case "grievances": return db.grievances;
    case "training-sessions": return db.trainingSessions;
    case "training-programs": return db.trainingPrograms;
    case "ppe-issues": return db.ppeIssues;
    case "ppe-stock": return db.ppeStock;
    case "vehicle-inspections": return db.vehicleInspections;
    case "tool-inspections": return db.toolInspections;
    case "audits": return db.audits;
    case "documents": return db.documents;
    case "notifications": return db.notifications;
    case "activity-logs": return db.activityLogs;
    case "capas": return db.capas;
    case "companies": return db.companies;
    case "plans": return db.plans;
    default: return [];
  }
}

// ── helpers ───────────────────────────────────────────────────
export async function nextReportNumber(entity: string, companyId: string): Promise<string> {
  const sb = getSupabase();
  let count = 0;
  if (sb && SUPABASE_TABLES[entity]) {
    const { count: c } = await sb
      .from(SUPABASE_TABLES[entity]).select("*", { count: "exact", head: true })
      .eq("company_id", companyId);
    count = c ?? 0;
  } else {
    count = mockSource(entity as EntityKey).filter((r) => r.company_id === companyId).length;
  }
  const year = new Date().getFullYear();
  const prefix =
    entity === "near-misses" ? "NM" :
    entity === "incidents" ? "INC" :
    entity === "hazards" ? "HZ" :
    entity === "grievances" ? "GRV" : "DOC";
  return `${prefix}-${year}-${String(count + 1).padStart(4, "0")}`;
}

export function logActivity(companyId: string, user: string, role: string, action: string, entity: string, entityId: string) {
  const sb = getSupabase();
  if (sb) {
    sb.from("activity_logs")
      .insert({
        company_id: companyId, user_name: user, role,
        action, entity, entity_id: entityId,
        details: `${action} ${entity} ${entityId}`,
      })
      .then(({ error }) => error && console.error("[supabase]", error.message));
    return;
  }
  db.activityLogs.unshift({
    id: "log-" + Date.now(),
    company_id: companyId,
    user,
    role,
    action,
    entity,
    entity_id: entityId,
    details: `${action} ${entity} ${entityId}`,
    created: new Date().toISOString(),
  });
}
