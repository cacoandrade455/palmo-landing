"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LogOut } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/lib/language-context";
import { getSupabase } from "@/lib/supabase";

export default function ContaPage() {
  const { t } = useLanguage();
  const supabase = getSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);
  const ready = !supabase || checked;

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  const name =
    (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "";
  const avatar = (user?.user_metadata?.avatar_url as string | undefined) ?? null;

  return (
    <>
      <Header />
      <main className="bg-white">
        <section className="mx-auto max-w-xl px-6 py-16">
          <h1 className="text-3xl font-extrabold tracking-tight text-deep">
            {t.auth.accountTitle}
          </h1>
          <p className="mt-2 text-deep/60">{t.auth.accountSubtitle}</p>

          <div className="mt-8 rounded-2xl border border-deep/10 bg-white p-6 shadow-sm sm:p-8">
            {!ready ? null : !supabase || !user ? (
              <>
                <p className="text-deep/70">{t.auth.notSignedIn}</p>
                {supabase && (
                  <button
                    type="button"
                    onClick={() =>
                      supabase.auth.signInWithOAuth({
                        provider: "google",
                        options: {
                          redirectTo: `${window.location.origin}/conta`,
                        },
                      })
                    }
                    className="mt-5 w-full rounded-full bg-primary px-6 py-3.5 text-base font-bold text-white shadow-sm transition-colors hover:bg-primary-dark"
                  >
                    {t.auth.signInGoogle}
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  {avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element -- external OAuth avatar host
                    <img
                      src={avatar}
                      alt=""
                      className="h-14 w-14 rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
                      {name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm text-deep/50">{t.auth.signedInAs}</p>
                    <p className="truncate font-extrabold text-deep">{name}</p>
                    <p className="truncate text-sm text-deep/60">{user.email}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => supabase.auth.signOut()}
                  className="mt-6 inline-flex items-center gap-2 rounded-full border border-deep/15 px-5 py-2.5 text-sm font-bold text-deep transition-colors hover:border-red-400 hover:text-red-600"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  {t.auth.signOut}
                </button>
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
