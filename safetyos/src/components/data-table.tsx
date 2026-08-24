"use client";

// ─────────────────────────────────────────────────────────────
// SafetyOS — generic data table
// ─────────────────────────────────────────────────────────────
import React, { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cx } from "@/lib/utils";
import { EmptyState } from "./ui";

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  sortValue?: (row: T) => string | number;
}

export function DataTable<T extends { id: string }>({
  rows, columns, onRowClick, emptyTitle = "No records found", emptyBody, footer,
}: {
  rows: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyBody?: string;
  footer?: React.ReactNode;
}) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [dir, setDir] = useState<1 | -1>(1);

  const sorted = React.useMemo(() => {
    if (!sortKey) return rows;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return rows;
    const val = col.sortValue ?? ((r: T) => String((r as any)[col.key] ?? ""));
    return [...rows].sort((a, b) => {
      const av = val(a), bv = val(b);
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [rows, columns, sortKey, dir]);

  if (rows.length === 0) return <EmptyState title={emptyTitle} body={emptyBody} />;

  return (
    <div className="overflow-x-auto rounded-2xl">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr className="border-b border-ink-100 dark:border-ink-800">
            {columns.map((c) => (
              <th
                key={c.key}
                onClick={() => {
                  if (sortKey === c.key) setDir((d) => (d === 1 ? -1 : 1));
                  else { setSortKey(c.key); setDir(1); }
                }}
                className={cx(
                  "whitespace-nowrap px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-ink-400",
                  (c.sortValue || (c.key !== "actions")) && "cursor-pointer select-none hover:text-ink-600 dark:hover:text-ink-200"
                )}
              >
                <span className="inline-flex items-center gap-1">
                  {c.label}
                  {sortKey === c.key && (dir === 1 ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr
              key={row.id}
              onClick={() => onRowClick?.(row)}
              className={cx(
                "border-b border-ink-50 transition-colors last:border-0 dark:border-ink-800/50",
                onRowClick && "cursor-pointer hover:bg-brand-50/50 dark:hover:bg-brand-500/5"
              )}
            >
              {columns.map((c) => (
                <td key={c.key} className={cx("whitespace-nowrap px-4 py-3 text-[13px] text-ink-700 dark:text-ink-200", c.className)}>
                  {c.render ? c.render(row) : String((row as any)[c.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {footer}
    </div>
  );
}
