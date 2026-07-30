-- ═════════ PALMO · MIGRATION: CAR/SICAR, FOTOS E EDIÇÃO DE ANÚNCIO ═════════
-- Lote `palmo-ai/car-sicar-e-fotos` (jul/2026).
--
-- ⚠️  NÃO FOI APLICADA. Quem roda no SQL Editor é o Carlos, e SÓ depois de
--     rodar o BLOCO 0 abaixo e conferir a saída contra o que este arquivo
--     assume. Nenhum agente aplicou nada em banco nenhum.
--
-- ── O QUE ESTA MIGRATION RESOLVE ────────────────────────────────────────────
-- 1. O selo "Verificado" mente. Hoje a view deriva o selo de
--    `car_number is not null and btrim(car_number) <> ''`, ou seja: digitar
--    "123" ganha selo. Passa a exigir confirmação real na base do SICAR.
-- 2. O selo não pode morar em `listings`. A policy "listings: owner updates
--    own" é `using (owner_id = auth.uid())` SEM `with check` e SEM restrição
--    de coluna — o dono atualiza qualquer coluna. Campo de confiança dentro de
--    `listings` é selo auto-cunhável. Vai para tabela separada, escrita só
--    pela service role, no desenho de `kyc_reviews`.
-- 3. Apagar anúncio destrói prova (ver BLOCO 4). O privilégio de DELETE é
--    fechado na raiz.
-- 4. Anúncio nunca teve foto porque não existia bucket nem upload.
--
-- ── IDEMPOTENTE ─────────────────────────────────────────────────────────────
-- `add column if not exists`, `create table if not exists`,
-- `drop policy if exists` antes de cada `create policy`, `do $$ ... $$` para
-- constraint. Rodar duas vezes não estraga nada.

-- ═══════════════════════════════════════════════════════════════════════════
-- BLOCO 0 — RODAR ANTES, SEPARADO, E CONFERIR A SAÍDA
-- ═══════════════════════════════════════════════════════════════════════════
-- Não é enfeite. Já quebrou duas vezes: o nome da policy no repo divergiu do
-- nome no banco, e `drop policy if exists` com nome errado NÃO dá erro — e
-- policies permissivas se SOMAM POR OU, então a brecha fica aberta em silêncio.
--
-- NÃO consegui rodar estas consultas: este ambiente não tem credencial de
-- banco, e `.env*` é intocável para agentes. A saída precisa ser colada no PR
-- por quem tiver acesso. Se qualquer nome divergir do que está comentado
-- abaixo, PARE e me chame antes de aplicar o resto.
--
--   select policyname, cmd, roles, qual, with_check from pg_policies
--   where schemaname='public' and tablename='listings' order by policyname;
--
--   -- esperado, conforme o repo (palmo-schema.sql + 20260728):
--   --   "listings: owner deletes own"            DELETE
--   --   "listings: owner inserts own"            INSERT
--   --   "listings: owner updates own"            UPDATE
--   --   "listings: read active (authenticated)"  SELECT  (renomeada em 28/jul)
--
--   select grantee, privilege_type from information_schema.role_table_grants
--   where table_schema='public' and table_name='listings' order by 1,2;
--
--   select policyname, cmd, roles, qual, with_check from pg_policies
--   where schemaname='storage' and tablename='objects' order by policyname;
--   -- esperado: kyc_docs_rw (ALL). Se o nome divergir, NÃO MEXA NELA.
--
--   select id, name, public, file_size_limit from storage.buckets order by id;
--   -- esperado: kyc-docs (public=false)
--
--   select table_name, column_name from information_schema.columns
--   where table_schema='public' and table_name='listings' order by ordinal_position;
--
--   select viewname from pg_views where schemaname='public';
--   -- confirma se `public_listings` existe (a migration de 28/jul foi aplicada?
--   --  o cabeçalho dela diz que não, mas o selo mentiroso está em produção)

begin;

-- ═══════════════════════════════════════════════════════════════════════════
-- BLOCO 1 — DECLARAÇÃO DO DONO em `listings` (só o que é declaração)
-- ═══════════════════════════════════════════════════════════════════════════
-- Estas duas colunas ficam em `listings` de propósito: são declaração do
-- proprietário e marcador de fato, não veredito de confiança. O dono poder
-- editá-las é o comportamento correto.

