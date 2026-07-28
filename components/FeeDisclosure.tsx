"use client";

import { useEffect, useState } from "react";
import { Receipt } from "lucide-react";
import { useLanguage, type AppLang } from "@/lib/language-context";
import { getFeeDisclosure, type FeeDisclosure as Data } from "@/app/app/legal-actions";

/**
 * Linha discreta de transparência da taxa na Sala do Contrato, visível às
 * DUAS partes: "Contrato R$ X · taxa Palmo R$ Y, paga pelo proprietário".
 *
 * Só exibição — nenhum número do contrato ou da calculadora é alterado, e a
 * taxa não é descontada de nada.
 */
type Copy = {
  contract: string;
  fee: string;
  paidBy: string;
  perYear: string;
  pending: string;
};

const PT: Copy = {
  contract: "Contrato",
  fee: "taxa Palmo",
  paidBy: "paga pelo proprietário",
  perYear: "/ano",
  pending: "o total será calculado quando o prazo estiver definido",
};

const EN: Copy = {
  contract: "Contract",
  fee: "Palmo fee",
  paidBy: "paid by the landowner",
  perYear: "/yr",
  pending: "the total will be calculated once the term is set",
};

const COPY: Record<AppLang, Copy> = { pt: PT, en: EN, zh: EN, fr: EN, ar: EN };

const brl = (n: number) =>
  n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

export function FeeDisclosure({ conversationId }: { conversationId: string }) {
  const { lang } = useLanguage();
  const c = COPY[lang];
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    let alive = true;
    getFeeDisclosure(conversationId).then((d) => {
      if (alive) setData(d);
    });
    return () => {
      alive = false;
    };
  }, [conversationId]);

  if (!data || !data.available) return null;

  const showTotal = data.total != null;

  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl bg-white px-4 py-2.5 text-sm text-deep/70">
      <Receipt className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <span>
        <strong className="font-bold text-deep">{c.contract}</strong>{" "}
        {showTotal ? (
          brl(data.total!)
        ) : (
          <>
            {brl(data.annual)}
            <span className="text-deep/50">{c.perYear}</span>
          </>
        )}
      </span>
      <span aria-hidden="true" className="text-deep/30">·</span>
      <span>
        <strong className="font-bold text-deep">{c.fee}</strong>{" "}
        {showTotal ? (
          brl(data.feeTotal!)
        ) : (
          <>
            {brl(data.feeAnnual)}
            <span className="text-deep/50">{c.perYear}</span>
          </>
        )}
        , {c.paidBy}
        {showTotal ? "" : ` — ${c.pending}`}
      </span>
    </p>
  );
}
