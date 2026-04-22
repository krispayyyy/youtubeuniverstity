"use client";
// "How we calculate" methodology accordion page. Extracted 2026-04-21 for Vercel migration.

import { motion } from "framer-motion";
import { InfoPageShell } from "./shell/InfoPageShell";
import { InfoPageBackLink } from "./shell/InfoPageBackLink";
import { AccordionRow } from "./shell/AccordionRow";
import { pi } from "./shell/animation";
import { METHODOLOGY_ITEMS } from "./content";
import type { PageNavProps } from "./nav";

export function MethodologyPage({ onNavigate }: PageNavProps) {
  const goInfo = () => onNavigate?.("info");

  return (
    <InfoPageShell>
      <InfoPageBackLink label="Info" onClick={goInfo} />
      <motion.h2 {...pi(0)} className="select-none" style={{ fontSize: 32, color: "#fff", fontWeight: 600, margin: "0 0 8px", lineHeight: 1.1 }}>How we calculate</motion.h2>
      <motion.p {...pi(0.07)} className="font-mono" style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.7, margin: "0 0 40px" }}>
        We&apos;d love suggestions on how best to calculate these things, or if there are other items or data that would be valuable to track or represent.
      </motion.p>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {/* stagger shrinks proportionally so total list animation stays ~0.30s regardless of item count */}
        {METHODOLOGY_ITEMS.map((item, i) => (
          <motion.div key={i} {...pi(0.14 + i * Math.min(0.06, 0.30 / METHODOLOGY_ITEMS.length))}>
            <AccordionRow label={item.label} body={item.detail} isLast={i === METHODOLOGY_ITEMS.length - 1} />
          </motion.div>
        ))}
      </div>
    </InfoPageShell>
  );
}
