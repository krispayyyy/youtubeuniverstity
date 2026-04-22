"use client";
// Shared full-page wrapper — matches main page bg exactly, centered column, scrollable.

import * as React from "react";

export function InfoPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: "#0C0C0B", minHeight: "100vh", color: "#fff", overflowY: "auto" }}>
      {/* tighter column with side breathing room */}
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "48px 32px 80px" }}>
        {children}
      </div>
    </div>
  );
}
