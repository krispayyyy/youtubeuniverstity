import * as React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { linkTo } from "@storybook/addon-links";
import { useMediaQuery } from "@/components/use-media-query";
import { MOCK_STATS } from "./mock-data";
import ContributionHeatmap from "@/components/youtube/contribution-heatmap";
import Odometer from "@/components/youtube/odometer";
import YouTubeLineGraph, { ProgressRing } from "@/components/youtube/youtube-line-graph";
import CategoryBars from "@/components/youtube/category-bars";
import { ParticleMorph } from "@/components/particles/particle-morph";
import { ATOM_SHAPE_INDEX, ROCKET_SHAPE_INDEX, PLAY_SHAPE_INDEX, SHAPE_NAMES, ALL_SHAPES_X, ALL_SHAPES_Y } from "@/components/particles/shapes";
import ShareCardIterationTwo from "@/components/youtube/share-card-iteration-two";
import { formatHour, AVG_VIDEO_MINUTES, computeDesignEngineerScore } from "@/lib/compute-stats";
import type { YouTubeStats } from '@/lib/compute-stats';
import rawDefaultStats from '@/data/stats.json';
import { motion, AnimatePresence } from "framer-motion";
import { PixelReveal } from "@/components/ui/pixel-reveal";
import { ElevatedSection } from "@/components/ui/elevated-section";
import TypewriterSearchBar from "@/components/youtube/top-searches";
import { GrowthTickerInteractive } from "@/components/youtube/growth-ticker";
import { DotMatrixCTA, CTAContainer, SIZE } from "@/components/ui/dot-matrix-cta";
import BuilderEnergy from "@/components/youtube/builder-energy";
import { modalListRowTextColors } from "@/components/youtube/modal-list-styles";
import { UploadModal } from "@/components/ui/upload-modal";
import { CoffeeIcon }        from "@/components/ui/icons/coffee";
import { MoonIcon }          from "@/components/ui/icons/moon";
import { SunIcon }           from "@/components/ui/icons/sun";
import { HeartIcon }         from "@/components/ui/icons/heart";
import { FlameIcon }         from "@/components/ui/icons/flame";
import { ZapIcon }           from "@/components/ui/icons/zap";
import { SparklesIcon }      from "@/components/ui/icons/sparkles";
import { RocketIcon }        from "@/components/ui/icons/rocket";
import { BrainIcon }         from "@/components/ui/icons/brain";
import { GraduationCapIcon } from "@/components/ui/icons/graduation-cap";
import { BookTextIcon }      from "@/components/ui/icons/book-text";
import { CookingPotIcon }    from "@/components/ui/icons/cooking-pot";
import { PartyPopperIcon }   from "@/components/ui/icons/party-popper";
import { HomeIcon }          from "@/components/ui/icons/home";
import { MapPinIcon }        from "@/components/ui/icons/map-pin";
import { CompassIcon }       from "@/components/ui/icons/compass";
import { TelescopeIcon }     from "@/components/ui/icons/telescope";
import { MessageCircleIcon } from "@/components/ui/icons/message-circle";
import { SmileIcon }         from "@/components/ui/icons/smile";
import { LaughIcon }         from "@/components/ui/icons/laugh";
import { HandHeartIcon }     from "@/components/ui/icons/hand-heart";
import { WavesIcon }         from "@/components/ui/icons/waves";
import { SnowflakeIcon }     from "@/components/ui/icons/snowflake";
import { RockingChairIcon }  from "@/components/ui/icons/rocking-chair";
import { CctvIcon }          from "@/components/ui/icons/cctv";
import { FrameIcon }         from "@/components/ui/icons/frame";
import { HandMetalIcon }     from "@/components/ui/icons/hand-metal";
import { FilterBar } from "../../components/youtube/filter-bar";
import {
  type SpecialTopChannelKind,
  getSpecialTopChannelKind,
  getTopVideosForChannel,
  getChannelUrlForChannel,
  TOP_CHANNEL_MODAL_HERO_VIDEO,
  TopChannelCardInner,
  TopChannelPicksModal,
  SubscriptionsCardInner,
  SubscriptionsModal,
  LateNightLearningModal,
  LATE_NIGHT_PERSONAS,
} from "../../components/youtube/modals/DataStories";
import { EnjProgress, ProgressPill, DEFAULT_GLASS, ChecklistModal1 } from "../../components/youtube/modals/EnjProgress";

// ─── Phase 1 migration extractions ───────────────────────────────────────────
import { DEFAULT_STATS } from "@/lib/hydrate-stats";
import { splitHoursMinutes } from "@/lib/format-helpers";
import { PAGE_MAX_W, PAGE_PAD } from "@/lib/page-constants";
import { BUILDER_PROFILES, calcBuilderProfile, type BuilderProfileId } from "@/lib/calc-builder-profile";
import { FOCUS_SORTED_ORGANIC, FOCUS_SORTED_YOUTUBE, FOCUS_DIM, buildFocusColorMap, useIsDark } from "@/components/youtube/focus-color-map";

// hydrateStats + DEFAULT_STATS now live in @/lib/hydrate-stats.
// splitHoursMinutes now lives in @/lib/format-helpers.
// (moved 2026-04-21 for Vercel migration)

// Focus color map, useIsDark, PAGE_MAX_W, PAGE_PAD — extracted to:
//   @/components/youtube/focus-color-map  (FOCUS_SORTED_*, buildFocusColorMap, useIsDark, FOCUS_DIM)
//   @/lib/page-constants                  (PAGE_MAX_W, PAGE_PAD)
// (moved 2026-04-21 for Vercel migration)

// ─── Divider ──────────────────────────────────────────────────────────────────
function Divider() {
  return (
    <div style={{ maxWidth: PAGE_MAX_W, margin: "0 auto", padding: PAGE_PAD }}>
      <div style={{ height: 1 }} />
    </div>
  );
}

// ─── Chapter ──────────────────────────────────────────────────────────────────
function Chapter({ n, title, sub }: { n: string; title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--color-gray8)", letterSpacing: "0.2em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
        {n}
      </span>
      <h2 className="font-mono select-none" style={{ fontSize: 20, color: "var(--color-gray12)", letterSpacing: "-0.02em", margin: 0, marginBottom: sub ? 6 : 0, fontWeight: 400 }}>
        {title}
      </h2>
      {sub && (
        <p className="font-mono select-none" style={{ fontSize: 12, color: "var(--color-gray9)", margin: 0, letterSpacing: "-0.01em" }}>
          {sub}
        </p>
      )}
    </div>
  );
}

// ─── Stat pill ────────────────────────────────────────────────────────────────

// ─── Domain row ───────────────────────────────────────────────────────────────
function DomainRow({ label, pct, channels, isTop, index }: { label: string; pct: number; channels: string[]; isTop: boolean; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, filter: "blur(4px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.3, ease: "easeOut", delay: index * 0.08 }}
      style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "12px 32px", paddingBottom: 24, borderBottom: "1px solid var(--overlay-subtle)" }}
    >
      <div>
        <span className="font-mono select-none" style={{ fontSize: 13, color: isTop ? "var(--color-gray12)" : "var(--color-gray9)", letterSpacing: "-0.01em", display: "block", marginBottom: 6 }}>
          {label}
        </span>
        <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--color-gray8)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {channels.join("  ·  ")}
        </span>
      </div>
      <div style={{ textAlign: "right", paddingTop: 2 }}>
        <span className="font-mono select-none" style={{ fontSize: 22, color: isTop ? "var(--color-orange)" : "var(--color-gray8)", letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>
          {pct.toFixed(1)}%
        </span>
      </div>
    </motion.div>
  );
}

// ─── Ghost action (inside share modal) ───────────────────────────────────────
function GhostAction({
  icon,
  label,
  onClick,
  active = false,
  disabled = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  const [hovered, setHovered] = React.useState(false);
  const color = active
    ? "var(--color-orange)"
    : hovered
    ? "var(--color-gray12)"
    : "var(--color-gray8)";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: "none",
        border: "none",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.35 : 1,
        // padding: outer section breathing room — container sits inset from the third edges
        padding: "10px 10px",
        transition: "opacity 0.15s",
      }}
    >
      {/* Hover container — rounded rect that brightens within each third */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 7,
          width: "100%",
          // padding: inner content breathing room inside the hover rect
          padding: "8px 0",
          // border-radius: slightly rounded edges (try 10px for rounder, 4px for tighter)
          borderRadius: 8,
          // background: var(--overlay-medium) on hover = rgba(255,255,255,0.08) in dark mode
          backgroundColor: hovered ? "var(--overlay-medium)" : "transparent",
          transition: "background-color 0.15s ease",
        }}
      >
        <span style={{ color, transition: "color 0.15s", display: "flex" }}>{icon}</span>
        <span
          className="font-mono select-none"
          style={{ fontSize: 9, color, letterSpacing: "0.08em", textTransform: "uppercase", transition: "color 0.15s" }}
        >
          {label}
        </span>
      </div>
    </button>
  );
}

// ─── Share modal ──────────────────────────────────────────────────────────────
function ShareModal({ onClose, stats }: { onClose: () => void; stats: YouTubeStats }) {
  const [copied, setCopied] = React.useState(false);
  const [downloading, setDownloading] = React.useState(false);
  const [recording, setRecording] = React.useState(false);
  const [xReady, setXReady] = React.useState(false);
  const cardCaptureRef = React.useRef<HTMLDivElement>(null);

  // Close on Escape + lock scroll behind modal
  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  async function handleCopyLink() {
    try { await navigator.clipboard.writeText("https://youtubeuniverstity.vercel.app"); } catch { /* noop */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDownload() {
    if (!cardCaptureRef.current) return;
    setDownloading(true);
    try {
      const { toPng } = await import("html-to-image");
      // no backgroundColor: card's own borderRadius + overflow:hidden clips the corners in the PNG
      const dataUrl = await toPng(cardCaptureRef.current, { pixelRatio: 2 });
      const a = document.createElement("a");
      a.download = "youtube-profile.png";
      a.href = dataUrl;
      a.click();
    } catch (err) { console.error(err); }
    finally { setDownloading(false); }
  }

  function openXIntent() {
    const text = encodeURIComponent("My YouTube learning profile — 56,068 videos. AI-native. Design-focused. Built from raw Google Takeout data. #YouTubeAsAUniversity\n\n[drag in your video from downloads]");
    const url = encodeURIComponent("https://youtubeuniverstity.vercel.app");
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  }

  async function handlePostToX() {
    if (recording) return;
    setRecording(true);

    setXReady(false);

    try {
      const cardEl = cardCaptureRef.current;
      if (!cardEl) { openXIntent(); return; }

      // ── Step 1: capture the card as a static PNG with the sphere hidden ──────
      // We blank the sphere so html-to-image doesn't freeze it mid-frame —
      // the sphere area will be filled by the pre-recorded video in compositing
      const sphereCanvas = cardEl.querySelector("canvas") as HTMLCanvasElement | null;
      if (sphereCanvas) sphereCanvas.style.visibility = "hidden";
      const { toPng } = await import("html-to-image");
      const cardDataUrl = await toPng(cardEl, { pixelRatio: 2 });
      if (sphereCanvas) sphereCanvas.style.visibility = "";

      // Load the static card image
      const cardImg = new Image();
      cardImg.src = cardDataUrl;
      await new Promise<void>((r) => { cardImg.onload = () => r(); });

      // ── Step 2: load the pre-recorded sphere loop ─────────────────────────────
      const videoRes = await fetch("./sphere-loop.mp4");
      if (!videoRes.ok) { openXIntent(); return; }
      const videoBlob = await videoRes.blob();
      const videoUrl = URL.createObjectURL(videoBlob);

      const video = document.createElement("video");
      video.src = videoUrl;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      await new Promise<void>((r) => { video.onloadeddata = () => r(); });
      video.play();

      // ── Step 3: measure sphere position inside the card ───────────────────────
      // getBoundingClientRect gives us the sphere's pixel rect relative to the viewport;
      // subtracting the card's rect gives us its offset within the card.
      const PR = 2; // pixel ratio — must match toPng pixelRatio above
      const cardRect = cardEl.getBoundingClientRect();
      // Use [data-sphere-well] rect — the 200px clipping container, not the raw 425px canvas.
      // Querying by data attribute is reliable regardless of component wrapper depth.
      let sphereRect: { x: number; y: number; w: number; h: number } | null = null;
      const wellEl = cardEl.querySelector("[data-sphere-well]") as HTMLElement | null;
      if (wellEl) {
        const sr = wellEl.getBoundingClientRect();
        sphereRect = {
          x: (sr.left - cardRect.left) * PR,
          y: (sr.top  - cardRect.top)  * PR,
          w: sr.width  * PR,
          h: sr.height * PR,
        };
      }

      // ── Step 4: composite on an offscreen canvas ──────────────────────────────
      const W = cardRect.width  * PR;
      const H = cardRect.height * PR;
      const offscreen = document.createElement("canvas");
      offscreen.width  = W;
      offscreen.height = H;
      const ctx = offscreen.getContext("2d")!;

      // rAF loop: static card + video frames in the sphere slot
      let rafId: number;
      // card borderRadius: 12px × PR — clip the entire composite to match
      const CARD_RADIUS = 12 * PR;
      function drawFrame() {
        ctx.clearRect(0, 0, W, H);
        // clip everything to rounded rect — matches the card's borderRadius: 12
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(0, 0, W, H, CARD_RADIUS);
        ctx.clip();
        // fill with card's sphere background — transparent pixels encode as green in video
        ctx.fillStyle = "#1B1718";
        ctx.fillRect(0, 0, W, H);
        ctx.drawImage(cardImg, 0, 0, W, H); // static card (stats + blank sphere area)
        if (sphereRect && video.readyState >= 2) {
          const vw = video.videoWidth;   // 1036 (square)
          const vh = video.videoHeight;  // 1036
          const dw = sphereRect.w;       // well width  × PR (wide)
          const dh = sphereRect.h;       // well height × PR (200px × PR = short)

          // Scale to FILL WIDTH — the well is wider than it is tall so scaling by height
          // would leave black bars on the sides. Scale by width then crop vertically.
          const scale = dw / vw;         // fill the well's full width
          const srcH = dh / scale;       // how many px of video height we need to fill the well
          // Position the sphere center at ~60% of the well height (matches the card's
          // translateY(-14%) + scale(1.22) which pushes the sphere slightly past center)
          const srcY = Math.max(0, (vh / 2) - (srcH * 0.6));

          ctx.save();
          ctx.beginPath();
          ctx.rect(sphereRect.x, sphereRect.y, dw, dh);
          ctx.clip(); // clip to well bounds — sphere's bottom naturally cuts off here
          ctx.drawImage(video, 0, srcY, vw, srcH, sphereRect.x, sphereRect.y, dw, dh);
          ctx.restore();
        }
        ctx.restore(); // release the outer rounded-rect clip
        rafId = requestAnimationFrame(drawFrame);
      }
      drawFrame();

      // ── Step 5: record the composite canvas for 10 seconds ───────────────────
      // prefer mp4 for X compatibility; fall back to webm if unsupported
      const mimeType =
        ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm"].find((m) => MediaRecorder.isTypeSupported(m)) ??
        "video/webm";
      const stream = (offscreen as HTMLCanvasElement & { captureStream(fps?: number): MediaStream }).captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

      await new Promise<void>((resolve) => {
        recorder.onstop = () => {
          cancelAnimationFrame(rafId);
          video.pause();
          URL.revokeObjectURL(videoUrl);
          const blob = new Blob(chunks, { type: mimeType });
          const objUrl = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.download = `youtube-profile.${mimeType.includes("mp4") ? "mp4" : "webm"}`;
          a.href = objUrl;
          a.click();
          setTimeout(() => URL.revokeObjectURL(objUrl), 5000);
          resolve();
        };
        recorder.start(1000);
        setTimeout(() => recorder.stop(), 10000);
      });

      setXReady(true);
    } catch (err) {
      console.error(err);
      openXIntent();
    } finally {
      setRecording(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          backgroundColor: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          zIndex: 200,
        }}
      />

      {/*
        Centering wrapper — static flex, full-screen.
        The motion.div inside handles animation only (y/opacity/blur).
        Keeping centering out of motion.div avoids Framer overwriting
        the CSS translate(-50%,-50%) with its own transform string.
      */}
      <div
        style={{
          position: "fixed", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 201, pointerEvents: "none",
        }}
      >
        {/* Exit-animation wrapper — entry is handled by PixelReveal below */}
        <motion.div
          exit={{ opacity: 0, y: 8, filter: "blur(6px)" }}
          transition={{
            opacity: { duration: 0.14, ease: "easeIn" },
            filter: { duration: 0.14, ease: "easeIn" },
            y: { type: "spring", stiffness: 600, damping: 35 },
          }}
          style={{ pointerEvents: "all" }}
        >
          <PixelReveal
            id="share-modal"
            pixelColor="#111"
            style={{
              position: "relative",
              backgroundColor: "var(--bg-primary)",
              borderRadius: 8,
              border: "1px solid rgba(255, 255, 255, 0.08)",
              boxSizing: "border-box",
              width: 358,
              maxWidth: "90vw",
              overflow: "hidden",
              boxShadow: "0 32px 80px rgba(0, 0, 0, 0.9)",
              display: "flex",
              flexDirection: "column",
              alignItems: "stretch",
            }}
          >
          {/* Subtle × close — top right */}
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 10, right: 10,
              background: "none", border: "none", cursor: "pointer",
              color: "var(--text-faint)", fontSize: 16, lineHeight: 1,
              padding: "4px 6px", borderRadius: 4,
              transition: "color 0.15s",
              zIndex: 1,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-faint)"; }}
          >
            ×
          </button>

          {/* Card — captured area for download. Styled as the floating card so the PNG matches. */}
          <div
            ref={cardCaptureRef}
            style={{
              backgroundColor: "var(--bg-primary)",
              borderRadius: 12,
              // overflow:hidden clips all children to the border-radius — transparent corners in PNG
              overflow: "hidden",
              // inset box-shadow instead of border: follows border-radius reliably in html-to-image
              // (border renders outside the clip and can appear sharp-cornered in the capture)
              boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.08)",
            }}
          >
            <ShareCardIterationTwo stats={stats} />
          </div>

          {/* Divider */}
          <div style={{ width: "100%", height: 1, backgroundColor: "rgba(255, 255, 255, 0.07)" }} />

          {/* Ghost actions — horizontal row */}
          <div style={{ display: "flex", width: "100%", alignItems: "stretch", backgroundColor: "var(--bg-primary)" }}>
            <GhostAction
              icon={
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M5.5 3H3C2.72386 3 2.5 3.22386 2.5 3.5V11C2.5 11.2761 2.72386 11.5 3 11.5H11C11.2761 11.5 11.5 11.2761 11.5 11V8.5M9 2.5H11.5M11.5 2.5V5M11.5 2.5L7 7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
              label={copied ? "Copied" : "Copy link"}
              onClick={handleCopyLink}
              active={copied}
            />

            <div style={{ width: 1, backgroundColor: "rgba(255, 255, 255, 0.07)", margin: "10px 0" }} />

            <GhostAction
              icon={
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 2V9.5M7 9.5L4.5 7M7 9.5L9.5 7M2.5 11.5H11.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
              label={downloading ? "Saving…" : "Download"}
              onClick={handleDownload}
              disabled={downloading}
            />

            <div style={{ width: 1, backgroundColor: "rgba(255, 255, 255, 0.07)", margin: "10px 0" }} />

            <GhostAction
              icon={
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M11.3 2H13L9.2 6.6L13.5 13H10.1L7.4 9.4L4.3 13H2.5L6.6 8.1L2.5 2H6L8.5 5.2L11.3 2ZM10.7 12H11.7L5.2 3H4.2L10.7 12Z" fill="currentColor"/>
                </svg>
              }
              label={recording ? "Recording…" : xReady ? "✓ Video ready" : "Post to X"}
              onClick={handlePostToX}
              disabled={recording}
            />
          </div>

          {/* After recording: direct link button — fresh click = no popup blocker */}
          {xReady && (
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("My YouTube learning profile — 56,068 videos. AI-native. Design-focused. Built from raw Google Takeout data. #YouTubeAsAUniversity\n\n[drag in your video from downloads]")}&url=${encodeURIComponent("https://youtubeuniverstity.vercel.app")}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "block",
                margin: "0 16px 14px",
                padding: "10px",
                borderRadius: 6,
                backgroundColor: "rgba(29,161,242,0.12)",
                border: "1px solid rgba(29,161,242,0.25)",
                color: "rgba(29,161,242,0.9)",
                fontSize: 10,
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                textAlign: "center",
                textDecoration: "none",
              }}
            >
              Open X draft →
            </a>
          )}
          </PixelReveal>
        </motion.div>
      </div>
    </>
  );
}

// ─── Page CTA Bar — theme toggle + share, fixed top-right ────────────────────
// Uses a self-contained theme toggle (reads data-theme directly) so it doesn't
// conflict with the Storybook withTheme decorator.

function PageThemeToggle() {
  const [isDark, setIsDark] = React.useState(
    () => document.documentElement.getAttribute("data-theme") !== "light"
  );
  const [isHovered, setIsHovered] = React.useState(false);
  const s = SIZE.sm;

  const toggle = () => {
    const next = isDark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("yt-theme", next);
    setIsDark(!isDark);
  };

  // Nudge 25° toward the click destination on hover so the user can
  // anticipate the full 180° spin before committing.
  const baseRotate = isDark ? 0 : 180;
  const hoverRotate = isDark ? 25 : 155;
  const rotate = isHovered ? hoverRotate : baseRotate;

  return (
    <CTAContainer onClick={toggle} ariaLabel={`Switch to ${isDark ? "light" : "dark"} mode`} size="sm" onHoverChange={setIsHovered}>
      {/* Inner square — inverted bg + exact height of DotMatrixCTA sm */}
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: s.toggleInnerSize, height: s.toggleInnerSize,
          borderRadius: s.toggleInnerRadius,
          backgroundColor: "var(--text-primary)",  // cream on dark, black on light
        }}
      >
        <motion.svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          animate={{ rotate }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {isDark ? (
            <motion.path
              d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
              stroke="var(--bg-primary)" initial={false} animate={{ pathLength: 1 }}
            />
          ) : (
            <g stroke="var(--bg-primary)">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </g>
          )}
        </motion.svg>
      </div>
    </CTAContainer>
  );
}

// ─── Page footer — copyright + info CTA ──────────────────────────────────────
// Normal flow — sits below the grid, nudges with the page content
function PageFooter() {
  const goInfo = linkTo("YouTube University", "Info");
  return (
    <div style={{ maxWidth: PAGE_MAX_W, margin: "0 auto", padding: "32px 40px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.12em" }}>
        © 2026 YouTube University
      </span>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <button
          onClick={goInfo}
          className="font-mono select-none"
          style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.12em", background: "none", border: "none", cursor: "pointer", padding: 0, transition: "color 0.15s ease" }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--text-secondary)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--text-faint)")}
        >
          Info
        </button>
        <button
          onClick={linkTo("YouTube University", "Interview Agents")}
          className="font-mono select-none"
          style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.12em", background: "none", border: "none", cursor: "pointer", padding: 0, transition: "color 0.15s ease" }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--text-secondary)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--text-faint)")}
        >
          Agents
        </button>
      </div>
    </div>
  );
}

// ─── Info pages — shared data ─────────────────────────────────────────────────
const FAQ_ITEMS = [
  { q: "Do we store your data?", a: "No. Everything runs entirely in your browser — your Takeout file never touches a server. Close the tab and it's gone." },
  { q: "What file do I need?", a: "A Google Takeout export with YouTube history and subscriptions selected. No login required — just export, upload, and explore." },
  { q: "Is this all my watch history?", a: "Not quite — by design. Shorts, music, gaming, and entertainment are all excluded. This dashboard is focused on how you learn, not cute pet videos." },
];

const METHODOLOGY_ITEMS = [
  { label: "Videos counted", detail: "Each entry in watch-history.html is one video. Re-watches within 15 seconds are filtered as duplicates." },
  { label: "Categories", detail: "Titles and channel names are matched against keyword lists for AI, design, engineering, and startup. Everything else is excluded." },
  { label: "Builder Energy", detail: "A composite score across category balance, daily consistency, and total volume. Ranges 0–1." },
  { label: "Night owl %", detail: "How much of your watching happened between midnight and 5am." },
  { label: "Peak hour", detail: "The single hour of day where you watched the most, across your full history." },
  { label: "Binge days", detail: "Days with 15 or more videos. Your biggest single-day deep dives." },
  { label: "Rabbit holes", detail: "Days where 85% or more of your watches landed in one category, with at least 6 total. Signals a real focus day." },
  { label: "Longest streak", detail: "Most consecutive days with 5 or more videos in one category." },
  { label: "Top channel", detail: "The channel you've watched the most individual videos from." },
  { label: "Searches", detail: "Your most repeated search terms, surfaced from your search history and ranked by frequency." },
];

// Shared back-link used at the top of every info sub-page
function InfoPageBackLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-faint)", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 48, transition: "color 0.15s ease" }}
      onMouseEnter={e => (e.currentTarget.style.color = "var(--text-secondary)")}
      onMouseLeave={e => (e.currentTarget.style.color = "var(--text-faint)")}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="7 2 3 6 7 10" />
      </svg>
      {label}
    </button>
  );
}

// Shared full-page wrapper — matches main page bg exactly, centered column, scrollable
function InfoPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: "#0C0C0B", minHeight: "100vh", color: "#fff", overflowY: "auto" }}>
      {/* tighter column with side breathing room */}
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "48px 32px 80px" }}>
        {children}
      </div>
    </div>
  );
}

// Subtle rounded divider — replaces borderBottom so we can round the ends
function RowDivider() {
  return (
    <div style={{
      height: 1,
      borderRadius: 999,
      backgroundColor: "rgba(255,255,255,0.05)",
      margin: "0 2px",
    }} />
  );
}

// Small dark icon box — uses same gradient fill + shadow as the pricing cards
function InfoIconBox({ children, hovered }: { children: React.ReactNode; hovered?: boolean }) {
  return (
    <div style={{
      width: 32, height: 32,
      background: hovered
        ? "#252321"
        : "linear-gradient(175deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 55%), #191614",
      border: `1px solid ${hovered ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.09)"}`,
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -2px 5px rgba(0,0,0,0.55), 0 0 0 0.5px rgba(255,255,255,0.04)",
      borderRadius: 8,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
      color: hovered ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.45)",
      transition: "background 0.15s ease, border-color 0.15s ease, color 0.12s ease",
    }}>
      {children}
    </div>
  );
}

// Collapsible accordion row — hover extends slightly past column edges (Membership-style)
function AccordionRow({ label, body, isLast }: { label: string; body: string; isLast?: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          // negative margin + matching padding makes the hover bg bleed 12px on each side
          margin: "0 -12px",
          width: "calc(100% + 24px)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 12px",
          background: hovered ? "rgba(255,255,255,0.05)" : "none",
          // borderRadius: rounds the bg only when visible (try 6 for subtler, 12 for pill-ish)
          borderRadius: 10,
          border: "none", cursor: "pointer", color: "#fff", textAlign: "left",
          transition: "background 0.12s ease",
        }}
      >
        <span className="font-mono" style={{ fontSize: 15, letterSpacing: "-0.01em", fontWeight: 500, color: "#fff" }}>{label}</span>
        {/* chevron rotates 90° when open */}
        <motion.svg
          animate={{ rotate: open ? 90 : 0, x: hovered && !open ? 1 : 0 }}
          // snappySpring: toggle feels instantaneous — spring tracks gesture, not a timer
          transition={{ type: "spring", stiffness: 500, damping: 50 }}
          width="13" height="13" viewBox="0 0 12 12" fill="none"
          stroke={hovered ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.35)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transition: "stroke 0.12s ease" }}
        >
          <polyline points="4 2 8 6 4 10" />
        </motion.svg>
      </button>
      {/* body slides open — AnimatePresence unmounts it so layout collapses cleanly */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: "auto",
              opacity: 1,
              transition: {
                // defaultSpring: organic open — height breathes in, not snaps
                height: { type: "spring", stiffness: 400, damping: 40 },
                // opacity trails height by 40ms so content doesn't flash before space opens
                opacity: { type: "spring", stiffness: 400, damping: 40, delay: 0.04 },
              },
            }}
            exit={{
              height: 0,
              opacity: 0,
              transition: {
                // exits lead — 2× stiffness so collapse is crisper than open
                height: { type: "spring", stiffness: 800, damping: 40 },
                // opacity snaps out ahead of height so it reads as intentional dismissal
                opacity: { duration: 0.08 },
              },
            }}
            style={{ overflow: "hidden" }}
          >
            <p className="font-mono" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, margin: "0 0 18px", paddingRight: 24 }}>{body}</p>
          </motion.div>
        )}
      </AnimatePresence>
      {!isLast && <RowDivider />}
    </div>
  );
}

