/**
 * Templates dos contratos padrão Palmo — blocos operacionais da Sala do
 * Contrato. Fonte humana completa: docs/contratos/*.md (minutas v0.1,
 * sujeitas a revisão por advogado agrarista antes do uso real).
 * O texto JURÍDICO é sempre em português (língua do foro).
 * Arquivo mantido por humano — agentes: somente leitura.
 */

export type ContractType = "arrendamento" | "parceria";

export type ContractBlock = {
  key: string;
  title: string;
  /** texto com {{PLACEHOLDERS}} */
  body: string;
  /** blocos-núcleo não podem ser removidos, só discutidos */
  core?: boolean;
};

/** prazos mínimos legais (Dec. 59.566/66, art. 13), por finalidade */
export const MIN_YEARS_BY_PURPOSE: Record<string, number> = {
  graos: 3,
  horticultura: 3,
  pecuaria_corte: 3,
  pecuaria_leite: 3,
  avicultura_suinocultura: 3,
  aquicultura: 3,
  cana: 5,
  lavoura_permanente: 5,
  fruticultura: 5,
  extrativismo: 5,
  silvicultura: 7,
  reflorestamento_carbono: 7,
};
export const DEFAULT_MIN_YEARS = 3;

/** teto absoluto da quota do proprietário na parceria (art. 96, VI) */
export const PARCERIA_MAX_SHARE = 75;
export const PARCERIA_SHARE_HINT =
  "Quota legal do proprietário: 20% (só terra nua) a 75% (hipóteses específicas), conforme o que ele fornece — art. 96, VI do Estatuto da Terra.";

export function minYearsFor(purpose: string): number {
  return MIN_YEARS_BY_PURPOSE[purpose] ?? DEFAULT_MIN_YEARS;
}

export function fillBlocks(
  blocks: ContractBlock[],
  data: Record<string, string>,
): ContractBlock[] {
  return blocks.map((b) => ({
    ...b,
    body: b.body.replace(/\{\{(\w+)\}\}/g, (_, k: string) => data[k] ?? `{{${k}}}`),
  }));
}

const BENFEITORIAS: ContractBlock = {
  key: "benfeitorias",
  title: "Benfeitorias e estado de devolução (núcleo)",
  core: true,
  body:
    "O imóvel será devolvido, ao término, em estado de conservação e produtividade IGUAL OU SUPERIOR ao registrado no Laudo de Vistoria de Entrada (Anexo I). Fica vedado o uso predatório: práticas que degradem solo, água, vegetação nativa ou benfeitorias. Benfeitorias necessárias são indenizáveis independentemente de autorização; úteis dependem de autorização escrita e, autorizadas, são indenizáveis; voluptuárias não são indenizáveis e podem ser levantadas sem dano. Laudo de Vistoria de Saída (Anexo II) realizado em conjunto até 30 dias antes do término; divergências apuradas serão indenizadas por quem lhes deu causa. As partes autorizam imagens de satélite e registros da plataforma Palmo como prova complementar do estado do imóvel.",
};

const CONSERVACAO: ContractBlock = {
  key: "conservacao",
  title: "Conservação e conformidade",
  body:
    "Observância da legislação ambiental e trabalhista; práticas de conservação de solo e água compatíveis com a região; respeito a APP e Reserva Legal. ITR: {{RESP_ITR}}. Custos da atividade: parte que explora.",
};

const GERAIS: ContractBlock = {
  key: "gerais",
  title: "Disposições gerais",
  body:
    "Registro facultativo no CRI para eficácia perante terceiros. Comunicações válidas pelos canais da plataforma Palmo e endereços declarados. Assinatura eletrônica nos termos da Lei 14.063/2020, com 2 (duas) testemunhas.",
};

const FORO: ContractBlock = {
  key: "foro",
  title: "Foro",
  core: true,
  body:
    "Fica eleito o foro da comarca de situação do imóvel ({{COMARCA}}/{{IMOVEL_UF}}), com renúncia a qualquer outro.",
};

