// ─────────────────────────────────────────────────────────────
// SafetyOS — in-memory demo data store (multi-tenant seed)
// Mirrors the Supabase schema; used when DEMO_MODE is on.
// ─────────────────────────────────────────────────────────────
import type {
  ActivityLog, Audit, Capa, Company, DocItem, Employee, Grievance, Hazard,
  Incident, NearMiss, NotificationItem, PPEIssue, PPEStock, Plan, ToolInspection,
  TrainingProgram, TrainingSession, VehicleInspection,
} from "./types";

export const db: {
  companies: Company[];
  employees: Employee[];
  nearMisses: NearMiss[];
  hazards: Hazard[];
  incidents: Incident[];
  grievances: Grievance[];
  trainingPrograms: TrainingProgram[];
  trainingSessions: TrainingSession[];
  ppeIssues: PPEIssue[];
  ppeStock: PPEStock[];
  vehicleInspections: VehicleInspection[];
  toolInspections: ToolInspection[];
  audits: Audit[];
  documents: DocItem[];
  notifications: NotificationItem[];
  activityLogs: ActivityLog[];
  capas: Capa[];
  plans: Plan[];
  rolePermissions: Record<string, string[]>;
} = {
  companies: [],
  employees: [],
  nearMisses: [],
  hazards: [],
  incidents: [],
  grievances: [],
  trainingPrograms: [],
  trainingSessions: [],
  ppeIssues: [],
  ppeStock: [],
  vehicleInspections: [],
  toolInspections: [],
  audits: [],
  documents: [],
  notifications: [],
  activityLogs: [],
  capas: [],
  plans: [],
  rolePermissions: {},
};

// ─────────────────────────────────────────────────────────────
// Companies
// ─────────────────────────────────────────────────────────────
db.companies = [
  { id: "emveess", name: "Emveess Industries Pvt Ltd", slug: "emveess", industry: "Manufacturing", plan: "enterprise", employeesLimit: 99999, accent: "#2563eb", status: "active", city: "Chennai, TN", since: "2024-03-12" },
  { id: "revathi", name: "Revathi Steels Ltd", slug: "revathi", industry: "Steel Plant", plan: "growth", employeesLimit: 500, accent: "#0d9488", status: "active", city: "Visakhapatnam, AP", since: "2024-08-02" },
  { id: "abc", name: "ABC Logistics & Warehousing", slug: "abc", industry: "Logistics", plan: "starter", employeesLimit: 100, accent: "#7c3aed", status: "trial", city: "Pune, MH", since: "2026-06-19" },
];

db.plans = [
  { id: "starter", name: "Starter", price: 2999, priceLabel: "₹2,999/month", employees: 100, features: ["100 employees", "Near Miss & Hazard modules", "Employee Master", "Email notifications", "5 GB storage", "Community support"] },
  { id: "growth", name: "Growth", price: 5999, priceLabel: "₹5,999/month", employees: 500, features: ["500 employees", "All safety modules", "Audits & Inspections", "Training management", "Analytics & reports", "Priority support"], highlight: true },
  { id: "enterprise", name: "Enterprise", price: null, priceLabel: "Custom pricing", employees: "Unlimited", features: ["Unlimited employees", "Multi-site & contractors", "API access & SSO", "Dedicated manager", "AI features (future)", "SLA & onboarding"] },
];

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const NAMES = ["Ramesh Kumar", "Suresh Babu", "Priya Sharma", "Anitha Kumar", "Karthik Selvam", "Mahesh Rao", "Vikram Singh", "Deepa Nair", "Arun Prasad", "Lakshmi Devi", "Imran Khan", "Sunita Patel", "Ganesh Murthy", "Farida Begum", "Rajesh Iyer", "Manju Rani", "Prakash Yadav", "Divya Menon", "Sandeep Gowda", "Kavitha Reddy"];
const DEPTS = ["Production", "Maintenance", "EHS", "Warehouse", "Quality", "HR", "Logistics"];
const DESIGNATIONS: Record<string, string[]> = {
  Production: ["Operator", "Line Supervisor", "Technician", "Shift Incharge"],
  Maintenance: ["Fitter", "Electrician", "Maintenance Engineer"],
  EHS: ["Safety Officer", "Safety Steward"],
  Warehouse: ["Store Keeper", "Forklift Operator"],
  Quality: ["QA Inspector"],
  HR: ["HR Executive"],
  Logistics: ["Driver", "Load Supervisor"],
};
const BLOOD = ["A+", "B+", "O+", "AB+", "A-", "O-"];
const CONTRACTORS = ["Sri Lakshmi Contractors", "KMR Infra Services", "VTS Manpower", null];

function rnd<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function rndDate(startYear: number, startMonth: number, endYear: number, endMonth: number): string {
  const s = new Date(startYear, startMonth - 1, 1).getTime();
  const e = new Date(endYear, endMonth, 0).getTime();
  return new Date(s + Math.random() * (e - s)).toISOString().slice(0, 10);
}

