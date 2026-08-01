"use client";

/**
 * Campo de área com conversor de medidas agrárias — UMA verdade para as três
 * superfícies: calculadora pública (Appraiser), criação (ListingForm) e edição
 * (EditListing) de anúncio.
 *
 * Contrato: o que sai daqui é SEMPRE hectares.
 * - O valor convertido vive num `<input type="hidden" name="hectares">`, então
 *   o FormData das três telas continua idêntico ao de antes.
 * - Quando o pai guarda o valor em estado (EditListing para o dirty-check,
 *   Appraiser para os prefills), `onHectaresChange` entrega a MESMA string em
 *   hectares. Tarefa e alqueire são só camada de entrada: banco, prefills e
 *   ponte calculadora → anúncio não mudam.
 * - Prefill externo em hectares (prop `hectares` mudando por fora) volta a
 *   exibição para a unidade hectare, para o valor mostrado bater com o
 *   repassado.
 */

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/language-context";
import {
  converterParaHectares,
  linhaDeConversao,
  variantePadrao,
  variantePorId,
  variantesDe,
  type UnidadeAgraria,
} from "@/lib/medidas-agrarias";

type Props = {
  /** UF já escolhida no formulário — pré-seleciona a variante regional. */
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
  /** Recebe o valor em HECTARES a cada mudança de dígito, unidade ou variante. */
  onHectaresChange?: (hectares: string) => void;
  /**
   * Modo calculadora (herói da home): o seletor não fica permanente — uma
   * linha discreta de texto-link abaixo do campo expande o par de selects.
   */
  discreto?: boolean;
};

/** Valor em hectares (string) para um valor bruto digitado na unidade dada. */
function calcularHa(bruto: string, unidade: UnidadeAgraria, varianteId: string): string {
  if (unidade === "hectare") return bruto;
  const v = variantePorId(varianteId);
  const n = bruto === "" ? NaN : Number(bruto);
  if (!v || !Number.isFinite(n)) return "";
  return String(converterParaHectares(n, v.m2));
}

export function CampoDeArea({
  uf,
  inputCls,
  id = "hectares",
  name = "hectares",
  required = false,
  placeholder,
  defaultHectares,
  hectares,
  onHectaresChange,
  discreto = false,
}: Props) {
  const { lang } = useLanguage();
  const locale = lang === "en" ? "en-US" : "pt-BR";

  const [unidade, setUnidade] = useState<UnidadeAgraria>("hectare");
  const [varianteId, setVarianteId] = useState("");
  // O que a pessoa digitou, na unidade escolhida (em hectare = o próprio valor).
  const [bruto, setBruto] = useState(() => hectares ?? defaultHectares ?? "");
  const [aberto, setAberto] = useState(false);
  // Último valor que ESTE componente reportou ao pai — distingue o eco do
  // próprio onChange de um prefill externo (ponte da calculadora, goToCalc…).
  // É estado (não ref) porque a sincronização abaixo o lê durante o render.
  const [ultimoReportado, setUltimoReportado] = useState<string | null>(null);
  // Depois que a pessoa escolhe a variante na mão, a UF para de sobrescrevê-la.
  const varianteTocadaRef = useRef(false);

  // Sincronização com a prop controlada no padrão "derivar durante o render"
  // (sem setState em efeito). Prefill externo em hectares SEMPRE devolve a
  // exibição para hectare: o número na tela tem de ser o número repassado.
  const [propVista, setPropVista] = useState(hectares);
  if (hectares !== undefined && hectares !== propVista) {
    setPropVista(hectares);
    if (hectares !== ultimoReportado) {
      setBruto(hectares);
      if (unidade !== "hectare") setUnidade("hectare");
    }
  }

  // UF trocou e a variante nunca foi tocada: re-seleciona a variante regional
  // da UF nova (BA → tarefa BA, SP → alqueire paulista…). setState dentro de
  // queueMicrotask — padrão do projeto para react-hooks/set-state-in-effect.
  useEffect(() => {
    if (unidade === "hectare" || varianteTocadaRef.current) return;
    const padrao = variantePadrao(unidade, uf).id;
    if (padrao === varianteId) return;
    queueMicrotask(() => {
      setVarianteId(padrao);
      const ha = calcularHa(bruto, unidade, padrao);
      setUltimoReportado(ha);
      onHectaresChange?.(ha);
    });
  }, [uf, unidade, bruto, varianteId, onHectaresChange]);

  const varAtiva =
    unidade === "hectare"
      ? null
      : (variantePorId(varianteId) ?? variantePadrao(unidade, uf));
  const numero = bruto === "" ? NaN : Number(bruto);
  const haString = calcularHa(bruto, unidade, varAtiva?.id ?? "");

  function reportar(ha: string) {
    setUltimoReportado(ha);
    onHectaresChange?.(ha);
  }

  function aoDigitar(valor: string) {
    setBruto(valor);
    reportar(calcularHa(valor, unidade, varAtiva?.id ?? ""));
  }

  function aoTrocarUnidade(valor: string) {
    const nova = valor as UnidadeAgraria;
    setUnidade(nova);
    varianteTocadaRef.current = false;
    let novaVariante = "";
    if (nova !== "hectare") {
      novaVariante = variantePadrao(nova, uf).id;
      setVarianteId(novaVariante);
    }
    reportar(calcularHa(bruto, nova, novaVariante));
  }

  function aoTrocarVariante(idNovo: string) {
    varianteTocadaRef.current = true;
    setVarianteId(idNovo);
    reportar(calcularHa(bruto, unidade, idNovo));
  }

  const label =
    lang === "en"
      ? {
          unidade: "Unit of measure",
          variante: "Regional variant",
          hectare: "Hectare (ha)",
          tarefa: "Tarefa",
          alqueire: "Alqueire",
          abrir: "Prefer to enter tarefas or alqueires?",
        }
      : {
          unidade: "Unidade de medida",
          variante: "Variante regional",
          hectare: "Hectare (ha)",
          tarefa: "Tarefa",
          alqueire: "Alqueire",
          abrir: "Prefere informar em tarefas ou alqueires?",
        };

  const seletores = (
    <div className="mt-2 grid gap-2 sm:grid-cols-2">
      <select
        aria-label={label.unidade}
        value={unidade}
        onChange={(e) => aoTrocarUnidade(e.target.value)}
        className={`${inputCls} mt-0 text-sm`}
      >
        <option value="hectare">{label.hectare}</option>
        <option value="tarefa">{label.tarefa}</option>
        <option value="alqueire">{label.alqueire}</option>
      </select>
      {unidade !== "hectare" && varAtiva && (
        <select
          aria-label={label.variante}
          value={varAtiva.id}
          onChange={(e) => aoTrocarVariante(e.target.value)}
          className={`${inputCls} mt-0 text-sm`}
        >
          {variantesDe(unidade).map((v) => (
            <option key={v.id} value={v.id}>
              {lang === "en" ? v.labelEn : v.labelPt}
            </option>
          ))}
        </select>
      )}
    </div>
  );

  return (
    <div>
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
      {discreto && !aberto ? (
        <button
          type="button"
          onClick={() => setAberto(true)}
          className="mt-1.5 text-xs font-bold text-primary underline transition-colors hover:text-primary-dark"
        >
          {label.abrir}
        </button>
      ) : (
        seletores
      )}
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
