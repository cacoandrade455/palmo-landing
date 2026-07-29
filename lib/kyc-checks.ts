/**
 * TRIAGEM DE KYC — checagens automáticas e a regra de decisão.
 *
 * O que este arquivo FAZ: valida dígitos, consulta os dados abertos da
 * Receita Federal, compara nomes, classifica o CNAE e decide se o caso é
 * limpo o bastante para aprovar sozinho.
 *
 * O que ele NÃO faz: nada que dependa do banco ou do storage (duplicidade e
 * sanidade do arquivo são levantadas pela server action e entregues prontas
 * a `decide()`), e nada que rejeite alguém — rejeitar é ato humano.
 *
 * Módulo puro de propósito: nenhuma chave, nenhum segredo, nenhum acesso a
 * sessão. O painel importa só os TIPOS daqui.
 */

import { isValidCnpj, isValidCpf, onlyDigits } from "@/app/app/verificacao/br-docs";

/** Sobe quando o formato de `checks` mudar, para ler linhas antigas sem susto. */
export const CHECKS_VERSION = 1;

export const MIN_DOC_BYTES = 10 * 1024; // 10 KB — abaixo disso não é documento
export const MAX_DOC_BYTES = 10 * 1024 * 1024; // 10 MB — igual ao limite do formulário
export const ACCEPTED_DOC_MIMES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
] as const;

/** Divisões CNAE de atividade rural: 01 agro/pecuária, 02 florestal, 03 pesca. */
const CNAE_RURAL_DIVISOES = ["01", "02", "03"];

export type ReceitaCheck = {
  consulted: boolean;
  source: "brasilapi" | "minhareceita" | null;
  razao_social: string | null;
  nome_fantasia: string | null;
  situacao_cadastral: string | null;
  data_abertura: string | null;
  cnae_codigo: string | null;
  cnae_descricao: string | null;
  cnae_rural: boolean | null;
  error: string | null;
};

export type NameMatchCheck = {
  declared: string;
  official: string | null;
  score: number;
  compatible: boolean;
};

export type DuplicateCheck = {
  checked: boolean;
  found: boolean;
  /** Quais documentos bateram, já mascarados. Nunca o user_id do outro dono. */
  documents: string[];
};

export type FileCheck = {
  checked: boolean;
  ok: boolean;
  size_bytes: number | null;
  mime: string | null;
  problems: string[];
};

export type KycChecks = {
  version: number;
  ran_at: string;
  document: {
    kind: "cpf" | "cnpj";
    masked: string;
    digits_valid: boolean;
    responsavel_cpf_valid: boolean | null;
  };
  receita: ReceitaCheck | null;
  name_match: NameMatchCheck | null;
  duplicate: DuplicateCheck;
  file: FileCheck;
  /** Motivos legíveis (PT) para a fila manual. Vazio = nada a apontar. */
  reasons: string[];
  auto_approved: boolean;
};

// ─────────────────────────── máscaras de exibição ───────────────────────────

