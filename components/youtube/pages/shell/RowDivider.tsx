// Subtle rounded divider — replaces borderBottom so we can round the ends.

export function RowDivider() {
  return (
    <div style={{
      height: 1,
      borderRadius: 999,
      backgroundColor: "rgba(255,255,255,0.05)",
      margin: "0 2px",
    }} />
  );
}
