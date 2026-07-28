"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Receipt } from "lucide-react";
import { useLanguage, type AppLang } from "@/lib/language-context";
import { getFeeTerm, acceptFeeTerm, type FeeTerm as FeeTermData } from "@/app/app/legal-actions";

/**
 * Termo da taxa de sucesso, exibido ao PROPRIETÁRIO — a parte pagante —
 * quando o negócio é fechado (a mesma hora em que a Sala do Contrato é
 * liberada). Para o produtor e para negócios não fechados, `applies: false`
 * e o componente não renderiza nada.
 *
 * IMPORTANTE: este termo é uma etapa de REGISTRO. Ele não condiciona o
 * fechamento nem a liberação dos contatos, que já aconteceram antes e seguem
 * exatamente como estavam — falhar aqui não trava nada.
 */
type Copy = {
  eyebrow: string;
  title: string;
  intro: string;
  totalLabel: string;
  totalUnknown: string;
  annualLabel: string;
  feeTotalLabel: string;
  feeAnnualLabel: string;
  schedule: string;
  scheduleUnknown: string;
  nonCircumvention: string;
  termsLink: string;
  checkbox: string;
  submit: string;
  sending: string;
  accepted: string;
  error: string;
  unavailable: string;
  perYear: string;
  years: (n: number) => string;
};

const PT: Copy = {
  eyebrow: "Termo da taxa de sucesso",
  title: "Negócio fechado: a taxa da Palmo",
  intro:
    "A Palmo foi gratuita até aqui. Com o negócio fechado, é devida a taxa de sucesso, paga por você, proprietário da terra. Ela é um percentual do valor do contrato — não um acréscimo ao que foi combinado com o produtor.",
  totalLabel: "Valor total estimado do contrato",
  totalUnknown: "Depende do prazo que vocês acordarem",
  annualLabel: "Valor anual do contrato",
  feeTotalLabel: "Taxa de 5% sobre o total",
  feeAnnualLabel: "5% de cada pagamento anual",
  schedule:
    "A taxa não é cobrada de uma vez: ela vence proporcionalmente, junto com cada pagamento anual do contrato, no ritmo em que o contrato paga você.",
  scheduleUnknown:
    "A taxa vence proporcionalmente, junto com cada pagamento anual do contrato. O total será calculado quando o prazo estiver definido.",
  nonCircumvention:
    "Lembrete da cláusula 3.3 dos Termos: fechar por fora da plataforma um negócio sobre esta mesma terra, nos 12 meses seguintes à última interação, sujeita à multa da cláusula 3.4.",
  termsLink: "Ler a cláusula nos Termos",
  checkbox: "Li e aceito a cobrança da taxa de sucesso nas condições acima.",
  submit: "Aceitar o termo",
  sending: "Registrando…",
  accepted: "Termo aceito e registrado.",
  error: "Não foi possível registrar o aceite agora. Isso não afeta o seu negócio — tente de novo mais tarde.",
  unavailable: "O registro do aceite ainda não está disponível nesta instalação.",
  perYear: "/ano",
  years: (n) => `${n} anos`,
};

const EN: Copy = {
  eyebrow: "Success fee acceptance",
  title: "Deal closed: the Palmo fee",
  intro:
    "Palmo has been free until now. With the deal closed, the success fee is due, paid by you, the landowner. It is a percentage of the contract value — not an addition to what you agreed with the producer.",
  totalLabel: "Estimated total contract value",
  totalUnknown: "Depends on the term you agree on",
  annualLabel: "Annual contract value",
  feeTotalLabel: "5% fee on the total",
  feeAnnualLabel: "5% of each annual payment",
  schedule:
    "The fee is not charged all at once: it falls due proportionally, together with each annual payment of the contract, as the contract pays you.",
  scheduleUnknown:
    "The fee falls due proportionally, together with each annual payment of the contract. The total will be calculated once the term is set.",
  nonCircumvention:
    "Reminder of clause 3.3 of the Terms: closing a deal on this same land outside the platform, within 12 months of the last interaction, triggers the penalty in clause 3.4.",
  termsLink: "Read the clause in the Terms",
  checkbox: "I have read and accept the success fee under the conditions above.",
  submit: "Accept the terms",
  sending: "Recording…",
  accepted: "Acceptance recorded.",
  error: "We couldn't record your acceptance right now. This does not affect your deal — please try again later.",
  unavailable: "Acceptance recording is not available in this installation yet.",
  perYear: "/yr",
  years: (n) => `${n} years`,
};

