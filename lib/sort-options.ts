// Ordenacao de EXIBICAO dos dropdowns de selecao (finalidade, cultura,
// variedade). Ordena SEMPRE uma copia da lista pelo label exibido, em pt-BR
// (localeCompare com "pt-BR" para acentos e cedilha ordenarem certo:
// Acai, Cacau, Cafe, Cana). NUNCA altera o value das opcoes — so a ordem.
//
// Casos especiais:
//  - Opcoes cujo value e "outro"/"outra" ("Outro", "Other"...) sao pinadas
//    SEMPRE por ultimo, fora da ordem alfabetica (convencao de UX).
//  - Placeholders vazios (value "") ficam FORA deste .map no ponto de render,
//    entao continuam sempre primeiro sem passar por aqui.
//
// Nota de idioma: a collation "pt-BR" e usada para todos os idiomas do app.
// Para zh/fr/ar ela e aproximada, mas mantem a ordenacao estavel e correta
// para o conteudo latino/pt predominante — comportamento aceitavel.

type LabeledOption = { value: string; label: string };

const isOtherValue = (value: string) => value === "outro" || value === "outra";

export function sortOptionsByLabel<T extends LabeledOption>(
  options: readonly T[],
): T[] {
  return [...options].sort((a, b) => {
    const aOther = isOtherValue(a.value);
    const bOther = isOtherValue(b.value);
    if (aOther !== bOther) return aOther ? 1 : -1;
    if (aOther && bOther) return 0;
    return a.label.localeCompare(b.label, "pt-BR");
  });
}
