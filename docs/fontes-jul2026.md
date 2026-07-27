# Manifesto de fontes — Reauditoria geral jul/2026

> Régua de TODAS as fases da reauditoria (branch `palmo-ai/reauditoria-jul2026`).
> Regra de ouro: nada se confirma por estar no código; tudo se reconfirma na
> fonte, na edição MAIS RECENTE disponível. Consultas feitas em **27/jul/2026**.

## Fontes estruturais (IBGE)

| Fonte | Edição mais recente | Publicada em | Próxima edição | URL |
| --- | --- | --- | --- | --- |
| IBGE PAM (Produção Agrícola Municipal) | **PAM 2024** | 11/set/2025 | PAM 2025 prevista para set/2026 — **ainda não saiu** | https://www.ibge.gov.br/estatisticas/economicas/agricultura-e-pecuaria/9117-producao-agricola-municipal-culturas-temporarias-e-permanentes.html |
| IBGE PPM (Pesquisa da Pecuária Municipal) | **PPM 2024** (rebanhos em 31/dez/2024) | 16/set/2025 | PPM 2025 prevista para set/2026 | https://www.ibge.gov.br/estatisticas/economicas/agricultura-e-pecuaria/9107-producao-da-pecuaria-municipal.html |
| IBGE PEVS (Extração Vegetal e Silvicultura) | **PEVS 2024** (valor recorde R$44,3 bi) | 25/set/2025 | PEVS 2025 prevista para set/2026 | https://www.ibge.gov.br/estatisticas/economicas/agricultura-e-pecuaria/9105-producao-da-extracao-vegetal-e-da-silvicultura.html |
| IBGE LSPA (mensal) | **jun/2026** (6º LSPA de 2026): 350,4 mi t de cereais/oleaginosas/leguminosas; BA 13,3 mi t (recorde, +3,2% vs 2025) | jul/2026 | LSPA jul/2026 em ago/2026 | https://www.ibge.gov.br/estatisticas/economicas/agricultura-e-pecuaria/9201-levantamento-sistematico-da-producao-agricola.html |

**Consequência para o código:** todo dado municipal/estadual de lavoura segue
ancorado na **PAM 2024** (não existe PAM 2025); rebanhos na **PPM 2024**;
extrativismo na **PEVS 2024**. Fatos que citavam PPM 2023 devem subir para a
PPM 2024.

## CONAB (safras vigentes em jul/2026)

| Fonte | Edição mais recente | Publicada em | Destaques | URL |
| --- | --- | --- | --- | --- |
| CONAB grãos, safra 2025/26 | **10º levantamento** | 14/jul/2026 | 360,1 mi t (+2,2% vs 24/25); área 83,5 mi ha; produtividade média 4.311 kg/ha; milho (3 safras) 141,7 mi t | https://www.gov.br/conab/pt-br/atuacao/informacoes-agropecuarias/safras/safra-de-graos |
| CONAB café, safra 2026 | **2º levantamento** | 21/mai/2026 | Recorde de 66,7 mi sacas (+18%); arábica 45,8 mi; MG 33,4 mi; ES 18,0 mi; área total 2,34 mi ha | https://www.gov.br/conab/pt-br/atuacao/informacoes-agropecuarias/safras/safra-do-cafe |

**Consequência:** fatos de café escritos sobre o 1º/2º levantamento de **2025**
(MG 24,8 mi sacas; ES 11,8 mi conilon; BA 3,68 mi) estão uma safra atrás — a
Fase 4 reescreve com o 2º levantamento de 2026. Fatos de soja/grãos citando a
24/25 ganham a referência 25/26 do 10º levantamento onde a nova safra já fechou
o número.

## CEPEA/ESALQ e demais cotações (price book)

Auditado em 27/jul/2026 (Fase 2). Valor gravado = decisão conservadora.

