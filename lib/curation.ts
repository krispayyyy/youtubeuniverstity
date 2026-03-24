/**
 * lib/curation.ts
 *
 * Theme-based search aggregation for the "AI-forward product designer/builder" narrative.
 *
 * APPROACH:
 * Individual search terms are fragmented — "claude code" (6 searches) doesn't capture
 * "claude code vs cursor" (3), "claude code in cursor" (3), "anthropic ceo" (2), etc.
 * Instead, we define SEARCH_THEMES: named clusters with keyword lists that aggregate
 * all matching searches into a single count.
 *
 * The result: each row in the UI shows a curated theme label + the true aggregate count
 * of all searches that relate to that theme.
 *
 * TUNING:
 * - priority: manually boost (>1) or suppress (<1) a theme relative to its raw count
 * - keyword order: first match wins — put specific themes before general ones
 * - categoryWeight: AI > design > engineering > startup (narrative fit)
 *
 * Run `npm run audit-classifier` to see what each theme actually captures.
 */

export type SearchTerm = { term: string; count: number };

// ── Theme clusters ────────────────────────────────────────────────────────────
// label: displayed in the UI — should look like a natural search term
// keywords: any search containing one of these maps to this theme (first match wins)
// category: used for category-weight scoring
// priority: manual tuning — boost signal or suppress noise

export const SEARCH_THEMES: {
  label: string;
  keywords: string[];
  category: 'ai' | 'design' | 'engineering' | 'startup';
  priority: number;
}[] = [
  // ── AI tools (most distinctive narrative signals) ─────────────────────────
  {
    label: 'claude code',
    keywords: ['claude', 'anthropic'],
    category: 'ai',
    priority: 1.3,
  },
  {
    label: 'cursor ai',
    keywords: ['cursor'],
    category: 'ai',
    priority: 1.1,
  },
  {
    label: 'openai + chatgpt',
    keywords: ['chatgpt', 'openai', 'gpt'],
    category: 'ai',
    priority: 1.0,
  },
  {
    label: 'how i ai',
    keywords: ['how i ai'],
    category: 'ai',
    priority: 1.2,
  },
  // ── Design tools (before general AI — specific tools take priority) ──────
  {
    label: 'figma',
    keywords: ['figma'],
    category: 'design',
    priority: 1.2,
  },
  {
    label: 'product design',
    keywords: ['product design', 'design portfolio', 'ux design', 'ui design', 'design system',
                'design thinking', 'design engineer', 'app critique', 'design review'],
    category: 'design',
    priority: 0.9,
  },
  {
    label: 'motion design',
    keywords: ['framer', 'rive', 'lottie', 'gsap', 'three.js', 'shader', 'spline',
                'animation', 'motion design', 'p5', 'creative coding', 'webgl'],
    category: 'design',
    priority: 0.85,
  },

  // ── General AI (after specific tools) ────────────────────────────────────
  {
    label: 'ai + llm',
    keywords: ['llm', 'ai agent', 'agentic', 'mcp', 'langchain', 'hugging face', 'embeddings'],
    category: 'ai',
    priority: 0.9,
  },
  {
    label: 'midjourney + runway',
    keywords: ['midjourney', 'runway', 'stable diffusion', 'dall-e', 'sora'],
    category: 'ai',
    priority: 0.85,
  },
  {
    label: 'webflow',
    keywords: ['webflow'],
    category: 'design',
    priority: 0.25, // deprioritized — user preference
  },

  // ── Engineering ───────────────────────────────────────────────────────────
  {
    label: 'github',
    keywords: ['github', 'git'],
    category: 'engineering',
    priority: 1.2, // boosted — user preference
  },
  {
    label: 'storybook',
    keywords: ['storybook'],
    category: 'engineering',
    priority: 1.0,
  },
  {
    label: 'react + next.js',
    keywords: ['react', 'nextjs', 'next.js', 'typescript', 'tailwind', 'vercel', 'vite'],
    category: 'engineering',
    priority: 0.8,
  },

  // ── Startup / learning ────────────────────────────────────────────────────
  {
    label: 'dive club',
    keywords: ['dive club'],
    category: 'startup',
    priority: 1.3, // boosted — strong narrative signal per user
  },
  {
    label: 'startup + vc',
    keywords: ['startup', 'founder', 'ycombinator', 'y combinator', 'venture', 'fundraising',
                'product market fit', 'indie hacker', 'saas'],
    category: 'startup',
    priority: 0.7,
  },
];

// ── Category weights (narrative fit) ─────────────────────────────────────────
const CATEGORY_WEIGHT: Record<string, number> = {
  ai: 1.0,
  design: 0.95,
  engineering: 0.9,
  startup: 0.7,
};

// ── Keyword matching (word-boundary for short keywords) ───────────────────────
function termMatchesKeyword(term: string, kw: string): boolean {
  if (kw.length <= 3) {
    return new RegExp(`(?<![a-z])${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-z])`, 'i').test(term);
  }
  return term.toLowerCase().includes(kw);
}

// ── Main export: group all searches by theme and return top N ─────────────────

/**
 * Aggregate all design-relevant search terms into themes and return the top N.
 * Each returned item has:
 *   term  — a curated theme label (looks like a natural search)
 *   count — the sum of all matching individual search counts
 */
export function groupSearchesByTheme(searches: SearchTerm[], n: number): SearchTerm[] {
  // Initialize buckets
  const buckets = new Map<string, number>(SEARCH_THEMES.map(t => [t.label, 0]));

  // Assign each search to its first matching theme
  for (const search of searches) {
    const lower = search.term.toLowerCase();
    for (const theme of SEARCH_THEMES) {
      if (theme.keywords.some(kw => termMatchesKeyword(lower, kw))) {
        buckets.set(theme.label, (buckets.get(theme.label) ?? 0) + search.count);
        break; // first match wins
      }
    }
    // unmatched searches are dropped (already filtered for design-relevance)
  }

  // Score each theme and pick top N
  return SEARCH_THEMES
    .map(theme => ({
      term:  theme.label,
      count: buckets.get(theme.label) ?? 0,
      score: theme.priority
           * (CATEGORY_WEIGHT[theme.category] ?? 0.5)
           * Math.log((buckets.get(theme.label) ?? 0) + 1),
    }))
    .filter(t => t.count > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map(({ term, count }) => ({ term, count }));
}
