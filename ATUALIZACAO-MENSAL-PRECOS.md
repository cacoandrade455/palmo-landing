# Palmo — Rotina mensal de atualização de preços

O tool de "Quanto vale" usa preços de commodities que mudam todo mês. Os
**modelos** (15% do faturamento, 2,5–6% do valor da terra, produtividade ×
preço) não mudam — só os **preços**. Então a rotina mensal só mexe em um
arquivo: `lib/prices.json`.

## Como rodar (5–10 min por mês)

```
node scripts/update-prices.mjs
```

O script mostra cada preço atual e o link da fonte pública. Você abre o link,
vê o valor de hoje, e digita (ou aperta Enter pra manter). No fim ele grava
`lib/prices.json` com a data do mês. Depois:

```
git add lib/prices.json
git commit -m "atualização mensal de preços"
git push
```

Vercel republica em ~1 min e o site mostra "Preços atualizados em [mês]".

## Onde achar cada número (fontes gratuitas)

| Preço | Fonte pública | Link |
|---|---|---|
| Saca soja (60kg) | CEPEA/ESALQ indicador | cepea.esalq.usp.br/br/indicador/soja.aspx |
| Saca milho (60kg) | CEPEA/ESALQ | cepea.esalq.usp.br/br/indicador/milho.aspx |
| Arroba boi gordo | CEPEA/ESALQ | cepea.esalq.usp.br/br/indicador/boi-gordo.aspx |
| Saca café arábica | CEPEA/ESALQ | cepea.esalq.usp.br/br/indicador/cafe.aspx |
| Caixa laranja | CEPEA/ESALQ citros | cepea.esalq.usp.br/br/indicador/citros.aspx |
| Arroba cacau | Notícias Agrícolas / CEPLAC | noticiasagricolas.com.br (cacau) |
| Kg manga | CEPEA Hortifruti / Embrapa | hfbrasil.org.br |
| Crédito carbono | Relatórios de mercado voluntário | Aegro / ZS Advogados |
| Kg castanha de caju | CONAB Análise Mensal (castanha em casca) | conab.gov.br |
| Fruto coco verde | CEPEA Hortifruti + APROCOCO | hfbrasil.org.br |
| Kg açaí (fruto) | CONAB/IBGE + Sedap-PA | conab.gov.br |

> Chaves novas são **semeadas automaticamente** na primeira rodada do script
> (com o valor de referência da fonte do modelo) e entram no refresh mensal.

> **Nota:** CEPEA mostra os indicadores diários **de graça** na página, mesmo
> sem API. Para a API/base completa é preciso licença — deixar para quando o
> tool tiver tração (Tier 2 automático).

## Tiers (evolução do processo)

- **Tier 1 (hoje):** refresh manual mensal via script acima. ~10 min/mês.
- **Tier 2 (quando quiser automatizar):** ligar `fetchOpenSeries()` no script
  a APIs abertas (CONAB, IBGE SIDRA, B3 delayed) + agendar com Vercel Cron ou
  GitHub Actions (grátis). Os modelos não mudam — só entram os fetches.
- **Tier 3 (moat real):** quando fecharem negócios na Palmo, os preços de
  arrendamento *reais* da plataforma substituem essas referências. Nenhum
  concorrente tem esse dado.

## Sanidade

Depois de atualizar, rode o tool com um caso conhecido (ex.: grãos MT, cacau
BA 550ha) e confira se os números fazem sentido. Se um preço pular muito de um
mês pro outro, confirme a fonte antes de publicar — melhor um valor conservador
que um número que assuste um produtor.
