// components/ui/upload-modal.tsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PixelReveal } from "@/components/ui/pixel-reveal";

// ── Prompt content ─────────────────────────────────────────────────────────────

const PROMPT_CHROME = `I need to export my YouTube watch history from Google Takeout. Please guide me through every step in my browser exactly as written below.

1. Go to https://takeout.google.com
2. Click "Deselect all" — this unchecks every Google service. The button is near the top of the services list.
3. Scroll down the list until you find "YouTube and YouTube Music". Check its checkbox.
4. Click the blue "All YouTube data included" button that appears under the YouTube entry. A panel will open showing which data types are included.
5. In that panel: check "history" and "subscriptions". Uncheck everything else. Important: the format for history is always HTML — do not touch the format dropdown, it has no effect on what gets exported.
6. Click "OK" to close the panel.
7. Scroll to the bottom of the page and click "Next step".
8. On the delivery options screen: set File type to .zip, Frequency to "Export once", File size to 2 GB.
9. Click "Create export".

Google is now processing the export. Before we continue — two options:

A) Navigate to my email now and wait for the download link to arrive, then download the .zip and let me know so I can come back here to upload it.
B) I'll check my email myself when it arrives. Just tell me what to look for.

Wait for my answer before continuing.`;

const PROMPT_CODE = `I need to export my YouTube watch history from Google Takeout so I can upload it to my stats dashboard. Walk me through every step — do not skip anything.

1. Open https://takeout.google.com in a browser.
2. Click "Deselect all" to clear every pre-checked service.
3. Scroll down the services list and check "YouTube and YouTube Music".
4. Click the blue "All YouTube data included" button under that entry. A panel opens listing data types.
5. In the panel: check "history" and "subscriptions". Uncheck everything else. The export format for history is always HTML — ignore the format dropdown entirely, it does not matter.
6. Click "OK" to close the panel.
7. Scroll to the bottom and click "Next step".
8. Set delivery options: File type = .zip, Frequency = Export once, File size = 2 GB.
9. Click "Create export".

Google is now processing the export. Before continuing — two options:

A) Navigate to my email now and wait for the Google download link to arrive, then download the .zip and tell me when it's ready so I can come back here to upload it.
B) I'll monitor my email myself. Just tell me what the email looks like and what to download.

Wait for my answer before proceeding.`;

const LIST_TLDR = "Follow these steps exactly to export your YouTube watch history from Google Takeout — then come back and upload the .zip file here.";

const LIST_STEPS = [
  "Go to takeout.google.com",
  "Click \u201cDeselect all\u201d to uncheck every service",
  "Scroll down and check \u201cYouTube and YouTube Music\u201d",
  "Click the blue \u201cAll YouTube data included\u201d button \u2014 a panel opens",
  "In the panel: check \u201chistory\u201d and \u201csubscriptions\u201d, uncheck everything else. Format is always HTML \u2014 ignore the dropdown",
  "Click OK to close the panel",
  "Scroll to the bottom and click \u201cNext step\u201d",
  "Set: File type = .zip \u00b7 Frequency = Export once \u00b7 File size = 2 GB",
  "Click \u201cCreate export\u201d",
  "Google emails a download link (usually minutes, sometimes hours)",
  "Download the .zip. If split into multiple files (001.zip, 002.zip...), download only the first one",
  "Come back here and upload the .zip",
];

type Tab = "chrome" | "code" | "list";

const TABS: { id: Tab; label: string }[] = [
  { id: "chrome", label: "Claude Chrome" },
  { id: "code",   label: "Claude Code"   },
  { id: "list",   label: "List"          },
];

// ── Tab icons ──────────────────────────────────────────────────────────────────
// All use currentColor so they invert cleanly on active (dark bg) vs inactive.

