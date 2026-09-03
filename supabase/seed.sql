-- ═══════════════════════════════════════════════════════════════
--  SafetyOS — SEED DATA (run AFTER schema.sql)
--  Creates: 3 tenants, 6 demo users (password: demo1234),
--  and realistic sample data for the "emveess" tenant.
--
--  ⚠ Run in the Supabase SQL Editor after schema.sql.
--  Idempotent: safe to re-run (cleans previous demo data first).
--  Demo users will be email-confirmed and ready to sign in.
-- ═══════════════════════════════════════════════════════════════

-- ── Clean slate for demo data (idempotent re-run) ─────────────
-- Deleting demo auth users cascades to auth.identities & profiles.
delete from notifications where company_id in ('f0000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000002','f0000000-0000-4000-8000-000000000003');
delete from employee_documents where company_id in ('f0000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000002','f0000000-0000-4000-8000-000000000003');
delete from employee_trainings where company_id in ('f0000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000002','f0000000-0000-4000-8000-000000000003');
delete from employee_medical where company_id in ('f0000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000002','f0000000-0000-4000-8000-000000000003');
delete from employee_violations where company_id in ('f0000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000002','f0000000-0000-4000-8000-000000000003');
delete from employee_rewards where company_id in ('f0000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000002','f0000000-0000-4000-8000-000000000003');
delete from ppe_issues where company_id in ('f0000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000002','f0000000-0000-4000-8000-000000000003');
delete from near_misses where company_id in ('f0000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000002','f0000000-0000-4000-8000-000000000003');
delete from hazards where company_id in ('f0000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000002','f0000000-0000-4000-8000-000000000003');
delete from incident_investigations where company_id in ('f0000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000002','f0000000-0000-4000-8000-000000000003');
delete from incidents where company_id in ('f0000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000002','f0000000-0000-4000-8000-000000000003');
delete from grievances where company_id in ('f0000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000002','f0000000-0000-4000-8000-000000000003');
delete from capas where company_id in ('f0000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000002','f0000000-0000-4000-8000-000000000003');
delete from audit_findings where company_id in ('f0000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000002','f0000000-0000-4000-8000-000000000003');
delete from audits where company_id in ('f0000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000002','f0000000-0000-4000-8000-000000000003');
delete from training_nominations where company_id in ('f0000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000002','f0000000-0000-4000-8000-000000000003');
delete from training_sessions where company_id in ('f0000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000002','f0000000-0000-4000-8000-000000000003');
delete from training_programs where company_id in ('f0000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000002','f0000000-0000-4000-8000-000000000003');
delete from ppe_stock where company_id in ('f0000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000002','f0000000-0000-4000-8000-000000000003');
delete from ppe_catalog where company_id in ('f0000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000002','f0000000-0000-4000-8000-000000000003');
delete from vehicle_inspections where company_id in ('f0000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000002','f0000000-0000-4000-8000-000000000003');
delete from tool_inspections where company_id in ('f0000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000002','f0000000-0000-4000-8000-000000000003');
delete from documents where company_id in ('f0000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000002','f0000000-0000-4000-8000-000000000003');
delete from employees where company_id in ('f0000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000002','f0000000-0000-4000-8000-000000000003');
delete from departments where company_id in ('f0000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000002','f0000000-0000-4000-8000-000000000003');
delete from locations where company_id in ('f0000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000002','f0000000-0000-4000-8000-000000000003');
delete from contractors where company_id in ('f0000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000002','f0000000-0000-4000-8000-000000000003');
delete from vendors where company_id in ('f0000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000002','f0000000-0000-4000-8000-000000000003');
delete from activity_logs where company_id in ('f0000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000002','f0000000-0000-4000-8000-000000000003');
delete from auth.users where email like '%@demo.com';
delete from subscriptions where company_id in ('f0000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000002','f0000000-0000-4000-8000-000000000003');
delete from companies where slug in ('emveess','revathi','abc');

-- ── Tenants ──────────────────────────────────────────────────
insert into companies (id, name, slug, industry, plan, employees_limit, brand_color, status, city)
values
  ('f0000000-0000-4000-8000-000000000001', 'Emveess Industries Pvt Ltd', 'emveess', 'Manufacturing', 'enterprise', 99999, '#2563eb', 'active', 'Chennai, TN'),
  ('f0000000-0000-4000-8000-000000000002', 'Revathi Steels Ltd',            'revathi',  'Steel Plant',   'growth',     500,   '#0d9488', 'active', 'Visakhapatnam, AP'),
  ('f0000000-0000-4000-8000-000000000003', 'ABC Logistics & Warehousing',    'abc',      'Logistics',     'starter',    100,   '#7c3aed', 'trial',  'Pune, MH')
on conflict (slug) do nothing;

insert into subscriptions (company_id, plan_id, status)
values
  ('f0000000-0000-4000-8000-000000000001', 'enterprise', 'active'),
  ('f0000000-0000-4000-8000-000000000002', 'growth',     'active'),
  ('f0000000-0000-4000-8000-000000000003', 'starter',    'trial');

-- ── Demo auth users (password: demo1234) ─────────────────────
-- The on_auth_user_created trigger is temporarily disabled so we can
-- assign explicit profile ids (= auth user ids) for easy FK linking.
alter table auth.users disable trigger on_auth_user_created;

insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
   raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
   confirmation_token, recovery_token, email_change_token_new, email_change)
