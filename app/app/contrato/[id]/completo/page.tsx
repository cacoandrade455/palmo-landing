import { Header } from "@/components/Header";
import { FullContract } from "./FullContract";

export default async function FullContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      {/* app chrome: on screen only — never on paper */}
      <div className="print:hidden">
        <Header />
      </div>
      <main className="bg-neutral/40 py-12 print:bg-white print:py-0">
        <div className="mx-auto max-w-2xl px-6 print:max-w-none print:px-0">
          <FullContract id={id} />
        </div>
      </main>
    </>
  );
}