/** CPF é dado pessoal: no painel e nos logs só aparecem os dígitos do meio. */
export function maskCpfForDisplay(v: string): string {
  const d = onlyDigits(v);
  if (d.length !== 11) return "***";
  return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`;
}

/** CNPJ é informação pública (dados abertos da Receita): mostra inteiro. */
export function formatCnpjForDisplay(v: string): string {
  const d = onlyDigits(v);
  if (d.length !== 14) return "***";
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

// ─────────────────────────── comparação de nomes ────────────────────────────

const RUIDO = new Set([
  // conectivos
  "DE", "DA", "DO", "DAS", "DOS", "E",
  // formas societárias e porte
  "LTDA", "LTD", "SA", "S", "A", "ME", "EPP", "EIRELI", "MEI", "EI", "SS",
  "CIA", "COMPANHIA", "SOCIEDADE", "EMPRESA", "INDIVIDUAL", "LIMITADA",
  "ANONIMA", "SIMPLES", "UNIPESSOAL",
]);

function normalizar(v: string): string {
  return v
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // marcas de acento soltas pelo NFD
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

function tokens(v: string): string[] {
  return normalizar(v)
    .split(" ")
    .filter((t) => t.length > 0 && !RUIDO.has(t));
}

/**
 * Quão perto o nome declarado está do nome oficial na Receita.
 *
 * Jaccard sobre os tokens significativos (fora conectivos e formas
 * societárias), com dois atalhos: igualdade após normalizar vale 1, e nome
 * declarado inteiramente CONTIDO no oficial vale 1 quando tem 2+ palavras —
 * é o caso comum de "Fazenda Santa Rita" declarado contra "FAZENDA SANTA
 * RITA AGROPECUARIA LTDA" na Receita.
 *
 * Uma palavra só nunca vale containment: "AGRO" está contido em meio mundo.
 */
export function nameSimilarity(declared: string, official: string): number {
  const a = tokens(declared);
  const b = tokens(official);
  if (!a.length || !b.length) return 0;
  if (a.join(" ") === b.join(" ")) return 1;

  const setA = new Set(a);
  const setB = new Set(b);
  if (setA.size >= 2 && [...setA].every((t) => setB.has(t))) return 1;

  let intersecao = 0;
  for (const t of setA) if (setB.has(t)) intersecao++;
  const uniao = new Set([...setA, ...setB]).size;
  return uniao === 0 ? 0 : intersecao / uniao;
}

/** A partir daqui os nomes são considerados a mesma entidade. */
export const NAME_MATCH_MIN = 0.8;

// ─────────────────── Receita Federal (dados abertos, grátis) ────────────────

type ReceitaBruta = {
  razao_social?: unknown;
  nome_fantasia?: unknown;
  descricao_situacao_cadastral?: unknown;
  situacao_cadastral?: unknown;
  data_inicio_atividade?: unknown;
  cnae_fiscal?: unknown;
  cnae_fiscal_descricao?: unknown;
};

const texto = (v: unknown): string | null => {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number") return String(v);
  return null;
};

function normalizarReceita(
  raw: ReceitaBruta,
  source: "brasilapi" | "minhareceita",
): ReceitaCheck {
  const cnae = texto(raw.cnae_fiscal);
  const cnaePad = cnae ? onlyDigits(cnae).padStart(7, "0") : null;
  return {
    consulted: true,
    source,
    razao_social: texto(raw.razao_social),
    nome_fantasia: texto(raw.nome_fantasia),
    situacao_cadastral:
      texto(raw.descricao_situacao_cadastral)?.toUpperCase() ??
      texto(raw.situacao_cadastral)?.toUpperCase() ??
      null,
    data_abertura: texto(raw.data_inicio_atividade),
    cnae_codigo: cnaePad,
    cnae_descricao: texto(raw.cnae_fiscal_descricao),
    cnae_rural: cnaePad ? CNAE_RURAL_DIVISOES.includes(cnaePad.slice(0, 2)) : null,
    error: null,
  };
}

const RECEITA_VAZIA: ReceitaCheck = {
  consulted: false,
  source: null,
  razao_social: null,
  nome_fantasia: null,
  situacao_cadastral: null,
  data_abertura: null,
  cnae_codigo: null,
  cnae_descricao: null,
  cnae_rural: null,
  error: null,
};

/**
 * Consulta o CNPJ nos dados abertos da Receita. Duas fontes independentes,
 * ambas gratuitas e sem cadastro, na ordem BrasilAPI → Minha Receita: se a
 * primeira cair, engasgar ou devolver formato estranho, a segunda responde.
 *
 * Timeout curto (padrão 6s por fonte) porque isto roda DENTRO da submissão do
 * usuário: é melhor mandar o caso para a fila humana do que deixar alguém
 * olhando um botão girando. Falha de rede nunca vira reprovação — vira
 * `consulted: false`, que a regra de decisão trata como "não sei", e não sei
 * significa revisão manual.
 */
export async function consultarReceita(cnpj: string): Promise<ReceitaCheck> {
  const d = onlyDigits(cnpj);
  if (d.length !== 14) return { ...RECEITA_VAZIA, error: "cnpj_invalido" };

  const timeout = Number(process.env.PALMO_RECEITA_TIMEOUT_MS ?? 6000) || 6000;
  const fontes: { source: "brasilapi" | "minhareceita"; url: string }[] = [
    { source: "brasilapi", url: `https://brasilapi.com.br/api/cnpj/v1/${d}` },
    { source: "minhareceita", url: `https://minhareceita.org/${d}` },
  ];

  const erros: string[] = [];
  for (const { source, url } of fontes) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(timeout),
        headers: { accept: "application/json" },
        cache: "no-store",
      });
      // 404 é resposta legítima: o CNPJ não existe na base. Não adianta
      // tentar a outra fonte — as duas leem o mesmo cadastro.
      if (res.status === 404) {
        return { ...RECEITA_VAZIA, consulted: true, source, error: "nao_encontrado" };
      }
      if (!res.ok) {
        erros.push(`${source}:${res.status}`);
        continue;
      }
      const raw = (await res.json()) as ReceitaBruta;
      const parsed = normalizarReceita(raw, source);
      // Resposta 200 sem razão social é resposta quebrada: tenta a próxima.
      if (!parsed.razao_social) {
        erros.push(`${source}:sem_razao_social`);
        continue;
      }
      return parsed;
    } catch (e) {
      erros.push(`${source}:${e instanceof Error ? e.name : "erro"}`);
    }
  }

  return { ...RECEITA_VAZIA, error: erros.join(" | ") || "indisponivel" };
}

