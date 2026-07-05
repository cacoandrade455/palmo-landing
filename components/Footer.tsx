"use client";

import Image from "next/image";
import { MessageCircle } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { whatsappLink, siteConfig } from "@/lib/site-config";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-deep py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/palmo-logo-reverse.svg"
            alt="Palmo"
            width={89}
            height={40}
            className="h-8 w-auto"
          />
          <span className="hidden text-sm text-white/60 sm:inline">
            {t.footer.tagline}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-deep transition-opacity hover:opacity-90"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            {t.footer.whatsapp}
          </a>
          <a
            href={siteConfig.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-white/70 transition-colors hover:text-white"
          >
            {t.footer.instagram}
          </a>
        </div>
      </div>

      <div className="mx-auto mt-6 flex max-w-6xl flex-col gap-2 border-t border-white/10 px-6 pt-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
        <p>{t.footer.rights}</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-white/80">
            {t.footer.terms}
          </a>
          <a href="#" className="hover:text-white/80">
            {t.footer.privacy}
          </a>
        </div>
      </div>
    </footer>
  );
}
