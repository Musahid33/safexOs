-- ═══════════════════════════════════════════════════════════════
--  SafetyOS — PostgreSQL schema (Supabase)
--  Multi-tenant HSE SaaS · Row-Level Security · Soft delete · Audit
--
--  HOW TO APPLY
--  1. Create a Supabase project
--  2. Open SQL Editor → paste & run this whole file
--  3. Enable email auth (Authentication → Providers → Email)
--  4. Create users via Authentication; assign company + role in
--     app.profiles
--  5. Put your project URL + anon key in .env.local
-- ═══════════════════════════════════════════════════════════════

-- ── Extensions ──────────────────────────────────────────────
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- Schema for helper functions & RLS
create schema if not exists app;

-- ── Enums ───────────────────────────────────────────────────
do $$ begin
  create type app_role as enum ('super_admin','company_admin','safety_officer','supervisor','employee','guest');
exception when duplicate_object then null; end $$;

do $$ begin
  create type app_status as enum ('active','trial','suspended');
exception when duplicate_object then null; end $$;

-- ────────────────────────────────────────────────────────────
--  TENANTS
-- ────────────────────────────────────────────────────────────
create table if not exists companies (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text not null unique,              -- subdomain: emveess.safetyos.com
  industry        text,
  plan            text not null default 'starter',   -- starter | growth | enterprise
  employees_limit int  not null default 100,
  brand_color     text not null default '#2563eb',
  status          app_status not null default 'trial',
  city            text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

-- ────────────────────────────────────────────────────────────
--  USERS / PROFILES
-- ────────────────────────────────────────────────────────────
create table if not exists profiles (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null unique references auth.users(id) on delete cascade,
  company_id    uuid references companies(id),  -- NULL until an admin assigns a tenant
  role          app_role not null default 'employee',
  full_name     text not null,
  phone         text,
  designation   text,
  department_id uuid,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

-- Helper: current user's company (used by RLS policies everywhere)
create or replace function app.current_company_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select p.company_id from profiles p where p.user_id = auth.uid() and p.deleted_at is null
$$;

-- Helper: current user's role
create or replace function app.current_role()
returns app_role
language sql stable security definer set search_path = public
as $$
  select p.role from profiles p where p.user_id = auth.uid() and p.deleted_at is null
$$;

-- Helper: platform / tenant admins (powerful: can change roles, hard-delete)
create or replace function app.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select app.current_role() in ('super_admin','company_admin')
$$;

-- Helper: staff who may edit tenant records (admins + officers + supervisors)
create or replace function app.can_edit_tenant()
returns boolean
language sql stable security definer set search_path = public
as $$
  select app.current_role() in ('super_admin','company_admin','safety_officer','supervisor')
$$;

-- ────────────────────────────────────────────────────────────
--  MASTER DATA (scoped per tenant)
-- ────────────────────────────────────────────────────────────
create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists contractors (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  name text not null,
  contact_person text,
  phone text,
  valid_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  name text not null,
  area text,
  risk_zone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists vendors (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  name text not null,
  contact_person text,
  phone text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ────────────────────────────────────────────────────────────
--  EMPLOYEE MASTER
-- ────────────────────────────────────────────────────────────
create table if not exists employees (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references companies(id),
  employee_code  text not null,
  name           text not null,
  department_id  uuid references departments(id),
  designation    text,
  blood_group    text,
  dob            date,
  joining_date   date,
  contractor_id  uuid references contractors(id),
  phone          text,
  email          text,
  emergency_name text,
  emergency_phone text,
  status         text not null default 'active',
  qr_token       text not null unique default gen_random_uuid()::text,
  search_text    text,                          -- pre-computed for ilike search
  created_by     uuid references auth.users(id),
  updated_by     uuid references auth.users(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,
  unique (company_id, employee_code)
);

create table if not exists employee_documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  employee_id uuid not null references employees(id),
  doc_type text,            -- certificate | training | medical | ppe | kyc
  title text,
  file_url text,
  issued_date date,
  expiry_date date,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists employee_trainings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  employee_id uuid not null references employees(id),
  program text,
  training_date date,
  score numeric,
  certificate_no text,
  valid_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists employee_medical (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  employee_id uuid not null references employees(id),
  exam_type text,
  exam_date date,
  result text,
  next_due date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists employee_violations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  employee_id uuid not null references employees(id),
  violation_date date,
  violation_type text,
  severity text,
  action_taken text,
  status text default 'Open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists employee_rewards (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  employee_id uuid not null references employees(id),
  reward_date date,
  reward_type text,
  reason text,
  points int default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ────────────────────────────────────────────────────────────
--  CAPA
-- ────────────────────────────────────────────────────────────
create table if not exists capas (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  capa_number text not null,
  source_type text,           -- near_miss | incident | audit | hazard
  source_id uuid,
  description text,
  owner_id uuid references profiles(id),
  due_date date,
  status text not null default 'Open',
  actions jsonb not null default '[]',
  verified_by uuid references profiles(id),
  closed_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (company_id, capa_number)
);

-- ────────────────────────────────────────────────────────────
--  NEAR MISS
-- ────────────────────────────────────────────────────────────
create table if not exists near_misses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  report_number text not null,
  nm_date date not null,
  nm_time time,
  location_id uuid references locations(id),
  department_id uuid references departments(id),
  employee_id uuid references employees(id),
  description text,
  category text,
  severity text not null default 'Low',
  photos jsonb not null default '[]',
  status text not null default 'NEW',
  -- NEW | UNDER INVESTIGATION | RCA COMPLETED | CLOSED | REJECTED
  assigned_to uuid references profiles(id),
  immediate_action text,
  root_cause text,
  five_whys jsonb not null default '[]',
  corrective_action text,
  preventive_action text,
  responsible_person text,
  target_date date,
  evidence jsonb not null default '[]',
  report_documents jsonb not null default '[]',
  rejection_reason text,
  capa_id uuid references capas(id),
  officer_remarks text,
  timeline jsonb not null default '[]',
  search_text text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (company_id, report_number)
);

-- Near-miss workflow migration for databases created before the
-- investigation pipeline shipped (idempotent, safe to re-run).
alter table near_misses add column if not exists immediate_action text;
alter table near_misses add column if not exists five_whys jsonb not null default '[]';
alter table near_misses add column if not exists responsible_person text;
alter table near_misses add column if not exists target_date date;
alter table near_misses add column if not exists evidence jsonb not null default '[]';
alter table near_misses add column if not exists report_documents jsonb not null default '[]';
alter table near_misses add column if not exists rejection_reason text;
alter table near_misses alter column status set default 'NEW';

-- ────────────────────────────────────────────────────────────
--  HAZARDS
-- ────────────────────────────────────────────────────────────
create table if not exists hazards (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  hazard_code text not null,
  location_id uuid references locations(id),
  risk_level text not null default 'Medium',
  hazard_type text,
  description text,
  photos jsonb not null default '[]',
  assigned_officer uuid references profiles(id),
  corrective_action text,
  status text not null default 'Open',
  reported_by uuid references profiles(id),
  reported_on date default current_date,
  history jsonb not null default '[]',
  search_text text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (company_id, hazard_code)
);

-- ────────────────────────────────────────────────────────────
--  INCIDENTS + INVESTIGATION
-- ────────────────────────────────────────────────────────────
create table if not exists incidents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  incident_number text not null,
  inc_date date not null,
  inc_time time,
  location_id uuid references locations(id),
  department_id uuid references departments(id),
  type text,                  -- First Aid | MTC | LTI | Property Damage | ...
  severity text not null default 'Low',
  description text,
  reported_by text,
  injured_person uuid references employees(id),
  injury_type text,
  lost_days int default 0,
  status text not null default 'Under Investigation',
  timeline jsonb not null default '[]',
  search_text text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (company_id, incident_number)
);

create table if not exists incident_investigations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  incident_id uuid not null references incidents(id),
  investigator uuid references profiles(id),
  summary text,
  immediate_causes jsonb not null default '[]',
  five_whys jsonb not null default '[]',
  fishbone jsonb not null default '[]',
  corrective_actions jsonb not null default '[]',
  preventive_actions jsonb not null default '[]',
  evidence jsonb not null default '[]',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ────────────────────────────────────────────────────────────
--  GRIEVANCE
-- ────────────────────────────────────────────────────────────
create table if not exists grievances (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  grievance_number text not null,
  employee_id uuid references employees(id),
  department_id uuid references departments(id),
  category text,
  subject text,
  description text,
  status text not null default 'Open',
  officer_id uuid references profiles(id),
  action_taken text,
  employee_ack boolean not null default false,
  filed_on date default current_date,
  resolved_on date,
  anonymous boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (company_id, grievance_number)
);

-- ────────────────────────────────────────────────────────────
--  TRAINING
-- ────────────────────────────────────────────────────────────
create table if not exists training_programs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  title text not null,
  category text,
  trainer text,
  duration_hours numeric,
  validity_months int,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists training_sessions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  program_id uuid references training_programs(id),
  session_date date,
  session_time time,
  venue text,
  trainer text,
  status text not null default 'Scheduled',
  capacity int default 20,
  pre_avg numeric,
  post_avg numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists training_nominations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  session_id uuid not null references training_sessions(id),
  employee_id uuid not null references employees(id),
  status text not null default 'Nominated',  -- Nominated | Attended | Absent
  pre_score numeric,
  post_score numeric,
  certificate_no text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ────────────────────────────────────────────────────────────
--  PPE
-- ────────────────────────────────────────────────────────────
create table if not exists ppe_catalog (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  name text not null,
  category text,
  standard text,              -- IS 2925 etc.
  validity_months int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists ppe_issues (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  employee_id uuid references employees(id),
  ppe_id uuid references ppe_catalog(id),
  issue_date date default current_date,
  expiry_date date,
  status text not null default 'Issued',
  cost numeric,
  vendor_id uuid references vendors(id),
  last_inspection date,
  condition text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists ppe_stock (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  ppe_id uuid references ppe_catalog(id),
  quantity int not null default 0,
  reorder_level int not null default 10,
  cost_per_unit numeric,
  vendor_id uuid references vendors(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ────────────────────────────────────────────────────────────
--  VEHICLE & TOOL INSPECTIONS
-- ────────────────────────────────────────────────────────────
create table if not exists vehicle_inspections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  vehicle_number text not null,
  vehicle_type text,
  inspection_date date default current_date,
  driver text,
  checklist jsonb not null default '[]',
  defects jsonb not null default '[]',
  photos jsonb not null default '[]',
  inspected_by uuid references profiles(id),
  approved_by uuid references profiles(id),
  status text not null default 'Pending Approval',
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists tool_inspections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  tool_name text not null,
  tool_code text,
  category text,
  inspection_date date default current_date,
  checklist jsonb not null default '[]',
  photos jsonb not null default '[]',
  status text not null default 'Pass',
  remarks text,
  inspector uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ────────────────────────────────────────────────────────────
--  AUDITS
-- ────────────────────────────────────────────────────────────
create table if not exists audits (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  audit_number text not null,
  audit_type text not null,   -- ISO 45001 | 5S | CSMS | Internal | Customer
  scope text,
  auditor text,
  date_from date,
  date_to date,
  score numeric,
  compliance numeric,
  status text not null default 'Planned',
  evidence jsonb not null default '[]',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (company_id, audit_number)
);

create table if not exists audit_findings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  audit_id uuid not null references audits(id),
  finding_type text not null,  -- NC | OFI | Observation
  description text,
  clause text,
  severity text,
  capa_id uuid references capas(id),
  status text not null default 'Open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ────────────────────────────────────────────────────────────
--  DOCUMENTS
-- ────────────────────────────────────────────────────────────
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  title text not null,
  category text not null,     -- SOP | JSA | HIRA | MSDS | Policy | Manual | Training Material
  description text,
  file_url text,
  version text,
  issued_date date,
  review_due date,
  owner text,
  downloads int default 0,
  search_text text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ────────────────────────────────────────────────────────────
--  NOTIFICATIONS
-- ────────────────────────────────────────────────────────────
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  user_id uuid references profiles(id),  -- null = broadcast to role
  role app_role,
  title text,
  body text,
  channel text not null default 'browser',  -- email | sms | browser | whatsapp
  read boolean not null default false,
  link text,
  created_at timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────
--  ACTIVITY LOGS (also written by triggers)
-- ────────────────────────────────────────────────────────────
create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  user_id uuid references auth.users(id),
  user_name text,
  role app_role,
  action text,
  entity text,
  entity_id text,
  details text,
  created_at timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────
--  SUBSCRIPTIONS / PLANS
-- ────────────────────────────────────────────────────────────
create table if not exists plans (
  id text primary key,        -- starter | growth | enterprise
  name text not null,
  price numeric,
  employees_limit int,
  features jsonb not null default '[]'
);

insert into plans (id, name, price, employees_limit, features) values
  ('starter',   'Starter',   2999, 100,  '["100 employees","Near Miss & Hazard modules","Employee Master","Email notifications","5 GB storage"]'),
  ('growth',    'Growth',    5999, 500,  '["500 employees","All safety modules","Audits & Inspections","Training management","Analytics & reports"]'),
  ('enterprise','Enterprise', null, null, '["Unlimited employees","Multi-site & contractors","API access & SSO","AI features (future)","SLA & onboarding"]')
on conflict (id) do nothing;

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  plan_id text not null references plans(id),
  status text not null default 'active',
  starts_at date default current_date,
  ends_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════════
--  ROW LEVEL SECURITY — every tenant-scoped table
--  Pattern: read = same company · write = same company + role gate
-- ═══════════════════════════════════════════════════════════════

create or replace function app.is_company_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select app.current_role() in ('super_admin','company_admin')
$$;

-- Helper that applies the standard tenant policy set to a table
-- Writes are role-gated: staff (admins/officers/supervisors) may edit;
-- employees/guests may only read (and, on report tables, insert).
do $$ declare t text;
begin
  -- Tables any authenticated employee may insert into (reporting flow)
  foreach t in array array[
    'near_misses','hazards','grievances','documents'
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

  -- Staff-only tables (master data, incidents, audits, inspections, …)
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

-- Profiles: users see their own profile + colleagues in same tenant;
-- super admin sees everyone.
alter table profiles enable row level security;
create policy "profiles select" on profiles for select
  using (company_id = app.current_company_id() or user_id = auth.uid() or app.current_role() = 'super_admin');
create policy "profiles insert" on profiles for insert
  with check (company_id = app.current_company_id());
-- Self-service edits may update name/phone only: role & company stay locked.
-- Company admins may change profiles within their own tenant; super admin anywhere.
create policy "profiles update" on profiles for update
  using (user_id = auth.uid() or app.is_admin())
  with check (
    (user_id = auth.uid()
      and role = (select p.role from profiles p where p.user_id = auth.uid())
      and company_id = (select p.company_id from profiles p where p.user_id = auth.uid()))
    or app.current_role() = 'super_admin'
    or (app.current_role() = 'company_admin' and company_id = app.current_company_id())
  );

-- Companies: super admins manage; everyone reads their own tenant row.
alter table companies enable row level security;
create policy "companies read own" on companies for select
  using (id = app.current_company_id() or app.current_role() = 'super_admin');
create policy "companies manage" on companies for all
  using (app.current_role() = 'super_admin')
  with check (app.current_role() = 'super_admin');

-- Notifications: recipient or tenant admins.
alter table notifications enable row level security;
create policy "notifications select" on notifications for select
  using (company_id = app.current_company_id()
    and (user_id = auth.uid() or role = app.current_role() or user_id is null));
create policy "notifications insert" on notifications for insert
  with check (company_id = app.current_company_id());
create policy "notifications update" on notifications for update
  using (company_id = app.current_company_id() and user_id = auth.uid());

-- Activity logs: readable by tenant admins only; written by triggers.
alter table activity_logs enable row level security;
create policy "logs select" on activity_logs for select
  using (company_id = app.current_company_id() and app.is_company_admin());
create policy "logs insert" on activity_logs for insert
  with check (company_id = app.current_company_id());

-- Plans: public read. Subscriptions: super admin only.
alter table plans enable row level security;
create policy "plans public" on plans for select using (true);

-- Subscriptions: company admins manage their OWN tenant; super admin all.
alter table subscriptions enable row level security;
create policy "subs select" on subscriptions for select
  using (app.current_role() = 'super_admin' or company_id = app.current_company_id());
create policy "subs insert" on subscriptions for insert
  with check (app.current_role() = 'super_admin'
    or (app.current_role() = 'company_admin' and company_id = app.current_company_id()));
create policy "subs update" on subscriptions for update
  using (app.current_role() = 'super_admin'
    or (app.current_role() = 'company_admin' and company_id = app.current_company_id()))
  with check (app.current_role() = 'super_admin'
    or (app.current_role() = 'company_admin' and company_id = app.current_company_id()));
create policy "subs delete" on subscriptions for delete
  using (app.current_role() = 'super_admin'
    or (app.current_role() = 'company_admin' and company_id = app.current_company_id()));

-- ═══════════════════════════════════════════════════════════════
--  AUDIT TRIGGER — writes activity_logs on every DML
-- ═══════════════════════════════════════════════════════════════
create or replace function app.audit_trigger_fn()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  _company uuid;
  _entity text;
  _action text;
begin
  _company := coalesce(new.company_id, old.company_id);
  _entity := tg_table_name;
  _action := case tg_op when 'INSERT' then 'Created' when 'UPDATE' then 'Updated' else 'Deleted' end;
  insert into activity_logs (company_id, user_id, user_name, role, action, entity, entity_id, details)
  values (
    _company, auth.uid(),
    coalesce((select full_name from profiles p where p.user_id = auth.uid()), 'system'),
    coalesce(app.current_role(), 'guest'),
    _action, _entity, coalesce(new.id::text, old.id::text),
    _action || ' ' || _entity
  );
  return coalesce(new, old);
end $$;

do $$ declare t text;
begin
  foreach t in array array[
    'employees','near_misses','hazards','incidents','grievances',
    'capas','audits','documents','ppe_issues','vehicle_inspections',
    'tool_inspections','training_sessions'
  ]
  loop
    execute format('drop trigger if exists trg_audit_%1$s on %1$I', t);
    execute format(
      'create trigger trg_audit_%1$s after insert or update or delete on %1$I
       for each row execute function app.audit_trigger_fn()', t);
  end loop;
end $$;

-- ═══════════════════════════════════════════════════════════════
--  SOFT DELETE
--  Prefer `update … set deleted_at = now()` from the app instead of
--  hard DELETE — all read policies already filter `deleted_at is null`.
--  Hard DELETE is restricted to tenant admins by policy.
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
--  AUTO updated_at
-- ═══════════════════════════════════════════════════════════════
create or replace function app.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

do $$ declare t text;
begin
  foreach t in array array[
    'companies','profiles','employees','departments','contractors','locations',
    'vendors','capas','near_misses','hazards','incidents','grievances',
    'training_programs','training_sessions','audits','audit_findings','documents',
    'ppe_catalog','ppe_issues','ppe_stock','vehicle_inspections','tool_inspections'
  ]
  loop
    execute format('drop trigger if exists trg_touch_%1$s on %1$I', t);
    execute format('create trigger trg_touch_%1$s before update on %1$I
      for each row execute function app.touch_updated_at()', t);
  end loop;
end $$;

-- ═══════════════════════════════════════════════════════════════
--  SIGNUP TRIGGER — auto-create profile when a user is created
--  Role + company are read from raw_app_meta_data only (server-set by
--  the Auth admin API). Client-supplied raw_user_meta_data is NEVER
--  trusted for privileges — self-signups get role 'employee' and no
--  tenant until an admin assigns one.
-- ═══════════════════════════════════════════════════════════════
create or replace function app.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  _company uuid;
  _role app_role;
begin
  -- SECURITY: role/company must NEVER come from client-controlled
  -- raw_user_meta_data (self-signup). They are read from
  -- raw_app_meta_data, which only the Auth server / admin API sets.
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

  -- No company assigned → user is created without tenant access until an
  -- admin assigns company_id + role (profiles UPDATE via admin or SQL).
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app.handle_new_user();

-- ═══════════════════════════════════════════════════════════════
--  STORAGE BUCKETS (per-tenant folders)
-- ═══════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('safety-media', 'safety-media', false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;

-- CSMS Documents — auto-generated Near Miss investigation reports
-- (PDF & DOCX) saved under csms-documents/{company slug}/Near Miss/{year}/{month}/
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('csms-documents', 'csms-documents', true, 10485760, array['image/jpeg','image/png','image/webp','application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/msword'])
on conflict (id) do nothing;

create policy "csms docs read" on storage.objects for select
  using (bucket_id = 'csms-documents');
create policy "csms docs write" on storage.objects for insert
  with check (bucket_id = 'csms-documents'
    and (storage.foldername(name))[1] = (select slug from companies where id = app.current_company_id()));
create policy "csms docs update" on storage.objects for update
  using (bucket_id = 'csms-documents'
    and (storage.foldername(name))[1] = (select slug from companies where id = app.current_company_id()));
create policy "csms docs delete" on storage.objects for delete
  using (bucket_id = 'csms-documents'
    and (storage.foldername(name))[1] = (select slug from companies where id = app.current_company_id()));

create policy "tenant media read" on storage.objects for select
  using (bucket_id = 'safety-media'
    and (storage.foldername(name))[1] = (select slug from companies where id = app.current_company_id()));
create policy "tenant media write" on storage.objects for insert
  with check (bucket_id = 'safety-media'
    and (storage.foldername(name))[1] = (select slug from companies where id = app.current_company_id()));
create policy "tenant media update" on storage.objects for update
  using (bucket_id = 'safety-media'
    and (storage.foldername(name))[1] = (select slug from companies where id = app.current_company_id()));
create policy "tenant media delete" on storage.objects for delete
  using (bucket_id = 'safety-media'
    and (storage.foldername(name))[1] = (select slug from companies where id = app.current_company_id()));

-- ═══════════════════════════════════════════════════════════════
--  SEED NOTES
--  This schema is intentionally data-free. Run supabase/seed.sql
--  afterwards to create the demo tenants, users and sample data.
-- ═══════════════════════════════════════════════════════════════

-- Create a matching auth user manually in Authentication → Users,
-- then link it here:
-- insert into profiles (user_id, company_id, role, full_name)
-- values ('<auth-user-uuid>', (select id from companies where slug='emveess'), 'company_admin', 'Anitha Kumar');

-- Create the super admin profile after creating a super-admin auth user:
-- insert into profiles (user_id, company_id, role, full_name)
-- values ('<auth-user-uuid>', (select id from companies where slug='emveess'), 'super_admin', 'Rajesh Iyer');
