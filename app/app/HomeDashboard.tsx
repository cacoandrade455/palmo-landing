"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { MapPin, MessageCircle, Search, Sprout } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { getSupabase } from "@/lib/supabase";
import { getHomeSummary, type HomeSummary } from "./actions";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-primary/10 text-primary",
  draft: "bg-deep/10 text-deep/60",
  paused: "bg-accent/25 text-deep",
  closed: "bg-deep/10 text-deep/60",
  archived: "bg-deep/10 text-deep/40",
};

export function HomeDashboard() {
  const { lang } = useLanguage();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [summary, setSummary] = useState<HomeSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const label =
    lang === "en"
      ? {
          greeting: (name: string) => `Hello, ${name}!`,
          greetingFallback: "Hello!",
          subtitle: "Here's what's happening with your land and conversations.",
          ctaList: "List my land",
          ctaListHint: "Free listing, verified before going live.",
          ctaExplore: "Explore land",
          ctaExploreHint: "Find land ready for your next crop.",
          myListings: "My listings",
          seeAll: "See all",
          listingsEmpty: "You haven't listed any land yet.",
          listingsEmptyCta: "Create my first listing",
          hectares: "ha",
          statusLabels: {
            active: "Active",
            draft: "Draft",
            paused: "Paused",
            closed: "Closed",
            archived: "Archived",
          } as Record<string, string>,
          messages: "Messages",
          conversations: (n: number) =>
            n === 1 ? "1 conversation" : `${n} conversations`,
          unread: (n: number) => (n === 1 ? "1 unread" : `${n} unread`),
          allRead: "All caught up.",
          openInbox: "Open inbox",
          messagesEmpty: "No conversations yet.",
          messagesEmptyHint: "Explore listings and message an owner to start one.",
          welcomeTitle: "Welcome to Palmo",
          welcomeText:
            "Connect idle land to growers who want to expand. Sign in to list your land, explore listings and talk to the other side.",
          signIn: "Sign in with Google",
        }
      : {
          greeting: (name: string) => `Olá, ${name}!`,
          greetingFallback: "Olá!",
          subtitle: "Veja como estão suas terras e suas conversas.",
          ctaList: "Anunciar minha terra",
          ctaListHint: "Anúncio gratuito, verificado antes de ir ao ar.",
          ctaExplore: "Explorar terras",
          ctaExploreHint: "Encontre terra pronta para a sua próxima lavoura.",
          myListings: "Meus anúncios",
          seeAll: "Ver todos",
          listingsEmpty: "Você ainda não anunciou nenhuma terra.",
          listingsEmptyCta: "Criar meu primeiro anúncio",
          hectares: "ha",
          statusLabels: {
            active: "Ativo",
            draft: "Rascunho",
            paused: "Pausado",
            closed: "Fechado",
            archived: "Arquivado",
          } as Record<string, string>,
          messages: "Mensagens",
          conversations: (n: number) =>
            n === 1 ? "1 conversa" : `${n} conversas`,
          unread: (n: number) =>
            n === 1 ? "1 não lida" : `${n} não lidas`,
          allRead: "Tudo em dia.",
          openInbox: "Abrir mensagens",
          messagesEmpty: "Nenhuma conversa ainda.",
          messagesEmptyHint:
            "Explore os anúncios e mande mensagem para um dono para começar.",
          welcomeTitle: "Bem-vindo à Palmo",
          welcomeText:
            "Conectamos terra parada a produtores que querem expandir. Entre para anunciar sua terra, explorar anúncios e conversar com o outro lado.",
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
    getHomeSummary().then((res) => {
      if (res.ok) setSummary(res.summary);
      setLoading(false);
    });
  }, [user]);

  if (user === undefined || (user && loading)) {
    return (
      <div className="rounded-2xl border border-deep/10 bg-white p-8 text-center text-deep/50 shadow-sm">
        …
      </div>
    );
  }

  if (user === null) {
    return (
      <div className="rounded-2xl border border-deep/10 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-extrabold tracking-tight text-deep">
          {label.welcomeTitle}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-deep/70">{label.welcomeText}</p>
        <button
          onClick={() => {
            const supabase = getSupabase();
            supabase?.auth.signInWithOAuth({
              provider: "google",
              options: { redirectTo: `${window.location.origin}/app` },
            });
          }}
          className="mt-6 rounded-full bg-primary px-6 py-3.5 text-base font-bold text-white shadow-sm transition-colors hover:bg-primary-dark"
        >
          {label.signIn}
        </button>
      </div>
    );
  }

  const fullName =
    (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "";
  const firstName = fullName.split(/[\s@]/)[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-deep">
          {firstName ? label.greeting(firstName) : label.greetingFallback}
        </h1>
        <p className="mt-1 text-deep/70">{label.subtitle}</p>
      </div>

      {/* Big CTAs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/app/anunciar"
          className="rounded-2xl bg-primary p-6 text-white shadow-sm transition-colors hover:bg-primary-dark"
        >
          <Sprout className="h-5 w-5" aria-hidden="true" />
          <p className="mt-3 text-lg font-extrabold">{label.ctaList}</p>
          <p className="mt-1 text-sm text-white/80">{label.ctaListHint}</p>
        </Link>
        <Link
          href="/app/explorar"
          className="rounded-2xl bg-accent p-6 text-deep shadow-sm transition-colors hover:bg-accent-dark"
        >
          <Search className="h-5 w-5" aria-hidden="true" />
          <p className="mt-3 text-lg font-extrabold">{label.ctaExplore}</p>
          <p className="mt-1 text-sm text-deep/70">{label.ctaExploreHint}</p>
        </Link>
      </div>

      {/* My listings */}
      <div className="rounded-2xl border border-deep/10 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-deep">{label.myListings}</h2>
            {summary && summary.listingCount > 0 && (
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                {summary.listingCount}
              </span>
            )}
          </div>
          <Link
            href="/app/conta"
            className="rounded-full border border-deep/20 px-3 py-1 text-xs font-bold text-deep transition-colors hover:border-primary"
          >
            {label.seeAll}
          </Link>
        </div>

        {!summary || summary.listingCount === 0 ? (
          <div className="mt-4 rounded-xl bg-neutral/60 px-4 py-6 text-center">
            <p className="text-sm text-deep/60">{label.listingsEmpty}</p>
            <Link
              href="/app/anunciar"
              className="mt-4 inline-block rounded-full bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark"
            >
              {label.listingsEmptyCta}
            </Link>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {summary.recentListings.map((l) => (
              <li key={l.id} className="rounded-xl border border-deep/10 p-4">
                <div className="flex items-center gap-2">
                  <h3 className="min-w-0 truncate font-extrabold text-deep">
                    {l.title}
                  </h3>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
                      STATUS_STYLES[l.status] ?? "bg-deep/10 text-deep/60"
                    }`}
                  >
                    {label.statusLabels[l.status] ?? l.status}
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-1 text-sm text-deep/60">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  {l.municipality}, {l.state} · {l.hectares} {label.hectares}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Messages */}
      <div className="rounded-2xl border border-deep/10 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-deep">{label.messages}</h2>
            {summary && summary.unreadCount > 0 && (
              <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-white">
                {label.unread(summary.unreadCount)}
              </span>
            )}
          </div>
          {summary && summary.conversationCount > 0 && (
            <Link
              href="/app/mensagens"
              className="rounded-full border border-deep/20 px-3 py-1 text-xs font-bold text-deep transition-colors hover:border-primary"
            >
              {label.openInbox}
            </Link>
          )}
        </div>

        {!summary || summary.conversationCount === 0 ? (
          <div className="mt-4 rounded-xl bg-neutral/60 px-4 py-6 text-center">
            <p className="text-sm text-deep/60">{label.messagesEmpty}</p>
            <p className="mt-1 text-sm text-deep/50">{label.messagesEmptyHint}</p>
            <Link
              href="/app/explorar"
              className="mt-4 inline-block rounded-full bg-accent px-4 py-2 text-sm font-bold text-deep shadow-sm transition-colors hover:bg-accent-dark"
            >
              {label.ctaExplore}
            </Link>
          </div>
        ) : (
          <Link
            href="/app/mensagens"
            className="mt-4 flex items-center gap-3 rounded-xl border border-deep/10 p-4 transition-colors hover:border-primary"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block font-extrabold text-deep">
                {label.conversations(summary.conversationCount)}
              </span>
              <span className="block text-sm text-deep/60">
                {summary.unreadCount > 0
                  ? label.unread(summary.unreadCount)
                  : label.allRead}
              </span>
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}
