"use client";

// ─────────────────────────────────────────────────────────────
// SafetyOS — live tenant sync
// When connected to Supabase, loads the current tenant's data
// (and ID→name lookups) into the shared store so every page
// reads live data through the same db.* references.
// ─────────────────────────────────────────────────────────────
import { getSupabase } from "./supabase";
import { db, liveLookups } from "./store";
import { listEntities, mockSource } from "./api";
import type { Company } from "./types";

let syncing: Record<string, Promise<void> | undefined> = {};

const LOOKUP_TABLES = ["departments", "locations", "contractors", "vendors", "profiles", "employees", "training_programs", "ppe_catalog"] as const;

const LOOKUP_MAP: Record<string, keyof typeof liveLookups> = {
  departments: "departments",
  locations: "locations",
  contractors: "contractors",
  vendors: "vendors",
  profiles: "profiles",
  employees: "employees",
  training_programs: "programs",
  ppe_catalog: "ppe",
};

export function mapCompany(r: any): Company {
  return {
    id: String(r.id),
    name: r.name,
    slug: r.slug,
    industry: r.industry ?? "",
    plan: r.plan ?? "starter",
    employeesLimit: r.employees_limit ?? 100,
    accent: r.brand_color ?? "#2563eb",
    status: r.status ?? "trial",
    city: r.city ?? "",
    since: r.created_at ? String(r.created_at).slice(0, 10) : "",
  };
}

export async function syncTenant(companyId: string): Promise<void> {
  const sb = getSupabase();
  if (!sb || !companyId) return;
  if (syncing[companyId]) return syncing[companyId];  syncing[companyId] = (async () => {
    // 1. Companies (super_admin sees all; others see their own via RLS)
    const { data: comps } = await sb.from("companies").select("*").is("deleted_at", null);
    if (comps && comps.length) db.companies = comps.map(mapCompany);

    // 2. Plans (public read)
    const { data: plansData } = await sb.from("plans").select("*");
    if (plansData && plansData.length) {
      db.plans.length = 0;
      db.plans.push(
        ...plansData.map((p: any) => ({
          id: p.id,
          name: p.name,
          price: p.price == null ? null : Number(p.price),
          priceLabel: p.price == null ? "Custom pricing" : "₹" + Number(p.price).toLocaleString("en-IN") + "/month",
          employees: p.employees_limit ?? "Unlimited",
          features: Array.isArray(p.features) ? p.features : [],
          highlight: p.id === "growth",
        }))
      );
    }

    // 3. ID → name lookups
    await Promise.all(
      LOOKUP_TABLES.map(async (t) => {
        const { data } = await sb.from(t).select("*").is("deleted_at", null);
        const map = liveLookups[LOOKUP_MAP[t]] as Map<string, string>;
        map.clear();
        (data ?? []).forEach((r: any) => {
          if (t === "profiles") map.set(String(r.id), r.full_name ?? r.email);
          else map.set(String(r.id), r.name ?? r.title ?? r.employee_code ?? String(r.id));
        });
      })
    );

    // 3. Module data
    const entities = [
      "employees", "near-misses", "hazards", "incidents", "grievances",
      "training-programs", "training-sessions", "ppe-issues", "ppe-stock",
      "vehicle-inspections", "tool-inspections", "audits", "documents",
      "notifications", "activity-logs", "capas",
    ] as const;

    const results = await Promise.all(
      entities.map((e) => listEntities(e as any, companyId))
    );

    entities.forEach((e, i) => {
      const src = mockSource(e as any) as any[];
      src.length = 0;
      src.push(...results[i]);
    });
  })();

  try {
    await syncing[companyId];
  } finally {
    delete syncing[companyId];
  }
}
