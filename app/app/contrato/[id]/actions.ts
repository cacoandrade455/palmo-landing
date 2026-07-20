"use server";

import { getServerSupabase } from "@/lib/supabase-server";
import {
  blocksFor,
  fillBlocks,
  minYearsFor,
  PARCERIA_MAX_SHARE,
  type ContractBlock,
  type ContractType,
} from "@/lib/contract-templates";
import { content } from "@/lib/content";

/* ────────────────────────── shared types ────────────────────────── */

export type ContractComment = {
  id: string;
  block_key: string;
  author_id: string;
  body: string;
  proposed_text: string | null;
  status: "open" | "accepted" | "rejected";
  created_at: string;
};

export type ContractData = {
  id: string;
  conversation_id: string;
  type: ContractType;
  status: string;
  current_version: number;
  blocks: ContractBlock[];
  comments: ContractComment[];
  /** user_ids that approved the CURRENT version */
  approvals: string[];
  myId: string;
  iAmOwner: boolean;
  ownerId: string;
  developerId: string;
  ownerName: string | null;
  developerName: string | null;
  listing: {
    title: string;
    municipality: string;
    state: string;
    hectares: number;
    purpose: string;
  };
};

export type ContractResult =
  | { ok: true; data: ContractData }
  | { ok: false; error: string };

export type CreateContractResult =
  | { ok: true; id: string }
  | { ok: false; error: string; minYears?: number };

export type ActionResult = { ok: boolean; error?: string; minYears?: number };

/* ────────────────────────── helpers ────────────────────────── */

const fmt = (n: number) =>
  n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });

// The contract's legal text is always Portuguese (language of the forum),
// so labels are resolved from the PT dictionary regardless of UI language.
function ptPurposeLabel(purpose: string): string | null {
  return (
    content.pt.waitlist.purposeOptions.find((o) => o.value === purpose)
      ?.label ?? null
  );
}

function ptCropLabel(purpose: string, crop: string): string {
  return (
    (content.pt.appraiser.crops[purpose] ?? []).find((c) => c.value === crop)
      ?.label ?? crop
  );
}

/* ────────────────────────── create (called from the conversation) ────────── */

