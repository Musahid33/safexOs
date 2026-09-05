"use client";

// ─────────────────────────────────────────────────────────────
// SafetyOS — Admin: Activity logs (audit trail)
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useMemo, useState } from "react";
import { Activity } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { listEntities } from "@/lib/api";
import { Avatar, Badge, Card, PageHeader } from "@/components/ui";
import { ExportMenu, FilterBar } from "@/components/module-kit";
import { ROLE_LABELS } from "@/lib/roles";
import { fmtDateTime, relativeTime } from "@/lib/utils";

export default function ActivityPage() {
  const { company } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});

  useEffect(() => {
    if (company) listEntities("activity-logs", company.id).then(setRows);
  }, [company]);

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (!filters.q || (r.user + r.details).toLowerCase().includes(filters.q.toLowerCase())) &&
          (!filters.entity || r.entity === filters.entity) &&
          (!filters.role || r.role === filters.role)
      ),
    [rows, filters]
  );

  const entities = Array.from(new Set(rows.map((r) => r.entity)));
  const roles = Array.from(new Set(rows.map((r) => r.role)));

  return (
    <div>
      <PageHeader
        title="Activity Logs"
        subtitle="Immutable audit trail — who did what, when"
        actions={
          <ExportMenu rows={filtered} filename="activity-logs" columns={[
            { key: "created", label: "Timestamp" }, { key: "user", label: "User" },
            { key: "role", label: "Role" }, { key: "action", label: "Action" },
            { key: "entity", label: "Entity" }, { key: "entity_id", label: "Entity ID" },
            { key: "details", label: "Details" },
          ]} />
        }
      />

      <Card>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input
            placeholder="Search user, action…"
            value={filters.q ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            className="w-full max-w-xs rounded-xl border-0 bg-ink-100/70 px-3.5 py-2.5 text-sm ring-1 ring-inset ring-ink-200 outline-none placeholder:text-ink-400 focus:bg-white focus:ring-2 focus:ring-brand-500 dark:bg-ink-800/70 dark:text-white dark:ring-ink-600/50 dark:focus:bg-ink-800"
          />
          <FilterBar
            filters={[
              { key: "entity", label: "Entity", options: entities },
              { key: "role", label: "Role", options: roles },
            ]}
            values={filters}
            onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
          />
        </div>
        <div className="space-y-1.5">
          {filtered.map((l) => (
            <div key={l.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-ink-50 dark:hover:bg-ink-800/60">
              <Avatar name={l.user} size={30} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs">
                  <span className="font-bold text-ink-800 dark:text-ink-100">{l.user}</span>
                  <span className="text-ink-400"> {l.details}</span>
                </p>
                <p className="mt-0.5 text-[10px] text-ink-400" title={fmtDateTime(l.created)}>{relativeTime(l.created)} · {fmtDateTime(l.created)}</p>
              </div>
              <Badge tone="ink">{l.entity}</Badge>
              <Badge tone="blue">{ROLE_LABELS[l.role as keyof typeof ROLE_LABELS] ?? l.role}</Badge>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <Activity className="mx-auto h-7 w-7 text-ink-300" />
              <p className="mt-2 text-sm text-ink-400">No activity matches your filters.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
