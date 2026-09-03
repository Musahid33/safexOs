"use client";

// ─────────────────────────────────────────────────────────────
// SafetyOS — Ishikawa (fishbone) root-cause diagram, pure SVG
// ─────────────────────────────────────────────────────────────
import React from "react";

export function Fishbone({ categories, problem }: {
  categories: { category: string; causes: string[] }[];
  problem: string;
}) {
  const W = 860, H = 380;
  const cx0 = W / 2, cy0 = H / 2;
  const top = categories.slice(0, 3);
  const bottom = categories.slice(3, 6);

  const renderBranch = (cat: { category: string; causes: string[] }, side: "top" | "bottom", idx: number) => {
    const dir = side === "top" ? -1 : 1;
    const bx = cx0 - 130 - idx * 160;
    const bxEnd = bx + 150;
    const by = cy0 + dir * (70 + idx * 42);
    const byEnd = cy0 + dir * 22;
    return (
      <g key={cat.category}>
        {/* branch */}
        <line x1={bx} y1={by} x2={bxEnd} y2={byEnd} stroke="#94a3b8" strokeWidth="1.6" />
        {/* sub-bones */}
        {cat.causes.map((c, i) => {
          const n = cat.causes.length;
          const sx = bx + 30 + i * (120 / Math.max(1, n - 1));
          const sy = by + dir * (i % 2 === 0 ? -14 : 14);
          const fx = bx + 45 + i * (120 / Math.max(1, n - 1));
          const fy = by + dir * (i % 2 === 0 ? -4 : 4);
          return (
            <g key={i}>
              <line x1={sx} y1={sy} x2={fx} y2={fy} stroke="#cbd5e1" strokeWidth="1.2" />
              <text x={sx} y={sy + dir * 14} textAnchor="middle" fontSize="8.5" className="fill-ink-500 dark:fill-ink-300">
                {c.length > 26 ? c.slice(0, 25) + "…" : c}
              </text>
            </g>
          );
        })}
        <rect x={bx - 62} y={by - 11} width="62" height="22" rx="11" fill="rgba(37,99,235,0.12)" stroke="#2563eb" strokeWidth="1" />
        <text x={bx - 31} y={by + 3.5} textAnchor="middle" fontSize="9" fontWeight="700" fill="#2563eb">
          {cat.category}
        </text>
      </g>
    );
  };

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[680px] w-full" role="img">
        {/* spine */}
        <line x1="70" y1={cy0} x2={W - 60} y2={cy0} stroke="#64748b" strokeWidth="2.5" />
        {/* head */}
        <polygon points={`${W - 60},${cy0} ${W - 22},${cy0 - 18} ${W - 22},${cy0 + 18}`} fill="#f97316" />
        <text x={W - 42} y={cy0 - 26} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#f97316">
          EFFECT
        </text>
        <text x={W - 42} y={cy0 + 34} textAnchor="middle" fontSize="8.5" className="fill-ink-500 dark:fill-ink-300">
          {problem.length > 40 ? problem.slice(0, 39) + "…" : problem}
        </text>
        {/* tail */}
        <text x="66" y={cy0 + 4} textAnchor="middle" fontSize="9" fontWeight="700" className="fill-ink-600 dark:fill-ink-200">
          CAUSES
        </text>
        {top.map((c, i) => renderBranch(c, "top", i))}
        {bottom.map((c, i) => renderBranch(c, "bottom", i))}
      </svg>
    </div>
  );
}
