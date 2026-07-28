"use client";

import Image from "next/image";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { whatsappLink } from "@/lib/site-config";

export function Footer() {
  const { t, lang } = useLanguage();
  // Rótulo inline (regra 5); zh/fr/ar replicam EN — TODO(i18n) no PR.
  const calcLabel =
    lang === "pt" ? "Quanto vale minha terra?" : "How much is my land worth?";

  return (
    <footer className="bg-deep py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Image
            src="/palmo-logo-reverse.svg"
            alt="Palmo"
            width={89}
            height={40}
            className="h-8 w-auto"
          />
          {/* C8c: o slogan oficial mora junto ao logo, visível também no mobile. */}
          <span className="text-sm text-white/60">{t.footer.tagline}</span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* /quanto-vale segue existindo como montagem standalone — o link
              publicado continua vivo aqui no rodapé. */}
          <Link
            href="/quanto-vale"
            className="text-sm font-semibold text-white/70 transition-colors hover:text-white"
          >
            {calcLabel}
          </Link>
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-deep transition-opacity hover:opacity-90"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            {t.footer.whatsapp}
          </a>
        </div>
      </div>

      <div className="mx-auto mt-6 flex max-w-6xl flex-col gap-2 border-t border-white/10 px-6 pt-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
        <p>{t.footer.rights}</p>
        <div className="flex gap-4">
          <Link href="/termos" className="hover:text-white/80">
            {t.footer.terms}
          </Link>
          <Link href="/privacidade" className="hover:text-white/80">
            {t.footer.privacy}
          </Link>
        </div>
      </div>
    </footer>
  );
}
