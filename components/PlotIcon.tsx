type PlotIconProps = {
  className?: string;
  /** Background circle color for the three "empty" plots. Defaults to primary green. */
  plot?: string;
  /** The one lit-up plot. Defaults to accent yellow. */
  accent?: string;
};

/**
 * The brand mark: a circle (the "o" of palmo) sliced into four plots, one lit
 * up yellow — "the idle plot coming to life." Used sparingly as a decorative
 * motif (see README/brand notes) — not as a repeated UI icon.
 */
export function PlotIcon({
  className,
  plot = "#12994B",
  accent = "#F5BE2E",
}: PlotIconProps) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden="true">
      <defs>
        <clipPath id="plot-circle">
          <circle cx="256" cy="256" r="256" />
        </clipPath>
      </defs>
      <g clipPath="url(#plot-circle)">
        <rect x="0" y="0" width="236" height="236" fill={plot} />
        <rect x="276" y="0" width="236" height="236" fill={plot} />
        <rect x="0" y="276" width="236" height="236" fill={plot} />
        <rect x="276" y="276" width="236" height="236" fill={accent} />
      </g>
    </svg>
  );
}
