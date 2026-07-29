/**
 * Site-wide config values.
 * - whatsappNumber: Palmo's WhatsApp Business number, digits only, with country
 *   code and the mandatory 9th digit (55 + DDD + 9 + 8 digits).
 * - instagramUrl: not in use yet (Instagram link is hidden in the footer).
 * - siteUrl: live domain. Only change if the domain itself changes.
 * - waitlistEndpoint: IN USE. Google Apps Script web app that appends one row
 *   per lead to the "Palmo Waitlist" Google Sheet. Consumed by
 *   `submitWaitlist` in app/actions.ts, which is called by
 *   components/Appraiser.tsx (the calculator's lead form on the home hero).
 *   The old waitlist SECTION was removed from the home in the
 *   home-e-marketplace batch, but this endpoint is still the calculator's lead
 *   capture. DO NOT remove it: it breaks lead collection and the build.
 */
export const siteConfig = {
  whatsappNumber: "5571982534598", // +55 71 98253-4598 (Salvador/BA)
  instagramUrl: "", // Instagram off for now — link is hidden in the footer.
  siteUrl: "https://palmo.lat", // live domain
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
