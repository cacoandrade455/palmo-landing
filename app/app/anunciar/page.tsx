import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { getServerSupabase } from "@/lib/supabase-server";
import { ListingForm } from "./ListingForm";

export default async function AnunciarPage() {
  const supabase = await getServerSupabase();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/conta");
  }

  return (
    <>
      <Header />
      <main className="bg-neutral/40 py-12">
        <div className="mx-auto max-w-2xl px-6">
          <ListingForm />
        </div>
      </main>
    </>
  );
}
