import Link from "next/link";

import { Header } from "@/components/Header";
import { getListingForEdit } from "./actions";
import { EditListing } from "./EditListing";

/**
 * Edição de anúncio. Herda do `app/app/layout.tsx` os dois portões (dark launch
 * e aceite legal), então aqui só resta a autorização do próprio anúncio.
 *
 * Anúncio de outro dono e anúncio inexistente produzem a MESMA resposta, de
 * propósito: nada nesta tela revela se um id existe.
 */
export default async function EditarAnuncioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await getListingForEdit(id);

  if (!res.ok) {
    return (
      <>
        <Header />
        <main className="bg-neutral/40 py-12">
          <div className="mx-auto max-w-2xl px-6">
            <div className="rounded-2xl border border-deep/10 bg-white p-8 text-center shadow-sm">
              <h1 className="text-xl font-extrabold text-deep">
                {res.error === "not_signed_in"
                  ? "Entre na sua conta"
                  : "Anúncio não disponível"}
              </h1>
              <p className="mt-2 text-deep/60">
                {res.error === "not_signed_in"
                  ? "Você precisa estar logado para editar um anúncio."
                  : "Este anúncio não existe ou não é seu."}
              </p>
              <Link
                href={res.error === "not_signed_in" ? "/entrar?next=%2Fapp%2Fconta" : "/app/conta"}
                className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-base font-bold text-white shadow-sm transition-colors hover:bg-primary-dark"
              >
                {res.error === "not_signed_in" ? "Entrar" : "Voltar para meus anúncios"}
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="bg-neutral/40 py-12">
        <div className="mx-auto max-w-2xl px-6">
          <EditListing listing={res.listing} />
        </div>
      </main>
    </>
  );
}
