# Palmo · instruções para agentes (Claude Code)

Reescrito em 10/08/2026. Substitui a versão do lançamento, que ainda
descrevia dark launch e pricing antigos. Em conflito entre este arquivo e um
brief da sessão, o brief manda; na ausência de brief, este arquivo manda.

## O que é a Palmo
Marketplace brasileiro que conecta donos de terra parada a produtores que
querem expandir. **Público em produção desde 26/07/2026** (palmo.lat). O
produto é a CONEXÃO (anúncio → conversa → proposta → negócio fechado →
contato revelado). A calculadora no herói da home é o gancho de aquisição,
não o produto.

**Monetização**: gratuito até o negócio fechar; então **5% do valor total do
contrato, proporcional a cada pagamento anual, devido pelo PROPRIETÁRIO**.
O termo "taxa de sucesso" é BANIDO em copy (lê-se como "success rate"); o
card oficial diz "QUANDO O NEGÓCIO FECHA · 5%".

**O gate de contato é sagrado**: contato só aparece com
`deal_status = 'closed'`, fechado no servidor via service role com
pré-condição de proposta aceita. `get_counterparty_contact` é intocável,
inclusive "para melhorar". Nenhuma mudança pode enfraquecer isso.

Slogan: **"Cada Palmo de terra produzindo."** (só "Palmo" maiúsculo) em três
lugares fixos: kicker do hero, título do CTA final, rodapé.

## Stack
- Next.js 16 (App Router, Turbopack) + TypeScript estrito; `proxy`, não
  `middleware`
- Tailwind v4 (CSS-first, sem tailwind.config)
- Supabase: auth Google + Postgres com RLS + storage; migrations em
  `supabase/migrations/`
- Vercel (hosting + Analytics `track()`), Resend (e-mail), lucide-react,
  Nunito ExtraBold self-hosted
- Fotos: upload assinado → `listing-photos-staging` (privado) → servidor
  (service role) valida magic bytes, REMOVE EXIF, redimensiona, WebP →
  `listing-photos` (público, ZERO policies de escrita — isso é o desenho,
  não falha; nunca "consertar" adicionando policy de INSERT)

## REGRAS DURAS (invioláveis)
1. **`main` é do Carlos.** Nunca commitar, pushar ou mergear NELA; todo
   trabalho nasce em `palmo-ai/<lote>` e chega como Pull Request. "Nunca
   mergear" significa **branch → main**; trazer a main PARA a branch
   (`git pull --no-rebase origin main`) é permitido e esperado ao resolver
   conflito: preservar os dois lados, validar, push na MESMA branch. Nunca
   `--force`, nunca rebase de histórico publicado.
2. **ultrathink obrigatório** na fase de plano/análise de todo lote, antes
   de editar qualquer arquivo.
3. **NUNCA atribuição de autoria** (Co-Authored-By, "Generated with"...) em
   commits, PRs, código ou comentários.
4. **Intocáveis** (ler pode, editar não; se a tarefa parecer exigir, PARE e
   pergunte): `.env*`, migrations PRÉ-EXISTENTES em `supabase/`,
   `lib/appraisal-data.ts`, `lib/prices.*`, `lib/pevs.*`,
   `lib/state-advantage.ts`, `lib/vtn.ts`, `lib/regioes-agricolas.ts`,
   `lib/retrato-regional.ts`, `lib/muni-regiao-gerado.ts`,
   `lib/land-recommender.ts`, `lib/contract-templates.ts` (texto jurídico;
   até pontuação fica para o advogado), `docs/*`, `scripts/*` existentes
   (script NOVO só com autorização expressa no brief),
   **`lib/site-config.ts`** — e atenção: `waitlistEndpoint` parece morto e
   está VIVO (captura de lead da calculadora via `submitWaitlist` ←
   `Appraiser.tsx`; apagar quebra build e mata lead).
5. **NUNCA editar `lib/content.ts`** (nem content-fr/zh/ar). String nova de
   UI vai inline no componente via `useLanguage()`
   (`const label = lang === "en" ? {...} : {...}`).
6. **NUNCA inventar números.** Todo dado exibido carrega fonte e ano. Sem
   dado com fonte, o elemento simplesmente não aparece. Público do agro não
   perdoa número errado.
7. **NUNCA nomear parceiro/instituição sem contrato assinado** em página
   pública (banidos hoje: FAEB, Hexagon, EOSDA, Leaf). Citar IBGE/CEPEA/
   CONAB/Embrapa como FONTE DE DADO é permitido — fonte ≠ parceria.
8. **Sem travessão (—) em copy de UI**, e em qualquer comunicação externa.
   Separador visual padrão: interponto " · ". En dash (–) de intervalo
   numérico é permitido. O glifo "—" como valor-vazio/sentinela existente é
   exceção deliberada.
9. Nada de APIs depreciadas.

