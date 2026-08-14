"use client";

import { useLanguage } from "@/lib/language-context";

/**
 * REFERÊNCIA PRODUTIVA DA REGIÃO — o rendimento médio do município.
 *
 * ── O QUE ESTE CARD AFIRMA, E O QUE ELE NÃO AFIRMA ───────────────────────────
 * Afirma: "o município X colheu, em média, Y por hectare desta cultura no ano
 * Z, segundo o IBGE". Não afirma NADA sobre este imóvel. A média municipal
 * mistura terra boa e terra ruim, irrigada e de sequeiro, quem aduba e quem
 * não aduba — e a ressalva diz isso com todas as letras, porque o público do
 * agro sabe disso melhor que nós e desconfia de quem finge que não.
 *
 * ── POR QUE NÃO TEM TOTAL, NEM RECEITA ───────────────────────────────────────
 * v1 é POR HECTARE. Multiplicar a média municipal pela área do anúncio
 * produziria uma promessa de safra com aparência de cálculo, e multiplicar
 * pela "área livre estimada" do card de camadas ambientais empilharia duas
 * estimativas uma na outra. Receita em reais exigiria preço, que é outra
 * fonte, com outra data.
 *
 * ── DISPONIBILIDADE INDEPENDENTE ─────────────────────────────────────────────
 * Este card exige cultura + dado municipal. O card de camadas ambientais exige
 * CAR. Um pode aparecer sem o outro, e é por isso que são componentes
 * separados e não abas do mesmo bloco.
 */

export type ReferenciaProdutivaData = {
  cultura: string;
  valor: number;
  unidade: "kg_ha" | "frutos_ha";
  sacaKg: number | null;
  ano: number;
  municipio: string;
  escopo: "soma_de_tipos" | "fruto_nao_derivado" | "rendimento_do_cacho" | null;
};

/** Um milheiro de quilos. Existe para o 1.000 não virar número mágico. */
const KG_POR_TONELADA = 1000;

export function ReferenciaProdutiva({
  referencia,
  purpose,
  crop,
}: {
  referencia: ReferenciaProdutivaData;
  purpose: string;
  crop: string;
}) {
  const { t, lang } = useLanguage();
  const locale = lang === "en" ? "en-US" : "pt-BR";

  const label =
    lang === "en"
      ? {
          titulo: "Regional yield reference",
          rotulo: "Average municipal yield",
          fonte: (ano: number, municipio: string) =>
            `Source: IBGE PAM ${ano} · municipal average for ${municipio}`,
          ressalva:
            "Average across every farm in the municipality, not a forecast for this property. The final call is yours and your agronomist's.",
          unidade: { t: "t/ha", kg: "kg/ha", frutos: "fruits/ha", sc: "bags/ha" },
          escopo: {
            soma_de_tipos: "Arabica and canephora combined.",
            fruto_nao_derivado: "IBGE measures the harvested fruit, not the processed product.",
            rendimento_do_cacho: "Yield measured as bunches, not loose fruit.",
          },
        }
      : {
          titulo: "Referência produtiva da região",
          rotulo: "Rendimento médio municipal",
          fonte: (ano: number, municipio: string) =>
            `Fonte: IBGE PAM ${ano} · média municipal de ${municipio}`,
          ressalva:
            "Média de todas as lavouras do município, não previsão para este imóvel. Decisão final é sua e do seu agrônomo.",
          unidade: { t: "t/ha", kg: "kg/ha", frutos: "frutos/ha", sc: "sc/ha" },
          escopo: {
            soma_de_tipos: "Soma de arábica e canephora.",
            fruto_nao_derivado: "O IBGE mede o fruto colhido, não o produto beneficiado.",
            rendimento_do_cacho: "Rendimento medido em cacho, não em fruta solta.",
          },
        };

  // O nome da cultura sai da mesma lista do formulário, pelo idioma corrente.
  // Se a chave não estiver na lista da finalidade (crop é texto livre no
  // banco), cai no value cru — o mesmo idioma de ListingDetail.
  // Procura primeiro na finalidade do anúncio e, se não achar, em todas as
  // outras: `crop` é texto livre no banco, sem enum, então um par
  // finalidade/cultura torto existe. O número já é buscado só pela cultura; o
  // nome ao lado dele tem que seguir a mesma régua, senão o card apareceria
  // com o valor certo e o rótulo cru ("cacau" em vez de "Cacau").
  const nomeCultura =
    t.appraiser.crops[purpose]?.find((c) => c.value === crop)?.label ??
    Object.values(t.appraiser.crops)
      .flat()
      .find((c) => c.value === crop)?.label ??
    crop;

  const numero = (v: number, casas: number) =>
    v.toLocaleString(locale, { maximumFractionDigits: casas });

  // ── A REGRA DE UNIDADE ─────────────────────────────────────────────────────
  // Só o que é kg/ha vira tonelada, e só a partir de 1.000 kg/ha: abaixo disso
  // "0,478 t/ha" some com a informação que "478 kg/ha" dá de graça. Cultura
  // medida em frutos (abacaxi e coco, nota 6 da tabela 5457 do IBGE) NUNCA
  // vira tonelada, porque fruto não é quilo.
  const principal =
    referencia.unidade === "frutos_ha"
      ? `${numero(referencia.valor, 0)} ${label.unidade.frutos}`
      : referencia.valor >= KG_POR_TONELADA
        ? `${numero(referencia.valor / KG_POR_TONELADA, 2)} ${label.unidade.t}`
        : `${numero(referencia.valor, 0)} ${label.unidade.kg}`;

  // Sacas só quando a saca é oficial E se refere à mesma forma que o IBGE
  // mede (o divisor vem da tabela curada, por cultura).
  //
  // O piso de 0,1 não é paranoia: o menor rendimento de milho da base é 3
  // kg/ha, que dá 0,050 sc/ha e arredonda para "0,1 sc/ha" por um fio. Um
  // município um pouco pior imprimiria "0 sc/ha" ao lado de um número
  // positivo, e zero é justamente o valor que esta base não tem.
  const sacas =
    referencia.sacaKg != null && referencia.unidade === "kg_ha"
      ? referencia.valor / referencia.sacaKg
      : null;
  const emSacas =
    sacas != null && sacas >= 0.1 ? `${numero(sacas, 1)} ${label.unidade.sc}` : null;

  return (
    <section className="mt-6 rounded-2xl border border-deep/10 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-bold uppercase tracking-wide text-primary">
        {label.titulo} · {nomeCultura}
      </h2>

      <div className="mt-4 rounded-xl border border-deep/5 bg-neutral/40 px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wide text-deep/50">{label.rotulo}</p>
        <p className="mt-1 text-2xl font-extrabold text-deep">
          {principal}
          {emSacas ? <span className="text-deep/60"> · {emSacas}</span> : null}
        </p>
      </div>

      <div className="mt-4 rounded-xl bg-neutral/40 px-4 py-2.5 text-sm text-deep/70">
        {/*
          A ressalva de ESCOPO vem primeiro, e existe porque o rótulo da
          cultura e a medida do IBGE nem sempre são a mesma coisa: quem lê
          "Oliveira (azeite)" precisa saber, ali, que o número é da azeitona
          colhida. Sem esta linha o card publicaria um rótulo estreito com um
          número largo embaixo.
        */}
        {referencia.escopo ? (
          <p className="mb-1">{label.escopo[referencia.escopo]}</p>
        ) : null}
        <p>{label.fonte(referencia.ano, referencia.municipio)}</p>
        <p className="mt-1">{label.ressalva}</p>
      </div>
    </section>
  );
}
