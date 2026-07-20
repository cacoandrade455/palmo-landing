---
name: passo8-idiomas
description: Traduz toda a superfície pública (landing + calculadora + waitlist) para mandarim, francês e árabe, com seletor de 5 idiomas e RTL. Use para o Lote B.
---

Você entrega a Palmo em 5 idiomas. Leia o CLAUDE.md. NÃO editar
`lib/content.ts` (regra 5 vale): as traduções vivem em ARQUIVOS NOVOS,
tipados a partir dele — o que garante, pelo compilador, que nenhuma
string fique sem tradução.

## Arquitetura
1. Criar `lib/content-zh.ts`, `lib/content-fr.ts`, `lib/content-ar.ts`:
   cada um exporta um dicionário completo do tipo
   `typeof content.pt` (importar `{ content }` de `./content` e extrair
   o tipo — zero edições no content.ts). Traduzir a partir do PT
   (fonte da verdade), consultando o EN para termos técnicos.
2. Criar `lib/content-extra.ts` (barrel):
   `export const contentExtra = { zh, fr, ar } as const;`
3. `lib/language-context.tsx`: estender o tipo de idioma para
   `"pt" | "en" | "zh" | "fr" | "ar"`; resolução:
   `content[lang] ?? contentExtra[lang]`. Persistência do idioma igual
   à atual. Efeito client: `document.documentElement.dir = lang === "ar"
   ? "rtl" : "ltr"` e `document.documentElement.lang = lang`.
4. `components/Header.tsx`: o toggle PT|EN vira seletor compacto de 5
   (PT · EN · 中文 · FR · AR), receita canônica de pill, mobile-first.

## Regras de tradução (invioláveis)
- **NUNCA alterar**: números, valores (R$ …), unidades (ha, kg, t, @,
  sc), percentuais, anos, nomes de fontes (IBGE, CONAB, Embrapa, CEPEA,
  PEVS, MapBiomas, Receita Federal, LAPIG), nomes próprios (Palmo,
  municípios, UFs), placeholders (`{price}`, `{where}`, `{revMin}`,
  `{year}` etc.) e emojis. Traduz-se o texto AO REDOR deles.
- `value:` de culturas/opções NUNCA muda (são chaves do motor); só o
  `label` é traduzido. Nomes de culturas usam o termo agronômico
  corrente no idioma (ex.: cacau → 可可 / cacao / الكاكاو); quando o
  nome for intrinsecamente brasileiro (carnaúba, licuri, umbu, baru,
  piaçava, cupuaçu…), manter o nome PT e, se natural, uma glosa curta
  entre parênteses.
- Registro: formal-claro (mandarim simplificado; francês padrão; árabe
  padrão moderno). Moeda permanece R$ (produto brasileiro).
- Cabeçalho de cada arquivo: comentário "Tradução gerada por IA —
  sujeita a revisão nativa" + data.
- Strings jurídicas do app interno e contratos NÃO entram (contrato é
  peça em português; o funil /global tem dicionário próprio do passo7).

## Fronteiras (paralelismo)
Você é dono APENAS de: os 4 arquivos novos, `lib/language-context.tsx`
e `components/Header.tsx`. Não tocar em nada dos passos 6 e 7. Os
dicionários ficam FORA da auditoria do revisor-design (são dados, não
UI) — informe isso no seu relatório.

## Aceite
- `npx tsc --noEmit` limpo (o tipo prova a completude das 3 traduções)
  e `npm run lint` limpo.
- Teste manual: seletor alterna os 5; `/quanto-vale` inteira em 中文;
  árabe renderiza RTL sem quebrar layout (spot-check em 390px);
  números e fontes idênticos em todas as línguas (conferir a linha da
  carnaúba: R$/kg e "IBGE PEVS" imutáveis).
- Relatar e parar (sem git).
