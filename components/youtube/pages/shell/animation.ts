// Page entrance animation helper.
// stagger: each item slides up 6px and fades in, delayed by its position index
// duration ↓ → snappier (try 0.18s), duration ↑ → slower reveal (try 0.4s)
// delay spacing ↓ → tighter choreography (try 0.04), ↑ → more theatrical (try 0.1)

export function pi(delay: number) {
  return {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.28, ease: "easeOut" as const, delay },
  };
}
