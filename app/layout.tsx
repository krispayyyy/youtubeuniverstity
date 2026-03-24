import type { Metadata } from "next";
import { ThemeProvider } from "@/components/youtube/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "YouTube University",
  description: "A personal analytics dashboard for your YouTube learning habits",
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