export async function createContract(
  conversationId: string,
  type: ContractType,
): Promise<CreateContractResult> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, error: "unconfigured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_signed_in" };

  // Already exists? Just open it (one contract per conversation).
  const { data: existing } = await supabase
    .from("contracts")
    .select("id")
    .eq("conversation_id", conversationId)
    .maybeSingle();
  if (existing) return { ok: true, id: existing.id };

  const { data: conv } = await supabase
    .from("conversations")
    .select("id, listing_id, owner_id, developer_id")
    .eq("id", conversationId)
    .single();
  if (!conv) return { ok: false, error: "not_found" };

  const { data: offer } = await supabase
    .from("offers")
    .select("id, price_per_ha_year, term_years")
    .eq("conversation_id", conversationId)
    .eq("status", "accepted")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!offer) return { ok: false, error: "no_accepted_offer" };

  const { data: listing } = await supabase
    .from("listings")
    .select(
      "title, state, municipality, hectares, purpose, crop, car_number, matricula",
    )
    .eq("id", conv.listing_id)
    .single();
  if (!listing) return { ok: false, error: "not_found" };

  // Legal gate: minimum term by purpose (Dec. 59.566/66, art. 13).
  const minYears = minYearsFor(listing.purpose);
  if (offer.term_years != null && offer.term_years < minYears) {
    return { ok: false, error: "min_term", minYears };
  }

  const iAmOwner = conv.owner_id === user.id;
  const otherId = iAmOwner ? conv.developer_id : conv.owner_id;
  const [{ data: me }, { data: other }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, display_name")
      .eq("id", user.id)
      .single(),
    supabase
      .from("public_profiles")
      .select("display_name")
      .eq("id", otherId)
      .single(),
  ]);
  const myName = me?.full_name ?? me?.display_name ?? null;
  const otherName = other?.display_name ?? null;
  const ownerName = iAmOwner ? myName : otherName;
  const developerName = iAmOwner ? otherName : myName;

  // Auto-fill from data the platform already has. Missing data keeps the
  // {{PLACEHOLDER}} visible so it can be filled in the contract room.
  const d: Record<string, string> = {};
  if (ownerName) d.PROPRIETARIO_NOME = ownerName;
  if (developerName) d.PRODUTOR_NOME = developerName;
  d.IMOVEL_TITULO = listing.title;
  d.IMOVEL_MUNICIPIO = listing.municipality;
  d.IMOVEL_UF = listing.state;
  d.IMOVEL_HECTARES = fmt(Number(listing.hectares));
  if (listing.car_number) d.IMOVEL_CAR = listing.car_number;
  if (listing.matricula) d.IMOVEL_MATRICULA = listing.matricula;
  const purposeLabel = ptPurposeLabel(listing.purpose);
  if (purposeLabel) d.FINALIDADE = purposeLabel;
  if (listing.crop) d.CULTURA = ptCropLabel(listing.purpose, listing.crop);
  if (offer.term_years != null) d.PRAZO_ANOS = String(offer.term_years);
  d.PRECO_HA_ANO = `R$ ${fmt(Number(offer.price_per_ha_year))}`;
  d.PRECO_TOTAL_ANO = fmt(
    Number(offer.price_per_ha_year) * Number(listing.hectares),
  );
  d.COMARCA = listing.municipality;

  const blocks = fillBlocks(blocksFor(type), d);

  const { data: created, error } = await supabase
    .from("contracts")
    .insert({
      conversation_id: conversationId,
      listing_id: conv.listing_id,
      offer_id: offer.id,
      type,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error || !created) {
    // Unique (conversation_id): the other side may have created it meanwhile.
    const { data: raced } = await supabase
      .from("contracts")
      .select("id")
      .eq("conversation_id", conversationId)
      .maybeSingle();
    if (raced) return { ok: true, id: raced.id };
    return { ok: false, error: error?.message ?? "insert_failed" };
  }

  const { error: vErr } = await supabase.from("contract_versions").insert({
    contract_id: created.id,
    version: 1,
    blocks,
    created_by: user.id,
  });
  if (vErr) return { ok: false, error: vErr.message };

  return { ok: true, id: created.id };
}

/* ────────────────────────── read ────────────────────────── */

export async function getContract(id: string): Promise<ContractResult> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, error: "unconfigured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_signed_in" };

  const { data: contract } = await supabase
    .from("contracts")
    .select("id, conversation_id, listing_id, type, status, current_version")
    .eq("id", id)
    .maybeSingle();
  if (!contract) return { ok: false, error: "not_found" };

  const [
    { data: version },
    { data: comments },
    { data: approvals },
    { data: conv },
    { data: listing },
  ] = await Promise.all([
    supabase
      .from("contract_versions")
      .select("blocks")
      .eq("contract_id", id)
      .eq("version", contract.current_version)
      .single(),
    supabase
      .from("contract_comments")
      .select("id, block_key, author_id, body, proposed_text, status, created_at")
      .eq("contract_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("contract_approvals")
      .select("user_id")
      .eq("contract_id", id)
      .eq("version", contract.current_version),
    supabase
      .from("conversations")
      .select("owner_id, developer_id")
      .eq("id", contract.conversation_id)
      .single(),
    supabase
      .from("listings")
      .select("title, municipality, state, hectares, purpose")
      .eq("id", contract.listing_id)
      .single(),
  ]);
  if (!version || !conv || !listing) return { ok: false, error: "not_found" };

  const iAmOwner = conv.owner_id === user.id;
  const otherId = iAmOwner ? conv.developer_id : conv.owner_id;
  const [{ data: me }, { data: other }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, display_name")
      .eq("id", user.id)
      .single(),
    supabase
      .from("public_profiles")
      .select("display_name")
      .eq("id", otherId)
      .single(),
  ]);
  const myName = me?.full_name ?? me?.display_name ?? null;
  const otherName = other?.display_name ?? null;

  return {
    ok: true,
    data: {
      id: contract.id,
      conversation_id: contract.conversation_id,
      type: contract.type as ContractType,
      status: contract.status,
      current_version: contract.current_version,
      blocks: (version.blocks ?? []) as ContractBlock[],
      comments: (comments ?? []) as ContractComment[],
      approvals: (approvals ?? []).map((a) => a.user_id as string),
      myId: user.id,
      iAmOwner,
      ownerId: conv.owner_id,
      developerId: conv.developer_id,
      ownerName: iAmOwner ? myName : otherName,
      developerName: iAmOwner ? otherName : myName,
      listing: {
        title: listing.title,
        municipality: listing.municipality,
        state: listing.state,
        hectares: Number(listing.hectares),
        purpose: listing.purpose,
      },
    },
  };
}

