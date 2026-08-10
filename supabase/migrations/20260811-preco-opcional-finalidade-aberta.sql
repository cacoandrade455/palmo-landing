-- ═══════ PALMO · MIGRATION: PRECO OPCIONAL E FINALIDADE ABERTA (ago/2026) ═══════
-- Lote `palmo-ai/preco-e-transparencia` (Partes A.1 e A.2).
--
-- ⚠️  NAO FOI APLICADA. Quem roda no SQL Editor e o Carlos, e SO depois de
--     rodar o BLOCO 0 abaixo e conferir a saida. Nenhum agente aplicou nada
--     em banco nenhum.
--
-- ⚠️  ARQUIVO SEPARADO de proposito: as migrations anteriores (ate
--     20260801-*) ja foram aplicadas e nao devem ser editadas.
--
-- ── O QUE ESTA PASSAGEM MUDA NO BANCO (spoiler: quase nada) ─────────────────
-- A.1 Preco opcional: o dono de terra parada nao sabe precificar, e nao
--     precisa. `listings.price_per_ha_year` passa a ser oficialmente
--     opcional ("Aberto a propostas" na UI = NULL no banco).
--     ESTADO ESPERADO: a coluna JA nasceu nullable no schema v1
--     (supabase/palmo-schema.sql linha 89: `price_per_ha_year numeric`,
--     sem not null) e nenhuma migration posterior a endureceu. O BLOCO 1
--     e um guard idempotente que so age se algum dia alguem tiver criado
--     um NOT NULL fora do repo. O esperado e NO-OP.
--     Quem congela o preco do negocio continua sendo `offers.price_per_ha_year`
--     (NOT NULL, check > 0), intocado: proposta sempre tem numero, e a base
--     de calculo da Clausula 3.4.1 nao passa perto desta migration.
-- A.2 Finalidade aberta: valor novo de aplicacao `aberta_a_propostas` na
--     coluna `listings.purpose`. A coluna e `text not null` SEM enum e SEM
--     check constraint (schema v1 linha 86), entao NAO ha mudanca de banco:
--     o BLOCO 0 apenas CONFERE que nenhuma constraint surgiu por fora.
--     A constante vive em lib/purpose-open.ts.
-- View `public_listings`: só repassa `l.price_per_ha_year` e `l.purpose`
--     sem transformacao (definicao vigente: 20260801-car-checked-at-privado.sql,
--     BLOCO 1). NULL passa como NULL, o valor novo de purpose passa como
--     texto. A view NAO e recriada aqui: nomes, tipos e posicoes ficam
--     exatamente como estao.
-- Ordenacao por preco: NAO existe no produto (a unica ordenacao e
--     `created_at desc` em app/explorar/actions.ts). Nada a proteger hoje.
--     Se um dia entrar sort por preco, lembrar do `nullsFirst: false` no
--     `.order()` do supabase-js (desc poe NULL primeiro por default).

-- ═══════════════════════════════════════════════════════════════════════════
-- BLOCO 0 — RODAR ANTES, SEPARADO, E CONFERIR A SAIDA
-- ═══════════════════════════════════════════════════════════════════════════
--
-- 0.a) A coluna de preco e nullable? (esperado: is_nullable = 'YES';
--      se vier 'NO', o BLOCO 1 corrige, e ai ele deixa de ser no-op)
--
--   select column_name, is_nullable, data_type
--   from information_schema.columns
--   where table_schema = 'public' and table_name = 'listings'
--     and column_name in ('price_per_ha_year', 'purpose')
--   order by column_name;
--   -- esperado:
--   --   price_per_ha_year | YES | numeric
--   --   purpose           | NO  | text     (purpose continua obrigatoria)
--
-- 0.b) Existe alguma CHECK constraint ou enum sobre purpose que barraria o
--      valor novo 'aberta_a_propostas'? (esperado: 0 linhas)
--
--   select conname, pg_get_constraintdef(oid)
--   from pg_constraint
--   where conrelid = 'public.listings'::regclass
--     and pg_get_constraintdef(oid) ilike '%purpose%';
--   -- esperado: 0 linhas (a unica check de listings e hectares > 0)
--
-- 0.c) A view publica repassa as duas colunas sem transformacao?
--      (esperado: as posicoes 7 e 9 da view, como na migration de 01/ago)
--
--   select column_name, ordinal_position
--   from information_schema.columns
--   where table_schema = 'public' and table_name = 'public_listings'
--     and column_name in ('purpose', 'price_per_ha_year')
--   order by ordinal_position;
--   -- esperado: purpose (7), price_per_ha_year (9)

begin;

-- ═══════════════════════════════════════════════════════════════════════════
-- BLOCO 1 — GUARD IDEMPOTENTE: garantir price_per_ha_year nullable
-- ═══════════════════════════════════════════════════════════════════════════
-- Esperado NO-OP (a coluna ja e nullable desde o schema v1). O guard existe
-- para o caso de um NOT NULL ter sido criado a mao fora do repo. Rodar duas
-- vezes nao muda nada.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'listings'
      and column_name = 'price_per_ha_year' and is_nullable = 'NO'
  ) then
    alter table public.listings alter column price_per_ha_year drop not null;
  end if;
end $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- BLOCO 2 — FINALIDADE ABERTA: nenhum comando
-- ═══════════════════════════════════════════════════════════════════════════
-- Registrado de proposito: `listings.purpose` e texto livre sem constraint,
-- entao o valor 'aberta_a_propostas' (lib/purpose-open.ts) nao exige DDL.
-- Este bloco existe para que o proximo leitor nao procure a migration que
-- "faltou": ela nao falta, o mecanismo escolhido foi constante de aplicacao.

commit;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICACAO (rodar DEPOIS de aplicar, e conferir o resultado)
-- ═══════════════════════════════════════════════════════════════════════════
--
--   select column_name, is_nullable
--   from information_schema.columns
--   where table_schema = 'public' and table_name = 'listings'
--     and column_name = 'price_per_ha_year';
--   -- esperado: YES
--
-- E a prova de fogo comportamental, sem tocar dado real: um anuncio com
-- preco NULL e purpose 'aberta_a_propostas' criado pelo app deve aparecer
-- na view publica com as duas colunas fieis:
--
--   select id, purpose, price_per_ha_year
--   from public.public_listings
--   where purpose = 'aberta_a_propostas' or price_per_ha_year is null
--   order by created_at desc limit 10;
--   -- esperado: as linhas de teste do lote, com price_per_ha_year NULL
--   --           saindo como NULL (nunca 0) e purpose fiel ao gravado.
