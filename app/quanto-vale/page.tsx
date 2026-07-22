import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Appraiser } from "@/components/Appraiser";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Quanto vale minha terra? — Palmo",
  description:
    "Descubra em 1 minuto a faixa de valores de arrendamento da sua terra, por região e tipo de uso. Grátis.",
};

export default function QuantoValePage() {
  return (
    <>
      <Header />
      <main>
        {/* Discovery (recommender) and calculation now live in one tool, the
            Appraiser — the mode switch is at the top of it. */}
        <Appraiser />
      </main>
      <Footer />
    </>
  );
}
