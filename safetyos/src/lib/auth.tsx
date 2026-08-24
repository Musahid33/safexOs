"use client";

// ─────────────────────────────────────────────────────────────
// SafetyOS — auth context (demo accounts + Supabase live mode)
// ─────────────────────────────────────────────────────────────
import React, { createContext, useContext, useEffect, useState } from "react";
import type { AuthUser, Company, Role } from "./types";
import { db } from "./store";
import { getSupabase, isSupabaseMode, profileToAuth, supabaseLogin, supabaseLogout } from "./supabase";
import { logActivity } from "./api";
import { mapCompany, syncTenant } from "./sync";

const DEMO_ACCOUNTS: { email: string; password: string; name: string; role: Role; companyId: string }[] = [
  { email: "superadmin@demo.com", password: "demo1234", name: "Rajesh Iyer", role: "super_admin", companyId: "emveess" },
  { email: "admin@demo.com", password: "demo1234", name: "Anitha Kumar", role: "company_admin", companyId: "emveess" },
  { email: "officer@demo.com", password: "demo1234", name: "Karthik Selvam", role: "safety_officer", companyId: "emveess" },
  { email: "supervisor@demo.com", password: "demo1234", name: "Mahesh Rao", role: "supervisor", companyId: "emveess" },
  { email: "employee@demo.com", password: "demo1234", name: "Suresh Babu", role: "employee", companyId: "emveess" },
  { email: "guest@demo.com", password: "demo1234", name: "Site Visitor", role: "guest", companyId: "emveess" },
];

interface AuthCtx {
  user: AuthUser | null;
  companies: Company[];
  company: Company | null;
  ready: boolean;
  demoMode: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchCompany: (companyId: string) => void;
  switchRole: (role: Role) => void;
}

const Ctx = createContext<AuthCtx>(null as any);
const LS_KEY = "safetyos.session";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Restore session (demo mode)
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  const companies = db.companies;
  const company = companies.find((c) => c.id === user?.companyId) ?? null;

  const login = async (email: string, password: string) => {
    if (isSupabaseMode) {
      const { user: sbUser, profile } = await supabaseLogin(email, password);
      const meta = profileToAuth(profile, sbUser.id);
      const u: AuthUser = {
        id: sbUser.id,
        email,
        name: meta.name,
        role: meta.role,
        companyId: meta.companyId,
        avatarHue: (email.length * 37) % 360,
      };
      // Load company meta + full tenant data before showing the app
      const sb = getSupabase();
      const { data: comp } = await sb!
        .from("companies").select("*").eq("id", meta.companyId).maybeSingle();
      if (comp && !db.companies.some((c) => c.id === comp.id)) db.companies.push(mapCompany(comp));
      await syncTenant(meta.companyId);
      setUser(u);
      return;
    }
    const acc = DEMO_ACCOUNTS.find((a) => a.email === email.toLowerCase().trim()) ?? DEMO_ACCOUNTS[2];
    if (password && password.length < 4) throw new Error("Password must be at least 4 characters");
    const u: AuthUser = {
      id: acc.email,
      name: acc.name,
      email: acc.email,
      role: acc.role,
      companyId: acc.companyId,
      avatarHue: (acc.email.length * 37) % 360,
    };
    setUser(u);
    try { localStorage.setItem(LS_KEY, JSON.stringify(u)); } catch {}
    logActivity(u.companyId, u.name, u.role, "Logged in", "Session", "Web");
  };

  const logout = async () => {
    if (isSupabaseMode) await supabaseLogout();
    setUser(null);
    try { localStorage.removeItem(LS_KEY); } catch {}
  };

  const switchCompany = (companyId: string) => {
    setUser((u) => {
      if (!u) return u;
      const next = { ...u, companyId };
      try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    // In live mode, load the new tenant's data
    if (isSupabaseMode) syncTenant(companyId);
  };

  const switchRole = (role: Role) => {
    setUser((u) => {
      if (!u) return u;
      const next = { ...u, role };
      try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  return (
    <Ctx.Provider value={{ user, companies, company, ready, demoMode: !isSupabaseMode, login, logout, switchCompany, switchRole }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
