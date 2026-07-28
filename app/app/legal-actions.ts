"use server";

import { headers } from "next/headers";
import { getServerSupabase } from "@/lib/supabase-server";
import {
  CORE_LEGAL_DOCS,
  LEGAL_DOCS,
  LEGAL_VERSION,
  SUCCESS_FEE_RATE,
} from "@/lib/legal";

/**
 * Aceites legais — leitura e gravação em `legal_acceptances`
 * (supabase/migrations/20260729-legal-acceptances.sql).
 *
 * REGRA DE OURO deste arquivo: nada aqui pode travar o que já funciona. O
 * gate de contato e o fechamento do negócio seguem intocados; o aceite é uma
 * camada de REGISTRO por cima. Se a tabela não existir (migration pendente),
 * o app se comporta como antes.
 */

/** Erros de "tabela ainda não existe" — PostgREST e Postgres. */
function isMissingTable(code?: string): boolean {
  return code === "PGRST205" || code === "42P01";
}

/** 23505 = unique_violation: já aceito antes. Reaceitar é no-op, não erro. */
const DUPLICATE = "23505";

/** IP e user agent da requisição — prova do aceite (Política, seção 2). */
async function requestFingerprint(): Promise<{ ip: string | null; ua: string | null }> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    null;
  return { ip, ua: h.get("user-agent") };
}

export type LegalStatus = {
  /** true quando há usuário logado que ainda não aceitou a versão vigente. */
  needsAcceptance: boolean;
  /** false quando a migration ainda não foi aplicada (gate inativo). */
  gateActive: boolean;
};

export async function getLegalStatus(): Promise<LegalStatus> {
  const supabase = await getServerSupabase();
  if (!supabase) return { needsAcceptance: false, gateActive: false };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { needsAcceptance: false, gateActive: false };

  const { data, error } = await supabase
    .from("legal_acceptances")
    .select("documento")
    .eq("user_id", user.id)
    .eq("versao", LEGAL_VERSION)
    .is("conversation_id", null);

  // Migration pendente (ou leitura indisponível): não bloqueia ninguém —
  // sem a tabela, o INSERT do aceite também falharia e o usuário ficaria
  // preso numa tela que não tem como concluir.
  if (error) return { needsAcceptance: false, gateActive: false };

  const accepted = new Set((data ?? []).map((r) => r.documento as string));
  const missing = CORE_LEGAL_DOCS.some((d) => !accepted.has(d));
  return { needsAcceptance: missing, gateActive: true };
}

/** Registra o aceite dos Termos e da Política (um registro por documento). */
export async function acceptCoreDocs(): Promise<{ ok: boolean; error?: string }> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, error: "unconfigured" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_signed_in" };

  const { ip, ua } = await requestFingerprint();

  // Um INSERT por documento (e não um upsert em lote): os índices únicos são
  // PARCIAIS (`where conversation_id is null`), e o Postgres não consegue
  // inferi-los num ON CONFLICT sem a cláusula WHERE — que o PostgREST não
  // envia. Inserindo separado, um documento já registrado não impede o outro.
  const results = await Promise.all(
    CORE_LEGAL_DOCS.map((documento) =>
      supabase.from("legal_acceptances").insert({
        user_id: user.id,
        documento,
        versao: LEGAL_VERSION,
        ip,
        user_agent: ua,
      }),
    ),
  );

  const failed = results.find((r) => r.error && r.error.code !== DUPLICATE);
  return failed?.error
    ? { ok: false, error: failed.error.message }
    : { ok: true };
}

/* ────────────────────── aceites contextuais (camadas) ────────────────────── */

/**
 * Registro genérico de um aceite feito DENTRO de um contexto: ao publicar um
 * anúncio (listing) ou ao negociar (conversation).
 *
 * Fail-open por desenho: estas funções são chamadas DEPOIS da ação principal
 * (o anúncio já publicado, a proposta já enviada). Se o registro falhar, a
 * ação do usuário não é desfeita nem bloqueada — o erro volta para quem
 * chamou apenas para telemetria futura.
 */
