import { Header } from "@/components/Header";
import { Conversation } from "./Conversation";

export default async function ConversationPage({
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
          <Conversation id={id} />
        </div>
      </main>
    </>
  );
}
