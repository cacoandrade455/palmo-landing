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
 *
 * Notes:
 * - `purpose` is OPTIONAL. The landing form doesn't collect it (only the
 *   calculator lead form sends it). Requiring it here was the bug that made
 *   every landing signup fail with missing_fields before ever reaching the
 *   Apps Script endpoint.
 * - For "Procuro terra", State/Municipality can carry multiple regions,
 *   joined as "BA, MG" / "Salvador/BA; Todo o estado/MG". Same columns,
 *   so the Apps Script doesn't need any change.
 * - On failure, the real reason (HTTP status + response snippet) is logged
 *   to the server terminal — that's where the truth lives.
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
    !state ||
    !municipality ||
    (role !== "have" && role !== "want")
  ) {
    // Log which fields are missing (booleans only — never log the values).
    console.error("[waitlist] missing fields:", {
      name: !!name,
      phone: !!phone,
      state: !!state,
      municipality: !!municipality,
      role,
    });
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

  // Human-readable Purpose label for the sheet (optional; falls back to the
  // raw value, and stays empty when the form didn't collect a purpose).
  const purposeDetail = String(formData.get("purposeDetail") ?? "").trim();
  const baseLabel = purpose
    ? content[lang].waitlist.purposeOptions.find((o) => o.value === purpose)
        ?.label ?? purpose
    : "";
  const purposeLabel = purposeDetail
    ? baseLabel
      ? `${baseLabel} — ${purposeDetail}`
      : purposeDetail
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

    const bodyText = await res.text();

    if (!res.ok) {
      console.error(
        `[waitlist] endpoint HTTP ${res.status}:`,
        bodyText.slice(0, 300),
      );
      return { ok: false, error: "request_failed" };
    }

    // A 200 that is actually a Google sign-in page means the Apps Script
    // deployment access is not set to "Qualquer pessoa" — the row was NOT
    // written. Surface it instead of reporting a false success.
    if (bodyText.includes("accounts.google.com")) {
      console.error(
        "[waitlist] endpoint returned a Google sign-in page — no Apps Script, set the implantação (deployment) access to 'Qualquer pessoa' and use the /exec URL.",
      );
      return { ok: false, error: "request_failed" };
    }

    return { ok: true };
  } catch (err) {
    console.error("[waitlist] request failed:", err);
    return { ok: false, error: "request_failed" };
  }
}
