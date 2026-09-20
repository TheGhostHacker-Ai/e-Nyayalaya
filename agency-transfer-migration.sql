-- =========================================================
-- Agency Case Transfer & Cascading Token Access — migration
-- Apply AFTER revocation + appeals migrations
-- =========================================================

-- ---------------------------------------------------------
-- 1. New roles for external agency users
-- ---------------------------------------------------------
alter type app_role add value if not exists 'agency_admin';
alter type app_role add value if not exists 'agency_officer';

-- ---------------------------------------------------------
-- 2. Agencies are organisations too
-- ---------------------------------------------------------
alter table organisations drop constraint organisations_org_type_check;
alter table organisations add constraint organisations_org_type_check
  check (org_type in
    ('police_station','court','forensic_lab','prosecution_office',
     'high_court','supreme_court','agency'));
-- Seed CBI, NIA, ED, NCB, state CID/Crime Branch, Cyber Cell, etc.
-- as org_type = 'agency' rows once this is applied:
insert into organisations (name, org_type, district, state, code)
values
  ('Central Bureau of Investigation (CBI)', 'agency', 'New Delhi', 'National', 'CBI-HQ'),
  ('National Investigation Agency (NIA)', 'agency', 'New Delhi', 'National', 'NIA-HQ'),
  ('Enforcement Directorate (ED)', 'agency', 'New Delhi', 'National', 'ED-HQ'),
  ('Narcotics Control Bureau (NCB)', 'agency', 'New Delhi', 'National', 'NCB-HQ'),
  ('State Criminal Investigation Department (CID)', 'agency', 'State HQ', 'Uttar Pradesh', 'CID-UP'),
  ('State Crime Branch', 'agency', 'State HQ', 'Uttar Pradesh', 'CRIME-BRANCH'),
  ('Cyber Crime Investigation Cell', 'agency', 'Specialized Wing', 'National', 'CYBER-CELL')
on conflict do nothing;

-- ---------------------------------------------------------
-- 3. Court → Agency transfer: one case, one agency, one token
-- ---------------------------------------------------------
create table case_agency_transfers (
  id                uuid primary key default gen_random_uuid(),
  case_id           uuid not null references cases(id),
  agency_org_id     uuid not null references organisations(id),
  initiated_by      uuid not null references profiles(id),   -- judge
  token_hash        text not null,
  token_expires_at  timestamptz not null,
  status            text not null default 'pending'
                      check (status in ('pending','claimed','revoked','expired')),
  claimed_by        uuid references profiles(id),
  claimed_at        timestamptz,
  created_at        timestamptz not null default now()
);

create unique index one_pending_transfer_per_case_agency
  on case_agency_transfers (case_id, agency_org_id)
  where status = 'pending';

alter table case_agency_transfers enable row level security;

create policy "transfer visible to initiator or claimant" on case_agency_transfers
for select using (initiated_by = auth.uid() or claimed_by = auth.uid());
-- No client insert/update policy: only the two functions below,
-- both security definer, may write to this table.

-- ---------------------------------------------------------
-- 4. Agency → Officer invite, scoped to one claimed transfer
-- ---------------------------------------------------------
create table agency_officer_invites (
  id                       uuid primary key default gen_random_uuid(),
  case_agency_transfer_id  uuid not null references case_agency_transfers(id),
  invited_by               uuid not null references profiles(id),  -- agency_admin
  token_hash               text not null,
  token_expires_at         timestamptz not null,
  status                   text not null default 'pending'
                             check (status in ('pending','claimed','revoked','expired')),
  claimed_by               uuid references profiles(id),
  claimed_at               timestamptz,
  created_at               timestamptz not null default now()
);

alter table agency_officer_invites enable row level security;

create policy "invite visible to inviter or claimant" on agency_officer_invites
for select using (invited_by = auth.uid() or claimed_by = auth.uid());

-- ---------------------------------------------------------
-- 5. Judge initiates transfer — District/High Court only.
--    The Supreme Court exclusion lives HERE, not in the UI.
-- ---------------------------------------------------------
create or replace function initiate_agency_transfer(
  p_case_id       uuid,
  p_agency_org_id uuid
) returns text   -- plaintext token, shown to the judge exactly once
language plpgsql security definer as $$
declare
  v_court_org_type text;
  v_token text;
begin
  if current_role_of() <> 'judge' then
    raise exception 'only a judge may transfer a case to an agency';
  end if;

  if not is_case_member(p_case_id) then
    raise exception 'not a participant on this case';
  end if;

  select o.org_type into v_court_org_type
  from cases c join organisations o on o.id = c.court_org_id
  where c.id = p_case_id;

  if v_court_org_type = 'supreme_court' then
    raise exception 'agency transfer is not available from the Supreme Court';
  end if;

  if (select org_type from organisations where id = p_agency_org_id) <> 'agency' then
    raise exception 'target organisation is not a recognised agency';
  end if;

  v_token := regexp_replace(
               upper(encode(gen_random_bytes(9), 'base64')), '[^A-Z0-9]', '', 'g');
  v_token := substr(v_token, 1, 10);

  insert into case_agency_transfers
    (case_id, agency_org_id, initiated_by, token_hash, token_expires_at)
  values (p_case_id, p_agency_org_id, auth.uid(),
          encode(digest(v_token, 'sha256'), 'hex'), now() + interval '7 days');

  insert into audit_log (actor_id, action, entity_type, case_id, metadata)
  values (auth.uid(), 'AGENCY_TRANSFER_INITIATED', 'case_agency_transfers', p_case_id,
          jsonb_build_object('agency_org_id', p_agency_org_id));

  return v_token;
