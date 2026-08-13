"use client";

import { useLanguage } from "@/lib/language-context";
import { formatarHectares } from "@/lib/medidas-agrarias";
import {
  caixa,
  paraMultiPoligono,
  type Caixa,
  type MultiPoligono,
} from "@/lib/geo-poligonos";

/**
 * CAMADAS AMBIENTAIS DO CAR — o mapa do anuncio publico.
 *
 * ── SEM BIBLIOTECA DE MAPA, E DE PROPOSITO ───────────────────────────────────
 * Um Leaflet ou MapLibre traria centenas de KB de JavaScript para o celular de
 * quem so quer ver o contorno de uma fazenda. O que esta tela precisa e de um
 * desenho estatico de tres poligonos: isso e um SVG, e SVG o navegador ja tem.
 * A imagem de satelite, quando existe, e uma <img> so — nao ha tile, nao ha
 * zoom, nao ha pan. Mapa que se arrasta seria outro produto.
 *
 * ── EXCECAO DE COR, DOCUMENTADA ──────────────────────────────────────────────
 * As tres camadas NAO usam a paleta do tema. Usam a linguagem semantica do
 * CAR, que e o que o produtor rural ja le no portal oficial: perimetro
 * amarelo, Reserva Legal verde, APP branca. Trocar por `primary`/`accent`
 * tornaria o mapa bonito e ilegivel para quem passa o dia olhando o SICAR.
 * A excecao vale SO para o desenho das camadas: o card, a legenda, os numeros
 * e a nota seguem o sistema de design linha por linha.
 */

/** Raio equatorial do WGS 84, para a projecao de Mercator. */
const R_MERCATOR = 6378137;

/** Proporcao do quadro do mapa (largura / altura). Retangulo baixo cabe melhor no celular. */
const PROPORCAO = 4 / 3;

/** Folga em volta do desenho, para o contorno nunca encostar na borda. */
const FOLGA = 0.08;

type Ponto = { x: number; y: number };

function paraMercator(lon: number, lat: number): Ponto {
  const travada = Math.max(-85.05, Math.min(85.05, lat));
  return {
    x: (R_MERCATOR * lon * Math.PI) / 180,
    y: R_MERCATOR * Math.log(Math.tan(Math.PI / 4 + (travada * Math.PI) / 360)),
  };
}

/** Caixa em metros de Mercator, ja com folga e ja ajustada a PROPORCAO. */
function quadro(c: Caixa): { oeste: number; sul: number; leste: number; norte: number } {
  const a = paraMercator(c[0], c[1]);
  const b = paraMercator(c[2], c[3]);
  let larg = Math.max(b.x - a.x, 1);
  let alt = Math.max(b.y - a.y, 1);
  const cx = (a.x + b.x) / 2;
  const cy = (a.y + b.y) / 2;

  larg *= 1 + FOLGA * 2;
  alt *= 1 + FOLGA * 2;

  // O quadro cresce no eixo que sobrou, nunca corta: o imovel inteiro sempre
  // aparece, e a imagem de satelite pedida usa EXATAMENTE esta mesma caixa.
  if (larg / alt < PROPORCAO) larg = alt * PROPORCAO;
  else alt = larg / PROPORCAO;

  return { oeste: cx - larg / 2, sul: cy - alt / 2, leste: cx + larg / 2, norte: cy + alt / 2 };
}

/** Multipoligono virado em atributo `d` de <path>, no espaco do viewBox. */
function caminho(mp: MultiPoligono, q: ReturnType<typeof quadro>, larguraSvg: number): string {
  const escala = larguraSvg / (q.leste - q.oeste);
  const partes: string[] = [];
  for (const pol of mp) {
    for (const anel of pol) {
      const pontos = anel.map(([lon, lat]) => {
        const p = paraMercator(lon, lat);
        return `${((p.x - q.oeste) * escala).toFixed(1)},${((q.norte - p.y) * escala).toFixed(1)}`;
      });
      if (pontos.length > 1) partes.push(`M${pontos.join("L")}Z`);
    }
  }
  return partes.join("");
}

