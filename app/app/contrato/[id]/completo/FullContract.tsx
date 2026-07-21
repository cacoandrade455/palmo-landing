"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer, Scale } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { getContract, type ContractData } from "../actions";

/**
 * Read-only view of the CURRENT version of the contract, rendered as one
 * continuous document. No editing, commenting, proposing or approving here —
 * the negotiation lives in the contract room. The text comes from the very
 * same source the room reads (contract_versions.blocks of current_version),
 * so the document can never diverge from what was negotiated.
 */

/** Unresolved {{PLACEHOLDERS}} stay visible — this is still a draft. */
function ClauseBody({ body }: { body: string }) {
  const parts = body.split(/(\{\{\w+\}\})/g);
  return (
    <p className="mt-2 text-sm leading-relaxed text-deep/70 print:text-deep">
      {parts.map((p, i) =>
        /^\{\{\w+\}\}$/.test(p) ? (
          <span
            key={i}
            className="mx-0.5 inline-block rounded-full bg-accent/20 px-2 py-0.5 text-xs font-bold text-deep print:bg-white print:px-0"
          >
            {p}
          </span>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </p>
  );
}

export function FullContract({ id }: { id: string }) {
  const { lang } = useLanguage();
  const router = useRouter();
  const [data, setData] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);

  const label =
    lang === "en"
      ? {
          back: "Back to the contract room",
          print: "Print",
          legalBanner: "Draft subject to legal review.",
          docTitle: "Full contract",
          typeArrendamento: "Rural lease",
          typeParceria: "Rural partnership",
          owner: "Owner",
          producer: "Producer",
          hectares: "ha",
          version: (v: number) => `Draft version v${v}`,
          notFound: "Contract not found or you don't have access.",
        }
      : {
          back: "Voltar à sala",
          print: "Imprimir",
          legalBanner: "Minuta sujeita a revisão jurídica.",
          docTitle: "Contrato completo",
          typeArrendamento: "Arrendamento rural",
          typeParceria: "Parceria rural",
          owner: "Proprietário(a)",
          producer: "Produtor(a)",
          hectares: "ha",
          version: (v: number) => `Versão da minuta v${v}`,
          notFound: "Contrato não encontrado ou sem acesso.",
        };

  useEffect(() => {
    let alive = true;
    getContract(id).then((res) => {
      if (!alive) return;
      if (res.ok) setData(res.data);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) return <p className="py-10 text-center text-deep/40">…</p>;
  if (!data)
    return <p className="py-10 text-center text-deep/50">{label.notFound}</p>;

  const typeLabel =
    data.type === "arrendamento"
      ? label.typeArrendamento
      : label.typeParceria;

  return (
    <div className="space-y-4">
      {/* Print rules: only the document reaches the paper. */}
      <style>{`
        @page { margin: 18mm; }
        @media print {
          html, body { background: white !important; }
        }
      `}</style>

      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <button
          onClick={() => router.push(`/app/contrato/${id}`)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-deep/60 hover:text-deep"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {label.back}
        </button>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-bold text-deep shadow-sm transition-colors hover:bg-accent-dark"
        >
          <Printer className="h-4 w-4" aria-hidden="true" />
          {label.print}
        </button>
      </div>

      {/* the document itself */}
      <article className="rounded-2xl border border-deep/10 bg-white p-6 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <p className="flex items-center gap-2 rounded-xl bg-accent/20 px-4 py-2.5 text-sm font-semibold text-deep print:rounded-none print:bg-white print:px-0">
          <Scale className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          {label.legalBanner}
        </p>

        <header className="mt-4 border-b border-deep/10 pb-4">
          <p className="text-sm font-bold uppercase tracking-wide text-primary">
            {typeLabel}
          </p>
          <h1 className="mt-1 text-xl font-extrabold tracking-tight text-deep">
            {data.listing.title}
          </h1>
          <p className="mt-1 text-sm text-deep/60 print:text-deep">
            {data.listing.municipality}, {data.listing.state} ·{" "}
            {data.listing.hectares.toLocaleString(
              lang === "en" ? "en-US" : "pt-BR",
            )}{" "}
            {label.hectares}
          </p>
          <div className="mt-3 space-y-1 text-sm text-deep/70 print:text-deep">
            <p>
              <span className="font-bold text-deep">{label.owner}:</span>{" "}
              {data.ownerName ?? "—"}
            </p>
            <p>
              <span className="font-bold text-deep">{label.producer}:</span>{" "}
              {data.developerName ?? "—"}
            </p>
            <p className="text-deep/50 print:text-deep">
              {label.version(data.current_version)}
            </p>
          </div>
        </header>

        <div className="mt-4 space-y-4">
          {data.blocks.map((b, i) => (
            <section key={b.key} className="break-inside-avoid">
              <h2 className="font-extrabold text-deep">
                {i + 1}. {b.title}
              </h2>
              <ClauseBody body={b.body} />
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}