/* ────────────────────────── discussion ────────────────────────── */

export async function addComment(
  contractId: string,
  blockKey: string,
  body: string,
  proposedText: string | null,
): Promise<ActionResult> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, error: "unconfigured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_signed_in" };
  const trimmed = body.trim();
  const proposal = proposedText?.trim() || null;
  if (!trimmed && !proposal) return { ok: false, error: "empty" };

  const { data: contract } = await supabase
    .from("contracts")
    .select("status")
    .eq("id", contractId)
    .maybeSingle();
  if (!contract) return { ok: false, error: "not_found" };
  if (contract.status !== "discussion") return { ok: false, error: "frozen" };

  const { error } = await supabase.from("contract_comments").insert({
    contract_id: contractId,
    block_key: blockKey,
    author_id: user.id,
    body: trimmed || "—",
    proposed_text: proposal,
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

/** The counterparty accepts (new version with the proposed text) or rejects. */
export async function resolveProposal(
  commentId: string,
  accept: boolean,
): Promise<ActionResult> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, error: "unconfigured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_signed_in" };

  const { data: comment } = await supabase
    .from("contract_comments")
    .select("id, contract_id, block_key, author_id, proposed_text, status")
    .eq("id", commentId)
    .maybeSingle();
  if (!comment || !comment.proposed_text)
    return { ok: false, error: "not_found" };
  if (comment.author_id === user.id)
    return { ok: false, error: "own_proposal" };
  if (comment.status !== "open") return { ok: false, error: "already_resolved" };

  const { data: contract } = await supabase
    .from("contracts")
    .select("id, status, current_version")
    .eq("id", comment.contract_id)
    .single();
  if (!contract) return { ok: false, error: "not_found" };
  if (contract.status !== "discussion") return { ok: false, error: "frozen" };

  if (!accept) {
    const { error } = await supabase
      .from("contract_comments")
      .update({ status: "rejected" })
      .eq("id", commentId);
    return error ? { ok: false, error: error.message } : { ok: true };
  }

  const { data: version } = await supabase
    .from("contract_versions")
    .select("blocks")
    .eq("contract_id", contract.id)
    .eq("version", contract.current_version)
    .single();
  if (!version) return { ok: false, error: "not_found" };

  const blocks = (version.blocks as ContractBlock[]).map((b) =>
    b.key === comment.block_key ? { ...b, body: comment.proposed_text! } : b,
  );
  const next = contract.current_version + 1;

  // A new version automatically invalidates any single-party approval:
  // approvals are keyed by (contract_id, version).
  const { error: vErr } = await supabase.from("contract_versions").insert({
    contract_id: contract.id,
    version: next,
    blocks,
    created_by: user.id,
  });
  if (vErr) return { ok: false, error: vErr.message };

  const [{ error: cErr }, { error: mErr }] = await Promise.all([
    supabase
      .from("contracts")
      .update({ current_version: next })
      .eq("id", contract.id),
    supabase
      .from("contract_comments")
      .update({ status: "accepted" })
      .eq("id", commentId),
  ]);
  if (cErr) return { ok: false, error: cErr.message };
  if (mErr) return { ok: false, error: mErr.message };
  return { ok: true };
}

