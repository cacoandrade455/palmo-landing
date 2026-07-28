-- ═══════════════ PALMO · MIGRATION: MARKETPLACE PÚBLICO (jul/2026) ═══════════════
-- Rodar UMA vez no Supabase → SQL Editor → New query → Run.
-- (Escrita pelo lote palmo-ai/home-e-marketplace; NÃO foi aplicada no banco.)
--
-- OBJETIVO: /explorar e /terra/[id] agora são públicos (leitura sem login).
-- O papel `anon` passa a enxergar SOMENTE colunas seguras de anúncios ATIVOS,
-- através da view `public_listings`.
--
-- ESTADO ANTERIOR (por que esta migration é necessária):
--   A policy "listings: read active" do schema v1 não tinha cláusula TO, ou
--   seja, valia para TODOS os papéis — inclusive `anon`, que conseguia ler
--   TODAS as colunas de anúncios ativos (inclusive car_number e matricula).
--   Esta migration fecha a tabela base para anon e abre apenas a view segura.
--
-- O QUE ANON PASSA A ALCANÇAR (tudo o mais continua negado):
--   • public_listings  → colunas seguras de anúncios com status = 'active'
--   • public_profiles  → campos públicos de perfil (display_name etc.),
--                        view contact-free que o schema v1 já expunha
--   Anon NÃO alcança: phone/email de profiles, listings pausadas/rascunho,
--   car_number cru, matricula, conversations, messages, offers, contracts,
--   contract_*, kyc_profiles (todas com RLS exigindo auth.uid()).

begin;

-- 1) Leitura da TABELA listings volta a ser exclusiva de usuários logados:
--    anúncios ativos de qualquer um + os próprios anúncios em qualquer status.
drop policy "listings: read active" on public.listings;
create policy "listings: read active (authenticated)"
  on public.listings for select
  to authenticated
  using (status = 'active' or owner_id = auth.uid());

-- 2) Cinto e suspensório: anon perde o GRANT de SELECT na tabela base.
--    (Mesmo que uma policy futura esqueça o TO, anon não lê a tabela.)
revoke select on public.listings from anon;

-- 3) View pública com SOMENTE as colunas seguras de anúncios ATIVOS.
--    security_invoker = off (explícito): a view roda com os direitos do dono
--    (postgres, que ignora RLS) — o WHERE abaixo é o contrato público inteiro.
--    Fora dele: contato do dono (nunca esteve em listings), CAR cru e
--    matrícula ficam de fora; `verified` é apenas um booleano derivado.
create view public.public_listings
  with (security_invoker = off) as
  select
    id,
    owner_id,        -- uuid opaco: habilita "isOwner" no app e o display_name
                     -- público via public_profiles; não é dado de contato
    title,
    state,
    municipality,
    hectares,
    purpose,
    crop,
    price_per_ha_year,
    description,
    has_water,
    (car_number is not null and btrim(car_number) <> '') as verified,
    photos,
    created_at
  from public.listings
  where status = 'active';

grant select on public.public_listings to anon, authenticated;

commit;
