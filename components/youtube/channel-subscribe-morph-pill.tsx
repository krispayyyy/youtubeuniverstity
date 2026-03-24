"use client";

/**
 * Subscribe ↔ Subscribed pill morph.
 *
 * Core principle:
 *   "Animate inner element, let parent resize as side effect."
 *   — No AnimatePresence, no layout prop, no mount/unmount.
 *   — All three elements (bell, text, chevron) are pre-rendered.
 *   — Each has its own width wrapper so the button shrinks/grows organically.
 *
 * Choreography (motion-choreography.md):
 *   Elements don't peak together — each beat has clear cause → effect.
 *   Beats: bell in → surface dark → shake → text peels + padding tightens → chevron pops.
 *
 * Springs (established-patterns.md):
 *   modalSpring   (300/30) — surface color, padding morph
 *   defaultSpring (400/40) — bell width/opacity
 *   snappySpring  (500/50) — chevron arrival
 */

import { motion } from "framer-motion";
import * as React from "react";

const MODAL   = { type: "spring" as const, stiffness: 300, damping: 30 };
const DEFAULT = { type: "spring" as const, stiffness: 400, damping: 40 };
const SNAPPY  = { type: "spring" as const, stiffness: 500, damping: 50 };

// Duration-based only where springs make no sense (opacity on small elements)
const FADE_IN  = { duration: 0.26, ease: [0.22, 1, 0.36, 1] } as const;
// Exits: 2× stiffness rule (clear stale content fast)
const FADE_OUT = { duration: 0.18, ease: [0.4, 0, 1, 1] } as const;
// Text peel: deliberate — user reads the commitment before it collapses
const TEXT_OUT = { duration: 0.30, ease: [0.35, 0, 0.15, 1] } as const;

const SHAKE_EASE: [number, number, number, number] = [0.2, 0.82, 0.35, 1];

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

export interface SubscribePillHandle {
  ring: () => void;
}

