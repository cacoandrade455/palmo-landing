/**
 * Tradução dos erros de autenticação do Supabase para mensagens que uma
 * pessoa entende. Classificamos pelo `code` (supabase-js novo) e caímos na
 * mensagem em inglês quando o código não vier.
 */

export type AuthErrorKey =
  | "email_exists"
  | "invalid_credentials"
  | "email_not_confirmed"
  | "weak_password"
  | "rate_limit"
  | "signup_disabled"
  | "same_password"
  /** O Supabase não conseguiu ENVIAR o e-mail (SMTP ausente ou no limite). */
  | "email_send_failed"
  | "generic";

type SupabaseishError = { code?: string; message?: string; status?: number } | null;

/**
 * `emailFlow: true` nas ações que DEPENDEM de envio de e-mail (cadastro com
 * confirmação, recuperação de senha). Nelas, um 5xx/`unexpected_failure` do
 * GoTrue é, na prática, o envio falhando — normalmente por falta de SMTP
 * configurado no projeto. Fora desses fluxos não assumimos isso.
 */
export function classifyAuthError(
  err: SupabaseishError,
  opts?: { emailFlow?: boolean },
): AuthErrorKey {
  if (!err) return "generic";
  const code = (err.code ?? "").toLowerCase();
  const msg = (err.message ?? "").toLowerCase();

  if (code === "user_already_exists" || code === "email_exists") return "email_exists";
  if (code === "invalid_credentials") return "invalid_credentials";
  if (code === "email_not_confirmed") return "email_not_confirmed";
  if (code === "weak_password") return "weak_password";
  if (code === "signup_disabled" || code === "email_provider_disabled")
    return "signup_disabled";
  if (code === "same_password") return "same_password";
  if (code.startsWith("over_") || err.status === 429) return "rate_limit";
  // "Error sending confirmation email" / "Error sending recovery email":
  // o cadastro em si está correto; o que falta é SMTP configurado no projeto.
  if (msg.includes("error sending") && msg.includes("email"))
    return "email_send_failed";

  // Sem código: a mensagem do GoTrue ainda identifica os casos comuns.
  if (msg.includes("already registered") || msg.includes("already exists"))
    return "email_exists";
  if (msg.includes("invalid login credentials")) return "invalid_credentials";
  if (msg.includes("email not confirmed")) return "email_not_confirmed";
  if (msg.includes("password should be") || msg.includes("weak password"))
    return "weak_password";
  if (msg.includes("rate limit") || msg.includes("too many"))
    return "rate_limit";

  if (
    opts?.emailFlow &&
    (code === "unexpected_failure" || (err.status ?? 0) >= 500)
  ) {
    return "email_send_failed";
  }
  return "generic";
}

const PT: Record<AuthErrorKey, string> = {
  email_exists:
    "Este e-mail já tem conta na Palmo. Entre com sua senha — ou, se você criou a conta pelo Google, use “Continuar com Google”.",
  invalid_credentials:
    "E-mail ou senha incorretos. Se você criou a conta pelo Google, entre por lá.",
  email_not_confirmed:
    "Confirme seu e-mail antes de entrar. Procure a mensagem que enviamos (veja também o lixo eletrônico).",
  weak_password:
    "Senha fraca. Use pelo menos 8 caracteres, misturando letras e números.",
  rate_limit:
    "Muitas tentativas em pouco tempo. Espere alguns minutos e tente de novo.",
  signup_disabled:
    "O cadastro por e-mail está desativado no momento. Entre com o Google.",
  same_password: "A nova senha precisa ser diferente da anterior.",
  email_send_failed:
    "Não conseguimos enviar o e-mail neste momento. Use “Continuar com Google” ou tente novamente em alguns minutos.",
  generic: "Algo deu errado. Tente novamente em instantes.",
};

const EN: Record<AuthErrorKey, string> = {
  email_exists:
    "This e-mail already has a Palmo account. Sign in with your password — or use “Continue with Google” if that is how you created it.",
  invalid_credentials:
    "Wrong e-mail or password. If you created the account with Google, sign in there.",
  email_not_confirmed:
    "Confirm your e-mail before signing in. Look for the message we sent (check your spam folder too).",
  weak_password:
    "Weak password. Use at least 8 characters, mixing letters and numbers.",
  rate_limit: "Too many attempts. Wait a few minutes and try again.",
  signup_disabled:
    "E-mail sign-up is disabled right now. Please continue with Google.",
  same_password: "The new password must be different from the previous one.",
  email_send_failed:
    "We couldn't send the e-mail right now. Use “Continue with Google” or try again in a few minutes.",
  generic: "Something went wrong. Please try again shortly.",
};

export function authErrorMessage(key: AuthErrorKey, lang: string): string {
  return (lang === "pt" ? PT : EN)[key];
}

/* ────────────────────────── força da senha ────────────────────────── */

export const MIN_PASSWORD_LENGTH = 8;

/** 0 = inaceitável, 1 = fraca, 2 = média, 3 = forte. */
export function passwordScore(pw: string): 0 | 1 | 2 | 3 {
  if (pw.length < MIN_PASSWORD_LENGTH) return 0;
  let variety = 0;
  if (/[a-z]/.test(pw)) variety++;
  if (/[A-Z]/.test(pw)) variety++;
  if (/\d/.test(pw)) variety++;
  if (/[^A-Za-z0-9]/.test(pw)) variety++;
  if (pw.length >= 12 && variety >= 3) return 3;
  if (variety >= 2) return 2;
  return 1;
}

/**
 * Destino pós-login. Só aceita caminho interno: `//evil.com` e URLs absolutas
 * viram o padrão, para o parâmetro `next` não virar redirecionamento aberto.
 */
export function safeNext(next: string | null | undefined, fallback = "/app/conta"): string {
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//")) return fallback;
  return next;
}