values
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
   'superadmin@demo.com', crypt('demo1234', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Rajesh Iyer","role":"super_admin","company_slug":"emveess"}',
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated',
   'admin@demo.com', crypt('demo1234', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Anitha Kumar","role":"company_admin","company_slug":"emveess"}',
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated',
   'officer@demo.com', crypt('demo1234', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Karthik Selvam","role":"safety_officer","company_slug":"emveess"}',
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated',
   'supervisor@demo.com', crypt('demo1234', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Mahesh Rao","role":"supervisor","company_slug":"emveess"}',
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000005', 'authenticated', 'authenticated',
   'employee@demo.com', crypt('demo1234', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Suresh Babu","role":"employee","company_slug":"emveess"}',
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000006', 'authenticated', 'authenticated',
   'guest@demo.com', crypt('demo1234', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Site Visitor","role":"guest","company_slug":"emveess"}',
   now(), now(), '', '', '', '');

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select id, id, id,
       jsonb_build_object('sub', id::text, 'email', email),
       'email', now(), now(), now()
from auth.users
where email like '%@demo.com'
  and not exists (select 1 from auth.identities where identities.user_id = users.id);

-- ── Profiles (links auth users to tenant + role) ─────────────
-- id == auth user id, so FK references below stay readable.
-- Upsert on user_id: also works if the on_auth_user_created trigger
-- already created a profile for these users.
insert into profiles (id, user_id, company_id, role, full_name, designation)
values
  ('10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001', 'super_admin',   'Rajesh Iyer',    'Platform Owner'),
  ('10000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000001', 'company_admin', 'Anitha Kumar',   'Plant Head'),
  ('10000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003', 'f0000000-0000-4000-8000-000000000001', 'safety_officer', 'Karthik Selvam', 'Safety Officer'),
  ('10000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000004', 'f0000000-0000-4000-8000-000000000001', 'supervisor',    'Mahesh Rao',     'Shift Supervisor'),
  ('10000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000005', 'f0000000-0000-4000-8000-000000000001', 'employee',      'Suresh Babu',    'Operator'),
  ('10000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000006', 'f0000000-0000-4000-8000-000000000001', 'guest',         'Site Visitor',   'Visitor')
on conflict (user_id) do update set
  id = excluded.id,
  company_id = excluded.company_id,
  role = excluded.role,
  full_name = excluded.full_name,
  designation = excluded.designation;

alter table auth.users enable trigger on_auth_user_created;

-- ── Master data (emveess) ────────────────────────────────────
insert into departments (company_id, name) values
  ('f0000000-0000-4000-8000-000000000001', 'Production'),
  ('f0000000-0000-4000-8000-000000000001', 'Maintenance'),
  ('f0000000-0000-4000-8000-000000000001', 'EHS'),
  ('f0000000-0000-4000-8000-000000000001', 'Warehouse'),
  ('f0000000-0000-4000-8000-000000000001', 'Quality'),
  ('f0000000-0000-4000-8000-000000000001', 'HR'),
  ('f0000000-0000-4000-8000-000000000001', 'Logistics');

insert into locations (company_id, name) values
  ('f0000000-0000-4000-8000-000000000001', 'Blast Furnace Area'),
  ('f0000000-0000-4000-8000-000000000001', 'Rolling Mill'),
  ('f0000000-0000-4000-8000-000000000001', 'Assembly Line 2'),
  ('f0000000-0000-4000-8000-000000000001', 'Warehouse A'),
  ('f0000000-0000-4000-8000-000000000001', 'Loading Bay'),
  ('f0000000-0000-4000-8000-000000000001', 'Electrical Substation'),
  ('f0000000-0000-4000-8000-000000000001', 'Paint Shop'),
  ('f0000000-0000-4000-8000-000000000001', 'Admin Block');

insert into contractors (company_id, name, contact_person, phone) values
  ('f0000000-0000-4000-8000-000000000001', 'Sri Lakshmi Contractors', 'Lakshmi Narayanan', '+91 98400 12345'),
  ('f0000000-0000-4000-8000-000000000001', 'KMR Infra Services', 'K. Ravi', '+91 98840 55667');

insert into vendors (company_id, name, contact_person, phone) values
  ('f0000000-0000-4000-8000-000000000001', 'Udyogi Safety', 'Sales Desk', '+91 93300 11122'),
  ('f0000000-0000-4000-8000-000000000001', 'Karam Safety', 'Sales Desk', '+91 93300 33344'),
  ('f0000000-0000-4000-8000-000000000001', '3M', 'Sales Desk', '+91 93300 55566'),
  ('f0000000-0000-4000-8000-000000000001', 'Bata Industrials', 'Sales Desk', '+91 93300 77788');

-- ── Employees (8) ────────────────────────────────────────────
insert into employees
  (company_id, employee_code, name, department_id, designation, blood_group, dob, joining_date, contractor_id, phone, email, emergency_name, emergency_phone, status, search_text)
values
  ('f0000000-0000-4000-8000-000000000001', 'EMV-001', 'Ramesh Kumar',  (select id from departments where name='Production'  limit 1), 'Operator', 'A+', '1988-04-12', '2021-05-03', null, '+91 98400 10001', 'ramesh.kumar@emveess.com', 'Latha K', '+91 81234 00001', 'active', 'EMV-001 Ramesh Kumar Operator Production'),
  ('f0000000-0000-4000-8000-000000000001', 'EMV-002', 'Priya Sharma',  (select id from departments where name='Maintenance' limit 1), 'Fitter', 'B+', '1992-09-21', '2022-01-10', (select id from contractors where name='Sri Lakshmi Contractors' limit 1), '+91 98400 10002', 'priya.sharma@emveess.com', 'Mohan S', '+91 81234 00002', 'active', 'EMV-002 Priya Sharma Fitter Maintenance'),
  ('f0000000-0000-4000-8000-000000000001', 'EMV-003', 'Vikram Singh',  (select id from departments where name='Production'  limit 1), 'Line Supervisor', 'O+', '1985-12-02', '2020-03-16', null, '+91 98400 10003', 'vikram.singh@emveess.com', 'Asha V', '+91 81234 00003', 'active', 'EMV-003 Vikram Singh Line Supervisor Production'),
  ('f0000000-0000-4000-8000-000000000001', 'EMV-004', 'Deepa Nair',    (select id from departments where name='EHS'         limit 1), 'Safety Steward', 'AB+', '1994-06-30', '2023-02-20', null, '+91 98400 10004', 'deepa.nair@emveess.com', 'Dinesh N', '+91 81234 00004', 'active', 'EMV-004 Deepa Nair Safety Steward EHS'),
  ('f0000000-0000-4000-8000-000000000001', 'EMV-005', 'Arun Prasad',   (select id from departments where name='Warehouse'   limit 1), 'Forklift Operator', 'A-', '1990-01-15', '2022-07-04', null, '+91 98400 10005', 'arun.prasad@emveess.com', 'Revathi A', '+91 81234 00005', 'active', 'EMV-005 Arun Prasad Forklift Operator Warehouse'),
  ('f0000000-0000-4000-8000-000000000001', 'EMV-006', 'Lakshmi Devi',  (select id from departments where name='Quality'     limit 1), 'QA Inspector', 'O-', '1996-11-08', '2024-01-22', (select id from contractors where name='KMR Infra Services' limit 1), '+91 98400 10006', 'lakshmi.devi@emveess.com', 'Sekar L', '+91 81234 00006', 'active', 'EMV-006 Lakshmi Devi QA Inspector Quality'),
  ('f0000000-0000-4000-8000-000000000001', 'EMV-007', 'Imran Khan',    (select id from departments where name='Logistics'   limit 1), 'Load Supervisor', 'B-', '1989-03-27', '2021-10-11', null, '+91 98400 10007', 'imran.khan@emveess.com', 'Farida K', '+91 81234 00007', 'active', 'EMV-007 Imran Khan Load Supervisor Logistics'),
  ('f0000000-0000-4000-8000-000000000001', 'EMV-008', 'Sunita Patel',  (select id from departments where name='HR'          limit 1), 'HR Executive', 'A+', '1993-08-19', '2023-06-05', null, '+91 98400 10008', 'sunita.patel@emveess.com', 'Prakash P', '+91 81234 00008', 'active', 'EMV-008 Sunita Patel HR Executive HR');

-- ── Near misses (6) — NEW → UNDER INVESTIGATION → RCA COMPLETED → CLOSED ──
insert into near_misses
  (company_id, report_number, nm_date, nm_time, location_id, department_id, employee_id, description, category, severity, photos, status, assigned_to, immediate_action, root_cause, five_whys, corrective_action, preventive_action, responsible_person, target_date, evidence, report_documents, rejection_reason, capa_id, officer_remarks, timeline, search_text)
values
  ('f0000000-0000-4000-8000-000000000001', 'NM-2026-0001', '2026-07-28', '09:40', (select id from locations where name='Warehouse A' limit 1), (select id from departments where name='Warehouse' limit 1), (select id from employees where employee_code='EMV-005'), 'Pallet stacked on mezzanine edge almost toppled onto the walkway below. Area barricaded immediately.', 'Falling Object', 'High', '[]', 'NEW', null, '', '', '[]', '', '', '', null, '[]', '[]', '', null, '', '[{"date":"2026-07-28","event":"Reported","note":"Near miss report submitted (photo + description + location)","actor":"Arun Prasad"}]', 'NM-2026-0001 Falling Object Warehouse A High'),
  ('f0000000-0000-4000-8000-000000000001', 'NM-2026-0002', '2026-07-15', '14:20', (select id from locations where name='Rolling Mill' limit 1), (select id from departments where name='Production' limit 1), (select id from employees where employee_code='EMV-003'), 'Hydraulic hose leaked near walkway creating slip hazard during shift change.', 'Chemical Exposure', 'Medium', '[]', 'UNDER INVESTIGATION', '10000000-0000-4000-8000-000000000003', 'Area cordoned and cleaned; work stopped.', 'Hose past replacement interval.', '[{"why":"Why did the near miss occur?","answer":"Hydraulic hose failed at the walkway."},{"why":"Why did the hose fail?","answer":"It was past its replacement interval."}]', 'Hose replaced; spill cleaned.', 'PM schedule updated for hose replacement intervals.', 'Mahesh Rao', '2026-09-30', '[]', '[]', '', null, 'Investigation in progress.', '[{"date":"2026-07-15","event":"Reported","note":"Reported via app","actor":"Vikram Singh"},{"date":"2026-07-16","event":"Accepted","note":"Accepted for investigation by safety officer","actor":"Karthik Selvam"}]', 'NM-2026-0002 Chemical Exposure Rolling Mill Medium'),
  ('f0000000-0000-4000-8000-000000000001', 'NM-2026-0003', '2026-06-30', '11:05', (select id from locations where name='Assembly Line 2' limit 1), (select id from departments where name='Production' limit 1), (select id from employees where employee_code='EMV-001'), 'Forklift took a sharp turn close to pedestrian route; operator braked in time.', 'Vehicle Movement', 'Low', '[]', 'RCA COMPLETED', '10000000-0000-4000-8000-000000000003', 'Pedestrian route segregated with barriers.', 'Shared traffic route without physical segregation.', '[{"why":"Why did the near miss occur?","answer":"Forklift entered pedestrian route."},{"why":"Why was the route shared?","answer":"No physical segregation existed."},{"why":"Why was there no segregation?","answer":"Traffic management plan not implemented."},{"why":"Why was the plan not implemented?","answer":"No owner assigned for traffic safety."},{"why":"Why was no owner assigned?","answer":"Responsibility matrix not updated — management of change gap. (root cause)"}]', 'Pedestrian walkway marked with barriers.', 'Traffic management plan under revision.', 'Deepa Nair', '2026-10-15', '[{"label":"Site inspection checklist","type":"pdf","name":"inspection-checklist.pdf","size":184320,"url":"blob:seed"}]', '[]', '', null, 'Controls verified effective.', '[{"date":"2026-06-30","event":"Reported","note":"Reported via app","actor":"Ramesh Kumar"},{"date":"2026-07-01","event":"Accepted","note":"Accepted for investigation by safety officer","actor":"Karthik Selvam"},{"date":"2026-07-05","event":"RCA completed","note":"Root cause analysis completed — 5 why","actor":"Karthik Selvam"}]', 'NM-2026-0003 Vehicle Movement Assembly Line 2 Low'),
  ('f0000000-0000-4000-8000-000000000001', 'NM-2026-0004', '2026-06-12', '16:45', (select id from locations where name='Electrical Substation' limit 1), (select id from departments where name='Maintenance' limit 1), (select id from employees where employee_code='EMV-002'), 'Loose cable gland observed on motor terminal box before energisation.', 'Electrical', 'High', '[]', 'RCA COMPLETED', '10000000-0000-4000-8000-000000000003', 'Motor isolated; gland torque-checked.', 'Incomplete pre-energisation check.', '[{"why":"Why was the gland loose?","answer":"Pre-energisation check was incomplete."},{"why":"Why was the check incomplete?","answer":"Checklist not followed."},{"why":"Why was the checklist not followed?","answer":"No supervisor verification step."},{"why":"Why no verification step?","answer":"Checklist predates task risk assessment."},{"why":"Why was it not updated?","answer":"No review trigger — LOTO rollout delayed. (root cause)"}]', 'Gland tightened and torque-marked.', 'LOTO + pre-energisation checklist rollout.', 'Mahesh Rao', '2026-09-20', '[{"label":"Torque record","type":"pdf","name":"torque-record.pdf","size":102400,"url":"blob:seed"}]', '[]', '', null, 'CAPA raised with maintenance head.', '[{"date":"2026-06-12","event":"Reported","note":"Reported via app","actor":"Priya Sharma"},{"date":"2026-06-13","event":"Accepted","note":"Accepted for investigation by safety officer","actor":"Karthik Selvam"},{"date":"2026-06-20","event":"RCA completed","note":"Root cause analysis completed — 5 why","actor":"Karthik Selvam"}]', 'NM-2026-0004 Electrical Electrical Substation High'),
  ('f0000000-0000-4000-8000-000000000001', 'NM-2026-0005', '2026-05-22', '10:10', (select id from locations where name='Paint Shop' limit 1), (select id from departments where name='Production' limit 1), (select id from employees where employee_code='EMV-001'), 'Solvent drum left unsealed near ignition source; shift supervisor intervened.', 'Fire / Smoke', 'Critical', '[]', 'CLOSED', '10000000-0000-4000-8000-000000000003', 'Drums resealed; ignition source isolated.', 'Inadequate chemical handling discipline.', '[{"why":"Why was the drum unsealed?","answer":"Operator left it open after use."},{"why":"Why was it left open?","answer":"No closing step in the work instruction."},{"why":"Why no closing step?","answer":"Work instruction not updated."},{"why":"Why not updated?","answer":"No periodic review of chemical SOPs."},{"why":"Why no periodic review?","answer":"Chemical handling refresher training gap. (root cause)"}]', 'Drums resealed; storage plan revised.', 'Chemical handling refresher training.', 'Deepa Nair', '2026-08-30', '[{"label":"Chemical storage audit","type":"pdf","name":"storage-audit.pdf","size":204800,"url":"blob:seed"}]', '[{"name":"NM-2026-0005.pdf","format":"pdf","path":"Near Miss/2026/May/NM-2026-0005.pdf","url":"#","saved_at":"2026-06-11T10:00:00Z"},{"name":"NM-2026-0005.docx","format":"docx","path":"Near Miss/2026/May/NM-2026-0005.docx","url":"#","saved_at":"2026-06-11T10:00:00Z"}]', '', null, 'Closed after effectiveness check.', '[{"date":"2026-05-22","event":"Reported","note":"Reported via app","actor":"Ramesh Kumar"},{"date":"2026-05-28","event":"RCA completed","note":"Root cause analysis completed — 5 why","actor":"Karthik Selvam"},{"date":"2026-06-10","event":"Approved & closed","note":"Safety officer approved; report generated (PDF + DOCX)","actor":"Karthik Selvam"},{"date":"2026-06-11","event":"Report generated","note":"Near Miss Investigation Report saved to CSMS Documents","actor":"System"}]', 'NM-2026-0005 Fire Smoke Paint Shop Critical'),
  ('f0000000-0000-4000-8000-000000000001', 'NM-2026-0006', '2026-08-06', '08:55', (select id from locations where name='Loading Bay' limit 1), (select id from departments where name='Logistics' limit 1), (select id from employees where employee_code='EMV-007'), 'Sling strap with visible cut marks was picked up for lifting before inspection.', 'Equipment Failure', 'Medium', '[]', 'NEW', null, '', '', '[]', '', '', '', null, '[]', '[]', '', null, '', '[{"date":"2026-08-06","event":"Reported","note":"Near miss report submitted (photo + description + location)","actor":"Imran Khan"}]', 'NM-2026-0006 Equipment Failure Loading Bay Medium');

-- ── Hazards (4) ──────────────────────────────────────────────
insert into hazards
  (company_id, hazard_code, location_id, risk_level, hazard_type, description, photos, assigned_officer, corrective_action, status, reported_by, reported_on, history, search_text)
values
  ('f0000000-0000-4000-8000-000000000001', 'HZ-2026-0001', (select id from locations where name='Paint Shop' limit 1), 'High', 'Chemical', 'Incompatible chemicals stored adjacent without segregation as per MSDS.', '[]', '10000000-0000-4000-8000-000000000003', '', 'In Progress', '10000000-0000-4000-8000-000000000004', '2026-07-20', '[{"date":"2026-07-20","from":"—","to":"Open","note":"Hazard reported","actor":"Mahesh Rao"}]', 'HZ-2026-0001 Chemical Paint Shop High'),
  ('f0000000-0000-4000-8000-000000000001', 'HZ-2026-0002', (select id from locations where name='Blast Furnace Area' limit 1), 'Extreme', 'Fire', 'Accumulated slag dust near furnace tuyeres; spontaneous ignition risk.', '[]', '10000000-0000-4000-8000-000000000003', 'Dust extraction repaired and area cleaned.', 'Mitigated', '10000000-0000-4000-8000-000000000003', '2026-06-18', '[{"date":"2026-06-18","from":"—","to":"Open","note":"Hazard reported","actor":"Karthik Selvam"},{"date":"2026-07-02","from":"Open","to":"Mitigated","note":"Controls verified","actor":"Karthik Selvam"}]', 'HZ-2026-0002 Fire Blast Furnace Area Extreme'),
  ('f0000000-0000-4000-8000-000000000001', 'HZ-2026-0003', (select id from locations where name='Assembly Line 2' limit 1), 'Medium', 'Ergonomic', 'Repetitive manual lifting at packing station without mechanical aids.', '[]', '10000000-0000-4000-8000-000000000003', '', 'Open', '10000000-0000-4000-8000-000000000005', '2026-07-29', '[{"date":"2026-07-29","from":"—","to":"Open","note":"Hazard reported","actor":"Suresh Babu"}]', 'HZ-2026-0003 Ergonomic Assembly Line 2 Medium'),
  ('f0000000-0000-4000-8000-000000000001', 'HZ-2026-0004', (select id from locations where name='Electrical Substation' limit 1), 'High', 'Electrical', 'Damaged insulation on LV feeder cable observed during walkdown.', '[]', '10000000-0000-4000-8000-000000000003', 'Cable replaced and megger tested.', 'Closed', '10000000-0000-4000-8000-000000000004', '2026-05-11', '[{"date":"2026-05-11","from":"—","to":"Open","note":"Hazard reported","actor":"Mahesh Rao"},{"date":"2026-05-20","from":"Open","to":"Closed","note":"Replaced and tested","actor":"Karthik Selvam"}]', 'HZ-2026-0004 Electrical Substation High');

-- ── Incidents (3) + investigations ───────────────────────────
insert into incidents
  (company_id, incident_number, inc_date, inc_time, location_id, department_id, type, severity, description, reported_by, injured_person, injury_type, lost_days, status, timeline, search_text)
values
  ('f0000000-0000-4000-8000-000000000001', 'INC-2026-0001', '2026-06-14', '13:30', (select id from locations where name='Assembly Line 2' limit 1), (select id from departments where name='Production' limit 1), 'MTC', 'High', 'Operator injured while clearing jam on conveyor with interlock bypassed.', 'Shift Incharge', (select id from employees where employee_code='EMV-001'), 'Crush injury — finger', 4, 'Investigation Done', '[{"date":"2026-06-14","event":"Incident Reported","note":"Reported by shift incharge","actor":"Shift Incharge"}]', 'INC-2026-0001 MTC Assembly Line 2 High'),
  ('f0000000-0000-4000-8000-000000000001', 'INC-2026-0002', '2026-05-02', '11:15', (select id from locations where name='Rolling Mill' limit 1), (select id from departments where name='Production' limit 1), 'First Aid', 'Low', 'Minor burn from contact with hot billet during inspection.', 'Supervisor', (select id from employees where employee_code='EMV-003'), 'Burn — minor', 0, 'Closed', '[{"date":"2026-05-02","event":"Incident Reported","note":"Reported by supervisor","actor":"Supervisor"}]', 'INC-2026-0002 First Aid Rolling Mill Low'),
  ('f0000000-0000-4000-8000-000000000001', 'INC-2026-0003', '2026-07-19', '16:50', (select id from locations where name='Warehouse A' limit 1), (select id from departments where name='Warehouse' limit 1), 'Property Damage', 'Medium', 'Racking column bent by forklift impact; no injuries.', 'Warehouse Lead', null, null, 0, 'Under Investigation', '[{"date":"2026-07-19","event":"Incident Reported","note":"Reported by warehouse lead","actor":"Warehouse Lead"}]', 'INC-2026-0003 Property Damage Warehouse A Medium');

insert into incident_investigations
  (company_id, incident_id, investigator, summary, immediate_causes, five_whys, fishbone, corrective_actions, preventive_actions, evidence)
values
  ('f0000000-0000-4000-8000-000000000001',
   (select id from incidents where incident_number='INC-2026-0001'),
   '10000000-0000-4000-8000-000000000003',
   'Investigation completed. Root causes identified and CAPA actions tracked to closure.',
   '["Bypassing of standard operating procedure","Inadequate supervision at the time of task"]',
   '[{"why":"Why 1 — Why did the incident happen?","answer":"Employee was exposed to an unguarded moving part while clearing a jam."},{"why":"Why 2 — Why was the guard open?","answer":"The interlock switch was found manually bypassed to speed up production."},{"why":"Why 3 — Why was bypassing tolerated?","answer":"Supervisors were under pressure to meet shift targets."},{"why":"Why 4 — Why was there no check?","answer":"No pre-shift verification of machine interlocks was defined in the SOP."},{"why":"Why 5 — Why did the SOP miss it?","answer":"SOP was last reviewed 3 years ago without interlock hazard review."}]',
   '[{"category":"Man","causes":["Operator shortcut behaviour","Fatigue — extended shift"]},{"category":"Machine","causes":["Interlock bypassed","Guard not interlocked with drive"]},{"category":"Method","causes":["SOP outdated","No pre-shift interlock check"]},{"category":"Material","causes":["Jam-prone raw material batch"]},{"category":"Measurement","causes":["No audit of interlocks in PM plan"]},{"category":"Environment","causes":["Poor lighting near machine","Congested work area"]}]',
   '[{"action":"Restore and re-interlock all machine guards","owner":"Maintenance","due":"2026-08-30","status":"Done"},{"action":"Counsel all operators on bypass prohibition","owner":"HR","due":"2026-08-20","status":"Done"}]',
   '[{"action":"Add interlock verification to daily pre-shift checklist","owner":"Production","due":"2026-09-15","status":"In Progress"},{"action":"Review machine SOPs with HIRA every 2 years","owner":"EHS","due":"2026-10-01","status":"Open"}]',
   '[{"label":"Incident Photos","type":"photo"},{"label":"Witness Statements","type":"doc"},{"label":"CCTV Footage","type":"video"}]');

-- ── Grievances (3) ───────────────────────────────────────────
insert into grievances
  (company_id, grievance_number, employee_id, department_id, category, subject, description, status, officer_id, action_taken, employee_ack, filed_on, resolved_on, anonymous)
values
  ('f0000000-0000-4000-8000-000000000001', 'GRV-2026-0001', (select id from employees where employee_code='EMV-005'), (select id from departments where name='Warehouse' limit 1), 'Workplace Safety', 'Request for better lighting at Dock 1', 'Night shift loading area lighting is inadequate; submitted through SafetyOS app.', 'In Action', '10000000-0000-4000-8000-000000000002', 'Site survey completed; quotation for additional floodlights in approval.', false, '2026-07-25', null, false),
  ('f0000000-0000-4000-8000-000000000001', 'GRV-2026-0002', (select id from employees where employee_code='EMV-001'), (select id from departments where name='Production' limit 1), 'PPE Quality', 'Safety shoes worn out faster than expected', 'Request to review shoe quality/standard issued under contract.', 'Resolved', '10000000-0000-4000-8000-000000000002', 'Vendor replacement approved; new batch issued to affected employees.', true, '2026-06-02', '2026-06-20', false),
  ('f0000000-0000-4000-8000-000000000001', 'GRV-2026-0003', null, (select id from departments where name='Production' limit 1), 'Welfare Facilities', 'Drinking water availability at shopfloor', 'Water cooler near Blast Furnace area frequently empty during summer.', 'Open', '10000000-0000-4000-8000-000000000002', '', false, '2026-08-02', null, true);

-- ── CAPAs (3) ────────────────────────────────────────────────
insert into capas (company_id, capa_number, source_type, source_id, description, owner_id, due_date, status, actions)
values
  ('f0000000-0000-4000-8000-000000000001', 'CAPA-2026-001', 'Incident', (select id from incidents where incident_number='INC-2026-0001'), 'Eliminate interlock bypassing on assembly line machines.', '10000000-0000-4000-8000-000000000003', '2026-09-10', 'In Progress', '[{"action":"Re-interlock all guards","done":true},{"action":"Pre-shift interlock check","done":false},{"action":"SOP revision","done":false}]'),
  ('f0000000-0000-4000-8000-000000000001', 'CAPA-2026-002', 'Hazard', (select id from hazards where hazard_code='HZ-2026-0001'), 'Chemical storage segregation as per MSDS compatibility.', '10000000-0000-4000-8000-000000000003', '2026-08-18', 'In Progress', '[{"action":"Segregate incompatible chemicals","done":true},{"action":"Update storage plan","done":false}]'),
  ('f0000000-0000-4000-8000-000000000001', 'CAPA-2026-003', 'Near Miss', (select id from near_misses where report_number='NM-2026-0004'), 'Prevent recurrence of loose cable gland near miss at substation.', '10000000-0000-4000-8000-000000000003', '2026-08-28', 'Open', '[{"action":"LOTO checklist rollout","done":false}]');

-- ── Training ─────────────────────────────────────────────────
insert into training_programs (company_id, title, category, trainer, duration_hours, validity_months, description) values
  ('f0000000-0000-4000-8000-000000000001', 'Fire Safety & Evacuation', 'Emergency Response', 'Karthik Selvam', 4, 12, 'Classroom + practical fire safety and evacuation training.'),
  ('f0000000-0000-4000-8000-000000000001', 'Working at Height', 'Technical Safety', 'External — NIST Institute', 8, 24, 'Full working at height competency course with harness practical.'),
  ('f0000000-0000-4000-8000-000000000001', 'Electrical Safety & LOTO', 'Technical Safety', 'Karthik Selvam', 6, 24, 'Electrical safety, isolation and lockout tagout procedures.'),
  ('f0000000-0000-4000-8000-000000000001', 'Confined Space Entry', 'Technical Safety', 'External — NIST Institute', 8, 24, 'Confined space entry, gas testing and rescue awareness.');

insert into training_sessions (company_id, program_id, session_date, session_time, venue, trainer, status, capacity, pre_avg, post_avg) values
  ('f0000000-0000-4000-8000-000000000001', (select id from training_programs where title='Fire Safety & Evacuation' limit 1), '2026-06-10', '10:00', 'Training Hall A', 'Karthik Selvam', 'Completed', 15, 52, 84),
  ('f0000000-0000-4000-8000-000000000001', (select id from training_programs where title='Working at Height' limit 1), '2026-07-08', '09:30', 'Conference Room', 'External — NIST Institute', 'Completed', 12, 48, 78),
  ('f0000000-0000-4000-8000-000000000001', (select id from training_programs where title='Electrical Safety & LOTO' limit 1), '2026-07-22', '10:00', 'Shopfloor Classroom', 'Karthik Selvam', 'Completed', 15, 55, 82),
  ('f0000000-0000-4000-8000-000000000001', (select id from training_programs where title='Confined Space Entry' limit 1), '2026-08-24', '09:30', 'Training Hall A', 'External — NIST Institute', 'Scheduled', 15, null, null);

-- ── PPE catalog + stock + issues ─────────────────────────────
insert into ppe_catalog (company_id, name, category, standard, validity_months) values
  ('f0000000-0000-4000-8000-000000000001', 'Safety Helmet', 'Head Protection', 'IS 2925', 36),
  ('f0000000-0000-4000-8000-000000000001', 'Safety Shoes', 'Foot Protection', 'IS 15298', 24),
  ('f0000000-0000-4000-8000-000000000001', 'Safety Goggles', 'Eye Protection', 'IS 5983', 24),
  ('f0000000-0000-4000-8000-000000000001', 'Leather Hand Gloves', 'Hand Protection', 'IS 2573', 12),
  ('f0000000-0000-4000-8000-000000000001', 'Full Body Harness', 'Fall Protection', 'IS 3521', 36),
  ('f0000000-0000-4000-8000-000000000001', 'High-Vis Vest', 'Visibility', 'IS 15809', 12);

insert into ppe_stock (company_id, ppe_id, quantity, reorder_level, cost_per_unit, vendor_id) values
  ('f0000000-0000-4000-8000-000000000001', (select id from ppe_catalog where name='Safety Helmet' limit 1), 86, 25, 420, (select id from vendors where name='Udyogi Safety' limit 1)),
  ('f0000000-0000-4000-8000-000000000001', (select id from ppe_catalog where name='Safety Shoes' limit 1), 54, 20, 1250, (select id from vendors where name='Bata Industrials' limit 1)),
  ('f0000000-0000-4000-8000-000000000001', (select id from ppe_catalog where name='Safety Goggles' limit 1), 18, 20, 180, (select id from vendors where name='3M' limit 1)),
  ('f0000000-0000-4000-8000-000000000001', (select id from ppe_catalog where name='Leather Hand Gloves' limit 1), 210, 60, 95, (select id from vendors where name='Karam Safety' limit 1)),
  ('f0000000-0000-4000-8000-000000000001', (select id from ppe_catalog where name='Full Body Harness' limit 1), 4, 8, 3200, (select id from vendors where name='Karam Safety' limit 1)),
  ('f0000000-0000-4000-8000-000000000001', (select id from ppe_catalog where name='High-Vis Vest' limit 1), 75, 25, 150, (select id from vendors where name='Udyogi Safety' limit 1));

insert into ppe_issues (company_id, employee_id, ppe_id, issue_date, expiry_date, status, cost, vendor_id, last_inspection, condition) values
  ('f0000000-0000-4000-8000-000000000001', (select id from employees where employee_code='EMV-001'), (select id from ppe_catalog where name='Safety Helmet' limit 1), '2026-01-12', '2028-01-12', 'Issued', 420, (select id from vendors where name='Udyogi Safety' limit 1), '2026-06-01', 'Good'),
  ('f0000000-0000-4000-8000-000000000001', (select id from employees where employee_code='EMV-001'), (select id from ppe_catalog where name='Safety Shoes' limit 1), '2026-01-12', '2027-11-01', 'Issued', 1250, (select id from vendors where name='Bata Industrials' limit 1), '2026-06-01', 'Good'),
  ('f0000000-0000-4000-8000-000000000001', (select id from employees where employee_code='EMV-005'), (select id from ppe_catalog where name='High-Vis Vest' limit 1), '2025-12-05', '2026-12-05', 'Issued', 150, (select id from vendors where name='Udyogi Safety' limit 1), '2026-05-15', 'Fair'),
  ('f0000000-0000-4000-8000-000000000001', (select id from employees where employee_code='EMV-002'), (select id from ppe_catalog where name='Leather Hand Gloves' limit 1), '2026-02-20', '2027-02-20', 'Issued', 95, (select id from vendors where name='Karam Safety' limit 1), null, 'Good'),
  ('f0000000-0000-4000-8000-000000000001', (select id from employees where employee_code='EMV-004'), (select id from ppe_catalog where name='Full Body Harness' limit 1), '2026-03-10', '2029-03-10', 'Issued', 3200, (select id from vendors where name='Karam Safety' limit 1), '2026-07-01', 'Good');

-- ── Vehicle & tool inspections ───────────────────────────────
insert into vehicle_inspections (company_id, vehicle_number, vehicle_type, inspection_date, driver, checklist, defects, photos, inspected_by, approved_by, status, remarks) values
  ('f0000000-0000-4000-8000-000000000001', 'TN-05-AB-1234', 'Forklift', '2026-08-05', 'Arun Prasad',
   '[{"item":"Brakes & steering","ok":true,"remark":""},{"item":"Horn & reverse alarm","ok":true,"remark":""},{"item":"Lights & indicators","ok":true,"remark":""},{"item":"Tyres condition","ok":true,"remark":""},{"item":"Hydraulic leaks","ok":true,"remark":""},{"item":"Fire extinguisher","ok":false,"remark":"Seal broken"}]',
   '["Fire extinguisher"]', '[]', '10000000-0000-4000-8000-000000000004', null, 'Pending Approval', '1 defect(s) found — follow-up required.'),
  ('f0000000-0000-4000-8000-000000000001', 'TN-05-CD-5678', 'Hydra Crane', '2026-08-04', 'Prakash Yadav',
   '[{"item":"Brakes & steering","ok":true,"remark":""},{"item":"Horn & reverse alarm","ok":true,"remark":""},{"item":"Lights & indicators","ok":true,"remark":""},{"item":"Tyres condition","ok":true,"remark":""},{"item":"Hydraulic leaks","ok":true,"remark":""},{"item":"Fire extinguisher","ok":true,"remark":""}]',
   '[]', '[]', '10000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000003', 'Approved', 'Vehicle found fit for operation.'),
  ('f0000000-0000-4000-8000-000000000001', 'TN-09-EF-9012', 'Truck', '2026-07-28', 'Ganesh Murthy',
   '[{"item":"Brakes & steering","ok":true,"remark":""},{"item":"Horn & reverse alarm","ok":true,"remark":""},{"item":"Lights & indicators","ok":true,"remark":""},{"item":"Tyres condition","ok":false,"remark":"Rear tyre worn"}]',
   '["Tyres condition"]', '[]', '10000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000003', 'Approved', 'Tyre replacement scheduled.');

insert into tool_inspections (company_id, tool_name, tool_code, category, inspection_date, checklist, photos, status, remarks, inspector) values
  ('f0000000-0000-4000-8000-000000000001', 'Pedestal Grinder', 'TL-01-EMV', 'Power Tool', '2026-08-01', '[{"item":"Guarding intact","ok":true,"remark":""},{"item":"Power cable condition","ok":true,"remark":""},{"item":"Earthing / insulation","ok":true,"remark":""},{"item":"Moving parts smooth","ok":true,"remark":""}]', '[]', 'Pass', 'Fit for use.', '10000000-0000-4000-8000-000000000004'),
  ('f0000000-0000-4000-8000-000000000001', 'Chain Pulley Block 2T', 'TL-02-EMV', 'Lifting Tackle', '2026-07-22', '[{"item":"Test certificate valid","ok":false,"remark":"Certificate expired"}]', '[]', 'Fail', 'Tool quarantined.', '10000000-0000-4000-8000-000000000004'),
  ('f0000000-0000-4000-8000-000000000001', 'Welding Machine', 'TL-03-EMV', 'Power Tool', '2026-07-15', '[{"item":"Guarding intact","ok":true,"remark":""},{"item":"Power cable condition","ok":false,"remark":"Cable sheath cut"},{"item":"Earthing / insulation","ok":true,"remark":""}]', '[]', 'Repair', 'Cable replacement initiated.', '10000000-0000-4000-8000-000000000004'),
  ('f0000000-0000-4000-8000-000000000001', 'Extension Ladder 20ft', 'TL-04-EMV', 'Access Equipment', '2026-07-01', '[{"item":"Marking / tagging present","ok":true,"remark":""},{"item":"Storage condition","ok":true,"remark":""}]', '[]', 'Pass', 'Fit for use.', '10000000-0000-4000-8000-000000000004');

-- ── Audits + findings ────────────────────────────────────────
insert into audits (company_id, audit_number, audit_type, scope, auditor, date_from, date_to, score, compliance, status, evidence) values
  ('f0000000-0000-4000-8000-000000000001', 'AUD-2026-001', 'Internal', 'Cross-department internal safety audit', 'Karthik Selvam', '2026-06-02', '2026-06-03', 78, 78, 'Closed', '[{"label":"Audit Report","type":"doc"}]'),
  ('f0000000-0000-4000-8000-000000000001', 'AUD-2026-002', 'ISO 45001', 'OHS management system — surveillance audit of all processes', 'External — TUV Auditor', '2026-04-15', '2026-04-17', 86, 86, 'Closed', '[{"label":"Audit Report","type":"doc"}]'),
  ('f0000000-0000-4000-8000-000000000001', 'AUD-2026-003', '5S', 'Workplace organisation across production & warehouse areas', 'Deepa Nair', '2026-08-08', '2026-08-08', 71, 71, 'Completed', '[{"label":"Audit Report","type":"doc"}]');

insert into audit_findings (company_id, audit_id, finding_type, description, clause, severity, capa_id, status) values
  ('f0000000-0000-4000-8000-000000000001', (select id from audits where audit_number='AUD-2026-001'), 'NC', 'Emergency exit route partially blocked by stored material', 'ISO 45001:2018 §8.1.1', 'Major', null, 'Open'),
  ('f0000000-0000-4000-8000-000000000001', (select id from audits where audit_number='AUD-2026-001'), 'OFI', 'MSDS binder not updated for new chemicals', 'ISO 45001:2018 §8.1.2', 'Minor', null, 'Open'),
  ('f0000000-0000-4000-8000-000000000001', (select id from audits where audit_number='AUD-2026-002'), 'Observation', 'Forklift daily checklist not consistently filled', 'ISO 45001:2018 §8.1.3', 'Minor', null, 'Closed'),
  ('f0000000-0000-4000-8000-000000000001', (select id from audits where audit_number='AUD-2026-003'), 'NC', 'Housekeeping below standard in scrap yard', '5S §Sort', 'Minor', null, 'Open'),
  ('f0000000-0000-4000-8000-000000000001', (select id from audits where audit_number='AUD-2026-003'), 'OFI', 'Shadow boards missing for hand tools in maintenance bay', '5S §Standardise', 'Minor', null, 'Open');

-- ── Documents ────────────────────────────────────────────────
insert into documents (company_id, title, category, description, version, issued_date, review_due, owner, downloads, search_text) values
  ('f0000000-0000-4000-8000-000000000001', 'Lockout Tagout (LOTO) Procedure', 'SOP', 'Controlled copy. Refer to master list for latest revision.', 'v3.1', '2026-01-10', '2027-01-10', 'EHS', 96, 'Lockout Tagout LOTO Procedure SOP'),
  ('f0000000-0000-4000-8000-000000000001', 'Permit to Work System', 'SOP', 'Controlled copy. Refer to master list for latest revision.', 'v2.4', '2025-11-02', '2026-11-02', 'EHS', 121, 'Permit to Work System SOP'),
  ('f0000000-0000-4000-8000-000000000001', 'JSA — Confined Space Entry', 'JSA', 'Job safety analysis for confined space activities.', 'v1.2', '2026-03-15', '2027-03-15', 'Maintenance', 54, 'JSA Confined Space Entry'),
  ('f0000000-0000-4000-8000-000000000001', 'HIRA — Rolling Mill Area', 'HIRA', 'Hazard identification & risk assessment — rolling mill.', 'v2.2', '2026-02-20', '2027-02-20', 'EHS', 43, 'HIRA Rolling Mill Area'),
  ('f0000000-0000-4000-8000-000000000001', 'MSDS — Acetone', 'MSDS', 'Material safety data sheet — acetone.', 'v3.0', '2025-06-01', '2027-06-01', 'Stores', 38, 'MSDS Acetone'),
  ('f0000000-0000-4000-8000-000000000001', 'MSDS — Sulphuric Acid 98%', 'MSDS', 'Material safety data sheet — sulphuric acid.', 'v2.6', '2025-06-01', '2027-06-01', 'Stores', 51, 'MSDS Sulphuric Acid'),
  ('f0000000-0000-4000-8000-000000000001', 'Integrated HSE Policy', 'Policy', 'Company integrated health, safety & environment policy.', 'v4.2', '2026-01-05', '2027-01-05', 'Top Management', 87, 'Integrated HSE Policy'),
  ('f0000000-0000-4000-8000-000000000001', 'Emergency Response Manual', 'Manual', 'Site emergency response & evacuation manual.', 'v3.2', '2025-09-12', '2026-09-12', 'EHS', 66, 'Emergency Response Manual');

-- ── Notifications ────────────────────────────────────────────
insert into notifications (company_id, user_id, role, title, body, channel, read, link) values
  ('f0000000-0000-4000-8000-000000000001', null, null, 'Near miss reported', 'NM-2026-0006 has been reported at Loading Bay — awaiting review.', 'browser', false, '/near-misses'),
  ('f0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003', 'safety_officer', 'CAPA due soon', 'CAPA-2026-001 is due on 10 Sep 2026. Please update status.', 'email', false, '/incidents'),
  ('f0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003', 'safety_officer', 'PPE stock low', 'Full Body Harness stock has fallen below reorder level (4 of 8).', 'sms', false, '/ppe'),
  ('f0000000-0000-4000-8000-000000000001', null, null, 'Training scheduled', 'Confined Space Entry training on 24 Aug, Training Hall A.', 'email', true, '/training'),
  ('f0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003', 'safety_officer', 'Vehicle defect', 'Forklift TN-05-AB-1234 reported with fire extinguisher defect — pending approval.', 'browser', false, '/vehicle-inspections'),
  ('f0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'company_admin', 'Audit completed', '5S Audit AUD-2026-003 completed. Score: 71%. 2 findings raised.', 'email', true, '/audits');

-- Done 🎉  Sign in with officer@demo.com / demo1234 (or any of the 6 demo users).
