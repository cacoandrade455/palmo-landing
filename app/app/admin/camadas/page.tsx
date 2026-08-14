import { notFound } from "next/navigation";

import { Header } from "@/components/Header";
import { getKycAdmin } from "@/lib/kyc-admin";
import { ReprocessarCamadas } from "./ReprocessarCamadas";

export const metadata = {
  title: "Palmo · Camadas ambientais",
};

// Rota de admin: nunca servida de cache.
export const dynamic = "force-dynamic";

/**
 * Reprocessamento manual das camadas ambientais de um anúncio.
 *
 * Primeira linha é o gate, igual a `/app/admin/kyc`: quem não está na
 * allowlist recebe o 404 padrão do Next, idêntico ao de uma rota inexistente.
 * A server action repete a checagem por conta própria.
 */
export default async function AdminCamadasPage() {
  const admin = await getKycAdmin();
  if (!admin) notFound();

  return (
    <>
      <Header />
      <main className="bg-neutral/40 py-12">
        <div className="mx-auto max-w-2xl px-6">
          <ReprocessarCamadas />
        </div>
      </main>
    </>
  );
}
