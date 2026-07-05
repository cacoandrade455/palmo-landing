/**
 * Site-wide config values.
 * - whatsappNumber: Palmo's WhatsApp number, digits only, with country code.
 * - instagramUrl: not in use yet (Instagram link is hidden in the footer for now).
 * - siteUrl: replace with the real domain once palmo.com.br is live.
 * - waitlistEndpoint: Google Apps Script web app URL that appends signups to
 *   the "Palmo Waitlist" Google Sheet.
 */
export const siteConfig = {
  whatsappNumber: "5561982626428",
  instagramUrl: "", // Instagram off for now — link is hidden in the footer.
  siteUrl: "https://palmo.com.br", // TODO: replace with the real domain
  waitlistEndpoint:
    "https://script.google.com/macros/s/AKfycbzr2ccHvrI1NP1sAyHNtaIX2KUSDv_oqX2qmYc8-9QaRTJmwETDUQwQpPnWgWX4qnyo/exec",
};

/** Default message pre-filled when someone opens WhatsApp from the site. */
export const whatsappDefaultMessage =
  "Olá! Vim pelo site da Palmo e quero saber mais.";

export function whatsappLink(message: string = whatsappDefaultMessage) {
  const base = `https://wa.me/${siteConfig.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
