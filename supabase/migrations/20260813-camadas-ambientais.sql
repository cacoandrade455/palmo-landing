-- ═══════ PALMO · MIGRATION: CAMADAS AMBIENTAIS DO CAR (ago/2026) ═══════
-- Lote `palmo-ai/camadas-ambientais`.
--
-- ⚠️  NAO FOI APLICADA. Quem roda no SQL Editor e o Carlos, e SO depois de
--     rodar o BLOCO 0 abaixo e conferir a saida. Nenhum agente aplicou nada
--     em banco nenhum.
--
-- ⚠️  ARQUIVO SEPARADO: as migrations anteriores ja foram aplicadas e nao
--     devem ser editadas. Este arquivo INTEIRO e seguro para colar num Run
--     so — os dois blocos vao no mesmo begin/commit e sao idempotentes
--     (`create table if not exists`, `drop policy if exists`,
--     `create or replace view`, revoke/grant repetidos nao doem).
--
-- ── O QUE ESTA MIGRATION RESOLVE ────────────────────────────────────────────
-- O anuncio publico passa a mostrar o que o CAR DECLARA sobre o imovel:
-- perimetro, Reserva Legal, APP, e a estimativa de area livre dessas duas.
-- Isso e dado geografico volumoso e derivado, e nao tem por que morar em
-- `listings` (que o dono atualiza inteira) nem em
-- `listing_car_verifications` (que e prova do selo e nao pode engordar).
--
-- ── E O QUE ELA DELIBERADAMENTE NAO FAZ ─────────────────────────────────────
-- Nenhum calculo pelo Codigo Florestal, nenhum juizo de conformidade, nenhum
-- campo do tipo "regular/irregular". A tabela guarda o que a fonte declarou e
-- a aritmetica de area que o servidor fez sobre essa declaracao — e o nome da
-- coluna de origem (`*_fonte`) diz qual dos dois e cada numero.
--
-- ── POR QUE NAO E PostGIS ───────────────────────────────────────────────────
-- Geometria em `jsonb`, igual a `listing_car_verifications.geometria`. O
-- banco nao precisa fazer conta geometrica nenhuma: quem une poligonos e mede
-- area e o servidor Node, uma vez por evento de anuncio. Habilitar PostGIS em
-- producao para uma conta que roda fora do banco seria pagar caro por nada.

-- ═══════════════════════════════════════════════════════════════════════════
-- BLOCO 0 — RODAR ANTES, SEPARADO, E CONFERIR A SAIDA
-- ═══════════════════════════════════════════════════════════════════════════
-- Nao e enfeite. O nome de policy no repo ja divergiu do nome no banco duas
-- vezes, e `drop policy if exists` com nome errado NAO da erro — policies
-- permissivas se somam por OU e a brecha fica aberta em silencio.
--
-- 0.1 — a tabela ja existe? (esperado: 0 linhas antes da primeira aplicacao)
--
--   select table_name from information_schema.tables
--   where table_schema='public' and table_name='listing_car_layers';
--
-- 0.2 — a view ja existe? (esperado: 0 linhas antes da primeira aplicacao)
--
--   select table_name from information_schema.views
--   where table_schema='public' and table_name='public_listing_car_layers';
--
-- 0.3 — policies ja existentes nos dois objetos, POR NOME REAL DO BANCO:
--
--   select tablename, policyname, cmd, roles
--   from pg_policies
--   where schemaname='public' and tablename='listing_car_layers'
--   order by policyname;
--
-- 0.4 — a view do anuncio continua com security_invoker DESLIGADO?
--       (esperado: nenhuma linha com 'security_invoker=on'. Se aparecer,
--        PARE: anon perdeu a leitura em algum momento e o problema e outro.)
--
--   select c.relname, c.reloptions
--   from pg_class c join pg_namespace n on n.oid = c.relnamespace
--   where n.nspname='public' and c.relname in
--     ('public_listings','public_listing_car_layers');
--
-- 0.5 — grants atuais de anon/authenticated no schema (fotografia do "antes"):
--
--   select table_name, grantee,
--          string_agg(privilege_type, ', ' order by privilege_type) as privs
--   from information_schema.role_table_grants
--   where table_schema='public' and grantee in ('anon','authenticated')
--     and table_name in ('listing_car_layers','public_listing_car_layers')
--   group by table_name, grantee order by table_name, grantee;

