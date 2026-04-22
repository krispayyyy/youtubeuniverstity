import { ImageResponse } from "next/og";

// Social share card. Next.js renders this at build-time per convention:
// file name = /opengraph-image, served as a PNG the metadataBase URL points at.
// 1200×630 is the standard ratio Twitter/iMessage/Slack/LinkedIn all crop for previews.

export const alt = "YouTube University — The best way to demonstrate curiosity is showing how you invest your free time.";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };

export default function Image() {
  return new ImageResponse(
    (
      // display: flex required — ImageResponse's Satori renderer only accepts flex layouts.
      <div
        style={{
          width: "100%",
          height: "100%",
          // backgroundColor: hard-fill F8F8F8 — same token as the favicon for visual consistency.
          backgroundColor: "#F8F8F8",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "80px 96px",
        }}
      >
        <div
          style={{
            // eyebrow: small label above the quote (try fontSize 14 for quieter, 28 for punchier)
            fontSize: 22,
            color: "#7A7A7A",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            marginBottom: 32,
          }}
        >
          YouTube University
        </div>
        <div
          style={{
            // headline: quote fills most of the card; max-width: 1000 keeps a rag on the right edge
            fontSize: 64,
            color: "#111111",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            fontWeight: 500,
            maxWidth: 1000,
          }}
        >
          The best way to demonstrate curiosity is showing how you invest your free time.
        </div>
      </div>
    ),
    { ...size },
  );
}
