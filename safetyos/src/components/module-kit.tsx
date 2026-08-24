"use client";

// ─────────────────────────────────────────────────────────────
// SafetyOS — reusable module kit (filters, exports, photos, timelines)
// ─────────────────────────────────────────────────────────────
import React, { useRef, useState } from "react";
import { Download, Printer, Camera, ChevronRight, FileSpreadsheet } from "lucide-react";
import { Badge, Button, Input, Select, Toast } from "./ui";
import { compressImage, downloadCSV, cx, fmtDateTime, photoPlaceholder, relativeTime } from "@/lib/utils";
import { Avatar } from "./ui";

export interface FilterDef {
  key: string;
  label: string;
  options: string[];
}

export function FilterBar({ filters, values, onChange, extra }: {
  filters: FilterDef[];
  values: Record<string, string>;
  onChange: (key: string, v: string) => void;
  extra?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {filters.map((f) => (
        <Select
          key={f.key}
          className="w-auto min-w-[130px]"
          value={values[f.key] ?? ""}
          onChange={(v) => onChange(f.key, v)}
          allLabel={`All ${f.label}`}
          options={f.options.map((o) => ({ value: o, label: o }))}
        />
      ))}
      {filters.some((f) => values[f.key]) && (
        <button
          onClick={() => filters.forEach((f) => onChange(f.key, ""))}
          className="text-xs font-semibold text-brand-600 hover:underline"
        >
          Clear filters
        </button>
      )}
      {extra}
    </div>
  );
}

export function ExportMenu({ rows, columns, filename }: {
  rows: Record<string, any>[];
  columns: { key: string; label: string }[];
  filename: string;
}) {
  const [msg, setMsg] = useState<string | null>(null);
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(null), 2200); };
  return (
    <>
      <Toast msg={msg} />
      <div className="flex gap-1.5">
        <Button
          size="sm" variant="secondary"
          onClick={() => { downloadCSV(filename + ".csv", rows, columns); flash("CSV exported — opens in Excel too"); }}
        >
          <FileSpreadsheet className="h-3.5 w-3.5" /> CSV / Excel
        </Button>
        <Button size="sm" variant="secondary" onClick={() => { window.print(); }}>
          <Printer className="h-3.5 w-3.5" /> PDF / Print
        </Button>
      </div>
    </>
  );
}

export function PhotoUpload({ photos, onAdd, compact }: {
  photos: string[];
  onAdd: (dataUrl: string) => void;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handle = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) { setMsg("Max upload size is 10 MB"); setTimeout(() => setMsg(null), 2500); return; }
    setBusy(true);
    try {
      const webp = await compressImage(file);
      onAdd(webp);
      setMsg("Uploaded — auto-compressed to WebP (100–300 KB)");
    } catch {
      setMsg("Could not process image");
    }
    setBusy(false);
    setTimeout(() => setMsg(null), 2500);
  };

  return (
    <div>
      <Toast msg={msg} />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); e.target.value = ""; }}
      />
      <div className={cx("grid gap-2", compact ? "grid-cols-4" : "grid-cols-3")}>
        {photos.map((p, i) => (
          <div key={i} className={cx("group relative overflow-hidden rounded-xl ring-1 ring-ink-200 dark:ring-ink-700", compact ? "h-16" : "h-24")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.startsWith("p") ? photoPlaceholder("Site Photo", 30 + i * 55) : p} alt="evidence" className="h-full w-full object-cover" />
          </div>
        ))}
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className={cx(
            "flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-ink-200 text-ink-400 transition hover:border-brand-400 hover:text-brand-500 dark:border-ink-700",
            compact ? "h-16" : "h-24"
          )}
        >
          <Camera className="h-5 w-5" />
          <span className="text-[10px] font-semibold">{busy ? "Compressing…" : "Add photo"}</span>
        </button>
      </div>
      <p className="mt-1.5 text-[10px] text-ink-400">JPG/PNG → auto-compressed to WebP · max 10 MB · target 100–300 KB</p>
    </div>
  );
}

export function Timeline({ events }: { events: { date: string; event: string; note: string; actor: string }[] }) {
  return (
    <ol className="relative space-y-5 border-l-2 border-ink-100 pl-5 dark:border-ink-800">
      {events.map((e, i) => (
        <li key={i} className="relative">
          <span className={cx(
            "absolute -left-[27px] top-1 h-3.5 w-3.5 rounded-full ring-4 ring-white dark:ring-ink-950",
            i === 0 ? "bg-brand-500" : "bg-ink-200 dark:bg-ink-700"
          )} />
          <p className="text-xs font-bold text-ink-800 dark:text-ink-100">{e.event}</p>
          <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">{e.note}</p>
          <p className="mt-1 flex items-center gap-2 text-[10px] text-ink-400">
            {fmtDateTime(e.date)} · by {e.actor}
          </p>
        </li>
      ))}
    </ol>
  );
}

export function DetailGrid({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3.5 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((it) => (
        <div key={it.label}>
          <dt className="text-[10px] font-bold uppercase tracking-widest text-ink-400">{it.label}</dt>
          <dd className="mt-0.5 text-[13px] font-medium text-ink-800 dark:text-ink-100">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function KpiRow({ items }: { items: { label: string; value: React.ReactNode; tone?: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((k) => (
        <div key={k.label} className="glass rounded-xl px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-ink-400">{k.label}</p>
          <p className="mt-1 text-lg font-bold text-ink-900 dark:text-white">{k.value}</p>
        </div>
      ))}
    </div>
  );
}

export function ActionList({ items, empty }: {
  items: { action: string; meta?: string; done: boolean }[];
  empty?: string;
}) {
  if (items.length === 0) return <p className="text-xs text-ink-400">{empty ?? "No actions recorded."}</p>;
  return (
    <ul className="space-y-2">
      {items.map((a, i) => (
        <li key={i} className="flex items-start gap-2.5 rounded-xl bg-ink-50/80 px-3 py-2.5 dark:bg-ink-800/60">
          <span className={cx(
            "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white",
            a.done ? "bg-emerald-500" : "bg-amber-400"
          )}>
            {a.done ? "✓" : "•"}
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-medium text-ink-700 dark:text-ink-200">{a.action}</span>
            {a.meta && <span className="text-[10px] text-ink-400">{a.meta}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function RecentTable({ title, rows, cols, onViewAll }: {
  title: string;
  rows: any[];
  cols: { key: string; label: string; render?: (r: any) => React.ReactNode }[];
  onViewAll?: () => void;
}) {
  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-sm font-bold text-ink-800 dark:text-ink-100">{title}</p>
        {onViewAll && (
          <button onClick={onViewAll} className="flex items-center gap-0.5 text-xs font-semibold text-brand-600 hover:underline">
            View all <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </div>
      <div className="space-y-1.5">
        {rows.slice(0, 5).map((r) => (
          <div key={r.id} className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-ink-50 dark:hover:bg-ink-800/60">
            {cols.map((c) => (
              <div key={c.key} className="min-w-0 flex-1">
                {c.render ? c.render(r) : <span className="block truncate text-xs text-ink-600 dark:text-ink-300">{r[c.key] ?? "—"}</span>}
              </div>
            ))}
          </div>
        ))}
        {rows.length === 0 && <p className="px-3 py-4 text-xs text-ink-400">Nothing here yet.</p>}
      </div>
    </div>
  );
}
