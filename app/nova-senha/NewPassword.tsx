"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, KeyRound } from "lucide-react";
import { useLanguage, type AppLang } from "@/lib/language-context";
import { getSupabase } from "@/lib/supabase";
import {
  authErrorMessage,
  classifyAuthError,
  MIN_PASSWORD_LENGTH,
  passwordScore,
} from "@/lib/auth-errors";

/**
 * Define a senha nova depois do link de recuperação.
 *
 * O link do Supabase chega com um código na URL; o cliente do navegador troca
 * esse código por uma sessão de recuperação sozinho. Por isso esperamos a
 * sessão aparecer antes de mostrar o formulário — e, se ela não vier (link
 * expirado ou já usado), dizemos isso em vez de deixar a tela morta.
 */
type Copy = {
  title: string;
  subtitle: string;
  password: string;
  confirm: string;
  submit: string;
  busy: string;
  checking: string;
  noSession: string;
  askAgain: string;
  okTitle: string;
  okBody: string;
  goAccount: string;
  mismatch: string;
  short: (n: number) => string;
  strength: [string, string, string];
};

const PT: Copy = {
  title: "Definir nova senha",
  subtitle: "Escolha uma senha nova para a sua conta.",
  password: "Nova senha",
  confirm: "Confirmar nova senha",
  submit: "Salvar senha",
  busy: "Salvando…",
  checking: "Validando o link…",
  noSession:
    "Este link de recuperação não é mais válido — ele expira depois de um tempo e só pode ser usado uma vez.",
  askAgain: "Pedir um link novo",
  okTitle: "Senha alterada",
  okBody: "Pronto. Sua senha nova já está valendo.",
  goAccount: "Ir para minha conta",
  mismatch: "As senhas não são iguais.",
  short: (n) => `A senha precisa de pelo menos ${n} caracteres.`,
  strength: ["Fraca", "Média", "Forte"],
};

const EN: Copy = {
  title: "Set a new password",
  subtitle: "Choose a new password for your account.",
  password: "New password",
  confirm: "Confirm new password",
  submit: "Save password",
  busy: "Saving…",
  checking: "Checking the link…",
  noSession:
    "This recovery link is no longer valid — it expires after a while and can only be used once.",
  askAgain: "Request a new link",
  okTitle: "Password changed",
  okBody: "Done. Your new password is active.",
  goAccount: "Go to my account",
  mismatch: "The passwords do not match.",
  short: (n) => `The password needs at least ${n} characters.`,
  strength: ["Weak", "Medium", "Strong"],
};

const COPY: Record<AppLang, Copy> = { pt: PT, en: EN, zh: EN, fr: EN, ar: EN };

const inputCls =
  "mt-1.5 w-full rounded-xl border border-deep/15 bg-white px-4 py-3 text-deep focus:border-primary focus:outline-none";

export function NewPassword() {
  const { lang } = useLanguage();
  const c = COPY[lang];
  const router = useRouter();
  const supabase = getSupabase();

  const [ready, setReady] = useState<"checking" | "yes" | "no">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!supabase) {
      // padrão do projeto para react-hooks/set-state-in-effect
      queueMicrotask(() => setReady("no"));
      return;
    }
    let alive = true;

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (alive && session) setReady("yes");
    });
    // A troca do código da URL acontece na inicialização do cliente; damos um
    // instante para ela terminar antes de concluir que o link não presta.
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      if (data.session) setReady("yes");
      else setTimeout(() => alive && setReady((r) => (r === "yes" ? r : "no")), 1500);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const score = passwordScore(password);

  async function save() {
    setError(null);
    if (password.length < MIN_PASSWORD_LENGTH) return setError(c.short(MIN_PASSWORD_LENGTH));
    if (password !== confirm) return setError(c.mismatch);
    setBusy(true);
    const { error: err } = await supabase!.auth.updateUser({ password });
    setBusy(false);
    if (err) return setError(authErrorMessage(classifyAuthError(err as never), lang));
    setDone(true);
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-deep/10 bg-white p-6 shadow-sm sm:p-8">
        <CheckCircle2 className="h-10 w-10 text-primary" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-deep">{c.okTitle}</h1>
        <p className="mt-3 text-deep/70">{c.okBody}</p>
        <button
          type="button"
          onClick={() => router.replace("/app/conta")}
          className="mt-6 w-full rounded-full bg-primary px-6 py-3.5 text-base font-bold text-white shadow-sm transition-colors hover:bg-primary-dark"
        >
          {c.goAccount}
        </button>
      </div>
    );
  }

  if (ready !== "yes") {
    return (
      <div className="rounded-2xl border border-deep/10 bg-white p-6 shadow-sm sm:p-8">
        <KeyRound className="h-10 w-10 text-primary" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-deep">{c.title}</h1>
        <p className="mt-3 text-deep/70">
          {ready === "checking" ? c.checking : c.noSession}
        </p>
        {ready === "no" && (
          <Link
            href="/entrar"
            className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-base font-bold text-white shadow-sm transition-colors hover:bg-primary-dark"
          >
            {c.askAgain}
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-deep/10 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-extrabold tracking-tight text-deep">{c.title}</h1>
      <p className="mt-2 text-deep/70">{c.subtitle}</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!busy) void save();
        }}
        className="mt-6 space-y-4"
      >
        <div>
          <label htmlFor="new-password" className="text-sm font-semibold text-deep">
            {c.password}
          </label>
          <input
            id="new-password"
            type="password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
          />
          {password.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <span className="flex h-1.5 flex-1 gap-1" aria-hidden="true">
                {[1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={`h-full flex-1 rounded-full ${
                      score >= i ? "bg-primary" : "bg-deep/10"
                    }`}
                  />
                ))}
              </span>
              <span className="text-xs font-bold text-deep/60">
                {score === 0 ? c.short(MIN_PASSWORD_LENGTH) : c.strength[score - 1]}
              </span>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="new-password-confirm" className="text-sm font-semibold text-deep">
            {c.confirm}
          </label>
          <input
            id="new-password-confirm"
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputCls}
          />
        </div>

        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-primary px-6 py-3.5 text-base font-bold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          {busy ? c.busy : c.submit}
        </button>
      </form>
    </div>
  );
}
