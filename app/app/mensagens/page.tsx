import { Header } from "@/components/Header";
import { Inbox } from "./Inbox";

export default function MensagensPage() {
  return (
    <>
      <Header />
      <main className="bg-neutral/40 py-12">
        <div className="mx-auto max-w-2xl px-6">
          <Inbox />
        </div>
      </main>
    </>
  );
}
