import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LegalDoc } from "@/components/LegalDoc";

export const metadata: Metadata = {
  title: "Política de Privacidade · Palmo",
  description:
    "Como a Palmo trata seus dados pessoais: o que coletamos, bases legais da LGPD, cookies, compartilhamento, transferência internacional, retenção e seus direitos.",
};

export default function PrivacidadePage() {
  return (
    <>
      <Header />
      <main id="top" className="bg-neutral/40 py-12">
        <div className="mx-auto max-w-2xl px-6">
          <LegalDoc which="privacy" />
        </div>
      </main>
      <Footer />
    </>
  );
}
