---
name: passo7-kyc
description: Constrói a verificação de identidade (brasileiros) e o funil internacional /global com wizard KYC em inglês, mandarim, francês e árabe (RTL). Use para o Lote B.
---

Você constrói a camada de identidade da Palmo. Leia o CLAUDE.md e trate
como especificação: `docs/internacional/kyc-investidor-internacional.md`.
Tabela `kyc_profiles` e bucket privado `kyc-docs` já existem (migração
aplicada; NÃO tocar em supabase/). NÃO tocar em: HomeDashboard,
Conversation, ListingForm (são do passo6 — evitar colisão).

## Missão A — Verificação BR (`/app/verificacao`, trio novo)
1. Link de entrada: card/CTA em `app/app/conta/AccountDashboard.tsx`
   ("Verifique sua identidade" + status quando existir).
2. Fluxo: escolha PF ou PJ → formulário (PF: nome completo, CPF, data
   de nascimento; PJ: razão social, CNPJ, nome e CPF do responsável) →
   upload de 1 documento (foto de RG/CNH ou cartão CNPJ) para o bucket
   `kyc-docs/{user.id}/` via supabase storage → grava em `kyc_profiles`
   (tier pf_br/pj_br, status 'pending', data jsonb, doc_paths).
3. Telas de status: pending ("Em análise — retornamos em até 2 dias
   úteis"), approved (selo "✓ Identidade verificada" na página conta),
   rejected (motivo genérico + refazer). Sem painel de aprovação
   (revisão manual do fundador via Supabase, v1).
4. Validação de CPF/CNPJ: apenas máscara + dígitos verificadores no
   client (algoritmo padrão), sem serviços externos.

## Missão B — Funil internacional (`/global`, fora do app gate)
1. Criar `lib/i18n-global.ts`: dicionário próprio com **en (padrão),
   zh (中文), fr, ar** — ~50 strings do funil (landing + wizard +
   status). Português NÃO entra aqui (público é estrangeiro). Árabe:
   renderizar com `dir="rtl"` no container. Seletor de idioma no topo.
   Traduções feitas por você com registro simples e claro; comentar no
   arquivo: "traduções sujeitas a revisão nativa".
2. `/global` (page + client): landing curta — tese "Access Brazilian
   farmland yield", 3 bullets (calculadora com dados oficiais, terras
   verificadas, estrutura regulada), CTA "Start verification".
   **Copy honesta**: "early access — investment structures under legal
   structuring"; nada de promessa de retorno.
3. `/global/kyc` (wizard): passo 1 tipo (Individual/Entity) → passo 2
   formulário (T1: nome, país, passaporte nº, endereço, faixa de
   investimento, origem dos recursos em texto, PEP sim/não; T2: + nome
   da entidade, país de constituição, nº registro, UBOs ≥25% em lista
   nome+país+passaporte) → passo 3 uploads (passaporte; T2: certificate
   of incorporation) para `kyc-docs/{user.id}/` → grava kyc_profiles
   (tier pf_intl/pj_intl, country, status 'pending'). Exige login
   Google antes do passo 2 (mesmo AuthButton).
4. Status pós-envio: "Under review. You'll hear from us within 5
   business days." Sem acesso a nenhuma listagem: o funil termina aí
   (gate — vitrine internacional NÃO existe ainda; não criar).

## Aceite
- tsc e lint limpos; `/global` alterna en/zh/fr/ar com RTL correto no
  árabe; wizard grava no banco e no bucket; verificação BR idem;
  AccountDashboard mostra o selo quando status='approved' (testável
  mudando o status no painel). Relatar e parar (sem git).
