-- ============================================================================
-- PALMO — SEED DE DEMONSTRAÇÃO (DEMO/DEV APENAS)
--
-- Rodar MANUALMENTE no SQL Editor do Supabase. Não é migração.
-- Cria 6 anúncios fictícios (título prefixado com [DEMO]) para demo e
-- screenshots do marketplace. Requer ao menos 1 linha em `profiles`
-- (entre no app uma vez antes de rodar).
--
-- Para apagar tudo depois:
--   delete from listings where title like '[DEMO]%';
--
-- Preços: cada `price_per_ha_year` está DENTRO da faixa que a calculadora
-- pública (/quanto-vale) exibe para aquele uso/UF — fontes citadas em cada
-- insert (lib/appraisal-data.ts, lib/prices.json, lib/vtn-data.json).
-- Onde a calculadora não exibe faixa de arrendamento por hectare
-- (aquicultura), o preço fica NULL ("a combinar") para não inventar número.
-- ============================================================================

-- Todos os anúncios são atribuídos ao PRIMEIRO perfil criado na conta
-- (o dono da instância), via subselect — não há usuários fictícios.

-- ── 1) Casa Nova/BA — 120 ha — pecuária de corte (ovinos), com água ─────────
-- Faixa da calculadora: pecuaria_corte fora do Centro-Oeste/Sul/SP/MG usa o
-- default nacional R$80–400/ha/ano (lib/appraisal-data.ts). R$120 fica no
-- terço inferior, coerente com caatinga/semiárido (nota da própria calculadora).
insert into listings
  (owner_id, title, status, state, municipality, hectares, purpose, crop,
   price_per_ha_year, description, has_water, car_number)
values
  ((select id from profiles order by created_at limit 1),
   '[DEMO] 120 ha de caatinga com água em Casa Nova',
   'active', 'BA', 'Casa Nova', 120, 'pecuaria_corte', 'ovinos',
   120,
   'Área de caatinga com aguada permanente e cercas em bom estado, a 15 km da sede do município por estrada de terra transitável o ano todo. Região tradicional de ovinocultura no semiárido baiano.',
   true, null);

-- ── 2) Aracati/CE — 45 ha — aquicultura (camarão), com água ─────────────────
-- A calculadora NÃO exibe faixa de R$/ha/ano para aquicultura (mercado de
-- lâmina d'água, específico demais) — por isso preço NULL, a combinar.
insert into listings
  (owner_id, title, status, state, municipality, hectares, purpose, crop,
   price_per_ha_year, description, has_water, car_number)
values
  ((select id from profiles order by created_at limit 1),
   '[DEMO] 45 ha para carcinicultura em Aracati',
   'active', 'CE', 'Aracati', 45, 'aquicultura', 'camarao',
   null,
   'Terreno plano próximo ao estuário do Jaguaribe, com acesso por estrada carroçável e água salobra disponível. Zona consolidada de criação de camarão no litoral leste do Ceará; valores a combinar conforme licenciamento.',
   true, null);

-- ── 3) São Joaquim/SC — 30 ha — fruticultura (maçã) ─────────────────────────
-- Faixa da calculadora: pomar formado de maçã em SC fatura R$55–95 mil/ha/ano
-- (IBGE 2022/23, lib/appraisal-data.ts) × 15% = R$8.250–14.250/ha/ano.
-- R$9.000 fica dentro da faixa exibida.
insert into listings
  (owner_id, title, status, state, municipality, hectares, purpose, crop,
   price_per_ha_year, description, has_water, car_number)
values
  ((select id from profiles order by created_at limit 1),
   '[DEMO] Pomar de maçã formado, 30 ha em São Joaquim',
   'active', 'SC', 'São Joaquim', 30, 'fruticultura', 'maca',
   9000,
   'Pomar em produção na principal região produtora de maçã do país, com acesso asfaltado até a porteira e altitude típica de São Joaquim. Estrutura de apoio simples e mão de obra disponível na região.',
   null, null);

-- ── 4) Ilhéus/BA — 80 ha — lavoura permanente (cacau), CAR de exemplo ───────
-- Faixa da calculadora: cacau formado no sul da Bahia fatura 60–150 @/ha ×
-- R$380/@ (lib/prices.json) = R$22,8–57 mil/ha/ano × 15% = R$3.420–8.550/ha/ano.
-- R$4.500 fica dentro da faixa exibida. CAR claramente fictício (DEMO).
insert into listings
  (owner_id, title, status, state, municipality, hectares, purpose, crop,
   price_per_ha_year, description, has_water, car_number)
values
  ((select id from profiles order by created_at limit 1),
   '[DEMO] 80 ha de cacau cabruca em Ilhéus',
   'active', 'BA', 'Ilhéus', 80, 'lavoura_permanente', 'cacau',
   4500,
   'Roça de cacau em sistema cabruca no sul da Bahia, com acesso por estrada municipal e córrego cortando a divisa. Região de vocação cacaueira histórica; aberta a parceria ou arrendamento.',
   null, 'BA-0000000-DEMO');

-- ── 5) Granja/CE — 200 ha — extrativismo (carnaúba) ─────────────────────────
-- Faixa da calculadora: extrativismo usa o VTN de silvicultura como proxy —
-- média oficial do CE R$2.350/ha (lib/vtn-data.json) × 2,5%–6% =
-- R$59–141/ha/ano. R$90 fica dentro da faixa exibida.
insert into listings
  (owner_id, title, status, state, municipality, hectares, purpose, crop,
   price_per_ha_year, description, has_water, car_number)
values
  ((select id from profiles order by created_at limit 1),
   '[DEMO] Carnaubal nativo de 200 ha em Granja',
   'active', 'CE', 'Granja', 200, 'extrativismo', 'carnauba',
   90,
   'Várzea com carnaubal nativo adensado às margens de riacho intermitente, acesso por estrada de terra a 20 km da sede. Zona tradicional de extração de pó e palha de carnaúba no noroeste cearense.',
   null, null);

-- ── 6) Rio Verde/GO — 150 ha — grãos (soja) ─────────────────────────────────
-- Faixa da calculadora: grãos em GO = R$1.400–2.600/ha/ano
-- (lib/appraisal-data.ts, contratos fixados em sacas de soja).
-- R$1.800 fica dentro da faixa exibida.
insert into listings
  (owner_id, title, status, state, municipality, hectares, purpose, crop,
   price_per_ha_year, description, has_water, car_number)
values
  ((select id from profiles order by created_at limit 1),
   '[DEMO] 150 ha de lavoura em Rio Verde',
   'active', 'GO', 'Rio Verde', 150, 'graos', 'soja',
   1800,
   'Área de sequeiro já aberta e corrigida, topografia plana e acesso asfaltado até 4 km da entrada. Núcleo consolidado de produção de grãos do sudoeste goiano, com armazéns e revendas próximos.',
   null, null);
