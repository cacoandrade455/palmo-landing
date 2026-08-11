import { notFound } from "next/navigation";

import { Header } from "@/components/Header";
import { getKycAdmin } from "@/lib/kyc-admin";
import { KycQueue } from "./KycQueue";
import { listarDecididos, listarFila } from "./actions";

export const metadata = {
  title: "Palmo · Triagem de verificação",
};

// Fila de KYC nunca pode ser servida de cache: é dado vivo e é dado sensível.
export const dynamic = "force-dynamic";

/**
 * Painel de triagem — rota de admin.
 *
 * Primeira linha do componente é o gate: quem não está na allowlist recebe o
 * 404 padrão do Next, idêntico ao de uma rota inexistente. Não existe versão
 * "logado mas sem permissão" desta tela, e nada de conteúdo é montado antes
 * da checagem. As server actions repetem a mesma checagem por conta própria.
 */
export default async function AdminKycPage() {
  const admin = await getKycAdmin();
  if (!admin) notFound();

  const [fila, decididos] = await Promise.all([listarFila(), listarDecididos()]);

  return (
    <>
      <Header />
      <main className="bg-neutral/40 py-12">
        <div className="mx-auto max-w-6xl px-6">
          <KycQueue
            adminEmail={admin.email}
            fila={fila.ok ? fila.itens : []}
            decididos={decididos.ok ? decididos.itens : []}
            erro={fila.ok ? null : fila.error}
          />
        </div>
      </main>
    </>
  );
}
