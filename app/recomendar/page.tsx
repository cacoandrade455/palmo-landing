import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LandRecommender } from "./LandRecommender";

export const metadata: Metadata = {
  title: "O melhor uso da sua terra — Palmo",
  description:
    "Não sabe o que plantar? Informe onde fica a terra e receba um ranking das vocações que a sua região comprovadamente faz, com fontes oficiais. Grátis.",
};

export default function RecomendarPage() {
  return (
    <>
      <Header />
      <main>
        <LandRecommender />
      </main>
      <Footer />
    </>
  );
}