function TabIcon({ id }: { id: Tab }) {
  const base = {
    fill: "none" as const,
    stroke: "currentColor" as const,
    strokeWidth: 1 as number,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    style: { display: "block" as const, flexShrink: 0 },
  };

  if (id === "chrome") return (
    // Retro browser window: rounded rect + title-bar divider + three traffic-light dots
    <svg {...base} width="13" height="11" viewBox="0 0 13 11">
      <rect x="0.5" y="0.5" width="12" height="10" rx="2"/>
      <line x1="0.5" y1="3.5" x2="12.5" y2="3.5"/>
      <circle cx="2.2" cy="2" r="0.55" fill="currentColor" stroke="none"/>
      <circle cx="4"   cy="2" r="0.55" fill="currentColor" stroke="none"/>
      <circle cx="5.8" cy="2" r="0.55" fill="currentColor" stroke="none"/>
    </svg>
  );

  if (id === "code") return (
    // Terminal window: same chrome as browser + > prompt + cursor underline
    <svg {...base} width="13" height="11" viewBox="0 0 13 11">
      <rect x="0.5" y="0.5" width="12" height="10" rx="2"/>
      <line x1="0.5" y1="3.5" x2="12.5" y2="3.5"/>
      {/* > chevron prompt */}
      <polyline points="2.5,5.5 4.5,7 2.5,8.5"/>
      {/* cursor underline */}
      <line x1="5.5" y1="8.5" x2="8.5" y2="8.5"/>
    </svg>
  );

  // list: three bullet + rule rows
  return (
    <svg {...base} width="12" height="10" viewBox="0 0 12 10">
      <circle cx="1.5" cy="2"   r="0.65" fill="currentColor" stroke="none"/>
      <line x1="3.5" y1="2"   x2="11.5" y2="2"/>
      <circle cx="1.5" cy="5"   r="0.65" fill="currentColor" stroke="none"/>
      <line x1="3.5" y1="5"   x2="11.5" y2="5"/>
      <circle cx="1.5" cy="8"   r="0.65" fill="currentColor" stroke="none"/>
      <line x1="3.5" y1="8"   x2="11.5" y2="8"/>
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg
      width="10" height="10" viewBox="0 0 10 10"
      fill="none" stroke="currentColor" strokeWidth="1.2"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ display: "block", flexShrink: 0 }}
    >
      <polyline points="5,1 5,7" />
      <polyline points="2.5,3.5 5,1 7.5,3.5" />
      <line x1="1.5" y1="9" x2="8.5" y2="9" />
    </svg>
  );
}

const PROMPTS: Record<"chrome" | "code", string> = {
  chrome: PROMPT_CHROME,
  code:   PROMPT_CODE,
};

export interface UploadModalProps {
  onClose:        () => void;
  onUpload:       (file: File) => Promise<void>;
  uploading:      boolean;
  uploadError:    string | null;
  uploadProgress?: string | null;
}

