import { redirect } from "next/navigation";

/**
 * The land-use recommender is no longer a parallel tool: it now lives INSIDE
 * the single calculator, reachable by picking "Não sei / me recomende" as the
 * land use. This route stays only as a permanent entry point, redirecting to
 * the calculator with that option pre-selected. The engine
 * (lib/land-recommender.ts) and all data layers are untouched.
 */
export default function RecomendarPage() {
  redirect("/quanto-vale?recomendar=1");
}
