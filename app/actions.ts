"use server";

import { siteConfig } from "@/lib/site-config";

export type WaitlistRole = "have" | "want";

export type WaitlistResult = { ok: true } | { ok: false; error: string };

/**
 * Sends waitlist signups to the Google Sheet (via the Apps Script web app
 * URL configured in lib/site-config.ts -> waitlistEndpoint). The script
 * appends one row per signup: Timestamp, Name, WhatsApp, Type, Municipality,
 * Language.
 */
export async function submitWaitlist(formData: FormData): Promise<WaitlistResult> {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim() as WaitlistRole;
  const language = String(formData.get("language") ?? "").trim();

  if (!name || !phone || (role !== "have" && role !== "want")) {
    return { ok: false, error: "missing_fields" };
  }

  // Human-readable Type value for the sheet.
  const type =
    role === "have"
      ? language === "en"
        ? "Has land"
        : "Tem terra"
      : language === "en"
        ? "Looking for land"
        : "Procura terra";

  try {
    const res = await fetch(siteConfig.waitlistEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        whatsapp: phone,
        type,
        municipality: "",
        language: language || "pt",
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