export const ARRENDAMENTO_BLOCKS: ContractBlock[] = [
  {
    key: "partes",
    title: "Partes",
    body:
      "ARRENDADOR(A): {{PROPRIETARIO_NOME}}, CPF/CNPJ {{PROPRIETARIO_DOC}}. ARRENDATÁRIO(A): {{PRODUTOR_NOME}}, CPF/CNPJ {{PRODUTOR_DOC}}. Regem-se as partes por este contrato e, no que couber, pelas normas cogentes do Estatuto da Terra (Lei 4.504/64) e do Decreto 59.566/66.",
  },
  {
    key: "objeto",
    title: "Objeto",
    body:
      'Imóvel rural "{{IMOVEL_TITULO}}", em {{IMOVEL_MUNICIPIO}}/{{IMOVEL_UF}}, área arrendada de {{IMOVEL_HECTARES}} ha, CAR nº {{IMOVEL_CAR}}, matrícula nº {{IMOVEL_MATRICULA}}. Integra este contrato o Laudo de Vistoria de Entrada (Anexo I), com registro fotográfico do estado do imóvel na data de início.',
  },
  {
    key: "finalidade",
    title: "Finalidade",
    body:
      "Destinação exclusiva: {{FINALIDADE}} — {{CULTURA}}. Alteração de finalidade exige aditivo escrito e assinado por ambas as partes.",
  },
  {
    key: "prazo",
    title: "Prazo",
    body:
      "Prazo de {{PRAZO_ANOS}} anos, com início em {{INICIO}}, respeitados os mínimos legais do Decreto 59.566/66. Retomada ao término mediante notificação com 6 meses de antecedência; no silêncio, renovação nos termos da lei.",
  },
  {
    key: "preco",
    title: "Preço e pagamento",
    body:
      "Preço anual de R$ {{PRECO_TOTAL_ANO}} ({{PRECO_HA_ANO}}/ha/ano), pago em {{FORMA_PAGAMENTO}}, vencimento em {{VENCIMENTO}}, reajuste anual pelo {{INDICE_REAJUSTE}}. O preço tomou por referência a faixa pública da calculadora Palmo, de conhecimento das partes.",
  },
  BENFEITORIAS,
  CONSERVACAO,
  {
    key: "preferencia",
    title: "Preferência",
    body:
      "Em caso de alienação do imóvel na vigência, o ARRENDATÁRIO tem direito de preferência, na forma do art. 92 do Estatuto da Terra.",
  },
  {
    key: "rescisao",
    title: "Rescisão",
    body:
      "Causas de rescisão, com indenização pela parte que der causa: inadimplemento superior a {{DIAS_MORA}} dias; desvio de finalidade; uso predatório comprovado; descumprimento das cláusulas de benfeitorias e conservação.",
  },
  GERAIS,
  FORO,
];

export const PARCERIA_BLOCKS: ContractBlock[] = [
  {
    key: "partes",
    title: "Partes",
    body:
      "PARCEIRO(A)-OUTORGANTE: {{PROPRIETARIO_NOME}}, CPF/CNPJ {{PROPRIETARIO_DOC}}. PARCEIRO(A)-OUTORGADO(A): {{PRODUTOR_NOME}}, CPF/CNPJ {{PRODUTOR_DOC}}. Regência: Lei 4.504/64 (arts. 96 e ss.) e Decreto 59.566/66.",
  },
  {
    key: "objeto",
    title: "Objeto e finalidade",
    body:
      'Parceria sobre o imóvel "{{IMOVEL_TITULO}}", {{IMOVEL_MUNICIPIO}}/{{IMOVEL_UF}}, {{IMOVEL_HECTARES}} ha, CAR {{IMOVEL_CAR}}, matrícula {{IMOVEL_MATRICULA}}, para {{FINALIDADE}} — {{CULTURA}}. Integra o contrato o Laudo de Vistoria de Entrada (Anexo I).',
  },
  {
    key: "contribuicoes",
    title: "Contribuições das partes",
    body:
      "O OUTORGANTE contribui com: {{CONTRIBUICOES_PROPRIETARIO}}. O OUTORGADO contribui com: {{CONTRIBUICOES_PRODUTOR}} (trabalho, gestão e demais itens acordados).",
  },
  {
    key: "partilha",
    title: "Partilha dos frutos",
    core: true,
    body:
      "Partilha da produção (ou de sua receita líquida): {{PERCENTUAL_PROPRIETARIO}}% ao OUTORGANTE e {{PERCENTUAL_PRODUTOR}}% ao OUTORGADO, respeitadas as quotas-limite do art. 96, VI do Estatuto da Terra. Apuração por {{CRITERIO_APURACAO}}, com acesso de ambas as partes aos registros. Risco compartilhado: em frustração de safra por caso fortuito ou força maior, a partilha percentual aplica-se ao que houver.",
  },
  {
    key: "prazo",
    title: "Prazo",
    body:
      "{{PRAZO_ANOS}} anos, a partir de {{INICIO}}, respeitados os mínimos legais. Retomada mediante notificação com 6 meses de antecedência; no silêncio, renovação nos termos legais.",
  },
  BENFEITORIAS,
  CONSERVACAO,
  {
    key: "rescisao",
    title: "Rescisão",
    body:
      "Desvio de finalidade, uso predatório, fraude na apuração da partilha ou descumprimento das cláusulas de benfeitorias e conservação, com indenização pela parte que der causa.",
  },
  GERAIS,
  FORO,
];

export function blocksFor(type: ContractType): ContractBlock[] {
  return type === "arrendamento" ? ARRENDAMENTO_BLOCKS : PARCERIA_BLOCKS;
}