const COPY: Record<AppLang, Copy> = { pt: PT, en: EN, zh: EN, fr: EN, ar: EN };

const brl = (n: number) =>
  n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

export function FeeTerm({ conversationId }: { conversationId: string }) {
  const { lang } = useLanguage();
  const c = COPY[lang];
  const [data, setData] = useState<FeeTermData | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let alive = true;
    getFeeTerm(conversationId).then((d) => {
      if (alive) setData(d);
    });
    return () => {
      alive = false;
    };
  }, [conversationId]);

  if (!data || !data.applies) return null;

  async function accept() {
    if (!checked) return;
    setError(false);
    setBusy(true);
    const res = await acceptFeeTerm(conversationId);
    setBusy(false);
    if (res.ok) setData((d) => (d ? { ...d, accepted: true } : d));
    else setError(true);
  }

  return (
    <div className="mt-4 rounded-2xl border-2 border-accent bg-accent/10 p-5">
      <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-deep/60">
        <Receipt className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        {c.eyebrow}
      </p>
      <h3 className="mt-1 text-lg font-extrabold text-deep">{c.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-deep/70">{c.intro}</p>

      <dl className="mt-4 space-y-2">
        <div className="flex items-baseline justify-between gap-3 rounded-xl bg-white px-4 py-2.5">
          <dt className="text-sm text-deep/60">{c.annualLabel}</dt>
          <dd className="text-sm font-bold text-deep">
            {brl(data.annual)}
            <span className="font-normal text-deep/50">{c.perYear}</span>
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 rounded-xl bg-white px-4 py-2.5">
          <dt className="text-sm text-deep/60">
            {c.totalLabel}
            {data.termYears ? ` · ${c.years(data.termYears)}` : ""}
          </dt>
          <dd className="text-sm font-bold text-deep">
            {data.total == null ? c.totalUnknown : brl(data.total)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 rounded-xl bg-primary/10 px-4 py-2.5">
          <dt className="text-sm font-semibold text-deep">
            {data.feeTotal == null ? c.feeAnnualLabel : c.feeTotalLabel}
          </dt>
          <dd className="text-base font-extrabold text-primary">
            {brl(data.feeTotal ?? data.feeAnnual)}
          </dd>
        </div>
      </dl>

      <p className="mt-3 text-sm leading-relaxed text-deep/70">
        {data.total == null ? c.scheduleUnknown : c.schedule}
      </p>
      {data.feeTotal != null && (
        <p className="mt-1 text-sm text-deep/60">
          {c.feeAnnualLabel}: <strong className="font-bold text-deep">{brl(data.feeAnnual)}</strong>
        </p>
      )}

      <p className="mt-3 rounded-xl bg-white px-4 py-2.5 text-sm leading-relaxed text-deep/70">
        {c.nonCircumvention}{" "}
        <Link
          href="/termos#conduta"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-primary underline transition-colors hover:text-primary-dark"
        >
          {c.termsLink}
        </Link>
      </p>

      {data.accepted ? (
        <p className="mt-4 flex items-center gap-2 text-sm font-bold text-primary">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          {c.accepted}
        </p>
      ) : !data.recordable ? (
        <p className="mt-4 text-sm font-semibold text-deep/60">{c.unavailable}</p>
      ) : (
        <>
          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl bg-white p-4">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-primary)]"
            />
            <span className="text-sm leading-relaxed text-deep">{c.checkbox}</span>
          </label>
          {error && (
            <p className="mt-3 text-sm font-semibold text-deep/70">{c.error}</p>
          )}
          <button
            type="button"
            onClick={accept}
            disabled={!checked || busy}
            className="mt-4 w-full rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? c.sending : c.submit}
          </button>
        </>
      )}
    </div>
  );
}
