"use server";

import { siteConfig } from "@/lib/site-config";
import { content } from "@/lib/content";

export type WaitlistRole = "have" | "want";

export type WaitlistResult = { ok: true } | { ok: false; error: string };

/**
 * Sends waitlist signups to the Google Sheet (via the Apps Script web app
 * URL configured in lib/site-config.ts -> waitlistEndpoint). The script
 * appends one row per signup, in this column order:
 * Timestamp, Name, WhatsApp, Type, Purpose, Country, State, Municipality, Language.
 */
export async function submitWaitlist(formData: FormData): Promise<WaitlistResult> {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim() as WaitlistRole;
  const purpose = String(formData.get("purpose") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const municipality = String(formData.get("municipality") ?? "").trim();
  const language = String(formData.get("language") ?? "").trim();

  if (
    !name ||
    !phone ||
    !purpose ||
    !state ||
    !municipality ||
    (role !== "have" && role !== "want")
  ) {
    return { ok: false, error: "missing_fields" };
  }

  const lang = language === "en" ? "en" : "pt";

  // Human-readable Type value for the sheet.
  const type =
    role === "have"
      ? lang === "en"
        ? "Has land"
        : "Tem terra"
      : lang === "en"
        ? "Looking for land"
        : "Procura terra";

  // Human-readable Purpose label for the sheet (falls back to the raw value).
  const purposeDetail = String(formData.get("purposeDetail") ?? "").trim();
  const baseLabel =
    content[lang].waitlist.purposeOptions.find((o) => o.value === purpose)
      ?.label ?? purpose;
  const purposeLabel = purposeDetail
    ? `${baseLabel} — ${purposeDetail}`
    : baseLabel;

  try {
    const res = await fetch(siteConfig.waitlistEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        whatsapp: phone,
        type,
        purpose: purposeLabel,
        country: country || (lang === "en" ? "Brazil" : "Brasil"),
        state,
        municipality,
        language: lang,
      }),
    });

    if (!res.ok) {
      return { ok: false, error: "request_failed" };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "request_failed" };
  }
}
