"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Scale } from "lucide-react";
import { useLanguage, type AppLang } from "@/lib/language-context";
import { LEGAL_VERSION } from "@/lib/legal";
import { acceptCoreDocs } from "@/app/app/legal-actions";

/**
 * Tela de aceite exibida no PRIMEIRO ACESSO ao app (e sempre que a versão
 * vigente dos documentos mudar). Sem marcar a caixa, não conclui: o botão
 * fica desabilitado e o app não é renderizado atrás dela.
 *
 * Como o cadastro é feito por OAuth do Google (não há formulário de
 * cadastro), este é o ponto do fluxo em que o aceite pode ser exigido.
 * Strings inline (regra 5); zh/fr/ar reaproveitam o EN — TODO(i18n) no PR.
 */
type Copy = {
  eyebrow: string;
  title: string;
  body: string;
  checkbox: string;
  terms: string;
  privacy: string;
  and: string;
  submit: string;
  sending: string;
  error: string;
  version: (v: string) => string;
};

const PT: Copy = {
  eyebrow: "Antes de continuar",
  title: "Aceite os documentos da plataforma",
  body: "Para anunciar, conversar e negociar na Palmo, você precisa aceitar os Termos de Uso e a Política de Privacidade. Vale a pena ler a regra do chat: o contato entre as partes só é liberado no fechamento do negócio.",
  checkbox: "Li e aceito os",
  terms: "Termos de Uso",
  privacy: "Política de Privacidade",
  and: "e a",
  submit: "Aceitar e continuar",
  sending: "Registrando…",
  error: "Não foi possível registrar o aceite. Tente novamente.",
  version: (v) => `Versão ${v} dos documentos`,
};

const EN: Copy = {
  eyebrow: "Before you continue",
  title: "Accept the platform documents",
  body: "To list, chat and negotiate on Palmo, you need to accept the Terms of Use and the Privacy Policy. The chat rule is worth reading: contact between the parties is only released when the deal closes.",
  checkbox: "I have read and accept the",
  terms: "Terms of Use",
  privacy: "Privacy Policy",
  and: "and the",
  submit: "Accept and continue",
  sending: "Recording…",
  error: "We couldn't record your acceptance. Please try again.",
  version: (v) => `Version ${v} of the documents`,
};

const COPY: Record<AppLang, Copy> = { pt: PT, en: EN, zh: EN, fr: EN, ar: EN };

export function LegalGate() {
  const { lang } = useLanguage();
  const c = COPY[lang];
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function submit() {
    if (!checked) return;
    setError(false);
    setBusy(true);
    const res = await acceptCoreDocs();
    setBusy(false);
    if (res.ok) router.refresh();
    else setError(true);
  }

  return (
    <main className="bg-neutral/40 py-12">
      <div className="mx-auto max-w-2xl px-6">
        <p className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm text-deep/70 shadow-sm">
          <Scale className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          {c.version(LEGAL_VERSION)}
        </p>

        <div className="mt-4 rounded-2xl border border-deep/10 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-bold uppercase tracking-wide text-primary">
            {c.eyebrow}
          </p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-deep sm:text-3xl">
            {c.title}
          </h1>
          <p className="mt-3 leading-relaxed text-deep/70">{c.body}</p>

          <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl bg-neutral p-4">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-primary)]"
            />
            <span className="text-sm leading-relaxed text-deep">
              {c.checkbox}{" "}
              <Link
                href="/termos"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-primary underline transition-colors hover:text-primary-dark"
              >
                {c.terms}
              </Link>{" "}
              {c.and}{" "}
              <Link
                href="/privacidade"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-primary underline transition-colors hover:text-primary-dark"
              >
                {c.privacy}
              </Link>
              .
            </span>
          </label>

          {error && (
            <p className="mt-4 text-sm font-semibold text-red-600">{c.error}</p>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={!checked || busy}
            className="mt-6 w-full rounded-full bg-primary px-6 py-3.5 text-base font-bold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? c.sending : c.submit}
          </button>
        </div>
      </div>
    </main>
  );
}