-- Código IBGE do município escolhido no formulário. Nulo permitido: anúncios
-- antigos não têm, e o formulário cai para texto livre quando a API do IBGE
-- falha (nesse caminho não existe código para capturar).
alter table public.listings
  add column if not exists municipality_ibge int;

-- Marcador visível de edição. Renderizado como "anúncio editado em [data]" na
-- página do anúncio e no cabeçalho da conversa. É render de dado, não
-- mecanismo novo: `messages` não é tocada e `Conversation.tsx` não muda.
alter table public.listings
  add column if not exists edited_at timestamptz;

comment on column public.listings.municipality_ibge is
  'Codigo IBGE do municipio declarado pelo dono. NAO e veredito: o municipio real do imovel vem do SICAR, em listing_car_verifications.';
comment on column public.listings.edited_at is
  'Ultima edicao de campo sensivel ao contrato. Alimenta o aviso "anuncio editado em [data]".';

-- ═══════════════════════════════════════════════════════════════════════════
-- BLOCO 2 — `listing_car_verifications`: o veredito, fora do alcance do dono
-- ═══════════════════════════════════════════════════════════════════════════
-- Uma LINHA POR TENTATIVA de verificação, nunca sobrescrita. Três ganhos:
--   • o dono não consegue cunhar o próprio selo (não tem policy de escrita);
--   • o selo pode dizer "conferido em [data]", porque a data está na linha;
--   • quando o CAR é editado, a tentativa antiga continua lá — é histórico.
--
-- Desenho copiado de `kyc_reviews` (20260729-kyc-triagem.sql): tabela de
-- auditoria, escrita só pela service role, e é a imutabilidade que a torna
-- prova. Registro que pode ser editado não é registro.

create table if not exists public.listing_car_verifications (
  id            uuid primary key default gen_random_uuid(),
  -- cascade igual a kyc_reviews: se o anúncio for removido pela service role,
  -- a auditoria dele vai junto. Do CLIENTE isso é inalcançável — o BLOCO 4
  -- revoga o privilégio de DELETE na raiz.
  listing_id    uuid not null references public.listings (id) on delete cascade,

  -- O CAR que foi conferido, já normalizado (UF-IBGE-SUFIXO). Guardado aqui
  -- para o histórico fazer sentido depois que o dono trocar o número em
  -- `listings.car_number`. NUNCA exposto na view pública.
  car_number_consultado text,

  -- O veredito. Domínio fechado por check constraint.
  status        text not null check (status in (
    'nao_informado',    -- dono não preencheu (campo é opcional)
    'formato_invalido', -- não reconhecemos o formato; NÃO bloqueia publicação
    'formato_ok',       -- estrutura válida, ninguém conferiu na fonte
    'confirmado_sicar', -- SICAR devolveu imóvel ATIVO e tudo bateu → SELO
    'divergente_sicar'  -- SICAR respondeu e algo não bate → SINAL INTERNO
  )),

  -- O objeto de checagens inteiro (lib/car-checks.ts → CarChecks), para
  -- auditoria: é o que sustenta o selo se alguém contestar.
  -- NÃO guarda latitude/longitude: o WFS é consultado com `propertyName`
  -- explícito e nunca devolve coordenada de ponto.
  checks        jsonb not null default '{}'::jsonb,

  -- Área declarada no SICAR, em hectares.
  area_ha       numeric,

  -- Município AUTORITATIVO segundo o SICAR — atributo `cod_municipio_ibge` da
  -- base, e NÃO o código embutido na string do CAR.
  --
  -- ⚠️  A DIFERENÇA ENTRE OS DOIS É O ACHADO MAIS IMPORTANTE DESTE LOTE.
  -- Medido em 29/07/2026 contra a base oficial: o código IBGE embutido no
  -- cod_imovel divergiu do atributo autoritativo em 10% (Xique-Xique/BA), 10%
  -- (Sorriso/MT), 7% (Rio Verde/GO) e 28% (Patos de Minas/MG) dos imóveis. Os
  -- divergentes apontam para municípios VIZINHOS (imóvel na divisa, ou
  -- cadastrado no vizinho) e em 800/800 casos ficaram dentro do mesmo estado.
  -- Comparar o código embutido reprovaria de 7% a 28% de donos legítimos.
  municipio_ibge_sicar int,

  -- Qual porta respondeu (e, na ingestão local, a data da base).
  fonte         text,

  -- GEOMETRIA DO IMÓVEL — polígono GeoJSON, PRIVADO.
  -- Vem de graça na mesma resposta que area e cod_municipio_ibge (medido:
  -- 0,43s, 762 bytes). É insumo da camada de satélite e é caro de conseguir
  -- depois, então guardamos agora. NÃO é exibido em lugar nenhum neste lote e
  -- NÃO entra na view pública: terra com contorno exato público é o mesmo
  -- risco de grilagem que o EXIF das fotos.
  -- jsonb de propósito: PostGIS não é habilitado agora.
  geometria     jsonb,
  crs           text,     -- observado: 'urn:ogc:def:crs:EPSG::4674' (SIRGAS 2000)

  -- Quando a fonte foi consultada. É isto que a copy do selo mostra.
  checked_at    timestamptz,
  created_at    timestamptz not null default now()
);

