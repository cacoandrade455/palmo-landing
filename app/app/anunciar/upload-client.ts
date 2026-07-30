/**
 * UPLOAD DE FOTO NO NAVEGADOR — a perna do meio do caminho.
 *
 * O servidor emite a URL assinada, o navegador manda os bytes direto para o
 * bucket PRIVADO de staging, e depois pede ao servidor que trate e publique.
 * Os bytes nunca atravessam um request body do Next: é assim que escapamos do
 * teto de 4,5 MB da Vercel e do truncamento silencioso do `proxy.ts`.
 *
 * Sem "use server" de propósito: isto roda no cliente.
 */

import { pedirUploadsDeFoto, publicarFoto } from "./actions";

/** Estado por arquivo. A falha de um NUNCA derruba os outros. */
export type EstadoUpload = {
  /** Chave estável para o React, independente do nome do arquivo. */
  key: string;
  nomeLocal: string;
  /** Prévia local (object URL). Precisa ser revogada pelo chamador. */
  previa: string;
  fase: "aguardando" | "enviando" | "processando" | "pronta" | "falhou";
  /** Chave do motivo; a copy em PT/EN vive no componente. */
  motivo?: string;
  url?: string;
};

export function novoEstado(file: File, i: number): EstadoUpload {
  return {
    key: `${Date.now()}-${i}-${file.size}`,
    nomeLocal: file.name,
    previa: URL.createObjectURL(file),
    fase: "aguardando",
  };
}

/**
 * Sobe uma lista de arquivos, um por vez, reportando progresso a cada mudança
 * de fase. Sequencial de propósito: celular em 4G no interior não ganha nada
 * com seis uploads paralelos disputando a mesma banda, e o progresso fica
 * legível.
 *
 * @param onProgresso chamado a cada transição, com o estado novo daquele item.
 * @returns as URLs publicadas, na ordem em que entraram.
 */
export async function enviarFotos(
  listingId: string,
  arquivos: File[],
  estados: EstadoUpload[],
  onProgresso: (key: string, patch: Partial<EstadoUpload>) => void,
): Promise<string[]> {
  if (arquivos.length === 0) return [];

  const pedido = await pedirUploadsDeFoto(listingId, arquivos.length);
  if (!pedido.ok) {
    estados.forEach((e) => onProgresso(e.key, { fase: "falhou", motivo: pedido.error }));
    return [];
  }

  const publicadas: string[] = [];

  for (let i = 0; i < arquivos.length; i++) {
    const alvo = pedido.uploads[i];
    const est = estados[i];
    if (!alvo || !est) continue;

    try {
      onProgresso(est.key, { fase: "enviando" });

      // PUT direto no Storage, com o token assinado. Não passa pelo servidor.
      const put = await fetch(alvo.signedUrl, {
        method: "PUT",
        headers: { "x-upsert": "true" },
        body: arquivos[i],
      });
      if (!put.ok) {
        onProgresso(est.key, { fase: "falhou", motivo: "falha_no_envio" });
        continue;
      }

      // Agora o servidor lê de staging, remove o EXIF, converte e publica.
      onProgresso(est.key, { fase: "processando" });
      const pub = await publicarFoto(listingId, alvo.uuid);
      if (!pub.ok) {
        onProgresso(est.key, { fase: "falhou", motivo: pub.motivo ?? pub.error });
        continue;
      }

      onProgresso(est.key, { fase: "pronta", url: pub.url });
      publicadas.push(pub.url);
    } catch {
      onProgresso(est.key, { fase: "falhou", motivo: "falha_no_envio" });
    }
  }

  return publicadas;
}
