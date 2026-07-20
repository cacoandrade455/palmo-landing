// Tradução gerada por IA — sujeita a revisão nativa. Data: 2026-07-20.
// Barrel dos idiomas adicionais (中文 / français / العربية).
// Cada dicionário é tipado como `typeof content.pt`, então o compilador
// garante a completude das traduções sem tocar em `lib/content.ts`.

import { contentZh } from "./content-zh";
import { contentFr } from "./content-fr";
import { contentAr } from "./content-ar";

export const contentExtra = {
  zh: contentZh,
  fr: contentFr,
  ar: contentAr,
} as const;

export type ExtraLang = keyof typeof contentExtra;