-- A consulta quente é "qual o veredito mais recente deste anúncio".
create index if not exists lcv_listing_idx
  on public.listing_car_verifications (listing_id, created_at desc);

alter table public.listing_car_verifications enable row level security;

-- anon não chega perto. O revoke é cinto e suspensório: mesmo que alguém crie
-- uma policy no futuro por engano, sem o GRANT o papel não alcança a tabela.
revoke all on public.listing_car_verifications from anon;

-- O dono LÊ o veredito sobre o anúncio dele (precisa, para consertar o CAR e
-- ganhar o selo), mas não escreve.
grant select on public.listing_car_verifications to authenticated;

drop policy if exists lcv_select_own on public.listing_car_verifications;
create policy lcv_select_own on public.listing_car_verifications
  for select to authenticated
  using (exists (
    select 1 from public.listings l
    where l.id = listing_id and l.owner_id = auth.uid()
  ));

-- NENHUMA policy de INSERT/UPDATE/DELETE, de propósito: só a service role
-- (que ignora RLS) escreve aqui. É o mesmo desenho que faz `kyc_reviews` ser
-- prova, e é o que impede o selo auto-cunhável.
revoke insert, update, delete on public.listing_car_verifications
  from anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- BLOCO 3 — `listing_changes`: o que mudou, não só que mudou
-- ═══════════════════════════════════════════════════════════════════════════
-- Campo, valor anterior, valor novo, autor, timestamp. Sem isto, "anúncio
-- editado" é uma afirmação sem lastro, e a Cláusula 3.4.1 dos Termos usa a
-- última proposta registrada como base de cálculo — histórico de preço importa.
--
-- Imutável pelo mesmo motivo de `legal_acceptances`: sem policy de UPDATE nem
-- DELETE. Registro que pode ser editado não é registro.

create table if not exists public.listing_changes (
  id           uuid primary key default gen_random_uuid(),
  listing_id   uuid not null references public.listings (id) on delete cascade,
  -- Quem editou. Na prática é sempre o dono (a server action confere), mas
  -- gravamos explicitamente em vez de inferir.
  actor_id     uuid references public.profiles (id) on delete set null,
  field        text not null,
  old_value    text,
  new_value    text,
  -- Marca as três finalidades para consulta rápida:
  --   'livre'    → título, descrição, água, cultura, fotos
  --   'car'      → car_number, state, municipality, hectares (resetam o selo)
  --   'contrato' → price_per_ha_year, hectares, purpose (têm peso contratual)
  categoria    text not null check (categoria in ('livre','car','contrato')),
  created_at   timestamptz not null default now()
);

create index if not exists listing_changes_listing_idx
  on public.listing_changes (listing_id, created_at desc);

alter table public.listing_changes enable row level security;

revoke all on public.listing_changes from anon;
grant select on public.listing_changes to authenticated;

-- Quem participa da negociação vê o histórico: o dono e quem tem conversa
-- aberta naquele anúncio. Sem isso, "anúncio editado em [data]" não tem para
-- onde levar, e a outra parte não consegue ver O QUÊ mudou.
drop policy if exists listing_changes_select on public.listing_changes;
create policy listing_changes_select on public.listing_changes
  for select to authenticated
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.conversations c
      where c.listing_id = listing_changes.listing_id
        and (c.owner_id = auth.uid() or c.developer_id = auth.uid())
    )
  );

