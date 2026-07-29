"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Mail } from "lucide-react";
import { useLanguage, type AppLang } from "@/lib/language-context";
import { getSupabase } from "@/lib/supabase";
import {
  authErrorMessage,
  classifyAuthError,
  MIN_PASSWORD_LENGTH,
  passwordScore,
  safeNext,
} from "@/lib/auth-errors";
import { acceptCoreDocs } from "@/app/app/legal-actions";

/**
 * Painel de entrada com os DOIS caminhos: Google (como já era) e e-mail +
 * senha. Usado em /entrar e embutido na página pública de conta.
 *
 * O destino pós-login (`next`) atravessa os dois caminhos, para quem clicou
 * em "Falar com o dono" numa listagem voltar exatamente para ela.
 *
 * Sobre confirmação de e-mail: o comportamento depende da configuração do
 * projeto no Supabase. Se estiver LIGADA, `signUp` volta sem sessão e
 * mostramos a tela "confirme seu e-mail"; se estiver DESLIGADA, a sessão vem
 * na hora e seguimos direto — sem tela morta em nenhum dos casos.
 */

type Mode = "signin" | "signup" | "reset";

type Copy = {
  titleSignin: string;
  titleSignup: string;
  titleReset: string;
  subSignin: string;
  subSignup: string;
  subReset: string;
  google: string;
  or: string;
  email: string;
  password: string;
  confirm: string;
  forgot: string;
  submitSignin: string;
  submitSignup: string;
  submitReset: string;
  busy: string;
  toSignup: string;
  toSignin: string;
  backToSignin: string;
  mismatch: string;
  short: (n: number) => string;
  strength: [string, string, string];
  accept: string;
  terms: string;
  privacy: string;
  and: string;
  mustAccept: string;
  checkEmailTitle: string;
  checkEmailBody: (email: string) => string;
  resend: string;
  resent: string;
  resetSentTitle: string;
  resetSentBody: string;
  unconfigured: string;
};

const PT: Copy = {
  titleSignin: "Entrar na Palmo",
  titleSignup: "Criar conta na Palmo",
  titleReset: "Recuperar senha",
  subSignin: "Use o Google ou seu e-mail e senha.",
  subSignup: "Leva menos de um minuto. Anunciar e negociar é sempre grátis.",
  subReset: "Enviamos um link para você definir uma senha nova.",
  google: "Continuar com Google",
  or: "ou",
  email: "E-mail",
  password: "Senha",
  confirm: "Confirmar senha",
  forgot: "Esqueci minha senha",
  submitSignin: "Entrar",
  submitSignup: "Criar conta",
  submitReset: "Enviar link",
  busy: "Aguarde…",
  toSignup: "Não tem conta? Criar agora",
  toSignin: "Já tem conta? Entrar",
  backToSignin: "Voltar para o login",
  mismatch: "As senhas não são iguais.",
  short: (n) => `A senha precisa de pelo menos ${n} caracteres.`,
  strength: ["Fraca", "Média", "Forte"],
  accept: "Li e aceito os",
  terms: "Termos de Uso",
  privacy: "Política de Privacidade",
  and: "e a",
  mustAccept: "Aceite os Termos e a Política para criar sua conta.",
  checkEmailTitle: "Confirme seu e-mail",
  checkEmailBody: (email) =>
    `Enviamos um link de confirmação para ${email}. Abra a mensagem e clique no link para ativar sua conta. Se não aparecer em alguns minutos, veja o lixo eletrônico.`,
  resend: "Reenviar o link",
  resent: "Link reenviado.",
  resetSentTitle: "Verifique seu e-mail",
  resetSentBody:
    "Se existir uma conta com esse e-mail, o link para definir a senha nova já está a caminho.",
  unconfigured: "A autenticação ainda não está configurada nesta instalação.",
};

const EN: Copy = {
  titleSignin: "Sign in to Palmo",
  titleSignup: "Create your Palmo account",
  titleReset: "Reset your password",
  subSignin: "Use Google or your e-mail and password.",
  subSignup: "Takes under a minute. Listing and negotiating are always free.",
  subReset: "We'll e-mail you a link to set a new password.",
  google: "Continue with Google",
  or: "or",
  email: "E-mail",
  password: "Password",
  confirm: "Confirm password",
  forgot: "I forgot my password",
  submitSignin: "Sign in",
  submitSignup: "Create account",
  submitReset: "Send link",
  busy: "Please wait…",
  toSignup: "No account yet? Create one",
  toSignin: "Already have an account? Sign in",
  backToSignin: "Back to sign in",
  mismatch: "The passwords do not match.",
  short: (n) => `The password needs at least ${n} characters.`,
  strength: ["Weak", "Medium", "Strong"],
  accept: "I have read and accept the",
  terms: "Terms of Use",
  privacy: "Privacy Policy",
  and: "and the",
  mustAccept: "Accept the Terms and the Policy to create your account.",
  checkEmailTitle: "Confirm your e-mail",
  checkEmailBody: (email) =>
    `We sent a confirmation link to ${email}. Open it to activate your account. If it doesn't arrive in a few minutes, check your spam folder.`,
  resend: "Resend the link",
  resent: "Link sent again.",
  resetSentTitle: "Check your e-mail",
  resetSentBody:
    "If an account exists for that address, the link to set a new password is on its way.",
  unconfigured: "Authentication is not configured in this installation yet.",
};

