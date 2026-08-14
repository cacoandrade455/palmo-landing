import "server-only";

/**
 * FUNDO DE SATÉLITE DO MAPA — opcional, e opcional de verdade.
 *
 * ── AS VARIÁVEIS ────────────────────────────────────────────────────────────
 * `CDSE_WMS_URL`    URL base do WMS do Copernicus Data Space Ecosystem,
 *                   incluindo o id da instância. Formato:
 *                   https://sh.dataspace.copernicus.eu/ogc/wms/<instance-id>
 * `CDSE_WMS_LAYER`  nome da camada configurada na instância. Opcional;
 *                   sem ela, `TRUE_COLOR`.
 *
 * ⚠️  `.env` é intocável por agente (regra 4 do CLAUDE.md). Estas duas variáveis
 *     estão DOCUMENTADAS aqui e no PR, e quem as cria é o Carlos. Enquanto não
 *     existirem, o mapa desenha sobre o fundo `deep` do tema e a página fica
 *     exatamente igual em tudo mais. Nada quebra, nada some, nada avisa.
 *
 * ── SEM `NEXT_PUBLIC_`, E MESMO ASSIM O ID APARECE ──────────────────────────
 * A URL é montada no servidor, mas a imagem quem busca é o navegador — então o
 * id da instância aparece no HTML da página. Isso é inerente a qualquer fundo
 * de mapa carregado pelo cliente, e não é contornável sem proxiar a imagem
 * (o que colocaria uma chamada externa por pageview no nosso servidor, que é
 * exatamente o que a doutrina de civilidade deste lote evita). O jeito certo
 * de proteger a instância é do outro lado: o Sentinel Hub permite restringir
 * a instância por domínio. Fica registrado para quem for criar a variável.
 *
 * Ficar sem `NEXT_PUBLIC_` ainda vale a pena: assim o valor só entra no HTML
 * das páginas que realmente desenham um mapa, e não no bundle inteiro.
 */

export type BasemapSatelite = { url: string; layer: string } | null;

export function basemapSatelite(): BasemapSatelite {
  const url = process.env.CDSE_WMS_URL?.trim();
  if (!url) return null;
  // Aceita só http(s): uma variável mal preenchida não vira `javascript:` nem
  // `data:` dentro de um atributo `src`.
  if (!/^https?:\/\//i.test(url)) return null;
  return { url, layer: process.env.CDSE_WMS_LAYER?.trim() || "TRUE_COLOR" };
}
