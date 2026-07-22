"use client";

import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import { useLanguage, type AppLang } from "@/lib/language-context";

/**
 * Entry-point card to the land-use recommender — the step BEFORE the
 * calculator for owners who don't yet know what to plant. Dropped on the public
 * home and near the top of /quanto-vale. Inline strings (rule 5); the extra
 * languages reuse the EN variant, like the calculator's own wrapper copy.
 */
type Copy = { title: string; sub: string };

const COPY: Record<AppLang, Copy> = {
  pt: {
    title: "Descubra o melhor uso da sua terra",
    sub: "Não sabe o que plantar? Veja as vocações que a sua região comprovadamente faz — grátis.",
  },
  en: {
    title: "Discover the best use for your land",
    sub: "Not sure what to plant? See the vocations your region provably does — free.",
  },
  zh: {
    title: "Discover the best use for your land",
    sub: "Not sure what to plant? See the vocations your region provably does — free.",
  },
  fr: {
    title: "Discover the best use for your land",
    sub: "Not sure what to plant? See the vocations your region provably does — free.",
  },
  ar: {
    title: "Discover the best use for your land",
    sub: "Not sure what to plant? See the vocations your region provably does — free.",
  },
};

export function RecommenderLink({ className = "" }: { className?: string }) {
  const { lang } = useLanguage();
  const copy = COPY[lang];

  return (
    <Link
      href="/quanto-vale?descobrir=1"
      className={`group flex items-center gap-4 rounded-2xl border-2 border-primary/30 bg-primary/5 px-5 py-4 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary/10 hover:shadow-md ${className}`}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Compass className="h-5 w-5 text-primary" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-extrabold leading-snug text-deep sm:text-lg">
          {copy.title}
        </span>
        <span className="mt-0.5 block text-sm leading-snug text-deep/60">
          {copy.sub}
        </span>
      </span>
      <ArrowRight
        className="h-5 w-5 shrink-0 text-primary transition-transform group-hover:translate-x-1"
        aria-hidden="true"
      />
    </Link>
  );
}
