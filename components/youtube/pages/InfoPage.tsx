"use client";
// Info landing page — nav rows for FAQ, Interview Agents, How We Calculate.
// Moved verbatim from stories/youtube/FullStory.stories.tsx (2026-04-21 migration).
// Navigation now flows through onNavigate() prop instead of Storybook linkTo().

import { motion } from "framer-motion";
import { InfoPageShell } from "./shell/InfoPageShell";
import { InfoPageBackLink } from "./shell/InfoPageBackLink";
import { InfoNavRow } from "./shell/InfoNavRow";
import { pi } from "./shell/animation";
import { BookTextIcon } from "@/components/ui/icons/book-text";
import { ZapIcon } from "@/components/ui/icons/zap";
import { CompassIcon } from "@/components/ui/icons/compass";
import type { PageNavProps, PageTarget } from "./nav";

export function InfoPage({ onNavigate }: PageNavProps) {
  const go = (target: PageTarget) => () => onNavigate?.(target);

  return (
    <InfoPageShell>
      <InfoPageBackLink label="Visualization" onClick={go("visualization")} />
      {/* title: first content element, enters immediately */}
      <motion.h2 {...pi(0)} className="select-none" style={{ fontSize: 32, color: "#fff", fontWeight: 600, margin: "8px 0 32px", lineHeight: 1.1 }}>Info</motion.h2>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {/* stagger: each row enters 60ms after the previous */}
        {[
          { label: "FAQ", onClick: go("faq"), icon: <BookTextIcon size={14} /> },
          { label: "Interview agents", onClick: go("agents"), icon: <ZapIcon size={14} /> },
          { label: "How we calculate", onClick: go("methodology"), icon: <CompassIcon size={14} /> },
        ].map((row, i) => (
          <motion.div key={row.label} {...pi(0.08 + i * 0.06)}>
            <InfoNavRow label={row.label} onClick={row.onClick} icon={row.icon} />
          </motion.div>
        ))}
      </div>
    </InfoPageShell>
  );
}
