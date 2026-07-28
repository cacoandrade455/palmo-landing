// Módulo NEUTRO (sem "use client"): o que o servidor precisa saber sobre
// idiomas — o cookie e o type guard — sem puxar o provider client junto.
// `app/layout.tsx` lê o cookie aqui; `lib/language-context.tsx` reusa tudo.

import type { Lang } from "./content";
import type { ExtraLang } from "./content-extra";

export type AppLang = Lang | ExtraLang;

export const LANG_COOKIE = "palmo-lang";

const CODES: readonly AppLang[] = ["pt", "en", "zh", "fr", "ar"];

export function isAppLang(value: string | null | undefined): value is AppLang {
  return CODES.includes(value as AppLang);
}
