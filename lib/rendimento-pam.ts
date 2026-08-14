import "server-only";

import dados from "./rendimento-pam.json";

/**
 * RENDIMENTO MÉDIO MUNICIPAL (IBGE/PAM) — o leitor.
 *
 * O dado mora em `lib/rendimento-pam.json`, gerado por
 * `scripts/ingest-rendimento-pam.mjs` (rodar 1x/ano, a PAM é anual).
 *
 * ── POR QUE `server-only` ────────────────────────────────────────────────────
 * O JSON tem ~980 KB e 54 mil valores. Isso não pode chegar perto do bundle do
 * cliente: 90% do tráfego da Palmo é celular. Quem resolve a referência é o
 * servidor, e o que desce para o componente é UM objeto de meia dúzia de
 * campos. O `server-only` transforma "não importe isto no cliente" de
 * combinado em erro de build.
 *
 * ── A CHAVE DE JUNÇÃO, E POR QUE NÃO É O CÓDIGO IBGE ─────────────────────────
 * A doutrina da casa é comparar CÓDIGO de município, nunca nome (é o que a
 * checagem de CAR faz). Aqui não dá, por dois motivos medidos em 13/08/2026:
 *   • `public_listings` NÃO expõe `municipality_ibge` — a view é o contrato
 *     público do anúncio, e ela não passa o código;
 *   • no único anúncio real em produção, `municipality_ibge` está NULL: a
 *     coluna só é preenchida quando a API do IBGE responde no momento do
 *     cadastro, e ela é nullable desde sempre.
 * Então a junção é por (UF, nome normalizado), com o índice de nomes gerado da
 * PRÓPRIA lista de municípios do IBGE — a mesma que o formulário de anúncio
 * consulta para preencher o campo. Ou seja: os dois lados vêm da mesma fonte
 * de nomes, e é isso que torna a junção por nome segura aqui.
 *
 * Se um dia a view passar o código, prefira o código: `referenciaProdutiva`
 * aceita `municipioIbge` opcional e ele tem precedência.
 */

export type UnidadeRendimento = "kg_ha" | "frutos_ha";

/**
 * Por que o número mede algo um pouco diferente do que o rótulo da cultura diz.
 *
 * É um CÓDIGO, e não uma frase, de propósito: a frase é copy de interface e
 * mora no componente, em PT e EN. Existe porque, sem ele, a ressalva curada no
 * script morreria lá dentro e o leitor veria "Oliveira (azeite) · 3,37 t/ha"
 * sem saber que o IBGE mediu a azeitona, não o azeite.
 *
 * Desde 14/08/2026 a ressalva é a saída PADRÃO, e não a exceção: cultura não
 * some do card por desconforto de rótulo. Quando o rótulo do dropdown é mais
 * estreito que a lavoura medida (arroz irrigado dentro de todo o arroz do
 * município, limão tahiti dentro de "Limão"), o número continua sendo o do
 * IBGE e a tela diz o que ele mede.
 */
export type EscopoRendimento =
  | "soma_de_tipos"
  | "fruto_nao_derivado"
  | "rendimento_do_cacho"
  | "fava_de_lima"
  | "arroz_todo_sistema"
  | "limao_agregado"
  | "noz_sem_especie"
  | "palmito_sem_especie"
  | "algodao_herbaceo"
  | "algodao_arboreo"
  | "seringueira_coagulado";

export type ReferenciaProdutiva = {
  /** Chave da cultura, como gravada no anúncio. */
  cultura: string;
  /** Valor bruto, na unidade da fonte. Nunca zero: ausência não é zero. */
  valor: number;
  unidade: UnidadeRendimento;
  /** Peso da saca em kg, quando a conversão é legítima. `null` = não converte. */
  sacaKg: number | null;
  ano: number;
  /**
   * Nome do município COMO ESTÁ NO ANÚNCIO, para a linha de fonte. Não é o
   * nome do IBGE: o JSON guarda só o índice (UF, nome normalizado) → código, e
   * prometer "nome do IBGE" aqui seria prometer o que não se entrega. Na
   * prática os dois coincidem, porque o formulário de anúncio preenche o campo
   * a partir da lista do próprio IBGE.
   */
  municipio: string;
  /** Ressalva de escopo, quando o rótulo e a medida não são a mesma coisa. */
  escopo: EscopoRendimento | null;
};

type Arquivo = {
  fonte: string;
  tabelaUrl: string;
  ano: number;
  geradoEm: string;
  unidades: Record<string, UnidadeRendimento>;
  sacasKg: Record<string, number>;
  escopos: Record<string, EscopoRendimento>;
  /**
   * Ressalva que vale só em ALGUNS municípios, quando a c782 publica duas
   * lavouras sob o mesmo rótulo e a escolha muda de lugar para lugar (o
   * algodão herbáceo some no semiárido e quem sobra é o arbóreo). Tem
   * precedência sobre `escopos`.
   */
  escoposPorMunicipio: Record<string, Record<string, EscopoRendimento>>;
  municipios: Record<string, number>;
  rendimentos: Record<string, Record<string, number>>;
};

const base = dados as Arquivo;

/** Mesma normalização do script gerador: sem acento, minúsculo, hifenizado. */
function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * A referência produtiva de um anúncio, ou `null`.
 *
 * `null` cobre TODOS os casos de ausência, e de propósito: cultura sem par na
 * PAM, município que não existe no universo da pesquisa, e município que
 * existe mas não declarou aquela cultura. A interface trata os três do mesmo
 * jeito — o card não aparece — porque nenhum deles é um número.
 *
 * Em especial, "não se produz isso aqui" (que na PAM é 76,8% dos casos) NÃO
 * vira "0 kg/ha" e nem vira aviso: dizer "não se planta isso aqui" em cima de
 * um anúncio que anuncia exatamente isso seria hostil com o anunciante e,
 * pior, seria um veredito da plataforma sobre a terra dele.
 */
export function referenciaProdutiva(
  uf: string | null | undefined,
  municipio: string | null | undefined,
  cultura: string | null | undefined,
  municipioIbge?: number | null,
): ReferenciaProdutiva | null {
  if (!cultura) return null;

  const unidade = base.unidades[cultura];
  if (!unidade) return null; // cultura sem par inequívoco na PAM

  // O código, quando existe, manda: é chave estável, nome não é.
  let codigo: number | null =
    typeof municipioIbge === "number" && Number.isFinite(municipioIbge) ? municipioIbge : null;

  if (codigo == null) {
    if (!uf || !municipio) return null;
    codigo = base.municipios[`${uf.trim().toUpperCase()}|${normalizar(municipio)}`] ?? null;
  }
  if (codigo == null) return null;

  const valor = base.rendimentos[String(codigo)]?.[cultura];
  if (typeof valor !== "number" || !Number.isFinite(valor) || valor <= 0) return null;

  return {
    cultura,
    valor,
    unidade,
    sacaKg: base.sacasKg[cultura] ?? null,
    ano: base.ano,
    municipio: municipio ?? "",
    // O município manda quando tem ressalva própria: é ele que sabe qual das
    // duas lavouras foi medida ali.
    escopo:
      base.escoposPorMunicipio?.[cultura]?.[String(codigo)] ?? base.escopos[cultura] ?? null,
  };
}
