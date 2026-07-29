-- ═══════════════ PALMO · MIGRATION: TRIAGEM DE KYC (jul/2026) ═══════════════
-- Rodar UMA vez no Supabase → SQL Editor → New query → Run.
-- (Escrita pelo lote palmo-ai/kyc-triagem; NÃO foi aplicada no banco.)
--
-- OBJETIVO: tirar o KYC do 100% manual. A SUBMISSÃO passa a rodar checagens
-- automáticas (dígito verificador, Receita Federal via dados abertos,
-- duplicidade, sanidade do arquivo), guardar o resultado estruturado e
-- DECIDIR só o caso obviamente limpo. Todo o resto vai para uma fila humana
-- com os motivos escritos. Nada é auto-rejeitado — rejeitar é ato humano.
--
-- ESTADO ANTERIOR (o que esta migration muda):
--   kyc_profiles tinha (user_id, tier, status, country, data, doc_paths,
--   risk_notes, reviewed_at, created_at, updated_at). Não havia onde gravar
--   o resultado de uma checagem, nem quem decidiu, nem por quê, nem trilha
--   de auditoria. O fundador abria o Supabase e rodava UPDATE na mão.
--
-- QUEM ESCREVE O QUÊ, DEPOIS DESTA MIGRATION:
--   • usuário (anon key + RLS) → cria/atualiza a PRÓPRIA linha, e agora só
--     consegue deixá-la em 'pending'/'in_review' (ver item 4 — antes dava
--     para nascer 'approved').
--   • servidor da Palmo (service role, nunca no browser) → grava o
--     resultado da triagem, a decisão automática, e as ações do painel.
--   • ninguém mais alcança kyc_reviews / kyc_notifications: RLS ligada,
--     grants revogados e nenhuma policy de escrita para cliente.
--
-- NÃO EXIGE DEPLOY NOVO PARA "LIGAR": o app detecta a ausência das colunas
-- e degrada para o comportamento de hoje (tudo entra como 'pending' na fila
-- manual, sem auto-aprovação). Aplicada a migration, a triagem passa a valer.

begin;

-- ─────────────────────────────────────────────────────────────────────────
-- 1) RESULTADO DA TRIAGEM E RASTRO DA DECISÃO, NA PRÓPRIA LINHA DE KYC
-- ─────────────────────────────────────────────────────────────────────────

-- Resultado ESTRUTURADO das checagens automáticas, escrito na submissão.
-- Formato (lib/kyc-checks.ts → KycChecks): { version, ran_at, document,
-- receita, name_match, duplicate, file, reasons[], auto_approved }.
-- jsonb (e não colunas soltas) porque o conjunto de checagens vai crescer
-- (OCR, biometria) e cada tier checa coisas diferentes.
alter table public.kyc_profiles
  add column if not exists checks jsonb not null default '{}'::jsonb;

-- QUEM decidiu: 'automatico' (regra de decisão) ou 'admin' (painel).
-- Nulo enquanto a linha está na fila — ninguém decidiu ainda.
alter table public.kyc_profiles
  add column if not exists decided_by text;

-- Constraint em passo separado e idempotente: `add column if not exists`
-- não recria a constraint se a coluna já existir de uma execução anterior.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'kyc_profiles_decided_by_chk'
  ) then
    alter table public.kyc_profiles
      add constraint kyc_profiles_decided_by_chk
      check (decided_by is null or decided_by in ('automatico','admin'));
  end if;
end $$;

-- QUAL humano decidiu, quando foi humano. Nulo na decisão automática.
-- on delete set null: apagar o perfil do admin não pode apagar o KYC alheio.
alter table public.kyc_profiles
  add column if not exists decided_by_user_id uuid
  references public.profiles (id) on delete set null;

-- POR QUÊ. Na auto-aprovação, o motivo legível gerado pela regra; na decisão
-- humana, o texto que o admin escreveu (obrigatório na rejeição — é ele que
-- vai no e-mail que ensina o usuário a corrigir).
alter table public.kyc_profiles
  add column if not exists decision_reason text;

-- E-mail de contato no momento da submissão (vem de auth.users.email).
-- Guardado aqui para que a notificação não precise de acesso de leitura a
-- profiles.phone/email de terceiros — o gate de contato continua intacto.
alter table public.kyc_profiles
  add column if not exists notify_email text;