// ─────────────────────────────────────────────────────────────
// Employee generation (per company)
// ─────────────────────────────────────────────────────────────
function makeEmployees(companyId: string, count: number, seedOffset: number): Employee[] {
  const emps: Employee[] = [];
  for (let i = 0; i < count; i++) {
    const name = NAMES[(i + seedOffset) % NAMES.length];
    const dept = DEPTS[(i + seedOffset) % DEPTS.length];
    const desig = rnd(DESIGNATIONS[dept]);
    const join = rndDate(2021, 1, 2026, 6);
    const dob = rndDate(1975, 1, 2003, 12);
    const trainings = [
      { program: "Fire Safety & Evacuation", date: rndDate(2025, 1, 2026, 6), score: 70 + Math.floor(Math.random() * 28), certificate: "TR-" + (1000 + i + seedOffset), valid_until: "2027-06-30" },
      { program: "Workplace Hazard Awareness", date: rndDate(2024, 6, 2026, 3), score: 68 + Math.floor(Math.random() * 30), certificate: "TR-" + (2000 + i + seedOffset), valid_until: "2027-03-31" },
    ];
    emps.push({
      id: companyId + "-emp-" + (i + 1),
      company_id: companyId,
      employee_code: (companyId === "emveess" ? "EMV" : companyId === "revathi" ? "RVT" : "ABC") + "-" + String(i + 1).padStart(3, "0"),
      name,
      department: dept,
      designation: desig,
      blood_group: BLOOD[(i + seedOffset) % BLOOD.length],
      dob,
      joining_date: join,
      contractor: Math.random() < 0.25 ? rnd(CONTRACTORS) : null,
      phone: "+91 9" + Math.floor(100000000 + Math.random() * 899999999),
      email: name.toLowerCase().replace(/[^a-z ]/g, "").replace(/ /g, ".") + "@" + companyId + ".com",
      emergency_name: rnd(["Latha", "Mohan", "Revathi", "Sekar", "Asha", "Dinesh"]) + " " + rnd(["K", "R", "S", "M"]),
      emergency_phone: "+91 8" + Math.floor(100000000 + Math.random() * 899999999),
      status: Math.random() < 0.93 ? "active" : "inactive",
      qr_token: "qr-" + companyId + "-" + (i + 1) + "-" + Math.random().toString(36).slice(2, 8),
      violations: Math.random() < 0.4
        ? [{ date: rndDate(2025, 1, 2026, 7), type: rnd(["PPE Non-compliance", "Unsafe Act", "Housekeeping", "Smoking in Restricted Area"]), severity: rnd(["Minor", "Major"]), action: rnd(["Verbal warning", "Written warning", "Counseling"]), status: Math.random() < 0.7 ? "Closed" : "Open" }]
        : [],
      rewards: Math.random() < 0.35
        ? [{ date: rndDate(2025, 3, 2026, 6), type: rnd(["Best Safety Suggestion", "Zero Accident Award", "Spot Reward"]), reason: "Proactive hazard reporting", points: 50 }]
        : [],
      trainings,
      medical: [{ date: rndDate(2025, 1, 2026, 4), type: "Annual Health Check-up", result: Math.random() < 0.85 ? "Fit for Duty" : "Fit with Advice", next_due: "2027-02-15" }],
      ppe: [
        { item: "Safety Helmet", issue_date: rndDate(2025, 1, 2026, 2), expiry_date: "2028-02-01", status: "Issued" },
        { item: "Safety Shoes", issue_date: rndDate(2025, 1, 2026, 2), expiry_date: "2027-11-15", status: "Issued" },
      ],
      certificates: [
        { title: "Basic First Aid", issuer: "St. John Ambulance", issued: rndDate(2023, 1, 2025, 6), expiry: "2027-05-30" },
      ],
      documents: [
        { title: "Aadhaar Copy", type: "KYC", added: rndDate(2021, 1, 2024, 12) },
        { title: "Joining Letter", type: "HR", added: join },
      ],
    });
  }
  return emps;
}

db.employees = [
  ...makeEmployees("emveess", 18, 0),
  ...makeEmployees("revathi", 9, 8),
  ...makeEmployees("abc", 5, 14),
];

// ─────────────────────────────────────────────────────────────
// Locations per tenant
// ─────────────────────────────────────────────────────────────
const LOCATIONS: Record<string, string[]> = {
  emveess: ["Blast Furnace Area", "Rolling Mill", "Assembly Line 2", "Warehouse A", "Loading Bay", "Electrical Substation", "Paint Shop", "Admin Block"],
  revathi: ["Melt Shop", "Rolling Mill", "Scrap Yard", "Furnace Control Room", "Dispatch Yard"],
  abc: ["Main Warehouse", "Cold Storage", "Dock 1", "Dock 2", "Transport Yard"],
};

// ─────────────────────────────────────────────────────────────
// Near Misses
// ─────────────────────────────────────────────────────────────
const NM_CATEGORIES = ["Slip / Trip", "Falling Object", "Equipment Failure", "Vehicle Movement", "Chemical Exposure", "Fire / Smoke", "Electrical", "Ergonomic", "Housekeeping"];
const NM_SEVERITY: NearMiss["severity"][] = ["Low", "Medium", "High", "Critical"];

