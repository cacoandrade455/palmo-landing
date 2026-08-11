"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Camera, ImagePlus, ShieldAlert, Star, Trash2 } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { MAX_FOTOS_POR_ANUNCIO } from "@/lib/photo-limits";
import { salvarOrdemDeFotos } from "@/app/app/anunciar/actions";
import { enviarFotos, novoEstado, type EstadoUpload } from "@/app/app/anunciar/upload-client";

/**
 * GESTÃO de fotos, na tela de edição: reordenar, definir capa e excluir.
 *
 * Por que isto não fica na criação: upload sem exclusão é armadilha — a primeira
 * foto ruim ficaria para sempre. A criação escolhe; aqui o dono conserta.
 *
 * Reordenar com setas em vez de arrastar: 90% do tráfego é celular, e
 * drag-and-drop em tela de toque exige biblioteca e briga com o scroll da
 * página. Duas setas e um botão de capa resolvem o mesmo problema com HTML que
 * funciona em qualquer aparelho, e são alcançáveis por teclado de graça.
 */
export function PhotoManager({
  listingId,
  fotosIniciais,
}: {
  listingId: string;
  fotosIniciais: string[];
}) {
  const { lang } = useLanguage();
  const [fotos, setFotos] = useState<string[]>(fotosIniciais);
  const [estados, setEstados] = useState<EstadoUpload[]>([]);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const label =
    lang === "en"
      ? {
          titulo: "Photos",
          ajuda: `Up to ${MAX_FOTOS_POR_ANUNCIO}. The first one is the cover: it's the photo people see when browsing.`,
          capa: "Cover",
          definirCapa: "Make cover",
          mover: "Move left",
          mover2: "Move right",
          excluir: "Delete photo",
          escolher: "Add photos",
          camera: "Take a photo",
          vazio: "No photos yet. Listings with photos get far more replies.",
          restantes: (n: number) => `${n} slot${n === 1 ? "" : "s"} left`,
          aviso:
            "Don't include phone numbers, e-mails or signs with contact details in the images. Contact is released at closing. That's clause 3 of the Terms.",
          privacidade:
            "We strip the location data (GPS) that phones embed in photos before publishing.",
          erroGenerico: "Something went wrong. Your photos were not changed.",
          motivos: {
            tipo_nao_suportado: "That file isn't a photo we can read.",
            heic_nao_decodificavel: "We couldn't read that iPhone photo. Please save it as JPEG and try again.",
            muito_grande: "That photo is too large.",
            muito_pequeno: "That file is too small to be a photo.",
            vazio: "That file is empty.",
            limite_de_fotos: "You've reached the photo limit.",
            falha_no_envio: "Upload failed. You can try again.",
          } as Record<string, string>,
        }
      : {
          titulo: "Fotos",
          ajuda: `Até ${MAX_FOTOS_POR_ANUNCIO}. A primeira é a capa: é a foto que aparece para quem está procurando terra.`,
          capa: "Capa",
          definirCapa: "Tornar capa",
          mover: "Mover para a esquerda",
          mover2: "Mover para a direita",
          excluir: "Excluir foto",
          escolher: "Adicionar fotos",
          camera: "Tirar foto",
          vazio: "Nenhuma foto ainda. Anúncio com foto recebe muito mais resposta.",
          restantes: (n: number) => `${n} ${n === 1 ? "vaga" : "vagas"} restantes`,
          aviso:
            "Não inclua telefone, e-mail nem placa com contato nas imagens. O contato é liberado no fechamento. É a cláusula 3 dos Termos.",
          privacidade:
            "A gente remove a localização (GPS) que o celular grava dentro da foto antes de publicar.",
          erroGenerico: "Algo deu errado. Suas fotos não foram alteradas.",
          motivos: {
            tipo_nao_suportado: "Esse arquivo não é uma foto que a gente consiga ler.",
            heic_nao_decodificavel: "Não conseguimos ler essa foto de iPhone. Salve como JPEG e tente de novo.",
            muito_grande: "Essa foto é grande demais.",
            muito_pequeno: "Esse arquivo é pequeno demais para ser uma foto.",
            vazio: "Esse arquivo está vazio.",
            limite_de_fotos: "Você chegou ao limite de fotos.",
            falha_no_envio: "O envio falhou. Você pode tentar de novo.",
          } as Record<string, string>,
        };

  const vagas = MAX_FOTOS_POR_ANUNCIO - fotos.length;

  /** Toda mudança de ordem/remoção é a mesma operação: mandar a lista nova. */
  async function aplicar(nova: string[]) {
    setErro(null);
    setOcupado(true);
    // Otimista, porque a operação é barata e o feedback precisa ser imediato no
    // celular; se o servidor recusar, voltamos ao que ele disser.
    const anterior = fotos;
    setFotos(nova);
    const res = await salvarOrdemDeFotos(listingId, nova);
    setOcupado(false);
    if (!res.ok) {
      setFotos(anterior);
      setErro(label.erroGenerico);
      return;
    }
    setFotos(res.photos);
  }

  function mover(i: number, delta: number) {
    const j = i + delta;
    if (j < 0 || j >= fotos.length) return;
    const nova = [...fotos];
    [nova[i], nova[j]] = [nova[j], nova[i]];
    void aplicar(nova);
  }

  function definirCapa(i: number) {
    if (i === 0) return;
    const nova = [fotos[i], ...fotos.filter((_, k) => k !== i)];
    void aplicar(nova);
  }

  function excluir(i: number) {
    void aplicar(fotos.filter((_, k) => k !== i));
  }

  async function receber(e: React.ChangeEvent<HTMLInputElement>) {
    const escolhidos = Array.from(e.target.files ?? []).slice(0, vagas);
    e.target.value = "";
    if (escolhidos.length === 0) return;

    setErro(null);
    const novos = escolhidos.map((f, i) => novoEstado(f, i));
    setEstados(novos);
    setOcupado(true);

    const publicadas = await enviarFotos(listingId, escolhidos, novos, (key, patch) => {
      setEstados((p) => p.map((x) => (x.key === key ? { ...x, ...patch } : x)));
    });

    setOcupado(false);
    if (publicadas.length > 0) setFotos((p) => [...p, ...publicadas]);
    // Libera as prévias locais: sem isto o object URL vaza até o reload.
    novos.forEach((n) => URL.revokeObjectURL(n.previa));
    // Mantém na tela só o que falhou, para o dono saber o que tentar de novo.
    setEstados((p) => p.filter((x) => x.fase === "falhou"));
  }

  return (
    <div className="rounded-2xl border border-deep/10 bg-white p-6 shadow-sm">
      <p className="text-sm font-bold uppercase tracking-wide text-primary">{label.titulo}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-deep/50">{label.ajuda}</p>

      {fotos.length === 0 ? (
        <p className="mt-3 rounded-xl bg-white px-4 py-2.5 text-sm text-deep/70">{label.vazio}</p>
      ) : (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {fotos.map((url, i) => (
            <li key={url} className="overflow-hidden rounded-xl border border-deep/10 bg-white">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- fotos vêm do storage do Supabase (host externo) */}
                <img src={url} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />
                {i === 0 && (
                  <span className="absolute left-2 top-2 rounded-full bg-deep px-2.5 py-1 text-xs font-bold text-white">
                    {label.capa}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-1 px-2 py-2">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => mover(i, -1)}
                    disabled={ocupado || i === 0}
                    aria-label={label.mover}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-deep/20 text-deep transition-colors hover:border-primary disabled:opacity-40"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => mover(i, 1)}
                    disabled={ocupado || i === fotos.length - 1}
                    aria-label={label.mover2}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-deep/20 text-deep transition-colors hover:border-primary disabled:opacity-40"
                  >
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <div className="flex gap-1">
                  {i !== 0 && (
                    <button
                      type="button"
                      onClick={() => definirCapa(i)}
                      disabled={ocupado}
                      aria-label={label.definirCapa}
                      title={label.definirCapa}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-deep/20 text-deep transition-colors hover:border-primary disabled:opacity-40"
                    >
                      <Star className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => excluir(i)}
                    disabled={ocupado}
                    aria-label={label.excluir}
                    title={label.excluir}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-deep/20 text-deep transition-colors hover:border-primary disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Só o que falhou continua listado, com o motivo — falha de um arquivo
          nunca derrubou os outros. */}
      {estados.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {estados.map((e) => (
            <li key={e.key} className="rounded-xl bg-accent/20 px-4 py-2.5 text-sm text-deep">
              <span className="font-semibold">{e.nomeLocal}</span>{" "}
              <span className="leading-relaxed text-deep/70">
                {label.motivos[e.motivo ?? "falha_no_envio"] ?? label.motivos.falha_no_envio}
              </span>
            </li>
          ))}
        </ul>
      )}

      {erro && <p className="mt-3 text-sm font-semibold text-deep">{erro}</p>}

      {vagas > 0 && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-deep/20 px-4 py-2 text-sm font-bold text-deep transition-colors hover:border-primary">
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
            {label.escolher}
            <input type="file" accept="image/*" multiple onChange={receber} disabled={ocupado} className="sr-only" />
          </label>
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-deep/20 px-4 py-2 text-sm font-bold text-deep transition-colors hover:border-primary sm:hidden">
            <Camera className="h-4 w-4" aria-hidden="true" />
            {label.camera}
            <input type="file" accept="image/*" capture="environment" onChange={receber} disabled={ocupado} className="sr-only" />
          </label>
          <span className="text-xs text-deep/50">{label.restantes(vagas)}</span>
        </div>
      )}

      <p className="mt-3 flex items-start gap-2 rounded-xl bg-accent/20 px-4 py-2.5 text-sm font-semibold text-deep">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="font-normal leading-relaxed">{label.aviso}</span>
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-deep/50">{label.privacidade}</p>
    </div>
  );
}