-- Quando a submissão entrou. `created_at` marca a PRIMEIRA submissão e não
-- se move no upsert de uma refeita; `submitted_at` marca a submissão atual,
-- que é o que ordena a fila e o que conta para a retenção do documento.
alter table public.kyc_profiles
  add column if not exists submitted_at timestamptz;

-- Marca de descarte do documento (ver item 6, retenção). Preenchida quando a
-- imagem é apagada do bucket; o dado verificado (checks) permanece.
alter table public.kyc_profiles
  add column if not exists doc_purged_at timestamptz;

-- A fila do painel é "status pendente, mais antigo primeiro". Índice parcial
-- porque a fila é minúscula perto do total de linhas aprovadas.
create index if not exists kyc_profiles_fila_idx
  on public.kyc_profiles (submitted_at)
  where status in ('pending','in_review');

-- Busca de duplicidade: "este CPF/CNPJ já foi aprovado em outra conta?".
-- Índices de expressão sobre o jsonb, um por documento, só nas aprovadas.
create index if not exists kyc_profiles_cpf_aprovado_idx
  on public.kyc_profiles ((data->>'cpf'))
  where status = 'approved';
create index if not exists kyc_profiles_cnpj_aprovado_idx
  on public.kyc_profiles ((data->>'cnpj'))
  where status = 'approved';

-- ─────────────────────────────────────────────────────────────────────────
-- 2) AUDITORIA — toda ação sobre um KYC vira uma linha imutável
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists public.kyc_reviews (
  id          uuid primary key default gen_random_uuid(),
  -- DE QUEM é o KYC. cascade: se o titular some, a auditoria dele some junto
  -- (é dado pessoal dele; LGPD, direito à eliminação).
  subject_id  uuid not null references public.profiles (id) on delete cascade,
  -- QUEM agiu. Nulo quando a ação foi da máquina (action = 'auto_approve').
  admin_id    uuid references public.profiles (id) on delete set null,
  -- O QUÊ. 'triage' = triagem rodou e mandou para a fila; 'auto_approve' =
  -- a regra aprovou sozinha; 'view_doc' = admin abriu o documento (acesso a
  -- dado sensível também é auditado); 'approve'/'reject' = ação humana.
  action      text not null check (
    action in ('triage','auto_approve','view_doc','approve','reject')
  ),
  -- POR QUÊ, em texto legível. Obrigatório na rejeição (validado no servidor).
  reason      text,
  -- Fotografia das checagens no instante da ação: a auditoria precisa provar
  -- COM QUE INFORMAÇÃO se decidiu, mesmo que kyc_profiles.checks mude depois.
  checks      jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists kyc_reviews_subject_idx
  on public.kyc_reviews (subject_id, created_at desc);

-- ─────────────────────────────────────────────────────────────────────────
-- 3) LIVRO DE NOTIFICAÇÕES — serve para AGRUPAR os avisos ao admin
-- ─────────────────────────────────────────────────────────────────────────
-- Sem isto, dez submissões em dez minutos viram dez e-mails. Antes de avisar,
-- o servidor pergunta "já avisei nos últimos N minutos?"; se sim, cala — e o
-- próximo aviso resume a fila inteira, então nada se perde.

create table if not exists public.kyc_notifications (
  id       uuid primary key default gen_random_uuid(),
  -- 'admin_queue' hoje; deixa espaço para outros tipos sem nova migration.
  kind     text not null,
  sent_at  timestamptz not null default now(),
  -- O que o e-mail dizia (quantos na fila, quais ids) — para depurar
  -- "por que não recebi aviso daquele caso".
  payload  jsonb not null default '{}'::jsonb
);

create index if not exists kyc_notifications_kind_idx
  on public.kyc_notifications (kind, sent_at desc);

-- ─────────────────────────────────────────────────────────────────────────
-- 4) RLS — o que o CLIENTE alcança (e o buraco que isto fecha)
-- ─────────────────────────────────────────────────────────────────────────

alter table public.kyc_reviews       enable row level security;
alter table public.kyc_notifications enable row level security;

-- kyc_notifications: RLS ligada e NENHUMA policy = ninguém com anon key lê
-- ou escreve, em nenhuma hipótese. Só a service role (que ignora RLS) toca.
-- O revoke é cinto e suspensório: mesmo que alguém crie uma policy no futuro
-- por engano, sem o GRANT o papel não chega na tabela.
revoke all on public.kyc_notifications from anon, authenticated;

