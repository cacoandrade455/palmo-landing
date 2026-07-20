-- ═══════════════ PALMO · MIGRAÇÃO LOTE B ═══════════════
-- Rodar UMA vez no SQL Editor do Supabase, ANTES de testar o Lote B.
-- Contratos (sala de minuta por blocos) + KYC unificado (BR e intl).

-- 0) Matrícula no anúncio (o contrato exige)
alter table listings add column if not exists matricula text;

-- 1) Contratos
create table if not exists contracts (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  listing_id uuid not null references listings(id),
  offer_id uuid not null references offers(id),
  type text not null check (type in ('arrendamento','parceria')),
  status text not null default 'discussion'
    check (status in ('discussion','ready','signed','cancelled')),
  current_version int not null default 1,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  unique (conversation_id)
);

create table if not exists contract_versions (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references contracts(id) on delete cascade,
  version int not null,
  blocks jsonb not null, -- [{key,title,body}] com placeholders resolvidos
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  unique (contract_id, version)
);

create table if not exists contract_comments (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references contracts(id) on delete cascade,
  block_key text not null,
  author_id uuid not null references profiles(id),
  body text not null,
  proposed_text text, -- proposta de novo texto do bloco (opcional)
  status text not null default 'open'
    check (status in ('open','accepted','rejected')),
  created_at timestamptz not null default now()
);

create table if not exists contract_approvals (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references contracts(id) on delete cascade,
  version int not null,
  user_id uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  unique (contract_id, version, user_id)
);

-- 2) KYC unificado (brasileiros e estrangeiros)
create table if not exists kyc_profiles (
  user_id uuid primary key references profiles(id) on delete cascade,
  tier text not null check (tier in ('pf_br','pj_br','pf_intl','pj_intl')),
  status text not null default 'pending'
    check (status in ('pending','in_review','approved','rejected')),
  country text not null default 'BR',
  data jsonb not null default '{}'::jsonb, -- campos declarados por tier
  doc_paths text[] not null default '{}',  -- caminhos no bucket kyc-docs
  risk_notes text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3) RLS (idempotente: remove versões anteriores antes de criar)
drop policy if exists contracts_select on contracts;
drop policy if exists contracts_insert on contracts;
drop policy if exists contracts_update on contracts;
drop policy if exists cv_select on contract_versions;
drop policy if exists cv_insert on contract_versions;
drop policy if exists cc_select on contract_comments;
drop policy if exists cc_insert on contract_comments;
drop policy if exists cc_update on contract_comments;
drop policy if exists ca_select on contract_approvals;
drop policy if exists ca_insert on contract_approvals;
drop policy if exists kyc_select on kyc_profiles;
drop policy if exists kyc_insert on kyc_profiles;
drop policy if exists kyc_update on kyc_profiles;
drop policy if exists kyc_docs_rw on storage.objects;
alter table contracts enable row level security;
alter table contract_versions enable row level security;
alter table contract_comments enable row level security;
alter table contract_approvals enable row level security;
alter table kyc_profiles enable row level security;

-- partes da conversa enxergam/criam o contrato
create policy contracts_select on contracts for select using (
  exists (select 1 from conversations c where c.id = conversation_id
          and (c.owner_id = auth.uid() or c.developer_id = auth.uid())));
create policy contracts_insert on contracts for insert with check (
  created_by = auth.uid() and exists (
    select 1 from conversations c where c.id = conversation_id
    and (c.owner_id = auth.uid() or c.developer_id = auth.uid())));
create policy contracts_update on contracts for update using (
  exists (select 1 from conversations c where c.id = conversation_id
          and (c.owner_id = auth.uid() or c.developer_id = auth.uid())));

create policy cv_select on contract_versions for select using (
  exists (select 1 from contracts k join conversations c on c.id = k.conversation_id
          where k.id = contract_id
          and (c.owner_id = auth.uid() or c.developer_id = auth.uid())));
create policy cv_insert on contract_versions for insert with check (
  created_by = auth.uid() and exists (
    select 1 from contracts k join conversations c on c.id = k.conversation_id
    where k.id = contract_id
    and (c.owner_id = auth.uid() or c.developer_id = auth.uid())));

create policy cc_select on contract_comments for select using (
  exists (select 1 from contracts k join conversations c on c.id = k.conversation_id
          where k.id = contract_id
          and (c.owner_id = auth.uid() or c.developer_id = auth.uid())));
create policy cc_insert on contract_comments for insert with check (
  author_id = auth.uid() and exists (
    select 1 from contracts k join conversations c on c.id = k.conversation_id
    where k.id = contract_id
    and (c.owner_id = auth.uid() or c.developer_id = auth.uid())));
create policy cc_update on contract_comments for update using (
  exists (select 1 from contracts k join conversations c on c.id = k.conversation_id
          where k.id = contract_id
          and (c.owner_id = auth.uid() or c.developer_id = auth.uid())));

create policy ca_select on contract_approvals for select using (
  exists (select 1 from contracts k join conversations c on c.id = k.conversation_id
          where k.id = contract_id
          and (c.owner_id = auth.uid() or c.developer_id = auth.uid())));
create policy ca_insert on contract_approvals for insert with check (user_id = auth.uid());

-- KYC: cada um vê e mantém só o seu (aprovação manual pelo admin no painel)
create policy kyc_select on kyc_profiles for select using (user_id = auth.uid());
create policy kyc_insert on kyc_profiles for insert with check (user_id = auth.uid());
create policy kyc_update on kyc_profiles for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and status in ('pending','in_review'));

-- 4) Bucket privado para documentos de KYC
insert into storage.buckets (id, name, public)
  values ('kyc-docs','kyc-docs', false)
  on conflict (id) do nothing;
create policy kyc_docs_rw on storage.objects for all
  using (bucket_id = 'kyc-docs' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'kyc-docs' and (storage.foldername(name))[1] = auth.uid()::text);