begin;

-- ═══════════════════════════════════════════════════════════════════════════
-- BLOCO 1 — A TABELA
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.listing_car_layers (
  id            uuid primary key default gen_random_uuid(),

  -- UNIQUE de proposito: uma linha por anuncio, e reprocessar SUBSTITUI (o
  -- servidor usa upsert com onConflict=listing_id). Aqui nao ha historico a
  -- preservar como em listing_car_verifications: isto e cache de exibicao de
  -- uma fonte externa, nao prova de veredito.
  -- Cascade igual as demais: se o anuncio for removido pela service role, o
  -- cache vai junto. Do CLIENTE isso e inalcancavel — DELETE em listings esta
  -- revogado na raiz desde 29/jul.
  listing_id    uuid not null unique references public.listings (id) on delete cascade,

  -- O CAR consultado, ja normalizado (UF-IBGE-SUFIXO). NUNCA vai para a view
  -- publica: numero de CAR cru continua fora do alcance de anon, como sempre
  -- esteve.
  cod_imovel    text not null,

  -- Qual porta respondeu. Hoje: 'wfs-sicar-consulta-publica'.
  source        text not null,

  -- Quando a fonte foi consultada. E ESTA data que a interface exibe ao lado
  -- dos numeros; sem ela o dado nao aparece.
  fetched_at    timestamptz not null,

  -- CRS declarado pela fonte. Observado: 'urn:ogc:def:crs:EPSG::4674'.
  crs           text,

  -- Tolerancia da simplificacao de exibicao, em metros. Documentada na coluna
  -- porque quem ler a geometria daqui a um ano precisa saber que ela NAO e o
  -- contorno exato — o exato continua privado em
  -- listing_car_verifications.geometria.
  simplificacao_m numeric not null,

  -- ── GEOMETRIAS DE EXIBICAO (GeoJSON MultiPolygon em jsonb) ────────────────
  -- Simplificadas DEPOIS de as areas serem medidas: nenhum numero desta tabela
  -- depende do quanto o desenho foi enxugado.
  geom_perimetro jsonb not null,
  geom_rl        jsonb,
  geom_app       jsonb,

  -- ── AREAS, em hectares, cada uma com a ORIGEM declarada ──────────────────
  -- 'sicar_atributo'      = numero oficial da fonte (o que o dono ve no CAR)
  -- 'calculada_geometria' = medido pelo servidor sobre a geometria declarada
  -- A distincao existe porque a regra 6 do CLAUDE.md nao aceita numero sem
  -- procedencia, e "o CAR disse" e "nos medimos" nao sao a mesma afirmacao.
  area_total_ha        numeric,
  area_total_fonte     text check (area_total_fonte in ('sicar_atributo','calculada_geometria')),
  area_rl_ha           numeric,
  area_rl_fonte        text check (area_rl_fonte in ('sicar_atributo','calculada_geometria')),
  area_app_ha          numeric,
  area_app_fonte       text check (area_app_fonte in ('sicar_atributo','calculada_geometria')),

  -- A UNIAO de RL e APP. Sempre medida sobre a geometria: a fonte publica as
  -- duas camadas separadas e o Codigo Florestal PERMITE que se sobreponham
  -- (art. 15), entao somar contaria a intersecao duas vezes.
  area_rl_app_uniao_ha numeric,

  -- Area total menos a uniao. `null` quando nao houve o que subtrair (nenhuma
  -- RL e nenhuma APP declaradas) ou quando a conta daria negativo (RL/APP
  -- declaradas fora do perimetro, que acontece). Zero seria um veredito.
  area_util_estimada_ha numeric,

  -- Quais camadas do SICAR devolveram feicao. Rastro de auditoria: e o que
  -- permite explicar depois por que a APP deu o que deu.
  camadas_presentes text[] not null default '{}',

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- A consulta quente e "as camadas deste anuncio". O unique de listing_id ja
-- cria o indice; este aqui serve a guarda de "ja buscamos hoje este CAR".
create index if not exists lcl_cod_imovel_idx
  on public.listing_car_layers (cod_imovel, fetched_at desc);

alter table public.listing_car_layers enable row level security;

-- anon nao chega perto da TABELA (a leitura publica e pela view, e so para
-- anuncio ativo). Revoke e cinto e suspensorio: mesmo que alguem crie uma
-- policy por engano no futuro, sem GRANT o papel nao alcanca a tabela.
revoke all on public.listing_car_layers from anon;

-- O dono LE as camadas do proprio anuncio, inclusive quando ele nao esta
-- publicado — e isso que permite conferir o resultado antes de publicar.
grant select on public.listing_car_layers to authenticated;

drop policy if exists lcl_select_own on public.listing_car_layers;
create policy lcl_select_own on public.listing_car_layers
  for select to authenticated
  using (exists (
    select 1 from public.listings l
    where l.id = listing_id and l.owner_id = auth.uid()
  ));

-- NENHUMA policy de INSERT/UPDATE/DELETE, de proposito: so a service role
-- (que ignora RLS) escreve aqui.
--
-- E a imutabilidade vem do PRIVILEGIO REVOGADO, nao da ausencia de policy —
-- ausencia e fragil, porque alguem "completa" a policy achando que falta.
-- TRUNCATE entra na lista porque TRUNCATE escapa do RLS; TRIGGER e REFERENCES
-- entram porque nenhum dos dois serve ao PostgREST e ambos dao alavanca sobre
-- a tabela.
revoke insert, update, delete, truncate, trigger, references
  on public.listing_car_layers from anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- BLOCO 2 — A VIEW PUBLICA
-- ═══════════════════════════════════════════════════════════════════════════
-- ⚠️  VIEW NOVA, e nao coluna nova em `public_listings`. A regra da casa e que
--     `create or replace view` so muda EXPRESSAO (nomes, tipos e ordem de
--     coluna mantidos) — e acrescentar coluna violaria isso. A view do anuncio
--     nao e tocada por esta migration.
--
-- `security_invoker = off` explicito: a view roda com os direitos do dono
-- (postgres, que ignora RLS), e e isso que permite ela ler a tabela base sem
-- dar grant de leitura para anon. O `where l.status = 'active'` e o contrato
-- publico inteiro.
-- ⚠️  Se alguem trocar para `security_invoker = on`, anon deixa de ver
--     QUALQUER COISA. Nao trocar.
--
-- FORA da view, de proposito: `cod_imovel` (numero de CAR cru nunca foi
-- publico) e `source` (nome interno do adapter). O que sai daqui e o desenho
-- simplificado, as areas, a origem de cada numero e a data da consulta — o
-- suficiente para a interface citar fonte, e nada alem.

create or replace view public.public_listing_car_layers
  with (security_invoker = off) as
  select
    cl.listing_id,
    cl.fetched_at,
    cl.simplificacao_m,
    cl.geom_perimetro,
    cl.geom_rl,
    cl.geom_app,
    cl.area_total_ha,
    cl.area_total_fonte,
    cl.area_rl_ha,
    cl.area_rl_fonte,
    cl.area_app_ha,
    cl.area_app_fonte,
    cl.area_rl_app_uniao_ha,
    cl.area_util_estimada_ha
  from public.listing_car_layers cl
  join public.listings l on l.id = cl.listing_id
  where l.status = 'active';

-- ⚠️  REVOKE ANTES DO GRANT, E NAO SO O GRANT.
--
-- Medido em 13/08/2026, na primeira aplicacao deste arquivo: a view nasceu com
-- DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE e UPDATE para anon E
-- para authenticated. Nao foi erro de quem escreveu: o Supabase mantem
-- `alter default privileges in schema public grant all on tables`, entao TODO
-- objeto novo do schema nasce com tudo — o que tambem significa que a higiene
-- de TRUNCATE/TRIGGER/REFERENCES da migration de 11/08 vale para os objetos
-- que existiam naquele dia e NAO se estende sozinha aos que vierem depois.
--
-- Nao havia caminho de escrita alcancavel (view com `join` nao e
-- auto-atualizavel no Postgres, entao INSERT/UPDATE/DELETE nela falham de
-- qualquer jeito), e e por isso mesmo que o privilegio tinha que sair: a
-- doutrina da casa e imutabilidade por PRIVILEGIO REVOGADO, nunca por ausencia
-- de caminho. Caminho aparece; privilegio revogado continua revogado.
--
-- `grant select` DEPOIS do revoke, e nunca antes: nesta ordem o resultado e o
-- mesmo rodando uma vez ou dez.
revoke all on public.public_listing_car_layers from anon, authenticated;
grant select on public.public_listing_car_layers to anon, authenticated;

commit;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICACAO (rodar DEPOIS de aplicar, e conferir o resultado)
-- ═══════════════════════════════════════════════════════════════════════════
-- Este mesmo bloco vai COLAVEL no corpo do PR: aprendemos que conferencia que
-- so existe como comentario vira caca ao codigo.
--
-- V1 — a tabela nasceu fechada para o cliente?
--      esperado: anon SEM nenhuma linha; authenticated com SELECT e so.
--
--   select grantee, string_agg(privilege_type, ', ' order by privilege_type)
--   from information_schema.role_table_grants
--   where table_schema='public' and table_name='listing_car_layers'
--     and grantee in ('anon','authenticated')
--   group by grantee order by grantee;
--
-- V2 — a unica policy e de SELECT do proprio dono?
--      esperado: exatamente 1 linha, lcl_select_own / SELECT / {authenticated}
--
--   select policyname, cmd, roles, qual
--   from pg_policies
--   where schemaname='public' and tablename='listing_car_layers';
--
-- V3 — a view esta com security_invoker DESLIGADO?
--      esperado: reloptions nulo ou sem 'security_invoker=on'
--
--   select c.relname, c.reloptions
--   from pg_class c join pg_namespace n on n.oid = c.relnamespace
--   where n.nspname='public' and c.relname='public_listing_car_layers';
--
-- V4 — a view so mostra anuncio ATIVO?
--      esperado: 0. Se der mais que 0, a clausula de status quebrou e dado de
--      anuncio arquivado esta publico.
--
--   select count(*) from public.public_listing_car_layers v
--   join public.listings l on l.id = v.listing_id
--   where l.status <> 'active';
--
-- V5 — nenhum numero sem origem declarada?
--      esperado: 0 em todas as tres contagens.
--
--   select
--     count(*) filter (where area_total_ha is not null and area_total_fonte is null) as total_sem_fonte,
--     count(*) filter (where area_rl_ha    is not null and area_rl_fonte    is null) as rl_sem_fonte,
--     count(*) filter (where area_app_ha   is not null and area_app_fonte   is null) as app_sem_fonte
--   from public.listing_car_layers;
--
-- V6 — a area util nunca e negativa nem inventada?
--      esperado: 0.
--
--   select count(*) from public.listing_car_layers
--   where area_util_estimada_ha < 0
--      or (area_util_estimada_ha is not null and area_rl_app_uniao_ha is null);
--
-- V7b — a VIEW tambem esta fechada para escrita?
--       esperado: anon e authenticated com SELECT, e SO SELECT. Se aparecer
--       INSERT/UPDATE/DELETE/TRUNCATE/TRIGGER/REFERENCES, o revoke do BLOCO 2
--       nao rodou (ou alguem recriou a view sem ele) e o default privilege do
--       Supabase venceu de novo.
--
--   select grantee, string_agg(privilege_type, ', ' order by privilege_type)
--   from information_schema.role_table_grants
--   where table_schema='public' and table_name='public_listing_car_layers'
--     and grantee in ('anon','authenticated')
--   group by grantee order by grantee;
--
-- V7 — o CAR cru NAO vazou para a view publica?
--      esperado: 0 linhas (nenhuma coluna chamada cod_imovel na view).
--
--   select column_name from information_schema.columns
--   where table_schema='public' and table_name='public_listing_car_layers'
--     and column_name in ('cod_imovel','source');
