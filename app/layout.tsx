import type { Metadata } from "next";
import localFont from "next/font/local";
import { LanguageProvider } from "@/lib/language-context";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" className={`${nunito.variable} h-full antialiased`}>
      <body className="min-h-full">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
