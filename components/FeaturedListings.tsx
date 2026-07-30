"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Droplet, Image as ImageIcon, MapPin, Plus } from "lucide-react";
import { useLanguage, type AppLang } from "@/lib/language-context";
import { listingPath } from "@/lib/listing-slug";
import type { BrowseListing } from "@/app/explorar/actions";

/**
 * Seção "Terras disponíveis" da home: até 6 anúncios ativos recentes (dados
 * públicos, buscados no servidor pela page). Estados intencionais:
 *   • 3+ anúncios → grid + CTA "Ver todas";
 *   • 1–2 → os que existem + card "Sua terra aqui";
 *   • 0 → convite de lançamento (nunca grid vazio).
 * Strings inline (regra 5); zh/fr/ar replicam EN — TODO(i18n) no PR.
 */
type Copy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  seeAll: string;
  yourLandTitle: string;
  yourLandBody: string;
  yourLandCta: string;
  emptyTitle: string;
  emptyBody: string;
  emptyCtaList: string;
  emptyCtaBrowse: string;
  photoSoon: string;
  photoAlt: (title: string) => string;
  perYear: string;
  water: string;
  carAtivo: string;
  conferidoEm: (data: string) => string;
};

const COPY_PT: Copy = {
  eyebrow: "Marketplace",
  title: "Terras disponíveis",
  subtitle: "Anúncios ativos agora — leia sem conta, converse com login.",
  seeAll: "Ver todas as terras",
  yourLandTitle: "Sua terra aqui",
  yourLandBody: "Anuncie grátis e apareça para produtores do Brasil inteiro.",
  yourLandCta: "Anunciar minha terra",
  emptyTitle: "O marketplace acabou de abrir",
  emptyBody:
    "Seja um dos primeiros: anuncie sua terra grátis e apareça para produtores do Brasil inteiro.",
  emptyCtaList: "Anunciar minha terra",
  emptyCtaBrowse: "Explorar o marketplace",
  photoSoon: "Foto em breve",
  photoAlt: (title: string) => `Foto de ${title}`,
  perYear: "/ha/ano",
  carAtivo: "CAR ativo no SICAR",
  conferidoEm: (data: string) => `Conferido em ${data}`,
  water: "Água",
};

const COPY_EN: Copy = {
  eyebrow: "Marketplace",
  title: "Land available",
  subtitle: "Active listings right now — browse without an account, chat with login.",
  seeAll: "See all land",
  yourLandTitle: "Your land here",
  yourLandBody: "List for free and reach producers across Brazil.",
  yourLandCta: "List my land",
  emptyTitle: "The marketplace just opened",
  emptyBody:
    "Be one of the first: list your land for free and reach producers across Brazil.",
  emptyCtaList: "List my land",
  emptyCtaBrowse: "Explore the marketplace",
  photoSoon: "Photo coming soon",
  photoAlt: (title: string) => `Photo of ${title}`,
  perYear: "/ha/yr",
  water: "Water",
  carAtivo: "CAR active on SICAR",
  conferidoEm: (data: string) => `Checked on ${data}`,
};

const COPY: Record<AppLang, Copy> = {
  pt: COPY_PT,
  en: COPY_EN,
  zh: COPY_EN,
  fr: COPY_EN,
  ar: COPY_EN,
};

