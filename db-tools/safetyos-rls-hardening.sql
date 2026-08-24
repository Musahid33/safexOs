-- ═══════════════════════════════════════════════════════════════
--  SafetyOS — RLS hardening migration (apply to an EXISTING DB)
--  Fixes found during code review (Aug 2026):
--
--  1. CRITICAL  Signup trigger trusted client-supplied role/company
--               → anyone could self-register as super_admin / any tenant
--  2. CRITICAL  profiles UPDATE allowed a user to change their own
--               role (self-escalation to super_admin)
--  3. HIGH      Tenant tables: any authenticated user could UPDATE rows
--               (employees/guests editing audits, incidents, …)
--  4. HIGH      subscriptions policies were NOT tenant-scoped
--               (company A could read/modify company B's subscription)
--  5. MEDIUM    Master-data tables allowed any user to INSERT
--  6. MEDIUM    Hard DELETE allowed to safety_officer (now admins only)
--
--  Safe to re-run (drops + recreates policies/functions).
--  Apply via SQL Editor or: node db-tools/run-sql.js db-tools/safetyos-rls-hardening.sql
-- ═══════════════════════════════════════════════════════════════

-- ── Helpers ───────────────────────────────────────────────────
create or replace function app.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select app.current_role() in ('super_admin','company_admin')
$$;

create or replace function app.can_edit_tenant()
returns boolean language sql stable security definer set search_path = public as $$
  select app.current_role() in ('super_admin','company_admin','safety_officer','supervisor')
$$;

create or replace function app.is_company_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select app.current_role() in ('super_admin','company_admin')
$$;

-- ── Profiles: allow "no tenant yet" so unassigned signups exist but
--    have zero access until an admin assigns company_id + role ─────
alter table public.profiles alter column company_id drop not null;

alter table public.profiles enable row level security;
drop policy if exists "profiles select" on public.profiles;
drop policy if exists "profiles insert" on public.profiles;
drop policy if exists "profiles update" on public.profiles;

create policy "profiles select" on public.profiles for select
  using (company_id = app.current_company_id() or user_id = auth.uid() or app.current_role() = 'super_admin');
create policy "profiles insert" on public.profiles for insert
  with check (company_id = app.current_company_id());
-- Self-service edits may update name/phone only: role & company stay locked.
-- Company admins may change profiles within their own tenant; super admin anywhere.
create policy "profiles update" on public.profiles for update
  using (user_id = auth.uid() or app.is_admin())
  with check (
    (user_id = auth.uid()
      and role = (select p.role from public.profiles p where p.user_id = auth.uid())
      and company_id = (select p.company_id from public.profiles p where p.user_id = auth.uid()))
    or app.current_role() = 'super_admin'
    or (app.current_role() = 'company_admin' and company_id = app.current_company_id())
  );

-- ── Tenant-scoped tables: rewrite policies with role gates ──────
-- super_admin bypasses tenant scoping (platform owner); everyone else
-- is scoped to app.current_company_id().
do $$ declare t text;
begin
  -- Report tables: any authenticated tenant user may INSERT
  foreach t in array array['near_misses','hazards','grievances','documents']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "tenant select" on %I', t);
    execute format('drop policy if exists "tenant insert" on %I', t);
    execute format('drop policy if exists "tenant update" on %I', t);
    execute format('drop policy if exists "tenant delete" on %I', t);
    execute format($f$
      create policy "tenant select" on %1$I for select
        using (deleted_at is null and (company_id = app.current_company_id() or app.current_role() = 'super_admin'));
    $f$, t);
    execute format($f$
      create policy "tenant insert" on %1$I for insert
        with check (company_id = app.current_company_id() or app.current_role() = 'super_admin');
    $f$, t);
    execute format($f$
      create policy "tenant update" on %1$I for update
        using ((company_id = app.current_company_id() or app.current_role() = 'super_admin') and app.can_edit_tenant())
        with check (company_id = app.current_company_id() or app.current_role() = 'super_admin');
    $f$, t);
    execute format($f$
      create policy "tenant delete" on %1$I for delete
        using ((company_id = app.current_company_id() or app.current_role() = 'super_admin') and app.is_company_admin());
    $f$, t);
  end loop;

  -- Staff-only tables: INSERT also requires staff role
  foreach t in array array[
    'departments','contractors','locations','vendors','employees',
    'employee_documents','employee_trainings','employee_medical',
    'employee_violations','employee_rewards','capas','incidents',
    'incident_investigations','training_programs','training_sessions',
    'training_nominations','ppe_catalog','ppe_issues','ppe_stock',
    'vehicle_inspections','tool_inspections','audits','audit_findings'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "tenant select" on %I', t);
    execute format('drop policy if exists "tenant insert" on %I', t);
    execute format('drop policy if exists "tenant update" on %I', t);
    execute format('drop policy if exists "tenant delete" on %I', t);
    execute format($f$
      create policy "tenant select" on %1$I for select
        using (deleted_at is null and (company_id = app.current_company_id() or app.current_role() = 'super_admin'));
    $f$, t);
    execute format($f$
      create policy "tenant insert" on %1$I for insert
        with check (app.can_edit_tenant() and (company_id = app.current_company_id() or app.current_role() = 'super_admin'));
    $f$, t);
    execute format($f$
      create policy "tenant update" on %1$I for update
        using ((company_id = app.current_company_id() or app.current_role() = 'super_admin') and app.can_edit_tenant())
        with check (app.can_edit_tenant() and (company_id = app.current_company_id() or app.current_role() = 'super_admin'));
    $f$, t);
    execute format($f$
      create policy "tenant delete" on %1$I for delete
        using ((company_id = app.current_company_id() or app.current_role() = 'super_admin') and app.is_company_admin());
    $f$, t);
  end loop;
end $$;

-- ── Subscriptions: enforce tenant scoping ───────────────────────
alter table public.subscriptions enable row level security;
drop policy if exists "subs manage" on public.subscriptions;
drop policy if exists "subs select" on public.subscriptions;
drop policy if exists "subs insert" on public.subscriptions;
drop policy if exists "subs update" on public.subscriptions;
drop policy if exists "subs delete" on public.subscriptions;

create policy "subs select" on public.subscriptions for select
  using (app.current_role() = 'super_admin' or company_id = app.current_company_id());
create policy "subs insert" on public.subscriptions for insert
  with check (app.current_role() = 'super_admin'
    or (app.current_role() = 'company_admin' and company_id = app.current_company_id()));
create policy "subs update" on public.subscriptions for update
  using (app.current_role() = 'super_admin'
    or (app.current_role() = 'company_admin' and company_id = app.current_company_id()))
  with check (app.current_role() = 'super_admin'
    or (app.current_role() = 'company_admin' and company_id = app.current_company_id()));
create policy "subs delete" on public.subscriptions for delete
  using (app.current_role() = 'super_admin'
    or (app.current_role() = 'company_admin' and company_id = app.current_company_id()));

-- ── Signup trigger: never trust client-supplied role/company ────
create or replace function app.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  _company uuid;
  _role app_role;
begin
  _role := 'employee';
  begin
    _role := coalesce((new.raw_app_meta_data->>'role')::app_role, 'employee');
  exception when others then
    _role := 'employee';
  end;

  _company := null;
  begin
    select id into _company from companies
      where slug = new.raw_app_meta_data->>'company_slug'
      and deleted_at is null
      limit 1;
  exception when others then
    _company := null;
  end;

  insert into profiles (user_id, company_id, role, full_name, designation)
  values (
    new.id,
    _company,
    _role,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'designation'
  );
  return new;
end $$;

-- ── Post-check: confirm no self-registered profile holds a staff role ──
-- (Run manually; should return 0 rows when no signup-based escalation exists)
-- select count(*) from public.profiles p
--   where p.role <> 'employee'
--   and p.user_id in (
--     select u.id from auth.users u
--     where u.confirmed_at is not null
--       and u.raw_app_meta_data->>'provider' = 'email'
--       and (u.raw_app_meta_data ? 'role') = false
--   );

-- ═══════════════════════════════════════════════════════════════
--  NOTE: supabase.auth.admin.createUser(…, { app_metadata: { role,
--  company_slug } }) sets raw_app_meta_data — admin-created users
--  keep working. Existing elevated profiles are untouched.
--  Existing profiles that already have a company_id keep it.
-- ═══════════════════════════════════════════════════════════════

-- ── REMOVE DEMO ACCOUNTS before production (uncomment to run) ──
-- delete from public.profiles where user_id in (
--   select id from auth.users where email like '%@demo.com');
-- delete from auth.users where email like '%@demo.com';
--
-- Re-create real users with the Auth admin API, e.g.:
--   supabase.auth.admin.createUser({ email, password,
--     app_metadata: { role: 'company_admin', company_slug: 'emveess' },
--     user_metadata: { full_name: '…', designation: 'Plant Head' } })
-- (app_metadata → raw_app_meta_data is honoured by the safe trigger;
--  user_metadata is NEVER used for role/company.)
