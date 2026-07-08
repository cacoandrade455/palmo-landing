import { Header } from "@/components/Header";
import { AccountDashboard } from "./AccountDashboard";

export default function ContaPage() {
  return (
    <>
      <Header />
      <main className="bg-neutral/40 py-12">
        <div className="mx-auto max-w-2xl px-6">
          <AccountDashboard />
        </div>
      </main>
    </>
  );
}