-- Escrita só pela service role, como `legal_acceptances`. Sem UPDATE, sem
-- DELETE, para ninguém.
revoke insert, update, delete on public.listing_changes from anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- BLOCO 4 — FECHAR O DELETE DE ANÚNCIO NA RAIZ
-- ═══════════════════════════════════════════════════════════════════════════
-- ── O BURACO, conferido no schema ──────────────────────────────────────────
--   conversations.listing_id      → on delete cascade
--   offers.listing_id             → on delete cascade
--   messages.conversation_id      → on delete cascade (via conversations)
--   legal_acceptances.listing_id  → on delete cascade  ← ESTE é o pior
--   contracts.listing_id          → SEM cascade (NO ACTION)
--
-- Ou seja: o dono apagar o próprio anúncio apaga em cascata toda conversa,
-- toda mensagem, toda proposta E O PRÓPRIO REGISTRO DE ACEITE. Isso destrói
-- exatamente o que a Cláusula 3.4.2 define como prova e o que a 3.4.1 usa como
-- base de cálculo da multa. É o caminho de circunvenção mais limpo do produto:
-- combina por fora, apaga o anúncio, e a plataforma perde a prova contra si
-- mesma. Hoje não é alcançável porque não existe interface; a tela de edição
-- deste lote é onde nasceria.
--
-- ── A TRAVA, sem depender de nome de policy ────────────────────────────────
-- RLS só entra DEPOIS do privilégio de tabela. Sem o privilégio, nem uma
-- policy futura que esqueça a cláusula TO reabre a porta. É o mesmo mecanismo
-- que funcionou em 28/jul com `revoke select ... from anon`.
revoke delete on public.listings from authenticated, anon;

-- A policy "listings: owner deletes own" fica onde está, INTOCADA e inócua:
-- sem o privilégio ela nunca é avaliada. Não removemos porque mexer em policy
-- por nome é exatamente o que já quebrou duas vezes — e porque a service role
-- (Carlos, no SQL Editor) precisa continuar podendo agir.
--
-- Soft delete já estava modelado: `listing_status` tem 'archived', e a view
-- pública filtra `status = 'active'`. Arquivar tira do /explorar sem apagar
-- nada. A ação do proprietário é ARQUIVAR.
--
-- PENDÊNCIA DECLARADA, não implementada: se existir caso legítimo de exclusão
-- real (pedido de eliminação de dado pessoal, LGPD), isto precisa de decisão
-- do Carlos com o advogado. Anúncio de imóvel com histórico de negociação não
-- é dado pessoal simples, e a Política de Privacidade já fundamenta retenção.

-- ═══════════════════════════════════════════════════════════════════════════
-- BLOCO 5 — A VIEW PÚBLICA PARA DE MENTIR
-- ═══════════════════════════════════════════════════════════════════════════
-- ⚠️  `create or replace view` NÃO consegue renomear, reordenar nem remover
--     coluna: só ANEXAR no fim. Por isso as três colunas novas vêm DEPOIS de
--     `created_at`, e não ao lado de `verified`. Trocar a EXPRESSÃO de
--     `verified` é permitido porque o nome e o tipo (boolean) não mudam.
--
-- `security_invoker = off` MANTIDO e explícito: a view roda com os direitos do
-- dono (postgres, que ignora RLS). É isso que permite ela ler
-- `listing_car_verifications` sem dar grant de leitura para anon — e o
-- `where status = 'active'` continua sendo o contrato público inteiro.
-- ⚠️  Se alguém trocar para `security_invoker = on`, anon deixa de ver
--     QUALQUER COISA, porque anon levou `revoke select` na tabela base em
--     28/jul. Não trocar.
--
-- Continua FORA da view: car_number cru e matricula (foi exatamente a brecha
-- que a migration de 28/jul fechou) e agora também a geometria do imóvel.