## Migrations (o agente escreve, NUNCA aplica)
- Arquivo novo em `supabase/migrations/AAAAMMDD-nome.sql`, idempotente
  (`if not exists`, `drop policy if exists`, `do $$`), corpo em
  `begin; ... commit;`.
- **O arquivo inteiro deve ser seguro para colar num Run só** (Carlos roda
  assim). Consultas de conferência (antes/depois) vão COMENTADAS no arquivo
  E como bloco colável pronto no corpo do PR — aprendemos que só comentário
  vira caça ao código.
- `pg_policies` conferido antes de qualquer coisa que toque policy; **nunca
  referenciar policy por nome sem conferir no banco** (nome do repo já
  divergiu do banco 2×; `drop` de nome errado não dá erro e policies
  permissivas se somam por OU). Preferir mecanismos independentes de nome:
  `revoke`/`grant` de coluna.
- View pública: `create or replace` só muda EXPRESSÃO (nomes/tipos/ordem de
  colunas mantidos), `security_invoker = off` SEMPRE (com `on`, anon perde
  tudo — a tabela base levou revoke de select), grants refeitos ao final.

## Doutrina de segurança (paga com 6 brechas reais)
> **Privilégio de tabela restringe COLUNA e COMANDO. RLS restringe LINHA.
> Nenhum faz o trabalho do outro. TRUNCATE escapa do RLS. Cascade de FK
> escapa dos dois.**
- Campo que representa **veredito da plataforma** (`deal_status`, status de
  verificação, selo, resultado de checagem) NUNCA mora em tabela onde o
  usuário tem UPDATE — vai para tabela própria escrita só pelo service role
  (padrão `listing_car_verifications`, `kyc_reviews`).
- Imutabilidade por **privilégio revogado**, não por ausência de policy
  (ausência é frágil: alguém "completa" a policy achando que falta).
- Toda mudança de decisão de negócio (pricing, gate, cobrança) exige
  reauditar QUEM consegue escrever o campo que passou a valer dinheiro.
- Exclusão de anúncio não existe: arquiva (`status='archived'`); DELETE está
  revogado na raiz. `legal_acceptances`, `messages`, `listing_changes` e
  verificações são prova: sem UPDATE/DELETE de cliente, nunca.

## Padrões do projeto
- Telas do app: trio `page.tsx` (server) + componente client + `actions.ts`
  ("use server", falha graciosa `{ ok, error }`). Autorização SEMPRE
  reconferida no servidor (`owner_id = auth.uid()`), além do RLS.
- Bilíngue PT/EN via `useLanguage()`; PT manda. FR/ZH/AR só na superfície
  pública (funil /global) — e mantêm "(hectares)" nos rótulos de área DE
  PROPÓSITO (dica de unidade; tarefas/alqueires não se traduzem).
- Mobile-first: ~90% celular. Tudo funciona em 390 px sem scroll horizontal.
- `CampoDeArea` é a ÚNICA entrada de área (3 superfícies): dropdown plano de
  7 unidades, grava SEMPRE hectares no hidden `name="hectares"`; a tabela de
  conversão vive em `lib/medidas-agrarias.ts` e em nenhum outro lugar.
- Finalidade aberta = constante `lib/purpose-open.ts`; preço null renderiza
  "Aberto a propostas", nunca "R$ 0", nunca vazio; null vai ao FIM em
  ordenação por preço.
- Python string replace em TS: `assert s.count(old) == 1` antes de trocar.
- Minifier de produção: função declarada inline dentro de `.map()` pode
  criar TDZ invisível ao tsc/lint — só aparece em build real no navegador.
- ESLint `react-hooks/set-state-in-effect`: derivar estado no render ou
  `queueMicrotask` (padrão da casa).

## Testes e entrega
- Validação mínima, TUDO limpo: `npx tsc --noEmit` · `npm run lint` ·
  `npm run build` · `node scripts/checar-vocacoes-vs-vantagens.mjs --strict`.
- **Primeira linha do relatório**: declarar se há navegador (Claude in
  Chrome) acoplado. NUNCA descrever teste de interface que não rodou; sem
  navegador, entregar como checklist "não verificado".
- **O Supabase é UM SÓ (produção).** Teste que escreve no banco:
  - todo registro nasce com título `[TESTE]...`
  - **a LIMPEZA é executada pelo PRÓPRIO agente** no Supabase: só linhas
    criadas na sessão, por id explícito, guarda
    `and title like '[TESTE]%'` no delete de listings, contagens
    antes/depois no relatório, objetos de storage incluídos (público E
    staging, pastas confirmadas vazias), RECUSAR se houver conversa/
    proposta/mensagem/contrato ligado, nunca DELETE amplo, nunca dado de
    terceiro. Se o classificador bloquear a execução: dizer e entregar o
    SQL — nunca relatar como limpo o que não executou.
