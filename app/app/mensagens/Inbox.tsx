"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { getInbox, type InboxItem } from "./actions";

const DEAL_STYLES: Record<string, string> = {
  open: "bg-primary/10 text-primary",
  negotiating: "bg-accent/25 text-deep",
  closed: "bg-primary text-white",
  cancelled: "bg-deep/10 text-deep/50",
};

export function Inbox() {
  const { lang } = useLanguage();
  const router = useRouter();
  const [items, setItems] = useState<InboxItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  const label =
    lang === "en"
      ? { title: "Messages", empty: "No conversations yet. Explore listings to start one.", explore: "Explore land", owner: "You're the owner", developer: "You're interested", dealLabels: { open: "Open", negotiating: "Negotiating", closed: "Closed", cancelled: "Cancelled" } as Record<string, string> }
      : { title: "Mensagens", empty: "Nenhuma conversa ainda. Explore anúncios para começar.", explore: "Explorar terras", owner: "Você é o dono", developer: "Você tem interesse", dealLabels: { open: "Aberta", negotiating: "Negociando", closed: "Fechada", cancelled: "Cancelada" } as Record<string, string> };

  useEffect(() => {
    getInbox().then((res) => {
      if (res.ok) setItems(res.items);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight text-deep">{label.title}</h1>

      <div className="mt-6">
        {loading ? (
          <p className="py-10 text-center text-deep/40">…</p>
        ) : !items || items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-deep/20 bg-white p-10 text-center shadow-sm">
            <p className="text-deep/60">{label.empty}</p>
            <button onClick={() => router.push("/app/explorar")} className="mt-5 rounded-full bg-primary px-6 py-3 text-base font-bold text-white hover:bg-primary-dark">
              {label.explore}
            </button>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => router.push(`/app/mensagens/${c.id}`)}
                  className="flex w-full items-center gap-4 rounded-2xl border border-deep/10 bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <MessageCircle className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-extrabold text-deep">{c.listingTitle}</p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${DEAL_STYLES[c.deal_status] ?? ""}`}>
                        {label.dealLabels[c.deal_status] ?? c.deal_status}
                      </span>
                    </div>
                    <p className="truncate text-sm text-deep/60">
                      {c.counterpartName ?? "—"} · {c.role === "owner" ? label.owner : label.developer}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