// ───────────────────────── sanidade do arquivo ──────────────────────────────

/** Avalia o metadado do objeto no bucket. Sem OCR, sem abrir a imagem. */
export function checarArquivo(
  meta: { size: number | null; mime: string | null } | null,
): FileCheck {
  if (!meta) {
    return {
      checked: true,
      ok: false,
      size_bytes: null,
      mime: null,
      problems: ["arquivo_ausente"],
    };
  }
  const problems: string[] = [];
  const mime = (meta.mime ?? "").toLowerCase().split(";")[0].trim() || null;

  if (meta.size == null) problems.push("tamanho_desconhecido");
  else if (meta.size < MIN_DOC_BYTES) problems.push("arquivo_pequeno_demais");
  else if (meta.size > MAX_DOC_BYTES) problems.push("arquivo_grande_demais");

  if (!mime) problems.push("tipo_desconhecido");
  else if (!(ACCEPTED_DOC_MIMES as readonly string[]).includes(mime))
    problems.push("tipo_nao_aceito");

  return {
    checked: true,
    ok: problems.length === 0,
    size_bytes: meta.size,
    mime,
    problems,
  };
}

// ───────────────────────────── regra de decisão ─────────────────────────────

export type DecideInput =
  | {
      tier: "pf_br";
      cpf: string;
      full_name: string;
      duplicate: DuplicateCheck;
      file: FileCheck;
    }
  | {
      tier: "pj_br";
      cnpj: string;
      razao_social: string;
      responsavel_cpf: string;
      receita: ReceitaCheck;
      duplicate: DuplicateCheck;
      file: FileCheck;
    };

/**
 * A REGRA. Uma frase: só a PJ com CNPJ válido, ativa na Receita, com razão
 * social compatível com o que foi declarado, sem duplicidade e com arquivo
 * íntegro passa sozinha. Todo o resto vai para a fila humana com os motivos
 * escritos, e nada é rejeitado automaticamente.
 *
 * Pessoa física NUNCA auto-aprova neste lote: não existe fonte pública e
 * gratuita para conferir um CPF contra a Receita — dígito verificador só
 * prova que o número é bem formado, não que ele é daquela pessoa.
 */
