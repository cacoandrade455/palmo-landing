/**
 * URLs limpas do marketplace público: /terra/<slug>--<uuid>.
 * O slug é decorativo (título legível para humanos e para o WhatsApp);
 * quem resolve a listagem é SEMPRE o uuid no final — qualquer prefixo
 * é aceito, então links antigos ou editados à mão continuam funcionando.
 */

const UUID_RE =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/** Minúsculas sem acento, tudo que não é [a-z0-9] vira hífen. */
function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Caminho canônico de uma listagem pública. */
export function listingPath(l: {
  id: string;
  title: string;
  municipality: string;
  state: string;
}): string {
  const slug = slugify(`${l.title} ${l.municipality} ${l.state}`);
  return slug ? `/terra/${slug}--${l.id}` : `/terra/${l.id}`;
}

/** Extrai o uuid de um segmento /terra/[id-ou-slug]; null se não houver. */
export function listingIdFromParam(param: string): string | null {
  const m = decodeURIComponent(param).match(UUID_RE);
  return m ? m[0].toLowerCase() : null;
}
