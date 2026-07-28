import type { Metadata } from "next";
import localFont from "next/font/local";
import { cookies } from "next/headers";
import { Analytics } from "@vercel/analytics/next";
import { LanguageProvider } from "@/lib/language-context";
import { LANG_COOKIE, isAppLang, type AppLang } from "@/lib/lang";
import { siteConfig } from "@/lib/site-config";
import "./globals.css";

// Self-hosted Nunito (matches the logo's typeface) — avoids a Google Fonts
// network request at build/runtime and ships with zero layout shift.
// License: SIL Open Font License 1.1, see app/fonts/OFL-LICENSE.txt
const nunito = localFont({
  variable: "--font-nunito",
  src: [
    { path: "./fonts/nunito-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/nunito-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/nunito-700.woff2", weight: "700", style: "normal" },
    { path: "./fonts/nunito-800.woff2", weight: "800", style: "normal" },
  ],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: "Palmo — Terra parada vira renda",
  description:
    "Conectamos donos de terras paradas a quem quer produzir nelas — com verificação, contrato e acompanhamento. Grátis até fechar negócio.",
  icons: {
    icon: "/palmo-icon.svg",
    apple: "/palmo-app-icon.png",
  },
  openGraph: {
    title: "Palmo — Terra parada vira renda",
    description:
      "Conectamos donos de terras paradas a quem quer produzir nelas — com verificação, contrato e acompanhamento.",
    url: siteConfig.siteUrl,
    siteName: "Palmo",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Palmo — Terra parada vira renda",
    description:
      "Conectamos donos de terras paradas a quem quer produzir nelas.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // O idioma vive num cookie e é resolvido AQUI, no servidor: o HTML já sai
  // no idioma do visitante e a hidratação não troca texto (fim do flash
  // PT→EN). Custo assumido: as páginas passam a ser renderizadas por request.
  const cookieStore = await cookies();
  const cookieLang = cookieStore.get(LANG_COOKIE)?.value;
  const initialLang: AppLang = isAppLang(cookieLang) ? cookieLang : "pt";
  const dir = initialLang === "ar" ? "rtl" : "ltr";

  return (
    <html
      lang={initialLang}
      dir={dir}
      className={`${nunito.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <LanguageProvider initialLang={initialLang}>{children}</LanguageProvider>
        {/* Vercel Web Analytics — only reports from the deployed site
            (localhost/npm run dev sends nothing, by design). */}
        <Analytics />
      </body>
    </html>
  );
}