export type CamadasAmbientaisData = {
  fetched_at: string;
  geom_perimetro: unknown;
  geom_rl: unknown;
  geom_app: unknown;
  area_total_ha: number | null;
  area_rl_ha: number | null;
  area_app_ha: number | null;
  area_rl_app_uniao_ha: number | null;
  area_util_estimada_ha: number | null;
};

/** Base do WMS de satelite, montada no servidor. `null` = fundo neutro do tema. */
export type BasemapWms = { url: string; layer: string } | null;

const LARGURA_SVG = 1000;
const ALTURA_SVG = Math.round(LARGURA_SVG / PROPORCAO);

/** Cores das camadas — a excecao documentada no topo do arquivo. */
const COR_PERIMETRO = "#ffe11e";
const COR_RL = "#97cc7e";
const COR_RL_BORDA = "#0b5417";
const COR_APP = "#ffffff";

export function CamadasAmbientais({
  camadas,
  basemap,
}: {
  camadas: CamadasAmbientaisData;
  basemap: BasemapWms;
}) {
  const { lang } = useLanguage();

  const perimetro = paraMultiPoligono(camadas.geom_perimetro);
  const rl = paraMultiPoligono(camadas.geom_rl);
  const app = paraMultiPoligono(camadas.geom_app);

  const label =
    lang === "en"
      ? {
          titulo: "Environmental layers · CAR",
          perimetro: "Property boundary",
          rl: "Legal Reserve",
          app: "Permanent Preservation Area",
          total: "Total area",
          livre: "Area declared free of LR and PPA",
          estimativa: "estimate",
          naoDeclarada: "not declared",
          fonte: (d: string) => `Source: CAR/SICAR (self-declared) · queried on ${d}`,
          ressalva: "Data declared in the CAR; it does not replace a technical survey.",
          sobreposicao: (v: string) =>
            `Legal Reserve and PPA overlap by ${v} ha. The free area subtracts the overlap only once, which is why the figures above do not add up by simple subtraction.`,
          divergencia: (v: string) =>
            `Legal Reserve and PPA areas are the ones declared in the CAR; the free area is measured over the declared outline. The two calculations differ by ${v} ha.`,
          alt: "Map of the environmental layers declared in the CAR",
          satelite: "Satellite imagery: Copernicus Sentinel-2",
        }
      : {
          titulo: "Camadas ambientais · CAR",
          perimetro: "Perímetro do imóvel",
          rl: "Reserva Legal",
          app: "Área de Preservação Permanente",
          total: "Área total",
          livre: "Área declarada livre de RL e APP",
          estimativa: "estimativa",
          naoDeclarada: "não declarada",
          fonte: (d: string) => `Fonte: CAR/SICAR (autodeclarado) · consulta em ${d}`,
          ressalva: "Dados declarados no CAR; não substituem laudo técnico.",
          sobreposicao: (v: string) =>
            `Reserva Legal e APP se sobrepõem em ${v} ha. A área livre desconta a sobreposição uma vez só, e é por isso que os números acima não fecham por subtração simples.`,
          divergencia: (v: string) =>
            `As áreas de RL e APP são as declaradas no CAR; a área livre é medida sobre o desenho declarado. As duas contas diferem em ${v} ha.`,
          alt: "Mapa das camadas ambientais declaradas no CAR",
          satelite: "Imagem de satélite: Copernicus Sentinel-2",
        };

  // Sem perimetro nao ha mapa, e sem RL nem APP declaradas nao ha o que esta
  // secao acrescente: "livre de RL e APP" seria o imovel inteiro, e a fonte
  // nao disse isso — ela nao disse nada. A secao simplesmente nao aparece.
  if (!perimetro || (!rl && !app)) return null;

  const c = caixa([perimetro, ...(rl ? [rl] : []), ...(app ? [app] : [])]);
  if (!c) return null;

  const q = quadro(c);

  // A imagem de satelite usa a MESMA caixa do SVG, em EPSG:3857, entao os dois
  // desenhos coincidem pixel a pixel. Sem as variaveis de ambiente do CDSE, a
  // <img> nem e pedida e o fundo fica no `deep` do tema.
  const urlSatelite = basemap
    ? `${basemap.url}?${new URLSearchParams({
        SERVICE: "WMS",
        REQUEST: "GetMap",
        VERSION: "1.3.0",
        LAYERS: basemap.layer,
        FORMAT: "image/jpeg",
        CRS: "EPSG:3857",
        WIDTH: String(LARGURA_SVG),
        HEIGHT: String(ALTURA_SVG),
        BBOX: `${q.oeste},${q.sul},${q.leste},${q.norte}`,
      }).toString()}`
    : null;

  const dataConsulta = new Date(camadas.fetched_at);
  const dataTexto = Number.isNaN(dataConsulta.getTime())
    ? null
    : dataConsulta.toISOString().slice(0, 10);

  // ── POR QUE OS NÚMEROS PODEM NÃO FECHAR POR SUBTRAÇÃO SIMPLES ──────────────
  // Duas causas diferentes, e cada uma merece a sua frase:
  //
  //   diferença POSITIVA  RL e APP se sobrepõem no chão (o art. 15 do Código
  //                       Florestal permite), e a área livre desconta a
  //                       sobreposição uma vez só. Medido em Araguaçu/TO:
  //                       3,78 ha.
  //   diferença NEGATIVA  RL e APP saíram do atributo oficial do CAR e a área
  //                       livre foi medida sobre o desenho; as duas contas
  //                       diferem por fração de por cento. Medido em
  //                       Itamaraju/BA: 0,12 ha em 772 ha.
  //
  // Público do agro confere conta na mão. Número que não fecha sem explicação
  // é lido como erro, e erro é lido como desleixo com o resto.
  const diferenca =
    camadas.area_rl_ha != null &&
    camadas.area_app_ha != null &&
    camadas.area_rl_app_uniao_ha != null
      ? camadas.area_rl_ha + camadas.area_app_ha - camadas.area_rl_app_uniao_ha
      : null;

  // Abaixo de 0,01 ha (100 m²) é ruído de arredondamento e não vale uma linha
  // de texto na tela de ninguém.
  const sobreposicao = diferenca != null && diferenca > 0.01 ? diferenca : null;
  const divergencia = diferenca != null && diferenca < -0.01 ? -diferenca : null;

  const numero = (v: number | null) =>
    v == null ? label.naoDeclarada : `${formatarHectares(v, lang === "en" ? "en-US" : "pt-BR")} ha`;

  return (
    <section className="mt-6 rounded-2xl border border-deep/10 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-bold uppercase tracking-wide text-primary">{label.titulo}</h2>

      {/* ── O MAPA ─────────────────────────────────────────────────────────── */}
      <div className="mt-4 overflow-hidden rounded-xl bg-deep">
        <div className="relative" style={{ aspectRatio: `${PROPORCAO}` }}>
          {urlSatelite ? (
            /* WMS externo devolve uma imagem por caixa, sem tamanho fixo
               conhecido no build: o otimizador do next/image nao tem o que
               otimizar aqui — e mandar a imagem de satelite pelo otimizador
               colocaria o nosso servidor no caminho de cada pageview. */
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={urlSatelite}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : null}
          <svg
            viewBox={`0 0 ${LARGURA_SVG} ${ALTURA_SVG}`}
            className="absolute inset-0 h-full w-full"
            role="img"
            aria-label={label.alt}
          >
            {app ? (
              <path
                d={caminho(app, q, LARGURA_SVG)}
                fill={COR_APP}
                fillOpacity={0.55}
                stroke={COR_APP}
                strokeWidth={2}
                fillRule="evenodd"
              />
            ) : null}
            {rl ? (
              <path
                d={caminho(rl, q, LARGURA_SVG)}
                fill={COR_RL}
                fillOpacity={0.5}
                stroke={COR_RL_BORDA}
                strokeWidth={2}
                fillRule="evenodd"
              />
            ) : null}
            <path
              d={caminho(perimetro, q, LARGURA_SVG)}
              fill="none"
              stroke={COR_PERIMETRO}
              strokeWidth={3}
              fillRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {/* ── LEGENDA ────────────────────────────────────────────────────────── */}
      <ul className="mt-4 flex flex-wrap gap-3">
        {[
          { cor: COR_PERIMETRO, borda: COR_PERIMETRO, texto: label.perimetro, mostrar: true },
          { cor: COR_RL, borda: COR_RL_BORDA, texto: label.rl, mostrar: Boolean(rl) },
          { cor: COR_APP, borda: "#94a3b8", texto: label.app, mostrar: Boolean(app) },
        ]
          .filter((i) => i.mostrar)
          .map((item) => (
            <li key={item.texto} className="flex items-center gap-2 text-sm text-deep/70">
              <span
                aria-hidden
                className="h-3 w-3 shrink-0 rounded-full border"
                style={{ backgroundColor: item.cor, borderColor: item.borda }}
              />
              {item.texto}
            </li>
          ))}
      </ul>

      {/* ── OS NUMEROS ─────────────────────────────────────────────────────── */}
      <dl className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-deep/5 bg-neutral/40 px-4 py-3">
          <dt className="text-xs font-bold uppercase tracking-wide text-deep/50">{label.total}</dt>
          <dd className="mt-1 font-extrabold text-deep">{numero(camadas.area_total_ha)}</dd>
        </div>
        <div className="rounded-xl border border-deep/5 bg-neutral/40 px-4 py-3">
          <dt className="text-xs font-bold uppercase tracking-wide text-deep/50">{label.rl}</dt>
          <dd className="mt-1 font-extrabold text-deep">{numero(camadas.area_rl_ha)}</dd>
        </div>
        <div className="rounded-xl border border-deep/5 bg-neutral/40 px-4 py-3">
          <dt className="text-xs font-bold uppercase tracking-wide text-deep/50">APP</dt>
          <dd className="mt-1 font-extrabold text-deep">{numero(camadas.area_app_ha)}</dd>
        </div>
        {/* Area util so aparece quando a subtracao aconteceu de verdade. */}
        {camadas.area_util_estimada_ha != null ? (
          <div className="rounded-xl border border-primary/10 bg-primary/10 px-4 py-3">
            <dt className="text-xs font-bold uppercase tracking-wide text-primary">
              {label.livre} · {label.estimativa}
            </dt>
            <dd className="mt-1 font-extrabold text-deep">
              {numero(camadas.area_util_estimada_ha)}
            </dd>
          </div>
        ) : null}
      </dl>

      {/* ── FONTE E RESSALVA ───────────────────────────────────────────────── */}
      <div className="mt-4 rounded-xl bg-neutral/40 px-4 py-2.5 text-sm text-deep/70">
        {/*
          Sem esta linha os números parecem errados para quem confere na mão:
          total menos RL menos APP NÃO dá a área livre quando as duas camadas
          se sobrepõem — e o Código Florestal (art. 15) permite que se
          sobreponham. Explicar a diferença é mais barato que ser acusado de
          errar a conta. O valor sai dos próprios números exibidos, então
          fecha exatamente com o que está na tela.
        */}
        {sobreposicao != null ? (
          <p className="mb-1">
            {label.sobreposicao(formatarHectares(sobreposicao, lang === "en" ? "en-US" : "pt-BR"))}
          </p>
        ) : null}
        {divergencia != null ? (
          <p className="mb-1">
            {label.divergencia(formatarHectares(divergencia, lang === "en" ? "en-US" : "pt-BR"))}
          </p>
        ) : null}
        {dataTexto ? <p>{label.fonte(dataTexto)}</p> : null}
        <p className="mt-1">{label.ressalva}</p>
        {urlSatelite ? <p className="mt-1">{label.satelite}</p> : null}
      </div>
    </section>
  );
}
