/**
 * Replace these three values before launching:
 * 1. whatsappNumber — Palmo's WhatsApp number, digits only, with country code.
 * 2. instagramUrl — Palmo's Instagram profile.
 * 3. The waitlist form backend — see app/actions.ts.
 */
export const siteConfig = {
  whatsappNumber: "5500000000000", // TODO: replace with the real number
  instagramUrl: "https://instagram.com/palmo", // TODO: replace with the real handle
  siteUrl: "https://palmo.com.br", // TODO: replace with the real domain
};

export function whatsappLink(message?: string) {
  const base = `https://wa.me/${siteConfig.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