function makeNearMisses(companyId: string, count: number, seedOffset: number): NearMiss[] {
  const rows: NearMiss[] = [];
  const locs = LOCATIONS[companyId];
  const investigators = ["Karthik Selvam", "Mahesh Rao", "Deepa Nair"];
  for (let i = 0; i < count; i++) {
    const date = rndDate(2026, 1, 2026, 8);
    const severity = NM_SEVERITY[Math.min(3, Math.floor(Math.random() * 4.2))];
    const cat = NM_CATEGORIES[(i + seedOffset) % NM_CATEGORIES.length];
    const idx = i + seedOffset;
    // Deterministic spread: new → under investigation → RCA done → closed → rejected
    const phase = idx % 5;
    const status: NearMiss["status"] =
      phase === 0 ? "NEW" :
      phase === 1 ? "UNDER INVESTIGATION" :
      phase === 2 ? "RCA COMPLETED" :
      phase === 3 ? "CLOSED" : "REJECTED";
    const investigator = investigators[(i + seedOffset) % investigators.length];
    const whys = [
      { why: "Why did the near miss occur?", answer: "A potential " + cat.toLowerCase() + " condition was present at the workstation." },
      { why: "Why was the condition present?", answer: "Routine housekeeping and pre-task checks were not performed for the area." },
      { why: "Why were the checks not performed?", answer: "The task checklist does not include this area and no owner was assigned." },
      { why: "Why is there no owner?", answer: "Responsibility matrix was not updated after the last shift reorganisation." },
      { why: "Why was the matrix not updated? (root cause)", answer: "No management-of-change process for shift roster changes; inadequate hazard awareness and lack of periodic inspection." },
    ];
    const investigated = phase === 2 || phase === 3;
    const haveReports = phase === 3;
    rows.push({
      id: companyId + "-nm-" + (i + 1),
      company_id: companyId,
      report_number: "NM-" + (2026) + "-" + String(idx + 1).padStart(4, "0"),
      date,
      time: String(6 + Math.floor(Math.random() * 16)).padStart(2, "0") + ":" + String(Math.floor(Math.random() * 60)).padStart(2, "0"),
      location: rnd(locs),
      department: rnd(DEPTS),
      employee_name: rnd(NAMES),
      description: `While carrying out routine work, a ${cat.toLowerCase()} condition was observed. The area was immediately barricaded and the shift supervisor informed. No injury occurred.`,
      category: cat,
      severity,
      photos: ["p1", "p2"].slice(0, Math.random() < 0.6 ? 2 : 1),
      status,
      assigned_to: phase === 0 ? "" : investigator,
      immediate_action: phase >= 1 || phase === 4 ? "Area barricaded, work stopped and shift supervisor informed immediately." : "",
      root_cause: investigated ? whys[4].answer : phase === 4 ? "No root cause — report was not a valid near miss." : "",
      five_whys: investigated ? whys : phase === 1 ? whys.slice(0, 2) : [],
      corrective_action: investigated ? "Work area re-inspected; responsibility matrix updated and signage installed." : "",
      preventive_action: investigated ? "Weekly housekeeping audit added to supervisor checklist; MOC process for roster changes introduced." : "",
      responsible_person: investigated ? "Mahesh Rao" : "",
      target_date: investigated ? rndDate(2026, 9, 2026, 12) : "",
      evidence: investigated
        ? [
            { label: "Site inspection checklist", type: "pdf", name: "inspection-checklist.pdf", size: 184320, url: "blob:seed" },
            { label: "Shift log extract", type: "doc", name: "shift-log.pdf", size: 92160, url: "blob:seed" },
          ]
        : [],
      report_documents: haveReports
        ? [
            { name: "NM-2026-" + String(idx + 1).padStart(4, "0") + ".pdf", format: "pdf", path: "Near Miss/2026/" + ["July", "August"][idx % 2] + "/NM-2026-" + String(idx + 1).padStart(4, "0") + ".pdf", url: "#", saved_at: new Date().toISOString() },
            { name: "NM-2026-" + String(idx + 1).padStart(4, "0") + ".docx", format: "docx", path: "Near Miss/2026/" + ["July", "August"][idx % 2] + "/NM-2026-" + String(idx + 1).padStart(4, "0") + ".docx", url: "#", saved_at: new Date().toISOString() },
          ]
        : [],
      rejection_reason: phase === 4 ? "No safety exposure — duplicate of an existing observation log entry." : "",
      capa_id: investigated ? companyId + "-capa-" + (i + 1) : null,
      officer_remarks: investigated ? "Root cause verified. CAPA closed after effectiveness check." : "",
      timeline: [
        { date: date, event: "Reported", note: "Near miss reported via mobile app", actor: rnd(NAMES) },
        ...(phase >= 1
          ? [{ date: rndDate(2026, 1, 2026, 8), event: "Accepted", note: "Accepted for investigation by safety officer", actor: investigator }]
          : []),
        ...(phase === 2 || phase === 3
          ? [{ date: rndDate(2026, 2, 2026, 8), event: "RCA completed", note: "Root cause analysis completed — 5 why", actor: investigator }]
          : []),
        ...(haveReports
          ? [
              { date: rndDate(2026, 3, 2026, 8), event: "Approved & closed", note: "Safety officer approved; report generated (PDF + DOCX)", actor: "Karthik Selvam" },
              { date: rndDate(2026, 3, 2026, 8), event: "Report generated", note: "Near Miss Investigation Report saved to CSMS Documents", actor: "System" },
            ]
          : []),
        ...(phase === 4
          ? [{ date: rndDate(2026, 2, 2026, 8), event: "Rejected", note: "No safety exposure — duplicate observation", actor: "Karthik Selvam" }]
          : []),
      ],
    });
  }
  return rows;
}
db.nearMisses = [
  ...makeNearMisses("emveess", 12, 0),
  ...makeNearMisses("revathi", 6, 12),
  ...makeNearMisses("abc", 3, 18),
];

// ─────────────────────────────────────────────────────────────
// Hazards
// ─────────────────────────────────────────────────────────────
const HAZARD_TYPES = ["Chemical", "Electrical", "Mechanical", "Physical", "Ergonomic", "Fire", "Biological"];
const RISK: Hazard["risk_level"][] = ["Low", "Medium", "High", "Extreme"];

function makeHazards(companyId: string, count: number, seedOffset: number): Hazard[] {
  const rows: Hazard[] = [];
  const locs = LOCATIONS[companyId];
  for (let i = 0; i < count; i++) {
    const type = HAZARD_TYPES[(i + seedOffset) % HAZARD_TYPES.length];
    const mitigated = Math.random() < 0.5;
    rows.push({
      id: companyId + "-hz-" + (i + 1),
      company_id: companyId,
      hazard_code: "HZ-2026-" + String(seedOffset + i + 1).padStart(4, "0"),
      location: rnd(locs),
      risk_level: RISK[Math.min(3, Math.floor(Math.random() * 4.3))],
      hazard_type: type,
      description: `Potential ${type.toLowerCase()} hazard identified during routine inspection — controls found inadequate for the current task risk.`,
      photos: Math.random() < 0.6 ? ["p1"] : [],
      assigned_officer: rnd(["Karthik Selvam", "Mahesh Rao", "Deepa Nair"]),
      corrective_action: mitigated ? "Engineering control installed; area re-inspected and cleared." : "",
      status: mitigated ? (Math.random() < 0.5 ? "Closed" : "Mitigated") : Math.random() < 0.5 ? "Open" : "In Progress",
      reported_by: rnd(NAMES),
      reported_on: rndDate(2026, 1, 2026, 8),
      history: [
        { date: rndDate(2026, 1, 2026, 8), from: "—", to: "Open", note: "Hazard reported", actor: rnd(NAMES) },
        ...(mitigated
          ? [
              { date: rndDate(2026, 2, 2026, 8), from: "Open", to: "In Progress", note: "Corrective action initiated", actor: "Karthik Selvam" },
              { date: rndDate(2026, 3, 2026, 8), from: "In Progress", to: "Mitigated", note: "Controls verified effective", actor: "Karthik Selvam" },
            ]
          : []),
      ],
    });
  }
  return rows;
}
db.hazards = [
  ...makeHazards("emveess", 8, 0),
  ...makeHazards("revathi", 4, 8),
  ...makeHazards("abc", 2, 12),
];

