"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { APP_LANGS, useLanguage, type AppLang } from "@/lib/language-context";
import { getUnreadCount } from "@/app/app/mensagens/actions";
import { AuthButton, useSupabaseUser } from "./AuthButton";

/**
 * Seletor compacto de 5 idiomas (PT · EN · 中文 · FR · AR).
 * No menu mobile vira um <select> em forma de pill; a partir de lg é o grupo
 * segmentado na barra.
 */
function LangSelect({ variant = "desktop" }: { variant?: "desktop" | "menu" }) {
  const { lang, setLang } = useLanguage();

  if (variant === "menu") {
    return (
      <label className="block">
        <span className="sr-only">Idioma / Language</span>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as AppLang)}
          className="w-full rounded-full border border-deep/20 bg-white px-3 py-2 text-sm font-bold text-deep"
        >
          {APP_LANGS.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label} · {l.name}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <div
      className="hidden items-center rounded-full border border-deep/10 bg-white p-0.5 text-xs font-semibold lg:inline-flex"
      role="group"
      aria-label="Idioma / Language"
    >
      {APP_LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLang(l.code)}
          aria-pressed={lang === l.code}
          title={l.name}
          className={`rounded-full px-2 py-1 transition-colors ${
            lang === l.code
              ? "bg-primary text-white"
              : "text-deep/60 hover:text-deep"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Rótulos da navegação (regra 5: strings novas ficam inline no componente).
 * PT/EN escritos; zh/fr/ar reaproveitam o EN — TODO(i18n) listado no PR.
 */
type NavCopy = {
  home: string;
  marketplace: string;
  messages: string;
  openMenu: string;
  closeMenu: string;
};

const NAV_PT: NavCopy = {
  home: "Início",
  marketplace: "Marketplace",
  messages: "Mensagens",
  openMenu: "Abrir menu",
  closeMenu: "Fechar menu",
};

const NAV_EN: NavCopy = {
  home: "Home",
  marketplace: "Marketplace",
  messages: "Messages",
  openMenu: "Open menu",
  closeMenu: "Close menu",
};

const NAV: Record<AppLang, NavCopy> = {
  pt: NAV_PT,
  en: NAV_EN,
  zh: NAV_EN,
  fr: NAV_EN,
  ar: NAV_EN,
};

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-4 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
      {count}
    </span>
  );
}

/**
 * Header GLOBAL — o mesmo em toda a superfície (landing, /explorar, /terra e
 * o app). Deslogado: Início | Marketplace | Anunciar | idioma | Entrar.
 * Logado: os mesmos + Mensagens (com contador) e Minha conta (avatar).
 * A calculadora não tem item de navegação: ela É o Início.
 */
export function Header() {
  const { t, lang } = useLanguage();
  const pathname = usePathname();
  const { user } = useSupabaseUser();
  const nav = NAV[lang];

  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  // Fecha o menu mobile a cada navegação (deferido: padrão do projeto para
  // react-hooks/set-state-in-effect).
  useEffect(() => {
    queueMicrotask(() => setOpen(false));
  }, [pathname]);

  // Contador de mensagens não lidas — só quando logado (mesmo padrão de
  // polling leve do antigo AppNav).
  useEffect(() => {
    if (!user) {
      queueMicrotask(() => setUnread(0));
      return;
    }
    let alive = true;
    const refresh = () =>
      getUnreadCount().then((n) => {
        if (alive) setUnread(n);
      });
    refresh();
    const onChanged = () => refresh();
    window.addEventListener("palmo:unread-changed", onChanged);
    const interval = setInterval(refresh, 30000);
    return () => {
      alive = false;
      window.removeEventListener("palmo:unread-changed", onChanged);
      clearInterval(interval);
    };
  }, [user, pathname]);

  const linkCls = (href: string, exact = true) =>
    `relative transition-colors hover:text-deep ${
      (exact ? pathname === href : pathname?.startsWith(href))
        ? "text-deep"
        : "text-deep/70"
    }`;

  const menuLinkCls =
    "block rounded-xl px-4 py-3 text-base font-semibold text-deep transition-colors hover:bg-primary/10";

  return (
    <header className="sticky top-0 z-50 border-b border-deep/5 bg-white/90 backdrop-blur-sm">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4">
        <Link href="/" className="flex shrink-0 items-center" aria-label="Palmo">
          <Image
            src="/palmo-logo.svg"
            alt="Palmo"
            width={114}
            height={40}
            className="h-8 w-auto"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-semibold lg:flex">
          <Link href="/" className={linkCls("/")}>
            {nav.home}
          </Link>
          <Link href="/explorar" className={linkCls("/explorar")}>
            {nav.marketplace}
          </Link>
          {user && (
            <Link href="/app/mensagens" className={linkCls("/app/mensagens", false)}>
              {nav.messages}
              <UnreadBadge count={unread} />
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/app/anunciar"
            className="whitespace-nowrap rounded-full bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark"
          >
            {t.header.cta}
          </Link>
          <LangSelect />
          <span className="hidden lg:block">
            <AuthButton />
          </span>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? nav.closeMenu : nav.openMenu}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-deep/15 bg-white text-deep transition-colors hover:border-primary lg:hidden"
          >
            {open ? (
              <X className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Menu className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Menu mobile: painel sobreposto (absolute) — abrir/fechar não empurra
            o conteúdo da página, sem pulos de layout. */}
        {open && (
          <div className="absolute inset-x-0 top-full border-b border-deep/10 bg-white shadow-xl lg:hidden">
            <nav className="mx-auto max-w-6xl space-y-1 px-4 py-4">
              <Link href="/" className={menuLinkCls}>
                {nav.home}
              </Link>
              <Link href="/explorar" className={menuLinkCls}>
                {nav.marketplace}
              </Link>
              {user && (
                <Link href="/app/mensagens" className={menuLinkCls}>
                  <span className="relative">
                    {nav.messages}
                    <UnreadBadge count={unread} />
                  </span>
                </Link>
              )}
              <div className="flex items-center justify-between gap-3 border-t border-deep/10 px-4 pb-1 pt-4">
                <AuthButton />
                <LangSelect variant="menu" />
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