export function UploadModal({ onClose, onUpload, uploading, uploadError, uploadProgress }: UploadModalProps) {
  const [tab, setTab]       = React.useState<Tab>("chrome");
  const [copied, setCopied] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // spinning: latches true when upload starts, holds for 6s then auto-closes
  // timerRef keeps the timeout alive even after `uploading` flips back to false
  const [spinning, setSpinning] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => {
    if (uploading && !spinning) {
      setSpinning(true);
      timerRef.current = setTimeout(() => { setSpinning(false); onClose(); }, 3500);
    }
  }, [uploading]);

  // Escape key + scroll lock — restore scroll on unmount
  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const isList = tab === "list";

  async function handleCopy() {
    if (isList) return;
    try {
      await navigator.clipboard.writeText(PROMPTS[tab as "chrome" | "code"]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked — don't show Copied */ }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      e.target.value = "";
      try {
        await onUpload(file);
      } catch {
        // parent sets uploadError state — nothing to do here
      }
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          backgroundColor: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          zIndex: 200,
        }}
      />

      <div
        style={{
          position: "fixed", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 201, pointerEvents: "none",
        }}
      >
        {/* position:relative so the absolutely-positioned alert anchors to this motion.div */}
        <motion.div
          layout
          exit={{ opacity: 0, y: 8, filter: "blur(6px)" }}
          transition={{
            layout:  { type: "spring", stiffness: 350, damping: 30 },
            opacity: { duration: 0.14, ease: "easeIn" },
            filter:  { duration: 0.14, ease: "easeIn" },
            y:       { type: "spring", stiffness: 600, damping: 35 },
          }}
          style={{ pointerEvents: "all", position: "relative" }}
        >
          <PixelReveal
            pixelColor="var(--modal-bg)"
            style={{
              backgroundColor: "var(--modal-bg)",
              border: "1px solid var(--overlay-strong)",
              borderRadius: 16,
              overflow: "hidden",
              boxShadow: "0 0 0 1px var(--overlay-subtle), 0 40px 100px rgba(0,0,0,0.95)",
              width: 480,
              maxWidth: "90vw",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {spinning ? (
              // loading state: whole body replaced by a centered spinner for 6s
              <div style={{
                height: 260,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <SpinnerDash size={20} />
              </div>
            ) : (
              <>
                <div style={{ padding: "20px 20px 0", backgroundColor: "var(--modal-bg)" }}>
                  {/* Header row: tab toggles only — close via backdrop click or Escape */}
                  <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
                    {TABS.map(({ id, label }) => (
                      <button
                        key={id}
                        onClick={() => setTab(id)}
                        style={{
                          fontFamily: "'Geist Mono', ui-monospace, monospace",
                          display: "flex", alignItems: "center", gap: 5,
                          fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase",
                          padding: "4px 8px", borderRadius: 4,
                          border: `1px solid ${tab === id ? "var(--overlay-medium)" : "var(--border-subtle)"}`,
                          backgroundColor: tab === id ? "var(--overlay-medium)" : "transparent",
                          color: tab === id ? "var(--text-primary)" : "var(--text-secondary)",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        <TabIcon id={id} />
                        {label}
                      </button>
                    ))}
                  </div>

                  <div style={{ position: "relative" }}>
                    <motion.div
                      animate={{ height: isList ? 220 : 180 }}
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      style={{ overflowY: "auto", paddingBottom: 32 }}
                    >
                      {isList ? (
                        <div className="font-mono" style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                          <p style={{ margin: "0 0 10px", lineHeight: 1.6, color: "var(--text-tertiary)", fontStyle: "italic" }}>
                            {LIST_TLDR}
                          </p>
                          <ol
                            style={{
                              margin: 0, padding: "0 0 0 18px",
                              lineHeight: 1.8,
                              listStyleType: "decimal",
                            }}
                          >
                            {LIST_STEPS.map((step, i) => (
                              <li key={i} style={{ marginBottom: 4 }}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      ) : (
                        <pre
                          className="font-mono"
                          style={{
                            margin: 0,
                            fontSize: 11, lineHeight: 1.7,
                            color: "var(--text-secondary)",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          }}
                        >
                          {PROMPTS[tab as "chrome" | "code"]}
                        </pre>
                      )}
                    </motion.div>

                    <div
                      style={{
                        position: "absolute", bottom: 0, left: 0, right: 0, height: 52,
                        background: "linear-gradient(to bottom, transparent, var(--modal-bg))",
                        pointerEvents: "none",
                      }}
                    />
                  </div>
                </div>

                <div style={{ height: 1, backgroundColor: "var(--overlay-medium)" }} />

                <div
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "12px 16px",
                    backgroundColor: "var(--modal-bg)",
                    gap: 8,
                  }}
                >
                  <button
                    onClick={handleCopy}
                    disabled={isList}
                    style={{
                      fontFamily: "'Geist Mono', ui-monospace, monospace",
                      fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase",
                      padding: "6px 12px", borderRadius: 8, minWidth: 90, textAlign: "center",
                      border: `1px solid ${copied ? "var(--color-orange)" : "var(--border-subtle)"}`,
                      backgroundColor: copied ? "var(--color-orange)" : "transparent",
                      color: copied ? "#fff" : (isList ? "var(--text-faint)" : "var(--text-secondary)"),
                      cursor: isList ? "not-allowed" : "pointer",
                      opacity: isList ? 0.35 : 1,
                      transition: "all 0.15s",
                    }}
                  >
                    {copied ? "Copied" : "Copy Prompt"}
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".zip"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                  <button
                    onClick={() => { if (!uploading) fileInputRef.current?.click(); }}
                    disabled={uploading}
                    style={{
                      fontFamily: "'Geist Mono', ui-monospace, monospace",
                      display: "flex", alignItems: "center", gap: 5,
                      fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase",
                      padding: "6px 14px", borderRadius: 8,
                      border: "1px solid var(--border-subtle)",
                      backgroundColor: "var(--text-primary)",
                      color: "var(--bg-primary)",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      minWidth: 72,
                      justifyContent: "center",
                    }}
                  >
                    <UploadIcon />
                    Upload
                  </button>
                </div>
              </>
            )}
          </PixelReveal>

          {/* alert is a child of the exit motion.div — guaranteed to leave with the modal card */}
          {uploadError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              style={{
                position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0,
                backgroundColor: "#e5e5e5",
                borderRadius: 10,
                padding: "10px 14px",
                display: "flex", alignItems: "flex-start", gap: 10,
              }}
            >
              <svg width="14" height="13" viewBox="0 0 14 13" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M7 1.5L13 11.5H1L7 1.5Z" stroke="#c0392b" strokeWidth="1.2" strokeLinejoin="round"/>
                <line x1="7" y1="5.5" x2="7" y2="8.5" stroke="#c0392b" strokeWidth="1.2" strokeLinecap="round"/>
                <circle cx="7" cy="10.2" r="0.6" fill="#c0392b"/>
              </svg>
              <span style={{
                flex: 1,
                fontFamily: "'PP Neue Montreal', system-ui, sans-serif",
                fontSize: 10, lineHeight: 1.5,
                color: "#333",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}>
                {uploadError}
              </span>
            </motion.div>
          )}

        </motion.div>
      </div>
    </>
  );
}

const SPIN_KEYFRAMES = `
@keyframes upload-modal-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
`;

function SpinnerDash({ size = 12 }: { size?: number }) {
  const r = size * 0.375;
  return (
    <>
      <style>{SPIN_KEYFRAMES}</style>
      <svg
        width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none"
        style={{ animation: "upload-modal-spin 0.7s linear infinite", display: "inline-block", verticalAlign: "middle" }}
      >
        <circle cx={size / 2} cy={size / 2} r={r} stroke="currentColor" strokeWidth="1.5"
          strokeLinecap="round" strokeDasharray={`${r * 3.1} ${r * 1.8}`} />
      </svg>
    </>
  );
}
