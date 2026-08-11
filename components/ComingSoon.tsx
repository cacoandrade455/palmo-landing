"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/lib/language-context";

export function ComingSoon() {
  const { lang } = useLanguage();
  const t =
    lang === "en"
      ? {
          badge: "Coming soon",
          title: "The Palmo platform is almost here",
          body: "Listings, verified profiles and secure deal-making. All in one place. Meanwhile, find out what your land is worth.",
          cta: "How much is my land worth?",
          back: "Back to home",
        }
      : {
          badge: "Em breve",
          title: "A plataforma Palmo está chegando",
          body: "Anúncios, perfis verificados e negociação segura. Tudo em um só lugar. Enquanto isso, descubra quanto vale a sua terra.",
          cta: "Quanto vale minha terra?",
          back: "Voltar ao início",
        };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-deep px-6 text-center">
      <Image
        src="/palmo-logo-reverse.svg"
        alt="Palmo"
        width={140}
        height={63}
        className="h-14 w-auto"
        priority
      />
      <span className="mt-8 inline-block rounded-full bg-accent px-4 py-1 text-sm font-bold text-deep">
        {t.badge}
      </span>
      <h1 className="mt-5 max-w-lg text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
        {t.title}
      </h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-white/70">
        {t.body}
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/quanto-vale"
          className="rounded-full bg-primary px-6 py-3 text-base font-bold text-white transition-colors hover:bg-primary-dark"
        >
          {t.cta}
        </Link>
        <Link
          href="/"
          className="rounded-full border border-white/20 px-6 py-3 text-base font-bold text-white/80 transition-colors hover:border-white/40 hover:text-white"
        >
          {t.back}
        </Link>
      </div>
    </main>
  );
}