/* ────────────────────────── fill remaining fields ────────────────────────── */

export async function saveFields(
  contractId: string,
  values: Record<string, string>,
): Promise<ActionResult> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, error: "unconfigured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_signed_in" };

  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(values)) {
    if (/^\w+$/.test(k) && v.trim()) clean[k] = v.trim();
  }
  if (Object.keys(clean).length === 0) return { ok: false, error: "empty" };

  const { data: contract } = await supabase
    .from("contracts")
    .select("id, listing_id, type, status, current_version")
    .eq("id", contractId)
    .maybeSingle();
  if (!contract) return { ok: false, error: "not_found" };
  if (contract.status !== "discussion") return { ok: false, error: "frozen" };

  // Legal gates (same rules the UI shows, re-checked server-side).
  if (clean.PRAZO_ANOS !== undefined) {
    const { data: listing } = await supabase
      .from("listings")
      .select("purpose")
      .eq("id", contract.listing_id)
      .single();
    const minYears = minYearsFor(listing?.purpose ?? "");
    const n = Number(clean.PRAZO_ANOS.replace(",", "."));
    if (!Number.isFinite(n) || n < minYears) {
      return { ok: false, error: "min_term", minYears };
    }
  }
  if (
    contract.type === "parceria" &&
    clean.PERCENTUAL_PROPRIETARIO !== undefined
  ) {
    const p = Number(clean.PERCENTUAL_PROPRIETARIO.replace(",", "."));
    if (!Number.isFinite(p) || p <= 0 || p > PARCERIA_MAX_SHARE) {
      return { ok: false, error: "max_share" };
    }
  }

  const { data: version } = await supabase
    .from("contract_versions")
    .select("blocks")
    .eq("contract_id", contract.id)
    .eq("version", contract.current_version)
    .single();
  if (!version) return { ok: false, error: "not_found" };

  const current = version.blocks as ContractBlock[];
  const blocks = fillBlocks(current, clean);
  if (JSON.stringify(blocks) === JSON.stringify(current)) {
    return { ok: true }; // nothing actually resolved — no new version
  }

  const next = contract.current_version + 1;
  const { error: vErr } = await supabase.from("contract_versions").insert({
    contract_id: contract.id,
    version: next,
    blocks,
    created_by: user.id,
  });
  if (vErr) return { ok: false, error: vErr.message };
  const { error: cErr } = await supabase
    .from("contracts")
    .update({ current_version: next })
    .eq("id", contract.id);
  return cErr ? { ok: false, error: cErr.message } : { ok: true };
}

/* ────────────────────────── approvals ────────────────────────── */

export async function approveVersion(contractId: string): Promise<ActionResult> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, error: "unconfigured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_signed_in" };

  const { data: contract } = await supabase
    .from("contracts")
    .select("id, status, current_version, conversation_id")
    .eq("id", contractId)
    .maybeSingle();
  if (!contract) return { ok: false, error: "not_found" };
  if (contract.status !== "discussion") return { ok: true }; // already frozen

  const { error: aErr } = await supabase.from("contract_approvals").insert({
    contract_id: contract.id,
    version: contract.current_version,
    user_id: user.id,
  });
  // 23505 = already approved this version — fine, keep going.
  if (aErr && aErr.code !== "23505") return { ok: false, error: aErr.message };

  const [{ data: conv }, { data: approvals }] = await Promise.all([
    supabase
      .from("conversations")
      .select("owner_id, developer_id")
      .eq("id", contract.conversation_id)
      .single(),
    supabase
      .from("contract_approvals")
      .select("user_id")
      .eq("contract_id", contract.id)
      .eq("version", contract.current_version),
  ]);
  const ids = (approvals ?? []).map((a) => a.user_id as string);
  const bothApproved =
    !!conv && ids.includes(conv.owner_id) && ids.includes(conv.developer_id);
  if (bothApproved) {
    const { error } = await supabase
      .from("contracts")
      .update({ status: "ready" })
      .eq("id", contract.id);
    if (error) return { ok: false, error: error.message };
  }
  return { ok: true };
}
