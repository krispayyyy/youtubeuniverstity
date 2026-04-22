// Navigation abstraction — extracted pages accept onNavigate(target) instead of
// calling Storybook's linkTo directly, so production (Next.js router) and Storybook
// (linkTo) each provide their own implementation without the extracted components
// having to know which environment they run in.

export type PageTarget = "visualization" | "info" | "faq" | "methodology" | "agents";

export interface PageNavProps {
  onNavigate?: (target: PageTarget) => void;
}

export const TARGET_TO_PATH: Record<PageTarget, string> = {
  visualization: "/",
  info:          "/info",
  faq:           "/faq",
  methodology:   "/how-we-calculate",
  agents:        "/interview-agents",
};
