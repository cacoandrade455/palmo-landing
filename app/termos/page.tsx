import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LegalDoc } from "@/components/LegalDoc";

export const metadata: Metadata = {
  title: "Termos de Uso · Palmo",
  description:
    "Termos de Uso da plataforma Palmo: como funciona o marketplace, regras de conduta e do chat, a Taxa devida no fechamento, minutas de contrato e responsabilidades.",
};

export default function TermosPage() {
  return (
    <>
      <Header />
      <main id="top" className="bg-neutral/40 py-12">
        <div className="mx-auto max-w-2xl px-6">
          <LegalDoc which="terms" />
        </div>
      </main>
      <Footer />
    </>
  );
}
