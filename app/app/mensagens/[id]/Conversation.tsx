"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, Lock, Phone, Mail } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import {
  getConversation,
  sendMessage,
  makeOffer,
  respondToOffer,
  setDealStatus,
  markConversationRead,
  type ConvData,
} from "./actions";

export function Conversation({ id }: { id: string }) {
  const { lang } = useLanguage();
  const router = useRouter();
  const [data, setData] = useState<ConvData | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [showOffer, setShowOffer] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerTerm, setOfferTerm] = useState("");
  const [offerMsg, setOfferMsg] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const label =
    lang === "en"
      ? { back: "Back", placeholder: "Write a message…", send: "Send", makeOffer: "Make an offer", price: "Price (R$/ha/year)", term: "Term (years)", offerMsg: "Message (optional)", submitOffer: "Send offer", offer: "Offer", accept: "Accept", decline: "Decline", accepted: "Accepted", declined: "Declined", pending: "Pending", perYear: "/ha/yr", years: "years", closeDeal: "Close deal (reveal contacts)", closeHint: "Only close when you've agreed. Contacts are shared after closing.", locked: "Contact details unlock when the deal is closed.", contact: "Contact", dealClosed: "Deal closed", cancel: "Cancel deal", cancelled: "This deal was cancelled." }
      : { back: "Voltar", placeholder: "Escreva uma mensagem…", send: "Enviar", makeOffer: "Fazer proposta", price: "Preço (R$/ha/ano)", term: "Prazo (anos)", offerMsg: "Mensagem (opcional)", submitOffer: "Enviar proposta", offer: "Proposta", accept: "Aceitar", decline: "Recusar", accepted: "Aceita", declined: "Recusada", pending: "Pendente", perYear: "/ha/ano", years: "anos", closeDeal: "Fechar negócio (revelar contatos)", closeHint: "Só feche quando tiverem acordado. Os contatos são compartilhados após o fechamento.", locked: "Os contatos são liberados quando o negócio é fechado.", contact: "Contato", dealClosed: "Negócio fechado", cancel: "Cancelar negócio", cancelled: "Este negócio foi cancelado." };

  function reload() {
    getConversation(id).then((res) => {
      if (res.ok) setData(res.data);
      setLoading(false);
    });
  }

  useEffect(() => {
    reload();
    markConversationRead(id).then(() => {
      // notify header to refresh its unread badge
      window.dispatchEvent(new CustomEvent("palmo:unread-changed"));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.messages.length]);

  if (loading) return <p className="py-10 text-center text-deep/40">…</p>;
  if (!data) return <p className="py-10 text-center text-deep/50">—</p>;

  async function send() {
    if (!draft.trim()) return;
    const body = draft;
    setDraft("");
    await sendMessage(id, body);
    reload();
  }

  async function submitOffer() {
    const price = Number(offerPrice);
    if (!price || price <= 0) return;
    await makeOffer(id, data!.listing_id, price, offerTerm ? Number(offerTerm) : null, offerMsg || null);
    setShowOffer(false);
    setOfferPrice(""); setOfferTerm(""); setOfferMsg("");
    reload();
  }

  const dealClosed = data.deal_status === "closed";
  const dealCancelled = data.deal_status === "cancelled";

  return (
    <div>
      <button onClick={() => router.push("/app/mensagens")} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-deep/60 hover:text-deep">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {label.back}
      </button>

      <div className="rounded-2xl border border-deep/10 bg-white shadow-sm">
        {/* header */}
        <div className="border-b border-deep/10 p-4">
          <p className="font-extrabold text-deep">{data.listingTitle}</p>
          <p className="text-sm text-deep/60">{data.counterpartName ?? "—"}</p>
        </div>

        {/* messages */}
        <div className="max-h-[45vh] space-y-2 overflow-y-auto p-4">
          {data.messages.map((m) => {
            const mine = m.sender_id === data.myId;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${mine ? "bg-primary text-white" : "bg-neutral text-deep"}`}>
                  {m.body}
                </div>
              </div>
            );
          })}

          {/* offers inline */}
          {data.offers.map((o) => {
            const mine = o.from_id === data.myId;
            const canRespond = !mine && o.status === "pending" && !dealClosed && !dealCancelled;
            return (
              <div key={o.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[80%] rounded-2xl border-2 border-accent bg-accent/10 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-deep/50">{label.offer}</p>
                  <p className="mt-0.5 text-lg font-extrabold text-deep">
                    R$ {o.price_per_ha_year.toLocaleString("pt-BR")}<span className="text-sm font-semibold text-deep/50">{label.perYear}</span>
                  </p>
                  {o.term_years && <p className="text-sm text-deep/70">{o.term_years} {label.years}</p>}
                  {o.message && <p className="mt-1 text-sm text-deep/70">{o.message}</p>}
                  <div className="mt-2 flex items-center gap-2">
                    {o.status !== "pending" && (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${o.status === "accepted" ? "bg-primary text-white" : "bg-deep/10 text-deep/50"}`}>
                        {o.status === "accepted" ? label.accepted : label.declined}
                      </span>
                    )}
                    {canRespond && (
                      <>
                        <button onClick={async () => { await respondToOffer(o.id, "accepted"); reload(); }} className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">{label.accept}</button>
                        <button onClick={async () => { await respondToOffer(o.id, "declined"); reload(); }} className="rounded-full border border-deep/20 px-3 py-1 text-xs font-bold text-deep">{label.decline}</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* contact reveal / gate */}
        <div className="border-t border-deep/10 p-4">
          {dealClosed ? (
            <div className="rounded-xl bg-primary/10 p-4">
              <p className="text-sm font-bold text-primary">✓ {label.dealClosed} — {label.contact}</p>
              {data.contact && (
                <div className="mt-2 space-y-1 text-sm text-deep">
                  {data.contact.full_name && <p className="font-semibold">{data.contact.full_name}</p>}
                  {data.contact.phone && <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{data.contact.phone}</p>}
                  {data.contact.email && <p className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{data.contact.email}</p>}
                </div>
              )}
            </div>
          ) : dealCancelled ? (
            <p className="text-center text-sm font-semibold text-deep/50">{label.cancelled}</p>
          ) : (
            <p className="flex items-center justify-center gap-1.5 text-xs text-deep/50">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              {label.locked}
            </p>
          )}
        </div>

        {/* composer */}
        {!dealCancelled && (
          <div className="border-t border-deep/10 p-4">
            {showOffer ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" min="0" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} placeholder={label.price} className="rounded-xl border border-deep/15 px-3 py-2 text-sm" />
                  <input type="number" min="0" value={offerTerm} onChange={(e) => setOfferTerm(e.target.value)} placeholder={label.term} className="rounded-xl border border-deep/15 px-3 py-2 text-sm" />
                </div>
                <input value={offerMsg} onChange={(e) => setOfferMsg(e.target.value)} placeholder={label.offerMsg} className="w-full rounded-xl border border-deep/15 px-3 py-2 text-sm" />
                <div className="flex gap-2">
                  <button onClick={submitOffer} className="flex-1 rounded-full bg-accent px-4 py-2 text-sm font-bold text-deep">{label.submitOffer}</button>
                  <button onClick={() => setShowOffer(false)} className="rounded-full border border-deep/20 px-4 py-2 text-sm font-bold text-deep">✕</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") send(); }}
                    placeholder={label.placeholder}
                    className="flex-1 rounded-full border border-deep/15 px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                  />
                  <button onClick={send} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white hover:bg-primary-dark">
                    <Send className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => setShowOffer(true)} className="rounded-full border border-accent bg-accent/10 px-4 py-1.5 text-sm font-bold text-deep">{label.makeOffer}</button>
                  {!dealClosed && (
                    <button
                      onClick={async () => { await setDealStatus(id, "closed"); reload(); }}
                      title={label.closeHint}
                      className="rounded-full bg-primary px-4 py-1.5 text-sm font-bold text-white"
                    >
                      {label.closeDeal}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
