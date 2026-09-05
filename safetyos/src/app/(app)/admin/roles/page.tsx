"use client";

// ─────────────────────────────────────────────────────────────
// SafetyOS — Admin: Roles & Permissions matrix
// ─────────────────────────────────────────────────────────────
import React, { useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/store";
import { EDITABLE_ROLES, PERMISSIONS, ROLE_LABELS, ROLE_DESCRIPTIONS } from "@/lib/roles";
import { Badge, Button, Card, PageHeader, Toast, Toggle } from "@/components/ui";
import { logActivity } from "@/lib/api";
import type { Role } from "@/lib/types";

export default function RolesPage() {
  const { user, company } = useAuth();
  const [perms, setPerms] = useState<Record<string, string[]>>({ ...db.rolePermissions });
  const [toast, setToast] = useState<string | null>(null);

  const modules = useMemo(() => {
    const map: Record<string, typeof PERMISSIONS> = {};
    PERMISSIONS.forEach((p) => {
      (map[p.module] ??= []).push(p);
    });
    return map;
  }, []);

  const has = (role: string, key: string) => (perms[role] ?? []).includes(key);

  const toggle = (role: string, key: string) => {
    const next = { ...perms };
    const set = new Set(next[role] ?? []);
    if (set.has(key)) set.delete(key);
    else set.add(key);
    next[role] = Array.from(set);
    setPerms(next);
  };

  const save = () => {
    db.rolePermissions = perms;
    logActivity(company!.id, user!.name, user!.role, "Updated", "Roles & Permissions", "matrix");
    setToast("Permissions saved ✓");
    setTimeout(() => setToast(null), 2200);
  };

  return (
    <div>
      <Toast msg={toast} />
      <PageHeader
        title="Roles & Permissions"
        subtitle="Fine-grained permission matrix — changes apply instantly"
        actions={<Button size="sm" onClick={save}><ShieldCheck className="h-3.5 w-3.5" /> Save permissions</Button>}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {EDITABLE_ROLES.map((r) => (
          <Card key={r} className="!p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-ink-800 dark:text-ink-100">{ROLE_LABELS[r]}</p>
              <Badge tone="blue">{perms[r]?.length ?? 0} perms</Badge>
            </div>
            <p className="mt-1 text-[10px] leading-snug text-ink-400">{ROLE_DESCRIPTIONS[r]}</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-bold text-ink-800 dark:text-ink-100">Permission matrix</p>
          <Badge tone="violet">Super Admin is locked (full access)</Badge>
        </div>
        <div className="space-y-5">
          {Object.entries(modules).map(([mod, permsList]) => (
            <div key={mod}>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-ink-400">{mod}</p>
              <div className="overflow-x-auto rounded-xl ring-1 ring-inset ring-ink-100 dark:ring-ink-800">
                <table className="w-full min-w-[680px] text-left">
                  <thead>
                    <tr className="border-b border-ink-100 bg-ink-50/60 dark:border-ink-800 dark:bg-ink-800/40">
                      <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-ink-400">Permission</th>
                      {EDITABLE_ROLES.map((r) => (
                        <th key={r} className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-widest text-ink-400">{ROLE_LABELS[r]}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {permsList.map((p) => (
                      <tr key={p.key} className="border-b border-ink-50 last:border-0 dark:border-ink-800/50">
                        <td className="px-3 py-2.5 text-xs font-medium text-ink-700 dark:text-ink-200">{p.label}</td>
                        {EDITABLE_ROLES.map((r) => (
                          <td key={r} className="px-3 py-2.5 text-center">
                            <Toggle checked={has(r, p.key)} onChange={() => toggle(r, p.key)} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
