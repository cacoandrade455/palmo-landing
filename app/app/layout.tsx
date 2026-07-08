import { APP_ENABLED } from "@/lib/feature-flags";
import { ComingSoon } from "@/components/ComingSoon";

/**
 * Layout wrapping every /app/* route. When the app is disabled, it short-
 * circuits to the branded "em breve" placeholder — so no app screen is
 * reachable by the public until NEXT_PUBLIC_APP_ENABLED is flipped to "true".
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  if (!APP_ENABLED) return <ComingSoon />;
  return <>{children}</>;
}
