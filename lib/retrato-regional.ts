/**
 * Resolução município → retrato estratégico regional.
 *
 * A camada de DADOS (retratos curados, fallback por bioma e o mapa estático
 * MUNI_TO_REGIAO) vive em `lib/regioes-agricolas.ts` e é somente leitura.
 * Este arquivo é só o RESOLVEDOR: descobre QUAL retrato mostrar, nunca
 * reescreve texto, número, fonte ou nome — apenas devolve o objeto pronto.
 *
 * Ordem de resolução (decisão 22/jul):
 *  1. API do IBGE em tempo real (mesmo domínio já usado pelo dropdown
 *     UF→município). Ela nos dá (a) o nome CANÔNICO do município — o que
 *     conserta grafia/acento quando o usuário digitou à mão — e (b) a
 *     mesorregião oficial, que amplia a cobertura para além dos municípios-
 *     âncora. Timeout curto + try/catch: qualquer falha cai adiante.
 *  2. Fallback estático: `retratoPorMunicipio` sobre MUNI_TO_REGIAO.
 *  3. Bioma predominante da UF (retrato honesto, mais geral).
 *  4. null — a tela segue só com o ranking, como hoje.
 *
 * Em nenhum caminho esta função lança: o pior caso é `null`.
 */
import {
  REGIOES,
  retratoPorMunicipio,
  type RegiaoRetrato,
} from "@/lib/regioes-agricolas";

/** Maiúsculas sem acento — o formato das chaves de MUNI_TO_REGIAO. */
function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toUpperCase();
}

/**
 * Mesorregião oficial do IBGE → região curada. Chave: "UF:MESORREGIAO"
 * normalizada. Cobre a mesorregião INTEIRA, então só entram associações em
 * que a vocação do retrato vale para a mesorregião toda; casos mistos ficam
 * de fora de propósito (o município-âncora já resolve antes, via
 * MUNI_TO_REGIAO, e o que sobra cai no bioma — mais geral e honesto).
 */
const MESO_TO_REGIAO: Record<string, string> = {
  "BA:EXTREMO OESTE BAIANO": "ba-extremo-oeste",
  "BA:VALE SAO-FRANCISCANO DA BAHIA": "ba-vale-sao-francisco",
  "BA:SUL BAIANO": "ba-sul-recôncavo",
  "BA:METROPOLITANA DE SALVADOR": "ba-sul-recôncavo",
  "BA:NORDESTE BAIANO": "ba-sertao-nordeste",
  "BA:CENTRO NORTE BAIANO": "ba-centro-norte",
  "MG:SUL/SUDOESTE DE MINAS": "mg-sul-de-minas",
  "MG:TRIANGULO MINEIRO/ALTO PARANAIBA": "mg-cerrado-mineiro",
  "MG:ZONA DA MATA": "mg-matas-de-minas",
  "SP:RIBEIRAO PRETO": "sp-ribeirao-cana",
  "SP:ARARAQUARA": "sp-citricola",
  "MT:NORTE MATO-GROSSENSE": "mt-medio-norte",
  "GO:SUL GOIANO": "go-sudoeste",
  "RS:NORDESTE RIO-GRANDENSE": "rs-serra-gaucha",
  "RS:SUDOESTE RIO-GRANDENSE": "rs-metade-sul-arroz",
  "SC:SERRANA": "sc-planalto-serrano",
  "RN:OESTE POTIGUAR": "rn-assu-mossoro",
  "CE:JAGUARIBE": "ce-baixo-jaguaribe",
  "PE:MATA PERNAMBUCANA": "pe-zona-mata-cana",
  "PA:NORDESTE PARAENSE": "pa-nordeste-acai",
  "RO:LESTE RONDONIENSE": "ro-cafe-robusta",
  "MA:SUL MARANHENSE": "matopiba-fronteira",
  "PI:SUDOESTE PIAUIENSE": "matopiba-fronteira",
  "TO:ORIENTAL DO TOCANTINS": "matopiba-fronteira",
  "TO:OCIDENTAL DO TOCANTINS": "matopiba-fronteira",
};