- Cenário de calculadora SEMPRE com três parâmetros: município + cultura/uso
  + água (sim/não). Sanidade canônica: **Xique-Xique/BA + "me recomende" +
  sem água → Caprinos 1º, Melancia 2º**.
- Arquivos de mesmo nome entregues juntos: incluir bytes + detalhe
  distintivo (evita substituição trocada).

## Conhecimento operacional (caro de redescobrir)
- **SICAR**: o WFS vivo é escopado por workspace —
  `geoserver.car.gov.br/geoserver/sicar/wfs` (o `/geoserver/wfs` raiz devolve
  capabilities VAZIA e engana). Consulta por `cod_imovel` ~0,3s, devolve
  status, área, `cod_municipio_ibge` E polígono (EPSG:4674). Adapter único
  em `lib/car-sicar.ts`; uma consulta por evento de anúncio, nunca por
  pageview; User-Agent identificando a Palmo. Sem termo de uso publicado:
  ausência de captcha não é autorização — civilidade obrigatória.
- **O código IBGE embutido na string do CAR NÃO é veredito de município**:
  7–28% dos CARs apontam município vizinho (imóvel na divisa; Patos de
  Minas 28%). Veredito usa o atributo autoritativo do SICAR; o embutido é só
  formato. Regex: `^[A-Z]{2}-[0-9]{7}-[0-9A-F]{32}$` (100% de 6.750 em 27
  UFs). `status_imovel` tem SU além de AT/PE/CA/RE — desconhecido cai em
  não-confirmado, nunca em rejeitado. "Não deu para conferir" ≠ "não
  confere": indeterminado NUNCA vira `divergente`.
- **Leitura de arquivo**: sempre do raw
  (`raw.githubusercontent.com/cacoandrade455/palmo-landing/<branch>/<path>`);
  a API REST do GitHub estoura rate limit sem auth; tarball via
  `codeload.github.com/.../tar.gz/refs/heads/<branch>` para varreduras.
- Copyzona de dados (regra 4) ≠ pontuação: caveat/nota de texto pode ser
  ajustado com autorização expressa e listagem edição-a-edição no PR; valor,
  chave e nome de cultura, jamais.

## Sistema de design (fonte da verdade visual)
Em dúvida, copiar de `components/HomeHero.tsx`, `components/Header.tsx`,
`app/app/mensagens/[id]/Conversation.tsx` ou
`app/app/conta/AccountDashboard.tsx`.

**Cores** — só do tema: `deep`, `primary`(+`-dark`), `accent`(+`-dark`),
`neutral`, `white`. Opacidades canônicas: `text-deep/70` corpo, `/60`
secundário, `/50` apagado, `/40` placeholder; `border-deep/10` e `/5`;
`bg-primary/10`; `bg-accent/20` e `/10`.

**Raios**: `rounded-full` botões/pills/chips · `rounded-2xl` cards ·
`rounded-xl` notas/inputs. Nada além.

**Receitas**: botão primário `rounded-full bg-primary px-6 py-3.5 text-base
font-bold text-white shadow-sm transition-colors hover:bg-primary-dark`
(compacto `px-4 py-2 text-sm`); secundário idem com `bg-accent text-deep
hover:bg-accent-dark`; ghost `rounded-full border border-deep/20 px-3 py-1
text-xs font-bold text-deep`; card `rounded-2xl border border-deep/10
bg-white p-6 shadow-sm`; chip/selo `rounded-full bg-primary/10 px-2.5 py-1
text-xs font-bold text-primary` — **sobre foto, chip precisa de contraste
garantido (fundo `deep`/scrim), nunca a receita clara**; nota `rounded-xl
bg-white px-4 py-2.5 text-sm text-deep/70`; rótulo de seção `text-sm
font-bold uppercase tracking-wide text-primary`; títulos `font-extrabold
text-deep`; inputs reutilizam o `inputCls` compartilhado.

**Ícones**: lucide, `h-4 w-4`/`h-5 w-5`, `aria-hidden` quando decorativos.
**Layout**: `mx-auto max-w-6xl px-6` ou `max-w-2xl`; gaps 3/4; p-4/p-6.
**Proibido**: cor fora do tema, sombra nova, fonte nova, gradiente, dark
mode, animação além de `transition-colors`/`hover:-translate-y-0.5`.

## Como testar localmente
`npm run dev` com `.env.local` contendo as chaves do Supabase **incluindo
`SUPABASE_SERVICE_ROLE_KEY`** (sem ela, foto/selo/fechamento degradam em
silêncio e o teste mente). O app é público: rotas principais `/`,
`/explorar`, `/terra/[id]`, `/app/anunciar`, `/app/anuncio/[id]/editar`,
`/app/conta`, `/app/mensagens`, `/app/contrato/[id]`, `/app/verificacao`,
`/app/admin/kyc`. Lembrete: localhost escreve no MESMO banco de produção —
valem as regras de `[TESTE]` e limpeza acima. Build sujo:
`rmdir /s /q .next`.
