"use client";

import { useEffect, useState } from "react";

/** Município do IBGE: o nome é o que a pessoa vê, o id é o que o CAR precisa. */
export type Municipio = { nome: string; id: number };

/**
 * Lista de municípios de uma UF, via API do IBGE, com cache por UF na memória
 * do componente.
 *
 * ── POR QUE ISTO É UM HOOK COMPARTILHADO ─────────────────────────────────────
 * Criar anúncio e editar anúncio precisam exatamente da mesma coisa, e esta é a
 * parte do formulário com mais armadilha:
 *
 *   • o sentinela `"error"` é um estado de verdade, não um detalhe: quando a API
 *     do IBGE cai, o campo tem de virar texto livre, e nesse caminho NÃO EXISTE
 *     código IBGE para capturar. Isso não é falha — é indeterminado, e a
 *     checagem do CAR trata como indeterminado, nunca como divergência;
 *   • o prefill da calculadora casa por NOME, porque nome é o único dado que a
 *     ponte carrega. Comparar por id quebraria o prefill em silêncio;
 *   • `react-hooks/set-state-in-effect`: o código IBGE selecionado é DERIVADO,
 *     nunca estado novo escrito dentro de efeito.
 *
 * Duplicar isso em dois formulários seria criar duas verdades e perder uma
 * delas na primeira mudança.
 */
export function useMunicipios(ufSel: string) {
  const [muniByUf, setMuniByUf] = useState<Record<string, Municipio[] | "error">>({});

  useEffect(() => {
    if (!ufSel || muniByUf[ufSel]) return;
    let cancelled = false;
    fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${ufSel}/municipios?orderBy=nome`,
    )
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((list: { nome: string; id: number }[]) => {
        if (!cancelled) {
          setMuniByUf((p) => ({
            ...p,
            [ufSel]: list.map((m) => ({ nome: m.nome, id: m.id })),
          }));
        }
      })
      .catch(() => {
        if (!cancelled) setMuniByUf((p) => ({ ...p, [ufSel]: "error" }));
      });
    return () => {
      cancelled = true;
    };
  }, [ufSel, muniByUf]);

  const entry = ufSel ? muniByUf[ufSel] : undefined;
  const municipios = Array.isArray(entry) ? entry : [];

  return {
    /** Lista carregada, ou vazia enquanto carrega / se falhou. */
    municipios,
    /** A API do IBGE falhou: o campo precisa virar texto livre. */
    falhou: entry === "error",
    /** A entrada crua, para efeitos que precisam saber quando ela mudou. */
    entry,
    /** Código IBGE de um nome, ou null. Derivado: nunca vira estado. */
    codigoDe(nome: string): number | null {
      return municipios.find((m) => m.nome === nome)?.id ?? null;
    },
  };
}
