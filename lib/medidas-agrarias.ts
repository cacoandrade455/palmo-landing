/**
 * Medidas agrárias tradicionais → hectares.
 *
 * Módulo PURO (sem React): a tabela de conversão e os helpers usados pelo
 * `components/CampoDeArea.tsx` nas três superfícies (calculadora pública,
 * criação e edição de anúncio). O contrato do produto NÃO muda aqui: banco,
 * FormData e prefills continuam falando hectares — tarefa e alqueire são só
 * camada de entrada.
 *
 * Base de todos os fatores: a braça brasileira de 2,20 m, logo
 * 1 braça² = 4,84 m², e 1 ha = 10.000 m². Cada linha abaixo traz a derivação
 * em braças², conforme as tabelas clássicas de medidas agrárias não decimais
 * (a mesma tabela publicada pela Embrapa em "Unidades de medida de terras").
 * Nenhuma medida além destas: são as seis que o produto reconhece hoje.
 */

export type UnidadeAgraria = "hectare" | "tarefa" | "alqueire";
export type UnidadeNaoDecimal = Exclude<UnidadeAgraria, "hectare">;

export type VarianteAgraria = {
  /** Identificador estável (vai no <select> de variante, nunca no banco). */
  id: string;
  unidade: UnidadeNaoDecimal;
  /** Área de UMA unidade, em m². */
  m2: number;
  /** Rótulo do <option>, PT e EN. */
  labelPt: string;
  labelEn: string;
  /** Nome na linha de conversão ("200 tarefas (BA) = 87,12 ha"). */
  singular: string;
  plural: string;
  /** UFs em que esta variante é a pré-seleção natural. */
  ufs: readonly string[];
};

/** UFs da região Norte — todas pré-selecionam o alqueire do Norte. */
const UFS_NORTE = ["AC", "AM", "AP", "PA", "RO", "RR", "TO"] as const;

export const VARIANTES_AGRARIAS: readonly VarianteAgraria[] = [
  // Tarefa baiana: 30 × 30 braças = 900 braças² × 4,84 m² = 4.356 m².
  {
    id: "tarefa-ba",
    unidade: "tarefa",
    m2: 4356,
    labelPt: "Tarefa da Bahia — 4.356 m²",
    labelEn: "Bahia tarefa — 4,356 m²",
    singular: "tarefa (BA)",
    plural: "tarefas (BA)",
    ufs: ["BA"],
  },
  // Tarefa cearense: 30 × 25 braças = 750 braças² × 4,84 m² = 3.630 m².
  {
    id: "tarefa-ce",
    unidade: "tarefa",
    m2: 3630,
    labelPt: "Tarefa do Ceará — 3.630 m²",
    labelEn: "Ceará tarefa — 3,630 m²",
    singular: "tarefa (CE)",
    plural: "tarefas (CE)",
    ufs: ["CE"],
  },
  // Tarefa de Alagoas/Sergipe: 25 × 25 braças = 625 braças² × 4,84 m² = 3.025 m².
  {
    id: "tarefa-al-se",
    unidade: "tarefa",
    m2: 3025,
    labelPt: "Tarefa de AL/SE — 3.025 m²",
    labelEn: "AL/SE tarefa — 3,025 m²",
    singular: "tarefa (AL/SE)",
    plural: "tarefas (AL/SE)",
    ufs: ["AL", "SE"],
  },
  // Alqueire paulista: 100 × 50 braças = 5.000 braças² × 4,84 m² = 24.200 m².
  {
    id: "alqueire-paulista",
    unidade: "alqueire",
    m2: 24200,
    labelPt: "Alqueire paulista — 24.200 m²",
    labelEn: "Alqueire paulista — 24,200 m²",
    singular: "alqueire paulista",
    plural: "alqueires paulistas",
    ufs: ["SP"],
  },
  // Alqueire mineiro/goiano: 100 × 100 braças = 10.000 braças² × 4,84 m² = 48.400 m².
  {
    id: "alqueire-mineiro-goiano",
    unidade: "alqueire",
    m2: 48400,
    labelPt: "Alqueire mineiro/goiano — 48.400 m²",
    labelEn: "Alqueire mineiro/goiano — 48,400 m²",
    singular: "alqueire mineiro/goiano",
    plural: "alqueires mineiros/goianos",
    ufs: ["MG", "GO"],
  },
  // Alqueire do Norte: 75 × 75 braças = 5.625 braças² × 4,84 m² = 27.225 m².
  {
    id: "alqueire-norte",
    unidade: "alqueire",
    m2: 27225,
    labelPt: "Alqueire do Norte — 27.225 m²",
    labelEn: "Alqueire do Norte — 27,225 m²",
    singular: "alqueire do Norte",
    plural: "alqueires do Norte",
    ufs: UFS_NORTE,
  },
];

/** Variantes de uma unidade, na ordem da tabela. */
export function variantesDe(unidade: UnidadeNaoDecimal): VarianteAgraria[] {
  return VARIANTES_AGRARIAS.filter((v) => v.unidade === unidade);
}

export function variantePorId(id: string): VarianteAgraria | undefined {
  return VARIANTES_AGRARIAS.find((v) => v.id === id);
}

/**
 * Pré-seleção da variante pela UF já escolhida no formulário (BA → tarefa BA,
 * SP → alqueire paulista, Norte → alqueire do Norte…). UF sem variante própria
 * cai na primeira da tabela — é só ponto de partida, trocável no <select>.
 */
export function variantePadrao(unidade: UnidadeNaoDecimal, uf: string): VarianteAgraria {
  const lista = variantesDe(unidade);
  return lista.find((v) => v.ufs.includes(uf)) ?? lista[0];
}

/**
 * Converte `valor` unidades de `m2PorUnidade` para hectares, com até 4 casas
 * decimais (o que é gravado e o que é exibido usam o MESMO arredondamento).
 */
export function converterParaHectares(valor: number, m2PorUnidade: number): number {
  return Math.round(((valor * m2PorUnidade) / 10000) * 10000) / 10000;
}

/**
 * Formata hectares para exibição: até 4 casas decimais, zeros à direita
 * removidos (comportamento nativo do toLocaleString sem minimumFractionDigits).
 */
export function formatarHectares(ha: number, locale: string = "pt-BR"): string {
  return ha.toLocaleString(locale, { maximumFractionDigits: 4 });
}

/** Linha de conversão exibida ao vivo: "200 tarefas (BA) = 87,12 ha". */
export function linhaDeConversao(
  valor: number,
  variante: VarianteAgraria,
  locale: string = "pt-BR",
): string {
  const ha = converterParaHectares(valor, variante.m2);
  const nome = valor === 1 ? variante.singular : variante.plural;
  const valorTxt = valor.toLocaleString(locale, { maximumFractionDigits: 4 });
  return `${valorTxt} ${nome} = ${formatarHectares(ha, locale)} ha`;
}
