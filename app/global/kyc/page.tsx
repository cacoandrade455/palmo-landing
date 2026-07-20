import type { Metadata } from "next";
import { GlobalKycWizard } from "./GlobalKycWizard";

export const metadata: Metadata = {
  title: "Palmo Global — Investor verification",
  description:
    "Verification (KYC) for international investors. Manual review; you'll hear from us within 5 business days.",
};

/**
 * International KYC intake. The funnel ENDS at "under review": there is no
 * international marketplace yet, mirroring the contact-gate philosophy.
 */
export default function GlobalKycPage() {
  return <GlobalKycWizard />;
}