// ─────────────────────────────────────────────────────────────
// Incidents (with investigation data)
// ─────────────────────────────────────────────────────────────
function makeIncidents(companyId: string, count: number, seedOffset: number): Incident[] {
  const rows: Incident[] = [];
  const locs = LOCATIONS[companyId];
  const types: Incident["type"][] = ["First Aid", "MTC", "Property Damage", "Fire", "Spill", "LTI", "Road"];
  for (let i = 0; i < count; i++) {
    const type = types[(i + seedOffset) % types.length];
    const date = rndDate(2026, 1, 2026, 8);
    const investigating = Math.random() < 0.45;
    rows.push({
      id: companyId + "-inc-" + (i + 1),
      company_id: companyId,
      incident_number: "INC-2026-" + String(seedOffset + i + 1).padStart(4, "0"),
      date,
      time: String(6 + Math.floor(Math.random() * 16)).padStart(2, "0") + ":" + String(Math.floor(Math.random() * 60)).padStart(2, "0"),
      location: rnd(locs),
      department: rnd(DEPTS),
      type,
      severity: type === "LTI" ? "Critical" : type === "First Aid" ? "Low" : rnd(["Medium", "High"]),
      description: `${type} incident occurred during shift operations. Victim/site secured immediately, first aid administered and emergency response team mobilised.`,
      reported_by: rnd(["Shift Incharge", "Supervisor", "Safety Steward"]),
      injured_person: type === "LTI" || type === "MTC" || type === "First Aid" ? rnd(NAMES) : null,
      injury_type: type === "LTI" || type === "MTC" || type === "First Aid" ? rnd(["Fracture — hand", "Laceration — forearm", "Burn — minor", "Sprain — ankle", "Crush injury — finger"]) : null,
      lost_days: type === "LTI" ? 14 + Math.floor(Math.random() * 30) : type === "MTC" ? 2 + Math.floor(Math.random() * 5) : 0,
      status: investigating ? "Under Investigation" : Math.random() < 0.5 ? "Investigation Done" : "Closed",
      investigation: {
        investigator: "Karthik Selvam (Safety Officer)",
        started: date,
        summary: investigating ? "Investigation ongoing — statements collected, area inspected, evidence preserved." : "Investigation completed. Root causes identified and CAPA actions tracked to closure.",
        immediate_causes: ["Bypassing of standard operating procedure", "Inadequate supervision at the time of task"],
        five_whys: [
          { why: "Why 1 — Why did the incident happen?", answer: "Employee was exposed to an unguarded moving part while clearing a jam." },
          { why: "Why 2 — Why was the guard open?", answer: "The interlock switch was found manually bypassed to speed up production." },
          { why: "Why 3 — Why was bypassing tolerated?", answer: "Supervisors were under pressure to meet shift targets and did not intervene." },
          { why: "Why 4 — Why was there no check?", answer: "No pre-shift verification of machine interlocks was defined in the SOP." },
          { why: "Why 5 — Why did the SOP miss it?", answer: "SOP was last reviewed 3 years ago and hazard review did not cover interlocks." },
        ],
        fishbone: [
          { category: "Man", causes: ["Operator shortcut behaviour", "Fatigue — extended shift"] },
          { category: "Machine", causes: ["Interlock bypassed", "Guard not interlocked with drive"] },
          { category: "Method", causes: ["SOP outdated", "No pre-shift interlock check"] },
          { category: "Material", causes: ["Jam-prone raw material batch"] },
          { category: "Measurement", causes: ["No audit of interlocks in PM plan"] },
          { category: "Environment", causes: ["Poor lighting near machine", "Congested work area"] },
        ],
        corrective_actions: [
          { action: "Restore and re-interlock all machine guards", owner: "Maintenance", due: "2026-08-30", status: "Done" },
          { action: "Counsel all operators on bypass prohibition", owner: "HR", due: "2026-08-20", status: "Done" },
        ],
        preventive_actions: [
          { action: "Add interlock verification to daily pre-shift checklist", owner: "Production", due: "2026-09-15", status: "In Progress" },
          { action: "Review machine SOPs with HIRA every 2 years", owner: "EHS", due: "2026-10-01", status: "Open" },
        ],
        evidence: [
          { label: "Incident Photos", type: "photo" },
          { label: "Witness Statements", type: "doc" },
          { label: "CCTV Footage", type: "video" },
        ],
      },
      timeline: [
        { date, event: "Incident Reported", note: "Reported by shift incharge via app", actor: "Shift Incharge" },
        { date, event: "Area Secured", note: "Emergency response team mobilised", actor: "ERT" },
        ...(investigating ? [] : [
          { date: rndDate(2026, 2, 2026, 8), event: "Investigation Started", note: "Statements & evidence collected", actor: "Karthik Selvam" },
          { date: rndDate(2026, 3, 2026, 8), event: "Root Cause Published", note: "5-Why & fishbone analysis completed", actor: "Karthik Selvam" },
        ]),
      ],
    });
  }
  return rows;
}
db.incidents = [
  ...makeIncidents("emveess", 6, 0),
  ...makeIncidents("revathi", 3, 6),
  ...makeIncidents("abc", 1, 9),
];

// ─────────────────────────────────────────────────────────────
// Grievances
// ─────────────────────────────────────────────────────────────
function makeGrievances(companyId: string, count: number, seedOffset: number): Grievance[] {
  const rows: Grievance[] = [];
  const cats = ["Workplace Safety", "Welfare Facilities", "PPE Quality", "Work Hours", "Other"];
  for (let i = 0; i < count; i++) {
    const filed = rndDate(2026, 3, 2026, 8);
    const resolved = Math.random() < 0.5;
    rows.push({
      id: companyId + "-grv-" + (i + 1),
      company_id: companyId,
      grievance_number: "GRV-2026-" + String(seedOffset + i + 1).padStart(4, "0"),
      employee_name: rnd(NAMES),
      department: rnd(DEPTS),
      category: cats[(i + seedOffset) % cats.length],
      subject: `Request to improve ${cats[(i + seedOffset) % cats.length].toLowerCase()} at work location`,
      description: "Submitted through the SafetyOS app with supporting details. Employee requests review and corrective action.",
      status: resolved ? (Math.random() < 0.4 ? "Closed" : "Resolved") : Math.random() < 0.5 ? "Open" : Math.random() < 0.5 ? "Acknowledged" : "In Action",
      officer_name: "Anitha Kumar",
      action_taken: resolved ? "Reviewed with department head. Corrective measures implemented and communicated to the employee." : "",
      employee_ack: resolved ? Math.random() < 0.8 : false,
      filed_on: filed,
      resolved_on: resolved ? rndDate(2026, 4, 2026, 8) : null,
      anonymous: Math.random() < 0.15,
    });
  }
  return rows;
}
db.grievances = [
  ...makeGrievances("emveess", 6, 0),
  ...makeGrievances("revathi", 3, 6),
  ...makeGrievances("abc", 2, 9),
];

