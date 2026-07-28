"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Droplet, MessageCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { getSupabase } from "@/lib/supabase";
import { startConversation, type ListingDetailData } from "./actions";

export function ListingDetail({
  listing,
  isOwner,
}: {
  listing: ListingDetailData;
  isOwner: boolean;
}) {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const label =
    lang === "en"
      ? { back: "Back to listings", owner: "Owner", contact: "Contact owner", yours: "This is your listing", water: "Water source", perYear: "/ha/year", area: "Area", use: "Use", desc: "Description", err: "Couldn't start the conversation.", verified: "Verified", verifiedHint: "Rural registry (CAR) provided by the owner", photoAlt: (title: string) => `Photo of ${title}` }
      : { back: "Voltar aos anúncios", owner: "Proprietário", contact: "Falar com o dono", yours: "Este é o seu anúncio", water: "Fonte de água", perYear: "/ha/ano", area: "Área", use: "Uso", desc: "Descrição", err: "Não foi possível iniciar a conversa.", verified: "Verificado", verifiedHint: "CAR informado pelo proprietário", photoAlt: (title: string) => `Foto de ${title}` };

  const purposeLabel = t.waitlist.purposeOptions.find((o) => o.value === listing.purpose)?.label ?? listing.purpose;
  const cropLabel = listing.crop
    ? t.appraiser.crops[listing.purpose]?.find((c) => c.value === listing.crop)?.label ?? listing.crop
    : null;

  async function contact() {
    setError(null);
    setBusy(true);
    const res = await startConversation(listing.id);
    setBusy(false);
    if (res.ok) {
      router.push(`/app/mensagens/${res.conversationId}`);
    } else if (res.error === "not_signed_in") {
      // Deslogado: entra com Google e VOLTA para esta mesma listagem.
      const supabase = getSupabase();
      if (supabase) {
        supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: window.location.href },
        });
      } else {
        router.push("/conta");
      }
    } else {
      setError(label.err);
    }
  }

  return (
    <div>
      <button onClick={() => router.push("/explorar")} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-deep/60 hover:text-deep">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {label.back}
      </button>

      <div className="overflow-hidden rounded-2xl border border-deep/10 bg-white shadow-sm">
        {listing.photos.length > 0 && (
          <div className="relative h-56 bg-neutral sm:h-72">
            {/* eslint-disable-next-line @next/next/no-img-element -- fotos vêm do storage do Supabase (host externo) */}
            <img
              src={listing.photos[0]}
              alt={label.photoAlt(listing.title)}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        )}

        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-extrabold tracking-tight text-deep sm:text-3xl">{listing.title}</h1>
            <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
              {listing.hectares} ha
            </span>
          </div>

          {listing.verified && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                title={label.verifiedHint}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary"
              >
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                {label.verified}
              </span>
              <span className="text-xs text-deep/50">{label.verifiedHint}</span>
            </div>
          )}

          <p className="mt-2 flex items-center gap-1.5 text-deep/60">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            {listing.municipality}, {listing.state}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-deep/50">{label.use}</p>
              <p className="font-semibold text-deep">{cropLabel ?? purposeLabel}</p>
            </div>
            {listing.price_per_ha_year && (
              <div>
                <p className="text-deep/50">R$/ha/ano</p>
                <p className="font-semibold text-deep">R$ {listing.price_per_ha_year.toLocaleString("pt-BR")}</p>
              </div>
            )}
            {listing.has_water && (
              <div className="flex items-center gap-1.5 text-primary">
                <Droplet className="h-4 w-4" aria-hidden="true" />
                <span className="font-semibold">{label.water}</span>
              </div>
            )}
          </div>

          {listing.description && (
            <div className="mt-6">
              <p className="text-sm text-deep/50">{label.desc}</p>
              <p className="mt-1 whitespace-pre-line text-deep/80">{listing.description}</p>
            </div>
          )}

          {listing.ownerName && (
            <div className="mt-6 border-t border-deep/10 pt-6">
              <p className="text-sm text-deep/50">{label.owner}</p>
              <p className="font-semibold text-deep">{listing.ownerName}</p>
            </div>
          )}

          {error && <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>}

          {isOwner ? (
            <p className="mt-6 rounded-xl bg-neutral px-4 py-3 text-center text-sm font-semibold text-deep/60">
              {label.yours}
            </p>
          ) : (
            <button
              onClick={contact}
              disabled={busy}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-base font-bold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:opacity-60"
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
              {label.contact}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
