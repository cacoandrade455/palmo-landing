"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { MapPin, Plus, LogOut } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { getSupabase } from "@/lib/supabase";
import { getMyListings, updateListingStatus, type MyListing } from "./actions";

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
          statusLabels: {
            active: "Active",
            draft: "Draft",
            paused: "Paused",
            closed: "Closed",
            archived: "Archived",
          } as Record<string, string>,
          signInPrompt: "Sign in to see your account.",
          signIn: "Sign in with Google",
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
          statusLabels: {
            active: "Ativo",
            draft: "Rascunho",
            paused: "Pausado",
            closed: "Fechado",
            archived: "Arquivado",
          } as Record<string, string>,
          signInPrompt: "Entre para ver sua conta.",
          signIn: "Entrar com Google",
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

  if (user === null) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <p className="text-deep/70">{label.signInPrompt}</p>
        <button
          onClick={() => {
            const supabase = getSupabase();
            supabase?.auth.signInWithOAuth({
              provider: "google",
              options: { redirectTo: `${window.location.origin}/app/conta` },
            });
          }}
          className="mt-5 rounded-full bg-primary px-6 py-3 text-base font-bold text-white hover:bg-primary-dark"
        >
          {label.signIn}
        </button>
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
                </div>
                {(l.status === "active" || l.status === "paused") && (
                  <button
                    onClick={() => toggle(l)}
                    className="shrink-0 rounded-full border border-deep/15 px-4 py-2 text-sm font-bold text-deep transition-colors hover:border-primary"
                  >
                    {l.status === "active" ? label.pause : label.activate}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
