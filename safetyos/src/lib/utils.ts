// ─────────────────────────────────────────────────────────────
// SafetyOS — shared utilities
// ─────────────────────────────────────────────────────────────

export const cx = (...parts: (string | false | null | undefined)[]) =>
  parts.filter(Boolean).join(" ");

export const uid = (prefix = "") =>
  prefix + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);

export const fmtDate = (d: string) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export const fmtDateTime = (d: string) => {
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};

export const fmtINR = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

export const fmtNum = (n: number) => n.toLocaleString("en-IN");

export const daysBetween = (a: string, b: string) =>
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);

export const daysFromToday = (d: string) => daysBetween(d, new Date().toISOString().slice(0, 10));

export const monthKey = (d: string) => d.slice(0, 7);

export const monthLabel = (key: string) =>
  new Date(key + "-01").toLocaleDateString("en-IN", { month: "short", year: "2-digit" });

export const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

export const relativeTime = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return fmtDate(d);
};

// ── CSV / Excel export (client-side) ─────────────────────────
export function downloadCSV(filename: string, rows: Record<string, any>[], columns: { key: string; label: string }[]) {
  const escape = (v: any) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv =
    "\uFEFF" +
    columns.map((c) => escape(c.label)).join(",") +
    "\n" +
    rows.map((r) => columns.map((c) => escape(r[c.key])).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function printPage() {
  window.print();
}

// ── Client-side image compression (PRD: WebP, 100–300 KB) ────
export async function compressImage(file: File, maxDim = 1280, quality = 0.75): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/webp", quality);
}

// ── Placeholder photos (SVG data URIs, work offline) ─────────
const HUE_POOL: Record<string, number> = {
  Warehouse: 210, "Blast Furnace": 12, "Rolling Mill": 24, Production: 210,
};

export function photoPlaceholder(label: string, hue?: number): string {
  const h = hue ?? (HUE_POOL[label] ?? (label.length * 47) % 360);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='640' height='420'>
  <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
    <stop offset='0' stop-color='hsl(${h},72%,62%)'/><stop offset='1' stop-color='hsl(${(h + 45) % 360},80%,48%)'/>
  </linearGradient></defs>
  <rect width='640' height='420' fill='url(#g)'/>
  <circle cx='540' cy='60' r='140' fill='rgba(255,255,255,0.12)'/>
  <circle cx='90' cy='380' r='110' fill='rgba(0,0,0,0.08)'/>
  <g fill='rgba(255,255,255,0.9)' font-family='Inter,system-ui,sans-serif'>
    <rect x='272' y='160' width='96' height='96' rx='18' fill='rgba(255,255,255,0.22)'/>
    <path d='M292 208 h56 M320 180 v56' stroke='white' stroke-width='8' stroke-linecap='round'/>
    <text x='320' y='300' text-anchor='middle' font-size='24' font-weight='600'>${label.slice(0, 24)}</text>
  </g></svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

// ── Misc ─────────────────────────────────────────────────────
export const statusColors: Record<string, string> = {
  Open: "sky", "Under Review": "violet", "CAPA Pending": "amber", Closed: "emerald", Verified: "emerald",
  "In Progress": "blue", Mitigated: "emerald", "Under Investigation": "violet", "Investigation Done": "blue",
  Acknowledged: "sky", "In Action": "amber", Resolved: "emerald", Scheduled: "sky", Completed: "emerald",
  Cancelled: "rose", Issued: "blue", Returned: "ink", Replaced: "amber", Expired: "rose",
  "Pending Approval": "amber", Approved: "emerald", Rejected: "rose", Pass: "emerald", Fail: "rose", Repair: "amber",
  Planned: "sky", active: "emerald", trial: "amber", suspended: "rose", "In Stock": "emerald", "Low Stock": "amber",
  "Out of Stock": "rose", Nominated: "sky", Attended: "emerald", Absent: "rose", NC: "rose", OFI: "amber",
  Observation: "sky", Low: "sky", Medium: "amber", High: "orange", Critical: "rose", Extreme: "rose",
  "First Aid": "sky", MTC: "amber", LTI: "rose", "Property Damage": "orange", Fire: "rose", Spill: "orange",
  Road: "violet", "Near Miss Escalation": "blue",
};

export const badgeTone = (key: string) => {
  const tone = statusColors[key] ?? "ink";
  const map: Record<string, string> = {
    sky: "bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/20",
    blue: "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-400/20",
    violet: "bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-400/20",
    amber: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20",
    rose: "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/20",
    orange: "bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-400/20",
    ink: "bg-ink-100 text-ink-600 ring-ink-500/20 dark:bg-ink-500/10 dark:text-ink-300 dark:ring-ink-400/20",
  };
  return map[tone];
};
