/**
 * PIPELINE DE FOTO DO ANÚNCIO — o que acontece com o arquivo antes de existir
 * publicamente.
 *
 * ── POR QUE ISTO É REQUISITO DE SEGURANÇA, NÃO REFINAMENTO ───────────────────
 * Foto de celular carrega coordenada GPS no EXIF. Terra parada com localização
 * exata pública, no Brasil, é convite para invasão e grilagem. O dono da terra
 * não tem como saber que o arquivo dele conta isso. Nós temos.
 *
 * Por isso o cliente NUNCA grava no bucket público. O caminho é:
 *
 *   navegador → upload assinado → bucket PRIVADO de staging
 *            → servidor lê, valida, limpa e converte
 *            → bucket PÚBLICO (só o WebP tratado)
 *            → original de staging é apagado
 *
 * ── POR QUE NÃO É SERVER ACTION RECEBENDO O ARQUIVO ──────────────────────────
 * Dois números conferidos na documentação vigente (jul/2026):
 *   • `experimental.serverActions.bodySizeLimit` default 1 MB
 *   • teto DURO de payload da Vercel: 4,5 MB, sem variação por plano
 *     documentada — `bodySizeLimit` não vence isso, a requisição morre com 413
 *     na borda antes de chegar no nosso código
 * Foto de celular moderna passa de 4,5 MB com facilidade.
 *
 * E há uma terceira razão, específica deste repo: existe `proxy.ts` com matcher
 * pegando quase toda rota. Com proxy ativo o Next CLONA o corpo da requisição
 * em memória e, ao passar do limite, TRUNCA EM SILÊNCIO — sem erro para o
 * cliente. O modo de falha seria foto corrompida, não falha visível.
 *
 * Com upload assinado os bytes da foto nunca atravessam um request body do
 * Next, então nem o teto de 4,5 MB nem o truncamento do proxy entram em jogo.
 * E é o padrão que o repo JÁ usa para KYC (`Verification.tsx`,
 * `GlobalKycWizard.tsx` sobem direto para o Storage).
 */

import "server-only";

import sharp from "sharp";

import {
  MAX_FOTO_BYTES,
  MIN_FOTO_BYTES,
  LADO_MAXIMO_PX,
  WEBP_QUALIDADE,
  detectarTipo,
  type TipoFoto,
} from "./photo-limits";

// Reexporta a parte pura para quem já importava daqui no servidor. O
// navegador precisa importar de `photo-limits` diretamente: qualquer import
// deste arquivo arrasta o binário do sharp para o bundle do cliente.
export * from "./photo-limits";

export type FotoProcessada = {
  ok: true;
  bytes: Buffer;
  largura: number;
  altura: number;
  tipoOrigem: TipoFoto;
  bytesOrigem: number;
  /** Metadado achado na ORIGEM — vai para a auditoria, nunca para o arquivo. */
  origemTinha: { exif: boolean; gpsProvavel: boolean; icc: boolean; xmp: boolean };
};

export type FotoRejeitada = {
  ok: false;
  /** Chave estável; a copy em PT/EN vive no componente. */
  motivo:
    | "vazio"
    | "muito_pequeno"
    | "muito_grande"
    | "tipo_nao_suportado"
    | "heic_nao_decodificavel"
    | "falha_processamento";
  detalhe: string;
};

export type ResultadoFoto = FotoProcessada | FotoRejeitada;

/**
 * Recebe os bytes crus e devolve o WebP limpo, ou a rejeição. Nunca lança.
 *
 * ── A GARANTIA DE REMOÇÃO DE EXIF ────────────────────────────────────────────
 * O sharp DESCARTA todo metadado por default: só preserva se alguém chamar
 * `.withMetadata()`, e nós não chamamos em lugar nenhum. Não dependemos só
 * disso — o teste manual do PR confere o arquivo servido.
 *
 * Medido em 29/07/2026 neste repo (sharp 0.34.5 / libvips 8.17.3), com JPEG
 * 2000x1500 carregando 210 bytes de EXIF (GPS 10°49'30"S 42°43'50"W, Make
 * "Apple", Model "iPhone 15 Pro"):
 *
 *   saída WebP 1600x1200 → exif AUSENTE, icc AUSENTE, xmp AUSENTE, e a
 *   varredura bruta de bytes não acha "Exif", "GPS", "Apple" nem "iPhone".
 *
 * ── POR QUE `.rotate()` VEM ANTES DO RESIZE ──────────────────────────────────
 * A orientação da foto de celular vive numa TAG EXIF. Se a gente apagar o EXIF
 * sem aplicar a rotação, foto tirada em retrato sai deitada. `.rotate()` sem
 * argumento auto-orienta a partir do EXIF e então descarta a tag — é o único
 * jeito de limpar o metadado sem estragar o enquadramento.
 */
export async function processarFoto(entrada: Uint8Array): Promise<ResultadoFoto> {
  if (!entrada || entrada.length === 0) {
    return { ok: false, motivo: "vazio", detalhe: "arquivo sem bytes" };
  }
  if (entrada.length < MIN_FOTO_BYTES) {
    return {
      ok: false,
      motivo: "muito_pequeno",
      detalhe: `${entrada.length} bytes, minimo ${MIN_FOTO_BYTES}`,
    };
  }
  if (entrada.length > MAX_FOTO_BYTES) {
    return {
      ok: false,
      motivo: "muito_grande",
      detalhe: `${entrada.length} bytes, maximo ${MAX_FOTO_BYTES}`,
    };
  }

  const tipoOrigem = detectarTipo(entrada);
  if (!tipoOrigem) {
    return {
      ok: false,
      motivo: "tipo_nao_suportado",
      detalhe: "magic bytes nao correspondem a jpeg, png, webp ou heic",
    };
  }

  try {
    const origem = sharp(Buffer.from(entrada), { failOn: "error" });
    const meta = await origem.metadata();

    // O que a origem carregava. Registrado na auditoria para podermos provar
    // que havia GPS e que ele não saiu do servidor.
    const exifBuf = meta.exif;
    const origemTinha = {
      exif: !!exifBuf,
      // Heurística honesta: a assinatura "GPS" dentro do bloco EXIF cru. Não
      // decodificamos o EXIF, porque não queremos a coordenada nem em memória.
      gpsProvavel: !!exifBuf && exifBuf.includes(Buffer.from("GPS", "latin1")),
      icc: !!meta.icc,
      xmp: !!meta.xmp,
    };

    const bytes = await origem
      .rotate() // auto-orienta pelo EXIF e descarta a tag de orientação
      .resize({
        width: LADO_MAXIMO_PX,
        height: LADO_MAXIMO_PX,
        fit: "inside",
        withoutEnlargement: true, // nunca ampliar: inventaria pixel
      })
      .webp({ quality: WEBP_QUALIDADE })
      // Nenhum `.withMetadata()` em lugar nenhum: é isso que garante a limpeza.
      .toBuffer();

    const saida = await sharp(bytes).metadata();

    return {
      ok: true,
      bytes,
      largura: saida.width ?? 0,
      altura: saida.height ?? 0,
      tipoOrigem,
      bytesOrigem: entrada.length,
      origemTinha,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "falha desconhecida";
    // O binário do sharp na Vercel pode não trazer decodificador HEIC (é
    // dependente de libvips com libheif). Distinguimos esse caso porque a saída
    // para o usuário é diferente: "converta para JPEG" em vez de "arquivo ruim".
    if (tipoOrigem === "heic") {
      return { ok: false, motivo: "heic_nao_decodificavel", detalhe: msg };
    }
    return { ok: false, motivo: "falha_processamento", detalhe: msg };
  }
}
