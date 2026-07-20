import type { Metadata } from "next";
import { GlobalLanding } from "./GlobalLanding";

export const metadata: Metadata = {
  title: "Palmo Global — Access Brazilian farmland yield",
  description:
    "Early access for international investors: income from verified, productive land in Brazil through regulated structures. Verification required.",
};

/**
 * International funnel — intentionally OUTSIDE the /app/* gate: this is an
 * institutional landing + KYC intake only. There is no international
 * marketplace yet; the funnel ends at "under review".
 */
export default function GlobalPage() {
  return <GlobalLanding />;
}
