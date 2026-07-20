"use server";

import { getServerSupabase } from "@/lib/supabase-server";

export type KycSummary = { tier: string; status: string };

export type KycStatusResult =
  | { ok: true; kyc: KycSummary | null }
  | { ok: false; error: string };

/** Returns the caller's KYC row (any tier), if one exists. RLS scopes to self. */
export async function getMyKycStatus(): Promise<KycStatusResult> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, error: "unconfigured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_signed_in" };

  const { data, error } = await supabase
    .from("kyc_profiles")
    .select("tier, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  return { ok: true, kyc: (data as KycSummary | null) ?? null };
}

export type IntlUbo = { name: string; country: string; passport: string };

export type IntlKycInput = {
  tier: "pf_intl" | "pj_intl";
  country: string;
  data: {
    full_name: string;
    country: string;
    passport_number: string;
    address: string;
    investment_range: string;
    source_of_funds: string;
    pep: boolean;
    entity_name?: string;
    incorporation_country?: string;
    registration_number?: string;
    ubos?: IntlUbo[];
  };
  docPaths: string[];
};

const clean = (v: string) => v.trim().slice(0, 500);

/**
 * Records the international KYC application as 'pending'. Documents are
 * uploaded client-side to the private kyc-docs/{user.id}/ folder (storage
 * RLS restricts each user to their own folder); here we only persist paths.
 * Review is manual (founder, via Supabase) in v1.
 */
export async function submitIntlKyc(
  input: IntlKycInput,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, error: "unconfigured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_signed_in" };

  if (input.tier !== "pf_intl" && input.tier !== "pj_intl")
    return { ok: false, error: "invalid_tier" };

  const d = input.data;
  const required = [d.full_name, d.country, d.passport_number, d.address, d.investment_range, d.source_of_funds];
  if (input.tier === "pj_intl")
    required.push(d.entity_name ?? "", d.incorporation_country ?? "", d.registration_number ?? "");
  if (required.some((v) => !v || !v.trim()))
    return { ok: false, error: "missing_fields" };
  if (!input.docPaths.length) return { ok: false, error: "missing_docs" };
  // Paths must live in the caller's own folder (storage RLS enforces this
  // too; this just keeps the DB row consistent).
  if (input.docPaths.some((p) => !p.startsWith(`${user.id}/`)))
    return { ok: false, error: "invalid_doc_path" };

  const data: Record<string, unknown> = {
    full_name: clean(d.full_name),
    country: clean(d.country),
    passport_number: clean(d.passport_number),
    address: clean(d.address),
    investment_range: clean(d.investment_range),
    source_of_funds: clean(d.source_of_funds),
    pep: !!d.pep,
  };
  if (input.tier === "pj_intl") {
    data.entity_name = clean(d.entity_name ?? "");
    data.incorporation_country = clean(d.incorporation_country ?? "");
    data.registration_number = clean(d.registration_number ?? "");
    data.ubos = (d.ubos ?? [])
      .filter((u) => u.name.trim())
      .slice(0, 20)
      .map((u) => ({
        name: clean(u.name),
        country: clean(u.country),
        passport: clean(u.passport),
      }));
  }

  const { error } = await supabase.from("kyc_profiles").upsert(
    {
      user_id: user.id,
      tier: input.tier,
      status: "pending",
      country: clean(input.country) || "??",
      data,
      doc_paths: input.docPaths.slice(0, 10),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  return error ? { ok: false, error: error.message } : { ok: true };
}
