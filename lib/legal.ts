/**
 * Documentos legais da plataforma — tipos, versão e metadados.
 *
 * REGRAS DESTA CAMADA
 * - O PORTUGUÊS é a versão canônica e vinculante. O inglês é tradução de
 *   cortesia e traz a nota de prevalência do texto em português.
 * - Os demais idiomas da interface (zh/fr/ar) NÃO têm tradução própria:
 *   caem na versão EN com a mesma nota. TODO(i18n) registrado no PR.
 * - `LEGAL_VERSION` é a versão aceita e gravada em `legal_acceptances`.
 *   Ao publicar uma alteração MATERIAL, suba a versão: quem já aceitou a
 *   anterior volta a ver o aceite no próximo acesso ao app.
 */

export const LEGAL_VERSION = "1.0";

/**
 * Vigência da versão 1.0. ATUALIZAR NO MERGE se a data mudar — as strings
 * ficam aqui (e não em `new Date()`) para o texto exibido não depender de
 * fuso nem de locale do servidor.
 */
export const LEGAL_EFFECTIVE = {
  iso: "2026-07-28",
  pt: "28 de julho de 2026",
  en: "July 28, 2026",
};

/**
 * A Taxa: 5% sobre o valor total do contrato, cobrados
 * proporcionalmente a cada pagamento anual. O número vive aqui e no texto dos
 * Termos (seção 5) — o card de preços tem o seu próprio texto em content.ts.
 */
export const SUCCESS_FEE_RATE = 0.05;

/**
 * Identificadores gravados na coluna `documento` de `legal_acceptances`.
 * O aceite é em CAMADAS: cada regra é confirmada no momento em que passa a
 * valer para aquele usuário, e não só uma vez no cadastro.
 */
export const LEGAL_DOCS = {
  /** Cadastro / primeiro acesso — sem contexto. */
  terms: "termos",
  privacy: "privacidade",
  /** Ao publicar um anúncio (proprietário) — contexto: listing_id. */
  listing: "anuncio",
  /** Ao enviar proposta formal (produtor) — contexto: conversation_id. */
  offer: "proposta",
  /** No fechamento (proprietário, parte pagante) — contexto: conversation_id. */
  fee: "taxa_sucesso",
} as const;

export type LegalDocId = (typeof LEGAL_DOCS)[keyof typeof LEGAL_DOCS];

/** Documentos cujo aceite é exigido para usar o app. */
export const CORE_LEGAL_DOCS: LegalDocId[] = [LEGAL_DOCS.terms, LEGAL_DOCS.privacy];

/* ────────────────────────── estrutura dos documentos ────────────────────────── */

export type LegalBlock =
  | { kind: "p"; text: string }
  | { kind: "list"; items: string[] }
  /** Cláusula com destaque próprio (usada na regra de conduta do chat). */
  | { kind: "clause"; ref: string; title: string; text: string }
  /** Caixa informativa — contexto, não obrigação. */
  | { kind: "note"; text: string };

export type LegalSection = {
  /** Âncora da seção (#id) — usada pelo índice no topo da página. */
  id: string;
  title: string;
  blocks: LegalBlock[];
};

export type LegalDocument = {
  title: string;
  /** Preâmbulo exibido antes do índice. */
  intro: string;
  sections: LegalSection[];
};

/**
 * A numeração exibida das seções é a POSIÇÃO no array (1, 2, 3...). As
 * referências cruzadas escritas no texto ("cláusula 3.3") contam com isso —
 * ao reordenar seções, confira as referências.
 */
export function legalDocFor(
  lang: string,
  doc: { pt: LegalDocument; en: LegalDocument },
): { content: LegalDocument; courtesy: boolean } {
  return lang === "pt"
    ? { content: doc.pt, courtesy: false }
    : { content: doc.en, courtesy: true };
}