async function recordContextual(
  documento: string,
  context: { listing_id?: string; conversation_id?: string },
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, error: "unconfigured" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_signed_in" };

  const { ip, ua } = await requestFingerprint();
  const { error } = await supabase.from("legal_acceptances").insert({
    user_id: user.id,
    documento,
    versao: LEGAL_VERSION,
    ip,
    user_agent: ua,
    ...context,
  });
  return error && error.code !== DUPLICATE
    ? { ok: false, error: error.message }
    : { ok: true };
}

/** C.2 — aceite do proprietário ao PUBLICAR o anúncio (taxa visível). */
export async function acceptListingTerms(listingId: string) {
  return recordContextual(LEGAL_DOCS.listing, { listing_id: listingId });
}

/** C.3 — aceite do produtor ao enviar PROPOSTA formal (contato + 3.3/3.4). */
export async function acceptOfferTerms(conversationId: string) {
  return recordContextual(LEGAL_DOCS.offer, { conversation_id: conversationId });
}

/* ────────────────────── termo da taxa de sucesso ────────────────────── */

export type FeeTerm = {
  /** false quando não se aplica (não sou o proprietário, negócio aberto…). */
  applies: boolean;
  accepted: boolean;
  /** Registro indisponível (migration pendente): mostra o termo sem botão. */
  recordable: boolean;
  hectares: number;
  pricePerHaYear: number;
  termYears: number | null;
  /** Valor anual do contrato = preço × área. */
  annual: number;
  /** Valor total = anual × prazo (null quando o prazo não foi acordado). */
  total: number | null;
  /** 5% do valor anual — o que vence junto com cada pagamento anual. */
  feeAnnual: number;
  /** 5% do valor total (null quando o prazo não foi acordado). */
  feeTotal: number | null;
};

const NOT_APPLICABLE: FeeTerm = {
  applies: false,
  accepted: false,
  recordable: false,
  hectares: 0,
  pricePerHaYear: 0,
  termYears: null,
  annual: 0,
  total: null,
  feeAnnual: 0,
  feeTotal: null,
};

/**
 * Termo da taxa para o PROPRIETÁRIO (owner_id) — a parte pagante —, quando o
 * negócio está fechado. Para o produtor e para negócios não fechados devolve
 * `applies: false` e o componente simplesmente não aparece.
 */
export async function getFeeTerm(conversationId: string): Promise<FeeTerm> {
  const supabase = await getServerSupabase();
  if (!supabase) return NOT_APPLICABLE;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NOT_APPLICABLE;

  const { data: conv } = await supabase
    .from("conversations")
    .select("id, listing_id, owner_id, developer_id, deal_status")
    .eq("id", conversationId)
    .maybeSingle();
  if (!conv) return NOT_APPLICABLE;
  if (conv.deal_status !== "closed") return NOT_APPLICABLE;
  if (conv.owner_id !== user.id) return NOT_APPLICABLE; // só o pagante

  const [{ data: offer }, { data: listing }] = await Promise.all([
    supabase
      .from("offers")
      .select("price_per_ha_year, term_years")
      .eq("conversation_id", conversationId)
      .eq("status", "accepted")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("listings")
      .select("hectares")
      .eq("id", conv.listing_id)
      .maybeSingle(),
  ]);
  if (!offer || !listing) return NOT_APPLICABLE;

  const hectares = Number(listing.hectares);
  const pricePerHaYear = Number(offer.price_per_ha_year);
  const termYears = offer.term_years == null ? null : Number(offer.term_years);
  const annual = pricePerHaYear * hectares;
  const total = termYears ? annual * termYears : null;

  const { data: acc, error: accErr } = await supabase
    .from("legal_acceptances")
    .select("id")
    .eq("user_id", user.id)
    .eq("documento", LEGAL_DOCS.fee)
    .eq("conversation_id", conversationId)
    .maybeSingle();

  return {
    applies: true,
    accepted: !accErr && !!acc,
    recordable: !accErr || !isMissingTable(accErr.code),
    hectares,
    pricePerHaYear,
    termYears,
    annual,
    total,
    feeAnnual: annual * SUCCESS_FEE_RATE,
    feeTotal: total == null ? null : total * SUCCESS_FEE_RATE,
  };
}

