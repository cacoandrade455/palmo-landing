import { Header } from "@/components/Header";
import { ContractRoom } from "./ContractRoom";

export default async function ContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <Header />
      <main className="bg-neutral/40 py-12">
        <div className="mx-auto max-w-2xl px-6">
          <ContractRoom id={id} />
        </div>
      </main>
    </>
  );
}
