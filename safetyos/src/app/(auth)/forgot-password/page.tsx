"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Shield, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button, Field, Input, Toast } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setMsg("Password reset link sent to " + email);
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div className="auth-bg flex min-h-screen items-center justify-center p-4">
      <Toast msg={msg} />
      <div className="w-full max-w-md rounded-3xl bg-white/80 p-8 shadow-glass-lg backdrop-blur-2xl dark:bg-ink-900/80">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
            <Shield className="h-5 w-5" />
          </div>
          <p className="text-base font-extrabold text-ink-900 dark:text-white">Safety<span className="text-brand-600 dark:text-brand-400">OS</span></p>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50 dark:bg-emerald-500/10 dark:ring-emerald-500/10">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-bold text-ink-900 dark:text-white">Check your inbox</h2>
            <p className="mt-2 text-sm text-ink-400">
              We sent a reset link to <span className="font-semibold text-ink-600 dark:text-ink-300">{email}</span>. The link expires in 30 minutes.
            </p>
            <Button className="mt-6 w-full" onClick={() => setSent(false)}>Use a different email</Button>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-ink-900 dark:text-white">Forgot password</h2>
            <p className="mt-1 text-sm text-ink-400">Enter your registered email and we&apos;ll send a secure reset link.</p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <Field label="Email address" required>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                  <Input type="email" required placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" />
                </div>
              </Field>
              <Button type="submit" size="lg" className="w-full">Send reset link</Button>
            </form>
          </>
        )}

        <Link href="/login" className="mt-6 flex items-center justify-center gap-1.5 text-xs font-semibold text-ink-400 hover:text-brand-600">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
        </Link>
      </div>
    </div>
  );
}