export const ChannelSubscribeMorphPill = React.forwardRef<SubscribePillHandle, {
  autoPlay?: boolean;
  initialSubscribed?: boolean;
  /** Only meaningful when initialSubscribed=true. Rings the bell once on mount. */
  ringOnMount?: boolean;
}>(function ChannelSubscribeMorphPill({
  autoPlay = false,
  initialSubscribed = false,
  ringOnMount = false,
}, ref) {
  // --- State (each drives exactly one visual property) ---
  const [showBell,    setShowBell]    = React.useState(initialSubscribed);
  const [showText,    setShowText]    = React.useState(!initialSubscribed);
  const [showChevron, setShowChevron] = React.useState(initialSubscribed);
  const [isDark,      setIsDark]      = React.useState(initialSubscribed);
  const [isCompact,   setIsCompact]   = React.useState(initialSubscribed);
  const [isShaking,   setIsShaking]   = React.useState(false);
  const [textLabel, setTextLabel] = React.useState(initialSubscribed ? "Subscribed" : "Subscribe");
  const [textBlur,  setTextBlur]  = React.useState(false);

  const running       = React.useRef(false);
  const subscribedRef = React.useRef(initialSubscribed);
  const autoFired     = React.useRef(false);
  const isShakingRef  = React.useRef(false);

  React.useImperativeHandle(ref, () => ({
    ring: async () => {
      if (!subscribedRef.current || isShakingRef.current) return;
      isShakingRef.current = true;
      setIsShaking(true);
      await sleep(900);
      setIsShaking(false);
      isShakingRef.current = false;
    },
  }));

  // --- Forward: idle → subscribed ---
  // Note: isDark + textLabel are set in triggerSubscribe before runForward is called.
  // By the time runForward runs, the user is already looking at a dark "Subscribed" pill.
  const runForward = React.useCallback(async () => {
    if (running.current) return;
    running.current = true;
    try {
      // Brief pause — user reads "Subscribed" on the dark surface before anything moves
      await sleep(380);

      // Beat 2 — bell slides in (physical presence of the subscription)
      setShowBell(true);
      await sleep(280);

      // Beat 3 — bell shakes (physical confirmation)
      setIsShaking(true);
      await sleep(900);
      setIsShaking(false);
      await sleep(300);

      // Beat 4 — text collapses + padding tightens
      setShowText(false);
      setIsCompact(true);
      await sleep(360);

      // Beat 5 — chevron arrives
      setShowChevron(true);
      await sleep(280);

      subscribedRef.current = true;
    } finally {
      running.current = false;
    }
  }, []);

  // --- Reverse: subscribed → idle ---
  const runReverse = React.useCallback(async () => {
    if (running.current) return;
    running.current = true;
    subscribedRef.current = false;
    try {
      // Surface lightens immediately on click — don't bury this at the end.
      // The MODAL spring makes it smooth; firing it first means the color transition
      // runs in parallel with everything else rather than arriving late.
      setIsDark(false);
      setShowChevron(false);
      await sleep(160);

      // Bell collapses + padding expands
      setShowBell(false);
      setIsCompact(false);
      await sleep(80);

      // Text fades in while bell is still blurring out (overlap = blend, not jolt)
      setTextLabel("Subscribe");
      setTextBlur(false);
      setShowText(true);
      await sleep(360);
    } finally {
      running.current = false;
    }
  }, []);

  const [isHovered, setIsHovered] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);

  // Press simulation:
  //  0ms  — press + text blurs out fast
  //  50ms — label → "Subscribed" + surface goes dark (both at once, while text is blurred)
  //         text blurs back in as "Subscribed" on the now-dark surface
  // 150ms — press releases, runForward begins (user has been looking at dark "Subscribed")
  const triggerSubscribe = React.useCallback(() => {
    setIsPressed(true);
    setTextBlur(true);

    setTimeout(() => {
      setTextLabel("Subscribed");
      setTextBlur(false);
      setIsDark(true); // color change fires exactly as text is revealing "Subscribed"
    }, 50);

    setTimeout(() => {
      setIsPressed(false);
      void runForward();
    }, 150);
  }, [runForward]);

  // --- Ring on mount: bell shakes once after a short delay ---
  React.useEffect(() => {
    if (!ringOnMount || !initialSubscribed) return;
    const t = window.setTimeout(async () => {
      setIsShaking(true);
      await sleep(900);
      setIsShaking(false);
    }, 400);
    return () => window.clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Auto-play: 2s on white, then simulate press ---
  React.useEffect(() => {
    if (!autoPlay || autoFired.current) return;
    const t = window.setTimeout(() => {
      autoFired.current = true;
      triggerSubscribe();
    }, 2000);
    return () => window.clearTimeout(t);
  }, [autoPlay, triggerSubscribe]);

  const handleClick = React.useCallback(() => {
    if (running.current) return;
    if (!subscribedRef.current) triggerSubscribe();
    else void runReverse();
  }, [triggerSubscribe, runReverse]);

  const handleMouseEnter = React.useCallback(async () => {
    setIsHovered(true);
    if (!subscribedRef.current || running.current) return;
    setIsShaking(true);
    await sleep(900);
    setIsShaking(false);
  }, []);

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={subscribedRef.current ? "Subscribed" : "Subscribe"}
      className="font-mono select-none"
      initial={false}
      animate={{
        backgroundColor: isDark ? "var(--overlay-medium)" : "#ffffff",
        borderColor:     isDark ? "var(--overlay-strong)" : "rgba(0,0,0,0.14)",
        color:           isDark ? "var(--color-gray12)"  : "#0c0c0c",
        paddingLeft:  isCompact ? 14 : 18,
        paddingRight: isCompact ? 14 : 18,
        scale: isPressed ? 0.96 : 1,
      }}
      transition={{
        backgroundColor: { type: "tween", duration: 0.1, ease: "easeOut" },
        borderColor:     { type: "tween", duration: 0.1, ease: "easeOut" },
        color:           { type: "tween", duration: 0.1, ease: "easeOut" },
        paddingLeft:     MODAL,
        paddingRight:    MODAL,
        // Snap down fast, spring back with a slight overshoot (~4%) for satisfying pop
        scale: isPressed
          ? { type: "spring", stiffness: 800, damping: 40 }
          : { type: "spring", stiffness: 380, damping: 12 },
      }}
      style={{
        display:       "inline-flex",
        alignItems:    "center",
        paddingTop:    10,
        paddingBottom: 10,
        borderRadius:  999,
        border:        "1px solid",
        fontSize:      13,
        fontWeight:    500,
        letterSpacing: "-0.02em",
        cursor:        "pointer",
        outline:       "none",
        alignSelf:     "flex-start",
        overflow:      "hidden",
        position:      "relative",
      }}
    >
      {/* Hover + press overlay — press shows a deeper shade so it reads as "clicked" */}
      <motion.span
        aria-hidden
        animate={{
          opacity:         (isHovered || isPressed) ? 1 : 0,
          backgroundColor: isPressed
            ? (isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.10)")
            : (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"),
        }}
        transition={{ duration: 0.1, ease: "linear" }}
        style={{
          position:      "absolute",
          inset:         0,
          borderRadius:  "inherit",
          pointerEvents: "none",
        }}
      />
      {/*
        Bell: two nested spans.
        Outer — controls layout width (pre-rendered, starts at 0).
        Inner — controls opacity + blur + rotation (separate transform context).
        Blur on enter/exit for smooth layer blending.
      */}
      <motion.span
        initial={{ width: 0, marginRight: 0 }}
        animate={{ width: showBell ? 18 : 0, marginRight: showBell ? (isCompact ? 8 : 10) : 0 }}
        transition={{ width: DEFAULT, marginRight: DEFAULT }}
        style={{ display: "inline-flex", flexShrink: 0 }}
      >
        <motion.span
          initial={{ opacity: 0, filter: "blur(4px)" }}
          animate={{
            opacity: showBell ? 1 : 0,
            filter:  showBell ? "blur(0px)" : "blur(4px)",
            rotate:  isShaking ? [0, -16, 14, -11, 9, -7, 5, -4, 0] : 0,
          }}
          transition={{
            opacity: showBell ? FADE_IN : FADE_OUT,
            filter:  showBell ? FADE_IN : FADE_OUT,
            rotate:  isShaking
              ? { duration: 0.90, ease: SHAKE_EASE }
              : { duration: 0.18, ease: SHAKE_EASE },
          }}
          style={{ display: "inline-flex", flexShrink: 0, transformOrigin: "50% 0%" }}
        >
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
        </motion.span>
      </motion.span>

      {/*
        Text: two modes.
        textBlur — quick crossfade for Subscribe→Subscribed swap (50ms out, FADE_IN back)
        showText — slow collapse on beat 4 with blur so it blends with adjacent elements
      */}
      <motion.span
        initial={{ maxWidth: 200, opacity: 1, filter: "blur(0px)" }}
        animate={{
          maxWidth: showText ? 200 : 0,
          opacity:  (showText && !textBlur) ? 1 : 0,
          filter:   textBlur ? "blur(6px)" : (showText ? "blur(0px)" : "blur(3px)"),
        }}
        transition={{
          maxWidth: showText ? DEFAULT : { type: "tween" as const, ...TEXT_OUT },
          opacity:  textBlur
            ? { duration: 0.05, ease: "linear" }
            : (showText ? FADE_IN : { type: "tween" as const, ...TEXT_OUT }),
          filter: textBlur
            ? { duration: 0.05, ease: "linear" }
            : (showText ? FADE_IN : { type: "tween" as const, ...TEXT_OUT }),
        }}
        style={{ overflow: "hidden", whiteSpace: "nowrap", display: "inline-block" }}
      >
        {textLabel}
      </motion.span>

      {/*
        Chevron: blur in on enter, blur out on exit.
      */}
      <motion.span
        initial={{ width: 0, marginLeft: 0, opacity: 0, filter: "blur(4px)" }}
        animate={{
          width:      showChevron ? 14 : 0,
          marginLeft: showChevron ? 8  : 0,
          opacity:    showChevron ? 1  : 0,
          filter:     showChevron ? "blur(0px)" : "blur(4px)",
        }}
        transition={{
          width:      SNAPPY,
          marginLeft: SNAPPY,
          opacity:    showChevron ? FADE_IN : FADE_OUT,
          filter:     showChevron ? FADE_IN : FADE_OUT,
        }}
        style={{ display: "inline-flex", flexShrink: 0 }}
      >
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </motion.span>
      </motion.button>
  );
});

ChannelSubscribeMorphPill.displayName = "ChannelSubscribeMorphPill";

/**
 * Separate link chip — the hyperlink to YouTube lives here, not on the subscribe morph.
 * Keeps the subscribe interaction pure (interaction only, no navigation).
 */
export function ChannelYoutubeLinkChip({ href }: { href: string }) {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-mono select-none"
      aria-label="Open channel on YouTube"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileTap={{ scale: 0.96 }}
      transition={{ scale: { type: "spring", stiffness: 600, damping: 35 } }}
      style={{
        display:         "inline-flex",
        alignItems:      "center",
        justifyContent:  "center",
        width:           40,
        height:          40,
        borderRadius:    999,
        border:          "1px solid var(--overlay-strong)",
        backgroundColor: "var(--overlay-medium)",
        color:           "var(--color-gray12)",
        textDecoration:  "none",
        flexShrink:      0,
        position:        "relative",
        overflow:        "hidden",
      }}
    >
      {/* Hover overlay — matches the pill's pattern exactly */}
      <motion.span
        aria-hidden
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.15, ease: "linear" }}
        style={{
          position:        "absolute",
          inset:           0,
          borderRadius:    "inherit",
          pointerEvents:   "none",
          backgroundColor: "rgba(255,255,255,0.08)",
        }}
      />
      <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden
           style={{ position: "relative" }}>
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
    </motion.a>
  );
}
