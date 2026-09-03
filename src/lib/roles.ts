import type { Role } from "./types";

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  company_admin: "Company Admin",
  safety_officer: "Safety Officer",
  supervisor: "Supervisor",
  employee: "Employee",
  guest: "Guest",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  super_admin: "Platform owner — all tenants, subscriptions & settings",
  company_admin: "Company-level admin — everything within own tenant",
  safety_officer: "Runs safety programs, CAPAs, audits & investigations",
  supervisor: "Team safety — near misses, hazards, inspections",
  employee: "Reports near misses, hazards & grievances; own training",
  guest: "Read-only access to dashboards & documents",
};

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  roles: Role[] | "all";
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    group: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "dashboard", roles: "all" },
      { href: "/search", label: "Global Search", icon: "search", roles: "all" },
      { href: "/reports", label: "Reports", icon: "filetext", roles: ["super_admin", "company_admin", "safety_officer", "supervisor"] },
      { href: "/notifications", label: "Notifications", icon: "bell", roles: "all" },
    ],
  },
  {
    group: "Safety Modules",
    items: [
      { href: "/near-misses", label: "Near Miss", icon: "alert", roles: "all" },
      { href: "/hazards", label: "Hazard Reporting", icon: "flame", roles: "all" },
      { href: "/incidents", label: "Incident Management", icon: "filewarning", roles: ["super_admin", "company_admin", "safety_officer", "supervisor"] },
      { href: "/audits", label: "Audit", icon: "clipboard", roles: ["super_admin", "company_admin", "safety_officer"] },
    ],
  },
  {
    group: "People",
    items: [
      { href: "/employees", label: "Employee Master", icon: "users", roles: ["super_admin", "company_admin", "safety_officer", "supervisor"] },
      { href: "/grievances", label: "Grievance", icon: "heart", roles: "all" },
      { href: "/training", label: "Training", icon: "gradcap", roles: ["super_admin", "company_admin", "safety_officer", "supervisor"] },
      { href: "/ppe", label: "PPE Management", icon: "hardhat", roles: ["super_admin", "company_admin", "safety_officer", "supervisor"] },
    ],
  },
  {
    group: "Operations",
    items: [
      { href: "/vehicle-inspections", label: "Vehicle Inspection", icon: "truck", roles: ["super_admin", "company_admin", "safety_officer", "supervisor"] },
      { href: "/tool-inspections", label: "Tool Inspection", icon: "wrench", roles: ["super_admin", "company_admin", "safety_officer", "supervisor"] },
      { href: "/documents", label: "Document Library", icon: "folder", roles: "all" },
    ],
  },
  {
    group: "Administration",
    items: [
      { href: "/admin", label: "Admin Dashboard", icon: "shield", roles: ["super_admin", "company_admin"] },
      { href: "/admin/companies", label: "Companies", icon: "building", roles: ["super_admin"] },
      { href: "/admin/subscriptions", label: "Subscriptions", icon: "creditcard", roles: ["super_admin"] },
      { href: "/admin/roles", label: "Roles & Permissions", icon: "shieldcheck", roles: ["super_admin", "company_admin"] },
      { href: "/admin/activity", label: "Activity Logs", icon: "activity", roles: ["super_admin", "company_admin"] },
      { href: "/settings", label: "Settings", icon: "settings", roles: ["super_admin", "company_admin"] },
    ],
  },
];

export function navForRole(role: Role): NavGroup[] {
  return NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => i.roles === "all" || i.roles.includes(role)),
  })).filter((g) => g.items.length > 0);
}

// Fine-grained permission checks used by pages/components
export const PERMISSIONS: { key: string; label: string; module: string }[] = [
  { key: "dashboard.view", label: "View Dashboard", module: "Overview" },
  { key: "employees.view", label: "View Employees", module: "Employee Master" },
  { key: "employees.edit", label: "Create / Edit Employees", module: "Employee Master" },
  { key: "nearmiss.view", label: "View Near Misses", module: "Near Miss" },
  { key: "nearmiss.create", label: "Report Near Miss", module: "Near Miss" },
  { key: "nearmiss.close", label: "Close / Verify Near Miss", module: "Near Miss" },
  { key: "hazard.view", label: "View Hazards", module: "Hazard Reporting" },
  { key: "hazard.create", label: "Report Hazard", module: "Hazard Reporting" },
  { key: "hazard.resolve", label: "Mitigate / Close Hazard", module: "Hazard Reporting" },
  { key: "incident.view", label: "View Incidents", module: "Incident Management" },
  { key: "incident.investigate", label: "Investigate Incidents", module: "Incident Management" },
  { key: "incident.close", label: "Close Incidents", module: "Incident Management" },
  { key: "grievance.view", label: "View Grievances", module: "Grievance" },
  { key: "grievance.create", label: "Submit Grievance", module: "Grievance" },
  { key: "grievance.resolve", label: "Resolve Grievances", module: "Grievance" },
  { key: "training.manage", label: "Manage Trainings", module: "Training" },
  { key: "ppe.manage", label: "Manage PPE", module: "PPE Management" },
  { key: "inspection.manage", label: "Manage Inspections", module: "Vehicle / Tool Inspection" },
  { key: "audit.manage", label: "Manage Audits", module: "Audit" },
  { key: "documents.manage", label: "Manage Documents", module: "Document Library" },
  { key: "reports.view", label: "View Reports", module: "Reports" },
  { key: "admin.access", label: "Admin Panel Access", module: "Administration" },
  { key: "admin.companies", label: "Manage Companies", module: "Administration" },
  { key: "admin.subscriptions", label: "Manage Subscriptions", module: "Administration" },
  { key: "admin.roles", label: "Manage Roles & Permissions", module: "Administration" },
  { key: "admin.logs", label: "View Activity Logs", module: "Administration" },
];

export const DEFAULT_PERMISSIONS: Record<Role, string[]> = {
  super_admin: PERMISSIONS.map((p) => p.key),
  company_admin: PERMISSIONS.map((p) => p.key).filter((k) => !["admin.companies", "admin.subscriptions"].includes(k)),
  safety_officer: [
    "dashboard.view", "employees.view", "nearmiss.view", "nearmiss.create", "nearmiss.close",
    "hazard.view", "hazard.create", "hazard.resolve", "incident.view", "incident.investigate", "incident.close",
    "grievance.view", "grievance.resolve", "training.manage", "ppe.manage", "inspection.manage",
    "audit.manage", "documents.manage", "reports.view",
  ],
  supervisor: [
    "dashboard.view", "employees.view", "nearmiss.view", "nearmiss.create",
    "hazard.view", "hazard.create", "incident.view", "inspection.manage", "training.manage", "reports.view",
  ],
  employee: ["dashboard.view", "nearmiss.create", "nearmiss.view", "hazard.create", "grievance.create", "grievance.view", "documents.manage"],
  guest: ["dashboard.view"],
};

// Roles that CAN be edited by non-super admins (super_admin role itself is locked)
export const EDITABLE_ROLES: Role[] = ["company_admin", "safety_officer", "supervisor", "employee", "guest"];