// ─────────────────────────────────────────────────────────────
// Training
// ─────────────────────────────────────────────────────────────
const PROGRAMS: [string, string, number, number][] = [
  ["Fire Safety & Evacuation", "Emergency Response", 4, 12],
  ["Working at Height", "Technical Safety", 8, 24],
  ["Electrical Safety & LOTO", "Technical Safety", 6, 24],
  ["Basic First Aid & CPR", "Medical", 4, 24],
  ["Chemical Handling & MSDS", "Technical Safety", 4, 12],
  ["Confined Space Entry", "Technical Safety", 8, 24],
  ["Defensive Driving", "Transport Safety", 6, 12],
  ["PPE Awareness & Usage", "Awareness", 2, 12],
];

db.trainingPrograms = PROGRAMS.map((p, i) => ({
  id: "prg-" + (i + 1),
  company_id: "emveess",
  title: p[0],
  category: p[1],
  trainer: rnd(["Karthik Selvam", "External — NIST Institute", "Deepa Nair", "Fire Dept Trainer"]),
  duration_hours: p[2],
  validity_months: p[3],
  description: `Classroom + practical session covering ${p[0]} as per company HSE training matrix and legal requirements.`,
}));

function makeSessions(companyId: string, count: number, seedOffset: number): TrainingSession[] {
  const rows: TrainingSession[] = [];
  for (let i = 0; i < count; i++) {
    const program = PROGRAMS[(i + seedOffset) % PROGRAMS.length][0];
    const past = i % 3 !== 0;
    const date = past ? rndDate(2026, 1, 2026, 7) : rndDate(2026, 8, 2026, 9);
    const nominees = Array.from({ length: 6 }, (_, n) => ({
      name: NAMES[(n + seedOffset + i) % NAMES.length],
      status: (past ? (Math.random() < 0.85 ? "Attended" : "Absent") : "Nominated") as any,
      pre: past ? 45 + Math.floor(Math.random() * 30) : 0,
      post: past ? 70 + Math.floor(Math.random() * 25) : 0,
      certificate: past && Math.random() < 0.8 ? "CERT-" + (seedOffset + i + 1) + "-" + (n + 1) : null,
    }));
    const attended = nominees.filter((n) => n.status === "Attended").length;
    rows.push({
      id: companyId + "-trn-" + (i + 1),
      company_id: companyId,
      program,
      date,
      time: "10:00",
      venue: rnd(["Training Hall A", "Conference Room", "Shopfloor Classroom"]),
      trainer: rnd(["Karthik Selvam", "External — NIST Institute", "Deepa Nair"]),
      status: past ? "Completed" : "Scheduled",
      attendees: attended,
      capacity: 15,
      pre_avg: past ? Math.round(nominees.reduce((s, n) => s + n.pre, 0) / Math.max(1, attended)) : 0,
      post_avg: past ? Math.round(nominees.reduce((s, n) => s + n.post, 0) / Math.max(1, attended)) : 0,
      nominees,
    });
  }
  return rows;
}
db.trainingSessions = [
  ...makeSessions("emveess", 7, 0),
  ...makeSessions("revathi", 3, 7),
  ...makeSessions("abc", 2, 10),
];

// ─────────────────────────────────────────────────────────────
// PPE
// ─────────────────────────────────────────────────────────────
db.ppeStock = [
  { id: "stk-1", company_id: "emveess", item: "Safety Helmet (IS 2925)", quantity: 86, reorder_level: 25, cost_per_unit: 420, vendor: "Udyogi Safety", status: "In Stock" },
  { id: "stk-2", company_id: "emveess", item: "Safety Shoes (IS 15298)", quantity: 54, reorder_level: 20, cost_per_unit: 1250, vendor: "Bata Industrials", status: "In Stock" },
  { id: "stk-3", company_id: "emveess", item: "Safety Goggles", quantity: 18, reorder_level: 20, cost_per_unit: 180, vendor: "3M", status: "Low Stock" },
  { id: "stk-4", company_id: "emveess", item: "Leather Hand Gloves", quantity: 210, reorder_level: 60, cost_per_unit: 95, vendor: "Karam Safety", status: "In Stock" },
  { id: "stk-5", company_id: "emveess", item: "Ear Plugs (box)", quantity: 12, reorder_level: 15, cost_per_unit: 350, vendor: "3M", status: "Low Stock" },
  { id: "stk-6", company_id: "emveess", item: "Full Body Harness", quantity: 0, reorder_level: 8, cost_per_unit: 3200, vendor: "Karam Safety", status: "Out of Stock" },
  { id: "stk-7", company_id: "emveess", item: "Respirator N95", quantity: 140, reorder_level: 50, cost_per_unit: 65, vendor: "3M", status: "In Stock" },
  { id: "stk-8", company_id: "emveess", item: "High-Vis Vest", quantity: 75, reorder_level: 25, cost_per_unit: 150, vendor: "Udyogi Safety", status: "In Stock" },
  { id: "stk-9", company_id: "revathi", item: "Safety Helmet (IS 2925)", quantity: 44, reorder_level: 15, cost_per_unit: 430, vendor: "Udyogi Safety", status: "In Stock" },
  { id: "stk-10", company_id: "revathi", item: "Heat-Resistant Suit", quantity: 6, reorder_level: 10, cost_per_unit: 5800, vendor: "Karam Safety", status: "Low Stock" },
  { id: "stk-11", company_id: "abc", item: "High-Vis Vest", quantity: 60, reorder_level: 20, cost_per_unit: 155, vendor: "Udyogi Safety", status: "In Stock" },
  { id: "stk-12", company_id: "abc", item: "Safety Shoes", quantity: 14, reorder_level: 15, cost_per_unit: 1290, vendor: "Bata Industrials", status: "Low Stock" },
];

