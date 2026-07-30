/**
 * CHECAGENS DO CAR — validação estrutural e a regra do selo.
 *
 * O que este arquivo FAZ: normaliza o número do CAR digitado, confere a
 * estrutura contra o formato observado na base oficial, compara UF e município
 * com o que o anúncio declara, confronta a área e decide o `car_status`.
 *
 * O que ele NÃO faz: nenhum I/O. Nenhuma chamada ao SICAR (isso é
 * `lib/car-sicar.ts`), nenhum acesso a banco, nenhum segredo. A consulta
 * externa é ENTREGUE pronta a `decideCar()`, no mesmo desenho de
 * `lib/kyc-checks.ts` → `decide()`.
 *
 * O que ele NUNCA faz: rejeitar alguém. Nada aqui bloqueia publicação e nada
 * acusa em página pública. O pior veredito possível é "não confirmado".
 *
 * ── FORMATO DO cod_imovel, medido e não suposto ──────────────────────────────
 * Amostra de 6.750 códigos colhida em 29/07/2026 do WFS oficial
 * (`geoserver.car.gov.br/geoserver/sicar/wfs`), 250 por camada, todas as 27
 * UFs — incluindo estados que rodaram sistema próprio antes da migração
 * federal (MT, PA, BA, MG, SP, RO, TO):
 *
 *   • 6.750/6.750 (100%) casam  ^[A-Z]{2}-\d{7}-[0-9A-F]{32}$
 *   • comprimento único: 43. Sempre 2 hifens. Sufixo sempre 32 caracteres.
 *   • alfabeto do sufixo: exatamente 0123456789ABCDEF (UUID sem hifens)
 *
 * Nenhuma variação estrutural foi encontrada, então a regex é rigorosa. A
 * tolerância vive na ENTRADA (`parseCar`), porque o erro real do usuário é
 * colar o código com a formatação de apresentação do portal, não digitar um
 * número de outra forma.
 */

/** Sobe quando o formato de `checks` mudar, para ler linhas antigas sem susto. */
export const CAR_CHECKS_VERSION = 1;

/**
 * Estrutura canônica do cod_imovel. Rigorosa de propósito: `parseCar` já
 * normalizou a entrada antes de chegar aqui.
 */
const CAR_CANONICO = /^([A-Z]{2})-(\d{7})-([0-9A-F]{32})$/;

/** Os 27 prefixos de UF válidos (26 estados + DF), como aparecem no CAR. */
const UFS_VALIDAS = new Set([
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS",
  "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC",
  "SE", "SP", "TO",
]);

/**
 * Estados do selo. Ordem de força crescente, e só o último vira selo público.
 *
 *   nao_informado    — o dono não preencheu o CAR (campo é opcional)
 *   formato_invalido — não reconhecemos o formato; NÃO bloqueia publicação
 *   formato_ok       — estrutura válida, ninguém conferiu na fonte
 *   confirmado_sicar — o SICAR devolveu o imóvel ativo e tudo bateu
 *   divergente_sicar — o SICAR respondeu e algo não bate; SINAL INTERNO,
 *                      nunca selo negativo em página pública
 */
export type CarStatus =
  | "nao_informado"
  | "formato_invalido"
  | "formato_ok"
  | "confirmado_sicar"
  | "divergente_sicar";

export type CarParsed = {
  /** Código já normalizado, na forma canônica UF-IBGE-SUFIXO. */
  normalizado: string;
  uf: string;
  /**
   * Código IBGE do município EMBUTIDO na string. Atenção: isto é o município
   * do cadastro, e NÃO é prova de onde o imóvel está — ver `municipio_confere`.
   */
  municipioIbgeDeclarado: number;
  sufixo: string;
};

