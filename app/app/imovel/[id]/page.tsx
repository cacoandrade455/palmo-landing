import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { getServerSupabase } from "@/lib/supabase-server";
import { getListing } from "./actions";
import { ListingDetail } from "./ListingDetail";

export default async function ImovelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await getListing(id);
  if (!res.ok) redirect("/app/explorar");

  let isOwner = false;
  const supabase = await getServerSupabase();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    isOwner = user?.id === res.listing.owner_id;
  }

  return (
    <>
      <Header />
      <main className="bg-neutral/40 py-12">
        <div className="mx-auto max-w-2xl px-6">
          <ListingDetail listing={res.listing} isOwner={isOwner} />
        </div>
      </main>
    </>
  );
}
