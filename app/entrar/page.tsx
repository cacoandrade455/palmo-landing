import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SignIn } from "@/components/SignIn";

export const metadata: Metadata = {
  title: "Entrar · Palmo",
  description:
    "Entre na Palmo com sua conta Google ou com e-mail e senha. Anunciar sua terra e negociar é sempre grátis.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * Tela canônica de entrada. Aceita `?next=` para devolver a pessoa ao lugar
 * de onde ela veio — a listagem, o formulário de anúncio, a conversa. O
 * valor é saneado em `safeNext` (só caminho interno).
 */
export default async function EntrarPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;

  return (
    <>
      <Header />
      <main className="bg-neutral/40 py-12">
        <div className="mx-auto max-w-md px-6">
          <SignIn next={next} />
        </div>
      </main>
      <Footer />
    </>
  );
}