/**
 * Normaliza e decompõe o CAR. Devolve `null` quando não reconhece a estrutura.
 * Nunca lança.
 *
 * Tolerância na entrada, deliberada: o portal do SICAR apresenta o código com
 * separadores, e o caminho normal do usuário é copiar e colar de lá. Aceitamos
 * espaço, ponto, barra e underscore como separador, além do hífen, e aceitamos
 * minúsculas. Rejeitar um CAR legítimo por causa de um ponto colado é gol
 * contra: o campo é opcional e o objetivo é ganhar o selo, não reprovar.
 *
 * Exemplos reais que precisam passar (o primeiro é dado observado na base):
 *   "BA-2902708-117781E5BE6845A9AEC3FFBACC2B6D06"   ← forma canônica
 *   "ba-2902708-117781e5be6845a9aec3ffbacc2b6d06"   ← minúsculas
 *   " BA 2902708 117781E5BE6845A9AEC3FFBACC2B6D06 " ← colado com espaços
 *   "BA.2902708.117781E5BE6845A9AEC3FFBACC2B6D06"   ← colado com pontos
 */
export function parseCar(input: string | null | undefined): CarParsed | null {
  if (!input) return null;

  // 1) Só maiúsculas, e todo separador de apresentação vira hífen.
  const bruto = String(input).toUpperCase().replace(/[\s._/\\]+/g, "-");
  // 2) Hifens repetidos colapsam; sobras nas pontas caem.
  const comHifens = bruto.replace(/-+/g, "-").replace(/^-|-$/g, "");

  const m = CAR_CANONICO.exec(comHifens);
  if (m) {
    return {
      normalizado: comHifens,
      uf: m[1],
      municipioIbgeDeclarado: Number(m[2]),
      sufixo: m[3],
    };
  }

  // 3) Último recurso: alguém pode colar sem separador nenhum (43-2 = 41
  //    caracteres). Reconstruímos a forma canônica e revalidamos — nunca
  //    aceitamos sem passar pela regex.
  const semNada = comHifens.replace(/-/g, "");
  if (/^[A-Z]{2}\d{7}[0-9A-F]{32}$/.test(semNada)) {
    const recomposto = `${semNada.slice(0, 2)}-${semNada.slice(2, 9)}-${semNada.slice(9)}`;
    const m2 = CAR_CANONICO.exec(recomposto);
    if (m2) {
      return {
        normalizado: recomposto,
        uf: m2[1],
        municipioIbgeDeclarado: Number(m2[2]),
        sufixo: m2[3],
      };
    }
  }

  return null;
}

/** Forma esperada, para a mensagem de ajuda da interface. Não é copy final. */
export const CAR_FORMATO_EXEMPLO = "BA-2902708-117781E5BE6845A9AEC3FFBACC2B6D06";

/**
 * Resposta da fonte externa, já normalizada por `lib/car-sicar.ts`.
 * `consulted: false` significa que nem tentamos (ou que o serviço falhou):
 * é diferente de `found: false`, que é o SICAR dizendo "não tenho esse imóvel".
 */
export type CarSicarLookup = {
  consulted: boolean;
  /** Qual porta respondeu, para o rastro do selo. */
  source: string | null;
  /** Data da consulta — é isto que sustenta o "conferido em [data]". */
  checked_at: string | null;
  found: boolean | null;
  /** AT/PE/CA/SU e o que mais a base tiver. Domínio NÃO é fechado. */
  status_imovel: string | null;
  area_ha: number | null;
  uf: string | null;
  municipio: string | null;
  /** O código IBGE AUTORITATIVO, atributo da base — não o embutido na string. */
  municipio_ibge: number | null;
  condicao: string | null;
  tipo_imovel: string | null;
  dat_criacao: string | null;
  data_atualizacao: string | null;
  error: string | null;
};

/**
 * `AT` é o único status que sustenta selo. Os outros existem de verdade na
 * base (medido em 29/07/2026 na camada da BA: AT >= 10.000, PE 4.548,
 * CA 2.781, SU 62, RE 0) e o domínio NÃO é fechado — status desconhecido cai
 * em "não confirmado", nunca em aprovado nem em rejeitado.
 */
export function statusSicarAtivo(status: string | null): boolean | null {
  if (!status) return null;
  const s = status.trim().toUpperCase();
  if (s === "AT") return true;
  if (s === "PE" || s === "CA" || s === "SU" || s === "RE") return false;
  return null; // status que não conhecemos: indeterminado, de propósito
}

