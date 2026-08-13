import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CamadasAmbientais } from "@/components/CamadasAmbientais";
import { basemapSatelite } from "@/lib/basemap-satelite";
import { content } from "@/lib/content";
import { listingIdFromParam, listingPath } from "@/lib/listing-slug";
import { PURPOSE_OPEN } from "@/lib/purpose-open";
import { siteConfig } from "@/lib/site-config";
import { getServerSupabase } from "@/lib/supabase-server";
import { getCamadasAmbientais, getListing, type ListingDetailData } from "./actions";
import { ListingDetail } from "./ListingDetail";

type Params = Promise<{ id: string }>;

/** "45 ha de cacau em Mutuípe, BA" — rótulos PT (idioma principal do SEO). */
function seoHeadline(l: ListingDetailData): string {
  const pt = content.pt;
  const ha = l.hectares.toLocaleString("pt-BR");
  // Finalidade aberta não tem "uso" a cravar: a frase muda de preposição
  // ("com finalidade aberta") para continuar natural, sem vazar o value cru.
  if (l.purpose === PURPOSE_OPEN)
    return `${ha} ha com finalidade aberta em ${l.municipality}, ${l.state}`;
  const cropLabel = l.crop
    ? pt.appraiser.crops[l.purpose]?.find((c) => c.value === l.crop)?.label
    : undefined;
  const purposeLabel =
    pt.waitlist.purposeOptions.find((o) => o.value === l.purpose)?.label ??
    l.purpose;
  const uso = (cropLabel ?? purposeLabel).toLowerCase();
  return `${ha} ha de ${uso} em ${l.municipality}, ${l.state}`;
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id: param } = await params;
  const id = listingIdFromParam(param);
  if (!id) return { title: "Terra · Palmo" };
  const res = await getListing(id);
  if (!res.ok) return { title: "Terra · Palmo" };
  const l = res.listing;

  const title = `${seoHeadline(l)} | Palmo`;
  const description = l.description
    ? l.description.slice(0, 155)
    : `Terra disponível para arrendar em ${l.municipality}, ${l.state}. Converse com o dono pela Palmo. Grátis até fechar negócio.`;
  const url = `${siteConfig.siteUrl}${listingPath(l)}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "Palmo",
      locale: "pt_BR",
      type: "website",
      ...(l.photos.length > 0 ? { images: [{ url: l.photos[0] }] } : {}),
    },
    twitter: {
      card: l.photos.length > 0 ? "summary_large_image" : "summary",
      title,
      description,
    },
  };
}

/**
 * Página PÚBLICA da listagem (/terra/<slug>--<uuid>): dados não sensíveis
 * apenas — sem contato do dono, sem CAR cru, sem matrícula. A ação de
 * conversar exige login (e volta para cá depois do OAuth).
 */
export default async function TerraPage({ params }: { params: Params }) {
  const { id: param } = await params;
  const id = listingIdFromParam(param);
  if (!id) redirect("/explorar");
  const res = await getListing(id);
  if (!res.ok) redirect("/explorar");

  let isOwner = false;
  const supabase = await getServerSupabase();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isOwner = user?.id === res.listing.owner_id;
  }

  // Camadas ambientais do CAR. Lidas do banco, NUNCA da fonte externa: o SICAR
  // é consultado por evento de anúncio, jamais por pageview. Sem linha
  // gravada, `camadas` é null e a seção não é renderizada.
  const camadas = await getCamadasAmbientais(res.listing.id);

  return (
    <>
      <Header />
      <main className="bg-neutral/40 py-12">
        <div className="mx-auto max-w-2xl px-6">
          <ListingDetail listing={res.listing} isOwner={isOwner} />
          {camadas ? (
            <CamadasAmbientais camadas={camadas} basemap={basemapSatelite()} />
          ) : null}
        </div>
      </main>
      <Footer />
    </>
  );
}
