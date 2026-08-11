import "server-only";

import { siteConfig } from "@/lib/site-config";
import type { Mail } from "@/lib/mailer";

/**
 * Templates dos e-mails de verificação, em português.
 *
 * HTML de e-mail é o único lugar do projeto onde as cores do tema aparecem
 * como hex cru: cliente de e-mail não roda Tailwind nem CSS externo, tudo
 * precisa ser estilo inline. Os valores abaixo são os mesmos tokens de
 * app/globals.css (@theme) — se um mudar lá, muda aqui.
 */
const COR = {
  deep: "#173d27",
  primary: "#12994b",
  accent: "#f5be2e",
  neutral: "#e4eae5",
  corpo: "#4a6552", // deep a ~70% sobre branco, equivalente ao text-deep/70
};

type Bloco = { titulo: string; linhas: string[]; cta?: { texto: string; url: string } };

const escapar = (v: string) =>
  v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Molde único: cartão branco de cantos arredondados sobre fundo neutro,
 * título em extrabold `deep`, corpo em `deep/70`, botão pill `primary`.
 * É a tradução para tabela HTML das receitas canônicas do sistema de design.
 */
function molde({ titulo, linhas, cta }: Bloco): string {
  const paragrafos = linhas
    .map(
      (l) =>
        `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:${COR.corpo}">${l}</p>`,
    )
    .join("");

  const botao = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 0">
         <tr><td style="border-radius:999px;background:${COR.primary}">
           <a href="${escapar(cta.url)}" style="display:inline-block;padding:14px 24px;border-radius:999px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none">${escapar(cta.texto)}</a>
         </td></tr>
       </table>`
    : "";

  return `<!doctype html>
<html lang="pt-BR"><body style="margin:0;padding:0;background:${COR.neutral}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COR.neutral};padding:32px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;padding:32px;font-family:Arial,Helvetica,sans-serif">
        <tr><td>
          <p style="margin:0 0 4px;font-size:12px;font-weight:bold;letter-spacing:.08em;text-transform:uppercase;color:${COR.primary}">Palmo</p>
          <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;font-weight:800;color:${COR.deep}">${escapar(titulo)}</h1>
          ${paragrafos}
          ${botao}
        </td></tr>
      </table>
      <p style="max-width:560px;margin:16px auto 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:${COR.corpo}">
        Você recebeu este e-mail porque enviou uma verificação de identidade na Palmo.
        <br><a href="${siteConfig.siteUrl}" style="color:${COR.primary}">${siteConfig.siteUrl.replace(/^https?:\/\//, "")}</a>
      </p>
    </td></tr>
  </table>
</body></html>`;
}

const semTags = (linhas: string[]) =>
  linhas.map((l) => l.replace(/<[^>]+>/g, "")).join("\n\n");

// ─────────────────────────── e-mails ao usuário ─────────────────────────────

export function emailAprovado(to: string, automatico: boolean): Mail {
  const linhas = [
    "Sua identidade foi verificada e sua conta já exibe o selo de verificação.",
    automatico
      ? "A conferência foi automática: os dados do CNPJ batem com o cadastro público da Receita Federal."
      : "A conferência foi feita pela nossa equipe.",
    "Anúncios de contas verificadas aparecem com o selo para quem procura terra. É o que faz o outro lado responder.",
  ];
  return {
    to,
    subject: "Palmo · identidade verificada",
    html: molde({
      titulo: "Identidade verificada",
      linhas,
      cta: { texto: "Ver minha conta", url: `${siteConfig.siteUrl}/app/conta` },
    }),
    text: `Identidade verificada\n\n${semTags(linhas)}\n\n${siteConfig.siteUrl}/app/conta`,
  };
}

export function emailRejeitado(to: string, motivo: string): Mail {
  const linhas = [
    "Não conseguimos confirmar sua identidade com o que foi enviado.",
    `<strong style="color:${COR.deep}">Motivo:</strong> ${escapar(motivo)}`,
    "Você pode corrigir e reenviar quantas vezes for preciso. O que mais resolve, na prática:",
    "• conferir se o nome e o documento digitados são exatamente os do cadastro;<br>• fotografar o documento inteiro, sem corte, com os dados legíveis;<br>• usar arquivo nítido, em JPG, PNG ou PDF, de no máximo 10 MB.",
  ];
  return {
    to,
    subject: "Palmo · sua verificação precisa de ajuste",
    html: molde({
      titulo: "Sua verificação precisa de ajuste",
      linhas,
      cta: {
        texto: "Refazer verificação",
        url: `${siteConfig.siteUrl}/app/verificacao`,
      },
    }),
    text: `Sua verificacao precisa de ajuste\n\nMotivo: ${motivo}\n\n${semTags(linhas.slice(2))}\n\n${siteConfig.siteUrl}/app/verificacao`,
  };
}

// ──────────────────────────── e-mail ao admin ───────────────────────────────

export type ItemFila = {
  nome: string;
  documento: string;
  motivos: string[];
};

/**
 * Aviso ao admin de que há caso humano esperando. Sempre resume a fila
 * INTEIRA, não só o caso que acabou de chegar — é o que permite agrupar
 * vários avisos em sequência curta sem perder nenhum.
 */
export function emailFilaAdmin(to: string, itens: ItemFila[]): Mail {
  const total = itens.length;
  const lista = itens
    .slice(0, 15)
    .map(
      (i) =>
        `<li style="margin:0 0 8px"><strong style="color:${COR.deep}">${escapar(i.nome)}</strong> · ${escapar(i.documento)}<br><span style="font-size:13px">${escapar(i.motivos.join(" ") || "sem motivos registrados")}</span></li>`,
    )
    .join("");
  const linhas = [
    total === 1
      ? "Uma verificação está esperando decisão humana."
      : `${total} verificações estão esperando decisão humana.`,
    `<ul style="margin:0 0 12px;padding-left:18px;color:${COR.corpo}">${lista}</ul>`,
    total > 15 ? `E mais ${total - 15} na fila.` : "",
  ].filter(Boolean);

  return {
    to,
    subject:
      total === 1
        ? "Palmo · 1 verificação na fila"
        : `Palmo · ${total} verificações na fila`,
    html: molde({
      titulo: "Fila de verificação",
      linhas,
      cta: { texto: "Abrir a fila", url: `${siteConfig.siteUrl}/app/admin/kyc` },
    }),
    text: `Fila de verificacao\n\n${itens
      .map((i) => `- ${i.nome} (${i.documento}): ${i.motivos.join(" ")}`)
      .join("\n")}\n\n${siteConfig.siteUrl}/app/admin/kyc`,
  };
}
