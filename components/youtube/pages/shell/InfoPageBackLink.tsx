"use client";
// Shared back-link used at the top of every info sub-page.

export function InfoPageBackLink({ label, onClick }: { label: string; onClick: () => void }) {
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