export function decide(input: DecideInput): KycChecks {
  const reasons: string[] = [];
  const ran_at = new Date().toISOString();

  if (input.tier === "pf_br") {
    const digits_valid = isValidCpf(input.cpf);
    if (!digits_valid) reasons.push("CPF com digito verificador invalido.");
    reasons.push(
      "Pessoa fisica: nao existe fonte publica gratuita para conferir o CPF na Receita. Conferencia humana do documento e obrigatoria.",
    );
    if (input.duplicate.found)
      reasons.push(
        `Documento ja aprovado em outra conta (${input.duplicate.documents.join(", ")}).`,
      );
    if (!input.duplicate.checked)
      reasons.push("Nao foi possivel checar duplicidade.");
    if (!input.file.ok)
      reasons.push(`Arquivo com problema: ${input.file.problems.join(", ")}.`);

    return {
      version: CHECKS_VERSION,
      ran_at,
      document: {
        kind: "cpf",
        masked: maskCpfForDisplay(input.cpf),
        digits_valid,
        responsavel_cpf_valid: null,
      },
      receita: null,
      name_match: null,
      duplicate: input.duplicate,
      file: input.file,
      reasons,
      auto_approved: false,
    };
  }

  const { receita } = input;
  const digits_valid = isValidCnpj(input.cnpj);
  const respValid = isValidCpf(input.responsavel_cpf);

  if (!digits_valid) reasons.push("CNPJ com digito verificador invalido.");
  if (!respValid)
    reasons.push("CPF do responsavel com digito verificador invalido.");

  // Nome oficial: o melhor entre razão social e nome fantasia.
  let name_match: NameMatchCheck | null = null;
  const candidatos = [receita.razao_social, receita.nome_fantasia].filter(
    (v): v is string => !!v,
  );
  if (candidatos.length) {
    let melhor = { official: candidatos[0], score: 0 };
    for (const c of candidatos) {
      const s = nameSimilarity(input.razao_social, c);
      if (s > melhor.score) melhor = { official: c, score: s };
    }
    name_match = {
      declared: input.razao_social,
      official: melhor.official,
      score: Number(melhor.score.toFixed(2)),
      compatible: melhor.score >= NAME_MATCH_MIN,
    };
  }

  if (!receita.consulted) {
    reasons.push(
      `Consulta a Receita indisponivel no momento da submissao (${receita.error ?? "sem detalhe"}).`,
    );
  } else if (receita.error === "nao_encontrado") {
    reasons.push("CNPJ nao encontrado nos dados abertos da Receita.");
  } else {
    if (receita.situacao_cadastral !== "ATIVA")
      reasons.push(
        `Situacao cadastral na Receita: ${receita.situacao_cadastral ?? "desconhecida"} (esperado ATIVA).`,
      );
    if (!name_match)
      reasons.push("Receita nao devolveu razao social para comparar.");
    else if (!name_match.compatible)
      reasons.push(
        `Razao social divergente: declarado "${name_match.declared}", Receita "${name_match.official}".`,
      );
    // CNAE é informativo: fazenda arrendada por holding familiar com CNAE de
    // participacao societaria e caso legitimo. Nunca bloqueia sozinho.
    if (receita.cnae_rural === false)
      reasons.push(
        `Informativo: CNAE principal ${receita.cnae_codigo} (${receita.cnae_descricao}) nao e de atividade rural.`,
      );
  }

  if (input.duplicate.found)
    reasons.push(
      `Documento ja aprovado em outra conta (${input.duplicate.documents.join(", ")}).`,
    );
  if (!input.duplicate.checked)
    reasons.push("Nao foi possivel checar duplicidade.");
  if (!input.file.ok)
    reasons.push(`Arquivo com problema: ${input.file.problems.join(", ")}.`);

  const auto_approved =
    digits_valid &&
    respValid &&
    receita.consulted &&
    receita.error === null &&
    receita.situacao_cadastral === "ATIVA" &&
    name_match !== null &&
    name_match.compatible &&
    input.duplicate.checked &&
    !input.duplicate.found &&
    input.file.ok;

  return {
    version: CHECKS_VERSION,
    ran_at,
    document: {
      kind: "cnpj",
      masked: formatCnpjForDisplay(input.cnpj),
      digits_valid,
      responsavel_cpf_valid: respValid,
    },
    receita,
    name_match,
    duplicate: input.duplicate,
    file: input.file,
    reasons,
    auto_approved,
  };
}

/** Frase única que vai para `decision_reason` quando a regra aprova sozinha. */
export function motivoAutoAprovacao(checks: KycChecks): string {
  const r = checks.receita;
  return [
    "Aprovacao automatica.",
    `CNPJ ${checks.document.masked} com digito valido;`,
    `situacao cadastral ATIVA na Receita (${r?.source ?? "?"});`,
    `razao social compativel (${r?.razao_social ?? "?"}, score ${checks.name_match?.score ?? "?"});`,
    "sem duplicidade em outra conta;",
    "arquivo integro.",
  ].join(" ");
}
