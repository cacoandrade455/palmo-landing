"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/language-context";
import { AuthButton } from "./AuthButton";
import { AppNav } from "./AppNav";
import { LangToggle } from "./LangToggle";

export function Header() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const inApp = pathname?.startsWith("/app");

  return (
    <header className="sticky top-0 z-50 border-b border-deep/5 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href={inApp ? "/app" : "/"} className="flex items-center" aria-label="Palmo">
          <Image
            src="/palmo-logo.svg"
            alt="Palmo"
            width={114}
            height={40}
            className="h-8 w-auto"
            priority
          />
        </Link>

        {inApp ? (
          <AppNav />
        ) : (
          <nav className="hidden items-center gap-8 text-sm font-semibold text-deep/70 md:flex">
            <Link href="/#como-funciona" className="transition-colors hover:text-deep">
              {t.header.navHow}
            </Link>
            <Link href="/#confianca" className="transition-colors hover:text-deep">
              {t.header.navTrust}
            </Link>
            <Link href="/#precos" className="transition-colors hover:text-deep">
              {t.header.navPricing}
            </Link>
            <Link href="/quanto-vale" className="font-bold text-primary transition-colors hover:text-primary-dark">
              {t.appraiser.navLabel}
            </Link>
          </nav>
        )}

        <div className="flex items-center gap-3">
          <LangToggle />
          <AuthButton />
          {!inApp && (
            <Link
              href="/#lista-de-espera"
              className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark"
            >
              {t.header.cta}
            </Link>
          )}
          {inApp && (
            <Link
              href="/app/anunciar"
              className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark"
            >
              {t.header.cta}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