function makePPEIssues(companyId: string, count: number, seedOffset: number): PPEIssue[] {
  const rows: PPEIssue[] = [];
  const items = ["Safety Helmet", "Safety Shoes", "Safety Goggles", "Leather Hand Gloves", "Full Body Harness", "High-Vis Vest", "Respirator N95"];
  for (let i = 0; i < count; i++) {
    const issueDate = rndDate(2025, 6, 2026, 5);
    rows.push({
      id: companyId + "-ppe-" + (i + 1),
      company_id: companyId,
      employee_name: NAMES[(i + seedOffset) % NAMES.length],
      department: rnd(DEPTS),
      item: items[(i + seedOffset) % items.length],
      issue_date: issueDate,
      expiry_date: rndDate(2026, 9, 2028, 6),
      status: Math.random() < 0.7 ? "Issued" : rnd(["Returned", "Replaced", "Expired"] as any),
      cost: rnd([420, 1250, 180, 95, 3200, 150, 65]),
      vendor: rnd(["Udyogi Safety", "Karam Safety", "3M", "Bata Industrials"]),
      last_inspection: Math.random() < 0.6 ? rndDate(2026, 3, 2026, 8) : null,
      condition: rnd(["Good", "Fair", "Needs Replacement"]),
    });
  }
  return rows;
}
db.ppeIssues = [
  ...makePPEIssues("emveess", 14, 0),
  ...makePPEIssues("revathi", 6, 14),
  ...makePPEIssues("abc", 3, 20),
];

// ─────────────────────────────────────────────────────────────
// Vehicle & Tool Inspections
// ─────────────────────────────────────────────────────────────
const VEHICLES: [string, string][] = [
  ["TN-05-AB-1234", "Forklift"], ["TN-05-CD-5678", "Hydra Crane"], ["TN-09-EF-9012", "Truck"], ["TN-05-GH-3456", "Forklift"], ["TN-11-JK-7890", "Tanker"], ["MH-12-QR-4321", "Truck"], ["AP-31-XY-1122", "Forklift"],
];
const V_CHECKLIST = ["Brakes & steering", "Horn & reverse alarm", "Lights & indicators", "Tyres condition", "Hydraulic leaks", "Fire extinguisher", "Seat belt / ROP", "Battery & cables", "Mirrors & visibility", "Load chart present"];

function makeVehicleInspections(companyId: string, count: number, seedOffset: number): VehicleInspection[] {
  const rows: VehicleInspection[] = [];
  for (let i = 0; i < count; i++) {
    const [num, type] = VEHICLES[(i + seedOffset) % VEHICLES.length];
    const checklist = V_CHECKLIST.map((item, n) => ({
      item,
      ok: Math.random() > 0.12,
      remark: Math.random() > 0.12 ? "" : rnd(["Adjusted during inspection", "Service booked", "Needs replacement"]),
    }));
    const defects = checklist.filter((c) => !c.ok).map((c) => c.item);
    const approved = Math.random() < 0.75;
    rows.push({
      id: companyId + "-veh-" + (i + 1),
      company_id: companyId,
      vehicle_number: num,
      vehicle_type: type,
      date: rndDate(2026, 6, 2026, 8),
      driver: rnd(NAMES),
      checklist,
      defects,
      photos: Math.random() < 0.5 ? ["p1"] : [],
      inspected_by: rnd(["Mahesh Rao", "Deepa Nair"]),
      approved_by: approved ? "Karthik Selvam" : null,
      status: approved ? "Approved" : "Pending Approval",
      remarks: defects.length ? defects.length + " defect(s) found — follow-up required." : "Vehicle found fit for operation.",
    });
  }
  return rows;
}
db.vehicleInspections = [
  ...makeVehicleInspections("emveess", 9, 0),
  ...makeVehicleInspections("revathi", 4, 9),
  ...makeVehicleInspections("abc", 3, 13),
];

const TOOLS: [string, string][] = [
  ["Pedestal Grinder", "Power Tool"], ["Chain Pulley Block 2T", "Lifting Tackle"], ["Welding Machine", "Power Tool"], ["Extension Ladder 20ft", "Access Equipment"], ["Hydraulic Jack 10T", "Lifting Tackle"], ["Hand Grinder", "Power Tool"],
];
const T_CHECKLIST = ["Guarding intact", "Power cable condition", "Earthing / insulation", "Moving parts smooth", "Test certificate valid", "Storage condition", "Marking / tagging present"];

function makeToolInspections(companyId: string, count: number, seedOffset: number): ToolInspection[] {
  const rows: ToolInspection[] = [];
  for (let i = 0; i < count; i++) {
    const [name, cat] = TOOLS[(i + seedOffset) % TOOLS.length];
    const checklist = T_CHECKLIST.map((item) => ({
      item,
      ok: Math.random() > 0.15,
      remark: Math.random() > 0.15 ? "" : rnd(["Repair initiated", "Quarantined", "Tagged out"]),
    }));
    const okCount = checklist.filter((c) => c.ok).length;
    rows.push({
      id: companyId + "-tol-" + (i + 1),
      company_id: companyId,
      tool_name: name,
      tool_code: "TL-" + (seedOffset + i + 1) + "-" + companyId.slice(0, 3).toUpperCase(),
      category: cat,
      date: rndDate(2026, 5, 2026, 8),
      checklist,
      photos: Math.random() < 0.4 ? ["p1"] : [],
      status: okCount === T_CHECKLIST.length ? "Pass" : okCount >= 5 ? "Repair" : "Fail",
      remarks: okCount === T_CHECKLIST.length ? "Fit for use." : "Defects noted — tool quarantined.",
      inspector: rnd(["Mahesh Rao", "Deepa Nair"]),
    });
  }
  return rows;
}
db.toolInspections = [
  ...makeToolInspections("emveess", 8, 0),
  ...makeToolInspections("revathi", 4, 8),
  ...makeToolInspections("abc", 2, 12),
];