create or replace view public.public_listings
  with (security_invoker = off) as
  select
    l.id,
    l.owner_id,        -- uuid opaco: habilita "isOwner" e o display_name
                       -- público via public_profiles; não é dado de contato
    l.title,
    l.state,
    l.municipality,
    l.hectares,
    l.purpose,
    l.crop,
    l.price_per_ha_year,
    l.description,
    l.has_water,

    -- ── O SELO, agora honesto ─────────────────────────────────────────────
    -- ANTES: (car_number is not null and btrim(car_number) <> '')
    --        → digitar "123" ganhava selo.
    -- AGORA: só confirmação real na base do SICAR. Enquanto não houver
    --        verificação `confirmado_sicar`, isto é `false` para todo mundo, e
    --        a interface não mostra selo nenhum.
    coalesce(cv.status = 'confirmado_sicar', false) as verified,

    l.photos,
    l.created_at,

    -- ── COLUNAS NOVAS, anexadas no fim (exigência do create or replace) ────

    -- Estado intermediário HONESTO. A copy que acompanha é
    -- "CAR declarado pelo proprietário", NUNCA "verificado".
    coalesce(cv.status = 'formato_ok', false) as car_declarado,

    -- Data da conferência, para o selo poder dizer "CAR ativo no SICAR,
    -- conferido em [data]". Sem isto o selo é uma afirmação sem lastro.
    cv.checked_at as car_checked_at,

    -- "anúncio editado em [data]", para a outra parte não ser surpreendida.
    l.edited_at
  from public.listings l
  -- O veredito MAIS RECENTE. `left join lateral` porque anúncio sem
  -- verificação nenhuma tem que continuar aparecendo (só sem selo).
  left join lateral (
    select v.status, v.checked_at
    from public.listing_car_verifications v
    where v.listing_id = l.id
    order by v.created_at desc
    limit 1
  ) cv on true
  where l.status = 'active';

-- Refeito porque `create or replace view` não preserva grant em toda versão.
grant select on public.public_listings to anon, authenticated;

-- `divergente_sicar` NÃO aparece aqui, em nenhuma forma. Não vira selo
-- negativo, não vira aviso, não vira nada em página pública. A plataforma não
-- acusa ninguém: é sinal interno para o Carlos olhar (consulta no fim).

-- ═══════════════════════════════════════════════════════════════════════════
-- BLOCO 6 — BUCKETS DE FOTO
-- ═══════════════════════════════════════════════════════════════════════════
-- DOIS buckets, e a separação é o desenho de segurança:
--
--   listing-photos-staging (PRIVADO) — onde o navegador deposita o arquivo
--     cru, via URL de upload assinada emitida pelo servidor. Ninguém além do
--     dono e do servidor lê. É aqui que o EXIF com GPS existe, por segundos.
--
--   listing-photos (PÚBLICO) — só o WebP já tratado (EXIF removido,
--     redimensionado, renomeado para UUID). Leitura pública é necessária
--     porque `public_listings.photos` é lido por anon.
--
-- Por que não um bucket só: se o cliente escrevesse direto no bucket público,
-- o arquivo com coordenada GPS ficaria publicamente legível ANTES de o
-- servidor limpar. A janela seria pequena e real.

insert into storage.buckets (id, name, public)
  values ('listing-photos-staging','listing-photos-staging', false)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('listing-photos','listing-photos', true)
  on conflict (id) do nothing;

-- Teto por arquivo no próprio storage, além da checagem no servidor.
-- 15 MB alinhado a MAX_FOTO_BYTES em lib/photo-pipeline.ts.
update storage.buckets
   set file_size_limit = 15728640
 where id in ('listing-photos-staging','listing-photos');

-- ── Staging: o dono escreve e lê SÓ a pasta dele ──────────────────────────
-- `(storage.foldername(name))[1] = auth.uid()::text` — mesmo molde do
-- `kyc_docs_rw`, porque o caminho é {owner_id}/{listing_id}/{uuid}.
drop policy if exists listing_photos_staging_rw on storage.objects;
create policy listing_photos_staging_rw on storage.objects for all
  to authenticated
  using (
    bucket_id = 'listing-photos-staging'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'listing-photos-staging'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── Bucket público: NENHUMA policy de escrita, de propósito ───────────────
-- Leitura pública vem de `public = true`. Escrita é exclusividade da service
-- role, porque é o servidor que grava o arquivo já limpo. Cliente não escreve
-- no bucket público em nenhuma hipótese — é o ponto inteiro da separação.
revoke insert, update, delete on storage.objects from anon;

-- ⚠️  A policy `kyc_docs_rw` NÃO é tocada aqui. Se o nome dela no banco
--     divergir do repo, isso é para REPORTAR, não para consertar de passagem.

-- ═══════════════════════════════════════════════════════════════════════════
-- BLOCO 7 — RASTRO DO FECHAMENTO DE NEGÓCIO (Camada 5)
-- ═══════════════════════════════════════════════════════════════════════════
-- O fechamento é o evento que gera a cobrança da Taxa, e hoje ninguém sabe
-- quem fechou nem quando. Só isso: DUAS COLUNAS.
--
-- ⚠️  ESTA MIGRATION NÃO MEXE EM PRIVILÉGIO NEM EM POLICY DE `conversations`
--     E `offers`. O Carlos já aplicou à mão, hoje, o que fechava a brecha:
--
--       revoke update on public.conversations from anon, authenticated;
--       grant  update (updated_at) on public.conversations to authenticated;
--       revoke update on public.offers from anon, authenticated;
--       grant  update (status) on public.offers to authenticated;
--
--     Repetir isso aqui com redação sutilmente diferente é exatamente como se
--     reabre uma brecha, então não repetimos. As policies
--     "conversations: participants update" e "offers: participants update
--     status" ficam INTOCADAS: o escopo amplo de participante é necessário (o
--     proprietário precisa aceitar proposta cujo `from_id` é o produtor). O que
--     faltava era restrição de COLUNA, e isso é privilégio, não policy.
--
--     `get_counterparty_contact` NÃO é tocada. Nem para melhorar, nem para
--     logar. É o portão do modelo de negócio.
--
-- Nota de segurança que vem de graça: privilégio de coluna é por coluna, então
-- `closed_at` e `closed_by` nascem SEM grant para `authenticated`. O cliente
-- não escreve neles nem por acidente — só a service role.
alter table public.conversations
  add column if not exists closed_at timestamptz;
