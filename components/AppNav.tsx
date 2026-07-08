"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/language-context";
import { getUnreadCount } from "@/app/app/mensagens/actions";

export function AppNav() {
  const { lang } = useLanguage();
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);

  const label =
    lang === "en"
      ? { explore: "Explore", messages: "Messages", account: "Account" }
      : { explore: "Explorar", messages: "Mensagens", account: "Conta" };

  useEffect(() => {
    let alive = true;
    const refresh = () =>
      getUnreadCount().then((n) => {
        if (alive) setUnread(n);
      });
    refresh();
    const onChanged = () => refresh();
    window.addEventListener("palmo:unread-changed", onChanged);
    const interval = setInterval(refresh, 30000); // light polling
    return () => {
      alive = false;
      window.removeEventListener("palmo:unread-changed", onChanged);
      clearInterval(interval);
    };
  }, [pathname]);

  const linkCls = (href: string) =>
    `relative transition-colors hover:text-deep ${
      pathname === href ? "text-deep" : "text-deep/70"
    }`;

  return (
    <nav className="hidden items-center gap-8 text-sm font-semibold md:flex">
      <Link href="/app/explorar" className={linkCls("/app/explorar")}>
        {label.explore}
      </Link>
      <Link href="/app/mensagens" className={linkCls("/app/mensagens")}>
        {label.messages}
        {unread > 0 && (
          <span className="absolute -right-4 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </Link>
      <Link href="/app/conta" className={linkCls("/app/conta")}>
        {label.account}
      </Link>
    </nav>
  );
}
