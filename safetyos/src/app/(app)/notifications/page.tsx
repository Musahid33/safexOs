"use client";

// ─────────────────────────────────────────────────────────────
// SafetyOS — Notifications centre (email / SMS / browser)
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Mail, MessageSquare, Globe } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { db, forCompany } from "@/lib/store";
import { Badge, Button, Card, PageHeader } from "@/components/ui";
import { cx, relativeTime } from "@/lib/utils";

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState("");
  const [notifs, setNotifs] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      setNotifs(
        forCompany(db.notifications, user.companyId).filter(
          (n) => n.user === "all" || n.user_id == null || ["safety_officer", "company_admin", "super_admin"].includes(user.role)
        )
      );
    }
  }, [user]);

  const filtered = notifs.filter((n) => !filter || n.type === filter);
  const unread = notifs.filter((n) => !n.read).length;

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Email, SMS & browser alerts for safety events"
        actions={
          <Button size="sm" variant="secondary" onClick={() => { notifs.forEach((n) => (n.read = true)); setNotifs([...notifs]); }}>
            <CheckCheck className="h-3.5 w-3.5" /> Mark all read
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "All", key: "", icon: <Bell className="h-4 w-4" />, count: notifs.length, tone: "bg-brand-600" },
          { label: "Email", key: "email", icon: <Mail className="h-4 w-4" />, count: notifs.filter((n) => n.type === "email").length, tone: "bg-sky-500" },
          { label: "SMS", key: "sms", icon: <MessageSquare className="h-4 w-4" />, count: notifs.filter((n) => n.type === "sms").length, tone: "bg-emerald-500" },
          { label: "Browser", key: "browser", icon: <Globe className="h-4 w-4" />, count: notifs.filter((n) => n.type === "browser").length, tone: "bg-accent-500" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={cx(
              "flex items-center gap-3 rounded-2xl p-3.5 text-left ring-1 ring-inset transition",
              filter === t.key ? "ring-2 ring-brand-500 bg-brand-50/70 dark:bg-brand-500/10" : "glass hover:-translate-y-0.5"
            )}
          >
            <span className={cx("flex h-9 w-9 items-center justify-center rounded-xl text-white", t.tone)}>{t.icon}</span>
            <span>
              <span className="block text-sm font-bold text-ink-800 dark:text-ink-100">{t.count}</span>
              <span className="block text-[10px] uppercase tracking-widest text-ink-400">{t.label}</span>
            </span>
          </button>
        ))}
      </div>

      <Card>
        <p className="mb-3 text-sm font-bold text-ink-800 dark:text-ink-100">Inbox <Badge tone="accent">{unread} unread</Badge></p>
        <div className="space-y-2">
          {filtered.map((n) => (
            <button
              key={n.id}
              onClick={() => { n.read = true; setNotifs([...notifs]); router.push(n.link); }}
              className={cx(
                "flex w-full items-start gap-3 rounded-xl p-3.5 text-left ring-1 ring-inset transition",
                n.read ? "ring-transparent hover:bg-ink-50 dark:hover:bg-ink-800/60" : "bg-brand-50/60 ring-brand-100 hover:ring-brand-200 dark:bg-brand-500/10 dark:ring-brand-400/20"
              )}
            >
              <span className={cx(
                "mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white",
                n.type === "email" ? "bg-sky-500" : n.type === "sms" ? "bg-emerald-500" : "bg-accent-500"
              )}>
                {n.type === "email" ? <Mail className="h-4 w-4" /> : n.type === "sms" ? <MessageSquare className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className={cx("truncate text-xs font-bold", n.read ? "text-ink-600 dark:text-ink-300" : "text-ink-900 dark:text-white")}>{n.title}</span>
                  {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />}
                </span>
                <span className="mt-0.5 block text-[11px] leading-snug text-ink-500 dark:text-ink-400">{n.body}</span>
                <span className="mt-1 flex items-center gap-2 text-[10px] text-ink-400">{relativeTime(n.created)} · <Badge tone={n.type}>{n.type}</Badge></span>
              </span>
            </button>
          ))}
          {filtered.length === 0 && <p className="py-10 text-center text-sm text-ink-400">No notifications of this type.</p>}
        </div>
      </Card>
    </div>
  );
}
