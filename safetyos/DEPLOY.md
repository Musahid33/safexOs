# 🚀 Deploying SafetyOS to Vercel

Your Vercel project name: **`musahidsafetyox`** → live URL will be **https://musahidsafetyox.vercel.app**

## Option A — Fastest: let the agent deploy for you (60 seconds)

1. Go to https://vercel.com/account/tokens (sign in / sign up free with GitHub or email)
2. Click **Create Token** → any name → scope: your account → **Create**
3. Paste the token in the chat. The agent runs:

```bash
vercel link --project musahidsafetyox
vercel deploy --prod --yes
```

…with these environment variables (pre-configured):

| Key | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ixfwhxjtajmrdndhtsub.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_PaR8QjtqO9nq593ekRfg7Q_PzsOCg2-` |
| `NEXT_PUBLIC_DEMO_MODE` | `false` |

## Option B — Self-serve via GitHub (no token needed, ~5 min)

1. Create a free private repo on github.com (e.g. `musahidsafetyox`)
2. On your machine (or tell the agent and use its terminal):

```bash
cd safetyos
git init
git add .
git commit -m "SafetyOS v1.0 — full PRD build"
git branch -M main
git remote add origin https://github.com/<you>/musahidsafetyox.git
git push -u origin main
```

3. vercel.com → **Add New → Project** → import the repo (Vercel auto-detects Next.js)
4. Paste the 3 environment variables from the table above
5. Click **Deploy** → your app is live at `https://musahidsafetyox.vercel.app`

## After deploying — 2-minute Supabase checklist

1. **Supabase Dashboard → Authentication → URL Configuration**
   - Site URL: `https://musahidsafetyox.vercel.app`
   - Add Redirect URLs: `https://musahidsafetyox.vercel.app/**` and `https://musahidsafetyox.vercel.app/login`
2. **Authentication → Providers → Email** — enable it (for future password resets)
3. Log in with `officer@demo.com` / `demo1234` — everything else is already live.

## Custom domain (later)

Vercel → Project → Settings → Domains → add `app.safetyos.com` (or any domain you own).
Per-tenant subdomains (`emveess.safetyos.com` …) use Vercel's wildcard domains — ask the agent when ready.
