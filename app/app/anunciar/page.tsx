import { Header } from "@/components/Header";
import { ListingForm, type ListingPrefill } from "./ListingForm";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AnunciarPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const str = (key: string): string | undefined => {
    const v = sp[key];
    return typeof v === "string" && v.trim() ? v.trim() : undefined;
  };
  const posNum = (key: string): string | undefined => {
    const raw = str(key);
    if (!raw) return undefined;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? String(n) : undefined;
  };
  // Pre-fill coming from the /quanto-vale calculator bridge; every value is
  // optional and re-validated against real options inside the form.
  const prefill: ListingPrefill = {
    uf: str("uf"),
    municipality: str("municipality"),
    hectares: posNum("hectares"),
    purpose: str("purpose"),
    crop: str("crop"),
    suggested: posNum("suggested"),
  };

  return (
    <>
      <Header />
      <main className="bg-neutral/40 py-12">
        <div className="mx-auto max-w-2xl px-6">
          <ListingForm prefill={prefill} />
        </div>
      </main>
    </>
  );
}
