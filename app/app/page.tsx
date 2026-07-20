import { Header } from "@/components/Header";
import { HomeDashboard } from "./HomeDashboard";

export default function AppHomePage() {
  return (
    <>
      <Header />
      <main className="bg-neutral/40 py-12">
        <div className="mx-auto max-w-2xl px-6">
          <HomeDashboard />
        </div>
      </main>
    </>
  );
}