// Info nav row — extracted so useState is called at component top level (not inside map)
function InfoNavRow({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div>
      <button
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          margin: "0 -12px",
          width: "calc(100% + 24px)",
          display: "flex", alignItems: "center", gap: 16,
          padding: "20px 12px",
          background: hovered ? "rgba(255,255,255,0.05)" : "none",
          borderRadius: 10,
          border: "none", cursor: "pointer", color: "#fff",
          transition: "background 0.12s ease",
        }}
      >
        <InfoIconBox hovered={hovered}>{icon}</InfoIconBox>
        <span className="font-mono" style={{ fontSize: 15, letterSpacing: "-0.01em", fontWeight: 500, flex: 1, textAlign: "left", color: "#fff" }}>{label}</span>
        <motion.svg
          animate={{ x: hovered ? 1 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          width="13" height="13" viewBox="0 0 12 12" fill="none"
          stroke={hovered ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.35)"}
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transition: "stroke 0.12s ease" }}
        >
          <polyline points="4 2 8 6 4 10" />
        </motion.svg>
      </button>
      <RowDivider />
    </div>
  );
}

// ─── Page entrance animation ──────────────────────────────────────────────────
// stagger: each item slides up 6px and fades in, delayed by its position index
// duration ↓ → snappier (try 0.18s), duration ↑ → slower reveal (try 0.4s)
// delay spacing ↓ → tighter choreography (try 0.04), ↑ → more theatrical (try 0.1)
function pi(delay: number) {
  return {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.28, ease: "easeOut" as const, delay },
  };
}

// ─── Info landing page ────────────────────────────────────────────────────────
function InfoPageView() {
  const goBack        = linkTo("YouTube University", "Visualization");
  const goFAQ         = linkTo("YouTube University", "FAQ");
  const goMethodology = linkTo("YouTube University", "How We Calculate");
  const goAgents      = linkTo("YouTube University", "Interview Agents");

  return (
    <InfoPageShell>
      <InfoPageBackLink label="Visualization" onClick={goBack} />
      {/* title: first content element, enters immediately */}
      <motion.h2 {...pi(0)} className="select-none" style={{ fontSize: 32, color: "#fff", fontWeight: 600, margin: "8px 0 32px", lineHeight: 1.1 }}>Info</motion.h2>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {/* stagger: each row enters 60ms after the previous */}
        {[
          { label: "FAQ", onClick: goFAQ, icon: <BookTextIcon size={14} /> },
          { label: "Interview agents", onClick: goAgents, icon: <ZapIcon size={14} /> },
          { label: "How we calculate", onClick: goMethodology, icon: <CompassIcon size={14} /> },
        ].map((row, i) => (
          <motion.div key={row.label} {...pi(0.08 + i * 0.06)}>
            <InfoNavRow label={row.label} onClick={row.onClick} icon={row.icon} />
          </motion.div>
        ))}
      </div>
    </InfoPageShell>
  );
}

