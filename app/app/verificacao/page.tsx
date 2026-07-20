import { Header } from "@/components/Header";
import { Verification } from "./Verification";

export const metadata = {
  title: "Palmo — Verificação de identidade",
};

export default function VerificacaoPage() {
  return (
    <>
      <Header />
      <main className="bg-neutral/40 py-12">
        <div className="mx-auto max-w-2xl px-6">
          <Verification />
        </div>
      </main>
    </>
  );
}
