-- 1. Extensions and enums
create extension if not exists pgcrypto;      -- digest(), gen_random_uuid()
create extension if not exists pg_trgm;       -- fuzzy text search

create type app_role as enum (
  'admin','police_officer','investigating_officer',
  'prosecutor','judge','court_clerk','forensic_expert'
);

create type account_status as enum ('pending','approved','suspended','revoked');

create type case_stage as enum (
  'fir_registered','under_investigation','charge_sheet_filed',
  'in_trial','judgement_reserved','disposed','appealed','closed'
);

create type doc_type as enum (
  'fir','police_report','investigation_record','witness_statement',
  'charge_sheet','court_filing','evidence_record','forensic_report',
  'legal_notice','judgement','other'
);

create type doc_status as enum ('draft','submitted','verified','locked','superseded');

-- 2. Organisations and profiles
create table organisations (
  id           uuid primary key default gen_random_uuid(),
  org_type     text not null check (org_type in ('police_station','court','forensic_lab','prosecution_office')),
  name         text not null,
  district     text not null,
  state        text not null,
  code         text unique not null,          -- e.g. 'UP-LKO-PS-HZ'
  created_at   timestamptz not null default now()
);

create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text not null,
  badge_no     text not null,
  designation  text not null,
  role         app_role not null,
  org_id       uuid not null references organisations(id),
  phone        text,
  email        text,
  status       account_status not null default 'pending',
  approved_by  uuid references profiles(id),
  approved_at  timestamptz,
  created_at   timestamptz not null default now(),
  unique (badge_no, org_id)
);