function ListingCard({ l, c, lang }: { l: BrowseListing; c: Copy; lang: AppLang }) {
  return (
    <Link
      href={listingPath(l)}
      className="block w-full overflow-hidden rounded-2xl border border-deep/10 bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      {l.photos.length > 0 ? (
        <div className="relative h-40 bg-neutral">
          {/* eslint-disable-next-line @next/next/no-img-element -- fotos vêm do storage do Supabase (host externo) */}
          <img
            src={l.photos[0]}
            alt={c.photoAlt(l.title)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center bg-neutral">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-deep/50 shadow-sm">
            <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {c.photoSoon}
          </span>
        </div>
      )}
      <div className="space-y-2 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-extrabold text-deep">{l.title}</h3>
          <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
            {l.hectares.toLocaleString(lang === "en" ? "en-US" : "pt-BR")} ha
          </span>
        </div>
        <p className="flex items-center gap-1 text-sm text-deep/60">
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          {l.municipality}, {l.state}
        </p>
        {/* Selo forte SÓ com confirmação na base do SICAR, e sempre com a data:
            selo sem data é afirmação sem lastro. O estado intermediário
            (car_declarado) NÃO aparece aqui — a home é vitrine de varredura, e
            um segundo aviso cinza em cada card viraria ruído. Ele aparece no
            /explorar e no detalhe do imóvel, que é onde a pessoa decide. */}
        {l.verified && (
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              {c.carAtivo}
            </span>
            {l.car_checked_at && (
              <p className="mt-1 text-xs text-deep/50">
                {c.conferidoEm(
                  new Date(l.car_checked_at).toLocaleDateString(
                    lang === "en" ? "en-US" : "pt-BR",
                  ),
                )}
              </p>
            )}
          </div>
        )}
        {(l.price_per_ha_year || l.has_water) && (
          <div className="flex items-center gap-3 pt-1 text-sm">
            {l.price_per_ha_year && (
              <span className="font-bold text-deep">
                R$ {l.price_per_ha_year.toLocaleString("pt-BR")}
                <span className="font-normal text-deep/50">{c.perYear}</span>
              </span>
            )}
            {l.has_water && (
              <span className="inline-flex items-center gap-1 text-primary">
                <Droplet className="h-3.5 w-3.5" aria-hidden="true" />
                {c.water}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

/** Card "Sua terra aqui" — o estado 1–2 anúncios precisa parecer intencional. */
function YourLandCard({ c }: { c: Copy }) {
  return (
    <Link
      href="/app/anunciar"
      className="flex h-full min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-6 text-center transition-all hover:-translate-y-0.5 hover:border-primary hover:bg-primary/10"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary">
        <Plus className="h-5 w-5 text-white" aria-hidden="true" />
      </span>
      <span className="text-lg font-extrabold text-deep">{c.yourLandTitle}</span>
      <span className="max-w-56 text-sm text-deep/60">{c.yourLandBody}</span>
      <span className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors">
        {c.yourLandCta}
      </span>
    </Link>
  );
}

export function FeaturedListings({ listings }: { listings: BrowseListing[] }) {
  const { lang } = useLanguage();
  const c = COPY[lang];

  return (
    <section id="terras" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-sm font-bold uppercase tracking-wide text-primary">
          {c.eyebrow}
        </p>
        <h2 className="mt-2 max-w-xl text-3xl font-extrabold tracking-tight text-deep sm:text-4xl">
          {c.title}
        </h2>
        <p className="mt-3 max-w-xl text-base text-deep/70">{c.subtitle}</p>

        {listings.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-deep/10 bg-white p-10 text-center shadow-sm">
            <p className="text-xl font-extrabold text-deep">{c.emptyTitle}</p>
            <p className="mx-auto mt-2 max-w-md text-deep/60">{c.emptyBody}</p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/app/anunciar"
                className="rounded-full bg-primary px-6 py-3.5 text-center text-base font-bold text-white shadow-sm transition-colors hover:bg-primary-dark"
              >
                {c.emptyCtaList}
              </Link>
              <Link
                href="/explorar"
                className="rounded-full bg-accent px-6 py-3.5 text-center text-base font-bold text-deep shadow-sm transition-colors hover:bg-accent-dark"
              >
                {c.emptyCtaBrowse}
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.slice(0, 6).map((l) => (
                <ListingCard key={l.id} l={l} c={c} lang={lang} />
              ))}
              {listings.length < 3 && <YourLandCard c={c} />}
            </div>
            <div className="mt-8 text-center">
              <Link
                href="/explorar"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-base font-bold text-white shadow-sm transition-colors hover:bg-primary-dark"
              >
                {c.seeAll}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
