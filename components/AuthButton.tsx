"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { useLanguage } from "@/lib/language-context";
import { getSupabase } from "@/lib/supabase";

export function AuthButton() {
  const { t } = useLanguage();
  const supabase = getSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  // Supabase not configured yet — render nothing, site works as before.
  if (!supabase) return null;

  if (!ready) return <div className="h-9 w-9" aria-hidden="true" />;

  if (!user) {
    return (
      <button
        type="button"
        onClick={() =>
          supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${window.location.origin}/app/conta` },
          })
        }
        className="rounded-full border border-deep/15 bg-white px-4 py-2 text-sm font-bold text-deep transition-colors hover:border-primary hover:text-primary"
      >
        {t.auth.signIn}
      </button>
    );
  }

  const avatar =
    (user.user_metadata?.avatar_url as string | undefined) ?? null;
  const name =
    (user.user_metadata?.full_name as string | undefined) ??
    user.email ??
    "";

  return (
    <Link
      href="/app/conta"
      title={name}
      className="flex items-center gap-2 rounded-full border border-deep/10 bg-white p-1 pr-3 transition-colors hover:border-primary"
    >
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element -- external OAuth avatar host
        <img
          src={avatar}
          alt=""
          className="h-7 w-7 rounded-full"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
          {name.slice(0, 1).toUpperCase()}
        </span>
      )}
      <span className="hidden max-w-28 truncate text-sm font-semibold text-deep sm:inline">
        {name.split(" ")[0]}
      </span>
    </Link>
  );
}
