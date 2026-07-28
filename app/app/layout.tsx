import { APP_ENABLED } from "@/lib/feature-flags";
import { ComingSoon } from "@/components/ComingSoon";
import { Header } from "@/components/Header";
import { LegalGate } from "@/components/LegalGate";
import { getLegalStatus } from "./legal-actions";

/**
 * Layout wrapping every /app/* route. Two gates, nesta ordem:
 *
 * 1. DARK LAUNCH — quando a flag está desligada, nada do app é alcançável.
 * 2. ACEITE LEGAL — usuário logado que ainda não aceitou a versão vigente
 *    dos Termos e da Política vê a tela de aceite NO LUGAR do app. Visitante
 *    deslogado passa direto (as telas já pedem login por conta própria), e
 *    enquanto a migration `legal_acceptances` não for aplicada o gate fica
 *    inativo — ver o comentário em legal-actions.ts.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!APP_ENABLED) return <ComingSoon />;

  const { needsAcceptance } = await getLegalStatus();
  if (needsAcceptance) {
    return (
      <>
        <Header />
        <LegalGate />
      </>
    );
  }

  return <>{children}</>;
}
