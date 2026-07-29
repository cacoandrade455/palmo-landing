import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { NewPassword } from "./NewPassword";

export const metadata: Metadata = {
  title: "Nova senha — Palmo",
  description: "Defina uma senha nova para a sua conta Palmo.",
  robots: { index: false, follow: false },
};

export default function NovaSenhaPage() {
  return (
    <>
      <Header />
      <main className="bg-neutral/40 py-12">
        <div className="mx-auto max-w-md px-6">
          <NewPassword />
        </div>
      </main>
      <Footer />
    </>
  );
}
