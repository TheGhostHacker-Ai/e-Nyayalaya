-- =========================================================
-- Lawyer Revocation Approval Workflow — migration
-- =========================================================

-- ---------------------------------------------------------
-- 1. Request table (dedicated — not documents)
-- ---------------------------------------------------------
create type revocation_status as enum ('pending', 'approved', 'rejected');

create table if not exists revocation_requests (
  id              uuid primary key default gen_random_uuid(),
  case_id         uuid not null references cases(id) on delete cascade,
  lawyer_id       uuid not null references profiles(id),   -- the counsel being revoked
  requested_by    uuid not null references profiles(id),   -- police officer / IO
  reason          text not null,
  -- supporting file lives in Storage like any other upload; this table
  -- only stores the pointer, exactly like `documents.storage_path` does
  support_path    text not null,      -- 'case-documents/{case_id}/revocation/{uuid}.pdf'
  support_sha256  text not null,
  status          revocation_status not null default 'pending',
  reviewed_by     uuid references profiles(id),            -- judge who decided
  review_note     text,
  reviewed_at     timestamptz,
  created_at      timestamptz not null default now(),

  -- one open request per lawyer per case at a time
  constraint one_open_request_per_lawyer
    unique (case_id, lawyer_id, status) deferrable initially immediate
);

-- Partial unique index is the actual enforcement (the constraint above
-- only dedupes exact status matches across ALL statuses, which allows
-- a new 'pending' after a prior 'approved' — that's what we want; but
-- we also need to block a *second* simultaneous pending request):
create unique index one_pending_request_per_lawyer
  on revocation_requests (case_id, lawyer_id)
  where status = 'pending';

alter table revocation_requests enable row level security;

-- ---------------------------------------------------------
-- 2. RLS — who can see / create / decide a request
-- ---------------------------------------------------------

-- Case members can read requests on their own case (police sees their
-- own submission's status; judge sees everything to review)
create policy "members read revocation requests" on revocation_requests
for select using (is_case_member(case_id));

-- Only police-side roles, only on cases they're actually a member of,
-- only naming themselves as requester
create policy "police create revocation requests" on revocation_requests
for insert with check (
  is_approved()
  and is_case_member(case_id)
  and current_role_of() in ('police_officer', 'investigating_officer')
  and requested_by = auth.uid()
  and status = 'pending'
);

-- Only a judge on this case may move a request out of 'pending',
-- and only into approved/rejected, and only by themself
create policy "judge decides revocation requests" on revocation_requests
for update using (
  current_role_of() = 'judge'
  and is_case_member(case_id)
)
with check (
  current_role_of() = 'judge'
  and reviewed_by = auth.uid()
  and status in ('approved', 'rejected')
);

-- Requests are never deleted — same "immutable trail" principle as
-- documents and audit_log. A rejected request is history, not noise.
-- (no delete policy defined = delete is denied by default under RLS)

-- ---------------------------------------------------------
-- 3. Judge approval triggers the actual revocation
-- ---------------------------------------------------------
create or replace function on_revocation_decided() returns trigger
language plpgsql security definer as $$
begin
  if new.status = 'approved' and old.status = 'pending' then
    update case_participants
       set revoked_at = now()
     where case_id = new.case_id
       and user_id = new.lawyer_id
       and revoked_at is null;

    insert into audit_log (actor_id, action, entity_type, entity_id, case_id, metadata)
    values (new.reviewed_by, 'LAWYER_REVOKED', 'case_participants', new.lawyer_id,
            new.case_id, jsonb_build_object('request_id', new.id, 'reason', new.reason));
  end if;

  if new.status = 'rejected' and old.status = 'pending' then
    insert into audit_log (actor_id, action, entity_type, entity_id, case_id, metadata)
    values (new.reviewed_by, 'REVOCATION_REJECTED', 'revocation_requests', new.id,
            new.case_id, jsonb_build_object('review_note', new.review_note));
  end if;

  new.reviewed_at := now();
  return new;
end $$;

create trigger trg_revocation_decided
before update on revocation_requests
for each row
when (old.status = 'pending' and new.status <> 'pending')
execute function on_revocation_decided();

-- Also log the request itself at creation time
create or replace function on_revocation_requested() returns trigger
language plpgsql security definer as $$
begin
  insert into audit_log (actor_id, action, entity_type, entity_id, case_id, metadata)
  values (new.requested_by, 'REVOCATION_REQUESTED', 'revocation_requests', new.id,
          new.case_id, jsonb_build_object('lawyer_id', new.lawyer_id, 'reason', new.reason));
  return new;
end $$;

create trigger trg_revocation_requested
after insert on revocation_requests
for each row execute function on_revocation_requested();

-- ---------------------------------------------------------
-- 4. Judge direct-revoke path (no request, immediate)
-- ---------------------------------------------------------
-- case_participants already has revoked_at, but there is currently no
-- UPDATE policy letting anyone touch it — that's *why* the direct
-- revoke silently fails for everyone right now, judges included.
create policy "judge revokes case participant directly" on case_participants
for update using (
  current_role_of() = 'judge'
  and is_case_member(case_id)
)
with check (
  current_role_of() = 'judge'
);

-- Log direct revokes too, from the client-side call, or wrap it in an
-- Edge Function / RPC so the audit insert is guaranteed rather than
-- optional:
create or replace function judge_revoke_lawyer(p_case_id uuid, p_lawyer_id uuid, p_reason text)
returns void language plpgsql security definer as $$
begin
  if current_role_of() <> 'judge' or not is_case_member(p_case_id) then
    raise exception 'not authorised';
  end if;

  update case_participants
     set revoked_at = now()
   where case_id = p_case_id and user_id = p_lawyer_id and revoked_at is null;

  insert into audit_log (actor_id, action, entity_type, entity_id, case_id, metadata)
  values (auth.uid(), 'LAWYER_REVOKED_DIRECT', 'case_participants', p_lawyer_id,
          p_case_id, jsonb_build_object('reason', p_reason));
end $$;