// ─── FAQ page ─────────────────────────────────────────────────────────────────
function FAQPageView() {
  const goInfo = linkTo("YouTube University", "Info");

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

// ─── How we calculate page ────────────────────────────────────────────────────
function MethodologyPageView() {
  const goInfo = linkTo("YouTube University", "Info");

  return (
    <InfoPageShell>
      <InfoPageBackLink label="Info" onClick={goInfo} />
      <motion.h2 {...pi(0)} className="select-none" style={{ fontSize: 32, color: "#fff", fontWeight: 600, margin: "0 0 8px", lineHeight: 1.1 }}>How we calculate</motion.h2>
      <motion.p {...pi(0.07)} className="font-mono" style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.7, margin: "0 0 40px" }}>
        We'd love suggestions on how best to calculate these things, or if there are other items or data that would be valuable to track or represent.
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

// ─── Interview Agents page ────────────────────────────────────────────────────

interface PricingCardProps {
  name: string;
  description: string;
  price: string;
  features: string[];
}

function PricingCard({ name, description, price, features }: PricingCardProps) {
  const [hovered, setHovered] = React.useState(false);
  const [ctaHovered, setCtaHovered] = React.useState(false);
  const [ctaPressed, setCtaPressed] = React.useState(false);

  return (
    <motion.div
      onMouseEnter={() => { setHovered(true); playTick(); }}
      onMouseLeave={() => setHovered(false)}
      animate={{ y: hovered ? -2 : 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      style={{
        borderRadius: 12,
        background: "rgba(25, 22, 20, 0.40)",
        border: "1px solid rgba(255,255,255,0.10)",
        transition: "border-color 0.22s ease",
        padding: "28px 26px 26px",
        display: "flex",
        flexDirection: "column",
        minHeight: 480,
        height: "100%",
        boxSizing: "border-box",
        cursor: "pointer",
        willChange: "transform",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginBottom: 16 }}>
        <span className="font-mono" style={{ fontSize: 14, fontWeight: 600, color: hovered ? "rgba(255,255,255,1.0)" : "rgba(220,214,208,0.72)", letterSpacing: "-0.01em", transition: "color 0.18s ease" }}>{name}</span>
        <span style={{ color: hovered ? "rgba(255,255,255,0.40)" : "rgba(255,255,255,0.22)", fontSize: 13, transition: "color 0.18s ease" }}>·</span>
        <span className="font-mono" style={{ fontSize: 12, color: hovered ? "rgba(255,255,255,0.50)" : "rgba(255,255,255,0.22)", fontWeight: 400, transition: "color 0.18s ease" }}>Private Beta</span>
      </div>
      <div style={{ minHeight: 68, marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: hovered ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.35)", lineHeight: 1.65, margin: 0, transition: "color 0.18s ease" }}>{description}</p>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, margin: "0 0 24px" }}>
        <span className="font-mono" style={{ fontSize: 26, fontWeight: 700, color: hovered ? "rgba(255,255,255,0.92)" : "rgba(220,214,208,0.65)", letterSpacing: "-0.03em", transition: "color 0.18s ease" }}>{price}</span>
        {price !== "Free" && (
          <span className="font-mono" style={{ fontSize: 12, color: hovered ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.22)", letterSpacing: "-0.01em", transition: "color 0.18s ease" }}>/ lifetime access</span>
        )}
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
        {features.map(f => (
          <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: hovered ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.32)", transition: "color 0.18s ease" }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
              <polyline points="2 7 5.5 10.5 11 3" stroke={hovered ? "rgba(255,255,255,0.40)" : "rgba(255,255,255,0.22)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.18s ease" }} />
            </svg>
            {f}
          </li>
        ))}
      </ul>
      <motion.button
        onMouseEnter={() => setCtaHovered(true)}
        onMouseLeave={() => { setCtaHovered(false); setCtaPressed(false); }}
        onMouseDown={() => setCtaPressed(true)}
        onMouseUp={() => setCtaPressed(false)}
        animate={{ scale: ctaPressed ? 0.97 : 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 40 }}
        style={{
          width: "100%",
          padding: "13px 0",
          borderRadius: 8,
          border: `1px solid ${ctaHovered ? "rgba(255,255,255,0.80)" : "rgba(255,255,255,0.14)"}`,
          background: ctaHovered ? "rgba(255,255,255,0.06)" : "transparent",
          color: ctaHovered ? "rgba(255,255,255,0.90)" : "rgba(255,255,255,0.38)",
          fontSize: 12,
          fontWeight: 500,
          cursor: "pointer",
          letterSpacing: "0.04em",
          transition: "background 0.15s ease, color 0.15s ease, border-color 0.15s ease",
        }}
      >
        Coming Soon
      </motion.button>
    </motion.div>
  );
}

function InterviewAgentsView() {
  const goInfo   = linkTo("YouTube University", "Info");
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

function PageCTABar({ onShare, onUpload = () => {} }: { onShare: () => void; onUpload?: () => void }) {
  const s = SIZE.sm;

  return (
    // fixed: pins the bar to the viewport regardless of scroll
    <div style={{ position: "fixed", top: 20, right: 20, zIndex: 50, display: "flex", alignItems: "flex-start", gap: 6 }}>
      <DotMatrixCTA label="Share" size="sm" onClick={onShare} />
      {/* row: theme toggle left of upload button */}
      <div style={{ display: "flex", flexDirection: "row", gap: 6 }}>
        <PageThemeToggle />
        <CTAContainer onClick={onUpload} ariaLabel="Upload your data" size="sm">
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            // toggleInnerSize: exact height match to DotMatrixCTA sm (try SIZE.md for larger hit area)
            width: s.toggleInnerSize, height: s.toggleInnerSize,
            borderRadius: s.toggleInnerRadius,
            // inverted fill — cream on dark, black on light — same as moon button
            backgroundColor: "var(--text-primary)",
          }}>
            {/* upload arrow: up-pointing arrow + base line (try strokeWidth 2 for bolder) */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--bg-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
        </CTAContainer>
      </div>
    </div>
  );
}

// ─── Full story ───────────────────────────────────────────────────────────────
const CATEGORY_SHAPE: Record<string, number> = {
  ai:          0,                  // sphere — pure, foundational
  design:      ATOM_SHAPE_INDEX,   // atom — intricate, structured beauty
  engineering: 1,                  // cube
  startup:     ROCKET_SHAPE_INDEX, // rocket
};

function FullStoryView() {
  const stats = MOCK_STATS;
  const [showShare, setShowShare] = React.useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string>("ai");

  const domainData = [
    { id: "ai",          label: "AI & Machine Learning", pct: 40.3, channels: ["Andrej Karpathy", "AI Engineer", "Lex Fridman"] },
    { id: "design",      label: "Design & Craft",        pct: 24.6, channels: ["Figma", "Olivier Larose", "The Futur"] },
    { id: "engineering", label: "Engineering & Dev",     pct: 18.2, channels: ["Vercel", "Theo (t3.gg)", "corbin"] },
    { id: "startup",     label: "Startups & Product",    pct: 16.9, channels: ["Linear", "Pieter Levels"] },
  ];

  return (
    <>
      <PageCTABar onShare={() => setShowShare(true)} />

      <div style={{ backgroundColor: "var(--bg-primary)", minHeight: "100vh", color: "var(--color-gray12)" }}>

        {/* ── 00 HERO ── */}
        <section style={{ padding: `80px 40px 72px`, maxWidth: PAGE_MAX_W, margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, filter: "blur(4px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--color-gray8)", letterSpacing: "0.2em", textTransform: "uppercase", display: "block", marginBottom: 40 }}>
              YouTube as a university
            </span>

            <div style={{ display: "flex", gap: 56, alignItems: "flex-start" }}>
              <Odometer value={stats.totalVideos} label="videos" animationDelay={0} variant={ginnMode ? "mechanical" : "cased"} />
              <Odometer value={stats.totalDays} label="days" animationDelay={100} variant={ginnMode ? "mechanical" : "cased"} />
              <Odometer value={stats.totalSearches} label="searches" animationDelay={200} variant={ginnMode ? "mechanical" : "cased"} />
            </div>
          </motion.div>

        </section>

        {/* ── 01 RHYTHM — heatmap / line graph toggle + stats card ── */}
        <section style={{ maxWidth: PAGE_MAX_W, margin: "0 auto", padding: PAGE_PAD }}>
          <RhythmCard />
        </section>

        <Divider />

        {/* ── 02 FOCUS ── */}
        <section style={{ padding: `72px 40px`, maxWidth: PAGE_MAX_W, margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, filter: "blur(4px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
          >
            <Chapter
              n="02 — focus"
              title="Strip the noise. Read what's left."
              sub="Design, AI, engineering, product. Everything else falls away."
            />

            {(() => {
              const total = stats.categoryBreakdown.reduce((s, c) => s + c.count, 0);
              const recalculated = stats.categoryBreakdown
                .filter((c) => c.count > 0)
                .map((c) => ({ ...c, percentage: (c.count / total) * 100 }));
              return (
                <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
                  {/* Particle morph — reacts to selected category */}
                  <div style={{ width: 220, height: 220, flexShrink: 0 }}>
                    <ParticleMorph
                      shape={CATEGORY_SHAPE[selectedCategoryId] ?? 0}
                      hideControls
                      cursorDispersion
                      particleColor="#ffffff"
                      backgroundColor="#000000"
                    />
                  </div>

                  {/* Thin separator */}
                  <div style={{ width: 1, alignSelf: "stretch", background: "var(--overlay-medium)", flexShrink: 0 }} />

                  {/* Category bars as clickable CTAs */}
                  <div style={{ flex: 1 }}>
                    <CategoryBars
                      categories={recalculated}
                      title=""
                      selectedId={selectedCategoryId}
                      onSelect={setSelectedCategoryId}
                    />
                  </div>
                </div>
              );
            })()}
          </motion.div>
        </section>

        <Divider />

        {/* ── 03 SIGNALS ── */}
        <section style={{ padding: `72px 40px`, maxWidth: PAGE_MAX_W, margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, filter: "blur(4px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
          >
            <Chapter
              n="03 — signals"
              title="The searches don't lie."
              sub="What you type when no one is watching."
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 48px" }}>
              {stats.topSearchTerms.slice(0, 12).map((item, i) => (
                <motion.div
                  key={item.term}
                  initial={{ opacity: 0, filter: "blur(4px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  transition={{ duration: 0.25, ease: "easeOut", delay: i * 0.02 }}
                  style={{ display: "flex", alignItems: "center", gap: 12 }}
                >
                  <span className="font-mono select-none" style={{ fontSize: 12, color: "var(--color-orange)", textAlign: "right", width: 24, fontVariantNumeric: "tabular-nums" }}>
                    {item.count}
                  </span>
                  <span className="font-mono select-none" style={{ fontSize: 12, color: "var(--color-gray12)" }}>
                    {item.term}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        <Divider />

        {/* ── 04 SOURCES ── */}
        <section style={{ padding: `72px 40px`, maxWidth: PAGE_MAX_W, margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, filter: "blur(4px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.4 }}
          >
            <Chapter
              n="04 — sources"
              title="What teaches you."
              sub="Distilled by domain. Not by personality."
            />

            <div style={{ display: "flex", flexDirection: "column" }}>
              {domainData.map((d, i) => (
                <DomainRow key={d.id} label={d.label} pct={d.pct} channels={d.channels} isTop={i === 0} index={i} />
              ))}
            </div>
          </motion.div>
        </section>

        <div style={{ height: 120 }} />
      </div>

      <AnimatePresence>
        {showShare && <ShareModal onClose={() => setShowShare(false)} stats={stats} />}
      </AnimatePresence>
    </>
  );
}

const meta = {
  title: "YouTube University",
  component: FullStoryView,
  parameters: {
    layout: "fullscreen",
    backgrounds: { disable: true },
    nextjs: { appDirectory: true },
  },
  excludeStories: ['MainGridView', 'MainGridGinnView', 'MainGridGinnMonoView', 'MergeTimelineView', 'HoverTestView', 'GinnTestView'],
} satisfies Meta<typeof FullStoryView>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Merge timeline experiment ────────────────────────────────────────────────

type TimelineView = "heatmap" | "linegraph";

function ViewToggle({ active, onChange, containerHovered = false }: { active: TimelineView; onChange: (v: TimelineView) => void; containerHovered?: boolean }) {
  const [nudgeDone, setNudgeDone] = React.useState(false);
  const [nudgeKey, setNudgeKey] = React.useState(0);
  const [hoveredBtn, setHoveredBtn] = React.useState<TimelineView | null>(null);
  const [hasToggled, setHasToggled] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setNudgeDone(true), 1400);
    return () => clearTimeout(t);
  }, []);

  React.useEffect(() => {
    if (containerHovered && nudgeDone && !hasToggled) {
      setNudgeKey((k) => k + 1);
    }
  }, [containerHovered]);

  return (
    <div
      style={{
        display: "inline-flex",
        backgroundColor: "var(--overlay-subtle)",
        borderRadius: 8,
        padding: 3,
        gap: 2,
      }}
    >
      {(["heatmap", "linegraph"] as TimelineView[]).map((v) => {
        const isActive = active === v;
        const label = v === "heatmap" ? "Heatmap" : "Line graph";
        const shouldNudge = (!nudgeDone || containerHovered) && !hasToggled;
        // Inactive button brightens on hover (gray8 → gray11)
        const textColor = isActive
          ? "var(--color-gray12)"
          : hoveredBtn === v ? "var(--color-gray11)" : "var(--color-gray8)";
        return (
          <motion.button
            key={v}
            onClick={() => { setNudgeDone(true); setHasToggled(true); onChange(v); }}
            onMouseEnter={() => setHoveredBtn(v)}
            onMouseLeave={() => setHoveredBtn(null)}
            layout
            style={{
              position: "relative",
              padding: "5px 12px",
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              background: "none",
              color: textColor,
              fontSize: 10,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              fontFamily: "var(--font-mono, monospace)",
              transition: "color 0.15s",
              zIndex: 1,
            }}
          >
            {isActive && (
              <motion.div
                key={nudgeKey}
                layoutId="toggle-bg"
                animate={shouldNudge ? { x: [0, 7, 0] } : {}}
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 6,
                  backgroundColor: "var(--overlay-medium)",
                  border: "1px solid var(--overlay-medium)",
                }}
                transition={{
                  layout: { type: "spring", stiffness: 400, damping: 35 },
                  x: { delay: containerHovered ? 0 : 0.7, duration: 0.38, ease: ["easeOut", "easeIn"], times: [0, 0.42, 1] },
                }}
              />
            )}
            <span style={{ position: "relative" }}>{label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

function InfoIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ display: "block", flexShrink: 0 }}>
      {/* circle: badge background — var(--overlay-subtle) is the DS token for subtle fills */}
      <circle cx="7.5" cy="7.5" r="7" fill="var(--overlay-subtle)" stroke="var(--overlay-medium)" strokeWidth="1" />
      {/* dot + stem: var(--color-gray9) sits above the badge without being harsh */}
      <circle cx="7.5" cy="4.5" r="1" fill="var(--color-gray9)" />
      <rect x="6.65" y="6.5" width="1.7" height="4" rx="0.85" fill="var(--color-gray9)" />
    </svg>
  );
}

function BigStat({
  label,
  shortLabel,
  value,
  tooltip,
}: {
  label: string;
  shortLabel?: string;
  value: string;
  tooltip?: string;
}) {
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const tipRef = React.useRef<HTMLDivElement>(null);
  const delayTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [iconPos, setIconPos] = React.useState<{ iconX: number; iconTop: number } | null>(null);
  // Computed after mount: exact fixed pixel coords — no CSS transform needed
  const [tipStyle, setTipStyle] = React.useState<{ left: number; top: number; arrowLeft: number } | null>(null);

  const handleMouseEnter = () => {
    delayTimer.current = setTimeout(() => {
      if (btnRef.current) {
        const r = btnRef.current.getBoundingClientRect();
        setTipStyle(null);
        setIconPos({ iconX: r.left + r.width / 2, iconTop: r.top });
      }
    }, 500);
  };

  const handleMouseLeave = () => {
    if (delayTimer.current) clearTimeout(delayTimer.current);
    setIconPos(null);
    setTipStyle(null);
  };

  // Measure tooltip dimensions and compute clamped position — runs before paint
  React.useLayoutEffect(() => {
    if (!tipRef.current || !iconPos) return;
    const { offsetWidth: tipW, offsetHeight: tipH } = tipRef.current;
    const vw = window.innerWidth;
    const pad = 10;
    const gap = 10; // px between arrow tip and icon top
    const idealLeft = iconPos.iconX - tipW / 2;
    const left = Math.max(pad, Math.min(idealLeft, vw - tipW - pad));
    const top = iconPos.iconTop - tipH - gap;
    const arrowLeft = iconPos.iconX - left;
    setTipStyle({ left, top, arrowLeft });
  }, [iconPos]);

  // sectionHovered: tracks hover on this specific rabbit hole section independently
  const [sectionHovered, setSectionHovered] = React.useState(false);

  return (
    <div
      onMouseEnter={() => setSectionHovered(true)}
      onMouseLeave={() => setSectionHovered(false)}
      // minWidth: 0 overrides flexbox min-width:auto so all three cells share space equally
      className="big-stat-cell"
      style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6, padding: "20px 24px", cursor: "default" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <span
          className="select-none"
          style={{
            fontSize: 9,
            // color: faint at rest → near-white on hover (consistent with other card labels in Ginn)
            color: sectionHovered ? "var(--color-gray12)" : "var(--text-faint)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            transition: "color 0.2s ease",
            fontFamily: "'Geist Mono', ui-monospace, monospace",
          }}
        >
          {/* show full label on desktop, short label on mobile if provided */}
          <span className="big-stat-label-full">{label}</span>
          {shortLabel && <span className="big-stat-label-short">{shortLabel}</span>}
        </span>
        {tooltip && (
          <button
            ref={btnRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
              background: "none",
              border: "none",
              // padding: expands hit area to ~27×27px without changing the visual icon size (Ergonomic: hit area ≥ touch target)
              padding: 6,
              margin: -6,
              cursor: "default",
              display: "flex",
              alignItems: "center",
              // focusVisible: customize don't remove — removing this reduces affordance for keyboard users
              outline: "none",
              borderRadius: 4,
            }}
            onFocus={(e) => { (e.currentTarget as HTMLElement).style.outline = "2px solid var(--accent)"; (e.currentTarget as HTMLElement).style.outlineOffset = "2px"; }}
            onBlur={(e) => { (e.currentTarget as HTMLElement).style.outline = "none"; }}
          >
            <InfoIcon />
          </button>
        )}
      </div>

      <span
        className="font-mono select-none"
        style={{
          fontSize: 28,
          // color: secondary at rest → primary on hover (same as Daily Habit value numbers)
          color: sectionHovered ? "var(--text-primary)" : "var(--text-secondary)",
          letterSpacing: "-0.03em",
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1,
          transition: "color 0.2s ease",
        }}
      >
        {value}
      </span>

      <AnimatePresence>
        {iconPos && tooltip && (
          <motion.div
            ref={tipRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: tipStyle ? 1 : 0 }}
            // exit: 2× faster than enter per DS exitMultiplier — clears stale content fast
            exit={{ opacity: 0, transition: { duration: 0.06, ease: "easeIn" } }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            style={{
              position: "fixed",
              left: tipStyle?.left ?? -9999,
              top: tipStyle?.top ?? -9999,
              backgroundColor: "var(--bg-primary)",
              border: "1px solid var(--overlay-medium)",
              borderRadius: 7,
              padding: "7px 11px",
              whiteSpace: "nowrap",
              pointerEvents: "none",
              zIndex: 9999,
            }}
          >
            <span
              className="font-mono"
              style={{ fontSize: 10, color: "var(--color-gray11)", letterSpacing: "0.01em" }}
            >
              {tooltip}
            </span>
            {tipStyle && (
              <>
                <div style={{
                  position: "absolute",
                  top: "100%",
                  left: tipStyle.arrowLeft,
                  transform: "translateX(-50%)",
                  width: 0, height: 0,
                  borderLeft: "5px solid transparent",
                  borderRight: "5px solid transparent",
                  borderTop: "5px solid var(--overlay-medium)",
                }} />
                <div style={{
                  position: "absolute",
                  top: "calc(100% - 1px)",
                  left: tipStyle.arrowLeft,
                  transform: "translateX(-50%)",
                  width: 0, height: 0,
                  borderLeft: "4px solid transparent",
                  borderRight: "4px solid transparent",
                  borderTop: "4px solid var(--bg-primary)",
                }} />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── EnjStatsPill — progress pill for Design Engineer card ───────────────────
// Matches the line graph pill: starts at full value, live-updates with cursor
// position on the ruler, and morphs colors when actively interacting.
function EnjStatsPill({ score, total, cursorFraction, morph }: {
  score: number;       // 0–100 (full journey %)
  total: number;       // total checklist items (22)
  cursorFraction: number | null;  // 0–1 cursor position on ruler, null = idle
  morph: boolean;      // true when actively interacting (hover/drag)
}) {
  const done = Math.round(score / 100 * total);
  // Map cursor position to the nearest major tick (notch).
  // Each notch = one checklist item. Capped at `done` — can't go past completed items.
  // 85 ticks, major every 4 = 22 major ticks (indices 0, 4, 8, ..., 84)
  const TICKS = 85;
  const MAJOR = 4;
  const cursorNotch = cursorFraction != null
    ? Math.min(done, Math.round(cursorFraction * (TICKS - 1) / MAJOR) + 1)
    : null;
  const liveCount = cursorNotch ?? done;
  // Percentage scales proportionally: each completed item = score/done % points
  const livePct = cursorNotch != null
    ? done > 0 ? (cursorNotch / done) * score : 0
    : score;

  const ringStroke = morph ? "var(--accent)" : "var(--text-primary)";
  const pctColor = morph ? "var(--accent)" : "var(--text-primary)";

  return (
    <motion.div
      initial={false}
      animate={{
        background: morph ? "var(--pill-bg-active)" : "var(--pill-bg)",
        borderColor: morph ? "var(--overlay-strong)" : "var(--overlay-medium)",
      }}
      transition={{
        background: { duration: 0.25, ease: "easeInOut" },
        borderColor: { duration: 0.25, ease: "easeInOut" },
      }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 6px 5px 12px",
        borderRadius: 100,
        border: "1px solid",
        minWidth: 148,
      }}
    >
      <span className="font-mono text-[11px] select-none whitespace-nowrap tabular-nums" style={{ color: "var(--color-gray9)", minWidth: 28 }}>
        {String(liveCount).padStart(2, "0")}/{total}
      </span>
      <div style={{ width: 1, height: 9, background: "var(--overlay-strong)", flexShrink: 0 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <ProgressRing
          current={livePct}
          endpoint={score}
          size={13}
          strokeWidth={1.5}
          activeStroke={ringStroke}
        />
        <span
          className="font-mono text-[11px] select-none whitespace-nowrap tabular-nums"
          style={{ color: pctColor, transition: "color 0.2s ease", minWidth: 38 }}
        >
          {livePct.toFixed(1)}%
        </span>
      </div>
      {/* 2×2 grid icon — matches line graph pill */}
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden style={{ color: "var(--color-gray9)", flexShrink: 0, marginLeft: 2 }}>
        <rect x="0.25" y="0.25" width="3.75" height="3.75" rx="0.6" fill="currentColor" />
        <rect x="6"    y="0.25" width="3.75" height="3.75" rx="0.6" fill="currentColor" />
        <rect x="0.25" y="6"    width="3.75" height="3.75" rx="0.6" fill="currentColor" />
        <rect x="6"    y="6"    width="3.75" height="3.75" rx="0.6" fill="currentColor" />
      </svg>
    </motion.div>
  );
}

function RhythmCard({ stats = MOCK_STATS, accentColor = "#E95F38" }: { stats?: YouTubeStats; accentColor?: string }) {
  const [view, setView] = React.useState<TimelineView>("heatmap");
  // hovered: drives the header label color transition (same pattern as other grid cards)
  const [hovered, setHovered] = React.useState(false);

  const activeHighlight: Set<string> | null = null;

  const graphWrapRef = React.useRef<HTMLDivElement>(null);
  const [graphHeight, setGraphHeight] = React.useState(0);
  React.useLayoutEffect(() => {
    if (graphWrapRef.current) setGraphHeight(graphWrapRef.current.offsetHeight);
  }, []);

  const containerHeight = view === "linegraph" && graphHeight ? graphHeight : "auto";
  // EASE: same cubic as GridCard — snappy in, relaxed out (matches the card family)
  const EASE = "cubic-bezier(0.2,0,0,1)";

  return (
    <div>
      {/* Section header — sits ABOVE the card, not inside it */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <span className="font-mono text-[13px] text-gray11 select-none">
          Daily learning activity
        </span>
        <ViewToggle active={view} onChange={setView} containerHovered={hovered && view === "heatmap"} />
      </div>

      {/*
        Architecture:
        - Line graph: always mounted (no render cost on switch). Sits at
          position:absolute so it never pushes the container height.
        - Heatmap: mounts/unmounts via AnimatePresence so the blur-in entry
          animation replays every time it becomes active. It stays in normal
          flow while mounted, giving the container its natural height.
        - Container height: "auto" when heatmap is active (follows its flow
          height). Springs to the measured graph height when line graph is
          active.
      */}
      <motion.div
        initial={false}
        animate={{ height: containerHeight }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="rhythm-heatmap-wrap"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: "relative",
          borderRadius: "12px 12px 0 0",
          overflow: "hidden",
          // background: same surface as the Ginn grid cards
          background: "var(--card-surface-bg)",
          boxShadow: "inset 0 0 0 1px var(--card-border-rest)",
        }}
      >
        <AnimatePresence>
          {view === "heatmap" && (
            <motion.div
              key="heatmap"
              initial={{ opacity: 0, filter: "blur(7px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(7px)" }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="rhythm-heatmap-inner"
              style={{ padding: "24px 48px 24px 20px" }}
            >
              <ContributionHeatmap data={stats.dailyBuckets} title="" highlightDates={activeHighlight} accentColor={accentColor} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* NOTE: No filter animation — filter creates a containing block for
            position:fixed elements, breaking the Cursor's coordinate calculations. */}
        <motion.div
          ref={graphWrapRef}
          animate={{ opacity: view === "linegraph" ? 1 : 0 }}
          transition={{ opacity: { duration: 0.22, ease: "easeInOut" } }}
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0,
            pointerEvents: view === "linegraph" ? "auto" : "none",
          }}
        >
          <YouTubeLineGraph
            data={stats.dailyBuckets}
            journeyPercent={computeDesignEngineerScore(stats)}
            minutesPerVideo={stats.avgVideosPerDay > 0 ? (stats.avgHoursPerDay / stats.avgVideosPerDay) * 60 : 13}
          />
          {/* Right-edge fade — scroll affordance */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              width: 80,
              right: -28,
              background: "linear-gradient(to right, transparent, var(--bg-primary) 60%)",
              pointerEvents: "none",
              opacity: 0.4,
              filter: "blur(8px)",
            }}
          />
        </motion.div>
      </motion.div>

      {/* Stats row — each BigStat manages its own hover independently */}
      <div
        style={{
          display: "flex",
          // background: matches Ginn grid cards
          background: "var(--card-surface-bg)",
          border: "1px solid var(--card-border-rest)",
          borderTop: "none",
          borderRadius: "0 0 12px 12px",
          overflow: "hidden",
        }}
      >
        <BigStat
          label="AI rabbit holes"
          shortLabel="AI"
          value={String(stats.rabbitHoleCategoryCounts['ai'] ?? 0)}
          tooltip="Days with 5+ AI & machine learning videos"
        />
        <div style={{ width: 1, backgroundColor: "var(--card-border-rest)", alignSelf: "stretch" }} />
        <BigStat
          label="Design rabbit holes"
          shortLabel="Design"
          value={String(stats.rabbitHoleCategoryCounts['design'] ?? 0)}
          tooltip="Days with 5+ design & creative videos"
        />
        <div style={{ width: 1, backgroundColor: "var(--card-border-rest)", alignSelf: "stretch" }} />
        <BigStat
          label="Engineering rabbit holes"
          shortLabel="Engineering"
          value={String(stats.rabbitHoleCategoryCounts['engineering'] ?? 0)}
          tooltip="Days with 5+ engineering & dev videos"
        />
      </div>
    </div>
  );
}

export function MergeTimelineView() {
  return (
    <div style={{ backgroundColor: "var(--bg-primary)", minHeight: "100vh", color: "var(--color-gray12)", padding: "80px 48px", maxWidth: 860, margin: "0 auto" }}>
      <RhythmCard />
    </div>
  );
}


// ─── Grid story ────────────────────────────────────────────────────────────────

function CardMeta({ index, tag }: { index: string; tag: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0, marginBottom: 0 }}>
      <span
        className="font-mono select-none"
        style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.06em" }}
      >
        {index}
      </span>
      <span
        className="font-mono select-none"
        style={{ fontSize: 8, color: "var(--text-faint)", letterSpacing: "0.14em", textTransform: "uppercase" }}
      >
        {tag}
      </span>
    </div>
  );
}

// ─── Scale-based grid card (legacy — preserved for HoverGridTest) ────────────

function ScaleGridCard({
  children,
  style,
  onClick,
  delay = 0,
  disableScale = false,
}: {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
  delay?: number;
  disableScale?: boolean;
}) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={disableScale ? undefined : { scale: 1.025 }}
      transition={{
        duration: 0.38,
        ease: "easeOut",
        delay,
        scale: { type: "spring", stiffness: 400, damping: 30 },
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        position: "relative",
        borderRadius: 10,
        border: `1px solid ${hovered ? "var(--overlay-strong)" : "var(--overlay-medium)"}`,
        backgroundColor: hovered ? "var(--card-bg-hover)" : "var(--overlay-subtle)",
        boxShadow: hovered ? "var(--card-shadow-hover)" : "none",
        cursor: onClick ? "pointer" : "default",
        overflow: "hidden",
        transition: "background-color 0.2s, border-color 0.2s, box-shadow 0.2s",
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

// ─── Grid card (clip-path reveal + inner shadow system) ──────────────────────
//
// Replaces scale-based hover with a clip-path reveal approach:
//   - Card at rest: `clip-path: inset(2px)` — slightly clipped, appears compact
//   - Card on hover: `clip-path: inset(0px)` — full size revealed
//   - Inner padding shrinks on hover so titles track the expanding clip edge
//   - Text stays the exact same size (no transform:scale)
//   - Inner shadow system from InnerShadowCard applied across the board

// ── Tick sound ────────────────────────────────────────────────────────────────
// singleton: one Audio node reused across all cards (no overlapping instances)
let _tickAudio: HTMLAudioElement | null = null;
// cooldown: prevents rapid-fire ticks when moving quickly across card edges
let _lastTickTime = 0;
const TICK_COOLDOWN_MS = 80;

function playTick() {
  // SSR guard: Audio API only exists in the browser
  if (typeof window === "undefined") return;
  const now = Date.now();
  // throttle: ignore calls that arrive within the cooldown window
  if (now - _lastTickTime < TICK_COOLDOWN_MS) return;
  _lastTickTime = now;
  if (!_tickAudio) {
    // lazy init: create once on first hover, avoids blocking page load
    _tickAudio = new Audio("./sounds/tick.mp3");
    // volume: 0.35 sits under the visual feedback without competing (try 0.1–0.6)
    _tickAudio.volume = 0.35;
  }
  // reset: allows re-triggering before the previous play finishes
  _tickAudio.currentTime = 0;
  // catch: browsers block autoplay until a user gesture has occurred — safe to ignore
  _tickAudio.play().catch(() => {});
}

function GridCard({
  children,
  overlayBefore,
  style,
  onClick,
  onMouseEnter,
  onMouseLeave,
  delay = 0,
  disableScale = false,
  disableSound = false,
  className,
  category,
  disabled = false,
  forceHover = false,
}: {
  children?: React.ReactNode;
  /** Rendered as absolute-positioned sibling of mg-card-inner, behind it in paint order.
   *  Use for SVG backgrounds that must sit outside mg-card-inner's stacking context. */
  overlayBefore?: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  delay?: number;
  disableScale?: boolean;
  /** Skip the tick sound on enter — use when the card's children handle sound themselves */
  disableSound?: boolean;
  className?: string;
  /** metadata only — GridCard does not use this for any internal logic */
  category?: string;
  /** dims this card to opacity 0.1 and disables pointer events */
  disabled?: boolean;
  /** force card into hover-elevated state (e.g. when its modal is open) */
  forceHover?: boolean;
}) {
  const [hovered, setHovered] = React.useState(false);
  const isElevated = hovered || forceHover;

  const EASE = "cubic-bezier(0.2,0,0,1)";
  const shadowTransition = [
    `border-color 0.12s ${EASE}`,
    `background-color 0.2s ${EASE}`,
    `box-shadow 0.28s ${EASE}`,
    `opacity 0.25s ease`,
  ].join(", ");

  // disableScale (e.g. morph card): no clip wrapper, no content shift
  if (disableScale) {
    return (
      <motion.div
        className={`mg-card mg-card-inner${isElevated ? " mg-card--active" : ""}${className ? ` ${className}` : ''}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: disabled ? 0.1 : 1, y: 0 }}
        transition={{ duration: 0.38, ease: "easeOut", delay }}
        onMouseEnter={() => { if (!disableSound) playTick(); setHovered(true); onMouseEnter?.(); }}
        onMouseLeave={() => { setHovered(false); onMouseLeave?.(); }}
        onClick={onClick}
        style={{
          position: "relative",
          borderRadius: 10,
          border: `1px solid ${isElevated ? "var(--card-border-hover)" : "var(--card-border-rest)"}`,
          backgroundColor: isElevated ? "var(--card-bg-hover)" : "var(--overlay-subtle)",
          boxShadow: isElevated ? "var(--card-shadow-hover-inner)" : "var(--card-shadow-rest)",
          cursor: onClick ? "pointer" : "default",
          overflow: "hidden",
          transition: shadowTransition,
          pointerEvents: disabled ? "none" : "auto",
          ...style,
        }}
      >
        {children}
      </motion.div>
    );
  }

  // Separate grid-placement props (clip wrapper) from visual styles (card)
  const gridProps: React.CSSProperties = {};
  const cardStyle: React.CSSProperties = {};
  if (style) {
    for (const [key, value] of Object.entries(style)) {
      if (key.startsWith("grid")) {
        (gridProps as Record<string, unknown>)[key] = value;
      } else {
        (cardStyle as Record<string, unknown>)[key] = value;
      }
    }
  }

  return (
    <div
      className={`mg-card${isElevated ? " mg-card--active" : ""}${className ? ` ${className}` : ''}`}
      onMouseEnter={() => { if (!disableSound) playTick(); setHovered(true); onMouseEnter?.(); }}
      onMouseLeave={() => { setHovered(false); onMouseLeave?.(); }}
      onClick={onClick}
      style={{
        ...gridProps,
        position: 'relative',
        clipPath: isElevated
          ? "inset(0px round 10px)"
          : "inset(2px round 10px)",
        transition: `clip-path 0.32s ${EASE}, opacity 0.25s ease`,
        cursor: onClick ? "pointer" : "default",
        opacity: disabled ? 0.1 : 1,
        pointerEvents: disabled ? "none" : "auto",
      }}
    >
      {overlayBefore}
      <motion.div
        className="mg-card-inner"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: "easeOut", delay }}
        style={{
          position: "relative",
          height: "100%",
          borderRadius: 10,
          border: `1px solid ${isElevated ? "var(--card-border-hover)" : "var(--card-border-rest)"}`,
          backgroundColor: isElevated ? "var(--card-bg-hover)" : "var(--overlay-subtle)",
          boxShadow: isElevated ? "var(--card-shadow-hover-inner)" : "var(--card-shadow-rest)",
          overflow: "hidden",
          transition: shadowTransition,
          ...cardStyle,
        }}
      >
        {/* Content shift wrapper — padding shrinks so titles track the expanding clip edge */}
        <div
          className="mg-card-shift"
          style={{
            height: "100%",
            padding: isElevated ? 0 : 2,
            transition: `padding 0.32s ${EASE}`,
          }}
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
}

// ─── SVG card border for small Ginn cards ─────────────────────────────────────
// CSS border lives in the border area (outside padding edge). overflow:hidden clips
// at the padding edge. No child can ever cover a parent's CSS border. Fix: kill the
// CSS border+background with !important and replace with this SVG path.
//
// Loop prevention: useLayoutEffect + contentRect (no getBoundingClientRect) +
// functional setState equality check. Only re-renders when dimensions actually change.
type NotchPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
type NotchShape = 'slot' | 'arc';

function GinnSmallCardSVG({
  positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
  shape = 'slot',
  width = 5,    // half-width of the notch → total cut = width*2 px
  depth = 6,    // how deep the notch cuts into the card edge
  radius = 3,   // corner rounding inside the slot (slot shape only)
  offset = 24,  // distance of notch center from each corner edge
}: {
  positions?: NotchPosition[];
  shape?: NotchShape;
  width?: number;
  depth?: number;
  radius?: number;
  offset?: number;
} = {}) {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [size, setSize] = React.useState({ w: 0, h: 0 });

  // useLayoutEffect: runs synchronously before paint — DOM is ready, dims are measurable.
  // Initial getBoundingClientRect: captures size on mount (ResizeObserver only fires on CHANGES,
  // so without this, cards that are already sized on mount never trigger the observer → no path).
  // contentRect in observer: no layout reflow (unlike getBoundingClientRect in a loop).
  // Equality guard: bails out if dimensions unchanged → prevents infinite loop.
  React.useLayoutEffect(() => {
    const parent = svgRef.current?.parentElement;
    if (!parent) return;
    // Seed initial size synchronously — safe here because layout is already complete
    const rect = parent.getBoundingClientRect();
    setSize({ w: Math.round(rect.width), h: Math.round(rect.height) });
    // Then watch for future resizes
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width);
      const h = Math.round(entry.contentRect.height);
      setSize(prev => (prev.w === w && prev.h === h ? prev : { w, h }));
    });
    ro.observe(parent);
    return () => ro.disconnect();
  }, []);

  const { w, h } = size;
  const nw  = width;
  const nh  = depth;
  const ncr = radius;
  const cr  = 4;  // card corner radius

  const has = (p: NotchPosition) => positions.includes(p);

  // ── Slot shape ──────────────────────────────────────────────────────────────
  // Rectangular slot — like a Figma rounded rect punched into the edge.
  // Entry/exit arcs (sweep=1): CW, tangent-continuous with the flat edge → no spike.
  // Interior bottom arcs (sweep=0): CCW at inside corners of the slot.
  // Top notch dips DOWN from y=0; bottom notch dips UP from y=h.
  const topSlot = (cx: number) => [
    `L ${cx - nw - ncr} 0`,
    `A ${ncr} ${ncr} 0 0 1 ${cx - nw} ${ncr}`,
    `L ${cx - nw} ${nh - ncr}`,
    `A ${ncr} ${ncr} 0 0 0 ${cx - nw + ncr} ${nh}`,
    `L ${cx + nw - ncr} ${nh}`,
    `A ${ncr} ${ncr} 0 0 0 ${cx + nw} ${nh - ncr}`,
    `L ${cx + nw} ${ncr}`,
    `A ${ncr} ${ncr} 0 0 1 ${cx + nw + ncr} 0`,
  ];
  const bottomSlot = (cx: number) => [
    `L ${cx + nw + ncr} ${h}`,
    `A ${ncr} ${ncr} 0 0 1 ${cx + nw} ${h - ncr}`,
    `L ${cx + nw} ${h - nh + ncr}`,
    `A ${ncr} ${ncr} 0 0 0 ${cx + nw - ncr} ${h - nh}`,
    `L ${cx - nw + ncr} ${h - nh}`,
    `A ${ncr} ${ncr} 0 0 0 ${cx - nw} ${h - nh + ncr}`,
    `L ${cx - nw} ${h - ncr}`,
    `A ${ncr} ${ncr} 0 0 1 ${cx - nw - ncr} ${h}`,
  ];

  // ── Arc shape ───────────────────────────────────────────────────────────────
  // Semicircular bite — one smooth arc command, no inner corners.
  // sweep=1 (CW): arc bows inward (into the card) on both top and bottom edges.
  const topArc    = (cx: number) => [`L ${cx - nw} 0`, `A ${nw} ${nh} 0 0 1 ${cx + nw} 0`];
  const bottomArc = (cx: number) => [`L ${cx + nw} ${h}`, `A ${nw} ${nh} 0 0 1 ${cx - nw} ${h}`];

  // Pick the right notch segment builders based on shape prop
  const topNotch    = shape === 'arc' ? topArc    : topSlot;
  const bottomNotch = shape === 'arc' ? bottomArc : bottomSlot;

  const d = w > 0 && h > 0 ? [
    `M ${cr} 0`,
    // Top edge L→R: conditionally insert left and right notches
    ...(has('top-left')  ? topNotch(offset)     : []),
    ...(has('top-right') ? topNotch(w - offset) : []),
    `L ${w - cr} 0`,
    `A ${cr} ${cr} 0 0 1 ${w} ${cr}`,
    `L ${w} ${h - cr}`,
    `A ${cr} ${cr} 0 0 1 ${w - cr} ${h}`,
    // Bottom edge R→L: right notch first (travelling left), then left notch
    ...(has('bottom-right') ? bottomNotch(w - offset) : []),
    ...(has('bottom-left')  ? bottomNotch(offset)     : []),
    `L ${cr} ${h}`,
    `A ${cr} ${cr} 0 0 1 0 ${h - cr}`,
    `L 0 ${cr}`,
    `A ${cr} ${cr} 0 0 1 ${cr} 0`,
    `Z`,
  ].join(' ') : '';

  return (
    <svg
      ref={svgRef}
      // overflow:visible: stroke straddles the path — half above y=0 / below y=h gets clipped
      // by the SVG viewport without this. The arc endpoints at y=0 appear disconnected otherwise.
      overflow="visible"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    >
      {/* Gradient defs — light mode uses url(#ginn-card-grad), dark mode overrides via CSS fill */}
      <defs>
        <linearGradient id="ginn-card-grad" x1="0.46" y1="0" x2="0.54" y2="1" gradientUnits="objectBoundingBox">
          {/* Equivalent to: linear-gradient(175deg, rgba(255,255,255,0.55) 0%, transparent 55%) over #D9D9D9 */}
          <stop offset="0%"   stopColor="#EEEEEE" />
          <stop offset="55%"  stopColor="#D9D9D9" />
          <stop offset="100%" stopColor="#D9D9D9" />
        </linearGradient>
        <linearGradient id="ginn-card-grad-hover" x1="0.46" y1="0" x2="0.54" y2="1" gradientUnits="objectBoundingBox">
          {/* Equivalent to: linear-gradient(175deg, rgba(255,255,255,0.70) 0%, transparent 55%) over #D2D2D2 */}
          <stop offset="0%"   stopColor="#F2F2F2" />
          <stop offset="55%"  stopColor="#D2D2D2" />
          <stop offset="100%" stopColor="#D2D2D2" />
        </linearGradient>
      </defs>
      {/* strokeLinejoin round: eliminates the miter spike at the flat-edge→arc junction.
          Without this, the 90° angle between the horizontal edge and the arc tangent creates
          a sharp point ~2px above y=0 (visible when overflow:visible allows it to render). */}
      {d && <path className="ginn-card-path" d={d} strokeLinejoin="round" />}
    </svg>
  );
}

// ─── Morph explorer overlay ───────────────────────────────────────────────────
//
// Entry: modalSpring (stiffness 300, damping 30) — matches design system.
// Exit:  2× stiffness (600) — clears stale state fast (motion-choreography principle).
// Scale 0.96 → 1 on entry to give the card a sense of appearing from slightly behind.

const MODAL_SPRING = { type: "spring" as const, stiffness: 300, damping: 30 };
const MODAL_EXIT   = { type: "spring" as const, stiffness: 600, damping: 35 };

// Shared modal chrome — keeps all modal headers visually consistent.
// fontFamily inline (no font-mono class) — immune to story-level font overrides.
const MODAL_TITLE_STYLE: React.CSSProperties = {
  fontSize: 9, color: "var(--text-secondary)", letterSpacing: "0.18em", textTransform: "uppercase",
  fontFamily: "'Geist Mono', ui-monospace, monospace",
};
const MODAL_CLOSE_BTN_STYLE: React.CSSProperties = {
  background: "none", border: "none", cursor: "pointer",
  color: "var(--text-faint)", fontSize: 16, lineHeight: 1,
  padding: "4px 6px", borderRadius: 4, outline: "none",
};

const FOCUS_ALLOWED_SHAPES = [0, 1, 2, PLAY_SHAPE_INDEX] as const;
const FOCUS_ALLOWED_LABELS: Record<number, string> = { 0: "SPHERE", 1: "CUBE", 2: "TORUS", [PLAY_SHAPE_INDEX]: "PLAY" };

// Short labels for category pills — keeps pills compact
const CATEGORY_SHORT: Record<string, string> = {
  ai: "AI", design: "Design", engineering: "Eng", startup: "Startups",
};

function MorphExplorer({
  onClose,
  initialShape = PLAY_SHAPE_INDEX,
  allowedShapes,
  categories,
  selectedCategoryId,
  onSelectCategory,
  particleActive,
  particleDim,
}: {
  onClose: () => void;
  initialShape?: number;
  allowedShapes?: readonly number[];
  categories?: Array<{ id: string; label: string; pct: number }>;
  selectedCategoryId?: string;
  onSelectCategory?: (id: string) => void;
  /** Active + dim colors — used to rebuild the category color map inside the modal */
  particleActive?: string;
  particleDim?: string;
}) {
  const isDark = useIsDark();
  const [shape, setShape] = React.useState(initialShape);
  const closeRef = React.useRef<HTMLButtonElement>(null);

  // Rebuild color map whenever shape or selected category changes — mirrors the grid card logic
  const modalColorMap = React.useMemo(() => {
    if (!categories || !selectedCategoryId || !particleActive || !particleDim) return undefined;
    return buildFocusColorMap(categories, selectedCategoryId, particleActive, particleDim, shape);
  }, [categories, selectedCategoryId, particleActive, particleDim, shape]);

  // Focus close button on open for keyboard accessibility
  React.useEffect(() => { closeRef.current?.focus(); }, []);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      {/* Backdrop — immediate response, no spring delay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          backgroundColor: "rgba(0,0,0,0.8)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          zIndex: 200,
        }}
      />

      {/* Centering wrapper — keeps transform math clean (same pattern as ShareModal) */}
      <div
        style={{
          position: "fixed", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 201, pointerEvents: "none",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          exit={{    opacity: 0, y: 10, scale: 0.97,
            // 2× stiffness on exit — clears stale state fast (motion-choreography principle)
            transition: { scale: MODAL_EXIT, y: MODAL_EXIT, opacity: { duration: 0.14, ease: "easeIn" } },
          }}
          transition={{
            opacity: { duration: 0.18, ease: "easeOut" },
            scale:   MODAL_SPRING,
            y:       MODAL_SPRING,
          }}
          style={{ pointerEvents: "all" }}
        >
          {/* Modal card */}
          <ElevatedSection
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "var(--modal-bg)",
              borderRadius: 16,
              border: "1px solid var(--overlay-strong)",
              boxShadow: "0 0 0 1px var(--overlay-subtle), 0 40px 100px rgba(0,0,0,0.95)",
              overflow: "hidden",
              width: 520,
              maxWidth: "90vw",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Card header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px 0" }}>
              <span className="select-none" style={MODAL_TITLE_STYLE}>Focus Area</span>
              <button ref={closeRef} onClick={onClose} style={MODAL_CLOSE_BTN_STYLE}>×</button>
            </div>

            {/* Morph canvas — inset 24px each side to align with header margins */}
            <div style={{ padding: "16px 24px 0" }}>
              <div style={{
                // canvas border: white rim on dark, subtle dark rim on light
                border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
                borderRadius: 8,
                overflow: "hidden",
                height: 380,
                backgroundColor: isDark ? "#000000" : "#D2D2D2",
              }}>
                <ParticleMorph
                  initialShape={initialShape}
                  shape={shape}
                  hideControls
                  cursorDispersion
                  disableScroll={!!allowedShapes}
                  // particleColorMap: category distribution when available, fallback to flat color
                  {...(modalColorMap
                    ? { particleColorMap: modalColorMap }
                    : { particleColor: isDark ? "#ffffff" : "#1A1A1A" }
                  )}
                  backgroundColor={isDark ? "#000000" : "#D2D2D2"}
                  shapeSequence={allowedShapes ? [...allowedShapes] : undefined}
                />
              </div>
            </div>

            {/* Shape selector + optional category selector */}
            <div style={{ padding: "16px 24px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ height: 1, backgroundColor: "var(--overlay-medium)" }} />
              {/* Shape row */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span className="select-none" style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace", color: "var(--text-faint)", flexShrink: 0, width: 52 }}>Shape</span>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-start" }}>
                {(allowedShapes
                  ? allowedShapes.map(i => ({ name: FOCUS_ALLOWED_LABELS[i] ?? SHAPE_NAMES[i], i }))
                  : SHAPE_NAMES.map((name, i) => ({ name, i }))
                ).map(({ name, i }) => {
                  const isActive = shape === i;
                  // button colors: flip between dark/light token sets
                  const bg     = isActive
                    ? isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.10)"
                    : isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
                  const col    = isActive
                    ? isDark ? "rgba(255,255,255,0.95)" : "rgba(0,0,0,0.85)"
                    : isDark ? "rgba(255,255,255,0.40)" : "rgba(0,0,0,0.40)";
                  const border = isActive
                    ? isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.20)"
                    : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.12)";
                  return (
                    <button
                      key={i}
                      onClick={() => setShape(i)}
                      style={{
                        background: bg,
                        color:      col,
                        border:     `1px solid ${border}`,
                        borderRadius: 20,
                        padding: "6px 18px",
                        cursor: "pointer",
                        fontSize: 11,
                        letterSpacing: "0.06em",
                        fontFamily: "var(--font-mono, monospace)",
                        outline: "none",
                        transition: "background 0.18s ease, color 0.18s ease, border-color 0.18s ease",
                      }}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
              </div>{/* end shape row */}

              {/* Category row — only rendered when categories are passed */}
              {categories && categories.length > 0 && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <span className="select-none" style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace", color: "var(--text-faint)", flexShrink: 0, width: 52, paddingTop: 7 }}>Category</span>
                  {/* overflowX scroll: pills stay single-line, container scrolls horizontally if they overflow */}
                  <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none" }}>
                    {categories.map((cat) => {
                      const isActive = selectedCategoryId === cat.id;
                      const bg     = isActive ? isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.10)" : isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
                      const col    = isActive ? isDark ? "rgba(255,255,255,0.95)" : "rgba(0,0,0,0.85)" : isDark ? "rgba(255,255,255,0.40)" : "rgba(0,0,0,0.40)";
                      const border = isActive ? isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.20)" : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.12)";
                      const short  = CATEGORY_SHORT[cat.id] ?? cat.label;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => onSelectCategory?.(cat.id)}
                          style={{
                            background: bg, color: col, border: `1px solid ${border}`,
                            borderRadius: 20, padding: "6px 14px", cursor: "pointer",
                            fontSize: 11, letterSpacing: "0.04em",
                            fontFamily: "var(--font-mono, monospace)",
                            whiteSpace: "nowrap",  // pill text never breaks — container wraps instead
                            outline: "none",
                            transition: "background 0.18s ease, color 0.18s ease, border-color 0.18s ease",
                          }}
                        >
                          {short} | {Math.round(cat.pct)}%
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </ElevatedSection>
        </motion.div>
      </div>
    </>
  );
}

// ─── Top searches explorer overlay ────────────────────────────────────────────

function TopSearchesExplorer({ onClose, terms }: { onClose: () => void; terms: { term: string; count: number }[] }) {
  const closeRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => { closeRef.current?.focus(); }, []);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          backgroundColor: "rgba(0,0,0,0.8)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          zIndex: 200,
        }}
      />

      {/* Centering wrapper */}
      <div
        style={{
          position: "fixed", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 201, pointerEvents: "none",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          exit={{    opacity: 0, y: 10, scale: 0.97,
            transition: { scale: MODAL_EXIT, y: MODAL_EXIT, opacity: { duration: 0.14, ease: "easeIn" } },
          }}
          transition={{
            opacity: { duration: 0.18, ease: "easeOut" },
            scale:   MODAL_SPRING,
            y:       MODAL_SPRING,
          }}
          style={{ pointerEvents: "all" }}
        >
          {/* Modal card */}
          <ElevatedSection
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "var(--modal-bg)",
              borderRadius: 16,
              border: "1px solid var(--overlay-strong)",
              boxShadow: "0 0 0 1px var(--overlay-subtle), 0 40px 100px rgba(0,0,0,0.95)",
              overflow: "hidden",
              width: 440,
              maxWidth: "90vw",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px 0" }}>
              <span
                className="font-mono select-none"
                style={{ fontSize: 9, color: "var(--text-secondary)", letterSpacing: "0.18em", textTransform: "uppercase" }}
              >
                Top searches
              </span>
              <button
                ref={closeRef}
                onClick={onClose}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--text-faint)", fontSize: 18, lineHeight: 1,
                  padding: "4px 6px", borderRadius: 4,
                  outline: "none",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-faint)"; }}
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: "20px 24px 24px" }}>
              <TypewriterSearchBar terms={terms} defaultExpanded />
            </div>
          </ElevatedSection>
        </motion.div>
      </div>
    </>
  );
}

// ─── Builder Energy explorer overlay ─────────────────────────────────────────

const BE_TICK_COUNT = 40;
const BE_TICK_H     = 20;

// BUILDER_PROFILES, BuilderProfileId, calcBuilderProfile now live in @/lib/calc-builder-profile.
// (moved 2026-04-21 for Vercel migration)

function BuilderEnergyExplorer({ onClose, stats }: { onClose: () => void; stats: typeof MOCK_STATS }) {
  const closeRef    = React.useRef<HTMLButtonElement>(null);
  const scoreTarget = Math.round(stats.builderEnergy * 100);
  const autoProfile = calcBuilderProfile(scoreTarget);

  const [selectedProfile, setSelectedProfile] = React.useState<BuilderProfileId>(autoProfile);
  const [displayScore,    setDisplayScore]    = React.useState(scoreTarget);
  const [isExpanded,      setIsExpanded]      = React.useState(false);
  const [hoveredProfile,  setHoveredProfile]  = React.useState<BuilderProfileId | null>(null);

  // Ref-based animation avoids stale closure issues with setInterval
  const displayScoreRef = React.useRef(scoreTarget);
  const animRef         = React.useRef<ReturnType<typeof setInterval> | null>(null);

  function animateTo(target: number, msPerStep = 40) {
    if (animRef.current) { clearInterval(animRef.current); animRef.current = null; }
    animRef.current = setInterval(() => {
      const curr = displayScoreRef.current;
      if (curr === target) { clearInterval(animRef.current!); animRef.current = null; return; }
      const next = curr + (target > curr ? 1 : -1);
      displayScoreRef.current = next;
      setDisplayScore(next);
    }, msPerStep);
  }

  const filledCount = Math.round((displayScore / 100) * BE_TICK_COUNT);

  React.useEffect(() => { closeRef.current?.focus(); }, []);
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // On mount: expand pill — stay at real score
  React.useEffect(() => {
    const t1 = setTimeout(() => setIsExpanded(true), 350);
    return () => {
      clearTimeout(t1);
      if (animRef.current) { clearInterval(animRef.current); animRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleProfileSelect(id: BuilderProfileId) {
    setSelectedProfile(id);
    if (id === autoProfile) {
      // User's own tier — animate to their real score
      animateTo(scoreTarget, 25);
    } else {
      // Different tier — show that tier's representative value
      const target = BUILDER_PROFILES.find(p => p.id === id)!.display;
      animateTo(target, 20);
    }
  }

  const tickBar = (
    <motion.div
      style={{ display: "flex", gap: 3, alignItems: "stretch", width: "100%" }}
      initial={{ clipPath: "inset(0 100% 0 0 round 2px)" }}
      animate={{ clipPath: "inset(0 0% 0 0 round 2px)" }}
      transition={{ delay: 0.1, duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {Array.from({ length: BE_TICK_COUNT }).map((_, i) => (
        <div key={i} style={{ flex: 1, height: BE_TICK_H, borderRadius: 2, flexShrink: 0, backgroundColor: i < filledCount ? "var(--color-gray12)" : "var(--overlay-medium)" }} />
      ))}
    </motion.div>
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", zIndex: 200 }}
      />

      <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 201, pointerEvents: "none" }}>
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.97, transition: { scale: MODAL_EXIT, y: MODAL_EXIT, opacity: { duration: 0.14, ease: "easeIn" } } }}
          transition={{ opacity: { duration: 0.18, ease: "easeOut" }, scale: MODAL_SPRING, y: MODAL_SPRING }}
          style={{ pointerEvents: "all" }}
        >
          <ElevatedSection
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: "var(--modal-bg)", borderRadius: 16, border: "1px solid var(--overlay-strong)", boxShadow: "0 0 0 1px var(--overlay-subtle), 0 40px 100px rgba(0,0,0,0.95)", overflow: "hidden", width: 400, maxWidth: "90vw" }}
          >
            {/* Header — label · % pill · close */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 24px 0" }}>
              <span className="select-none" style={{ fontSize: 9, color: "var(--text-secondary)", letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace" }}>
                Builder Energy
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15, delay: 0.3 }} style={{ display: "inline-flex", alignItems: "center" }}>
                  <motion.div
                    layout
                    style={{ display: "inline-flex", alignItems: "center", height: 26, borderRadius: 999, padding: 3, gap: 2, border: "1px solid var(--overlay-strong)", backgroundColor: "var(--overlay-medium)" }}
                    transition={{ layout: { type: "spring", stiffness: 300, damping: 30 } }}
                  >
                    <AnimatePresence mode="popLayout">
                      {isExpanded && (
                        <motion.span
                          key={displayScore}
                          initial={{ opacity: 0, filter: "blur(2px)", y: 8 }}
                          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                          exit={{ opacity: 0, filter: "blur(2px)", y: -12 }}
                          transition={{ duration: 0.25, ease: [0.23, 0.88, 0.26, 0.92] }}
                          className="font-mono select-none"
                          style={{ fontSize: 11, color: "var(--color-gray11)", letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums", padding: "0 5px 0 4px", lineHeight: 1, display: "flex", alignItems: "center", height: 20 }}
                        >
                          {displayScore}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    <button
                      onClick={() => setIsExpanded(e => !e)}
                      className="font-mono select-none"
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 20, minWidth: 20, padding: "0 5px", borderRadius: 999, border: "1px solid var(--overlay-medium)", backgroundColor: "var(--overlay-medium)", color: "var(--color-gray12)", cursor: "pointer", fontSize: 11, lineHeight: 1 }}
                    >
                      %
                    </button>
                  </motion.div>
                </motion.span>
                <button
                  ref={closeRef}
                  onClick={onClose}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-faint)", fontSize: 18, lineHeight: 1, padding: "0 0 2px", display: "flex", alignItems: "center" }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Tick bar */}
            <div style={{ padding: "40px 24px 0" }}>
              <div style={{ width: "100%", padding: "16px 20px", borderRadius: 10, border: "1px solid var(--overlay-medium)", backgroundColor: "var(--overlay-subtle)", overflow: "hidden" }}>
                {tickBar}
              </div>
            </div>

            {/* Description — full-width: bold label + em dash + sentence */}
            <div style={{ padding: "18px 24px 14px" }}>
              <AnimatePresence mode="wait">
                <motion.p
                  key={selectedProfile}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="font-mono select-none"
                  style={{ margin: 0, fontSize: 11, letterSpacing: "0.01em", lineHeight: 1.6, color: "var(--text-faint)" }}
                >
                  <span style={{ color: "var(--color-gray12)", fontWeight: 500 }}>
                    {BUILDER_PROFILES.find(p => p.id === selectedProfile)!.label}
                  </span>
                  {" — "}
                  {BUILDER_PROFILES.find(p => p.id === selectedProfile)!.desc}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Divider */}
            <div style={{ height: 1, backgroundColor: "var(--overlay-medium)", margin: "20px 24px 16px" }} />

            {/* Profile tier rows — label left, range right */}
            <div style={{ display: "flex", flexDirection: "column", gap: 7, padding: "0 24px 28px" }}>
              {BUILDER_PROFILES.map((p, idx) => {
                const isSel = selectedProfile === p.id;
                const isHov = hoveredProfile === p.id && !isSel;
                const rowC = modalListRowTextColors(isSel, isHov);
                return (
                  <motion.button
                    key={p.id}
                    type="button"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1], delay: idx * 0.05 }}
                    onClick={() => handleProfileSelect(p.id)}
                    onPointerEnter={() => setHoveredProfile(p.id)}
                    onPointerLeave={() => setHoveredProfile(null)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 16px", gap: 12,
                      borderRadius: 10, cursor: "pointer", width: "100%", textAlign: "left",
                      border: `1px solid ${isSel || isHov ? "var(--overlay-strong)" : "var(--overlay-medium)"}`,
                      backgroundColor: isSel ? "var(--overlay-medium)" : isHov ? "color-mix(in srgb, var(--overlay-medium) 42%, var(--overlay-subtle))" : "var(--overlay-subtle)",
                      transition: "background-color 0.2s ease, border-color 0.2s ease",
                      outline: "none",
                    }}
                  >
                    <span className="font-mono" style={{ fontSize: 13, letterSpacing: "-0.01em", color: rowC.title, transition: "color 0.15s ease" }}>
                      {p.label}
                    </span>
                    <span className="font-mono select-none" style={{ fontSize: 9, letterSpacing: "0.06em", textTransform: "uppercase", flexShrink: 0, color: rowC.meta, transition: "color 0.15s ease" }}>
                      {p.range[0]}–{p.range[1]}%
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </ElevatedSection>
        </motion.div>
      </div>
    </>
  );
}

// ─── Grid view ────────────────────────────────────────────────────────────────
//
// Layout (4-col × 200px rows):
//   Row 1: [01 morph 2×2] [peak hr      ] [midnight     ]
//   Row 2: [01 morph 2×2] [single-day   ] [searches     ]
//   Row 3: [cat bars 2×1] [40% AI/ML    ] [sphere morph ]
//   Row 4: [domain breakdown  ── 4×1 ───────────────────]
//   Row 5:                [top searches typewriter 2×1   ]
//
// Card 01 hover: shows selected category shape; reverts to play on mouse-out.

function GridView() {
  const stats = MOCK_STATS;
  const [showShare, setShowShare] = React.useState(false);
  const [morphOpen, setMorphOpen] = React.useState(false);
  const [searchesOpen, setSearchesOpen] = React.useState(false);
  const [builderEnergyOpen, setBuilderEnergyOpen] = React.useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string>("ai");

  const card01Shape = CATEGORY_SHAPE[selectedCategoryId] ?? PLAY_SHAPE_INDEX;

  const total = stats.categoryBreakdown.reduce((s, c) => s + c.count, 0);
  const recalculated = stats.categoryBreakdown
    .filter((c) => c.count > 0)
    .map((c) => ({ ...c, percentage: (c.count / total) * 100 }));

  const domainData = [
    { id: "ai",          label: "AI & Machine Learning", pct: 40.3 },
    { id: "design",      label: "Design & Craft",        pct: 24.6 },
    { id: "engineering", label: "Engineering & Dev",     pct: 18.2 },
    { id: "startup",     label: "Startups & Product",    pct: 16.9 },
  ];

  return (
    <>
      <PageCTABar onShare={() => setShowShare(true)} />

      <div
        style={{
          backgroundColor: "var(--bg-primary)",
          minHeight: "100vh",
          padding: "40px",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gridAutoRows: "200px",
          gap: 12,
        }}
      >
        {/* 01 + 06 — Unified morph + category selector (cols 1-2, rows 1-3) */}
        <GridCard
          delay={0}
          disableScale
          onClick={() => setMorphOpen(true)}
          style={{ gridColumn: "1 / 3", gridRow: "1 / 4", display: "flex", flexDirection: "column", backgroundColor: "var(--bg-primary)" }}
        >
          <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
            <div style={{ position: "absolute", inset: 0 }}>
              <ParticleMorph
                initialShape={PLAY_SHAPE_INDEX}
                shape={card01Shape}
                hideControls
                cursorDispersion
                particleColor="#ffffff"
                backgroundColor="#000000"
              />
            </div>
            <div style={{ position: "absolute", top: 18, left: 20, right: 20, display: "flex", justifyContent: "space-between" }}>
              <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.06em", fontFamily: "'Geist Mono', ui-monospace, monospace" }}>Focus area</span>
              <span className="font-mono select-none" style={{ fontSize: 8, color: "var(--text-faint)", letterSpacing: "0.14em", textTransform: "uppercase" }}>Morph</span>
            </div>
            <div style={{ position: "absolute", bottom: 18, left: 20, right: 20 }}>
              <span className="font-mono select-none" style={{ fontSize: 10, color: "var(--text-faint)", letterSpacing: "0.04em" }}>
                Explore shapes →
              </span>
            </div>
          </div>

          <div style={{ height: 1, backgroundColor: "var(--overlay-medium)", flexShrink: 0 }} />

          <div
            style={{ padding: "16px 20px 20px", flexShrink: 0, backgroundColor: "var(--bg-primary)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="font-mono select-none" style={{ fontSize: 8, color: "var(--text-faint)", letterSpacing: "0.14em", textTransform: "uppercase", display: "block", marginBottom: 10 }}>
              Focus
            </span>
            <CategoryBars
              categories={recalculated}
              title=""
              selectedId={selectedCategoryId}
              onSelect={setSelectedCategoryId}
            />
          </div>
        </GridCard>

        {/* 03 — Rabbit holes */}
        <GridCard delay={0.07} style={{ gridColumn: "3", gridRow: "1" }}>
          <div style={{ height: "100%", padding: "20px 22px", display: "flex", flexDirection: "column" }}>
            <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace" }}>
              Rabbit holes
            </span>
            <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
              <span className="font-mono select-none" style={{ fontSize: 44, color: "var(--color-gray12)", letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                {stats.rabbitHoleCount}
              </span>
            </div>
          </div>
        </GridCard>

        {/* 04 — After midnight */}
        <GridCard delay={0.12} style={{ gridColumn: "4", gridRow: "1" }}>
          <div style={{ height: "100%", padding: "20px 22px", display: "flex", flexDirection: "column" }}>
            <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace" }}>
              After midnight
            </span>
            <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
              <span className="font-mono select-none" style={{ fontSize: 44, color: "var(--color-gray12)", letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                {Math.round(stats.nightOwlPercent)}%
              </span>
            </div>
          </div>
        </GridCard>

        {/* 05 — Single-day record */}
        <GridCard delay={0.17} style={{ gridColumn: "3", gridRow: "2" }}>
          <div style={{ height: "100%", padding: "20px 22px", display: "flex", flexDirection: "column" }}>
            <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace" }}>
              Single-day record
            </span>
            <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
              <span className="font-mono select-none" style={{ fontSize: 44, color: "var(--color-gray12)", letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                {stats.bingeSessions[0]?.count ?? 0}
              </span>
            </div>
          </div>
        </GridCard>

        {/* 08 — Top searches */}
        <GridCard delay={0.22} style={{ gridColumn: "4", gridRow: "2" }}>
          <div style={{ height: "100%", padding: "20px 22px", display: "flex", flexDirection: "column" }}>
            <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14, fontFamily: "'Geist Mono', ui-monospace, monospace" }}>
              Top searches
            </span>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 9 }}>
              {stats.topSearchTerms.slice(0, 5).map((item) => (
                <div key={item.term} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--color-orange)", width: 16, textAlign: "right", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                    {item.count}
                  </span>
                  <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.term}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </GridCard>

        {/* 07 — Top focus stat */}
        <GridCard delay={0.27} style={{ gridColumn: "3", gridRow: "3" }}>
          <div style={{ height: "100%", padding: "20px 22px", display: "flex", flexDirection: "column" }}>
            <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace" }}>
              Top category
            </span>
            <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
              <span className="font-mono select-none" style={{ fontSize: 44, color: "var(--color-orange)", letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                {Math.round(recalculated.find(c => c.id === stats.topCategory.id)?.percentage ?? stats.topCategory.percentage)}%
              </span>
            </div>
            <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.02em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace" }}>
              {stats.topCategory.label}
            </span>
          </div>
        </GridCard>

        {/* 02 — Avg hours per day */}
        <GridCard delay={0.32} style={{ gridColumn: "4", gridRow: "3" }}>
          <div style={{ height: "100%", padding: "20px 22px", display: "flex", flexDirection: "column" }}>
            <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace" }}>
              Daily habit
            </span>
            {/* Time display: number large, unit letter small + faint — makes the unit feel like a label, not data */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
              <span className="font-mono select-none" style={{ fontSize: 28, color: "var(--color-gray12)", lineHeight: 1, opacity: 0.6 }}>~</span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                <span className="font-mono select-none" style={{ fontSize: 44, color: "var(--color-gray12)", letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                  {splitHoursMinutes(stats.avgHoursPerDay).h}
                </span>
                <span className="font-mono select-none" style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: "0.05em" }}>H</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                <span className="font-mono select-none" style={{ fontSize: 44, color: "var(--color-gray12)", letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                  {String(splitHoursMinutes(stats.avgHoursPerDay).m).padStart(2, "0")}
                </span>
                <span className="font-mono select-none" style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: "0.05em" }}>M</span>
              </div>
            </div>
            <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.02em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace" }}>
              Avg daily
            </span>
          </div>
        </GridCard>

        {/* 09 — Domain breakdown (4×1) — EnjProgress ruler per category */}
        <GridCard delay={0.37} style={{ gridColumn: "1 / 5", gridRow: "4" }}>
          <div style={{ height: "100%", padding: "0 8px", display: "flex", alignItems: "stretch" }}>
            {domainData.map((d, i) => (
              <React.Fragment key={d.id}>
                {/* each column: vertically centered ruler */}
                <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 22px" }}>
                  <EnjProgress
                    progress={d.pct / 100}
                    label={d.label}
                    showFooter={false}
                    glass={DEFAULT_GLASS}
                  />
                </div>
                {/* vertical divider between columns */}
                {i < domainData.length - 1 && (
                  <div style={{ width: 1, alignSelf: "stretch", margin: "20px 0", backgroundColor: "var(--overlay-medium)", flexShrink: 0 }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </GridCard>

        {/* 10 — Top searches typewriter (cols 3-4, row 5) */}
        <GridCard delay={0.42} onClick={() => setSearchesOpen(true)} style={{ gridColumn: "3 / 5", gridRow: "5" }}>
          <div style={{ height: "100%", padding: "20px 22px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14, fontFamily: "'Geist Mono', ui-monospace, monospace" }}>
              Top searches
            </span>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", pointerEvents: "none" }}>
              <TypewriterSearchBar terms={stats.topSearchTerms} />
            </div>
          </div>
        </GridCard>

        <GridCard delay={0.47} style={{ gridColumn: "1 / 3", gridRow: "5", overflow: "hidden" }}>
          <div style={{ position: "relative", height: "100%", overflow: "hidden" }}>
            <video
              src="https://pub-53930e9a5ab94f018a9f8c1509ea8e27.r2.dev/Avatar1.mp4"
              poster="/charcterim.png"
              loop
              muted
              playsInline
              onMouseEnter={e => (e.currentTarget as HTMLVideoElement).play()}
              onMouseLeave={e => { const v = e.currentTarget as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", cursor: "pointer" }}
            />
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 50%)",
              pointerEvents: "none",
            }} />
            <span
              className="select-none"
              style={{
                position: "absolute", bottom: 14, left: 16,
                fontSize: 9, color: "rgba(255,255,255,0.55)",
                letterSpacing: "0.1em", textTransform: "uppercase",
                fontFamily: "'Geist Mono', ui-monospace, monospace",
              }}
            >
              Late night learning
            </span>
          </div>
        </GridCard>

        <GridCard delay={0.52} style={{ gridColumn: "1 / 3", gridRow: "6", overflow: "hidden" }}>
          <div style={{ position: "relative", height: "100%", overflow: "hidden", backgroundColor: "#000" }}>
            <img
              src="/character-pixel.png"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
        </GridCard>

        {/* Builder Energy (cols 3-4, row 6) — click to open modal with count-up */}
        <GridCard delay={0.57} style={{ gridColumn: "3 / 5", gridRow: "6" }}>
          <BuilderEnergy stats={stats} animationDelay={300} variant="bare" onOpen={() => setBuilderEnergyOpen(true)} />
        </GridCard>
      </div>

      <AnimatePresence>
        {morphOpen          && <MorphExplorer onClose={() => setMorphOpen(false)} initialShape={CATEGORY_SHAPE[selectedCategoryId] ?? PLAY_SHAPE_INDEX} />}
        {searchesOpen       && <TopSearchesExplorer onClose={() => setSearchesOpen(false)} terms={stats.featuredSearchTerms} />}
        {builderEnergyOpen  && <BuilderEnergyExplorer onClose={() => setBuilderEnergyOpen(false)} stats={stats} />}
        {showShare          && <ShareModal onClose={() => setShowShare(false)} stats={stats} />}
      </AnimatePresence>
    </>
  );
}


// ─── Bento resize handle ──────────────────────────────────────────────────────
// Contained-gesture drag: pointer capture keeps events alive past element edge,
// cursor lock prevents the I-beam flicker during drag, touch-action blocks scroll

interface BentoHandleProps {
  direction: "col" | "row";
  style?: React.CSSProperties;
  onDelta: (px: number) => void; // incremental pixel delta per pointer-move frame
  className?: string;
}

function BentoResizeHandle({ direction, style, onDelta, className }: BentoHandleProps) {
  const ref    = React.useRef<HTMLDivElement>(null);
  const active = React.useRef(false);
  const origin = React.useRef(0);
  const [hovered,  setHovered]  = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const isCol = direction === "col";

  function onPointerDown(e: React.PointerEvent) {
    e.preventDefault();
    ref.current?.setPointerCapture(e.pointerId); // pointer capture: drag works past element edge
    origin.current = isCol ? e.clientX : e.clientY;
    active.current = true;
    setDragging(true);
    document.body.style.cursor     = isCol ? "col-resize" : "row-resize"; // lock cursor globally
    document.body.style.userSelect = "none"; // no text selection during drag
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!active.current) return;
    const pos   = isCol ? e.clientX : e.clientY;
    const delta = pos - origin.current; // incremental: reset origin each frame
    origin.current = pos;
    onDelta(delta);
  }

  function onPointerUp() {
    active.current = false;
    setDragging(false);
    document.body.style.cursor     = ""; // release global cursor lock
    document.body.style.userSelect = "";
  }

  const show = hovered || dragging;

  return (
    <div
      ref={ref}
      className={className}
      style={{
        position: "absolute",
        cursor: isCol ? "col-resize" : "row-resize",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        touchAction: "none", // prevent browser scroll conflicts on touch
        zIndex: 20,
        ...style,
      }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* Pill indicator — hidden at rest, fades in + thickens on hover, fixed size */}
      <div style={{
        position: "absolute",
        // fixed 28px length so col and row handles look identical regardless of container size
        ...(isCol
          ? { width: show ? 3 : 2, height: 28 }
          : { height: show ? 3 : 2, width:  28 }),
        backgroundColor: "var(--text-muted)",
        // pill: always rounded — borderRadius exceeds half the thickness
        borderRadius: 4,
        // opacity: invisible at rest, appears on hover, confirms drag
        opacity: dragging ? 0.55 : show ? 0.4 : 0,
        // transition: thickness (width/height) and fade together feel like one motion
        transition: "width 0.15s ease, height 0.15s ease, opacity 0.18s ease",
        pointerEvents: "none",
      }} />
    </div>
  );
}

// ─── Icon registry (for RestDay modal) ──────────────────────────────────────
type MG_IconHandle = { startAnimation: () => void; stopAnimation: () => void };
type MG_IconKey = "coffee" | "moon" | "sun" | "heart" | "flame" | "zap" | "sparkles" | "rocket" | "brain" | "graduation-cap" | "book-text" | "cooking-pot" | "party-popper" | "home" | "map-pin" | "compass" | "telescope" | "message-circle" | "smile" | "laugh" | "hand-heart" | "waves" | "snowflake" | "rocking-chair" | "cctv" | "frame" | "hand-metal";
const MG_ICON_COMPONENTS: Record<MG_IconKey, React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & { size?: number } & React.RefAttributes<MG_IconHandle>>> = {
  "coffee": CoffeeIcon, "moon": MoonIcon, "sun": SunIcon, "heart": HeartIcon, "flame": FlameIcon,
  "zap": ZapIcon, "sparkles": SparklesIcon, "rocket": RocketIcon, "brain": BrainIcon,
  "graduation-cap": GraduationCapIcon, "book-text": BookTextIcon, "cooking-pot": CookingPotIcon,
  "party-popper": PartyPopperIcon, "home": HomeIcon, "map-pin": MapPinIcon, "compass": CompassIcon,
  "telescope": TelescopeIcon, "message-circle": MessageCircleIcon, "smile": SmileIcon, "laugh": LaughIcon,
  "hand-heart": HandHeartIcon, "waves": WavesIcon, "snowflake": SnowflakeIcon,
  "rocking-chair": RockingChairIcon, "cctv": CctvIcon, "frame": FrameIcon, "hand-metal": HandMetalIcon,
};
const MG_ALL_ICON_KEYS = Object.keys(MG_ICON_COMPONENTS) as MG_IconKey[];
const MG_REST_DAY_ACTIVITIES: { label: string; icon: MG_IconKey; isPlaceholder?: boolean }[] = [
  { label: "Photography",   icon: "frame"          },
  { label: "Eating Pizza",  icon: "hand-metal"     },
  { label: "Texting Mom",   icon: "message-circle" },
  { label: "Going Outside", icon: "map-pin"        },
  { label: "Doing Nothing", icon: "coffee"         },
];

// ─── Tool loyalty data ────────────────────────────────────────────────────────
const MG_toolLoyaltyTimeline = [
  { tool: "Cursor",      earlyN: 23,  recentN: 169, note: "Your most-used AI coding tool. Usage exploded in the recent period — you went deep." },
  { tool: "Claude Code", earlyN: 0,   recentN: 108, note: "Zero early searches, then 108 recent — a clean adoption curve. You committed." },
  { tool: "ChatGPT",     earlyN: 12,  recentN: 15,  note: "Consistent but low. More of a fallback than a primary tool." },
  { tool: "v0",          earlyN: 3,   recentN: 44,  note: "Rapid growth in recent period — clearly found a workflow for it." },
  { tool: "Windsurf",    earlyN: 0,   recentN: 28,  note: "New entry in the recent period. Still exploring." },
];
const MG_toolLoyaltyMax = 169;

// ─── StreakPill (shared with DataStories flagged grid) ────────────────────────

let _mainGridPopAudio: HTMLAudioElement | null = null;
function playMainGridPop() {
  if (typeof window === "undefined") return;
  if (!_mainGridPopAudio) { _mainGridPopAudio = new Audio("./sounds/pop-click.wav"); _mainGridPopAudio.volume = 0.45; }
  _mainGridPopAudio.currentTime = 0;
  _mainGridPopAudio.play().catch(() => {});
}

function StreakPillMain({ count }: { count: number }) {
  const [expanded, setExpanded] = React.useState(false);
  const [hovered, setHovered]   = React.useState(false);
  return (
    <motion.div layout
      animate={{ backgroundColor: hovered ? "var(--overlay-medium)" : "var(--overlay-subtle)", borderColor: hovered ? "var(--overlay-strong)" : "var(--overlay-medium)" }}
      transition={{ layout: { type: "spring", stiffness: 300, damping: 30 }, backgroundColor: { duration: 0.2, ease: "easeInOut" }, borderColor: { duration: 0.2, ease: "easeInOut" } }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ display: "inline-flex", alignItems: "center", alignSelf: "flex-start", height: 26, borderRadius: 999, padding: 3, gap: 2, border: "1px solid", cursor: "pointer" }}
    >
      <AnimatePresence mode="popLayout">
        {expanded && (
          <motion.span key="expanded"
            initial={{ opacity: 0, filter: "blur(2px)", y: 8 }} animate={{ opacity: 1, filter: "blur(0px)", y: 0 }} exit={{ opacity: 0, filter: "blur(2px)", y: -12 }}
            transition={{ duration: 0.35, ease: [0.23, 0.88, 0.26, 0.92] }}
            className="font-mono select-none"
            style={{ fontSize: 11, color: "var(--color-gray11)", letterSpacing: "0.04em", padding: "0 5px 0 4px", lineHeight: 1, display: "flex", alignItems: "center", height: 20, fontVariantNumeric: "tabular-nums" }}
          >{count} days</motion.span>
        )}
      </AnimatePresence>
      <button onClick={(e) => { e.stopPropagation(); playMainGridPop(); setExpanded(v => !v); }}
        className="font-mono select-none"
        style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 20, minWidth: 20, padding: "0 5px", borderRadius: 999, border: "1px solid var(--overlay-medium)", backgroundColor: "var(--overlay-medium)", color: "var(--color-gray12)", cursor: "pointer", fontSize: 11, lineHeight: 1 }}
      >#</button>
    </motion.div>
  );
}

// ─── Main-Grid: hero + rhythm narrative, then the grid below ─────────────────

// ─── DATA CONTRACT ────────────────────────────────────────────────────────────
// ─── RestDay components ───────────────────────────────────────────────────────

function MG_RestDayBarChart({ dowAvg, quietDay, barWidth, isModal = false }: { dowAvg: { name: string; avg: number }[]; quietDay: { name: string }; barWidth: number; isModal?: boolean }) {
  const dowMax = Math.max(...dowAvg.map((d) => d.avg));
  const labels = ["M", "T", "W", "T", "F", "S", "S"];
  const reordered = [dowAvg[1], dowAvg[2], dowAvg[3], dowAvg[4], dowAvg[5], dowAvg[6], dowAvg[0]];
  return (
    // height: 100% — fills the flex:1 parent so the chart grows with the card
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%" }}>
      {/* bars row: flex:1 takes all available height, bars align to the bottom */}
      <div style={{ flex: 1, display: "flex", alignItems: "flex-end", justifyContent: "space-between", width: "100%" }}>
        {reordered.map((d, i) => {
          const hPct = Math.max(5, (d.avg / dowMax) * 100);
          const isQuietest = d.name === quietDay.name;
          return (
            <div key={i} style={{ width: barWidth, height: `${hPct}%`, borderRadius: 4, backgroundColor: isQuietest ? "var(--color-orange)" : "var(--overlay-strong)", opacity: isQuietest ? 1 : (isModal ? 1 : 0.72) }} />
          );
        })}
      </div>
      {/* labels row: fixed below bars, always readable */}
      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", marginTop: 5 }}>
        {reordered.map((d, i) => {
          const isQuietest = d.name === quietDay.name;
          return (
            <div key={i} style={{ width: barWidth, display: "flex", justifyContent: "center" }}>
              <span className="font-mono select-none" style={{ fontSize: 9, color: isQuietest ? "var(--color-orange)" : (isModal ? "var(--text-secondary)" : "var(--text-faint)") }}>{labels[i]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MG_RestDayModal({ onClose, dowAvg, quietDay }: { onClose: () => void; dowAvg: { name: string; avg: number }[]; quietDay: { name: string } }) {
  const [activities, setActivities] = React.useState([...MG_REST_DAY_ACTIVITIES]);
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const [pickerIndex, setPickerIndex] = React.useState<number | null>(null);
  const iconRefs = React.useRef<(MG_IconHandle | null)[]>([]);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18, ease: "easeOut" }} onClick={onClose} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", zIndex: 200 }} />
      <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 201, pointerEvents: "none" }}>
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.97, transition: { scale: MODAL_EXIT, y: MODAL_EXIT, opacity: { duration: 0.14, ease: "easeIn" } } }}
          transition={{ opacity: { duration: 0.18, ease: "easeOut" }, scale: MODAL_SPRING, y: MODAL_SPRING }}
          style={{ pointerEvents: "all" }}
        >
          <ElevatedSection onClick={(e) => { e.stopPropagation(); setPickerIndex(null); }} style={{ backgroundColor: "var(--modal-bg)", borderRadius: 16, border: "1px solid var(--overlay-strong)", boxShadow: "0 0 0 1px var(--overlay-subtle), 0 40px 100px rgba(0,0,0,0.95)", width: 420, maxWidth: "90vw" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px 0" }}>
              <span className="select-none" style={{ fontSize: 9, color: "var(--text-secondary)", letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace" }}>Your rest day — {quietDay.name}</span>
              <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-faint)", fontSize: 18, lineHeight: 1, padding: "4px 6px", borderRadius: 4, transition: "color 0.15s" }} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-faint)"; }}>×</button>
            </div>
            {/* height: 140 gives the chart a known size to % against inside the modal */}
            <div style={{ padding: "20px 24px 0", height: 140 }}>
              <MG_RestDayBarChart dowAvg={dowAvg} quietDay={quietDay} barWidth={40} isModal />
            </div>
            <div style={{ padding: "0 24px 24px" }}>
              <div style={{ height: 1, backgroundColor: "var(--overlay-medium)", margin: "20px 0 16px" }} />
              <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: 10, fontFamily: "'Geist Mono', ui-monospace, monospace" }}>{quietDay.name} activities</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {activities.map((activity, i) => {
                  const isEditing = editingIndex === i;
                  const isHovered = hoveredIndex === i;
                  const isPickerOpen = pickerIndex === i;
                  const IconComp = MG_ICON_COMPONENTS[activity.icon];
                  const rowPlaceholder = ["Pondering...", "Coming soon...", "Still deciding...", "Ask me later..."][i % 4];
                  const commitEdit = () => {
                    if (activity.label.trim() === "") {
                      const next = [...activities]; next[i] = { ...next[i], label: rowPlaceholder, isPlaceholder: true }; setActivities(next);
                    }
                    setEditingIndex(null);
                  };
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1], delay: i * 0.05 }}
                      style={{ position: "relative" }}
                    >
                      <div onMouseEnter={() => { setHoveredIndex(i); iconRefs.current[i]?.startAnimation(); }} onMouseLeave={() => { setHoveredIndex(null); iconRefs.current[i]?.stopAnimation(); }} onDoubleClick={() => setEditingIndex(i)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, cursor: "default", border: `1px solid ${isEditing || isHovered ? "var(--overlay-strong)" : "var(--overlay-medium)"}`, backgroundColor: isHovered || isEditing ? "var(--overlay-medium)" : "var(--overlay-subtle)", transition: "background-color 0.15s, border-color 0.15s" }}>
                        <IconComp ref={(el) => { iconRefs.current[i] = el; }} size={16} onClick={() => setPickerIndex(isPickerOpen ? null : i)} style={{ color: "var(--color-orange)", cursor: "pointer", flexShrink: 0, opacity: isHovered ? 1 : 0.9, transition: "opacity 0.15s" }} />
                        {isEditing ? (
                          <input autoFocus value={activity.label} placeholder={rowPlaceholder} onChange={(e) => { const next = [...activities]; next[i] = { label: e.target.value, icon: activity.icon, isPlaceholder: false }; setActivities(next); }} onBlur={commitEdit} onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); }} style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 13, color: "var(--color-gray12)", letterSpacing: "-0.01em", fontFamily: "var(--font-mono, 'PP Neue Montreal', monospace)" }} />
                        ) : (
                          <span className="font-mono" style={{ flex: 1, fontSize: 13, letterSpacing: "-0.01em", transition: "color 0.15s ease, opacity 0.15s", color: activity.isPlaceholder ? "var(--text-faint, #555)" : (isHovered ? "var(--color-gray11)" : "var(--text-secondary)"), opacity: activity.isPlaceholder ? (isHovered ? 0.6 : 0.45) : 1 }}>{activity.label}</span>
                        )}
                        <button onClick={() => setEditingIndex(i)} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", color: "var(--text-faint)", lineHeight: 1, flexShrink: 0, opacity: isHovered || isEditing ? 1 : 0, transition: "opacity 0.15s" }}>
                          <svg width="14" height="14" viewBox="0 0 12 12" fill="none"><path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
                        </button>
                      </div>
                      <AnimatePresence>
                        {isPickerOpen && (
                          <motion.div initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.97 }} transition={{ duration: 0.15, ease: "easeOut" }} style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 300, backgroundColor: "var(--modal-bg)", border: "1px solid var(--overlay-strong)", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.6)", padding: 12, display: "grid", gridTemplateColumns: "repeat(6, 32px)", gap: 4 }} onClick={(e) => e.stopPropagation()}>
                            {MG_ALL_ICON_KEYS.map((key) => {
                              const PickerIcon = MG_ICON_COMPONENTS[key];
                              const isSelected = activity.icon === key;
                              return (
                                <button key={key} onClick={() => { const next = [...activities]; next[i] = { ...next[i], icon: key }; setActivities(next); setPickerIndex(null); }} style={{ background: isSelected ? "var(--overlay-strong)" : "none", border: "none", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, padding: 0, color: isSelected ? "var(--color-orange)" : "var(--text-faint)", transition: "background 0.1s, color 0.1s" }} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--overlay-medium)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = isSelected ? "var(--overlay-strong)" : "none"; }}>
                                  <PickerIcon size={16} />
                                </button>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </ElevatedSection>
        </motion.div>
      </div>
    </>
  );
}

// ─── LongestStreak modal ─────────────────────────────────────────────────────
// Motion: stagger ~50ms (capped), spring ~400/40, faster exits on contract

/** Sprint labels — same naming as Longest Streak card footer / top category */
const STREAK_SPRINT_NAMES: Record<string, string> = {
  ai: "AI Sprint",
  engineering: "Engineering Sprint",
  design: "Design Sprint",
  startup: "Startup Sprint",
};

const STREAK_DOT_COLS = 13;
/** Dot diameter as a fraction of each grid cell — smaller fill (~45%) reads lighter vs grid; more air around each dot */
const STREAK_DOT_FILL = 0.45;
const STREAK_SPRING = { type: "spring" as const, stiffness: 400, damping: 40 };
const STREAK_STAGGER_IN_MS = 22;
const STREAK_STAGGER_IN_CAP = 0.32;
const STREAK_STAGGER_OUT_MS = 10;
const STREAK_STAGGER_OUT_CAP = 0.12;
const STREAK_EXIT_DURATION = 0.11;

function MG_LongestStreakModal({ onClose, longestStreak, streakPerCategory, topCategoryId }: {
  onClose: () => void;
  longestStreak: number;
  streakPerCategory: Record<string, number>;
  topCategoryId: string;
}) {
  const TOTAL_DOTS = 104;
  const dotActive = "var(--color-gray12)";
  const dotInactive = "var(--color-gray8)";

  const topFiveStreaks = React.useMemo(() => {
    const overallSprintLabel = STREAK_SPRINT_NAMES[topCategoryId] ?? "Learning Sprint";
    const rankOrder = ["overall", "ai", "engineering", "design", "startup"] as const;
    return [
      { id: "overall" as const, count: longestStreak, sprintLabel: overallSprintLabel },
      ...rankOrder.filter((id): id is Exclude<typeof id, "overall"> => id !== "overall").map((id) => ({
        id,
        count: streakPerCategory[id] ?? 0,
        sprintLabel: STREAK_SPRINT_NAMES[id] ?? id,
      })),
    ]
      .filter((row) => row.count > 0)
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return rankOrder.indexOf(a.id as (typeof rankOrder)[number]) - rankOrder.indexOf(b.id as (typeof rankOrder)[number]);
      })
      .slice(0, 5);
  }, [longestStreak, streakPerCategory, topCategoryId]);

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [streakRowHoveredId, setStreakRowHoveredId] = React.useState<string | null>(null);
  const effectiveId = selectedId ?? topFiveStreaks[0]?.id ?? null;
  const selected = topFiveStreaks.find((o) => o.id === effectiveId) ?? topFiveStreaks[0];

  const prevCountSnapRef = React.useRef<number | null>(null);
  const prevCount = prevCountSnapRef.current ?? 0;
  React.useLayoutEffect(() => {
    if (selected) prevCountSnapRef.current = selected.count;
  });

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", zIndex: 200 }}
      />
      <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 201, pointerEvents: "none" }}>
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.97, transition: { scale: MODAL_EXIT, y: MODAL_EXIT, opacity: { duration: 0.14, ease: "easeIn" } } }}
          transition={{ opacity: { duration: 0.18, ease: "easeOut" }, scale: MODAL_SPRING, y: MODAL_SPRING }}
          style={{ pointerEvents: "all" }}
        >
          <ElevatedSection style={{ backgroundColor: "var(--modal-bg)", borderRadius: 16, border: "1px solid var(--overlay-strong)", boxShadow: "0 0 0 1px var(--overlay-subtle), 0 40px 100px rgba(0,0,0,0.95)", width: 420, maxWidth: "90vw" }}>

            {/* Header — keyed count crossfade */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px 0" }}>
              <span className="select-none" style={{ fontSize: 9, color: "var(--text-secondary)", letterSpacing: "0.18em", textTransform: "uppercase", display: "flex", alignItems: "baseline", gap: 6, minHeight: 14, fontFamily: "'Geist Mono', ui-monospace, monospace" }}>
                <span>Longest streak —</span>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={`${effectiveId}-${selected?.count ?? 0}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -3 }}
                    transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {selected?.count ?? 0} days
                  </motion.span>
                </AnimatePresence>
              </span>
              <button
                onClick={onClose}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-faint)", fontSize: 18, lineHeight: 1, padding: "4px 6px", borderRadius: 4, transition: "color 0.15s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-faint)"; }}
              >×</button>
            </div>

            {/* 104 dots — fluid grid: full width between 24px rails (matches list); gap + dot scale together */}
            <div
              style={{
                padding: "16px 24px 4px",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${STREAK_DOT_COLS}, minmax(0, 1fr))`,
                  gap: "clamp(6px, 2.4%, 12px)",
                  width: "100%",
                  maxWidth: "100%",
                }}
              >
                {Array.from({ length: TOTAL_DOTS }).map((_, i) => {
                  const selCount = selected?.count ?? 0;
                  const isOn = i < selCount;
                  const wasOn = i < prevCount;
                  const expanding = selCount >= prevCount;
                  let delay = 0;
                  if (isOn !== wasOn) {
                    if (isOn) {
                      delay = Math.min(i * (STREAK_STAGGER_IN_MS / 1000), STREAK_STAGGER_IN_CAP);
                    } else if (!expanding) {
                      const tail = Math.max(0, prevCount - 1 - i);
                      delay = Math.min(tail * (STREAK_STAGGER_OUT_MS / 1000), STREAK_STAGGER_OUT_CAP);
                    }
                  }
                  const springIn = { ...STREAK_SPRING, delay };
                  const dotPct = `${STREAK_DOT_FILL * 100}%`;
                  return (
                    <div
                      key={i}
                      style={{
                        aspectRatio: "1",
                        minWidth: 0,
                        minHeight: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <motion.div
                        initial={false}
                        animate={{
                          backgroundColor: isOn ? dotActive : dotInactive,
                          scale: isOn ? 1 : 0.82,
                          opacity: isOn ? 1 : 0.45,
                        }}
                        transition={{
                          backgroundColor: {
                            duration: isOn ? 0.18 : STREAK_EXIT_DURATION,
                            ease: isOn ? [0.22, 1, 0.36, 1] : [0.4, 0, 1, 1],
                            delay,
                          },
                          scale: isOn ? springIn : { duration: STREAK_EXIT_DURATION, ease: [0.4, 0, 1, 1], delay },
                          opacity: isOn ? springIn : { duration: STREAK_EXIT_DURATION, ease: [0.4, 0, 1, 1], delay },
                        }}
                        style={{
                          width: dotPct,
                          height: dotPct,
                          maxWidth: "100%",
                          maxHeight: "100%",
                          borderRadius: "50%",
                          flexShrink: 0,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Streak options — list stagger on mount only */}
            <div style={{ padding: "0 24px 24px" }}>
              <div style={{ height: 1, backgroundColor: "var(--overlay-medium)", margin: "20px 0 16px" }} />
              <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: 10, fontFamily: "'Geist Mono', ui-monospace, monospace" }}>
                Top five streaks
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {topFiveStreaks.map((option, idx) => {
                  const isSelected = effectiveId === option.id;
                  // Same hover contract as CategoryBars (focus area): quiet lift + text step to gray11
                  const isHov = streakRowHoveredId === option.id && !isSelected;
                  const rowC = modalListRowTextColors(isSelected, isHov);
                  const dayLabel = option.count === 1 ? "1 day" : `${option.count} days`;
                  const rankNum = idx + 1;
                  const isFifth = idx === 4;
                  const rowBorder = isSelected
                    ? "var(--overlay-strong)"
                    : isHov
                      ? "var(--overlay-strong)"
                      : "var(--overlay-medium)";
                  // Hover: step between rest and full selected — slightly lighter than overlay-subtle (not darker)
                  const rowBg = isSelected
                    ? "var(--overlay-medium)"
                    : isHov
                      ? "color-mix(in srgb, var(--overlay-medium) 42%, var(--overlay-subtle))"
                      : "var(--overlay-subtle)";
                  return (
                    <motion.button
                      key={option.id}
                      type="button"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1], delay: idx * 0.05 }}
                      onClick={() => setSelectedId(option.id)}
                      onPointerEnter={() => setStreakRowHoveredId(option.id)}
                      onPointerLeave={() => setStreakRowHoveredId(null)}
                      style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                        borderRadius: 10, cursor: "pointer", width: "100%", textAlign: "left",
                        border: `1px solid ${rowBorder}`,
                        backgroundColor: rowBg,
                        transition: "background-color 0.2s ease, border-color 0.2s ease",
                        outline: "none",
                      }}
                    >
                      <span
                        className="font-mono select-none"
                        style={{
                          flexShrink: 0,
                          width: 34,
                          fontSize: isFifth ? 11 : 10,
                          fontWeight: isFifth ? 600 : 400,
                          letterSpacing: isFifth ? "0.06em" : "0.02em",
                          fontVariantNumeric: "tabular-nums",
                          color: rowC.rank,
                          opacity: isFifth ? (isSelected ? 1 : 0.95) : 1,
                          transition: "color 0.15s ease",
                        }}
                      >
                        #{rankNum}
                      </span>
                      <span className="font-mono" style={{ flex: 1, minWidth: 0, fontSize: 13, letterSpacing: "-0.01em", color: rowC.title, transition: "color 0.15s ease" }}>
                        {option.sprintLabel}
                      </span>
                      <span className="font-mono select-none" style={{ fontSize: 11, color: rowC.value, letterSpacing: "0.02em", flexShrink: 0, transition: "color 0.15s ease" }}>
                        {dayLabel}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

          </ElevatedSection>
        </motion.div>
      </div>
    </>
  );
}

// ─── ToolLoyalty components ───────────────────────────────────────────────────

function MG_ToolLoyaltyCard({ delay, onOpen, disabled = false }: { delay: number; onOpen: () => void; disabled?: boolean }) {
  const heroTool = MG_toolLoyaltyTimeline[0];
  return (
    <GridCard delay={delay} disabled={disabled} style={{ gridColumn: "2", gridRow: "2" }}>
      <div style={{ height: "100%", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 10, cursor: "pointer" }} onClick={onOpen}>
        <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace" }}>Tool loyalty</span>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 12 }}>
          <div>
            <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Early</span>
            <div style={{ marginTop: 5, height: 3, backgroundColor: "var(--overlay-subtle)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(heroTool.earlyN / MG_toolLoyaltyMax) * 100}%`, backgroundColor: "var(--overlay-strong)", borderRadius: 2 }} />
            </div>
          </div>
          <div>
            <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--color-orange)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Now</span>
            <div style={{ marginTop: 5, height: 3, backgroundColor: "var(--overlay-subtle)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(heroTool.recentN / MG_toolLoyaltyMax) * 100}%`, backgroundColor: "var(--color-orange)", borderRadius: 2 }} />
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span className="font-mono select-none" style={{ fontSize: 14, color: "var(--color-gray12)", letterSpacing: "-0.02em" }}>{heroTool.tool}</span>
          <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.02em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace" }}>{heroTool.earlyN} → {heroTool.recentN}</span>
        </div>
      </div>
    </GridCard>
  );
}

function MG_ToolLoyaltyModal({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = React.useState("Cursor");
  const EASE = "cubic-bezier(0.2,0,0,1)";
  const current = MG_toolLoyaltyTimeline.find((t) => t.tool === selected)!;

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18, ease: "easeOut" }} onClick={onClose} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", zIndex: 200 }} />
      <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 201, pointerEvents: "none" }}>
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 6 }} transition={MODAL_SPRING} style={{ pointerEvents: "auto" }}>
          <ElevatedSection onClick={(e) => e.stopPropagation()} style={{ backgroundColor: "var(--modal-bg)", border: "1px solid var(--overlay-strong)", borderRadius: 16, boxShadow: "0 0 0 1px var(--overlay-subtle), 0 40px 100px rgba(0,0,0,0.95)", padding: "28px 32px", width: 460, maxWidth: "90vw" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
            <span className="select-none" style={MODAL_TITLE_STYLE}>Tool loyalty</span>
            <button onClick={onClose} style={MODAL_CLOSE_BTN_STYLE}>×</button>
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 28, flexWrap: "wrap" }}>
            {MG_toolLoyaltyTimeline.map((t) => (
              <button key={t.tool} onClick={() => setSelected(t.tool)} className="font-mono" style={{ padding: "5px 12px", borderRadius: 6, fontSize: 10, cursor: "pointer", letterSpacing: "0.04em", border: `1px solid ${selected === t.tool ? "var(--color-orange)" : "var(--card-border-rest)"}`, background: selected === t.tool ? "rgba(233,95,56,0.08)" : "transparent", color: selected === t.tool ? "var(--color-orange)" : "var(--text-secondary)", transition: `all 0.12s ${EASE}` }}>{t.tool}</button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Early period</span>
                <span className="font-mono select-none" style={{ fontSize: 12, color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>{current.earlyN} searches</span>
              </div>
              <div style={{ height: 6, backgroundColor: "var(--overlay-subtle)", borderRadius: 3, overflow: "hidden" }}>
                <motion.div key={`early-${selected}`} initial={{ width: 0 }} animate={{ width: `${(current.earlyN / MG_toolLoyaltyMax) * 100}%` }} transition={{ duration: 0.4, ease: "easeOut" }} style={{ height: "100%", backgroundColor: "var(--overlay-strong)", borderRadius: 3 }} />
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--color-orange)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Recent period</span>
                <span className="font-mono select-none" style={{ fontSize: 12, color: "var(--color-orange)", fontVariantNumeric: "tabular-nums" }}>{current.recentN} searches</span>
              </div>
              <div style={{ height: 6, backgroundColor: "var(--overlay-subtle)", borderRadius: 3, overflow: "hidden" }}>
                <motion.div key={`recent-${selected}`} initial={{ width: 0 }} animate={{ width: `${(current.recentN / MG_toolLoyaltyMax) * 100}%` }} transition={{ duration: 0.4, ease: "easeOut" }} style={{ height: "100%", backgroundColor: "var(--color-orange)", borderRadius: 3 }} />
              </div>
            </div>
            <div style={{ borderTop: "1px solid var(--overlay-medium)", paddingTop: 16 }}>
              <span className="font-mono select-none" style={{ fontSize: 10, color: "var(--text-muted)", lineHeight: 1.6 }}>{current.note}</span>
            </div>
          </div>
          </ElevatedSection>
        </motion.div>
      </div>
    </>
  );
}

// Defined outside component — stable array reference prevents FilterBar's useLayoutEffect from re-running on every render
const FILTER_CATEGORIES = [
  { id: "all",         label: "All" },
  { id: "ai",          label: "AI" },
  { id: "personal",    label: "Personal" },
  { id: "engineering", label: "Engineering" },
  { id: "design",      label: "Design" },
];

// MainGridView is the only story that shows REAL data.
//
// • `stats` starts as DEFAULT_STATS (pre-built from your YouTube Takeout via
//   `npm run build-stats`) and is replaced when a visitor uploads their own zip.
//
// • Every card in this view must read from `stats` — no hardcoded values,
//   no MOCK_STATS imports.  Adding a new card?  The only question is:
//   "Is this field in YouTubeStats?"  If yes, read stats.fieldName.
//   If not, add it to computeStats() in lib/compute-stats.ts first.
//
// • When upload runs:  parseGoogleTakeout → filterToRelevant → computeStats
//   → setStats(newStats).  Every card updates automatically.
//
// Other stories (GridView, HoverTest, FullStoryView) use MOCK_STATS intentionally
// — they are layout/animation tests and are not the product view.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Pattern filter dropdown ──────────────────────────────────────────────────
const PATTERN_FILTER_OPTS = [
  { id: "ai",          label: "AI" },
  { id: "personal",    label: "Personal" },
  { id: "engineering", label: "Engineering" },
  { id: "design",      label: "Design" },
] as const;
const ALL_PATTERN_IDS = PATTERN_FILTER_OPTS.map((o) => o.id);

function PatternFilter({ active, onSave }: { active: Set<string>; onSave: (next: Set<string>) => void }) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<Set<string>>(new Set(active));
  const ref = React.useRef<HTMLDivElement>(null);

  // Sync draft when dropdown opens
  React.useEffect(() => { if (open) setDraft(new Set(active)); }, [open]);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  const filterCount = ALL_PATTERN_IDS.filter((id) => !active.has(id)).length;

  function toggle(id: string) {
    setDraft((prev) => {
      const next = new Set(prev);
      // keep at least one selected
      if (next.has(id) && next.size > 1) next.delete(id);
      else if (!next.has(id)) next.add(id);
      return next;
    });
  }

  function save() { onSave(new Set(draft)); setOpen(false); }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Trigger — same pill style as ViewToggle */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="font-mono"
        style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          // overlay-medium when active/open so it reads as "engaged"
          backgroundColor: open || filterCount > 0 ? "var(--overlay-medium)" : "var(--overlay-subtle)",
          border: `1px solid ${open ? "var(--overlay-strong)" : "var(--overlay-medium)"}`,
          borderRadius: 8, padding: "5px 10px",
          fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase",
          color: filterCount > 0 ? "var(--color-gray12)" : "var(--color-gray8)",
          cursor: "pointer", transition: "all 0.15s",
        }}
      >
        {/* Funnel icon */}
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
          <line x1="1" y1="1.5" x2="9" y2="1.5"/>
          <line x1="2.5" y1="4" x2="7.5" y2="4"/>
          <line x1="4" y1="6.5" x2="6" y2="6.5"/>
        </svg>
        Filter
        {filterCount > 0 && (
          <span style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 14, height: 14, borderRadius: "50%",
            backgroundColor: "var(--color-orange)", color: "#fff",
            fontSize: 8, fontWeight: 700, letterSpacing: 0, flexShrink: 0,
          }}>
            {filterCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -4, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.12, ease: "easeOut" }}
          style={{
            position: "absolute", top: "calc(100% + 6px)", right: 0,
            backgroundColor: "var(--modal-bg)",
            border: "1px solid var(--overlay-strong)",
            borderRadius: 10,
            // lighter shadow than full modals — this is a contextual popover
            boxShadow: "0 0 0 1px var(--overlay-subtle), 0 12px 32px rgba(0,0,0,0.4)",
            width: 180, overflow: "hidden", zIndex: 50,
          }}
        >
          <div style={{ padding: "10px 0 0" }}>
            <span className="font-mono" style={{ display: "block", padding: "0 12px 8px", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-faint)" }}>
              Show categories
            </span>
            {PATTERN_FILTER_OPTS.map(({ id, label }) => {
              const checked = draft.has(id);
              return (
                <button
                  key={id}
                  onClick={() => toggle(id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    width: "100%", padding: "8px 12px",
                    background: "none", border: "none", cursor: "pointer", transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--overlay-subtle)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
                >
                  {/* Checkbox */}
                  <div style={{
                    width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                    border: `1px solid ${checked ? "var(--color-orange)" : "var(--overlay-strong)"}`,
                    backgroundColor: checked ? "var(--color-orange)" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.1s",
                  }}>
                    {checked && (
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="1,3 3,5 7,1"/>
                      </svg>
                    )}
                  </div>
                  <span className="font-mono" style={{ fontSize: 10, color: checked ? "var(--text-primary)" : "var(--text-secondary)", letterSpacing: "0.04em" }}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
          <div style={{ height: 1, backgroundColor: "var(--overlay-medium)", margin: "8px 0 0" }} />
          <div style={{ padding: "8px 10px" }}>
            <button
              onClick={save}
              className="font-mono"
              style={{
                width: "100%", padding: "7px 0", borderRadius: 6, border: "none",
                backgroundColor: "var(--text-primary)", color: "var(--bg-primary)",
                fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Save
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function MainGridView({ ginnMode = false, accentColor = "#E95F38" }: { ginnMode?: boolean; accentColor?: string } = {}) {
  const [stats, setStats] = React.useState<YouTubeStats>(DEFAULT_STATS);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = React.useState<string | null>(null);
  const [showShare, setShowShare]               = React.useState(false);
  const [showUploadModal, setShowUploadModal]   = React.useState(false);
  const [morphOpen, setMorphOpen]               = React.useState(false);
  const [searchesOpen, setSearchesOpen]         = React.useState(false);
  const [builderEnergyOpen, setBuilderEnergyOpen] = React.useState(false);
  const [restDayOpen, setRestDayOpen]             = React.useState(false);
  const [growthTickerModalOpen, setGrowthTickerModalOpen] = React.useState(false);
  const [toolLoyaltyOpen, setToolLoyaltyOpen]     = React.useState(false);
  const [longestStreakOpen, setLongestStreakOpen]  = React.useState(false);
  const [topChannelPicksOpen, setTopChannelPicksOpen] = React.useState(false);
  const [subscriptionsOpen, setSubscriptionsOpen]     = React.useState(false);
  const [lateNightOpen, setLateNightOpen]             = React.useState(false);
  const [lateNightPersona, setLateNightPersona]       = React.useState(0);
  const isTouchDevice = useMediaQuery("(hover: none)");
  const [enjHovered, setEnjHovered]                   = React.useState(false);
  const [enjCursorFraction, setEnjCursorFraction]     = React.useState<number | null>(null);
  const [enjModalOpen, setEnjModalOpen]               = React.useState(false);
  // default to top category by watch percentage, not hardcoded "ai"
  const [selectedCategoryId, setSelected] = React.useState<string>(
    () => stats.categoryBreakdown[0]?.id ?? "ai"
  );
  // when a new upload arrives, reset selection to the new top category
  React.useEffect(() => {
    setSelected(stats.categoryBreakdown[0]?.id ?? "ai");
  }, [stats]);
  // activeCategory: drives FilterBar + card opacity; separate from selectedCategoryId (which drives ParticleMorph)
  const [activeCategory, setActiveCategory] = React.useState<string>("all");
  // patternFilter: multi-select for the Patterns grid filter dropdown (all visible by default)
  const [patternFilter, setPatternFilter] = React.useState<Set<string>>(new Set(ALL_PATTERN_IDS));
  const isCategoryDisabled = (cat: string) => !patternFilter.has(cat);
  // focusShape: virtual index 0-3 into FOCUS_ALLOWED_SHAPES (sphere/cube/torus/play)
  const [focusShape, setFocusShape]             = React.useState(0);
  const [shapeDropOpen, setShapeDropOpen]       = React.useState(false);

  // Close dropdown on any outside click
  React.useEffect(() => {
    if (!shapeDropOpen) return;
    const close = () => setShapeDropOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [shapeDropOpen]);

  // ── Derived stats for new cards ────────────────────────────────────────────
  const longestStreak = React.useMemo(() => {
    let longest = 0, current = 0;
    for (const b of stats.dailyBuckets) {
      if (b.count > 0) { current++; longest = Math.max(longest, current); }
      else current = 0;
    }
    return longest;
  }, [stats.dailyBuckets]);

  // Map top category → sprint label shown on the Longest Streak card
  const sprintLabel = React.useMemo(() => {
    const SPRINT_NAMES: Record<string, string> = {
      ai:          "AI Sprint",
      engineering: "Engineering Sprint",
      design:      "Design Sprint",
      startup:     "Startup Sprint",
    };
    return SPRINT_NAMES[stats.topCategory.id] ?? "Learning Sprint";
  }, [stats.topCategory.id]);

  const daysActiveData = React.useMemo(() => {
    const active = stats.dailyBuckets.filter(b => b.count > 0).length;
    const total = stats.dailyBuckets.length;
    return { pct: Math.round(active / total * 100), active, total };
  }, [stats.dailyBuckets]);
  const daysActivePct = daysActiveData.pct;

  const { dowAvgMain, quietDayMain } = React.useMemo(() => {
    const totals = [0,0,0,0,0,0,0], counts = [0,0,0,0,0,0,0];
    for (const b of stats.dailyBuckets) {
      const dow = new Date(b.date + "T12:00:00").getDay();
      totals[dow] += b.count; counts[dow]++;
    }
    const NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const avgs = NAMES.map((name, i) => ({ name, avg: counts[i] ? totals[i] / counts[i] : 0 }));
    return { dowAvgMain: avgs, quietDayMain: avgs.reduce((a, b) => a.avg <= b.avg ? a : b) };
  }, [stats.dailyBuckets]);

  const peakMonthMain = React.useMemo(() => {
    const monthMap = new Map<string, number>();
    for (const b of stats.dailyBuckets) { const m = b.date.slice(0, 7); monthMap.set(m, (monthMap.get(m) ?? 0) + b.count); }
    let bestMonth = "", bestTotal = 0;
    for (const [m, total] of monthMap) { if (total > bestTotal) { bestTotal = total; bestMonth = m; } }
    const d = new Date(bestMonth + "-01");
    const days = stats.dailyBuckets.filter(b => b.date.startsWith(bestMonth));
    const dayMap = new Map(days.map(b => [parseInt(b.date.slice(8), 10), b.count]));
    return {
      fullName:   d.toLocaleDateString("en-US", { month: "long" }),
      year:       d.getFullYear(),
      firstDow:   d.getDay(),
      daysInMonth: new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(),
      dayMap,
      dayMax:     Math.max(...days.map(b => b.count), 1),
    };
  }, [stats.dailyBuckets]);

  // ── Top channel derived values ─────────────────────────────────────────────
  const mgTopChannel = stats.topChannels[0];
  const mgTopChannelKind = React.useMemo<SpecialTopChannelKind | null>(
    () => getSpecialTopChannelKind(mgTopChannel.name),
    [mgTopChannel.name],
  );
  const mgTopChannelPicks = React.useMemo(
    () => getTopVideosForChannel(mgTopChannel.name, 5),
    [mgTopChannel.name],
  );
  const mgTopChannelPicksForModal = React.useMemo(
    () => mgTopChannelPicks.map(({ title, url }) => ({ title, url })),
    [mgTopChannelPicks],
  );
  const mgTopChannelUrl = React.useMemo(
    () => getChannelUrlForChannel(mgTopChannel.name),
    [mgTopChannel.name],
  );
  // all channels are interactive — special ones get a branded hero, unknowns get generic modal
  const mgTopChannelInteractive = true;
  const mgTopChannelHeroSrc: string | null =
    mgTopChannelKind === "dive"   ? TOP_CHANNEL_MODAL_HERO_VIDEO :
    mgTopChannelKind === "howiai" ? "./media/how-i-ai-modal-hero.mov" :
    null; // null = generic variant (subscribe pill + picks, no video)

  // ── Bento layout state ─────────────────────────────────────────────────────
  const BGAP = 12; // grid gap in px

  // colSplit: fraction of total column space for the left 2 columns (morph side)
  const [colSplit, setColSplit] = React.useState(0.5);
  // colAH: heights for col 3 rows 0 and 1 — the 3rd cell auto-fills remaining height
  const [colAH, setColAH] = React.useState([200, 200]);
  // colBH: heights for col 4 rows 0 and 1 — the 3rd cell auto-fills remaining height
  const [colBH, setColBH] = React.useState([200, 200]);
  const MIN_COL = 0.35; const MAX_COL = 0.60; // morph width constraints
  const MIN_RH  = 120;  const MAX_RH  = 320;  // per-cell height constraints
  const MIN_BH  = 180;  const MAX_BH  = 380;  // bottom row height constraints

  // Measure actual grid container width so pixel column widths stay correct
  const gridRef      = React.useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = React.useState(1020);
  React.useEffect(() => {
    if (!gridRef.current) return;
    const obs = new ResizeObserver(([e]) => setContainerW(e.contentRect.width));
    obs.observe(gridRef.current);
    return () => obs.disconnect();
  }, []);

  // Derived column widths from colSplit fraction
  const totalColSpace = containerW - 3 * BGAP;
  const leftColW      = (totalColSpace * colSplit) / 2;       // each left column
  const rightColW     = (totalColSpace * (1 - colSplit)) / 2; // each right column

  // Top section height: max of both columns' explicit rows + 200px floor for the last cell
  // 200 matches the default → section starts at 3×200 + 2×gap = 624px
  const LAST_ROW_MIN = 200;
  const topSectionH = Math.max(
    colAH[0] + BGAP + colAH[1],
    colBH[0] + BGAP + colBH[1],
  ) + BGAP + LAST_ROW_MIN;

  // Derived last-cell heights — grow to fill when rows above shrink, always touch the domain row
  // (GridCard splits style props: grid* → outer div, rest → inner div. Explicit px avoids the issue
  //  where flex:1 would land on the inner motion.div instead of the outer flex item.)
  const colALastH = topSectionH - colAH[0] - BGAP - colAH[1] - BGAP;
  const colBLastH = topSectionH - colBH[0] - BGAP - colBH[1] - BGAP;

  // Outer-grid handle positions (relative to grid container)
  const vertHandleX  = leftColW * 2 + BGAP;                        // gap between col 2 and col 3

  // ── Bottom section — two independent mini-grids ─────────────────────────────
  const botGridRef = React.useRef<HTMLDivElement>(null);
  const [containerBotW, setContainerBotW] = React.useState(1020);
  React.useEffect(() => {
    if (!botGridRef.current) return;
    const obs = new ResizeObserver(([e]) => setContainerBotW(e.contentRect.width));
    obs.observe(botGridRef.current);
    return () => obs.disconnect();
  }, []);

  // Group split: fraction of total bottom width for left group
  const [groupSplit, setGroupSplit]         = React.useState(0.5);
  const [colSplitLeft, setColSplitLeft]     = React.useState(0.5);
  const [colSplitRight, setColSplitRight]   = React.useState(0.5);
  const [leftRowH, setLeftRowH]             = React.useState([200, 260, 180]);
  const [rightRowH, setRightRowH]           = React.useState([200, 200, 240]);

  const MIN_GRP = 0.28; const MAX_GRP = 0.72;
  const MIN_BOT_COL = 0.25; const MAX_BOT_COL = 0.75;

  const leftGroupW  = Math.floor((containerBotW - BGAP) * groupSplit);
  const rightGroupW = containerBotW - BGAP - leftGroupW;
  const leftColA    = Math.floor((leftGroupW  - BGAP) * colSplitLeft);
  const leftColB    = leftGroupW  - BGAP - leftColA;
  const rightColA   = Math.floor((rightGroupW - BGAP) * colSplitRight);
  const rightColB   = rightGroupW - BGAP - rightColA;
  const centerHandleX = leftGroupW; // position of center handle

  // Sync bottom edges — both groups share the same total height so their
  // bottom edges always align regardless of independent row resizing.
  const leftTotal      = leftRowH[0]  + BGAP + leftRowH[1]  + BGAP + leftRowH[2];
  const rightTotal     = rightRowH[0] + BGAP + rightRowH[1] + BGAP + rightRowH[2];
  const sharedBotH     = Math.max(leftTotal, rightTotal);
  const leftLastRowH   = sharedBotH - leftRowH[0]  - BGAP - leftRowH[1]  - BGAP;
  const rightLastRowH  = sharedBotH - rightRowH[0] - BGAP - rightRowH[1] - BGAP;

  // ── Streak dot auto-scaling ─────────────────────────────────────────────────
  const [dotSize, setDotSize] = React.useState(3);
  const dotContainerRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!dotContainerRef.current) return;
    const total = longestStreak + 10;
    const gap = 10;
    const obs = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      let lo = 3, hi = 4, best = 3;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        const perRow = Math.floor((width + gap) / (mid + gap));
        if (perRow > 0 && Math.ceil(total / perRow) * (mid + gap) - gap <= height) {
          best = mid; lo = mid + 1;
        } else { hi = mid - 1; }
      }
      setDotSize(best);
    });
    obs.observe(dotContainerRef.current);
    return () => obs.disconnect();
  }, [longestStreak]);

  const card01Shape = CATEGORY_SHAPE[selectedCategoryId] ?? PLAY_SHAPE_INDEX;

  const total       = stats.categoryBreakdown.reduce((s, c) => s + c.count, 0);
  const recalculated = stats.categoryBreakdown
    .filter((c) => c.count > 0)
    .map((c) => ({ ...c, percentage: (c.count / total) * 100 }));

  const domainData = recalculated
    .filter(c => ['ai', 'design', 'engineering', 'startup'].includes(c.id))
    .map(c => ({ id: c.id, label: c.label, pct: c.percentage }));

  const isDark = useIsDark();
  // Light mode: dark particles on light canvas — active is near-black, dim is mid-gray (readable but clearly secondary)
  const particleBg     = isDark ? "#000000" : "#D2D2D2";
  const particleActive = isDark ? "#ffffff" : "#1A1A1A";
  const particleDim    = isDark ? "#333333" : "#A0A0A0";

  const actualShapeIndex = FOCUS_ALLOWED_SHAPES[focusShape] ?? 0;

  const focusColorMap = React.useMemo(
    () => buildFocusColorMap(domainData, selectedCategoryId, particleActive, particleDim, actualShapeIndex),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stats, selectedCategoryId, isDark, actualShapeIndex],
  );

  async function handleUpload(file: File) {
    setUploading(true);
    setUploadError(null);

    try {
      const { parseTakeout } = await import('@/lib/parse-takeout');
      const { filterToRelevant, filterRapidFire, computeStats } = await import('@/lib/compute-stats');

      const parsed = await parseTakeout(file, (p) => {
        setUploadProgress(`${p.stage} · ${p.count.toLocaleString()} entries`);
      });
      if (parsed.watchHistory.length === 0) {
        throw new Error('No watch history found in this zip.');
      }

      const filtered = filterRapidFire(filterToRelevant(parsed.watchHistory));
      if (filtered.length === 0) {
        throw new Error('No AI, design, engineering, or startup content found in your watch history. This dashboard is built for builders — it may not match your YouTube usage.');
      }

      // Hardcoded window: Jan 1 2025 – Mar 15 2026
      const clampStart = new Date("2025-01-01T00:00:00.000Z");
      const clampEnd   = new Date("2026-03-15T23:59:59.999Z");
      const clamped = filtered.filter(e => e.timestamp >= clampStart && e.timestamp <= clampEnd);
      if (clamped.length === 0) {
        throw new Error(`No activity found in the expected date range (${clampStart.toLocaleDateString()} – ${clampEnd.toLocaleDateString()}). Your data may be from a different time period.`);
      }
      const clampedSearches = parsed.searchHistory.filter(
        s => new Date(s.timestamp) >= clampStart && new Date(s.timestamp) <= clampEnd
      );

      const newStats = computeStats(clamped, clampedSearches, parsed.subscriptions);
      setStats(newStats);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed.';
      setUploadError(msg);
      throw err; // re-throw so the modal can stay open on failure
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  }

  return (
    <>
      <PageCTABar
        onShare={() => setShowShare(true)}
        onUpload={() => setShowUploadModal(true)}
      />

      <div style={{ backgroundColor: "var(--bg-primary)", minHeight: "100vh", color: "var(--color-gray12)" }}>

        {/* ── 00 HERO ── */}
        <section style={{ padding: "80px 40px 72px", maxWidth: PAGE_MAX_W, margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, filter: "blur(4px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {ginnMode && (
              <p
                className="font-mono"
                style={{ fontSize: 13, color: "var(--text-faint)", lineHeight: 1.6, maxWidth: 560, margin: "0 0 64px 0" }}
              >
                <span style={{ fontWeight: 600, color: "var(--color-gray12)" }}>Youtube University</span>
                {" — "}
                The best way to demonstrate curiosity is showing how you invest your free time. Self-driven late-night tinkering,
                multi-day rabbit holes, independent learning — none of it shows up on a resume.
                It shows up on your algorithm. This project visualizes that.
              </p>
            )}
            <div className="mg-hero-stats" style={{ display: "flex", gap: 56, alignItems: "flex-start" }}>
              <Odometer value={stats.totalVideos}   label="videos"   animationDelay={0}   variant={ginnMode ? "mechanical" : "cased"} />
              <Odometer value={stats.totalDays}     label="days"     animationDelay={100} variant={ginnMode ? "mechanical" : "cased"} />
              <Odometer value={stats.totalSearches} label="searches" animationDelay={200} variant={ginnMode ? "mechanical" : "cased"} />
            </div>
          </motion.div>
        </section>

        {/* ── 01 RHYTHM ── */}
        <section style={{ maxWidth: PAGE_MAX_W, margin: "0 auto", padding: PAGE_PAD }}>
          <RhythmCard stats={stats} accentColor={accentColor} />
        </section>

        {/* ── GRID ── */}
        <section style={{ maxWidth: PAGE_MAX_W, margin: "0 auto", padding: "32px 40px 80px" }}>
          <span className="font-mono text-[13px] text-gray11 select-none" style={{ display: "block", marginBottom: 20 }}>
            Patterns
          </span>
          <div
            ref={gridRef}
            className="mg-outer-grid"
            style={{
              position: "relative", // anchor for absolutely-positioned resize handles
              display: "grid",
              // explicit pixel columns driven by colSplit state
              gridTemplateColumns: `${leftColW}px ${leftColW}px ${rightColW}px ${rightColW}px`,
              // 3 rows: top section · domain breakdown · bottom nested grid
              gridTemplateRows: `${topSectionH}px 200px auto`,
              gap: BGAP,
            }}
          >
            {/* 01 + 06 — Unified morph + category selector */}
            <GridCard
              delay={0}
              disableScale
              disableSound
              className="mg-morph-card"
              onClick={() => setMorphOpen(true)}
              style={{ gridColumn: "1 / 3", gridRow: "1", display: "flex", flexDirection: "column", backgroundColor: "var(--bg-primary)" }}
            >
              <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
                <div style={{ position: "absolute", inset: 0 }}>
                  <ParticleMorph
                    shape={focusShape}
                    hideControls
                    cursorDispersion
                    disableScroll
                    particleColor={particleActive}
                    backgroundColor={particleBg}
                    particleColorMap={focusColorMap}
                    shapeSequence={[...FOCUS_ALLOWED_SHAPES]}
                  />
                </div>
                <div style={{ position: "absolute", top: 18, left: 20, right: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace" }}>Focus area</span>
                  <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
                    {/* Trigger — pill styled like modal buttons + chevron */}
                    <button
                      onClick={() => setShapeDropOpen(o => !o)}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        background: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)",
                        color: isDark ? "rgba(255,255,255,0.95)" : "rgba(0,0,0,0.92)",
                        border: isDark ? "1px solid rgba(255,255,255,0.25)" : "1px solid rgba(0,0,0,0.18)",
                        borderRadius: 20,
                        padding: "5px 12px 5px 14px",
                        cursor: "pointer",
                        fontSize: 11,
                        letterSpacing: "0.06em",
                        fontFamily: "var(--font-mono, monospace)",
                        transition: "background 0.18s ease",
                      }}
                    >
                      {FOCUS_ALLOWED_LABELS[actualShapeIndex] ?? "SPHERE"}
                      <svg width="7" height="5" viewBox="0 0 7 5" fill="none"
                        style={{ flexShrink: 0, opacity: 0.7, transform: shapeDropOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.18s ease" }}
                      >
                        <path d="M1 1L3.5 3.5L6 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    {shapeDropOpen && (
                      <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "var(--modal-bg)", border: "1px solid var(--overlay-medium)", borderRadius: 6, overflow: "hidden", zIndex: 50, minWidth: 90, boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
                        {FOCUS_ALLOWED_SHAPES.map((shapeIdx, virtualIdx) => {
                          const label = FOCUS_ALLOWED_LABELS[shapeIdx] ?? SHAPE_NAMES[shapeIdx];
                          const isActive = virtualIdx === focusShape;
                          return (
                            <button key={shapeIdx} onClick={() => { setFocusShape(virtualIdx); setShapeDropOpen(false); }}
                              style={{ display: "block", width: "100%", textAlign: "left", padding: "7px 12px", background: isActive ? "var(--overlay-subtle)" : "none", border: "none", cursor: "pointer", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "var(--font-mono, monospace)", color: isActive ? "var(--text-primary)" : "var(--text-faint)", transition: "background 0.1s" }}
                              onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "var(--overlay-subtle)"; }}
                              onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
                            >{label}</button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ height: 1, backgroundColor: "var(--overlay-medium)", flexShrink: 0 }} />
              <div
                style={{ padding: "12px 20px 20px", flexShrink: 0, backgroundColor: "var(--bg-primary)" }}
                onClick={(e) => e.stopPropagation()}
              >
                <CategoryBars
                  categories={recalculated}
                  title=""
                  selectedId={selectedCategoryId}
                  onSelect={setSelected}
                />
              </div>
            </GridCard>

            {/* Right side: two INDEPENDENT flex columns — each has its own per-cell heights */}
            {/* CSS grid rows are global (shared), so we escape into flex to get independent sizing */}
            <div className="mg-right-section" style={{ gridColumn: "3 / 5", gridRow: "1", display: "flex", gap: BGAP }}>

              {/* ── Column A (col 3): Peak hour · Single-day · Top category ── */}
              {/* position: relative anchors the absolute resize handles below */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: BGAP, position: "relative" }}>

                <GridCard delay={0.07} category="personal" disabled={isCategoryDisabled("personal")} style={{ height: colAH[0], flexShrink: 0 }}>
                  <div style={{ height: "100%", padding: "20px 22px", display: "flex", flexDirection: "column" }}>
                    <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace" }}>Daily habit</span>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="font-mono select-none" style={{ fontSize: 28, color: "var(--color-gray12)", lineHeight: 1, opacity: 0.6 }}>~</span>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                        <span className="font-mono select-none" style={{ fontSize: 44, color: "var(--color-gray12)", letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                          {splitHoursMinutes(stats.avgHoursPerDay).h}
                        </span>
                        <span className="font-mono select-none" style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: "0.05em" }}>H</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                        <span className="font-mono select-none" style={{ fontSize: 44, color: "var(--color-gray12)", letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                          {String(splitHoursMinutes(stats.avgHoursPerDay).m).padStart(2, "0")}
                        </span>
                        <span className="font-mono select-none" style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: "0.05em" }}>M</span>
                      </div>
                    </div>
                    <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.02em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace" }}>Avg daily</span>
                  </div>
                </GridCard>

                {/* Row handle: bottom of Peak hour ↔ top of Single-day — col A only */}
                <BentoResizeHandle
                  direction="row"
                  style={{ left: 0, top: colAH[0], width: "100%", height: BGAP }}
                  onDelta={delta => setColAH(prev => [Math.max(MIN_RH, Math.min(MAX_RH, prev[0] + delta)), prev[1], prev[2]])}
                />

                <GridCard delay={0.17} category="personal" disabled={isCategoryDisabled("personal")} style={{ height: colAH[1], flexShrink: 0 }}>
                  <div style={{ height: "100%", padding: "20px 22px", display: "flex", flexDirection: "column" }}>
                    <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace" }}>Days active</span>
                    <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                        <span className="font-mono select-none" style={{ fontSize: 44, color: "var(--color-gray12)", letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                          {daysActiveData.active}
                        </span>
                        <span className="font-mono select-none" style={{ fontSize: 13, color: "var(--color-gray9)", letterSpacing: "-0.02em" }}>
                          / {daysActiveData.total}
                        </span>
                      </div>
                    </div>
                    <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace" }}>{daysActivePct}% spent learning</span>
                  </div>
                </GridCard>

                {/* Row handle: bottom of Days Active ↔ top of Single-day — col A only */}
                <BentoResizeHandle
                  direction="row"
                  style={{ left: 0, top: colAH[0] + BGAP + colAH[1], width: "100%", height: BGAP }}
                  onDelta={delta => setColAH(prev => [prev[0], Math.max(MIN_RH, Math.min(MAX_RH, prev[1] + delta)), prev[2]])}
                />

                <GridCard delay={0.27} category="personal" disabled={isCategoryDisabled("personal")} className="ginn-small" style={{ height: colALastH, flexShrink: 0 }} overlayBefore={ginnMode ? <GinnSmallCardSVG positions={['top-right', 'bottom-right']} offset={32} /> : undefined}>
                  <div style={{ height: "100%", padding: "20px 22px", display: "flex", flexDirection: "column" }}>
                    <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace" }}>After midnight</span>
                    <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
                      <span className="font-mono select-none" style={{ fontSize: 44, color: "var(--color-gray12)", letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                        {Math.round(stats.nightOwlPercent)}%
                      </span>
                    </div>
                    <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.02em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace" }}>12AM – 5AM</span>
                  </div>
                </GridCard>
              </div>

              {/* ── Column B (col 4): Peak hour · After midnight · Top searches ── */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: BGAP, position: "relative" }}>

                <GridCard delay={0.12} category="ai" disabled={isCategoryDisabled("ai")} style={{ height: colBH[0], flexShrink: 0 }}>
                  <div style={{ height: "100%", padding: "20px 22px", display: "flex", flexDirection: "column" }}>
                    <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace" }}>Top category</span>
                    <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
                      <span className="font-mono select-none" style={{ fontSize: 36, color: "var(--color-gray12)", letterSpacing: "-0.03em", lineHeight: 1 }}>
                        {stats.topCategory.label
                          .replace("AI & Machine Learning", "AI")
                          .replace("Engineering & Dev", "Eng & Dev")
                          .replace("Design & Creative", "Design")
                          .replace("Startups & Business", "Startups")
                          .replace("Culture & Entertainment", "Culture")
                          .replace("Finance & Investing", "Finance")
                          .replace("Fitness & Sport", "Fitness")}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "7px 10px", borderRadius: 6, backgroundColor: "var(--overlay-subtle)", border: "1px solid var(--overlay-medium)" }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-gray12)", flexShrink: 0 }}>
                        <polygon points="12 2 22 8.5 12 15 2 8.5" />
                        <polyline points="6 11.5 6 17.5 12 21 18 17.5 18 11.5" />
                      </svg>
                      <span className="select-none" style={{ fontSize: 9, color: "var(--color-gray12)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace" }}>
                        {Math.round(recalculated.find(c => c.id === stats.topCategory.id)?.percentage ?? stats.topCategory.percentage)}% of learning
                      </span>
                    </div>
                  </div>
                </GridCard>

                {/* Row handle: bottom of Peak hour ↔ top of After midnight — col B only */}
                <BentoResizeHandle
                  direction="row"
                  style={{ left: 0, top: colBH[0], width: "100%", height: BGAP }}
                  onDelta={delta => setColBH(prev => [Math.max(MIN_RH, Math.min(MAX_RH, prev[0] + delta)), prev[1], prev[2]])}
                />

                <GridCard delay={0.22} category="personal" disabled={isCategoryDisabled("personal")} style={{ height: colBH[1], flexShrink: 0 }}>
                  <div style={{ height: "100%", padding: "20px 22px", display: "flex", flexDirection: "column" }}>
                    <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace" }}>Single-day record</span>
                    <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                        <span className="font-mono select-none" style={{ fontSize: 44, color: "var(--color-gray12)", letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                          {stats.bingeSessions[0]?.count ?? 0}
                        </span>
                        <span className="font-mono select-none" style={{ fontSize: 13, color: "var(--color-gray9)", letterSpacing: "-0.02em" }}>/ videos</span>
                      </div>
                    </div>
                  </div>
                </GridCard>

                {/* Row handle: bottom of After midnight ↔ top of Top searches — col B only */}
                <BentoResizeHandle
                  direction="row"
                  style={{ left: 0, top: colBH[0] + BGAP + colBH[1], width: "100%", height: BGAP }}
                  onDelta={delta => setColBH(prev => [prev[0], Math.max(MIN_RH, Math.min(MAX_RH, prev[1] + delta)), prev[2]])}
                />

                <GridCard delay={0.32} category="personal" disabled={isCategoryDisabled("personal")} style={{ height: colBLastH, flexShrink: 0 }}>
                  <div style={{ height: "100%", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 10, cursor: "pointer" }} onClick={() => setLongestStreakOpen(true)}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace" }}>Longest Streak</span>
                      <StreakPillMain count={longestStreak} />
                    </div>
                    <div ref={dotContainerRef} style={{ flex: 1, minHeight: 0, display: "flex", flexWrap: "wrap", alignContent: "flex-start", gap: 10, overflow: "hidden" }}>
                      {Array.from({ length: longestStreak + 10 }).map((_, i) => (
                        <div key={i} style={{ width: dotSize, height: dotSize, borderRadius: "50%", flexShrink: 0, backgroundColor: i < longestStreak ? "var(--color-gray12)" : "var(--overlay-subtle)" }} />
                      ))}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "7px 10px", borderRadius: 6, backgroundColor: "var(--overlay-subtle)", border: "1px solid var(--overlay-medium)" }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-gray12)", flexShrink: 0 }}>
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                      </svg>
                      <span className="select-none" style={{ fontSize: 9, color: "var(--color-gray12)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace" }}>{sprintLabel}</span>
                    </div>
                  </div>
                </GridCard>
              </div>
            </div>

            {/* Design Engineer Progress — full-width card */}
            <GridCard
              delay={0.37}
              category="ai"
              className="mg-enj-card"
              disabled={isCategoryDisabled("ai")}
              disableSound
              style={{ gridColumn: "1 / 5", gridRow: "2" }}
            >
              <div
                style={{ height: "100%", padding: "20px 22px", display: "flex", flexDirection: "column", cursor: "pointer" }}
                onMouseEnter={() => setEnjHovered(true)}
                onMouseLeave={() => setEnjHovered(false)}
                onClick={() => setEnjModalOpen(true)}
              >
                {/* Header row: label top-left + % pill top-right — matches all other grid cards */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span
                    className="select-none"
                    style={{
                      fontSize: 9,
                      color: (isTouchDevice || enjHovered) ? "var(--text-secondary)" : "var(--text-faint)",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      transition: "color 0.15s ease",
                      fontFamily: "'Geist Mono', ui-monospace, monospace",
                    }}
                  >
                    Design Engineer Progress
                  </span>
                  {/* Stats pill — mirrors the line graph pill style */}
                  <EnjStatsPill
                    score={computeDesignEngineerScore(stats)}
                    total={22}
                    cursorFraction={enjCursorFraction}
                    morph={isTouchDevice || enjCursorFraction != null}
                  />
                </div>

                <div style={{ height: 8 }} />
                {/* Ruler — flex:1 fills remaining height, vertically centered */}
                <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
                  <EnjProgress
                    progress={computeDesignEngineerScore(stats) / 100}
                    hovered={isTouchDevice || enjHovered}
                    hideLabel
                    showFooter
                    glass={DEFAULT_GLASS}
                    onCursorFraction={setEnjCursorFraction}
                  />
                </div>
              </div>
            </GridCard>

            {/* Bottom section — two independent mini-grids */}
            <div className="mg-bottom-section" style={{ gridColumn: "1 / 5", gridRow: "3", position: "relative" }}>
              <div
                ref={botGridRef}
                style={{ display: "flex", gap: BGAP, position: "relative", alignItems: "flex-start" }}
              >
                {/* ── LEFT GROUP: Streak · Month · Late Night Learning ── */}
                <div className="mg-bot-left" style={{ position: "relative", width: leftGroupW, flexShrink: 0 }}>
                  <div className="mg-bot-left-grid" style={{ display: "grid", gridTemplateColumns: `${leftColA}px ${leftColB}px`, gridTemplateRows: `${leftRowH[0]}px ${leftRowH[1]}px ${leftLastRowH}px`, gap: BGAP, position: "relative" }}>

                    {/* #1 Channel */}
                    <GridCard delay={0.62} category="personal" disabled={isCategoryDisabled("personal")} className="ginn-small" style={{ gridColumn: "1", gridRow: "1" }} overlayBefore={ginnMode ? <GinnSmallCardSVG positions={['bottom-left']} /> : undefined}>
                      <TopChannelCardInner
                        name={mgTopChannel.name}
                        count={mgTopChannel.count}
                        kind={mgTopChannelKind}
                        interactive={mgTopChannelInteractive}
                        onOpen={mgTopChannelInteractive ? () => setTopChannelPicksOpen(true) : undefined}
                      />
                    </GridCard>

                    {/* Subscriptions */}
                    <GridCard delay={0.67} category="personal" disabled={isCategoryDisabled("personal")} className="ginn-small" forceHover={subscriptionsOpen} style={{ gridColumn: "2", gridRow: "1" }} overlayBefore={ginnMode ? <GinnSmallCardSVG positions={['top-right']} /> : undefined}>
                      <SubscriptionsCardInner onOpen={() => setSubscriptionsOpen(true)} stats={stats} />
                    </GridCard>

                    {/* Late Night Learning video */}
                    <GridCard delay={0.47} category="personal" disabled={isCategoryDisabled("personal")} forceHover={lateNightOpen} onClick={() => setLateNightOpen(true)} style={{ gridColumn: "1 / 3", gridRow: "2", overflow: "hidden", cursor: "pointer" }}>

                      <div style={{ position: "relative", height: "100%", overflow: "hidden" }}>
                        <video
                          key={lateNightPersona}
                          src={LATE_NIGHT_PERSONAS[lateNightPersona].videoSrc}
                          loop muted playsInline
                          onMouseEnter={e => (e.currentTarget as HTMLVideoElement).play()}
                          onMouseLeave={e => { const v = e.currentTarget as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", cursor: "pointer" }}
                        />
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 50%)", pointerEvents: "none" }} />
                        <span className="select-none" style={{ position: "absolute", bottom: 14, left: 16, fontSize: 9, color: "rgba(255,255,255,0.55)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace" }}>
                          Late night learning
                        </span>
                      </div>
                    </GridCard>

                    {/* Builder Energy — full width, row 3 */}
                    <GridCard delay={0.57} category="engineering" disabled={isCategoryDisabled("engineering")} style={{ gridColumn: "1 / 3", gridRow: "3" }}>
                      <BuilderEnergy stats={stats} animationDelay={300} variant="bare" hideStats onOpen={() => setBuilderEnergyOpen(true)} />
                    </GridCard>

                    {/* Left col handle — between col A and col B */}
                    <BentoResizeHandle
                      direction="col"
                      className="mg-handle-col"
                      style={{ left: leftColA, top: 0, width: BGAP, height: leftRowH[0] }}
                      onDelta={delta => setColSplitLeft(s => Math.max(MIN_BOT_COL, Math.min(MAX_BOT_COL, s + delta / (leftGroupW - BGAP))))}
                    />
                    {/* Left row handle — between row 1 and row 2 */}
                    <BentoResizeHandle
                      direction="row"
                      style={{ left: 0, top: leftRowH[0], width: leftGroupW, height: BGAP }}
                      onDelta={delta => setLeftRowH(prev => {
                        const next = [...prev];
                        next[0] = Math.max(MIN_BH, Math.min(MAX_BH, next[0] + delta));
                        next[1] = Math.max(MIN_BH, Math.min(MAX_BH, next[1] - delta));
                        return next;
                      })}
                    />
                    {/* Left row handle — between row 2 and row 3 */}
                    <BentoResizeHandle
                      direction="row"
                      style={{ left: 0, top: leftRowH[0] + BGAP + leftRowH[1], width: leftGroupW, height: BGAP }}
                      onDelta={delta => setLeftRowH(prev => {
                        const next = [...prev];
                        next[1] = Math.max(MIN_BH, Math.min(MAX_BH, next[1] + delta));
                        next[2] = Math.max(MIN_BH, Math.min(MAX_BH, next[2] - delta));
                        return next;
                      })}
                    />
                  </div>
                </div>

                {/* ── RIGHT GROUP: Top Searches · Rest Day · Career Tuner · Peak Hour ── */}
                <div className="mg-bot-right" style={{ position: "relative", width: rightGroupW, flexShrink: 0 }}>
                  <div className="mg-bot-right-grid" style={{ display: "grid", gridTemplateColumns: `${rightColA}px ${rightColB}px`, gridTemplateRows: `${rightRowH[0]}px ${rightRowH[1]}px ${rightLastRowH}px`, gap: BGAP, position: "relative" }}>

                    {/* Top Searches — full width, row 1 */}
                    <GridCard delay={0.42} category="ai" disabled={isCategoryDisabled("ai")} onClick={() => setSearchesOpen(true)} style={{ gridColumn: "1 / 3", gridRow: "1" }}>
                      <div style={{ height: "100%", padding: "20px 22px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                        <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14, fontFamily: "'Geist Mono', ui-monospace, monospace" }}>
                          Top searches
                        </span>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", pointerEvents: "none" }}>
                          <TypewriterSearchBar terms={stats.featuredSearchTerms} />
                        </div>
                      </div>
                    </GridCard>

                    {/* Your Rest Day — col 1, row 3 */}
                    <GridCard delay={0.72} category="personal" disabled={isCategoryDisabled("personal")} className="ginn-small" style={{ gridColumn: "1", gridRow: "3" }} overlayBefore={ginnMode ? <GinnSmallCardSVG positions={['top-right', 'bottom-right']} offset={32} /> : undefined}>
                      <div style={{ height: "100%", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 10, cursor: "pointer" }} onClick={() => setRestDayOpen(true)}>
                        <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace" }}>Your rest day</span>
                        {/* paddingTop: shrinks the chart's available height so % bars compute against the smaller space */}
                        <div style={{ flex: 1, display: "flex", alignItems: "flex-end", paddingTop: 28 }}>
                          <MG_RestDayBarChart dowAvg={dowAvgMain} quietDay={quietDayMain} barWidth={22} />
                        </div>
                      </div>
                    </GridCard>

                    {/* Most Intense Month — col 2, row 2 */}
                    <GridCard delay={0.77} category="personal" disabled={isCategoryDisabled("personal")} className="ginn-small" style={{ gridColumn: "2", gridRow: "2" }} overlayBefore={ginnMode ? <GinnSmallCardSVG positions={['top-right', 'bottom-right']} offset={32} /> : undefined}>
                      <div style={{ height: "100%", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 10 }}>
                        <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace" }}>Most intense month</span>
                        <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gridAutoRows: "1fr", gap: 3 }}>
                          {Array.from({ length: peakMonthMain.firstDow }).map((_, i) => <div key={`e${i}`} />)}
                          {Array.from({ length: peakMonthMain.daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const count = peakMonthMain.dayMap.get(day) ?? 0;
                            const intensity = count / peakMonthMain.dayMax;
                            const isHot = intensity > 0.75;
                            const dowIndex = (peakMonthMain.firstDow + i) % 7;
                            const DOW_LABELS = ["S","M","T","W","T","F","S"];
                            return (
                              <div key={day} style={{ borderRadius: 3, backgroundColor: isHot ? `${accentColor}${Math.round((0.4 + intensity * 0.5) * 255).toString(16).padStart(2, "0")}` : "var(--overlay-subtle)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {!isHot && <span className="font-mono select-none" style={{ fontSize: 6, color: "var(--text-faint)", lineHeight: 1, opacity: 0.6 }}>{DOW_LABELS[dowIndex]}</span>}
                              </div>
                            );
                          })}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "7px 10px", borderRadius: 6, backgroundColor: "var(--overlay-subtle)", border: "1px solid var(--overlay-medium)" }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-gray12)", flexShrink: 0 }}>
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          <span className="select-none" style={{ fontSize: 9, color: "var(--color-gray12)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace" }}>{peakMonthMain.fullName} {peakMonthMain.year}</span>
                        </div>
                      </div>
                    </GridCard>

                    {/* Tool usage over time (growth ticker) — col 1, row 2 */}
                    {/* Growth Ticker: timeline is computed from stats.toolJourney (built from search history).
                        Falls back to static toolLoyaltyTimeline if not provided. */}
                    <GridCard delay={0.62} category="personal" disabled={isCategoryDisabled("personal")} style={{ gridColumn: "1", gridRow: "2" }} forceHover={growthTickerModalOpen}>
                      <GrowthTickerInteractive onModalOpenChange={setGrowthTickerModalOpen} timeline={stats.toolJourney} />
                    </GridCard>

                    {/* Peak Hour — col 2, row 3 */}
                    <GridCard delay={0.67} category="personal" disabled={isCategoryDisabled("personal")} className="ginn-small" style={{ gridColumn: "2", gridRow: "3" }} overlayBefore={ginnMode ? <GinnSmallCardSVG positions={[]} /> : undefined}>
                      <div style={{ height: "100%", padding: "20px 22px", display: "flex", flexDirection: "column" }}>
                        <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace" }}>Peak hour</span>
                        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
                          <span className="font-mono select-none" style={{ fontSize: 44, color: "var(--color-gray12)", letterSpacing: "-0.04em", lineHeight: 1 }}>
                            {formatHour(stats.topHour)}
                          </span>
                        </div>
                        <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.02em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace" }}>
                          {stats.hourBuckets.find(h => h.hour === stats.topHour)?.percentage.toFixed(1) ?? "—"}% of total
                        </span>
                      </div>
                    </GridCard>

                    {/* Right col handle — between col A and col B, only for row 2 */}
                    <BentoResizeHandle
                      direction="col"
                      className="mg-handle-col"
                      style={{ left: rightColA, top: rightRowH[0] + BGAP, width: BGAP, height: rightRowH[1] }}
                      onDelta={delta => setColSplitRight(s => Math.max(MIN_BOT_COL, Math.min(MAX_BOT_COL, s + delta / (rightGroupW - BGAP))))}
                    />
                    {/* Right row handle 1 — between row 1 and row 2 */}
                    <BentoResizeHandle
                      direction="row"
                      style={{ left: 0, top: rightRowH[0], width: rightGroupW, height: BGAP }}
                      onDelta={delta => setRightRowH(prev => {
                        const next = [...prev];
                        next[0] = Math.max(MIN_BH, Math.min(MAX_BH, next[0] + delta));
                        next[1] = Math.max(MIN_BH, Math.min(MAX_BH, next[1] - delta));
                        return next;
                      })}
                    />
                    {/* Right row handle 2 — between row 2 and row 3 */}
                    <BentoResizeHandle
                      direction="row"
                      style={{ left: 0, top: rightRowH[0] + BGAP + rightRowH[1], width: rightGroupW, height: BGAP }}
                      onDelta={delta => setRightRowH(prev => {
                        const next = [...prev];
                        next[1] = Math.max(MIN_BH, Math.min(MAX_BH, next[1] + delta));
                        next[2] = Math.max(MIN_BH, Math.min(MAX_BH, next[2] - delta));
                        return next;
                      })}
                    />
                  </div>
                </div>

                {/* Center handle — splits left group vs right group */}
                <BentoResizeHandle
                  direction="col"
                  className="mg-handle-col"
                  style={{ left: centerHandleX, top: 0, width: BGAP, height: Math.max(leftRowH[0] + BGAP + leftRowH[1], rightRowH[0] + BGAP + rightRowH[1] + BGAP + rightRowH[2]) }}
                  onDelta={delta => setGroupSplit(s => Math.max(MIN_GRP, Math.min(MAX_GRP, s + delta / containerBotW)))}
                />
              </div>
            </div>

            {/* ── Outer bento handles — absolutely positioned over the outer grid gaps ── */}
            {/* Per-column row handles live INSIDE the nested right container above */}

            {/* Vertical handle: between morph (cols 1-2) and right section (cols 3-4) — top rows */}
            <BentoResizeHandle
              direction="col"
              className="mg-handle-col"
              style={{ left: vertHandleX, top: 0, width: BGAP, height: topSectionH }}
              onDelta={delta => setColSplit(s => Math.max(MIN_COL, Math.min(MAX_COL, s + delta / totalColSpace)))}
            />
          </div>
        </section>

        <PageFooter />
      </div>

      <AnimatePresence>
        {showShare          && <ShareModal    onClose={() => setShowShare(false)}  stats={stats} />}
        {morphOpen          && <MorphExplorer onClose={() => setMorphOpen(false)} initialShape={actualShapeIndex} allowedShapes={FOCUS_ALLOWED_SHAPES} categories={domainData} selectedCategoryId={selectedCategoryId} onSelectCategory={setSelected} particleActive={particleActive} particleDim={particleDim} />}
        {searchesOpen       && <TopSearchesExplorer onClose={() => setSearchesOpen(false)} terms={stats.featuredSearchTerms} />}
        {builderEnergyOpen  && <BuilderEnergyExplorer onClose={() => setBuilderEnergyOpen(false)} stats={stats} />}
        {restDayOpen        && <MG_RestDayModal onClose={() => setRestDayOpen(false)} dowAvg={dowAvgMain} quietDay={quietDayMain} />}
        {toolLoyaltyOpen    && <MG_ToolLoyaltyModal onClose={() => setToolLoyaltyOpen(false)} />}
        {topChannelPicksOpen && (
          <TopChannelPicksModal
            onClose={() => setTopChannelPicksOpen(false)}
            channelName={mgTopChannel.name}
            channelUrl={mgTopChannelUrl}
            picks={mgTopChannelPicksForModal}
            heroSrc={mgTopChannelHeroSrc}
          />
        )}
        {longestStreakOpen  && <MG_LongestStreakModal onClose={() => setLongestStreakOpen(false)} longestStreak={longestStreak} streakPerCategory={stats.longestStreakPerCategory} topCategoryId={stats.topCategory.id} />}
        {subscriptionsOpen  && <SubscriptionsModal onClose={() => setSubscriptionsOpen(false)} stats={stats} />}
        {lateNightOpen      && <LateNightLearningModal onClose={() => setLateNightOpen(false)} activePersona={lateNightPersona} onPersonaChange={setLateNightPersona} />}
        {enjModalOpen       && <ChecklistModal1 progress={computeDesignEngineerScore(stats) / 100} onClose={() => setEnjModalOpen(false)} />}
        {showUploadModal    && (
          <UploadModal
            onClose={() => { setShowUploadModal(false); setUploadError(null); }}
            onUpload={async (file) => {
              await handleUpload(file);
              // modal closes itself after the 6s spinner — don't close here
            }}
            uploading={uploading}
            uploadError={uploadError}
            uploadProgress={uploadProgress}
          />
        )}
      </AnimatePresence>

      {/* FilterBar: position:fixed — DOM position doesn't affect layout */}
      {false && ginnMode && (
        <FilterBar
          categories={FILTER_CATEGORIES}
          activeId={activeCategory}
          onSelect={setActiveCategory}
        />
      )}
    </>
  );
}


// ─── Main Grid Ginn Test ──────────────────────────────────────────────────────
// Applies the Jin Su Park / Ginn card aesthetic to the main grid for evaluation.
//
// What changes vs MainGrid:
//   - Page bg: #0d0c0b (warmer, darker)
//   - Border-radius: 4px (from 10px) — tighter, more hardware-like
//   - Shadow: full metallic stack (specular rim + bottom depth + lift + outline)
//   - Border: slightly brighter base, bigger hover jump
//   - Left-edge notch: ::before pseudo-element on every card
//   - Top-left catch-light gradient: ::after on every card
//   - Clip-path scale animation: disabled (Ginn cards are static)
//   - Text palette: dimmer at rest, matching GinnCard proportions
//
// No hover text treatment, no modals — visual direction only.
//
export function MainGridGinnView({ orangeColor = "#E14920" }: { orangeColor?: string } = {}) {
  return (
    <>
      <style>{`

        /* ─── Page shell ────────────────────────────────────────────────── */
        .mg-ginn-test {
          --accent: ${orangeColor};
          --bg-primary: #0d0c0b;
          --bg-surface: #191614;
          --card-surface-bg: linear-gradient(175deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 55%), #191614;

          /* Ruler tick colors */
          --tick-major-rest:     rgba(220, 214, 208, 0.70);
          --tick-major-hover:    rgba(220, 214, 208, 0.90);
          --tick-major-disabled: rgba(220, 214, 208, 0.15);
          --tick-minor-rest:     rgba(107, 101, 96, 0.70);
          --tick-minor-hover:    rgba(107, 101, 96, 0.88);
          --tick-minor-disabled: rgba(107, 101, 96, 0.12);

          /* Card border colors */
          --card-border-rest:  rgba(255,255,255,0.09);
          --card-border-hover: rgba(255,255,255,0.18);

          /* Metallic shadow stack — specular rim + bottom depth + outer lift + outline glow */
          --card-shadow-rest:
            inset 0 1px 0 rgba(255,255,255,0.10),
            inset 0 -2px 5px rgba(0,0,0,0.55),
            0 2px 8px rgba(0,0,0,0.55),
            0 0 0 0.5px rgba(255,255,255,0.04);
          --card-shadow-hover-inner:
            inset 0 1px 0 rgba(255,255,255,0.18),
            inset 0 -2px 5px rgba(0,0,0,0.60),
            0 4px 14px rgba(0,0,0,0.70),
            0 0 0 0.5px rgba(255,255,255,0.08);

          /* Hover bg lift */
          --card-bg-hover: #252321;

          /* Ginn text palette — dimmer at rest than our default */
          --color-gray12:   rgba(220,214,208,0.78);
          --text-secondary: rgba(255,255,255,0.46);
          --text-muted:     rgba(255,255,255,0.38);
          --text-faint:     rgba(255,255,255,0.26);
        }

        /* ─── Clip-path: disabled ───────────────────────────────────────── */
        /* Ginn cards are static — no expand-on-hover animation */
        /* Scale-up hover disabled for Ginn cards */
        .mg-ginn-test .mg-card {
          clip-path: none !important;
        }

        /* Suppress content-shift padding — not needed with transform scale */
        .mg-ginn-test .mg-card-shift {
          padding: 0 !important;
          transition: none !important;
        }

        /* ─── Card visual layer ─────────────────────────────────────────── */
        /* Gradient baked into background — frees ::after for small-card rivet */
        .mg-ginn-test .mg-card-inner {
          border-radius: 4px !important;
          background:
            linear-gradient(175deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 55%),
            #191614 !important;
          position: relative;
          transition: border-color 0.15s ease, box-shadow 0.22s ease !important;
        }

        /* Left-edge notch — the hardware tell */
        .mg-ginn-test .mg-card-inner::before {
          content: '';
          position: absolute;
          left: 0;
          top: 14px;
          width: 2px;
          height: 28px;
          border-radius: 0 2px 2px 0;
          background-color: rgba(255,255,255,0.10);
          pointer-events: none;
          z-index: 2;
          transition: background-color 0.18s ease, border-color 0.18s ease;
        }

        /* ─── Hover: notch brightens ────────────────────────────────────── */
        .mg-ginn-test .mg-card:hover .mg-card-inner::before,
        .mg-ginn-test .mg-card--active .mg-card-inner::before {
          background-color: rgba(255,255,255,0.65);
        }

        /* ─── Small cards: SVG background + border ──────────────────────────── */
        /* CSS border lives in the BORDER AREA (outside the padding edge).
           overflow:hidden clips at the padding edge — children can NEVER cover the CSS border.
           Solution: kill CSS border + background with !important, draw BOTH via SVG path.
           The SVG path fill = card background, SVG stroke = card border.
           Notch arcs are SVG A commands — a TRUE continuous single-weight stroke. */
        /* ginn-small: SVG defines the full card shape — remove the outer clip-path.
           inset(2px round 10px) was clipping y=0 to y=2 off the top of the card,
           which disconnected the top notch arc from the card edge (arc became a floating curve).
           With clip-path removed, both top and bottom notch arcs are fully visible. */
        .mg-ginn-test .ginn-small.mg-card {
          clip-path: none !important;
        }

        /* SVG is now outside mg-card-inner (via overlayBefore prop on GridCard).
           Only need to suppress mg-card-inner's own background/border so the SVG shows through. */
        .mg-ginn-test .ginn-small .mg-card-inner {
          border: none !important;
          background: transparent !important;
          box-shadow: none !important;
        }

        /* SVG default: fill:none prevents the black SVG default from showing in non-Ginn stories */
        .ginn-card-path {
          fill: none;
          stroke: none;
        }

        /* SVG path inside Ginn test: fill = card bg, stroke = card border */
        .mg-ginn-test .ginn-card-path {
          fill: var(--bg-surface);
          stroke: var(--card-border-rest);
          stroke-width: 1;
          transition: fill 0.2s cubic-bezier(0.2,0,0,1), stroke 0.12s cubic-bezier(0.2,0,0,1);
        }

        /* Hover: fill + stroke brighten, matching the rest of the card system */
        .mg-ginn-test .ginn-small.mg-card:hover .ginn-card-path {
          fill: var(--card-bg-hover);
          stroke: var(--card-border-hover);
        }

        /* ::before on small cards: left-edge notch — same as all Ginn cards, no override */

        /* rivet indicator removed */

        /* ─── Hover: text brightening (same system as MainGridHoverTest) ── */
        .mg-ginn-test .mg-card span { transition: color 0.24s ease; }
        .mg-ginn-test .mg-card div  { transition: background-color 0.20s ease; }

        /* ─── Dark mode overrides ───────────────────────────────────────── */
        [data-theme="dark"] .mg-ginn-test {
          --color-orange: ${orangeColor};
        }
        [data-theme="dark"] .mg-ginn-test .mg-card:hover,
        [data-theme="dark"] .mg-ginn-test .mg-card--active {
          --color-orange:   ${orangeColor};
          --color-gray12:   rgba(255,255,255,1.0);
          --color-gray11:   rgba(255,255,255,0.85);
          --color-gray8:    rgba(255,255,255,0.76);
          --text-secondary: rgba(255,255,255,0.88);
          --text-muted:     rgba(255,255,255,0.82);
          --text-faint:     rgba(255,255,255,0.70);
          --overlay-subtle: rgba(255,255,255,0.09);
          --overlay-medium: rgba(255,255,255,0.14);
          --overlay-strong: rgba(255,255,255,0.28);
        }

        /* ─── Light mode overrides ──────────────────────────────────────── */
        [data-theme="light"] .mg-ginn-test {
          --bg-primary: #EBEBEB;
          --bg-surface: #D9D9D9;
          --card-surface-bg: linear-gradient(175deg, rgba(255,255,255,0.55) 0%, rgba(0,0,0,0) 55%), #D9D9D9;

          /* Glass pill — more opaque orange on light to avoid washing out */
          --pill-orange-tint: 0.78;

          /* Ruler tick colors — dark on light surface, orange accent for active majors */
          --tick-major-rest:     rgba(29, 27, 26, 0.70);
          --tick-major-hover:    rgba(29, 27, 26, 0.90);
          --tick-major-disabled: rgba(0, 0, 0, 0.12);
          --tick-minor-rest:     rgba(0, 0, 0, 0.30);
          --tick-minor-hover:    rgba(0, 0, 0, 0.50);
          --tick-minor-disabled: rgba(0, 0, 0, 0.08);

          --card-border-rest:  rgba(0,0,0,0.18);
          --card-border-hover: rgba(0,0,0,0.30);
          /* Lighter shadow stack — high-touch lift, no metallic drama */
          --card-shadow-rest:
            inset 0 0.5px 0 rgba(255,255,255,0.55),
            inset 0 -2px 5px rgba(0,0,0,0.08),
            0 1px 4px rgba(0,0,0,0.07),
            0 0 0 0.5px rgba(0,0,0,0.04);
          --card-shadow-hover-inner:
            inset 0 0.5px 0 rgba(255,255,255,0.70),
            inset 0 -2px 5px rgba(0,0,0,0.10),
            0 2px 8px rgba(0,0,0,0.10),
            0 0 0 0.5px rgba(0,0,0,0.06);
          --card-bg-hover: #CECECE;
          /* Text palette (same conventions as MainGridHoverTest light) */
          --color-orange:   ${orangeColor};
          --color-gray12:   rgba(0,0,0,0.71);
          --color-gray11:   rgba(0,0,0,0.59);
          --color-gray8:    rgba(0,0,0,0.49);
          --text-secondary: rgba(0,0,0,0.62);
          --text-muted:     rgba(0,0,0,0.52);
          --text-faint:     rgba(0,0,0,0.44);
        }
        /* Light mode card body — same gradient system as RhythmCard */
        [data-theme="light"] .mg-ginn-test .mg-card-inner {
          background: var(--card-surface-bg) !important;
        }
        /* Light mode hover — lift the surface visibly like dark mode does */
        [data-theme="light"] .mg-ginn-test .mg-card:hover .mg-card-inner,
        [data-theme="light"] .mg-ginn-test .mg-card--active .mg-card-inner {
          background: linear-gradient(175deg, rgba(255,255,255,0.70) 0%, rgba(0,0,0,0) 55%), #D2D2D2 !important;
        }
        /* Notch cards: SVG is the sole visual — card-inner must stay transparent */
        [data-theme="light"] .mg-ginn-test .ginn-small .mg-card-inner,
        [data-theme="light"] .mg-ginn-test .ginn-small.mg-card:hover .mg-card-inner,
        [data-theme="light"] .mg-ginn-test .ginn-small.mg-card--active .mg-card-inner {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
        /* Light mode notch: dark instead of white */
        [data-theme="light"] .mg-ginn-test .mg-card-inner::before {
          background-color: rgba(0,0,0,0.12);
        }
        [data-theme="light"] .mg-ginn-test .mg-card:hover .mg-card-inner::before {
          background-color: rgba(0,0,0,0.45);
        }
        /* Light mode SVG: gradient fill matches regular card surface */
        [data-theme="light"] .mg-ginn-test .ginn-card-path {
          fill: url(#ginn-card-grad);
          stroke-width: 1.5;
        }
        [data-theme="light"] .mg-ginn-test .ginn-small.mg-card:hover .ginn-card-path {
          fill: url(#ginn-card-grad-hover);
        }
        [data-theme="light"] .mg-ginn-test .mg-card:hover,
        [data-theme="light"] .mg-ginn-test .mg-card--active {
          --color-orange:   ${orangeColor};
          --color-gray12:   rgba(0,0,0,1.0);
          --color-gray11:   rgba(0,0,0,0.88);
          --color-gray8:    rgba(0,0,0,0.78);
          --text-secondary: rgba(0,0,0,0.90);
          --text-muted:     rgba(0,0,0,0.82);
          --text-faint:     rgba(0,0,0,0.70);
        }

        /* short labels hidden by default — only shown via mobile media query below */
        .big-stat-label-short { display: none; }

        /* ─── Tablet (640px – 1023px) ───────────────────────────────────── */
        /* Layout stays 4-column (ResizeObserver already adapts pixel widths).
           Only reduce side padding so the grid gets more breathing room. */
        @media (max-width: 1023px) {
          .mg-ginn-test section {
            padding-left: 24px !important;
            padding-right: 24px !important;
          }
        }

        /* ─── Mobile (< 640px) ───────────────────────────────────────────── */
        @media (max-width: 639px) {

          /* ── Section padding: tighter sides + shorter hero top/bottom */
          .mg-ginn-test section {
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
          .mg-ginn-test section:first-of-type {
            padding-top: 40px !important;
            padding-bottom: 36px !important;
          }

          /* ── Hero odometers: horizontal scroll instead of wrapping */
          .mg-ginn-test .mg-hero-stats {
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            scrollbar-width: none !important;
          }
          .mg-ginn-test .mg-hero-stats::-webkit-scrollbar { display: none !important; }

          /* ── Outer patterns grid → single flex column (overrides inline display:grid) */
          .mg-ginn-test .mg-outer-grid {
            display: flex !important;
            flex-direction: column !important;
          }

          /* ── Morph card: explicit height since ParticleMorph needs a sized parent */
          .mg-ginn-test .mg-morph-card {
            height: 480px !important;
            min-height: unset !important;
          }

          /* ── Right section (stat columns): stay 2-col side by side */
          .mg-ginn-test .mg-right-section {
            flex-direction: row !important;
          }
          .mg-ginn-test .mg-right-section > div {
            flex: 1 !important;
            min-width: 0 !important;
          }

          /* ── Stat cards: fixed height replaces JS-driven pixel heights */
          .mg-ginn-test .mg-right-section .mg-card-inner {
            height: 150px !important;
          }

          /* ── EnjProgress card: enough room for the ruler visualization */
          .mg-ginn-test .mg-enj-card .mg-card-inner {
            height: 200px !important;
          }

          /* ── Bottom section: stack left group above right group */
          .mg-ginn-test .mg-bottom-section > div {
            flex-direction: column !important;
          }
          .mg-ginn-test .mg-bot-left,
          .mg-ginn-test .mg-bot-right {
            width: 100% !important;
          }

          /* ── Sub-grids: fluid 2-column, auto-height rows */
          .mg-ginn-test .mg-bot-left-grid,
          .mg-ginn-test .mg-bot-right-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            grid-template-rows: 160px 224px 180px !important;
            width: 100% !important;
          }

          /* ── Hide column (width) handles — row (height) handles stay */
          .mg-handle-col {
            display: none !important;
          }

          /* ── Heatmap: scroll horizontally at natural cell size instead of shrinking */
          /* overflow-x: auto !important overrides the inline overflow: hidden for the x-axis only */
          .rhythm-heatmap-wrap {
            overflow-x: auto !important;
            scrollbar-width: none !important;
          }
          .rhythm-heatmap-wrap::-webkit-scrollbar {
            display: none !important;
          }
          /* min-width keeps the heatmap at ~natural cell size so ResizeObserver sees full width */
          .rhythm-heatmap-inner {
            min-width: 880px !important;
          }
          /* swap full label for short label on mobile */
          .big-stat-label-full { display: none !important; }
          .big-stat-label-short { display: inline !important; }

          /* tighten horizontal padding so all three cells share space equally */
          .big-stat-cell { padding-left: 16px !important; padding-right: 16px !important; }
        }

      `}</style>
      <div className="mg-ginn-test">
        <MainGridView ginnMode accentColor={orangeColor} />
      </div>
    </>
  );
}

export const Visualization: Story = {
  name: "Visualization",
  render: () => <MainGridGinnView orangeColor="#E14920" />,
};

// ─── Polished Grid Mono ───────────────────────────────────────────────────────
//
// All type switched to Geist Mono via two CSS variables:
//   --font-mono:  covers every className="font-mono" element (labels, stats, UI chrome)
//   --digit-font: covers odometer drum digits and separator (hardcoded inline style)
//
// Audit of inline fontFamily in polished grid components:
//   odometer.tsx        digits/separator → var(--digit-font) ✓
//   odometer.tsx        labels/sublabels → var(--font-mono)  ✓
//   growth-ticker.tsx   all className    → font-mono CSS     ✓
//   builder-energy.tsx  all className    → font-mono CSS     ✓
//   youtube-line-graph  all className    → font-mono CSS     ✓
//   contribution-heatmap all className   → font-mono CSS     ✓
//   FullStory labels    all className    → font-mono CSS     ✓
//   time-dial.tsx       SVG fontFamily   → NOT in polished grid
//   profile-card.tsx    inline monospace → NOT in polished grid
//
function MainGridGinnMonoView({ orangeColor = "#E14920" }: { orangeColor?: string } = {}) {
  return (
    <div className="mg-ginn-mono">
      <style>{`
        /* ── Geist Mono: font-mono className override ── */
        .mg-ginn-mono .font-mono,
        .mg-ginn-mono [class*="font-mono"] {
          font-family: 'Geist Mono', ui-monospace, monospace !important;
        }

        /* ── font-mono text: lock to regular weight (override any bold inheritance) ── */
        .mg-ginn-mono .font-mono,
        .mg-ginn-mono [class*="font-mono"] {
          font-weight: 300;
        }

        /* ── CSS variables: picked up by inline var() usages ── */
        .mg-ginn-mono {
          /* font-mono: used by odometer labels, share card, career tuner */
          --font-mono: 'Geist Mono', ui-monospace, monospace;
          /* digit-font: used by odometer drum digits and separator */
          --digit-font: 'Geist Mono', ui-monospace, monospace;
          /* digit-weight: 400=regular, 500=medium, 600=semibold, 700=bold, 800=extrabold */
          --digit-weight: 600;
        }
      `}</style>
      <MainGridGinnView orangeColor={orangeColor} />
    </div>
  );
}

// ─── Info pages — each is its own story, navigated via linkTo ─────────────────
export const InfoStory: Story = {
  name: "Info",
  render: () => <InfoPageView />,
};

export const FAQStory: Story = {
  name: "FAQ",
  render: () => <FAQPageView />,
};

export const HowWeCalculateStory: Story = {
  name: "How We Calculate",
  render: () => <MethodologyPageView />,
};

export const InterviewAgentsStory: Story = {
  name: "Interview Agents",
  render: () => <InterviewAgentsView />,
};

// ─── Hover test: inner-shadow / outline variant ──────────────────────────────
//
// Design philosophy: Cards have quiet volume at rest — they're never flat.
// Hover intensifies what's already there rather than toggling states on/off.
//
// Shadow stack (each layer represents a real light interaction):
//   1. Specular top edge — light catching the rim (like glass)
//   2. Diffuse inner highlight — soft top-lighting
//   3. Grounding shadow — bottom inner shadow for depth
//   4. Luminous ring — tight outer glow (Kargul technique: light-colored, negative spread)
//   5. Outline expansion — 0.5px outer ring for boundary definition
//
// Transition timing is staggered: border fastest (instant feedback),
// background medium, shadows slowest (they carry visual weight).

function InnerShadowCard({
  children,
  style,
  delay = 0,
}: {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  delay?: number;
}) {
  const [hovered, setHovered] = React.useState(false);

  // Separate grid-placement props (must live on the clip wrapper) from visual styles
  const gridProps: React.CSSProperties = {};
  const cardStyle: React.CSSProperties = {};
  if (style) {
    for (const [key, value] of Object.entries(style)) {
      if (key.startsWith("grid")) {
        (gridProps as Record<string, unknown>)[key] = value;
      } else {
        (cardStyle as Record<string, unknown>)[key] = value;
      }
    }
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...gridProps,
        // Clip-path reveal: card appears slightly smaller at rest, reveals full size on hover
        clipPath: hovered
          ? "inset(0px round 10px)"
          : "inset(2px round 10px)",
        transition: "clip-path 0.32s cubic-bezier(0.2,0,0,1)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: "easeOut", delay }}
        style={{
          position: "relative",
          height: "100%",
          borderRadius: 10,
          border: `1px solid ${hovered ? "var(--card-border-hover)" : "var(--card-border-rest)"}`,
          backgroundColor: hovered ? "var(--card-bg-hover)" : "var(--overlay-subtle)",
          boxShadow: hovered ? "var(--card-shadow-hover-inner)" : "var(--card-shadow-rest)",
          overflow: "hidden",
          transition: [
            "border-color 0.12s cubic-bezier(0.2,0,0,1)",
            "background-color 0.2s cubic-bezier(0.2,0,0,1)",
            "box-shadow 0.28s cubic-bezier(0.2,0,0,1)",
          ].join(", "),
          ...cardStyle,
        }}
      >
        {/* Content shift wrapper — padding shrinks on hover so titles track the expanding clip edge */}
        <div
          style={{
            height: "100%",
            padding: hovered ? 0 : 2,
            transition: "padding 0.32s cubic-bezier(0.2,0,0,1)",
          }}
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
}

export function HoverTestView() {
  const stats = MOCK_STATS;

  return (
    <div
      style={{
        backgroundColor: "var(--bg-primary)",
        minHeight: "100vh",
        padding: "40px",
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gridAutoRows: "200px",
        gap: 12,
        maxWidth: 560,
        margin: "0 auto",
      }}
    >
      {/* Peak hour */}
      <InnerShadowCard delay={0} style={{ gridColumn: "1", gridRow: "1" }}>
        <div style={{ height: "100%", padding: "20px 22px", display: "flex", flexDirection: "column" }}>
          <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace" }}>
            Peak hour
          </span>
          <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <span className="font-mono select-none" style={{ fontSize: 44, color: "var(--color-gray12)", letterSpacing: "-0.04em", lineHeight: 1 }}>
              {formatHour(stats.topHour)}
            </span>
          </div>
        </div>
      </InnerShadowCard>

      {/* After midnight */}
      <InnerShadowCard delay={0.07} style={{ gridColumn: "2", gridRow: "1" }}>
        <div style={{ height: "100%", padding: "20px 22px", display: "flex", flexDirection: "column" }}>
          <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace" }}>
            After midnight
          </span>
          <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <span className="font-mono select-none" style={{ fontSize: 44, color: "var(--color-gray12)", letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
              {Math.round(stats.nightOwlPercent)}%
            </span>
          </div>
        </div>
      </InnerShadowCard>

      {/* Single-day record */}
      <InnerShadowCard delay={0.12} style={{ gridColumn: "1", gridRow: "2" }}>
        <div style={{ height: "100%", padding: "20px 22px", display: "flex", flexDirection: "column" }}>
          <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace" }}>
            Single-day record
          </span>
          <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <span className="font-mono select-none" style={{ fontSize: 44, color: "var(--color-gray12)", letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
              {stats.bingeSessions[0]?.count ?? 0}
            </span>
          </div>
        </div>
      </InnerShadowCard>

      {/* Top searches */}
      <InnerShadowCard delay={0.17} style={{ gridColumn: "2", gridRow: "2" }}>
        <div style={{ height: "100%", padding: "20px 22px", display: "flex", flexDirection: "column" }}>
          <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14, fontFamily: "'Geist Mono', ui-monospace, monospace" }}>
            Top searches
          </span>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 9 }}>
            {stats.topSearchTerms.slice(0, 5).map((item) => (
              <div key={item.term} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--color-orange)", width: 16, textAlign: "right", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{item.count}</span>
                <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.term}</span>
              </div>
            ))}
          </div>
        </div>
      </InnerShadowCard>

      {/* Top category */}
      <InnerShadowCard delay={0.22} style={{ gridColumn: "1", gridRow: "3" }}>
        <div style={{ height: "100%", padding: "20px 22px", display: "flex", flexDirection: "column" }}>
          <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace" }}>
            Top category
          </span>
          <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <span className="font-mono select-none" style={{ fontSize: 44, color: "var(--color-orange)", letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
              {Math.round(stats.topCategory.percentage)}%
            </span>
          </div>
          <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.02em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace" }}>
            {stats.topCategory.label}
          </span>
        </div>
      </InnerShadowCard>

      {/* Daily habit */}
      <InnerShadowCard delay={0.27} style={{ gridColumn: "2", gridRow: "3" }}>
        <div style={{ height: "100%", padding: "20px 22px", display: "flex", flexDirection: "column" }}>
          <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace" }}>
            Daily habit
          </span>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
            <span className="font-mono select-none" style={{ fontSize: 18, color: "var(--text-faint)", letterSpacing: "-0.02em", lineHeight: 1, alignSelf: "center" }}>~</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
              <span className="font-mono select-none" style={{ fontSize: 44, color: "var(--color-gray12)", letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                {splitHoursMinutes(stats.avgHoursPerDay).h}
              </span>
              <span className="font-mono select-none" style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: "0.05em" }}>H</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
              <span className="font-mono select-none" style={{ fontSize: 44, color: "var(--color-gray12)", letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                {String(splitHoursMinutes(stats.avgHoursPerDay).m).padStart(2, "0")}
              </span>
              <span className="font-mono select-none" style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: "0.05em" }}>M</span>
            </div>
          </div>
          <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.02em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace" }}>
            Avg daily
          </span>
        </div>
      </InnerShadowCard>
    </div>
  );
}


// ─── Ginn Test — 6 Jin Su Park metallic card variants ────────────────────────
//
// Each card isolates one layer of Jin Su Park's card surface system so you can
// feel what each ingredient contributes to the "metal plate" effect.
//
// Layer anatomy of his cards (built up left to right across the 6 cells):
//   00 Base       — flat dark surface, tight border. Reference.
//   01 Catch      — +top specular rim (1px inset highlight). The "notch".
//   02 Gradient   — +subtle surface gradient, lighter top → darker bottom.
//   03 Lift       — +outer drop shadow making the card rest above the surface.
//   04 Metallic   — 01+02+03 combined. Target approximation of his aesthetic.
//   05 Pressed    — inverted: deep inset shadow. Card pushed *into* surface.

type GinnRecipe = {
  label: string;
  bg: string;
  border: string;
  boxShadow: string;
  // Optional gradient overlay layered above bg
  gradient?: string;
};

const GINN_RECIPES: GinnRecipe[] = [
  {
    label: "00 — Base",
    bg: "#1a1714",
    border: "1px solid rgba(255,255,255,0.07)",
    boxShadow: "none",
  },
  {
    label: "01 — Catch",
    bg: "#1a1714",
    border: "1px solid rgba(255,255,255,0.07)",
    // inset-shadow: the specular catch-light at the very top rim — the "notch"
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14)",
  },
  {
    label: "02 — Gradient",
    bg: "#1a1714",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10)",
    // gradient: lighter at top (light reflecting), darker at bottom (depth)
    gradient: "linear-gradient(175deg, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.0) 55%)",
  },
  {
    label: "03 — Lift",
    bg: "#1a1714",
    border: "1px solid rgba(255,255,255,0.09)",
    // outer drop shadow: card sits 1-2px above the surface
    boxShadow: [
      "0 2px 6px rgba(0,0,0,0.55)",
      "0 0 0 0.5px rgba(255,255,255,0.04)",
    ].join(", "),
  },
  {
    label: "04 — Metallic",
    bg: "#191614",
    border: "1px solid rgba(255,255,255,0.09)",
    // full stack: specular rim + bottom depth + outer lift + outline glow
    boxShadow: [
      "inset 0 1px 0 rgba(255,255,255,0.14)",      // specular top rim
      "inset 0 -2px 5px rgba(0,0,0,0.55)",          // depth at bottom edge
      "0 2px 8px rgba(0,0,0,0.55)",                 // outer lift
      "0 0 0 0.5px rgba(255,255,255,0.04)",          // faint outer outline glow
    ].join(", "),
    gradient: "linear-gradient(175deg, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.0) 55%)",
  },
  {
    label: "05 — Pressed",
    bg: "#141210",
    border: "1px solid rgba(255,255,255,0.05)",
    // card pushed INTO the surface — inverted depth reference
    boxShadow: [
      "inset 0 2px 6px rgba(0,0,0,0.75)",
      "inset 0 1px 0 rgba(0,0,0,0.9)",
      "inset 0 0 1px rgba(0,0,0,0.5)",
    ].join(", "),
  },
];

function GinnCard({
  recipe,
  children,
  style,
  delay = 0,
  showCutouts = false,
}: {
  recipe: GinnRecipe;
  children: (hovered: boolean) => React.ReactNode;
  style?: React.CSSProperties;
  delay?: number;
  // showCutouts: punches circular bites into the top/bottom center edges
  showCutouts?: boolean;
}) {
  const [hovered, setHovered] = React.useState(false);

  const hoverBorder = recipe.border.replace(
    /rgba\(255,255,255,([\d.]+)\)/,
    (_, a) => `rgba(255,255,255,${Math.min(1, parseFloat(a) + 0.1)})`
  );
  const hoverShadow = recipe.boxShadow === "none"
    ? "inset 0 1px 0 rgba(255,255,255,0.10)"
    : recipe.boxShadow.replace(
        /inset 0 1px 0 rgba\(255,255,255,([\d.]+)\)/,
        (_, a) => `inset 0 1px 0 rgba(255,255,255,${Math.min(1, parseFloat(a) + 0.07)})`
      );

  // cutout circle — positioned right-of-center like the reference, with shadow depth
  const cutoutStyle: React.CSSProperties = {
    position: "absolute",
    // ~65% from left, matching Jin Su Park's proportional placement
    left: "64%",
    width: 11, height: 11,
    borderRadius: "50%",
    // background matches the gap color — reads as a punched hole
    backgroundColor: "#0d0c0b",
    // inset only — no outer shadow bleeding into the gap
    boxShadow: "inset 0 2px 5px rgba(0,0,0,0.98), inset 0 0 2px rgba(0,0,0,0.8)",
    zIndex: 3,
    pointerEvents: "none",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: "easeOut", delay }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...style,
        position: "relative",
        borderRadius: 4,
        backgroundColor: recipe.bg,
        border: hovered ? hoverBorder : recipe.border,
        boxShadow: hovered ? hoverShadow : recipe.boxShadow,
        // overflow: hidden clips the cutout circles so only the half
        // biting INTO the card shows — the part in the gap disappears
        overflow: "hidden",
        cursor: "default",
        transition: "border-color 0.15s ease, box-shadow 0.22s ease",
      }}
    >
      {/* gradient overlay */}
      {recipe.gradient && (
        <div style={{
          position: "absolute", inset: 0, background: recipe.gradient,
          pointerEvents: "none", borderRadius: 3,
          opacity: hovered ? 1.0 : 0.85, transition: "opacity 0.22s ease",
        }} />
      )}

      {/* left-edge notch */}
      <div style={{
        position: "absolute", left: 0, top: 14,
        width: 2, height: 28, borderRadius: "0 2px 2px 0",
        backgroundColor: hovered ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.10)",
        transition: "background-color 0.18s ease",
        pointerEvents: "none",
      }} />

      {/* top mounting hole — inside the card, top half clipped away by overflow:hidden */}
      {showCutouts && <div style={{ ...cutoutStyle, top: -5 }} />}

      {/* bottom mounting hole — inside the card, bottom half clipped away */}
      {showCutouts && <div style={{ ...cutoutStyle, bottom: -5 }} />}

      {children(hovered)}
    </motion.div>
  );
}

// TraceDivider — two via rings (ring + dot) connected by a line with a 45° jog
// Abstracted from PCB copper routing — the jog is the tell
function TraceDivider({ hovered }: { hovered: boolean }) {
  // stroke color: dim at rest, readable on hover — same rhythm as the left notch
  const c = hovered ? "rgba(255,255,255,0.30)" : "rgba(255,255,255,0.11)";
  return (
    <svg viewBox="0 0 200 14" preserveAspectRatio="none" style={{ width: "100%", height: 11, display: "block" }}>
      {/* trace: flat → 45° jog → flat */}
      <path d="M 10 8 H 78 L 96 3 H 188" stroke={c} strokeWidth="0.85" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.18s ease" }} />
      {/* via at start: outer ring + center dot */}
      <circle cx="10" cy="8" r="3.5" fill="none" stroke={c} strokeWidth="0.85" style={{ transition: "stroke 0.18s ease" }} />
      <circle cx="10" cy="8" r="1" fill={c} style={{ transition: "fill 0.18s ease" }} />
      {/* via at end */}
      <circle cx="188" cy="3" r="3.5" fill="none" stroke={c} strokeWidth="0.85" style={{ transition: "stroke 0.18s ease" }} />
      <circle cx="188" cy="3" r="1" fill={c} style={{ transition: "fill 0.18s ease" }} />
    </svg>
  );
}

// Single card treatment for the PCB element studies
const PCB_RECIPE: GinnRecipe = {
  label: "PCB",
  bg: "#191614",
  border: "1px solid rgba(255,255,255,0.09)",
  boxShadow: [
    "inset 0 1px 0 rgba(255,255,255,0.10)",
    "inset 0 -2px 5px rgba(0,0,0,0.55)",
    "0 2px 8px rgba(0,0,0,0.55)",
    "0 0 0 0.5px rgba(255,255,255,0.04)",
  ].join(", "),
  gradient: "linear-gradient(175deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.0) 55%)",
};

export function GinnTestView() {
  const stats = MOCK_STATS;

  // last 49 daily buckets → 7×7 SMD footprint grid (active day = filled pad)
  const smdGrid = React.useMemo(
    () => stats.dailyBuckets.slice(-49).map(b => b.count > 0),
    [stats.dailyBuckets]
  );

  return (
    <div
      style={{
        // Jin Su Park's background is darker and warmer than our default
        backgroundColor: "#0d0c0b",
        minHeight: "100vh",
        padding: "40px",
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gridAutoRows: "200px",
        // tight 3px gap — much closer to his grid density
        gap: 3,
        maxWidth: 560,
        margin: "0 auto",
      }}
    >
      {GINN_RECIPES.map((recipe, idx) => (
        <GinnCard key={recipe.label} recipe={recipe} delay={idx * 0.06}>
          {(hovered) => (
          <div style={{ height: "100%", padding: "16px 18px 16px 22px", display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
            {/* Top row: stat label + recipe chip */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span
                className="font-mono select-none"
                style={{
                  fontSize: 8,
                  // text brightens to near-white on hover — key part of his hover state
                  color: hovered ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.28)",
                  letterSpacing: "0.14em", textTransform: "uppercase",
                  transition: "color 0.18s ease",
                }}
              >
                {["Peak hour","After midnight","Single-day record","Top category","Days active","Daily habit"][idx]}
              </span>
              {/* Recipe chip — like Jin's PD / AI / WD tag */}
              <span
                className="font-mono select-none"
                style={{
                  fontSize: 7,
                  color: hovered ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.28)",
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  padding: "3px 6px",
                  border: `1px solid ${hovered ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.09)"}`,
                  borderRadius: 3,
                  backgroundColor: hovered ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
                  lineHeight: 1,
                  transition: "color 0.18s ease, border-color 0.18s ease, background-color 0.18s ease",
                }}
              >
                {recipe.label.split(" — ")[0]}
              </span>
            </div>

            {/* Big stat number — snaps to white on hover */}
            <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
              <span
                className="font-mono select-none"
                style={{
                  fontSize: 40,
                  color: hovered ? "rgba(255,255,255,1.0)" : "rgba(220,214,208,0.72)",
                  letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums",
                  transition: "color 0.18s ease",
                }}
              >
                {[
                  formatHour(stats.topHour),
                  `${Math.round(stats.nightOwlPercent)}%`,
                  String(stats.bingeSessions[0]?.count ?? 0),
                  `${Math.round(stats.topCategory.percentage)}%`,
                  "91%",
                  String(stats.avgVideosPerDay.toFixed(0)),
                ][idx]}
              </span>
            </div>

            {/* Bottom label */}
            <span
              className="font-mono select-none"
              style={{
                fontSize: 8,
                color: hovered ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.18)",
                letterSpacing: "0.1em", textTransform: "uppercase",
                transition: "color 0.18s ease",
              }}
            >
              {recipe.label.split(" — ")[1]}
            </span>
          </div>
          )}
        </GinnCard>
      ))}

      {/* ── Card 07: Full physical treatment — cutouts + rivet indicator ── */}
      <GinnCard
        recipe={GINN_RECIPES[4]}
        delay={0.38}
        showCutouts
        style={{ gridColumn: "1 / 3" }}
      >
        {(hovered) => (
          <div style={{ height: "100%", padding: "18px 22px 18px 26px", display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span className="font-mono select-none" style={{ fontSize: 8, color: hovered ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.28)", letterSpacing: "0.14em", textTransform: "uppercase", transition: "color 0.18s ease" }}>
                Physical
              </span>
              <span className="font-mono select-none" style={{ fontSize: 7, color: hovered ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.28)", letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 6px", border: `1px solid ${hovered ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.09)"}`, borderRadius: 3, backgroundColor: hovered ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)", lineHeight: 1, transition: "color 0.18s ease, border-color 0.18s ease" }}>
                06
              </span>
            </div>

            <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
              <span className="font-mono select-none" style={{ fontSize: 40, color: hovered ? "rgba(255,255,255,1.0)" : "rgba(220,214,208,0.72)", letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums", transition: "color 0.18s ease" }}>
                {formatHour(stats.topHour)}
              </span>
            </div>

            {/* rivet indicator: circle + dash — right-aligned like the reference */}
            <div style={{ position: "absolute", bottom: 16, right: 20, display: "flex", alignItems: "center", gap: 5 }}>
              {/* circle rivet — slightly raised with inner highlight + outer drop shadow */}
              <div style={{
                width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
                backgroundColor: hovered ? "rgba(255,255,255,0.38)" : "rgba(255,255,255,0.16)",
                boxShadow: [
                  "inset 0 0.5px 0 rgba(255,255,255,0.3)",   // top catch light
                  "0 1px 2px rgba(0,0,0,0.9)",                // drop shadow below
                ].join(", "),
                transition: "background-color 0.18s ease",
              }} />
              {/* dash rivet — same treatment, elongated */}
              <div style={{
                width: 14, height: 3, borderRadius: 2, flexShrink: 0,
                backgroundColor: hovered ? "rgba(255,255,255,0.30)" : "rgba(255,255,255,0.13)",
                boxShadow: [
                  "inset 0 0.5px 0 rgba(255,255,255,0.25)",
                  "0 1px 2px rgba(0,0,0,0.9)",
                ].join(", "),
                transition: "background-color 0.18s ease",
              }} />
            </div>

            <span className="font-mono select-none" style={{ fontSize: 8, color: hovered ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.18)", letterSpacing: "0.1em", textTransform: "uppercase", transition: "color 0.18s ease" }}>
              Cutouts · Rivet · Metallic
            </span>
          </div>
        )}
      </GinnCard>

      {/* ── PCB Element Studies ─────────────────────────────────────── */}

      {/* A: Trace Divider — copper trace with 45° jog and via rings */}
      <GinnCard recipe={PCB_RECIPE} delay={0.44}>
        {(hovered) => (
          <div style={{ height: "100%", padding: "18px 20px 18px 24px", display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
            <span className="font-mono select-none" style={{ fontSize: 8, color: hovered ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.24)", letterSpacing: "0.14em", textTransform: "uppercase", transition: "color 0.18s ease", marginBottom: 14 }}>
              Trace
            </span>
            {/* the PCB element itself — sits as a visual divider mid-card */}
            <TraceDivider hovered={hovered} />
            <div style={{ flex: 1, display: "flex", alignItems: "flex-end" }}>
              <span className="font-mono select-none" style={{ fontSize: 36, color: hovered ? "rgba(255,255,255,0.90)" : "rgba(220,214,208,0.55)", letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums", transition: "color 0.18s ease" }}>
                {Math.round(stats.nightOwlPercent)}%
              </span>
            </div>
            <span className="font-mono select-none" style={{ fontSize: 8, color: hovered ? "rgba(255,255,255,0.30)" : "rgba(255,255,255,0.12)", letterSpacing: "0.1em", textTransform: "uppercase", transition: "color 0.18s ease", marginTop: 10 }}>
              After midnight
            </span>
          </div>
        )}
      </GinnCard>

      {/* B: Edge Contact Strip — row of pads along the bottom edge like a PCB edge connector */}
      <GinnCard recipe={PCB_RECIPE} delay={0.50}>
        {(hovered) => (
          <div style={{ height: "100%", padding: "18px 20px 0 24px", display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
            <span className="font-mono select-none" style={{ fontSize: 8, color: hovered ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.24)", letterSpacing: "0.14em", textTransform: "uppercase", transition: "color 0.18s ease", marginBottom: 18 }}>
              Edge
            </span>
            <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
              <span className="font-mono select-none" style={{ fontSize: 36, color: hovered ? "rgba(255,255,255,0.90)" : "rgba(220,214,208,0.55)", letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums", transition: "color 0.18s ease" }}>
                {formatHour(stats.topHour)}
              </span>
            </div>
            {/* edge connector strip — every 3rd pad is taller (pin 1 / key marker convention) */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", alignItems: "flex-end", gap: 2, padding: "0 16px" }}>
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} style={{
                  flex: 1,
                  // taller on every 3rd — echoes how real edge connectors mark key pins
                  height: i % 3 === 0 ? 14 : 10,
                  borderRadius: "1.5px 1.5px 0 0",
                  backgroundColor: hovered ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)",
                  // staggered transition: left pads light up before right
                  transition: `background-color 0.18s ease ${i * 8}ms`,
                }} />
              ))}
            </div>
          </div>
        )}
      </GinnCard>

      {/* C: SMD Footprint Grid — square pads in a 7×7 grid, each = one day */}
      <GinnCard recipe={PCB_RECIPE} delay={0.56} style={{ gridColumn: "1 / 3" }}>
        {(hovered) => (
          <div style={{ height: "100%", padding: "18px 20px 18px 24px", display: "flex", flexDirection: "column", gap: 14, position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className="font-mono select-none" style={{ fontSize: 8, color: hovered ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.24)", letterSpacing: "0.14em", textTransform: "uppercase", transition: "color 0.18s ease" }}>
                SMD
              </span>
              <span className="font-mono select-none" style={{ fontSize: 7, color: hovered ? "rgba(255,255,255,0.38)" : "rgba(255,255,255,0.16)", letterSpacing: "0.08em", transition: "color 0.18s ease" }}>
                49d
              </span>
            </div>
            {/* square pad grid — filled = active session day, empty = no activity */}
            <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, alignContent: "center" }}>
              {smdGrid.map((active, i) => (
                <div key={i} style={{
                  aspectRatio: "1",
                  // borderRadius: 1.5 — just barely rounds the pad corners, stays square-read
                  borderRadius: 1.5,
                  backgroundColor: active
                    ? hovered ? "rgba(255,255,255,0.70)" : "rgba(255,255,255,0.36)"
                    : hovered ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
                  // wave stagger: i * 6ms — pads fill left-to-right like a scan
                  transition: `background-color 0.15s ease ${i * 6}ms`,
                }} />
              ))}
            </div>
          </div>
        )}
      </GinnCard>
    </div>
  );
}


// ─── Scale hover grid test (preserves old scale-based interaction) ────────────

function ScaleHoverGridView() {
  const stats = MOCK_STATS;

  return (
    <div
      style={{
        backgroundColor: "var(--bg-primary)",
        minHeight: "100vh",
        padding: "40px",
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gridAutoRows: "200px",
        gap: 12,
        maxWidth: 560,
        margin: "0 auto",
      }}
    >
      {/* Peak hour */}
      <ScaleGridCard delay={0} style={{ gridColumn: "1", gridRow: "1" }}>
        <div style={{ height: "100%", padding: "20px 22px", display: "flex", flexDirection: "column" }}>
          <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace" }}>
            Peak hour
          </span>
          <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <span className="font-mono select-none" style={{ fontSize: 44, color: "var(--color-gray12)", letterSpacing: "-0.04em", lineHeight: 1 }}>
              {formatHour(stats.topHour)}
            </span>
          </div>
        </div>
      </ScaleGridCard>

      {/* After midnight */}
      <ScaleGridCard delay={0.07} style={{ gridColumn: "2", gridRow: "1" }}>
        <div style={{ height: "100%", padding: "20px 22px", display: "flex", flexDirection: "column" }}>
          <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace" }}>
            After midnight
          </span>
          <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <span className="font-mono select-none" style={{ fontSize: 44, color: "var(--color-gray12)", letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
              {Math.round(stats.nightOwlPercent)}%
            </span>
          </div>
        </div>
      </ScaleGridCard>

      {/* Single-day record */}
      <ScaleGridCard delay={0.12} style={{ gridColumn: "1", gridRow: "2" }}>
        <div style={{ height: "100%", padding: "20px 22px", display: "flex", flexDirection: "column" }}>
          <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace" }}>
            Single-day record
          </span>
          <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <span className="font-mono select-none" style={{ fontSize: 44, color: "var(--color-gray12)", letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
              {stats.bingeSessions[0]?.count ?? 0}
            </span>
          </div>
        </div>
      </ScaleGridCard>

      {/* Top category */}
      <ScaleGridCard delay={0.17} style={{ gridColumn: "2", gridRow: "2" }}>
        <div style={{ height: "100%", padding: "20px 22px", display: "flex", flexDirection: "column" }}>
          <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace" }}>
            Top category
          </span>
          <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <span className="font-mono select-none" style={{ fontSize: 44, color: "var(--color-orange)", letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
              {Math.round(stats.topCategory.percentage)}%
            </span>
          </div>
          <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.02em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace" }}>
            {stats.topCategory.label}
          </span>
        </div>
      </ScaleGridCard>

      {/* Daily habit */}
      <ScaleGridCard delay={0.22} style={{ gridColumn: "1", gridRow: "3" }}>
        <div style={{ height: "100%", padding: "20px 22px", display: "flex", flexDirection: "column" }}>
          <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace" }}>
            Daily habit
          </span>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
            <span className="font-mono select-none" style={{ fontSize: 18, color: "var(--text-faint)", letterSpacing: "-0.02em", lineHeight: 1, alignSelf: "center" }}>~</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
              <span className="font-mono select-none" style={{ fontSize: 44, color: "var(--color-gray12)", letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                {splitHoursMinutes(stats.avgHoursPerDay).h}
              </span>
              <span className="font-mono select-none" style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: "0.05em" }}>H</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
              <span className="font-mono select-none" style={{ fontSize: 44, color: "var(--color-gray12)", letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                {String(splitHoursMinutes(stats.avgHoursPerDay).m).padStart(2, "0")}
              </span>
              <span className="font-mono select-none" style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: "0.05em" }}>M</span>
            </div>
          </div>
          <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.02em", textTransform: "uppercase", fontFamily: "'Geist Mono', ui-monospace, monospace" }}>
            Avg daily
          </span>
        </div>
      </ScaleGridCard>

      {/* Top searches */}
      <ScaleGridCard delay={0.27} style={{ gridColumn: "2", gridRow: "3" }}>
        <div style={{ height: "100%", padding: "20px 22px", display: "flex", flexDirection: "column" }}>
          <span className="select-none" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14, fontFamily: "'Geist Mono', ui-monospace, monospace" }}>
            Top searches
          </span>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 9 }}>
            {stats.topSearchTerms.slice(0, 5).map((item) => (
              <div key={item.term} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--color-orange)", width: 16, textAlign: "right", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{item.count}</span>
                <span className="font-mono select-none" style={{ fontSize: 9, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.term}</span>
              </div>
            ))}
          </div>
        </div>
      </ScaleGridCard>
    </div>
  );
}

