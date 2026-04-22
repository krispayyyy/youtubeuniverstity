"use client";
// FAQ accordion page. Extracted 2026-04-21 for Vercel migration.

import { motion } from "framer-motion";
import { InfoPageShell } from "./shell/InfoPageShell";
import { InfoPageBackLink } from "./shell/InfoPageBackLink";
import { AccordionRow } from "./shell/AccordionRow";
import { pi } from "./shell/animation";
import { FAQ_ITEMS } from "./content";
import type { PageNavProps } from "./nav";

export function FaqPage({ onNavigate }: PageNavProps) {
  const goInfo = () => onNavigate?.("info");

  return (
    <InfoPageShell>
      <InfoPageBackLink label="Info" onClick={goInfo} />
      <motion.h2 {...pi(0)} className="select-none" style={{ fontSize: 32, color: "#fff", fontWeight: 600, margin: "8px 0 12px", lineHeight: 1.1 }}>FAQ</motion.h2>
      <motion.p {...pi(0.07)} style={{ fontSize: 13, color: "rgba(255,255,255,0.38)", lineHeight: 1.65, margin: "0 0 40px", maxWidth: 440 }}>
        For any questions, please email{" "}
        <a href="mailto:karimsaleh.design@gmail.com" style={{ color: "rgba(220,214,208,0.60)", textDecoration: "none" }}>karimsaleh.design@gmail.com</a>
      </motion.p>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {FAQ_ITEMS.map((item, i) => (
          <motion.div key={i} {...pi(0.14 + i * 0.06)}>
            <AccordionRow label={item.q} body={item.a} isLast={i === FAQ_ITEMS.length - 1} />
          </motion.div>
        ))}
      </div>
    </InfoPageShell>
  );
}