/**
 * Bioma predominante por UF — só para escolher o retrato GERAL de bioma
 * (BIOMA_FALLBACK) quando não há região curada. É uma aproximação assumida:
 * o texto do retrato de bioma já se apresenta como tendência ampla, não como
 * diagnóstico local. Chaves iguais às de BIOMA_FALLBACK.
 */
const BIOMA_POR_UF: Record<string, string> = {
  AC: "amazonia",
  AM: "amazonia",
  AP: "amazonia",
  PA: "amazonia",
  RO: "amazonia",
  RR: "amazonia",
  MA: "cerrado",
  TO: "cerrado",
  MT: "cerrado",
  MS: "cerrado",
  GO: "cerrado",
  DF: "cerrado",
  MG: "cerrado",
  PI: "caatinga",
  CE: "caatinga",
  RN: "caatinga",
  PB: "caatinga",
  PE: "caatinga",
  AL: "caatinga",
  SE: "caatinga",
  BA: "caatinga",
  ES: "mata_atlantica",
  RJ: "mata_atlantica",
  SP: "mata_atlantica",
  PR: "mata_atlantica",
  SC: "mata_atlantica",
  RS: "pampa",
};

/**
 * Passos 2 e 3, sem rede: estático → bioma → null. Nunca lança: o retrato é
 * um extra e não pode derrubar a calculadora nem com entrada estranha.
 */
export function retratoEstatico(
  uf: string,
  municipality: string,
): RegiaoRetrato | null {
  try {
    if (!uf) return null;
    const ufKey = norm(uf);
    const key = `${norm(municipality ?? "")}/${ufKey}`;
    return retratoPorMunicipio(key, BIOMA_POR_UF[ufKey]) ?? null;
  } catch {
    return null;
  }
}

type IbgeMunicipio = {
  nome?: string;
  microrregiao?: { mesorregiao?: { nome?: string } };
  mesorregiao?: { nome?: string };
};

const IBGE_TIMEOUT_MS = 2500;

/**
 * Resolução completa (passo 1 + fallbacks). Nunca rejeita: se a API do IBGE
 * demorar, falhar ou estiver offline, devolve exatamente o mesmo que
 * `retratoEstatico`.
 */
export async function resolverRetrato(
  uf: string,
  municipality: string,
): Promise<RegiaoRetrato | null> {
  const fallback = retratoEstatico(uf, municipality);
  if (!uf || !municipality) return fallback;

  const ufKey = norm(uf);
  const alvo = norm(municipality);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), IBGE_TIMEOUT_MS);
  try {
    // Mesmo endpoint do dropdown (provável hit de cache do navegador); cada
    // item traz a mesorregião oficial do município.
    const res = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${encodeURIComponent(
        ufKey,
      )}/municipios?orderBy=nome`,
      { signal: controller.signal },
    );
    if (!res.ok) return fallback;
    // Só iteramos DEPOIS de confirmar que veio mesmo uma lista: um corpo
    // inesperado (HTML de erro, objeto, null) degrada para o fallback.
    const list: unknown = await res.json();
    if (!Array.isArray(list)) return fallback;
    const hit = (list as IbgeMunicipio[]).find(
      (m) => norm(m?.nome ?? "") === alvo,
    );
    if (!hit) return fallback;

    // (a) nome canônico do IBGE → mapa estático de municípios-âncora
    const canonico = retratoPorMunicipio(
      `${norm(hit.nome ?? municipality)}/${ufKey}`,
    );
    if (canonico) return canonico;

    // (b) mesorregião oficial → região curada
    const meso = hit.microrregiao?.mesorregiao?.nome ?? hit.mesorregiao?.nome;
    if (meso) {
      const regKey = MESO_TO_REGIAO[`${ufKey}:${norm(meso)}`];
      if (regKey && REGIOES[regKey]) return REGIOES[regKey];
    }
    return fallback;
  } catch {
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}