/**
 * Tolerância da coerência de área, em fração.
 *
 * Assimetria deliberada, e o motivo é de negócio: o proprietário pode estar
 * anunciando SÓ UMA PARTE do imóvel do CAR (arrendar 200 ha de uma fazenda de
 * 500 ha é o caso normal do produto). Então área do CAR MAIOR que os hectares
 * do anúncio não é problema nenhum e não tem teto.
 *
 * O suspeito é o contrário: anúncio maior que o imóvel registrado. Aí sim
 * permitimos apenas uma folga pequena, para absorver arredondamento e
 * diferença de medição entre o levantamento do CAR e o que o dono informa.
 */
export const AREA_FOLGA_ACIMA_DO_CAR = 0.05; // 5%

/**
 * Área do anúncio é coerente com a área registrada no CAR?
 * `null` quando falta um dos dois números.
 */
export function areaCoerente(
  hectaresAnuncio: number | null | undefined,
  areaCarHa: number | null | undefined,
): boolean | null {
  if (!hectaresAnuncio || !areaCarHa) return null;
  if (hectaresAnuncio <= 0 || areaCarHa <= 0) return null;
  return hectaresAnuncio <= areaCarHa * (1 + AREA_FOLGA_ACIMA_DO_CAR);
}

export type CarChecks = {
  version: number;
  ran_at: string;
  /** O que o dono declarou, já normalizado. */
  declarado: {
    car: string | null;
    uf: string | null;
    /** Código IBGE embutido na string. Município do CADASTRO, não veredito. */
    municipio_ibge_declarado: number | null;
  } | null;
  /** A estrutura casa com o formato oficial observado? */
  formato_ok: boolean;
  /** A UF dentro do CAR é a UF do anúncio? Seguro: 800/800 na amostragem. */
  uf_confere: boolean | null;
  /**
   * O bloco IBGE embutido pertence ao mesmo estado do anúncio? Checagem fraca
   * mas segura (800/800 na amostragem). Serve para pegar código de outro
   * estado, não para afirmar município.
   */
  municipio_uf_coerente: boolean | null;
  /**
   * O município CONFERE? Só o SICAR responde isto, porque o código embutido na
   * string NÃO é o município do imóvel.
   *
   * ── POR QUE ISTO NÃO É CHECADO LOCALMENTE ────────────────────────────────
   * Medição de 29/07/2026 contra a base oficial, comparando o código embutido
   * no cod_imovel com o atributo autoritativo `cod_municipio_ibge`:
   *
   *   Xique-Xique/BA    40 imóveis → 4 divergentes (10%)
   *   Sorriso/MT        60 imóveis → 6 divergentes (10%)
   *   Rio Verde/GO      60 imóveis → 4 divergentes ( 7%)
   *   Patos de Minas/MG 60 imóveis → 17 divergentes (28%)
   *
   * Os divergentes de Xique-Xique apontam para Barra, Gentio do Ouro e
   * Itaguaçu da Bahia — municípios VIZINHOS, confirmados na API do IBGE. São
   * imóveis na divisa, ou cadastrados no município vizinho. Em 800/800 casos a
   * divergência ficou dentro do mesmo estado.
   *
   * Comparar o código embutido reprovaria de 7% a 28% de donos legítimos — em
   * Patos de Minas, mais de um em cada quatro. Isso é a plataforma acusando
   * inocente, que é exatamente o que não pode acontecer.
   */
  municipio_confere: boolean | null;
  /** Os hectares do anúncio cabem na área do CAR? */
  area_coerente: boolean | null;
  /** O imóvel está ATIVO no SICAR? */
  status_ativo: boolean | null;
  sicar: CarSicarLookup | null;
  /** Motivos legíveis (PT, sem acento) para o Carlos ler na consulta interna. */
  reasons: string[];
  status: CarStatus;
};

