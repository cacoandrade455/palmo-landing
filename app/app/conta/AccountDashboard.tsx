"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { CheckCircle2, MapPin, Pencil, Plus, LogOut, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { getSupabase } from "@/lib/supabase";
import { getMyListings, updateListingStatus, type MyListing } from "./actions";
import { getMyKyc, type KycSummary } from "../verificacao/actions";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-primary/10 text-primary",
  draft: "bg-deep/10 text-deep/60",
  paused: "bg-accent/25 text-deep",
  closed: "bg-deep/10 text-deep/60",
  archived: "bg-deep/10 text-deep/40",
};

export function AccountDashboard() {
  const { t, lang } = useLanguage();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [listings, setListings] = useState<MyListing[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [kyc, setKyc] = useState<KycSummary | null>(null);

  const label =
    lang === "en"
      ? {
          title: "My account",
          signedInAs: "Signed in as",
          signOut: "Sign out",
          myListings: "My listings",
          newListing: "New listing",
          empty: "You haven't listed any land yet.",
          emptyCta: "List my land",
          hectares: "ha",
          perYear: "/ha/yr",
          pause: "Pause",
          activate: "Activate",
          edit: "Edit",
          carConfirmed: "CAR active in SICAR",
          carCheckedOn: "checked on",
          carDeclared: "CAR declared, not checked yet",
          carUnknownFormat:
            "We don't recognise this CAR format. It may well be our pattern that is incomplete — worth a second look at the number.",
          carReview:
            "Our SICAR check didn't line up with what is on this listing. Worth reviewing the CAR number.",
          carMissing:
            "Add the CAR of the property and this listing can earn the verified badge.",
          editedOn: "Listing edited on",
          statusLabels: {
            active: "Active",
            draft: "Draft",
            paused: "Paused",
            closed: "Closed",
            archived: "Archived",
          } as Record<string, string>,
          signInPrompt: "Sign in to see your account.",
          signIn: "Sign in with Google",
          verifiedBadge: "Identity verified",
          verifyTitle: "Verify your identity",
          verifyBody:
            "Send your details and one document. Verified accounts build more trust in every deal.",
          verifyCta: "Start verification",
          verifyStatus: "See status",
          kycPending: "Under review",
          kycRejected: "Not approved",
        }
      : {
          title: "Minha conta",
          signedInAs: "Conectado como",
          signOut: "Sair",
          myListings: "Meus anúncios",
          newListing: "Novo anúncio",
          empty: "Você ainda não anunciou nenhuma terra.",
          emptyCta: "Anunciar minha terra",
          hectares: "ha",
          perYear: "/ha/ano",
          pause: "Pausar",
          activate: "Ativar",
          edit: "Editar",
          carConfirmed: "CAR ativo no SICAR",
          carCheckedOn: "conferido em",
          carDeclared: "CAR declarado, ainda não conferido",
          carUnknownFormat:
            "Não reconhecemos esse formato de CAR. Pode muito bem ser o nosso padrão que está incompleto — vale dar uma olhada no número.",
          carReview:
            "Nossa conferência no SICAR não fechou com o que está neste anúncio. Vale revisar o número do CAR.",
          carMissing:
            "Informe o CAR do imóvel e este anúncio pode receber o selo de verificado.",
          editedOn: "Anúncio editado em",
          statusLabels: {
            active: "Ativo",
            draft: "Rascunho",
            paused: "Pausado",
            closed: "Fechado",
            archived: "Arquivado",
          } as Record<string, string>,
          signInPrompt: "Entre para ver sua conta.",
          signIn: "Entrar com Google",
          verifiedBadge: "Identidade verificada",
          verifyTitle: "Verifique sua identidade",
          verifyBody:
            "Envie seus dados e um documento. Contas verificadas geram mais confiança em cada negócio.",
          verifyCta: "Verificar agora",
          verifyStatus: "Ver situação",
          kycPending: "Em análise",
          kycRejected: "Não aprovada",
        };

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      queueMicrotask(() => setUser(null));
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user === undefined) return;
    if (user === null) {
      queueMicrotask(() => setLoading(false));
      return;
    }
    getMyListings().then((res) => {
      if (res.ok) setListings(res.listings);
      setLoading(false);
    });
    getMyKyc().then((res) => {
      if (res.ok) setKyc(res.kyc);
    });
  }, [user]);

  async function toggle(l: MyListing) {
    const next = l.status === "active" ? "paused" : "active";
    setListings((cur) =>
      cur ? cur.map((x) => (x.id === l.id ? { ...x, status: next } : x)) : cur,
    );
    await updateListingStatus(l.id, next);
  }

  const purposeLabel = (val: string) =>
    t.waitlist.purposeOptions.find((o) => o.value === val)?.label ?? val;
  const cropLabel = (purpose: string, crop: string | null) =>
    crop
      ? t.appraiser.crops[purpose]?.find((c) => c.value === crop)?.label ?? crop
      : null;

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(lang === "en" ? "en-US" : "pt-BR");

  /**
   * Situação do CAR do anúncio, em tom de consultor. Só `confirmado_sicar`
   * ganha selo (chip + data da conferência) — os outros estados são nota
   * discreta e convite, nunca selo negativo. `car_status` nulo significa que
   * ninguém conferiu nada ainda (ou que a migration do CAR não foi aplicada):
   * nesse caso não afirmamos nada.
   */
  const carNote = (l: MyListing) => {
    if (l.car_status === "confirmado_sicar") {
      return (
        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          {label.carConfirmed}
          {l.car_checked_at
            ? ` · ${label.carCheckedOn} ${fmtDate(l.car_checked_at)}`
            : ""}
        </span>
      );
    }
    const text =
      l.car_status === "formato_ok"
        ? label.carDeclared
        : l.car_status === "formato_invalido"
          ? label.carUnknownFormat
          : l.car_status === "divergente_sicar"
            ? label.carReview
            : l.car_status === "nao_informado"
              ? label.carMissing
              : null;
    if (!text) return null;
    return <p className="mt-1.5 text-xs text-deep/60">{text}</p>;
  };

  if (user === null) {
    return (
      <div className="rounded-2xl border border-deep/10 bg-white p-8 text-center shadow-sm">
        <p className="text-deep/70">{label.signInPrompt}</p>
        <Link
          href="/entrar?next=%2Fapp%2Fconta"
          className="mt-6 inline-block rounded-full bg-primary px-6 py-3.5 text-base font-bold text-white shadow-sm transition-colors hover:bg-primary-dark"
        >
          {label.signIn}
        </Link>
      </div>
    );
  }

  const name =
    (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "";
  const avatar = (user?.user_metadata?.avatar_url as string | undefined) ?? null;

  return (
    <div className="space-y-8">
      {/* Profile card */}
      <div className="rounded-2xl border border-deep/10 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element -- external OAuth avatar
              <img src={avatar} alt="" className="h-12 w-12 rounded-full" referrerPolicy="no-referrer" />
            ) : (
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
                {name.slice(0, 1).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <p className="text-xs text-deep/50">{label.signedInAs}</p>
              <p className="truncate font-extrabold text-deep">{name}</p>
              <p className="truncate text-sm text-deep/60">{user?.email}</p>
              {kyc?.status === "approved" && (
                <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {label.verifiedBadge}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => getSupabase()?.auth.signOut()}
            className="inline-flex items-center gap-2 rounded-full border border-deep/15 px-4 py-2 text-sm font-bold text-deep transition-colors hover:border-red-400 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {label.signOut}
          </button>
        </div>
      </div>

      {/* Identity verification CTA (hidden once approved — badge above) */}
      {kyc?.status !== "approved" && (
        <div className="rounded-2xl border border-deep/10 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-extrabold text-deep">{label.verifyTitle}</h2>
                  {kyc && (kyc.status === "pending" || kyc.status === "in_review") && (
                    <span className="rounded-full bg-accent/20 px-2.5 py-1 text-xs font-bold text-deep">
                      {label.kycPending}
                    </span>
                  )}
                  {kyc?.status === "rejected" && (
                    <span className="rounded-full bg-deep/10 px-2.5 py-1 text-xs font-bold text-deep/60">
                      {label.kycRejected}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-deep/70">{label.verifyBody}</p>
              </div>
            </div>
            <Link
              href="/app/verificacao"
              className="shrink-0 rounded-full bg-primary px-4 py-2 text-center text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark"
            >
              {kyc ? label.verifyStatus : label.verifyCta}
            </Link>
          </div>
        </div>
      )}

      {/* Listings */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-deep">{label.myListings}</h2>
          <Link
            href="/app/anunciar"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {label.newListing}
          </Link>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-deep/10 bg-white p-8 text-center text-deep/50 shadow-sm">
            …
          </div>
        ) : !listings || listings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-deep/20 bg-white p-10 text-center shadow-sm">
            <p className="text-deep/60">{label.empty}</p>
            <Link
              href="/app/anunciar"
              className="mt-5 inline-block rounded-full bg-primary px-6 py-3 text-base font-bold text-white hover:bg-primary-dark"
            >
              {label.emptyCta}
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {listings.map((l) => (
              <li
                key={l.id}
                className="flex flex-col gap-3 rounded-2xl border border-deep/10 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-extrabold text-deep">{l.title}</h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        STATUS_STYLES[l.status] ?? "bg-deep/10 text-deep/60"
                      }`}
                    >
                      {label.statusLabels[l.status] ?? l.status}
                    </span>
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-sm text-deep/60">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {l.municipality}, {l.state} · {l.hectares} {label.hectares} ·{" "}
                    {cropLabel(l.purpose, l.crop) ?? purposeLabel(l.purpose)}
                    {l.price_per_ha_year
                      ? ` · R$ ${l.price_per_ha_year.toLocaleString("pt-BR")}${label.perYear}`
                      : ""}
                  </p>
                  {carNote(l)}
                  {l.edited_at && (
                    <p className="mt-1.5 text-xs text-deep/50">
                      {label.editedOn} {fmtDate(l.edited_at)}
                    </p>
                  )}
                </div>
                {/* Par de ações: envolve em 390px, lado a lado a partir daí. */}
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Link
                    href={`/app/anuncio/${l.id}/editar`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-deep/15 px-4 py-2 text-sm font-bold text-deep transition-colors hover:border-primary"
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                    {label.edit}
                  </Link>
                  {(l.status === "active" || l.status === "paused") && (
                    <button
                      onClick={() => toggle(l)}
                      className="rounded-full border border-deep/15 px-4 py-2 text-sm font-bold text-deep transition-colors hover:border-primary"
                    >
                      {l.status === "active" ? label.pause : label.activate}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
