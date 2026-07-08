-- ============================================================================
-- PALMO — v1 DATABASE SCHEMA + ROW-LEVEL SECURITY
-- Run this in Supabase → SQL Editor → New query → Run.
-- Safe to run once. Re-running will error on existing objects (that's fine).
--
-- WHAT THIS ENCODES:
--   profiles       one row per user (owner or developer), linked to auth
--   listings       land a user is offering
--   conversations  a mediated thread between a developer and an owner's listing
--   messages       individual messages inside a conversation (contact info masked)
--   offers         structured proposals a developer makes on a listing
--
-- THE CORE RULE ("Airbnb gating"), enforced at the DATABASE level via RLS:
--   • Users only ever read their OWN profile's private fields (phone/email).
--   • Other users see only a listing's PUBLIC fields — never the owner's contact.
--   • Contact info becomes visible to the counterparty ONLY when a deal on that
--     listing reaches status 'closed'. Until then, the API physically cannot
--     return it, even to a technical user hitting Supabase directly with the
--     public anon key. This is why the public key is safe.
-- ============================================================================

-- ─── Enums ──────────────────────────────────────────────────────────────────
create type user_role as enum ('owner', 'developer', 'both');
create type listing_status as enum ('draft', 'active', 'paused', 'closed', 'archived');
create type offer_status as enum ('pending', 'accepted', 'declined', 'countered', 'withdrawn');
create type deal_status as enum ('open', 'negotiating', 'closed', 'cancelled');

-- ============================================================================
-- PROFILES
-- ============================================================================
create table profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  role         user_role   not null default 'owner',
  full_name    text,
  -- PRIVATE contact fields — never exposed to other users until a deal closes:
  phone        text,
  email        text,
  -- PUBLIC-ish profile fields:
  display_name text,        -- first name / handle shown to others
  avatar_url   text,
  bio          text,
  state        text,        -- UF
  municipality text,
  -- lightweight verification (v1) — real KYC deferred to v2/deal stage:
  email_verified boolean not null default false,
  phone_verified boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table profiles enable row level security;

-- Anyone signed in can read the PUBLIC columns of any profile — but RLS is
-- row-level, not column-level, so we protect contact fields via a VIEW below
-- and never select phone/email through the public path.
create policy "profiles: read own row fully"
  on profiles for select
  using (auth.uid() = id);

create policy "profiles: insert own row"
  on profiles for insert
  with check (auth.uid() = id);

create policy "profiles: update own row"
  on profiles for update
  using (auth.uid() = id);

-- Public, contact-free view of a profile (safe to expose to any signed-in user).
create view public_profiles as
  select id, role, display_name, avatar_url, bio, state, municipality,
         email_verified, phone_verified, created_at
  from profiles;

-- ============================================================================
-- LISTINGS
-- ============================================================================
create table listings (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references profiles (id) on delete cascade,
  title         text not null,
  status        listing_status not null default 'draft',
  -- location / land:
  state         text not null,
  municipality  text not null,
  hectares      numeric not null check (hectares > 0),
  purpose       text not null,           -- matches the calculator's purpose values
  crop          text,
  -- pricing expectation (optional):
  price_per_ha_year numeric,
  -- descriptive:
  description   text,
  has_water     boolean,
  car_number    text,                    -- Cadastro Ambiental Rural
  photos        text[] default '{}',     -- storage URLs
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table listings enable row level security;

-- Anyone signed in can read ACTIVE listings (public marketplace).
create policy "listings: read active"
  on listings for select
  using (status = 'active' or owner_id = auth.uid());

create policy "listings: owner inserts own"
  on listings for insert
  with check (owner_id = auth.uid());

create policy "listings: owner updates own"
  on listings for update
  using (owner_id = auth.uid());

create policy "listings: owner deletes own"
  on listings for delete
  using (owner_id = auth.uid());

-- ============================================================================
-- CONVERSATIONS  (mediated inbox — the heart of the Airbnb gating)
-- One thread per (listing, developer). The owner is implied by the listing.
-- ============================================================================
create table conversations (
  id           uuid primary key default gen_random_uuid(),
  listing_id   uuid not null references listings (id) on delete cascade,
  developer_id uuid not null references profiles (id) on delete cascade,
  owner_id     uuid not null references profiles (id) on delete cascade,
  deal_status  deal_status not null default 'open',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (listing_id, developer_id)
);

alter table conversations enable row level security;

-- Only the two participants can see a conversation.
create policy "conversations: participants read"
  on conversations for select
  using (developer_id = auth.uid() or owner_id = auth.uid());

-- A developer starts a conversation on someone else's active listing.
create policy "conversations: developer creates"
  on conversations for insert
  with check (
    developer_id = auth.uid()
    and owner_id <> auth.uid()
    and exists (
      select 1 from listings l
      where l.id = listing_id and l.status = 'active' and l.owner_id = owner_id
    )
  );

-- Either participant can advance the deal status.
create policy "conversations: participants update"
  on conversations for update
  using (developer_id = auth.uid() or owner_id = auth.uid());

-- ============================================================================
-- MESSAGES  (contact info is masked at the application layer; DB stores raw
-- text but only participants can ever read it)
-- ============================================================================
create table messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  sender_id       uuid not null references profiles (id) on delete cascade,
  body            text not null,
  created_at      timestamptz not null default now()
);

alter table messages enable row level security;

-- Read messages only if you're a participant in the parent conversation.
create policy "messages: participants read"
  on messages for select
  using (
    exists (
      select 1 from conversations c
      where c.id = conversation_id
        and (c.developer_id = auth.uid() or c.owner_id = auth.uid())
    )
  );

-- Send a message only into a conversation you're part of, as yourself.
create policy "messages: participants send"
  on messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from conversations c
      where c.id = conversation_id
        and (c.developer_id = auth.uid() or c.owner_id = auth.uid())
    )
  );

