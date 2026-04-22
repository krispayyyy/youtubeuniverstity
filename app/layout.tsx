import type { Metadata } from "next";
import { ThemeProvider } from "@/components/youtube/theme-provider";
import "./globals.css";

// SHARE_QUOTE: used as description + social-card body copy. Edit once, propagates
// to openGraph + twitter blocks below so the quote reads identically everywhere.
const SHARE_QUOTE =
  "The best way to demonstrate curiosity is showing how you invest your free time.";

const SITE_TITLE = "YouTube University";
const SITE_URL   = "https://youtubeuniverstity.vercel.app";

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SHARE_QUOTE,
  metadataBase: new URL(SITE_URL),
  openGraph: {
    // images: auto-picked up from app/opengraph-image.tsx — no need to list here.
    title: SITE_TITLE,
    description: SHARE_QUOTE,
    url: SITE_URL,
    siteName: SITE_TITLE,
    type: "website",
  },
  twitter: {
    // summary_large_image: Twitter renders the 1200×630 OG image big (try "summary" for small square preview).
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SHARE_QUOTE,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
