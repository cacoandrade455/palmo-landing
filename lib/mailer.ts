import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

/**
 * Envio de e-mail transacional por SMTP.
 *
 * Configuração (tudo server-only, sem NEXT_PUBLIC_):
 *   PALMO_SMTP_HOST   servidor SMTP
 *   PALMO_SMTP_PORT   465 (SSL) ou 587 (STARTTLS) — padrão 587
 *   PALMO_SMTP_USER   usuário
 *   PALMO_SMTP_PASS   senha / app password
 *   PALMO_SMTP_FROM   remetente, ex.: Palmo <nao-responda@palmo.lat>
 *
 * São as MESMAS credenciais que o Supabase Auth já usa para mandar os
 * e-mails de login: o Supabase não expõe API para enviar e-mail arbitrário,
 * então o app precisa falar SMTP por conta própria.
 *
 * REGRA: enviar e-mail NUNCA derruba o fluxo que o chamou. Sem configuração,
 * sem rede, servidor recusando — tudo devolve { ok: false } e vira log. Um
 * KYC não pode falhar porque o SMTP estava fora do ar.
 */

export type Mail = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

let cached: Transporter | null = null;

function transporter(): Transporter | null {
  const host = process.env.PALMO_SMTP_HOST;
  const user = process.env.PALMO_SMTP_USER;
  const pass = process.env.PALMO_SMTP_PASS;
  if (!host || !user || !pass) return null;

  if (!cached) {
    const port = Number(process.env.PALMO_SMTP_PORT ?? 587) || 587;
    cached = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // 465 é TLS implícito; 587 sobe por STARTTLS
      auth: { user, pass },
    });
  }
  return cached;
}

export function mailerConfigured(): boolean {
  return transporter() !== null;
}

export async function sendMail(
  mail: Mail,
): Promise<{ ok: boolean; error?: string }> {
  const tx = transporter();
  if (!tx) {
    console.info("[mailer] SMTP nao configurado; e-mail nao enviado:", mail.subject);
    return { ok: false, error: "smtp_unconfigured" };
  }
  if (!mail.to.trim()) return { ok: false, error: "missing_recipient" };

  try {
    await tx.sendMail({
      from: process.env.PALMO_SMTP_FROM ?? process.env.PALMO_SMTP_USER,
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });
    return { ok: true };
  } catch (e) {
    console.error("[mailer] falha ao enviar:", e);
    return { ok: false, error: e instanceof Error ? e.message : "send_failed" };
  }
}
