"use client";

// ─────────────────────────────────────────────────────────────
// Anti-inspection layer: blocks right-click / context menu,
// text selection (inputs keep selection), and the browser
// "view source" / DevTools keyboard shortcuts.
// Deters casual code viewing; the app ships no secrets, so
// nothing sensitive is exposed even if fetched directly.
// ─────────────────────────────────────────────────────────────
import { useEffect } from "react";

const SHORTCUT_KEYS = new Set(["I", "J", "C", "K"]);
const SIMPLE_KEYS = new Set(["U", "S", "P"]); // view-source / save / print

export function Protect() {
  useEffect(() => {
    const block = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const onSelect = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (t && t.closest && t.closest("input,textarea,[contenteditable='true']")) return;
      block(e);
    };

    document.addEventListener("contextmenu", block);
    document.addEventListener("dragstart", block);
    document.addEventListener("selectstart", onSelect);

    const onKey = (e: KeyboardEvent) => {
      const k = (e.key || "").toUpperCase();
      if (k === "F12") return block(e);
      if (e.ctrlKey && !e.altKey) {
        if (SIMPLE_KEYS.has(k)) return block(e);
        if (e.shiftKey && SHORTCUT_KEYS.has(k)) return block(e);
      }
      if (e.metaKey && !e.ctrlKey) {
        if (SIMPLE_KEYS.has(k)) return block(e);
        if (e.altKey && SHORTCUT_KEYS.has(k)) return block(e);
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("dragstart", block);
      document.removeEventListener("selectstart", onSelect);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return null;
}