end $$;

-- ---------------------------------------------------------
-- 6. Agency admin claims the case-level token
-- ---------------------------------------------------------
create or replace function claim_agency_transfer(
  p_agency_org_id uuid,
  p_token         text
) returns uuid
language plpgsql security definer as $$
declare
  v_row record;
begin
  select * into v_row from case_agency_transfers
  where agency_org_id = p_agency_org_id
    and token_hash = encode(digest(p_token, 'sha256'), 'hex')
    and status = 'pending'
    and token_expires_at > now()
  limit 1;

  if v_row.id is null then
    raise exception 'invalid, expired, or already-used token';
  end if;

  update case_agency_transfers
     set status = 'claimed', claimed_by = auth.uid(), claimed_at = now()
   where id = v_row.id;

  insert into case_participants (case_id, user_id, role_in_case, granted_by)
  values (v_row.case_id, auth.uid(), 'agency_lead', v_row.initiated_by)
  on conflict (case_id, user_id) do nothing;

  insert into audit_log (actor_id, action, entity_type, case_id, metadata)
  values (auth.uid(), 'AGENCY_TRANSFER_CLAIMED', 'case_agency_transfers', v_row.case_id,
          jsonb_build_object('agency_org_id', p_agency_org_id));

  return v_row.case_id;
end $$;

-- ---------------------------------------------------------
-- 7. Agency admin invites a named officer of their own agency
-- ---------------------------------------------------------
create or replace function invite_agency_officer(
  p_case_agency_transfer_id uuid
) returns text
language plpgsql security definer as $$
declare
  v_transfer record;
  v_token text;
begin
  select * into v_transfer from case_agency_transfers
  where id = p_case_agency_transfer_id
    and claimed_by = auth.uid()
    and status = 'claimed';

  if v_transfer.id is null then
    raise exception 'no claimed transfer found for this agency admin';
  end if;

  v_token := regexp_replace(
               upper(encode(gen_random_bytes(9), 'base64')), '[^A-Z0-9]', '', 'g');
  v_token := substr(v_token, 1, 10);

  insert into agency_officer_invites
    (case_agency_transfer_id, invited_by, token_hash, token_expires_at)
  values (p_case_agency_transfer_id, auth.uid(),
          encode(digest(v_token, 'sha256'), 'hex'), now() + interval '2 days');

  return v_token;
end $$;

-- ---------------------------------------------------------
-- 8. Officer redeems the token AT registration time.
--    The token itself is the authorisation, so the profile
--    is created pre-approved — but every step is still
--    written to audit_log, so it's traceable even without a
--    human approver in the loop.
-- ---------------------------------------------------------
create or replace function claim_agency_officer_invite(
  p_token         text,
  p_full_name     text,
  p_badge_no      text,
  p_designation   text,
  p_agency_org_id uuid
) returns uuid
language plpgsql security definer as $$
declare
  v_invite record;
begin
  select i.*, t.case_id
    into v_invite
  from agency_officer_invites i
  join case_agency_transfers t on t.id = i.case_agency_transfer_id
  where i.token_hash = encode(digest(p_token, 'sha256'), 'hex')
    and i.status = 'pending'
    and i.token_expires_at > now()
    and t.agency_org_id = p_agency_org_id
  limit 1;

  if v_invite.id is null then
    raise exception 'invalid, expired, or already-used token';
  end if;

  insert into profiles
    (id, full_name, badge_no, designation, role, org_id, status, approved_by, approved_at)
  values
    (auth.uid(), p_full_name, p_badge_no, p_designation, 'agency_officer',
     p_agency_org_id, 'approved', v_invite.invited_by, now());

  update agency_officer_invites
     set status = 'claimed', claimed_by = auth.uid(), claimed_at = now()
   where id = v_invite.id;

  insert into case_participants (case_id, user_id, role_in_case, granted_by)
  values (v_invite.case_id, auth.uid(), 'agency_officer', v_invite.invited_by);

  insert into audit_log (actor_id, action, entity_type, case_id, metadata)
  values (auth.uid(), 'AGENCY_OFFICER_ONBOARDED', 'profiles', v_invite.case_id,
          jsonb_build_object('agency_org_id', p_agency_org_id, 'invited_by', v_invite.invited_by));

  return v_invite.case_id;
end $$;

-- ---------------------------------------------------------
-- 9. Witness statements: tag which side submitted it.
--    Immutability already comes free from documents_immutable() —
--    no new trigger needed, only a UI that never exposes an edit
--    action on a submitted witness_statement.
-- ---------------------------------------------------------
alter table documents add column submitted_by_side text
  check (submitted_by_side in ('prosecution','defense'));
-- Non-witness doc_types leave this null; enforce "required when
-- doc_type = 'witness_statement'" in the upload form, not the DB,
-- since the same table serves many document types.

-- NOTE: no new RLS policy is needed for agency officers to upload
-- proceedings as documents — the existing "members upload docs" and
-- "members read docs" policies key off is_case_member(case_id), and
-- agency officers are added to case_participants in step 8 above like
-- anyone else. That's the payoff of building revocation/appeals on
-- case_participants membership rather than hardcoding role checks.
