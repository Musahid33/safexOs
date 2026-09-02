-- ═══════════════════════════════════════════════════════════════
--  SafetyOS — Near Miss investigation workflow migration
--  Adds the full pipeline to an EXISTING database:
--  NEW → UNDER INVESTIGATION → RCA COMPLETED → CLOSED (or REJECTED)
--  plus the CSMS Documents storage bucket for auto-generated
--  Near Miss Investigation Reports (PDF & DOCX).
--
--  Idempotent — safe to re-run.
--  Apply via: node db-tools/run-sql.js db-tools/near-miss-workflow.sql
-- ═══════════════════════════════════════════════════════════════

-- ── near_misses: investigation pipeline columns ───────────────
alter table near_misses add column if not exists immediate_action text;
alter table near_misses add column if not exists five_whys jsonb not null default '[]';
alter table near_misses add column if not exists responsible_person text;
alter table near_misses add column if not exists target_date date;
alter table near_misses add column if not exists evidence jsonb not null default '[]';
alter table near_misses add column if not exists report_documents jsonb not null default '[]';
alter table near_misses add column if not exists rejection_reason text;

-- Move legacy statuses onto the new pipeline
update near_misses set status = 'CLOSED'     where status in ('Closed', 'Verified');
update near_misses set status = 'UNDER INVESTIGATION' where status in ('Under Review');
update near_misses set status = 'RCA COMPLETED' where status in ('CAPA Pending');
update near_misses set status = 'NEW'        where status in ('Open');
alter table near_misses alter column status set default 'NEW';

-- ── CSMS Documents bucket (auto-generated reports) ────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('csms-documents', 'csms-documents', true, 10485760, array['image/jpeg','image/png','image/webp','application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/msword'])
on conflict (id) do nothing;

drop policy if exists "csms docs read" on storage.objects;
create policy "csms docs read" on storage.objects for select
  using (bucket_id = 'csms-documents');
drop policy if exists "csms docs write" on storage.objects;
create policy "csms docs write" on storage.objects for insert
  with check (bucket_id = 'csms-documents'
    and (storage.foldername(name))[1] = (select slug from companies where id = app.current_company_id()));
drop policy if exists "csms docs update" on storage.objects;
create policy "csms docs update" on storage.objects for update
  using (bucket_id = 'csms-documents'
    and (storage.foldername(name))[1] = (select slug from companies where id = app.current_company_id()));
drop policy if exists "csms docs delete" on storage.objects;
create policy "csms docs delete" on storage.objects for delete
  using (bucket_id = 'csms-documents'
    and (storage.foldername(name))[1] = (select slug from companies where id = app.current_company_id()));
