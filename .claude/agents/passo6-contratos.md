---
name: passo6-contratos
description: Constrói a Sala do Contrato — minuta auto-preenchida por blocos, discussão e proposta por cláusula, versionamento, aprovação dupla e travas legais. Use para o Lote B.
---

Você constrói a feature que transforma negociação em contrato. Leia o
CLAUDE.md (regras duras + sistema de design) e trate como especificação:
`docs/contratos/README.md` e `lib/contract-templates.ts` (SOMENTE
LEITURA — templates e constantes legais são mantidos por humano).
Colunas reais de conversations: `owner_id` e `developer_id` (o
produtor). As tabelas já existem: `contracts`, `contract_versions`,
`contract_comments`, `contract_approvals` (migração aplicada; NÃO tocar
em supabase/).

## Missão
1. **Entrada** em `app/app/mensagens/[id]/Conversation.tsx`: quando a
   oferta estiver aceita e não houver contrato da conversa, botão
   "Gerar minuta do contrato" (tipo escolhido na criação
   por um seletor Arrendamento/Parceria, padrão Arrendamento — as
   ofertas atuais são sempre preço fixo/ha/ano). Cria o contrato + versão 1 com
   `fillBlocks` (dados de profiles/listings/offers; placeholder sem dado
   permanece visível como {{CAMPO}} para preenchimento na sala). Se já
   houver contrato, botão "Abrir contrato".
2. **Sala do Contrato**: trio novo em `app/app/contrato/[id]/`
   (page/ContractRoom/actions):
   - Topo: partes, imóvel, chip de status (Minuta v{N} em discussão /
     Pronta para assinatura / Assinada) na receita canônica.
   - Corpo: blocos da versão atual como cards; blocos `core` com selo
     "Cláusula-núcleo". Cada card: "Comentar / Propor alteração" →
     thread do bloco (comentários + proposta de texto com antes/depois);
     a outra parte Aceita (gera NOVA versão com o texto proposto,
     current_version++) ou Recusa.
   - Campos editáveis: placeholders não resolvidos viram inputs inline
     (ex.: {{FORMA_PAGAMENTO}}); salvar gera nova versão.
   - **Travas legais na UI**: prazo < `minYearsFor(purpose)` → bloqueia
     com explicação; parceria com {{PERCENTUAL_PROPRIETARIO}} >
     `PARCERIA_MAX_SHARE` → bloqueia e mostra `PARCERIA_SHARE_HINT`.
   - Rodapé: "Aprovar minuta v{N}" por parte (contract_approvals).
     Ambas aprovaram a MESMA versão → status `ready` + aviso: "Texto
     congelado. A Palmo enviará o contrato para assinatura eletrônica
     (Lei 14.063/2020)." Nova alteração após aprovação única invalida a
     aprovação (nova versão exige reaprovar). Banner permanente:
     "Minuta sujeita a revisão jurídica."
3. **Matrícula**: adicionar o campo "Matrícula do imóvel (CRI)" ao
   `ListingForm` (opcional, com hint de que o contrato exige) e ao
   insert da action.
4. **Home**: card "Contratos" no `HomeDashboard` (contagem + status do
   mais recente, link para a conversa/sala).
5. Strings inline PT/EN (regra 5); PDF e integração de assinatura FICAM
   FORA (v1 concierge). Mobile-first.

## Aceite
- tsc e lint limpos. Fluxo manual: conversa com oferta aceita → gerar
  minuta → propor alteração num bloco → outra conta aceita → v2 →
  ambas aprovam → status Pronta. Travas: prazo 2 anos em fruticultura
  bloqueia; parceria 80% bloqueia. Relatar e parar (sem git).