| Item | Indicador/fonte | Cotação vigente (27/jul/2026) | Decisão gravada | Situação |
| --- | --- | --- | --- | --- |
| saca_soja | CEPEA/ESALQ Paranaguá | R$148,37 (24/jul); média jul R$139,10 | R$130 → **R$140** | maior patamar de 2026 |
| saca_milho | CEPEA/ESALQ | R$65,74 (24/jul) | **mantido R$65** | confirmado |
| arroba_boi | CEPEA/ESALQ boi gordo SP | R$343,75 (24/jul); parcial do mês R$328 | R$320 → **R$335** | arquivo abaixo do piso do mês |
| arroba_cacau | spot sul da Bahia (precodocacau.com.br/CEPLAC) — **não existe indicador CEPEA de cacau** | jul/2026 oscilou R$292–350 | R$380 → **R$310** | VOLÁTIL (+14,75% em 24h em 06/jul) |
| saca_cafe_arabica | CEPEA/ESALQ arábica | R$1.712 (21/jul), +8,5% no mês | R$1.550 → **R$1.700** | VOLÁTIL; queda por safra recorde NÃO se confirmou |
| caixa_laranja | CEPEA laranja indústria, safra 2026/27 | R$31,25 (jul/2026; há 1 ano R$43,91; pico 24/25 R$75,60) | R$42 → **R$31** | VOLÁTIL; R$42 deixou de ser defensável |
| kg_manga | CEPEA/HF Brasil + boletim Embrapa | spot jul/2026: palmer R$3,68, tommy R$4,19; média histórica deflacionada ~R$1,95 | R$1,30 → **R$2,00** (conservador) | VOLÁTIL |
| credito_carbono | mercado voluntário BR | sem índice oficial; faixas comerciais R$35–80 (portfólio), REDD+ ~R$27–55 | **mantido R$25** (piso, lacuna documentada) | VOLÁTIL, sem lastro oficial |
| kg_castanha_caju | CONAB análise mensal mar/2026 | R$5,50/kg em casca (CE) | **mantido R$5,50** | confirmado; monitorar (+20% nov/25→mar/26) |
| fruto_coco | APROCOCO (R$1,40+) / BNB-ETENE | referência setorial R$1,40–2,00, mas sem data verificável na página | **mantido R$1,00** (lacuna documentada) | fonte sem data auditável |
| kg_acai | IBGE PAM 2024 + DIEESE-PA mai/2026 | PAM 2024 ≈ R$4,46/kg; varejo Belém +40% em 2026 | R$3,60 → **R$4,45** (fonte trocada de "IBGE 2022" p/ PAM 2024) | VOLÁTIL |

## Embrapa / CEPLAC / BNB-ETENE (boletins por cultura)

Preenchido pelas Fases 2–7 conforme cada cultura é auditada; cada linha nova
carrega edição/data e URL. Destaques já fixados:

| Fonte | Edição/uso na auditoria |
| --- | --- |
| Embrapa Semiárido | dossiê hídrico (melancia de sequeiro vs polos irrigados; caatinga) — Fase 6 |
| CEPLAC / precodocacau.com.br | preço da arroba spot sul-baiano (não há indicador CEPEA de cacau) — Fases 2–3 |
| BNB/ETENE | coco, goiaba, uva, camarão (área BNB) — Fases 2–4 |
| Anuário Peixe BR | tilápia (edição vigente a confirmar na Fase 4) |
| ABCC | camarão (edição vigente a confirmar na Fase 4) |
| Fundecitrus | safra 2026/27: 255,2 mi cx (−12,9%) — estimativa de mai/2026 |
| Embrapa Gado de Leite — Anuário Leite 2025 | Noroeste gaúcho maior bacia leiteira (2,72 bi L, 7,71% do BR, dados 2023) — Fase 7 |
| CONAB 10º lev. 2025/26 (PDF) | trigo ~6,0 mi t (−23,5%), arroz 11,1 mi t (−13,1%), feijão 3,0 mi t (−1,4%) — Fase 7; splits por UF não extraídos (lacuna documentada, fatos usam PAM 2024) |
| SIDRA/API IBGE (t.1612 v.214; t.74 v.106) | extrações diretas PAM 2024 e PPM 2024 usadas nas Fases 5 e 7 |

## Regra de frescor (Fase 8.1)

Todo fato em `lib/state-advantage.ts` e todo retrato em
`lib/regioes-agricolas.ts` que cite edição ANTERIOR às deste manifesto
(ex.: PPM 2023, PAM 2023, CONAB 2025 de café, "IBGE/OIT 2022") é listado como
INFO pelo guarda estendido até ser reescrito ou justificado (caso legítimo:
série específica que não tem edição nova, ex. dado BNB/ETENE 2023 da área BNB).
