"use client";

import { useState } from "react";
import { Layers } from "lucide-react";

import { reprocessarCamadas } from "./actions";
import type { ResumoCamadas } from "@/lib/listing-car-layers";

/**
 * Tela de reprocessamento — um campo, um botão e o resultado da conta.
 *
 * Só PT: é rota de admin, e o admin é o Carlos. Painel interno não entra na
 * superfície bilíngue (mesmo critério de `/app/admin/kyc`).
 */
export function ReprocessarCamadas() {
  const [id, setId] = useState("");
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resumo, setResumo] = useState<ResumoCamadas | null>(null);

  async function rodar() {
    setBusy(true);
    setErro(null);
    setResumo(null);
    const res = await reprocessarCamadas(id);
    setBusy(false);
    if (res.ok) setResumo(res.resumo);
    else setErro(res.error);
  }

  const linha = (rotulo: string, valor: string) => (
    <div className="flex justify-between gap-4 border-b border-deep/5 py-2 last:border-0">
      <span className="text-deep/60">{rotulo}</span>
      <span className="font-bold text-deep">{valor}</span>
    </div>
  );

  const ha = (v: number | null) => (v == null ? "não declarada" : `${v.toLocaleString("pt-BR")} ha`);

  return (
    <div className="rounded-2xl border border-deep/10 bg-white p-6 shadow-sm">
      <h1 className="flex items-center gap-2 text-2xl font-extrabold text-deep">
        <Layers className="h-5 w-5 text-primary" aria-hidden />
        Camadas ambientais · reprocessar
      </h1>
      <p className="mt-2 text-sm text-deep/70">
        Uma consulta ao SICAR por acionamento. O anúncio precisa ter CAR em formato
        reconhecível; o resultado substitui a linha atual do anúncio.
      </p>

      <label htmlFor="listing" className="mt-6 block text-sm font-bold text-deep">
        ID do anúncio
      </label>
      <input
        id="listing"
        value={id}
        onChange={(e) => setId(e.target.value)}
        placeholder="00000000-0000-0000-0000-000000000000"
        className="mt-2 w-full rounded-xl border border-deep/10 px-4 py-2.5 text-sm text-deep placeholder:text-deep/40 focus:border-primary focus:outline-none"
      />

      <button
        type="button"
        onClick={rodar}
        disabled={busy || id.trim().length === 0}
        className="mt-4 rounded-full bg-primary px-6 py-3.5 text-base font-bold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:opacity-60"
      >
        {busy ? "Consultando o SICAR..." : "Reprocessar camadas"}
      </button>

      {erro ? (
        <p className="mt-4 rounded-xl bg-white px-4 py-2.5 text-sm text-deep/70">Falhou: {erro}</p>
      ) : null}

      {resumo ? (
        <div className="mt-6 rounded-xl border border-deep/5 bg-neutral/40 px-4 py-3 text-sm">
          {linha("Área total", ha(resumo.area_total_ha))}
          {linha("Reserva Legal", ha(resumo.area_rl_ha))}
          {linha("APP", ha(resumo.area_app_ha))}
          {linha("União RL e APP", ha(resumo.area_rl_app_uniao_ha))}
          {linha("Área livre estimada", ha(resumo.area_util_estimada_ha))}
          {linha("Posições no desenho", String(resumo.pontos))}
          {linha(
            "Camadas presentes",
            resumo.camadas_presentes.length > 0 ? resumo.camadas_presentes.join(" · ") : "nenhuma",
          )}
        </div>
      ) : null}
    </div>
  );
}
