"use client";
// Interview Agents 3-card pricing grid. Extracted 2026-04-21 for Vercel migration.

import { motion } from "framer-motion";
import { InfoPageBackLink } from "./shell/InfoPageBackLink";
import { PricingCard } from "./PricingCard";
import { pi } from "./shell/animation";
import { useMediaQuery } from "@/components/use-media-query";
import { PAGE_MAX_W } from "@/lib/page-constants";
import type { PageNavProps } from "./nav";

export function InterviewAgentsPage({ onNavigate }: PageNavProps) {
  const goInfo   = () => onNavigate?.("info");
  const isMobile = useMediaQuery("(max-width: 600px)");
  const isTablet = useMediaQuery("(max-width: 860px)");
  const cols     = isMobile ? 1 : isTablet ? 2 : 3;

  return (
    <div style={{ backgroundColor: "#0d0c0b", minHeight: "100vh", color: "#fff", overflowY: "auto" }}>
      <div style={{ maxWidth: PAGE_MAX_W, margin: "0 auto", padding: isMobile ? "32px 20px 60px" : "48px 40px 80px" }}>
        <InfoPageBackLink label="Info" onClick={goInfo} />
        <motion.h2 {...pi(0)} style={{ fontSize: 32, color: "rgba(220,214,208,0.92)", fontWeight: 600, letterSpacing: "-0.02em", margin: "8px 0 12px", lineHeight: 1.1 }}>
          Interview agents.
        </motion.h2>
        <motion.p {...pi(0.07)} className="font-mono" style={{ fontSize: 13, color: "rgba(255,255,255,0.40)", lineHeight: 1.65, margin: "0 0 48px", maxWidth: 480 }}>
          Prep for your interview — communication style, answer depth, and feedback on every answer — designed to help you expand your thinking.
        </motion.p>
        {/* stagger: cards enter one after another — wider gap (80ms) suits their visual weight */}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12, alignItems: "stretch" }}>
          {[
            { name: "Whiteboarding", description: "Define your frameworks, get expansive feedback, and practice in real-time — the way a real session runs.", price: "Free", features: ["A codified framework", "Expansive live feedback", "Practice and feedback mode", "Session memory and tuning"] },
            { name: "App critique", description: "Trained by designers from Stripe, Shopify, and Google. Learn the frameworks that make critique actually land.", price: "$5", features: ["Critique frameworks from Stripe, Shopify, and Google", "Feedback on language", "Focus areas", "Memorable moments"] },
            { name: "Course framework", description: "Point it at any design course. It turns into a mentor — applying the learnings autonomously as you design.", price: "$20", features: ["Any course, any format", "Mentor built from source material", "Applies learnings as you work", "Gets sharper over time"] },
          ].map((card, i) => (
            <motion.div key={card.name} {...pi(0.14 + i * 0.08)} style={{ display: "flex" }}>
              <PricingCard {...card} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