-- 3. Cases
create table cases (
  id               uuid primary key default gen_random_uuid(),
  case_number      text unique not null,        -- 'CASE-2026-000001'
  fir_number       text,                        -- 'FIR/142/2026'
  title            text not null,
  sections         text[],                      -- BNS/IPC sections invoked
  stage            case_stage not null default 'fir_registered',
  filed_by         uuid not null references profiles(id),
  police_org_id    uuid not null references organisations(id),
  court_org_id     uuid references organisations(id),
  district         text not null,
  is_sensitive     boolean not null default false, -- POCSO / women safety: tighter ACL
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Human-readable sequential case numbers
create sequence case_seq start 1;
create or replace function gen_case_number() returns trigger
language plpgsql as $$
begin
  if new.case_number is null then
    new.case_number := 'CASE-' || to_char(now(),'YYYY') || '-' ||
                       lpad(nextval('case_seq')::text, 6, '0');
  end if;
  return new;
end $$;

create trigger trg_case_number before insert on cases
for each row execute function gen_case_number();

-- 4. Case access control (ABAC layer)
create table case_participants (
  id             uuid primary key default gen_random_uuid(),
  case_id        uuid not null references cases(id) on delete cascade,
  user_id        uuid not null references profiles(id) on delete cascade,
  role_in_case   text not null,   -- 'io','supervising_officer','prosecutor','presiding_judge','forensic'
  granted_by     uuid references profiles(id),
  granted_at     timestamptz not null default now(),
  revoked_at     timestamptz,
  unique (case_id, user_id)
);

create or replace function auto_enroll_creator() returns trigger
language plpgsql security definer as $$
begin
  insert into case_participants (case_id, user_id, role_in_case, granted_by)
  values (new.id, new.filed_by, 'io', new.filed_by);
  return new;
end $$;

create trigger trg_enroll_creator after insert on cases
for each row execute function auto_enroll_creator();

-- 5. Documents and versioning
create table documents (
  id              uuid primary key default gen_random_uuid(),
  case_id         uuid not null references cases(id) on delete restrict,
  doc_type        doc_type not null,
  title           text not null,
  storage_path    text not null,                -- bucket path
  mime_type       text,
  size_bytes      bigint,
  sha256          text not null,                -- computed client-side, re-verified server-side
  version         int not null default 1,
  supersedes      uuid references documents(id),-- version chain
  is_current      boolean not null default true,
  status          doc_status not null default 'submitted',
  uploaded_by     uuid not null references profiles(id),
  ocr_text        text,                         -- Gemini OCR output
  ai_entities     jsonb,                        -- extracted names, dates, sections
  ai_summary      text,
  created_at      timestamptz not null default now()
);

create index on documents (case_id, doc_type);
create index on documents using gin (to_tsvector('english', coalesce(ocr_text,'')));
create index on documents using gin (title gin_trgm_ops);

-- Block content mutation outright
create or replace function documents_immutable() returns trigger
language plpgsql as $$
begin
  if old.sha256 is distinct from new.sha256 
     or old.storage_path is distinct from new.storage_path then
    raise exception 'Document content is immutable. Create a new version instead.';
  end if;
  if old.status = 'locked' and new.status <> 'locked' then
    raise exception 'Locked documents cannot be unlocked.';
  end if;
  return new;
end $$;

create trigger trg_doc_immutable before update on documents
for each row execute function documents_immutable();

-- 6. Court sessions and judgements
create table court_sessions (
  id                 uuid primary key default gen_random_uuid(),
  case_id            uuid not null references cases(id) on delete cascade,
  court_org_id       uuid not null references organisations(id),
  hearing_type       text not null, -- 'first_hearing','framing_of_charges','evidence','arguments','pronouncement'
  scheduled_at       timestamptz not null,
  held_at            timestamptz,
  presiding_judge    uuid references profiles(id),
  proceedings        text,          -- what happened in court
  next_hearing_at    timestamptz,
  recorded_by        uuid not null references profiles(id),
  created_at         timestamptz not null default now()
);

create table judgements (
  id                 uuid primary key default gen_random_uuid(),
  case_id            uuid not null references cases(id) on delete restrict,
  session_id         uuid references court_sessions(id),
  verdict            text not null, -- 'convicted','acquitted','discharged','settled','remanded'
  operative_order    text not null,
  full_text          text,
  document_id        uuid references documents(id),
  pronounced_by      uuid not null references profiles(id),
  pronounced_at      timestamptz not null default now(),
  sha256             text not null,
  signature          text,          -- detached digital signature (DSC/eSign in prod)
  created_at         timestamptz not null default now()
);

create or replace function on_judgement_pronounced() returns trigger
language plpgsql security definer as $$
begin
  update cases 
    set stage = 'disposed', updated_at = now()
    where id = new.case_id;
    
  update documents
    set status = 'locked'
    where case_id = new.case_id and is_current = true;
    
  return new;
end $$;

create trigger trg_judgement after insert on judgements
for each row execute function on_judgement_pronounced();

-- 7. Integrity: the hash-chained audit log
create table audit_log (
  id           bigserial primary key,
  actor_id     uuid references profiles(id),
  action       text not null,         -- 'CASE_CREATE','DOC_UPLOAD','DOC_VIEW','JUDGEMENT_PRONOUNCE','ACCESS_GRANTED'
  entity_type  text not null,
  entity_id    uuid,
  case_id      uuid references cases(id),
  metadata     jsonb default '{}'::jsonb,
  ip_address   inet,
  device_id    text,
  prev_hash    text,
  record_hash  text not null,
  created_at   timestamptz not null default now()
);

create or replace function audit_chain() returns trigger
language plpgsql as $$
declare
  last_hash text;
  payload   text;
begin
  perform pg_advisory_xact_lock(778899);  -- serialise chain writes
  
  select record_hash into last_hash 
    from audit_log order by id desc limit 1;
    
  new.prev_hash := coalesce(last_hash, repeat('0', 64));
  
  payload := coalesce(new.actor_id::text,'') || '|' || new.action || '|' || 
             new.entity_type || '|' || coalesce(new.entity_id::text,'') || '|' ||
             coalesce(new.metadata::text,'{}') || '|' || 
             new.created_at::text || '|' || new.prev_hash;
             
  new.record_hash := encode(digest(payload, 'sha256'), 'hex');
  return new;
end $$;

create trigger trg_audit_chain before insert on audit_log
for each row execute function audit_chain();

-- Nothing may ever modify or delete an audit row
create rule audit_no_update as on update to audit_log do instead nothing;
create rule audit_no_delete as on delete to audit_log do instead nothing;

-- 8. Row-Level Security
create or replace function current_role_of() returns app_role
language sql stable security definer as $$
  select role from profiles where id = auth.uid() and status = 'approved'
$$;

create or replace function is_approved() returns boolean
language sql stable security definer as $$
  select exists (select 1 from profiles where id = auth.uid() and status = 'approved')
$$;

create or replace function is_case_member(cid uuid) returns boolean
language sql stable security definer as $$
  select exists (
    select 1 from case_participants cp
    join profiles p on p.id = cp.user_id
    where cp.case_id = cid
      and cp.user_id = auth.uid()
      and cp.revoked_at is null
      and p.status = 'approved'
  )
$$;

-- Enable RLS
alter table profiles            enable row level security;
alter table cases               enable row level security;
alter table case_participants   enable row level security;
alter table documents           enable row level security;
alter table court_sessions      enable row level security;
alter table judgements          enable row level security;
alter table audit_log           enable row level security;

-- Profiles Policies
create policy "read own profile" on profiles for select using (id = auth.uid());
create policy "admin reads all profiles" on profiles for select using (current_role_of() = 'admin');
create policy "create own profile on signup" on profiles for insert with check (id = auth.uid() and status = 'pending');
create policy "admin approves" on profiles for update using (current_role_of() = 'admin');

-- Cases Policies
create policy "members read case" on cases for select using (is_approved() and is_case_member(id));
create policy "police file case" on cases for insert with check (
  is_approved() 
  and current_role_of() in ('police_officer','investigating_officer')
  and filed_by = auth.uid()
);
create policy "io updates own case" on cases for update using (
  is_case_member(id)
  and current_role_of() in ('investigating_officer','police_officer','judge')
);

-- Documents Policies
create policy "members read docs" on documents for select using (
  is_case_member(case_id)
  and (
    current_role_of() <> 'forensic_expert'
    or doc_type in ('forensic_report','evidence_record')
  )
);
create policy "members upload docs" on documents for insert with check (
  is_case_member(case_id)
  and uploaded_by = auth.uid()
);

-- Court Sessions & Judgements Policies
create policy "members read judgements" on judgements for select using (is_case_member(case_id));
create policy "only judge pronounces" on judgements for insert with check (
  current_role_of() = 'judge'
  and is_case_member(case_id)
  and pronounced_by = auth.uid()
);

create policy "members read sessions" on court_sessions for select using (is_case_member(case_id));
create policy "court staff record sessions" on court_sessions for insert with check (
  current_role_of() in ('judge','court_clerk')
  and is_case_member(case_id)
  and recorded_by = auth.uid()
);

-- Audit Log Policies
create policy "members read case audit" on audit_log for select using (
  (case_id is not null and is_case_member(case_id))
  or current_role_of() = 'admin'
);

-- Realtime Publication
alter publication supabase_realtime add table cases;
alter publication supabase_realtime add table documents;
alter publication supabase_realtime add table court_sessions;
alter publication supabase_realtime add table judgements;
