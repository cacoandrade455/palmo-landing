import { Header } from "@/components/Header";
import { HomeHero } from "@/components/HomeHero";
import { HowItWorks } from "@/components/HowItWorks";
import { FeaturedListings } from "@/components/FeaturedListings";
import { TrustStrip } from "@/components/TrustStrip";
import { PricingBanner } from "@/components/PricingBanner";
import { FinalCta } from "@/components/FinalCta";
import { Footer } from "@/components/Footer";
import { recentListings } from "./explorar/actions";

/**
 * Home pós-lançamento (jul/2026): a calculadora é o herói, o marketplace
 * entra na navegação e na seção "Terras disponíveis", e a lista de espera
 * morreu. Ordem das seções: herói · como funciona · terras · confiança ·
 * preços · CTA final.
 */
export default async function Home() {
  // Dados públicos (view public_listings, com fallback) — falha vira [].
  const listings = await recentListings(6);

  return (
    <>
      <Header />
      <main>
        <HomeHero />
        <HowItWorks />
        <FeaturedListings listings={listings} />
        <TrustStrip />
        <PricingBanner />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