-- ============================================================================
-- OFFERS  (structured proposals inside a conversation)
-- ============================================================================
create table offers (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  listing_id      uuid not null references listings (id) on delete cascade,
  from_id         uuid not null references profiles (id) on delete cascade,
  price_per_ha_year numeric not null check (price_per_ha_year > 0),
  term_years      int,
  message         text,
  status          offer_status not null default 'pending',
  created_at      timestamptz not null default now()
);

alter table offers enable row level security;

create policy "offers: participants read"
  on offers for select
  using (
    exists (
      select 1 from conversations c
      where c.id = conversation_id
        and (c.developer_id = auth.uid() or c.owner_id = auth.uid())
    )
  );

create policy "offers: participants create"
  on offers for insert
  with check (
    from_id = auth.uid()
    and exists (
      select 1 from conversations c
      where c.id = conversation_id
        and (c.developer_id = auth.uid() or c.owner_id = auth.uid())
    )
  );

create policy "offers: participants update status"
  on offers for update
  using (
    exists (
      select 1 from conversations c
      where c.id = conversation_id
        and (c.developer_id = auth.uid() or c.owner_id = auth.uid())
    )
  );

-- ============================================================================
-- CONTACT REVEAL  (the gate: contact info only after a deal closes)
-- A security-definer function that returns the counterparty's contact ONLY
-- when the shared conversation's deal_status = 'closed'. Nothing else can
-- read another user's phone/email.
-- ============================================================================
create or replace function get_counterparty_contact(conv_id uuid)
returns table (full_name text, phone text, email text)
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  c  conversations%rowtype;
  other uuid;
begin
  select * into c from conversations where id = conv_id;
  if c.id is null then return; end if;
  if me <> c.developer_id and me <> c.owner_id then return; end if;
  if c.deal_status <> 'closed' then return; end if;  -- THE GATE
  other := case when me = c.developer_id then c.owner_id else c.developer_id end;
  return query
    select p.full_name, p.phone, p.email from profiles p where p.id = other;
end;
$$;

-- ============================================================================
-- Auto-create a profile row when a new auth user signs up.
-- ============================================================================
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, email, display_name, avatar_url, email_verified)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
