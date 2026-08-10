"use client";

/**
 * Campo de área com conversor de medidas agrárias — UMA verdade para as três
 * superfícies: calculadora pública (Appraiser), criação (ListingForm) e edição
 * (EditListing) de anúncio.
 *
 * UI: input + UM dropdown plano de unidade ao lado (Hectares, Tarefas BA/CE/
 * AL-SE, Alqueire SP/MG-GO/Norte). Padrão de seletor de moeda: descoberto sem
 * leitura, um toque a menos que o antigo par link → dois selects.
 *
 * Contrato (inalterado): o que sai daqui é SEMPRE hectares.
 * - O valor convertido vive num `<input type="hidden" name="hectares">`, então
 *   o FormData das três telas continua idêntico ao de antes.
 * - Quando o pai guarda o valor em estado (EditListing para o dirty-check,
 *   Appraiser para os prefills), `onHectaresChange` entrega a MESMA string em
 *   hectares. Tarefa e alqueire são só camada de entrada.
 * - Prefill externo em hectares (prop `hectares` mudando por fora) volta a
 *   exibição para "Hectares (ha)", para o valor mostrado bater com o
 *   repassado.
 */

import { useState } from "react";
import { useLanguage } from "@/lib/language-context";
import {
  converterParaHectares,
  linhaDeConversao,
  variantePorId,
  VARIANTES_AGRARIAS,
} from "@/lib/medidas-agrarias";

type Props = {
  /** UF do formulário. Mantida na assinatura (chamadas existentes) — o
   *  dropdown plano dispensa pré-seleção regional. */
  uf: string;
  /** Classe compartilhada de input da tela, para o campo ficar igual aos vizinhos. */
  inputCls: string;
  id?: string;
  /** Nome do campo no FormData — carrega SEMPRE hectares. */
  name?: string;
  required?: boolean;
  placeholder?: string;
  /** Valor inicial em hectares (superfície não controlada, ex.: ListingForm). */
  defaultHectares?: string;
  /** Valor em hectares controlado pelo pai (EditListing, Appraiser). */
  hectares?: string;
  /** Recebe o valor em HECTARES a cada mudança de dígito ou unidade. */
  onHectaresChange?: (hectares: string) => void;
  /** Aceita e ignora: o modo "texto-link" foi substituído pelo dropdown
   *  permanente. Fica na assinatura para as chamadas existentes compilarem;
   *  remover das três superfícies na próxima varredura. */
  discreto?: boolean;
};

/** "hectare" ou o id de uma variante de lib/medidas-agrarias. */
type Selecao = "hectare" | string;

/** Rótulo curto do dropdown (o fechado precisa caber em 390 px). */
const ROTULO_CURTO: Record<string, string> = {
  "tarefa-ba": "Tarefas (BA)",
  "tarefa-ce": "Tarefas (CE)",
  "tarefa-al-se": "Tarefas (AL/SE)",
  "alqueire-paulista": "Alqueire (SP)",
  "alqueire-mineiro-goiano": "Alqueire (MG/GO)",
  "alqueire-norte": "Alqueire (Norte)",
};

/** Valor em hectares (string) para um valor bruto digitado na seleção dada. */
function calcularHa(bruto: string, selecao: Selecao): string {
  if (selecao === "hectare") return bruto;
  const v = variantePorId(selecao);
  const n = bruto === "" ? NaN : Number(bruto);
  if (!v || !Number.isFinite(n)) return "";
  return String(converterParaHectares(n, v.m2));
}

export function CampoDeArea({
  uf: _uf,
  inputCls,
  id = "hectares",
  name = "hectares",
  required = false,
  placeholder,
  defaultHectares,
  hectares,
  onHectaresChange,
  discreto: _discreto = false,
}: Props) {
  const { lang } = useLanguage();
  const locale = lang === "en" ? "en-US" : "pt-BR";

  const [selecao, setSelecao] = useState<Selecao>("hectare");
  // O que a pessoa digitou, na unidade escolhida (em hectare = o próprio valor).
  const [bruto, setBruto] = useState(() => hectares ?? defaultHectares ?? "");
  // Último valor que ESTE componente reportou ao pai — distingue o eco do
  // próprio onChange de um prefill externo (ponte da calculadora, goToCalc…).
  // É estado (não ref) porque a sincronização abaixo o lê durante o render.
  const [ultimoReportado, setUltimoReportado] = useState<string | null>(null);

  // Sincronização com a prop controlada no padrão "derivar durante o render"
  // (sem setState em efeito). Prefill externo em hectares SEMPRE devolve a
  // exibição para hectare: o número na tela tem de ser o número repassado.
  const [propVista, setPropVista] = useState(hectares);
  if (hectares !== undefined && hectares !== propVista) {
    setPropVista(hectares);
    if (hectares !== ultimoReportado) {
      setBruto(hectares);
      if (selecao !== "hectare") setSelecao("hectare");
    }
  }

  const varAtiva = selecao === "hectare" ? null : (variantePorId(selecao) ?? null);
  const numero = bruto === "" ? NaN : Number(bruto);
  const haString = calcularHa(bruto, selecao);

  function reportar(ha: string) {
    setUltimoReportado(ha);
    onHectaresChange?.(ha);
  }

  function aoDigitar(valor: string) {
    setBruto(valor);
    reportar(calcularHa(valor, selecao));
  }

  function aoTrocarSelecao(valor: string) {
    setSelecao(valor);
    reportar(calcularHa(bruto, valor));
  }

  const rotuloUnidade = lang === "en" ? "Unit of measure" : "Unidade de medida";
  const rotuloHectare = "Hectares (ha)";

  return (
    <div>
      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <input
            id={id}
            type="number"
            min="1"
            step="any"
            required={required}
            value={bruto}
            onChange={(e) => aoDigitar(e.target.value)}
            placeholder={placeholder}
            className={inputCls}
          />
        </div>
        <div className="w-[45%] max-w-[13.5rem] shrink-0">
          <select
            aria-label={rotuloUnidade}
            value={selecao}
            onChange={(e) => aoTrocarSelecao(e.target.value)}
            className={`${inputCls} text-sm`}
          >
            <option value="hectare">{rotuloHectare}</option>
            {VARIANTES_AGRARIAS.map((v) => (
              <option key={v.id} value={v.id}>
                {ROTULO_CURTO[v.id] ?? v.labelPt}
              </option>
            ))}
          </select>
        </div>
      </div>
      {varAtiva && Number.isFinite(numero) && numero > 0 && (
        <p className="mt-1.5 text-xs font-semibold leading-relaxed text-deep/60">
          {linhaDeConversao(numero, varAtiva, locale)}
        </p>
      )}
      {/* O contrato: o FormData sempre recebe HECTARES, neste hidden. */}
      <input type="hidden" name={name} value={haString} />
    </div>
  );
}