export type DecideCarInput = {
  /** O que veio do formulário. */
  car: string | null | undefined;
  /** UF do anúncio. */
  state: string | null | undefined;
  /** Código IBGE do município do anúncio. Nulo quando o IBGE falhou no form. */
  municipalityIbge: number | null | undefined;
  hectares: number | null | undefined;
  /** Consulta externa já pronta, ou `null` se não houve. */
  sicar: CarSicarLookup | null;
  /** Injetável para teste; default é agora. */
  now?: () => Date;
};

/**
 * Monta o objeto de checagens e decide o `car_status`. Nunca lança.
 * Espelha `decide()` de `lib/kyc-checks.ts`.
 */
export function decideCar(input: DecideCarInput): CarChecks {
  const ran_at = (input.now ? input.now() : new Date()).toISOString();
  const reasons: string[] = [];

  const bruto = typeof input.car === "string" ? input.car.trim() : "";
  const base = {
    version: CAR_CHECKS_VERSION,
    ran_at,
    sicar: input.sicar,
  };

  // ── 1) Campo vazio: não é erro, o CAR é opcional ──────────────────────────
  if (!bruto) {
    return {
      ...base,
      declarado: null,
      formato_ok: false,
      uf_confere: null,
      municipio_uf_coerente: null,
      municipio_confere: null,
      area_coerente: null,
      status_ativo: null,
      reasons: [],
      status: "nao_informado",
    };
  }

  const parsed = parseCar(bruto);

  // ── 2) Formato não reconhecido ────────────────────────────────────────────
  if (!parsed) {
    reasons.push("Formato do CAR nao reconhecido.");
    return {
      ...base,
      declarado: { car: bruto.slice(0, 64), uf: null, municipio_ibge_declarado: null },
      formato_ok: false,
      uf_confere: null,
      municipio_uf_coerente: null,
      municipio_confere: null,
      area_coerente: null,
      status_ativo: null,
      reasons,
      status: "formato_invalido",
    };
  }

  const declarado = {
    car: parsed.normalizado,
    uf: parsed.uf,
    municipio_ibge_declarado: parsed.municipioIbgeDeclarado,
  };

  // UF do CAR precisa ser uma das 27 e bater com a do anúncio.
  const ufAnuncio = (input.state ?? "").trim().toUpperCase();
  const ufKnown = UFS_VALIDAS.has(parsed.uf);
  if (!ufKnown) reasons.push(`UF do CAR nao existe: ${parsed.uf}.`);

  const uf_confere = ufAnuncio ? ufKnown && parsed.uf === ufAnuncio : null;
  if (uf_confere === false) {
    reasons.push(`UF do CAR (${parsed.uf}) diferente da UF do anuncio (${ufAnuncio}).`);
  }

  // Coerência de estado dentro do bloco IBGE embutido. Os 2 primeiros dígitos
  // do código IBGE são o código numérico da UF.
  const ibgeAnuncio = input.municipalityIbge ?? null;
  const ufNumDeclarada = String(parsed.municipioIbgeDeclarado).padStart(7, "0").slice(0, 2);
  const municipio_uf_coerente =
    ibgeAnuncio != null
      ? ufNumDeclarada === String(ibgeAnuncio).padStart(7, "0").slice(0, 2)
      : null;
  if (municipio_uf_coerente === false) {
    reasons.push("Codigo IBGE dentro do CAR pertence a outro estado.");
  }

  const formato_ok = ufKnown;

  // ── 3) Sem consulta externa: paramos em formato_ok ────────────────────────
  const s = input.sicar;
  if (!s || !s.consulted) {
    if (s && s.error) reasons.push(`Consulta ao SICAR nao concluida: ${s.error}.`);
    return {
      ...base,
      declarado,
      formato_ok,
      uf_confere,
      municipio_uf_coerente,
      municipio_confere: null, // só o SICAR responde
      area_coerente: null,
      status_ativo: null,
      reasons,
      // UF trocada já é divergência, e ela é medível sem o SICAR.
      status: !formato_ok || uf_confere === false || municipio_uf_coerente === false
        ? "divergente_sicar"
        : "formato_ok",
    };
  }

  // ── 4) O SICAR respondeu "não tenho esse imóvel" ──────────────────────────
  if (s.found === false) {
    reasons.push("CAR nao encontrado na base do SICAR.");
    return {
      ...base,
      declarado,
      formato_ok,
      uf_confere,
      municipio_uf_coerente,
      municipio_confere: null,
      area_coerente: null,
      status_ativo: null,
      reasons,
      status: "divergente_sicar",
    };
  }

  // ── 5) O SICAR devolveu o imóvel: agora as comparações valem ──────────────
  const status_ativo = statusSicarAtivo(s.status_imovel);
  if (status_ativo === false) {
    reasons.push(`Imovel com status ${s.status_imovel} no SICAR (nao ativo).`);
  } else if (status_ativo === null) {
    reasons.push(`Status do imovel desconhecido no SICAR: ${s.status_imovel ?? "vazio"}.`);
  }

  // Município: comparamos com o ATRIBUTO da base, que é autoritativo.
  const municipio_confere =
    ibgeAnuncio != null && s.municipio_ibge != null
      ? Number(s.municipio_ibge) === Number(ibgeAnuncio)
      : null;
  if (municipio_confere === false) {
    reasons.push(
      `Municipio do SICAR (${s.municipio ?? s.municipio_ibge}) diferente do municipio do anuncio.`,
    );
  }

  // UF: idem, contra o atributo.
  const ufSicarConfere =
    ufAnuncio && s.uf ? s.uf.trim().toUpperCase() === ufAnuncio : null;
  if (ufSicarConfere === false) {
    reasons.push(`UF do SICAR (${s.uf}) diferente da UF do anuncio (${ufAnuncio}).`);
  }

  const area_coerente = areaCoerente(input.hectares, s.area_ha);
  if (area_coerente === false) {
    reasons.push(
      `Area do anuncio (${input.hectares} ha) maior que a area registrada no CAR (${s.area_ha} ha).`,
    );
  }

  // ── 6) A regra do selo, com TRÊS saídas e não duas ────────────────────────
  //
  // A distinção que importa: "NÃO CONFERE" é diferente de "NÃO DEU PARA
  // CONFERIR". Confundir as duas faz a plataforma acusar quem só teve azar.
  //
  // O caso concreto que motivou isto (pego em teste, não em teoria): quando a
  // API do IBGE está fora do ar, o formulário degrada para município em texto
  // livre e `municipality_ibge` fica nulo. Aí `municipio_confere` é `null` —
  // indeterminado, corretamente. Se a decisão fosse binária, esse anúncio cairia
  // em `divergente_sicar`, ou seja, a plataforma marcaria como suspeito um dono
  // legítimo por causa de uma falha de rede NOSSA.
  //
  //   • alguma checagem afirmativamente FALSA  → divergente_sicar (sinal interno)
  //   • todas afirmativamente VERDADEIRAS      → confirmado_sicar (selo)
  //   • qualquer indeterminada, nenhuma falsa  → formato_ok (sem selo, sem culpa)
  const checagens = [
    formato_ok,
    status_ativo,
    uf_confere,
    ufSicarConfere,
    municipio_confere,
    area_coerente,
  ];
  const algumaFalsa = checagens.some((c) => c === false);
  const todasVerdadeiras = checagens.every((c) => c === true);

  if (!algumaFalsa && !todasVerdadeiras) {
    reasons.push("Nao foi possivel confirmar todos os dados do CAR.");
  }

  return {
    ...base,
    declarado,
    formato_ok,
    uf_confere,
    municipio_uf_coerente,
    municipio_confere,
    area_coerente,
    status_ativo,
    reasons,
    status: algumaFalsa
      ? "divergente_sicar"
      : todasVerdadeiras
        ? "confirmado_sicar"
        : "formato_ok",
  };
}

/**
 * O selo público. Existe uma única porta para ele, e é esta.
 * Usada pelo app; no banco a mesma regra vive na view `public_listings`.
 */
export function selaVerificado(status: CarStatus | null | undefined): boolean {
  return status === "confirmado_sicar";
}

/** Estado intermediário honesto: "CAR declarado pelo proprietário". */
export function carDeclarado(status: CarStatus | null | undefined): boolean {
  return status === "formato_ok";
}