-- kyc_reviews: escrita SÓ pela service role (nenhuma policy de insert/update/
-- delete). Leitura: o titular enxerga o histórico de decisões SOBRE ELE — é
-- transparência devida pela LGPD (art. 9º e 20), e é o mesmo texto que ele já
-- recebe por e-mail. Ninguém vê a auditoria de outro usuário.
revoke all on public.kyc_reviews from anon;
grant select on public.kyc_reviews to authenticated;
drop policy if exists kyc_reviews_select_own on public.kyc_reviews;
create policy kyc_reviews_select_own on public.kyc_reviews
  for select to authenticated
  using (subject_id = auth.uid());

-- ── Correção de uma brecha PRÉ-EXISTENTE do Lote B ──
-- A policy de INSERT era `with check (user_id = auth.uid())`, sem restringir
-- `status`. Ou seja: qualquer usuário com a anon key (que é pública, por
-- desenho) podia INSERIR a própria linha de KYC já com status = 'approved' e
-- sair com o selo de verificado sem passar por ninguém. A policy de UPDATE já
-- travava isso ('pending','in_review'); a de INSERT, não — e o primeiro
-- registro de cada usuário é justamente um INSERT.
-- Agora o cliente só consegue nascer em 'pending'/'in_review'. Aprovar e
-- rejeitar passam a ser exclusividade do servidor (service role).
drop policy if exists kyc_insert on public.kyc_profiles;
create policy kyc_insert on public.kyc_profiles
  for insert to authenticated
  with check (user_id = auth.uid() and status in ('pending','in_review'));

-- Recriada idêntica à do Lote B, só para deixar as duas lado a lado e
-- explícito que UPDATE do cliente também não alcança 'approved'/'rejected'.
drop policy if exists kyc_update on public.kyc_profiles;
create policy kyc_update on public.kyc_profiles
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and status in ('pending','in_review'));

-- NÃO existe policy de admin em kyc_profiles, e é de propósito. O painel lê a
-- fila com a service role, do lado do servidor, depois de conferir o usuário
-- contra a allowlist PALMO_KYC_ADMIN_IDS. Criar uma policy "admin vê tudo"
-- abriria um segundo caminho de leitura, alcançável com a anon key a partir
-- do browser — exatamente o que não queremos para documento de identidade.

-- ─────────────────────────────────────────────────────────────────────────
-- 5) STORAGE — o bucket kyc-docs continua PRIVADO e fechado
-- ─────────────────────────────────────────────────────────────────────────
-- Nada muda aqui, e o não-mudar é a decisão: o bucket foi criado com
-- public = false no Lote B, e a policy kyc_docs_rw restringe cada usuário à
-- pasta {auth.uid()}/. O painel NÃO ganha policy de leitura no storage: ele
-- gera URL assinada de curta duração pela service role, do lado do servidor,
-- e cada geração vira uma linha 'view_doc' em kyc_reviews.
-- Confirmação (rodar e conferir que public = false):
--   select id, public from storage.buckets where id = 'kyc-docs';

-- ─────────────────────────────────────────────────────────────────────────
-- 6) RETENÇÃO DO DOCUMENTO — o dado verificado fica, a imagem não
-- ─────────────────────────────────────────────────────────────────────────
-- LGPD art. 15/16: dado pessoal só se guarda enquanto a finalidade existir.
-- A finalidade da FOTO do documento é provar a identidade uma vez; provada,
-- o que precisa sobreviver é o RESULTADO (checks + decisão + auditoria), não
-- a imagem. Proposta desta entrega — 90 dias após a decisão:
--   • aprovado  → descartar a imagem 90 dias depois da aprovação;
--   • rejeitado → idem, contados da rejeição (a janela cobre uma contestação);
--   • na fila   → nunca descartar (ainda é necessária para decidir).
-- Esta migration NÃO agenda nada e NÃO apaga nada: cria só o lugar de marcar
-- (`doc_purged_at`) e deixa a consulta pronta. O descarte no bucket é feito
-- pelo app/Storage API; o SQL abaixo só carimba as linhas já descartadas.
--
--   -- 1) listar o que já passou do prazo (rodar antes de apagar):
--   select user_id, doc_paths, reviewed_at
--     from public.kyc_profiles
--    where status in ('approved','rejected')
--      and doc_purged_at is null
--      and reviewed_at < now() - interval '90 days';
--
--   -- 2) depois de apagar os objetos do bucket, carimbar:
--   update public.kyc_profiles
--      set doc_paths = '{}', doc_purged_at = now()
--    where status in ('approved','rejected')
--      and doc_purged_at is null
--      and reviewed_at < now() - interval '90 days';

commit;
