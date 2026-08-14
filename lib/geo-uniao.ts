import "server-only";

import * as polyclip from "polyclip-ts";

import { paraMultiPoligono, type MultiPoligono } from "./geo-poligonos";

/**
 * UNIÃO DE POLÍGONOS — a única operação deste lote que não cabe em trinta
 * linhas honestas, e por isso a única que trouxe dependência.
 *
 * ── POR QUE UNIÃO, E NÃO SOMA ────────────────────────────────────────────────
 * O Código Florestal (art. 15) PERMITE computar a APP dentro da Reserva Legal.
 * Ou seja: sobreposição entre RL e APP não é erro de cadastro, é o caso comum.
 * Somar as áreas das duas camadas contaria a interseção duas vezes e faria a
 * "área livre" aparecer MENOR do que é. Unir primeiro, medir depois, é a única
 * conta que não mente.
 *
 * ── POR QUE `polyclip-ts` ────────────────────────────────────────────────────
 * MIT, sem dependência transitiva pesada, e é o sucessor mantido do
 * `polygon-clipping` (que parou em 2023 e falha em entradas reais com
 * "Unable to complete output ring"). Faz a aritmética em BigNumber, o que
 * custa tempo que aqui não importa: a conta roda UMA VEZ por evento de
 * anúncio, no servidor, nunca por pageview.
 *
 * ── E QUANDO A UNIÃO FALHA ───────────────────────────────────────────────────
 * Devolve `null`, e quem chama NÃO exibe o número. Regra 6 do CLAUDE.md:
 * sem dado com lastro, o elemento simplesmente não aparece. O que não pode
 * acontecer é a falha virar uma soma aproximada disfarçada de medida.
 */
export function uniao(partes: MultiPoligono[]): MultiPoligono | null {
  const validas = partes.filter((p) => p.length > 0);
  if (validas.length === 0) return null;

  try {
    // A assinatura é union(primeira, ...demais). Com uma parte só, ainda vale
    // a pena passar pela biblioteca: ela também normaliza autointerseção
    // dentro da própria camada, que é sobreposição igualmente contada em
    // dobro.
    const [primeira, ...demais] = validas as unknown as [
      polyclip.Geom,
      ...polyclip.Geom[],
    ];
    const bruto = polyclip.union(primeira, ...demais);
    return paraMultiPoligono({ type: "MultiPolygon", coordinates: bruto });
  } catch {
    return null;
  }
}
