-- =========================================================
-- Appellate Architecture — migration
-- Apply AFTER revocation-workflow-migration.sql
-- =========================================================

-- ---------------------------------------------------------
-- 1. organisations: permit high_court / supreme_court,
--    and make district optional for them
-- ---------------------------------------------------------
alter table organisations drop constraint organisations_org_type_check;
alter table organisations add constraint organisations_org_type_check
  check (org_type in
    ('police_station','court','forensic_lab','prosecution_office',
     'high_court','supreme_court'));

alter table organisations alter column district drop not null;

alter table organisations add constraint district_required_for_local_org
  check (org_type in ('high_court','supreme_court') or district is not null);

-- ---------------------------------------------------------
-- 2. case_stage: give appellate cases their own vocabulary
--    (cannot be done inside a transaction block with the
--    values used in the same tx — run this statement alone
--    first if your migration runner wraps everything in BEGIN)
-- ---------------------------------------------------------
alter type case_stage add value if not exists 'appeal_admitted';
alter type case_stage add value if not exists 'in_appellate_hearing';
alter type case_stage add value if not exists 'appeal_disposed';

-- ---------------------------------------------------------
-- 3. appeals table
-- ---------------------------------------------------------
create type appeal_court_level as enum ('high_court','supreme_court');
create type appeal_status as enum ('pending','upheld','set_aside','modified','remanded');

create table appeals (
  id                uuid primary key default gen_random_uuid(),
  original_case_id  uuid not null references cases(id),
  new_case_id       uuid not null unique references cases(id),
  appeal_court       appeal_court_level not null,
  filed_by          uuid not null references profiles(id),
  ground            text not null,
  status            appeal_status not null default 'pending',
  disposed_at       timestamptz,
  created_at        timestamptz not null default now()
);

-- only one open appeal per original case at a time
create unique index one_pending_appeal_per_case
  on appeals (original_case_id)
  where status = 'pending';

alter table appeals enable row level security;

create policy "members read appeals" on appeals
for select using (
  is_case_member(original_case_id) or is_case_member(new_case_id)
);
-- no client-facing insert/update policy — appeals rows are only ever
-- written by file_appeal() below, running as the function owner.

-- ---------------------------------------------------------
-- 4. auto_enroll_creator: stop hardcoding 'io'
--    (a judge filing an appeal is not an investigating officer)
-- ---------------------------------------------------------
create or replace function auto_enroll_creator() returns trigger
language plpgsql security definer as $$
declare
  v_role text;
begin
  v_role := case current_role_of()
    when 'judge' then 'referring_judge'
    when 'police_officer' then 'io'
    when 'investigating_officer' then 'io'
    else 'member'
  end;

  insert into case_participants (case_id, user_id, role_in_case, granted_by)
  values (new.id, new.filed_by, v_role, new.filed_by)
  on conflict (case_id, user_id) do nothing;

  return new;
end $$;

-- ---------------------------------------------------------
-- 5. Cross-case read bridge: an appellate court can read the
--    case it is hearing an appeal from
-- ---------------------------------------------------------
create or replace function is_appellate_member(cid uuid) returns boolean
language sql stable security definer as $$
  select exists (
    select 1 from appeals a
    where a.original_case_id = cid
      and is_case_member(a.new_case_id)
  )
$$;

-- Extend the existing read policies with the bridge. Postgres has no
-- ALTER POLICY ... USING, so drop and recreate each one.
drop policy if exists "members read case" on cases;
create policy "members read case" on cases
for select using (
  is_approved() and (is_case_member(id) or is_appellate_member(id))
);

drop policy if exists "members read docs" on documents;
create policy "members read docs" on documents
for select using (
  (is_case_member(case_id) or is_appellate_member(case_id))
  and (
    current_role_of() <> 'forensic_expert'
    or doc_type in ('forensic_report','evidence_record')
  )
);

drop policy if exists "members read sessions" on court_sessions;
create policy "members read sessions" on court_sessions
for select using (is_case_member(case_id) or is_appellate_member(case_id));

drop policy if exists "members read judgements" on judgements;
create policy "members read judgements" on judgements
for select using (is_case_member(case_id) or is_appellate_member(case_id));

-- ---------------------------------------------------------
-- 6. file_appeal — the whole operation, atomically, judge-only
-- ---------------------------------------------------------
create or replace function file_appeal(
  p_original_case_id uuid,
  p_target_org_id     uuid,   -- the High Court / Supreme Court organisation
  p_ground            text
) returns uuid
language plpgsql security definer as $$
declare
  v_new_case_id uuid;
  v_org_type    text;
  v_orig_stage  case_stage;
begin
  if current_role_of() <> 'judge' then
    raise exception 'only a judge may file an appeal';
  end if;

  if not is_case_member(p_original_case_id) then
    raise exception 'not a participant on the case being appealed';
  end if;

  select stage into v_orig_stage from cases where id = p_original_case_id;
  if v_orig_stage <> 'disposed' then
    raise exception 'only a disposed case may be appealed (current stage: %)', v_orig_stage;
  end if;

  if exists (
    select 1 from appeals
    where original_case_id = p_original_case_id and status = 'pending'
  ) then
    raise exception 'an appeal is already pending for this case';
  end if;

  select org_type into v_org_type from organisations where id = p_target_org_id;
  if v_org_type not in ('high_court','supreme_court', 'court_high', 'court_supreme') then
    raise exception 'target organisation must be a High Court or Supreme Court';
  end if;

  insert into cases (title, sections, stage, filed_by, police_org_id, court_org_id, district, is_sensitive)
  select c.title, c.sections, 'appeal_admitted'::case_stage,
         auth.uid(), c.police_org_id, p_target_org_id, c.district, c.is_sensitive
  from cases c
  where c.id = p_original_case_id
  returning id into v_new_case_id;

  insert into appeals (original_case_id, new_case_id, appeal_court, filed_by, ground)
  values (
    p_original_case_id, v_new_case_id,
    (case when v_org_type = 'high_court' or v_org_type = 'court_high' then 'high_court' else 'supreme_court' end)::appeal_court_level,
    auth.uid(), p_ground
  );

  update cases set stage = 'appealed', updated_at = now()
  where id = p_original_case_id;

  -- Enroll every approved judge/clerk of the target court onto the new case.
  -- If your UI instead lets the filer pick one specific presiding judge,
  -- replace this with a single insert for that user_id.
  insert into case_participants (case_id, user_id, role_in_case, granted_by)
  select v_new_case_id, p.id, 'presiding_judge', auth.uid()
  from profiles p
  where p.org_id = p_target_org_id
    and p.status = 'approved'
    and p.role in ('judge','court_clerk')
  on conflict (case_id, user_id) do nothing;

  insert into audit_log (actor_id, action, entity_type, entity_id, case_id, metadata)
  values (
    auth.uid(), 'APPEAL_FILED', 'cases', v_new_case_id, p_original_case_id,
    jsonb_build_object('new_case_id', v_new_case_id, 'target_org_id', p_target_org_id, 'ground', p_ground)
  );

  return v_new_case_id;
end $$;
