import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { RecommenderLink } from "@/components/RecommenderLink";
import { HowItWorks } from "@/components/HowItWorks";
import { TrustStrip } from "@/components/TrustStrip";
import { PricingBanner } from "@/components/PricingBanner";
import { Waitlist } from "@/components/Waitlist";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <div className="bg-white pb-4">
          <div className="mx-auto max-w-6xl px-6">
            <RecommenderLink className="max-w-md" />
          </div>
        </div>
        <HowItWorks />
        <TrustStrip />
        <PricingBanner />
        <Waitlist />
      </main>
      <Footer />
    </>
  );
}
