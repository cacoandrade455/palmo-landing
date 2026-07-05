type PlotIconProps = {
  className?: string;
  /** Background square color. Defaults to primary green. */
  bg?: string;
  /** The three "empty" plots. Defaults to white. */
  plot?: string;
  /** The one lit-up plot. Defaults to accent yellow. */
  accent?: string;
};

/**
 * The brand mark: a plot of land seen from above, split into four squares,
 * one lit up yellow — "the idle plot coming to life." Used sparingly as a
 * decorative motif (see README/brand notes) — not as a repeated UI icon.
 */
export function PlotIcon({
  className,
  bg = "#12994B",
  plot = "#FFFFFF",
  accent = "#F5BE2E",
}: PlotIconProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <rect width="100" height="100" rx="30" fill={bg} />
      <rect x="21.9" y="21.9" width="25.8" height="25.8" rx="5.7" fill={plot} />
      <rect x="52.4" y="21.9" width="25.8" height="25.8" rx="5.7" fill={plot} />
      <rect x="21.9" y="52.4" width="25.8" height="25.8" rx="5.7" fill={plot} />
      <rect x="52.4" y="52.4" width="25.8" height="25.8" rx="5.7" fill={accent} />
    </svg>
  );
}