const COPY: Record<AppLang, Copy> = { pt: PT, en: EN, zh: EN, fr: EN, ar: EN };

const inputCls =
  "mt-1.5 w-full rounded-xl border border-deep/15 bg-white px-4 py-3 text-deep placeholder:text-deep/35 focus:border-primary focus:outline-none";

export function SignIn({ next }: { next?: string }) {
  const { lang } = useLanguage();
  const c = COPY[lang];
  const router = useRouter();
  const supabase = getSupabase();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [resent, setResent] = useState(false);

  const dest = safeNext(next);

  // Quem chega aqui JÁ com sessão veio do link de confirmação de e-mail: o
  // cliente do Supabase troca o código da URL sozinho, e nós só levamos a
  // pessoa para onde ela queria ir.
  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive && data.session) router.replace(dest);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) router.replace(dest);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase, dest, router]);

  if (!supabase) {
    return (
      <p className="rounded-xl bg-neutral px-4 py-3 text-sm font-semibold text-deep/70">
        {c.unconfigured}
      </p>
    );
  }

  const score = passwordScore(password);

  function fail(err: unknown, opts?: { emailFlow?: boolean }) {
    setError(authErrorMessage(classifyAuthError(err as never, opts), lang));
  }

  async function withGoogle() {
    setError(null);
    setBusy(true);
    // Sem tratar o retorno, uma falha aqui (destino fora da allowlist do
    // Supabase, provedor desabilitado) deixaria o botão mudo.
    const { error: err } = await supabase!.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}${dest}` },
    });
    if (err) {
      setBusy(false);
      fail(err);
    }
    // Sucesso: o navegador já está saindo para o Google — mantemos `busy`.
  }

  async function signIn() {
    setError(null);
    setBusy(true);
    const { error: err } = await supabase!.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (err) return fail(err);
    router.replace(dest);
  }

  async function signUp() {
    setError(null);
    if (password.length < MIN_PASSWORD_LENGTH) return setError(c.short(MIN_PASSWORD_LENGTH));
    if (password !== confirm) return setError(c.mismatch);
    if (!accepted) return setError(c.mustAccept);

    setBusy(true);
    const address = email.trim();
    const { data, error: err } = await supabase!.auth.signUp({
      email: address,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/entrar?next=${encodeURIComponent(dest)}`,
      },
    });
    setBusy(false);
    if (err) return fail(err, { emailFlow: true });

    // Confirmação LIGADA + e-mail já cadastrado: o Supabase devolve um
    // usuário "vazio" (sem identities) em vez de erro, para não revelar quem
    // tem conta. Tratamos como e-mail já existente.
    if (data.user && (data.user.identities?.length ?? 0) === 0) {
      return setError(authErrorMessage("email_exists", lang));
    }

    if (data.session) {
      // Confirmação DESLIGADA: já entrou. Registra o aceite pelo mesmo
      // caminho do fluxo Google; se falhar, o gate do /app pede de novo.
      void acceptCoreDocs();
      router.replace(dest);
      return;
    }

    setSentTo(address);
  }

  async function sendReset() {
    setError(null);
    setBusy(true);
    const { error: err } = await supabase!.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/nova-senha`,
    });
    setBusy(false);
    if (err) return fail(err, { emailFlow: true });
    setResetSent(true);
  }

  async function resend() {
    if (!sentTo) return;
    setBusy(true);
    await supabase!.auth.resend({ type: "signup", email: sentTo });
    setBusy(false);
    setResent(true);
  }

  /* ── telas de confirmação ── */

  if (sentTo) {
    return (
      <div className="rounded-2xl border border-deep/10 bg-white p-6 shadow-sm sm:p-8">
        <Mail className="h-10 w-10 text-primary" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-deep">
          {c.checkEmailTitle}
        </h1>
        <p className="mt-3 leading-relaxed text-deep/70">{c.checkEmailBody(sentTo)}</p>
        {resent ? (
          <p className="mt-4 flex items-center gap-2 text-sm font-bold text-primary">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            {c.resent}
          </p>
        ) : (
          <button
            type="button"
            onClick={resend}
            disabled={busy}
            className="mt-5 rounded-full border border-deep/20 px-5 py-2.5 text-sm font-bold text-deep transition-colors hover:border-primary disabled:opacity-60"
          >
            {busy ? c.busy : c.resend}
          </button>
        )}
      </div>
    );
  }

  if (resetSent) {
    return (
      <div className="rounded-2xl border border-deep/10 bg-white p-6 shadow-sm sm:p-8">
        <Mail className="h-10 w-10 text-primary" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-deep">
          {c.resetSentTitle}
        </h1>
        <p className="mt-3 leading-relaxed text-deep/70">{c.resetSentBody}</p>
        <button
          type="button"
          onClick={() => {
            setResetSent(false);
            setMode("signin");
          }}
          className="mt-5 rounded-full border border-deep/20 px-5 py-2.5 text-sm font-bold text-deep transition-colors hover:border-primary"
        >
          {c.backToSignin}
        </button>
      </div>
    );
  }

  /* ── painel principal ── */

  const title =
    mode === "signin" ? c.titleSignin : mode === "signup" ? c.titleSignup : c.titleReset;
  const subtitle =
    mode === "signin" ? c.subSignin : mode === "signup" ? c.subSignup : c.subReset;

  return (
    <div className="rounded-2xl border border-deep/10 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-extrabold tracking-tight text-deep sm:text-3xl">
        {title}
      </h1>
      <p className="mt-2 text-deep/70">{subtitle}</p>

      {mode !== "reset" && (
        <>
          <button
            type="button"
            onClick={withGoogle}
            className="mt-6 w-full rounded-full border border-deep/15 bg-white px-6 py-3.5 text-base font-bold text-deep shadow-sm transition-colors hover:border-primary"
          >
            {c.google}
          </button>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-deep/10" />
            <span className="text-xs font-bold uppercase tracking-wide text-deep/40">
              {c.or}
            </span>
            <span className="h-px flex-1 bg-deep/10" />
          </div>
        </>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (busy) return;
          if (mode === "signin") void signIn();
          else if (mode === "signup") void signUp();
          else void sendReset();
        }}
        className="space-y-4"
      >
        <div>
          <label htmlFor="auth-email" className="text-sm font-semibold text-deep">
            {c.email}
          </label>
          <input
            id="auth-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@exemplo.com"
            className={inputCls}
          />
        </div>

        {mode !== "reset" && (
          <div>
            <label htmlFor="auth-password" className="text-sm font-semibold text-deep">
              {c.password}
            </label>
            <input
              id="auth-password"
              type="password"
              required
              minLength={mode === "signup" ? MIN_PASSWORD_LENGTH : undefined}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
            />
            {mode === "signup" && password.length > 0 && (
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
        )}

        {mode === "signup" && (
          <>
            <div>
              <label htmlFor="auth-confirm" className="text-sm font-semibold text-deep">
                {c.confirm}
              </label>
              <input
                id="auth-confirm"
                type="password"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={inputCls}
              />
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-neutral p-4">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-primary)]"
              />
              <span className="text-sm leading-relaxed text-deep">
                {c.accept}{" "}
                <Link
                  href="/termos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-primary underline transition-colors hover:text-primary-dark"
                >
                  {c.terms}
                </Link>{" "}
                {c.and}{" "}
                <Link
                  href="/privacidade"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-primary underline transition-colors hover:text-primary-dark"
                >
                  {c.privacy}
                </Link>
                .
              </span>
            </label>
          </>
        )}

        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-primary px-6 py-3.5 text-base font-bold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy
            ? c.busy
            : mode === "signin"
              ? c.submitSignin
              : mode === "signup"
                ? c.submitSignup
                : c.submitReset}
        </button>
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
        <button
          type="button"
          onClick={() => {
            setError(null);
            setMode(mode === "signup" ? "signin" : "signup");
          }}
          className="font-bold text-primary transition-colors hover:text-primary-dark"
        >
          {mode === "signup" ? c.toSignin : c.toSignup}
        </button>
        {mode === "signin" && (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setMode("reset");
            }}
            className="text-deep/60 transition-colors hover:text-deep"
          >
            {c.forgot}
          </button>
        )}
        {mode === "reset" && (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setMode("signin");
            }}
            className="text-deep/60 transition-colors hover:text-deep"
          >
            {c.backToSignin}
          </button>
        )}
      </div>
    </div>
  );
}
