import { Header } from "@/components/Header";
import { Marketplace } from "./Marketplace";

export default function ExplorarPage() {
  return (
    <>
      <Header />
      <main className="bg-neutral/40 py-12">
        <div className="mx-auto max-w-4xl px-6">
          <Marketplace />
        </div>
      </main>
    </>
  );
}
