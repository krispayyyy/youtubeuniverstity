"use client";

/**
 * ElevatedSection
 *
 * Wraps children in a div that overrides CSS custom properties to their
 * "active/elevated" equivalents for the current theme. This fixes the pattern
 * where a component (e.g. a modal) is inside a palette that dims text at rest
 * (e.g. the Ginn grid palette) but needs to display at full brightness because
 * it represents an active, focused state.
 *
 * How it works:
 *   CSS custom properties cascade through the DOM. Setting a variable on a
 *   wrapper div overrides the inherited value for all descendants — this is the
 *   native CSS scoping primitive, not a hack.
 *
 * Usage:
 *   Wrap any modal or active-state content:
 *   <ElevatedSection>...</ElevatedSection>
 */

import * as React from "react";

// Elevated token values by theme — match the Ginn hover/active palette.
// These represent "full attention" state: modal open, card active, etc.
const DARK_ELEVATED: React.CSSProperties = {
  "--color-gray12":   "rgba(255,255,255,0.95)" as string,
  "--color-gray11":   "rgba(255,255,255,0.85)" as string,
  "--color-gray8":    "rgba(255,255,255,0.76)" as string,
  /** Must be set — list row hovers use this; otherwise it falls through to :root and matches elevated secondary. */
  "--text-primary":   "rgba(255,255,255,0.90)" as string,
  "--text-secondary": "rgba(255,255,255,0.80)" as string,
  "--text-muted":     "rgba(255,255,255,0.68)" as string,
  "--text-faint":     "rgba(255,255,255,0.52)" as string,
  "--overlay-subtle": "rgba(255,255,255,0.07)" as string,
  "--overlay-medium": "rgba(255,255,255,0.14)" as string,
  "--overlay-strong": "rgba(255,255,255,0.28)" as string,
} as React.CSSProperties;

const LIGHT_ELEVATED: React.CSSProperties = {
  "--color-gray12":   "rgba(0,0,0,0.92)" as string,
  "--color-gray11":   "rgba(0,0,0,0.80)" as string,
  "--color-gray8":    "rgba(0,0,0,0.68)" as string,
  "--text-primary":   "rgba(0,0,0,0.86)" as string,
  "--text-secondary": "rgba(0,0,0,0.78)" as string,
  "--text-muted":     "rgba(0,0,0,0.64)" as string,
  "--text-faint":     "rgba(0,0,0,0.50)" as string,
  "--overlay-subtle": "rgba(0,0,0,0.05)" as string,
  "--overlay-medium": "rgba(0,0,0,0.10)" as string,
  "--overlay-strong": "rgba(0,0,0,0.22)" as string,
} as React.CSSProperties;

function getTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") === "light"
    ? "light"
    : "dark";
}

export function ElevatedSection({
  children,
  style,
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  const [theme, setTheme] = React.useState<"light" | "dark">(getTheme);

  React.useEffect(() => {
    const observer = new MutationObserver(() => setTheme(getTheme()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  const elevatedVars = theme === "light" ? LIGHT_ELEVATED : DARK_ELEVATED;

  return (
    <div style={{ ...elevatedVars, ...style }} className={className} {...rest}>
      {children}
    </div>
  );
}
