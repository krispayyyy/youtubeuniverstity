/**
 * Selectable modal list rows — rest / hover / selected text ramp.
 *
 * - In `ElevatedSection` modals, `--text-secondary` and `--color-gray12` are both high-opacity
 *   whites, so unselected idle uses `--text-muted` for a clear gap vs selected.
 * - Hover uses `--text-primary` (also defined on `ElevatedSection`); without it, hover matched
 *   secondary because `--text-primary` fell through to :root.
 */
export function modalListRowTextColors(isSelected: boolean, isHovered: boolean) {
  return {
    rank: isSelected ? "var(--color-gray12)" : isHovered ? "var(--text-secondary)" : "var(--text-faint)",
    title: isSelected ? "var(--color-gray12)" : isHovered ? "var(--text-primary)" : "var(--text-muted)",
    /** Right column: counts, %, day labels */
    value: isSelected ? "var(--color-gray12)" : isHovered ? "var(--text-primary)" : "var(--text-muted)",
    /** Smaller secondary metric (e.g. Builder tier range) — stays softer when selected */
    meta: isSelected ? "var(--text-secondary)" : isHovered ? "var(--text-primary)" : "var(--text-faint)",
  } as const;
}