/* ─────────── transparência da taxa durante a negociação (ambas as partes) ─────────── */

export type FeeDisclosure = {
  /** false quando ainda não há proposta aceita ou não sou participante. */
  available: boolean;
  annual: number;
  total: number | null;
  termYears: number | null;
  feeAnnual: number;
  feeTotal: number | null;
};

/**
 * Números da taxa para EXIBIÇÃO na Sala do Contrato, visíveis aos DOIS lados
 * (proprietário e produtor). Transparência antecipada: as duas partes veem o
 * valor do contrato e a taxa antes de assinar, o que tira o incentivo de
 * fechar por fora.
 *
 * É só leitura e aritmética — não altera nenhuma lógica de negócio, não toca
 * a calculadora e não desconta nada de valor nenhum.
 */
export async function getFeeDisclosure(
  conversationId: string,
): Promise<FeeDisclosure> {
  const EMPTY: FeeDisclosure = {
    available: false,
    annual: 0,
    total: null,
    termYears: null,
    feeAnnual: 0,
    feeTotal: null,
  };

  const supabase = await getServerSupabase();
  if (!supabase) return EMPTY;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return EMPTY;

  // RLS já restringe conversas aos participantes; a checagem abaixo é só
  // para não montar a linha quando a leitura vier vazia.
  const { data: conv } = await supabase
    .from("conversations")
    .select("listing_id, owner_id, developer_id")
    .eq("id", conversationId)
    .maybeSingle();
  if (!conv) return EMPTY;
  if (conv.owner_id !== user.id && conv.developer_id !== user.id) return EMPTY;

  const [{ data: offer }, { data: listing }] = await Promise.all([
    supabase
      .from("offers")
      .select("price_per_ha_year, term_years")
      .eq("conversation_id", conversationId)
      .eq("status", "accepted")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("listings")
      .select("hectares")
      .eq("id", conv.listing_id)
      .maybeSingle(),
  ]);
  if (!offer || !listing) return EMPTY;

  const termYears = offer.term_years == null ? null : Number(offer.term_years);
  const annual = Number(offer.price_per_ha_year) * Number(listing.hectares);
  const total = termYears ? annual * termYears : null;

  return {
    available: true,
    annual,
    total,
    termYears,
    feeAnnual: annual * SUCCESS_FEE_RATE,
    feeTotal: total == null ? null : total * SUCCESS_FEE_RATE,
  };
}

/**
 * Registra o aceite do termo da taxa. Falhar aqui NÃO afeta o fechamento nem
 * a liberação dos contatos, que já aconteceram e são independentes.
 */
export async function acceptFeeTerm(
  conversationId: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, error: "unconfigured" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_signed_in" };

  // Confere no servidor que quem aceita é mesmo o proprietário do negócio
  // fechado — a parte que deve a taxa.
  const { data: conv } = await supabase
    .from("conversations")
    .select("owner_id, deal_status")
    .eq("id", conversationId)
    .maybeSingle();
  if (!conv || conv.deal_status !== "closed" || conv.owner_id !== user.id) {
    return { ok: false, error: "not_applicable" };
  }

  const { ip, ua } = await requestFingerprint();
  const { error } = await supabase.from("legal_acceptances").insert({
    user_id: user.id,
    documento: LEGAL_DOCS.fee,
    versao: LEGAL_VERSION,
    conversation_id: conversationId,
    ip,
    user_agent: ua,
  });
  // Aceitar de novo (dois cliques, duas abas) não é erro.
  return error && error.code !== DUPLICATE
    ? { ok: false, error: error.message }
    : { ok: true };
}
