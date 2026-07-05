"use server";

export type WaitlistRole = "have" | "want";

export type WaitlistResult = { ok: true } | { ok: false; error: string };

/**
 * TODO before launch: connect this to a real backend.
 * Options that fit a no-database landing page:
 *   - A Google Sheet via a service like Sheet.best or a simple Apps Script webhook
 *   - Airtable's REST API
 *   - A form backend like Formspree or Basin
 *   - A lightweight database (e.g. Vercel Postgres, Supabase) if you outgrow the above
 * For now this just validates and logs — nothing is persisted.
 */
export async function submitWaitlist(formData: FormData): Promise<WaitlistResult> {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim() as WaitlistRole;

  if (!name || !phone || (role !== "have" && role !== "want")) {
    return { ok: false, error: "missing_fields" };
  }

  // TODO: replace this console.log with a real integration (see comment above).
  console.log("[Palmo waitlist] new signup:", { name, phone, role, at: new Date().toISOString() });

  return { ok: true };
}
