import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Marketplace } from "./Marketplace";

export const metadata: Metadata = {
  title: "Explorar terras · Palmo",
  description:
    "Terras paradas disponíveis para arrendar em todo o Brasil. Filtre por estado, município, finalidade e área. Grátis até fechar negócio.",
  openGraph: {
    title: "Explorar terras · Palmo",
    description:
      "Terras paradas disponíveis para arrendar em todo o Brasil. Filtre por estado, município, finalidade e área.",
  },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * Marketplace PÚBLICO: leitura sem login (dados seguros via view
 * `public_listings`). Ações — mensagem, proposta, anunciar — continuam
 * atrás de login nas telas respectivas.
 */
export default async function ExplorarPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const uf = typeof sp.uf === "string" ? sp.uf.toUpperCase() : "";

  return (
    <>
      <Header />
      <main className="bg-neutral/40 py-12">
        <div className="mx-auto max-w-6xl px-6">
          <Marketplace initialUf={uf} />
        </div>
      </main>
      <Footer />
    </>
  );
}
