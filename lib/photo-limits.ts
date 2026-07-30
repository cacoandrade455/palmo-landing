/**
 * LIMITES E FORMATO DAS FOTOS — a parte PURA, que o navegador pode importar.
 *
 * Existe separado de `lib/photo-pipeline.ts` por um motivo concreto: o pipeline
 * importa `sharp`, que é binário nativo (libvips) e depende de `fs`. Um
 * componente client que importasse dali só para ler `MAX_FOTOS_POR_ANUNCIO`
 * arrastaria o sharp inteiro para o bundle do navegador e quebraria o build com
 * "Module not found: Can't resolve 'fs'".
 *
 * Regra: constante, caminho e detecção de tipo moram aqui. Processamento de
 * imagem mora no pipeline, atrás de `server-only`.
 */

/** Lado maior do arquivo servido. */
export const LADO_MAXIMO_PX = 1600;
/** Qualidade do WebP. */
export const WEBP_QUALIDADE = 82;
/** Até 8 fotos por anúncio; a primeira é a capa. */
export const MAX_FOTOS_POR_ANUNCIO = 8;
/** Piso: abaixo disso não é foto de imóvel, é ícone ou arquivo quebrado. */
export const MIN_FOTO_BYTES = 8 * 1024; // 8 KB
/** Teto do arquivo de origem. Alinhado ao limite do bucket na migration. */
export const MAX_FOTO_BYTES = 15 * 1024 * 1024; // 15 MB

/**
 * Tipos aceitos na ENTRADA. HEIC/HEIF entra porque iPhone manda HEIC por
 * default e ~90% do tráfego é celular.
 *
 * Ressalva medida em 29/07/2026 neste repo: o binário do sharp (0.34.5 /
 * libvips 8.17.3) traz `libheif 1.20.2`, mas entre os codecs só aparece `aom`
 * (AV1) — não há decodificador HEVC (`libde265`/`x265`), e o `fileSuffix` do
 * handler HEIF lista apenas `.avif`. Ou seja: AVIF decodifica, HEIC do iPhone
 * provavelmente NÃO. O pipeline trata esse caso com motivo próprio
 * (`heic_nao_decodificavel`) e a interface pede para salvar como JPEG, em vez de
 * mostrar erro genérico.
 *
 * Na prática o caso é raro: o iOS converte HEIC para JPEG automaticamente
 * quando a foto é escolhida por `<input type="file" accept="image/*">`.
 */
export const TIPOS_ACEITOS = ["jpeg", "png", "webp", "heic"] as const;
export type TipoFoto = (typeof TIPOS_ACEITOS)[number];

/**
 * Detecta o tipo real pelos MAGIC BYTES. Nunca confia em extensão nem no
 * Content-Type declarado: os dois são texto que o cliente escolhe.
 *
 * Função pura, sem I/O — roda no servidor e serve para pré-checagem no cliente.
 */
export function detectarTipo(buf: Uint8Array): TipoFoto | null {
  if (buf.length < 12) return null;

  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";

  // PNG: 89 "PNG" CR LF 1A LF
  if (
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) {
    return "png";
  }

  const ascii = (i: number, n: number) =>
    String.fromCharCode(...buf.slice(i, i + n));

  // WebP: "RIFF" .... "WEBP"
  if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") return "webp";

  // HEIC/HEIF/AVIF: caixa ISO-BMFF "ftyp" no offset 4, marca no offset 8.
  if (ascii(4, 4) === "ftyp") {
    const marca = ascii(8, 4).toLowerCase();
    const marcasHeif = [
      "heic", "heix", "hevc", "hevx", "heim", "heis", "hevm", "hevs",
      "mif1", "msf1", "avif",
    ];
    if (marcasHeif.includes(marca)) return "heic";
  }

  return null;
}

/**
 * Caminho no bucket público. Pasta por dono e por anúncio, espelhando o padrão
 * de pasta por `auth.uid()` que o `kyc-docs` já usa.
 *
 * O nome do arquivo é UUID: nome original NUNCA vai para o bucket, porque vaza
 * nome de pessoa, de fazenda e de aparelho ("IMG_0042 fazenda do Joao
 * iPhone.heic" conta três coisas que não são da conta de ninguém).
 */
export function caminhoFoto(ownerId: string, listingId: string, uuid: string): string {
  return `${ownerId}/${listingId}/${uuid}.webp`;
}

/** Mesma pasta, na área privada de staging, antes do tratamento. */
export function caminhoStaging(ownerId: string, listingId: string, uuid: string): string {
  return `${ownerId}/${listingId}/${uuid}`;
}