// ─────────────────────────────────────────────────────────────
// Audits
// ─────────────────────────────────────────────────────────────
function makeAudits(companyId: string, count: number, seedOffset: number): Audit[] {
  const rows: Audit[] = [];
  const types: Audit["audit_type"][] = ["ISO 45001", "5S", "CSMS", "Internal", "Customer"];
  const scopes: Record<string, string> = {
    "ISO 45001": "OHS management system — surveillance audit of all processes",
    "5S": "Workplace organisation across production & warehouse areas",
    CSMS: "Contractor safety management — permit systems & work practices",
    Internal: "Cross-department internal safety audit",
    Customer: "Customer-mandated safety assessment of facility",
  };
  for (let i = 0; i < count; i++) {
    const type = types[(i + seedOffset) % types.length];
    const from = rndDate(2026, 2, 2026, 8);
    const done = Math.random() < 0.7;
    const score = 62 + Math.floor(Math.random() * 33);
    rows.push({
      id: companyId + "-aud-" + (i + 1),
      company_id: companyId,
      audit_number: "AUD-2026-" + String(seedOffset + i + 1).padStart(3, "0"),
      audit_type: type,
      scope: scopes[type],
      auditor: rnd(["Karthik Selvam", "External — TUV Auditor", "Deepa Nair", "Client EHS Team"]),
      date_from: from,
      date_to: rndDate(2026, 2, 2026, 8),
      score,
      compliance: score,
      status: done ? (Math.random() < 0.6 ? "Closed" : "Completed") : Math.random() < 0.5 ? "Planned" : "In Progress",
      findings: Array.from({ length: 2 + Math.floor(Math.random() * 3) }, (_, n) => ({
        id: companyId + "-aud-" + (i + 1) + "-f" + n,
        type: (n % 3 === 0 ? "NC" : n % 3 === 1 ? "OFI" : "Observation") as any,
        description: rnd([
          "Emergency exit route partially blocked by stored material",
          "Permit-to-work not displayed at hot work location",
          "MSDS binder not updated for new chemicals",
          "Forklift daily checklist not consistently filled",
          "Housekeeping below standard in scrap yard",
        ]),
        clause: "ISO 45001:2018 §" + (6 + n) + ".1." + (n + 1),
        severity: rnd(["Minor", "Major", "Critical"]),
        capa_id: done ? companyId + "-capa-" + (n + 2) : null,
        status: done ? (Math.random() < 0.6 ? "Closed" : "In Progress") : "Open",
      })),
      evidence: [{ label: "Audit Report", type: "doc" }, { label: "Opening Meeting MOM", type: "doc" }],
    });
  }
  return rows;
}
db.audits = [
  ...makeAudits("emveess", 5, 0),
  ...makeAudits("revathi", 3, 5),
  ...makeAudits("abc", 1, 8),
];

// ─────────────────────────────────────────────────────────────
// Documents
// ─────────────────────────────────────────────────────────────
const DOCS: [string, DocItem["category"], string, string][] = [
  ["Lockout Tagout (LOTO) Procedure", "SOP", "v3.1", "EHS"],
  ["Permit to Work System", "SOP", "v2.4", "EHS"],
  ["Hot Work Permit Procedure", "SOP", "v1.8", "EHS"],
  ["Working at Height Procedure", "SOP", "v2.0", "EHS"],
  ["JSA — Confined Space Entry", "JSA", "v1.2", "Maintenance"],
  ["JSA — Crane Lifting Operations", "JSA", "v1.1", "Maintenance"],
  ["HIRA — Rolling Mill Area", "HIRA", "v2.2", "EHS"],
  ["HIRA — Warehouse & Logistics", "HIRA", "v1.5", "EHS"],
  ["MSDS — Acetone", "MSDS", "v3.0", "Stores"],
  ["MSDS — Sulphuric Acid 98%", "MSDS", "v2.6", "Stores"],
  ["Drug & Alcohol Policy", "Policy", "v1.0", "HR"],
  ["Integrated HSE Policy", "Policy", "v4.2", "Top Management"],
  ["Safety Manual — Employee Handbook", "Manual", "v5.0", "EHS"],
  ["Emergency Response Manual", "Manual", "v3.2", "EHS"],
  ["Induction Training Module", "Training Material", "v2.1", "HR"],
  ["Toolbox Talk Library — 2026", "Training Material", "v1.0", "EHS"],
];

db.documents = DOCS.map((d, i) => ({
  id: "doc-" + (i + 1),
  company_id: ["emveess", "emveess", "emveess", "emveess", "emveess", "revathi", "emveess", "abc", "emveess", "revathi", "emveess", "abc", "emveess", "emveess", "abc", "emveess"][i],
  title: d[0],
  category: d[1],
  description: `${d[1]} document — ${d[0]}. Controlled copy. Refer to master list for latest revision.`,
  version: d[2],
  issued: rndDate(2024, 1, 2026, 6),
  review_due: rndDate(2026, 9, 2028, 6),
  owner: d[3],
  downloads: Math.floor(Math.random() * 240),
  size: (0.4 + Math.random() * 4).toFixed(1) + " MB",
}));

// ─────────────────────────────────────────────────────────────
// CAPAs
// ─────────────────────────────────────────────────────────────
db.capas = [
  { id: "emveess-capa-1", company_id: "emveess", capa_number: "CAPA-2026-001", source_type: "Near Miss", source_id: "emveess-nm-1", description: "Prevent recurrence of falling object near miss at Warehouse A", owner: "Karthik Selvam", due_date: "2026-08-28", status: "Closed", actions: [{ action: "Install overhead mesh guards", done: true }, { action: "Retrain stacking team", done: true }] },
  { id: "emveess-capa-2", company_id: "emveess", capa_number: "CAPA-2026-002", source_type: "Audit", source_id: "emveess-aud-1", description: "Clear emergency exit blockage & reinforce housekeeping standard", owner: "Mahesh Rao", due_date: "2026-08-22", status: "In Progress", actions: [{ action: "Clear exit route", done: true }, { action: "Daily housekeeping audit", done: false }] },
  { id: "emveess-capa-3", company_id: "emveess", capa_number: "CAPA-2026-003", source_type: "Incident", source_id: "emveess-inc-1", description: "Eliminate interlock bypassing on assembly line machines", owner: "Deepa Nair", due_date: "2026-09-10", status: "Open", actions: [{ action: "Re-interlock all guards", done: true }, { action: "Pre-shift interlock check", done: false }, { action: "SOP revision", done: false }] },
  { id: "emveess-capa-4", company_id: "emveess", capa_number: "CAPA-2026-004", source_type: "Hazard", source_id: "emveess-hz-2", description: "Chemical storage segregation as per MSDS compatibility", owner: "Karthik Selvam", due_date: "2026-08-18", status: "In Progress", actions: [{ action: "Segregate incompatible chemicals", done: true }, { action: "Update storage plan", done: false }] },
  { id: "revathi-capa-1", company_id: "revathi", capa_number: "CAPA-2026-011", source_type: "Incident", source_id: "revathi-inc-1", description: "Heat stress controls in melt shop", owner: "Safety Officer — Revathi", due_date: "2026-08-30", status: "Open", actions: [{ action: "Additional cooling stations", done: false }] },
];

