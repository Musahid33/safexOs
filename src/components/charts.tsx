"use client";

// ─────────────────────────────────────────────────────────────
// SafetyOS — lightweight SVG charts (no heavy chart libs)
// ─────────────────────────────────────────────────────────────
import React from "react";

export function TrendChart({ series, labels, height = 220 }: {
  series: { name: string; color: string; data: number[] }[];
  labels: string[];
  height?: number;
}) {
  const W = 640, H = height, PADL = 36, PADB = 26, PADT = 14, PADR = 12;
  const max = Math.max(1, ...series.flatMap((s) => s.data));
  const iw = W - PADL - PADR, ih = H - PADT - PADB;
  const x = (i: number) => PADL + (labels.length === 1 ? iw / 2 : (i / (labels.length - 1)) * iw);
  const y = (v: number) => PADT + ih - (v / max) * ih * 0.92;
  const grid = [0, 0.25, 0.5, 0.75, 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
      {grid.map((g) => (
        <g key={g}>
          <line x1={PADL} x2={W - PADR} y1={PADT + ih * g} y2={PADT + ih * g} stroke="currentColor" className="text-ink-100 dark:text-ink-800" strokeWidth="1" strokeDasharray={g === 1 ? "0" : "3 5"} />
          <text x={PADL - 8} y={PADT + ih * g + 3} textAnchor="end" fontSize="9" className="fill-ink-400">
            {Math.round(max * (1 - g))}
          </text>
        </g>
      ))}
      {series.map((s) => (
        <g key={s.name}>
          <polygon
            points={s.data.map((v, i) => `${x(i)},${y(v)}`).join(" ") + ` ${x(s.data.length - 1)},${PADT + ih} ${x(0)},${PADT + ih}`}
            fill={s.color}
            opacity="0.08"
          />
          <polyline
            points={s.data.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
            fill="none"
            stroke={s.color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {s.data.map((v, i) => (
            <circle key={i} cx={x(i)} cy={y(v)} r="3" fill={s.color} stroke="white" strokeWidth="1.5" />
          ))}
        </g>
      ))}
      {labels.map((l, i) => (
        <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="9" className="fill-ink-400">{l}</text>
      ))}
    </svg>
  );
}

export function Bars({ data, height = 220, tone = "#3b82f6" }: {
  data: { label: string; value: number }[];
  height?: number;
  tone?: string;
}) {
  const W = 640, H = height, PADL = 120, PADB = 14, PADT = 12;
  const max = Math.max(1, ...data.map((d) => d.value));
  const bw = (H - PADT - PADB) / Math.max(1, data.length);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
      {data.map((d, i) => {
        const w = ((d.value / max) * (W - PADL - 90));
        return (
          <g key={d.label}>
            <text x={PADL - 10} y={PADT + i * bw + bw * 0.62} textAnchor="end" fontSize="10" className="fill-ink-500 dark:fill-ink-300">
              {d.label.length > 16 ? d.label.slice(0, 15) + "…" : d.label}
            </text>
            <rect x={PADL} y={PADT + i * bw + bw * 0.18} width={w} height={bw * 0.62} rx="5" fill={tone} opacity="0.9" />
            <text x={PADL + w + 8} y={PADT + i * bw + bw * 0.62} fontSize="10" fontWeight="600" className="fill-ink-600 dark:fill-ink-200">
              {d.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function Donut({ data, size = 150, thickness = 22 }: {
  data: { label: string; value: number; color: string }[];
  size?: number; thickness?: number;
}) {
  const total = Math.max(1, data.reduce((s, d) => s + d.value, 0));
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex flex-wrap items-center justify-center gap-5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={thickness} className="stroke-ink-100 dark:stroke-ink-800" />
        {data.map((d) => {
          const frac = d.value / total;
          const dash = frac * c;
          const el = (
            <circle
              key={d.label}
              cx={size / 2} cy={size / 2} r={r}
              fill="none" stroke={d.color} strokeWidth={thickness}
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
          offset += dash;
          return el;
        })}
        <text x="50%" y="47%" textAnchor="middle" fontSize="22" fontWeight="700" className="fill-ink-900 dark:fill-white">{total}</text>
        <text x="50%" y="60%" textAnchor="middle" fontSize="9" className="fill-ink-400">TOTAL</text>
      </svg>
      <div className="space-y-1.5">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} />
            <span className="text-ink-500 dark:text-ink-300">{d.label}</span>
            <span className="font-semibold text-ink-800 dark:text-ink-100">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HeatMap({ rows, cols, data, max }: {
  rows: string[]; cols: string[];
  data: Record<string, number>; // key: `${row}|${col}`
  max?: number;
}) {
  const mx = max ?? Math.max(1, ...Object.values(data));
  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        <div className="grid gap-1" style={{ gridTemplateColumns: `110px repeat(${cols.length}, minmax(34px, 1fr))` }}>
          <div />
          {cols.map((c) => (
            <div key={c} className="pb-1 text-center text-[10px] font-semibold text-ink-400">{c}</div>
          ))}
          {rows.map((r) => (
            <React.Fragment key={r}>
              <div className="flex items-center pr-2 text-[10px] font-medium text-ink-500 dark:text-ink-300">{r.length > 14 ? r.slice(0, 13) + "…" : r}</div>
              {cols.map((c) => {
                const v = data[`${r}|${c}`] ?? 0;
                const intensity = v / mx;
                return (
                  <div
                    key={c}
                    title={`${r} · ${c}: ${v}`}
                    className="flex h-8 items-center justify-center rounded-md text-[10px] font-semibold transition-transform hover:scale-105"
                    style={{
                      background: intensity === 0 ? "rgba(148,163,184,0.12)" : `rgba(37,99,235,${0.15 + intensity * 0.8})`,
                      color: intensity > 0.45 ? "#fff" : intensity > 0.2 ? "#2563eb" : "#94a3b8",
                    }}
                  >
                    {v || ""}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Gauge({ value, size = 170 }: { value: number; size?: number }) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = Math.PI * r; // semicircle
  const frac = Math.min(1, Math.max(0, value / 100));
  const color = value >= 85 ? "#10b981" : value >= 70 ? "#f59e0b" : "#f43f5e";
  return (
    <svg width={size} height={size / 2 + 22} viewBox={`0 0 ${size} ${size / 2 + 22}`}>
      <path d={`M ${stroke / 2} ${size / 2 + 10} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${size / 2 + 10}`} fill="none" strokeWidth={stroke} className="stroke-ink-100 dark:stroke-ink-800" strokeLinecap="round" />
      <path
        d={`M ${stroke / 2} ${size / 2 + 10} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${size / 2 + 10}`}
        fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={`${c * frac} ${c}`}
      />
      <text x="50%" y={size / 2 + 2} textAnchor="middle" fontSize="26" fontWeight="700" className="fill-ink-900 dark:fill-white">{value}%</text>
    </svg>
  );
}

export function Sparkline({ data, color = "#3b82f6", width = 90, height = 30 }: {
  data: number[]; color?: string; width?: number; height?: number;
}) {
  const max = Math.max(1, ...data);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - (v / max) * (height - 4) - 2}`).join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="shrink-0">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
