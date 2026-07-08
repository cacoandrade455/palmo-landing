/**
 * App feature gate. The full application (profiles, listings, inbox) lives
 * under /app/* and only becomes reachable when NEXT_PUBLIC_APP_ENABLED === "true".
 *
 * While disabled, /app/* routes render a branded "em breve" placeholder,
 * so the public site is untouched and the app is dark-launched until you
 * flip the flag in Vercel (and locally in .env.local).
 */
export const APP_ENABLED = process.env.NEXT_PUBLIC_APP_ENABLED === "true";
