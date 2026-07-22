import { redirect } from "next/navigation";

/**
 * The land-use recommender is no longer a parallel tool: it now lives INSIDE
 * the calculator as its "discovery" mode. This route stays only as a permanent
 * entry point, redirecting to the calculator opened straight in that mode. The
 * engine (lib/land-recommender.ts) and all data layers are untouched.
 */
export default function RecomendarPage() {
  redirect("/quanto-vale?descobrir=1");
}
