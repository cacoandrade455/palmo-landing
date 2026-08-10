"use client";

import { Camera, ImagePlus, ShieldAlert, X } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { MAX_FOTOS_POR_ANUNCIO } from "@/lib/photo-limits";
import type { EstadoUpload } from "./upload-client";

/**
 * Escolha de fotos na CRIAÇÃO do anúncio. Só seleciona e mostra prévia local —
 * o upload acontece depois que o anúncio existe, porque o caminho no bucket é
 * {owner_id}/{listing_id}/{uuid} e o listing_id só nasce no save.
 *
 * A GESTÃO (reordenar, trocar capa, excluir) fica na tela de edição, que é onde
 * o dono volta para mexer. Aqui, antes de salvar, "excluir" é só tirar da
 * seleção.
 *
 * Componente presentacional: o estado vive no ListingForm, que é quem sabe
 * quando o anúncio foi criado e pode disparar o envio.
 */
export function PhotoPicker({
  arquivos,
  estados,
  onEscolher,
  onRemover,
  desabilitado,
}: {
  arquivos: File[];
  estados: EstadoUpload[];
  onEscolher: (novos: File[]) => void;
  onRemover: (indice: number) => void;
  desabilitado?: boolean;
}) {
  const { lang } = useLanguage();

  const label =
    lang === "en"
      ? {
          titulo: "Photos",
          ajuda: `Up to ${MAX_FOTOS_POR_ANUNCIO} photos. The first one is the cover — you can reorder them after saving.`,
          escolher: "Choose photos",
          camera: "Take a photo",
          capa: "Cover",
          remover: "Remove",
          restantes: (n: number) => `${n} slot${n === 1 ? "" : "s"} left`,
          aviso:
            "Don't include phone numbers, e-mails or signs with contact details in the images. Contact is released at closing — that's clause 3 of the Terms.",
          fase: {
            aguardando: "Waiting",
            enviando: "Uploading…",
            processando: "Processing…",
            pronta: "Done",
            falhou: "Failed",
          },
          motivos: {
            tipo_nao_suportado: "This file isn't a photo we can read.",
            heic_nao_decodificavel: "We couldn't read this iPhone photo. Please save it as JPEG and try again.",
            muito_grande: "This photo is too large.",
            muito_pequeno: "This file is too small to be a photo.",
            vazio: "This file is empty.",
            limite_de_fotos: "You've reached the photo limit.",
            falha_no_envio: "Upload failed. You can try this photo again.",
            padrao: "We couldn't process this photo.",
          } as Record<string, string>,
          privacidade:
            "We strip the location data (GPS) that phones embed in photos before publishing.",
        }
      : {
          titulo: "Fotos",
          ajuda: `Até ${MAX_FOTOS_POR_ANUNCIO} fotos. A primeira é a capa — você pode reordenar depois de salvar.`,
          escolher: "Escolher fotos",
          camera: "Tirar foto",
          capa: "Capa",
          remover: "Remover",
          restantes: (n: number) => `${n} ${n === 1 ? "vaga" : "vagas"} restantes`,
          aviso:
            "Não inclua telefone, e-mail nem placa com contato nas imagens. O contato é liberado no fechamento — é a cláusula 3 dos Termos.",
          fase: {
            aguardando: "Aguardando",
            enviando: "Enviando…",
            processando: "Processando…",
            pronta: "Pronta",
            falhou: "Falhou",
          },
          motivos: {
            tipo_nao_suportado: "Este arquivo não é uma foto que a gente consiga ler.",
            heic_nao_decodificavel: "Não conseguimos ler esta foto de iPhone. Salve como JPEG e tente de novo.",
            muito_grande: "Esta foto é grande demais.",
            muito_pequeno: "Este arquivo é pequeno demais para ser uma foto.",
            vazio: "Este arquivo está vazio.",
            limite_de_fotos: "Você chegou ao limite de fotos.",
            falha_no_envio: "O envio falhou. Você pode tentar esta foto de novo.",
            padrao: "Não conseguimos processar esta foto.",
          } as Record<string, string>,
          privacidade:
            "A gente remove a localização (GPS) que o celular grava dentro da foto antes de publicar.",
        };

  const vagas = MAX_FOTOS_POR_ANUNCIO - arquivos.length;

  function receber(e: React.ChangeEvent<HTMLInputElement>) {
    const escolhidos = Array.from(e.target.files ?? []);
    if (escolhidos.length > 0) onEscolher(escolhidos.slice(0, vagas));
    // Zera para permitir escolher o MESMO arquivo de novo depois de remover.
    e.target.value = "";
  }

  return (
    <div>
      <p className="text-sm font-semibold text-deep">{label.titulo}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-deep/50">{label.ajuda}</p>

      {arquivos.length > 0 && (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {arquivos.map((f, i) => {
            const est = estados[i];
            const falhou = est?.fase === "falhou";
            return (
              <li
                key={est?.key ?? `${f.name}-${i}`}
                className="relative overflow-hidden rounded-xl border border-deep/10 bg-white"
              >
                {/* Prévia local: object URL do arquivo escolhido, ainda não
                    enviado. Não é conteúdo remoto, então <img> é o certo. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={est?.previa ?? ""}
                  alt=""
                  className="aspect-[4/3] w-full object-cover"
                />
                {i === 0 && (
                  <span className="absolute left-2 top-2 rounded-full bg-deep px-2.5 py-1 text-xs font-bold text-white">
                    {label.capa}
                  </span>
                )}
                {!desabilitado && (
                  <button
                    type="button"
                    onClick={() => onRemover(i)}
                    aria-label={label.remover}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border border-deep/20 bg-white text-deep transition-colors hover:border-primary"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
                {est && est.fase !== "aguardando" && (
                  <p
                    className={`px-2.5 py-2 text-xs font-semibold ${
                      falhou ? "text-deep" : "text-deep/60"
                    }`}
                  >
                    {label.fase[est.fase]}
                    {falhou && (
                      <span className="mt-1 block font-normal leading-relaxed text-deep/70">
                        {label.motivos[est.motivo ?? "padrao"] ?? label.motivos.padrao}
                      </span>
                    )}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {vagas > 0 && !desabilitado && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-deep/20 px-4 py-2 text-sm font-bold text-deep transition-colors hover:border-primary">
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
            {label.escolher}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={receber}
              className="sr-only"
            />
          </label>
          {/* Câmera direta: ~90% do tráfego vem do Instagram, no celular, e o
              dono normalmente está NA terra quando anuncia. */}
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-deep/20 px-4 py-2 text-sm font-bold text-deep transition-colors hover:border-primary sm:hidden">
            <Camera className="h-4 w-4" aria-hidden="true" />
            {label.camera}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={receber}
              className="sr-only"
            />
          </label>
          <span className="text-xs text-deep/50">{label.restantes(vagas)}</span>
        </div>
      )}

      {/* A Cláusula 3.1 dos Termos já prevê a foto como vetor de fuga do gate de
          contato, então o aviso é curto e fica onde a pessoa está agindo.
          Detecção automática (OCR) NÃO entra neste lote — está declarada como
          pendência no PR. */}
      <p className="mt-3 flex items-start gap-2 rounded-xl bg-accent/20 px-4 py-2.5 text-sm font-semibold text-deep">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="font-normal leading-relaxed">{label.aviso}</span>
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-deep/50">{label.privacidade}</p>
    </div>
  );
}