// ─────────────────────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────────────────────
const NOTIF_TEMPLATES: [string, string, string, string][] = [
  ["Near miss reported", "NM-2026-0042 has been reported at Assembly Line 2 — awaiting review.", "browser", "/near-misses"],
  ["CAPA due soon", "CAPA-2026-002 is due on 22 Aug 2026. Please update status.", "email", "/near-misses"],
  ["PPE stock low", "Ear Plugs stock has fallen below reorder level (12 of 15).", "sms", "/ppe"],
  ["Training scheduled", "Confined Space Entry training on 24 Aug, Training Hall A.", "email", "/training"],
  ["Vehicle defect", "Forklift TN-05-AB-1234 reported with brake defect — pending approval.", "browser", "/vehicle-inspections"],
  ["Audit completed", "Internal Audit AUD-2026-003 completed. Score: 78%. 3 findings raised.", "email", "/audits"],
  ["Grievance acknowledged", "Your grievance GRV-2026-0008 has been acknowledged by the officer.", "browser", "/grievances"],
  ["Hazard mitigated", "Hazard HZ-2026-0012 at Paint Shop has been mitigated and verified.", "sms", "/hazards"],
];

db.notifications = NOTIF_TEMPLATES.map((t, i) => ({
  id: "ntf-" + (i + 1),
  company_id: "emveess",
  user: i % 5 === 0 ? "employee" : "all",
  title: t[0],
  body: t[1],
  type: t[2] as any,
  read: i > 4,
  created: new Date(Date.now() - (i + 1) * 1000 * 60 * 60 * 7).toISOString(),
  link: t[3],
}));

// ─────────────────────────────────────────────────────────────
// Activity logs
// ─────────────────────────────────────────────────────────────
const LOG_ACTIONS: [string, string, string][] = [
  ["Created", "Near Miss", "NM-2026-0042"],
  ["Updated", "Hazard", "HZ-2026-0012"],
  ["Approved", "Vehicle Inspection", "TN-05-AB-1234"],
  ["Closed", "CAPA", "CAPA-2026-001"],
  ["Exported", "Report", "Near Miss Monthly"],
  ["Issued", "PPE", "Safety Helmet × 12"],
  ["Scheduled", "Training", "Confined Space Entry"],
  ["Completed", "Audit", "AUD-2026-003"],
  ["Resolved", "Grievance", "GRV-2026-0008"],
  ["Logged in", "Session", "Web"],
];

db.activityLogs = Array.from({ length: 22 }, (_, i) => {
  const a = LOG_ACTIONS[i % LOG_ACTIONS.length];
  return {
    id: "log-" + (i + 1),
    company_id: "emveess",
    user: rnd(["Karthik Selvam", "Anitha Kumar", "Mahesh Rao", "Deepa Nair", "Rajesh Iyer"]),
    role: rnd(["safety_officer", "company_admin", "supervisor", "safety_officer", "super_admin"]),
    action: a[0],
    entity: a[1],
    entity_id: a[2],
    details: `${a[0]} ${a[1]} ${a[2]}`,
    created: new Date(Date.now() - (i + 1) * 1000 * 60 * 60 * 11).toISOString(),
  };
});

// ─────────────────────────────────────────────────────────────
// Role permissions (editable in Admin → Roles)
// ─────────────────────────────────────────────────────────────
import { DEFAULT_PERMISSIONS } from "./roles";
db.rolePermissions = { ...DEFAULT_PERMISSIONS };

// ─────────────────────────────────────────────────────────────
// Live-mode ID → name lookups (populated by lib/sync.ts when
// connected to Supabase; maps DB foreign keys to display names)
// ─────────────────────────────────────────────────────────────
export const liveLookups = {
  profiles: new Map<string, string>(),
  employees: new Map<string, string>(),
  locations: new Map<string, string>(),
  departments: new Map<string, string>(),
  programs: new Map<string, string>(),
  ppe: new Map<string, string>(),
  contractors: new Map<string, string>(),
  vendors: new Map<string, string>(),
};

// ─────────────────────────────────────────────────────────────
// Cross-tenant KPI helpers
// ─────────────────────────────────────────────────────────────
export const forCompany = <T extends { company_id: string }>(rows: T[], companyId: string) =>
  rows.filter((r) => r.company_id === companyId);

export function tenantStats(companyId: string) {
  const emps = forCompany(db.employees, companyId).filter((e) => e.status === "active");
  const nm = forCompany(db.nearMisses, companyId);
  const hz = forCompany(db.hazards, companyId);
  const inc = forCompany(db.incidents, companyId);
  const openCapa = forCompany(db.capas, companyId).filter((c) => c.status !== "Closed");
  const pending = [
    ...nm.filter((n) => !["CLOSED", "Closed", "Verified", "REJECTED"].includes(n.status)),
    ...hz.filter((h) => h.status !== "Closed" && h.status !== "Mitigated"),
    ...inc.filter((i) => i.status !== "Closed"),
  ];
  const safeManHours = emps.length * 8 * 24; // employees × 8h × 24 workdays
  const lastLti = Math.max(
    0,
    ...inc.filter((i) => i.type === "LTI").map((i) => new Date(i.date).getTime())
  );
  const ltiFreeDays = lastLti ? Math.floor((Date.now() - lastLti) / 86400000) : 365;
  return {
    employees: emps.length,
    nearMisses: nm.length,
    hazards: hz.length,
    incidents: inc.length,
    trainings: forCompany(db.trainingSessions, companyId).length,
    audits: forCompany(db.audits, companyId).length,
    safeManHours,
    ltiFreeDays,
    openCapa: openCapa.length,
    pendingActions: pending.length,
    criticalHazards: hz.filter((h) => h.risk_level === "Extreme" || h.risk_level === "High").length,
  };
}
