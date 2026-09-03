# 🚀 Deploying SafetyOS to Vercel

Your Vercel project name: **`musahidsafetyox`** → live URL will be **https://musahidsafetyox.vercel.app**

## Environment variables (all options)

| Key | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ixfwhxjtajmrdndhtsub.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_PaR8QjtqO9nq593ekRfg7Q_PzsOCg2-` |
| `NEXT_PUBLIC_DEMO_MODE` | `false` |

> ⚠️ Security: the Supabase anon key is public-by-design, but **never share or
> commit Vercel tokens, OIDC tokens, or DB passwords**. Never paste CLI tokens
> into chat. Use browser login (`vercel login`) or a GitHub Actions secret.

## Option A — Fastest: Vercel CLI on your machine (60 seconds, no token in chat)

```bash
cd .
npm i -g vercel
vercel login                 # opens your browser — NO token to copy/paste
vercel link --project musahidsafetyox
vercel env rm VERCEL_OIDC_TOKEN --prod 2>/dev/null || true   # stale OIDC tokens must not sit in env
vercel deploy --prod --yes
```

Set the 3 environment variables above in the project settings
(Vercel → Project → Settings → Environment Variables) or via `vercel env add`.

## Option B — Self-serve via GitHub (no token needed, ~5 min)

1. This repo (`safexOs`) already hosts the app — push it to your GitHub account
   (or keep it here) and import into Vercel.
2. On your machine:

```bash
git push -u origin main
```

3. vercel.com → **Add New → Project** → import the repo (Vercel auto-detects Next.js; root dir `safetyos`)
4. Paste the 3 environment variables from the table above
5. Click **Deploy** → your app is live at `https://musahidsafetyox.vercel.app`

> The `safex/` static PWA is deployed separately by the GitHub Actions workflow
> (`.github/workflows/deploy-safex.yml`) using a **GitHub Actions secret**
> `VERCEL_TOKEN` — never a token pasted anywhere else.

## After deploying — 2-minute Supabase checklist

1. **Supabase Dashboard → Authentication → URL Configuration**
   - Site URL: `https://musahidsafetyox.vercel.app`
   - Add Redirect URLs: `https://musahidsafetyox.vercel.app/**` and `https://musahidsafetyox.vercel.app/login`
2. **Authentication → Providers → Email** — enable it (for future password resets)
3. Log in with `officer@demo.com` / `demo1234` — everything else is already live.

## Custom domain (later)

Vercel → Project → Settings → Domains → add `app.safetyos.com` (or any domain you own).
Per-tenant subdomains (`emveess.safetyos.com` …) use Vercel's wildcard domains — ask the agent when ready.