alter table public.conversations
  add column if not exists closed_by uuid references public.profiles (id);

comment on column public.conversations.closed_at is
  'Quando o negocio foi fechado. Escrito SO pela service role, via closeDeal().';
comment on column public.conversations.closed_by is
  'Quem apertou o botao de fechar. Escrito SO pela service role.';

commit;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO (rodar DEPOIS, e conferir que continua fechado)
-- ═══════════════════════════════════════════════════════════════════════════
-- Confirma que a restrição de coluna aplicada à mão pelo Carlos segue de pé.
-- O resultado esperado é: `authenticated` com UPDATE APENAS em
-- `conversations.updated_at` e em `offers.status`, e `anon` sem nada.
-- Se aparecer UPDATE em `deal_status` ou em `price_per_ha_year`, PARE: a
-- brecha do contato revelado sem negócio fechado está aberta outra vez.
--
--   select grantee, privilege_type, column_name
--   from information_schema.column_privileges
--   where table_schema='public' and table_name in ('conversations','offers')
--     and grantee in ('anon','authenticated')
--   order by table_name, grantee, column_name;
--
-- E que as colunas novas de rastro não caíram para o cliente:
--
--   select grantee, privilege_type, column_name
--   from information_schema.column_privileges
--   where table_schema='public' and table_name='conversations'
--     and column_name in ('closed_at','closed_by');
--   -- esperado: nenhuma linha para anon/authenticated

-- ═══════════════════════════════════════════════════════════════════════════
-- DEPOIS DE APLICAR — visibilidade interna, sem tela nova
-- ═══════════════════════════════════════════════════════════════════════════
-- Anúncios cujo CAR precisa de olhada humana. `divergente_sicar` não aparece
-- em público, então é por aqui que ele é visto.
--
--   select l.id, l.title, l.state, l.municipality, l.hectares,
--          l.car_number, v.status, v.area_ha, v.municipio_ibge_sicar,
--          v.checked_at, v.fonte, v.checks -> 'reasons' as motivos
--     from public.listings l
--     join lateral (
--       select * from public.listing_car_verifications v2
--        where v2.listing_id = l.id
--        order by v2.created_at desc limit 1
--     ) v on true
--    where v.status in ('formato_invalido','divergente_sicar')
--    order by v.checked_at desc nulls last;
--
-- Histórico de edição de um anúncio:
--
--   select field, old_value, new_value, categoria, created_at
--     from public.listing_changes
--    where listing_id = '<uuid>'
--    order by created_at desc;
--
-- Conferir que arquivar NÃO apagou prova (o ponto inteiro do BLOCO 4):
--
--   select
--     (select count(*) from public.conversations   where listing_id = '<uuid>') as conversas,
--     (select count(*) from public.offers          where listing_id = '<uuid>') as propostas,
--     (select count(*) from public.legal_acceptances where listing_id = '<uuid>') as aceites,
--     (select count(*) from public.messages m join public.conversations c
--        on c.id = m.conversation_id where c.listing_id = '<uuid>')             as mensagens;
