/** Topic category definitions with keyword matching for channel names and video titles */

export interface Category {
  id: string;
  label: string;
  color: string; // hex
  keywords: string[];
  designRelevant: boolean;
}

/**
 * CLASSIFIER PRINCIPLES:
 * 1. Keywords must be topic/tool-based, never person-based.
 *    Person names are non-transferable and unreliable — classify by WHAT, not WHO.
 * 2. Short keywords (≤3 chars) use word-boundary matching to prevent substring false positives.
 *    e.g. 'ai' must not match "attainable" or "terrain" — only standalone "AI".
 * 3. A domain blocklist runs before category matching. Anything that matches the blocklist
 *    is excluded regardless of which category keywords it also matches.
 */

/**
 * Domains that should never be classified as design-relevant regardless of keyword matches.
 * Checked before category matching — first match excludes the video entirely.
 * Use compound phrases, not single words, to avoid over-blocking.
 */
export const DOMAIN_BLOCKLIST: string[] = [
  // Luxury watches / horology (not design tools)
  'watch brand', 'watch review', 'watch collection', 'luxury watch', 'vintage watch',
  'rolex', 'patek', 'omega watch', 'timepiece', 'horology', 'watchmaking',
  // Speculative finance / trading (not startup business)
  'day trading', 'forex trading', 'options trading', 'stock picks', 'stock tips',
  'crypto trading', 'bitcoin trading',
  // Celebrity lifestyle
  'billionaire lifestyle', 'richest person', 'net worth reveal',
];

export const CATEGORIES: Category[] = [
  {
    id: 'ai',
    label: 'AI & Machine Learning',
    color: '#818cf8', // indigo
    designRelevant: true,
    keywords: [
      // Tools & products — established
      'chatgpt', 'claude', 'midjourney', 'stable diffusion',
      'dall-e', 'sora', 'runway ml', 'runway gen', 'elevenlabs', 'eleven labs',
      'whisper', 'perplexity', 'hugging face', 'openai', 'anthropic', 'gemini', 'langchain',
      // Tools & products — emerging (2024–2025)
      'v0.dev', 'bolt.new', 'windsurf', 'replit agent',
      'luma ai', 'luma dream machine', 'pika labs', 'pika ai', 'kling ai',
      'heygen', 'descript', 'notebooklm',
      // AI coding specifically
      'ai coding', 'ai code', 'vibe coding', 'vibe code', 'ai workflow',
      'claude code', 'cursor ai',
      // Concepts
      'artificial intelligence', 'machine learning', 'deep learning', 'neural network',
      'transformer', 'diffusion model', 'large language model', 'foundation model',
      'retrieval augmented', 'fine-tuning', 'prompt engineering',
      'ai agent', 'agentic', 'ai engineer', 'ai native', 'how i ai',
      'context window', 'multimodal', 'embedding', 'vector database', 'inference',
      // Short acronyms — word-boundary matched (see matchesKeyword)
      'llm', 'gpt', 'rag', 'ai',
    ],
  },
  {
    id: 'design',
    label: 'Design & Creative',
    color: '#f472b6', // pink
    designRelevant: true,
    keywords: [
      // Tools & products
      'figma', 'framer', 'webflow', 'protopie', 'rive', 'lottie', 'sketch', 'adobe',
      'canva', 'principle', 'zeplin', 'maze', 'spline', 'jitter', 'after effects',
      // Disciplines
      'product design', 'ux design', 'ui design', 'interaction design', 'design system',
      'user research', 'design thinking', 'visual design', 'motion design',
      'design engineer', 'creative coding', 'graphic design', 'branding', 'typography',
      'accessibility design', 'inclusive design', 'design token', 'design tokens',
      'component library',
      // Creative tech
      'three.js', 'shader', 'webgl', 'p5.js', 'gsap', 'animation', 'motion',
      // General (long enough to be safe with includes())
      'design', 'prototyp', 'wireframe', 'color theory', 'illustration',
      'creative', 'a11y',
    ],
  },
  {
    id: 'engineering',
    label: 'Engineering & Dev',
    color: '#34d399', // emerald
    designRelevant: true,
    keywords: [
      // Frameworks & languages
      'react', 'next.js', 'nextjs', 'typescript', 'javascript', 'tailwind',
      'python', 'swift', 'golang', 'rust', 'node.js', 'remix', 'astro',
      // Component libraries (popular with design engineers)
      'shadcn', 'radix ui', 'tanstack',
      // Backend & data
      'supabase', 'drizzle', 'prisma', 'trpc', 'stripe api', 'clerk auth',
      'postgres', 'sqlite',
      // Tools & platforms
      'cursor', 'github copilot', 'microsoft copilot', 'copilot ai',
      'github', 'vercel', 'docker', 'kubernetes', 'storybook', 'vite',
      'turborepo', 'pnpm',
      // Concepts
      'frontend', 'backend', 'fullstack', 'web development', 'web dev',
      'database', 'system design', 'software engineer', 'app development',
      'deployment', 'devops', 'architecture',
      // Channels & educators (tool/platform names only, not person names)
      'fireship', 't3.gg', 'jack herrington', 'laracasts', 'kevin powell',
      'josh tried coding', 'code with antonio', 'epic web',
      // General
      'programming', 'coding', 'developer', 'software', 'tutorial', 'computer science',
      // Short — word-boundary matched (see matchesKeyword)
      'css', 'html', 'git', 'api', 'aws',
    ],
  },
  {
    id: 'startup',
    label: 'Startups & Business',
    color: '#fbbf24', // amber
    designRelevant: true,
    keywords: [
      // Stages & mechanics
      'startup', 'founder', 'entrepreneur', 'fundraising', 'pitch deck', 'seed round',
      'series a', 'y combinator', 'ycombinator', 'venture capital', 'indie hacker',
      'product market fit', 'lean startup', 'go-to-market',
      // Community & discovery
      'bootstrapped', 'solopreneur', 'indie maker', 'indie dev',
      'product hunt', 'build in public', 'ship fast',
      // Roles & strategy
      'product manager', 'product strategy', 'product roadmap', 'b2b saas',
      'growth hacking', 'customer discovery', 'user interview',
      'landing page', 'cold email', 'customer acquisition',
      // Specific high-signal communities
      'dive club', 'my first million',
      // Building
      'side project', 'how to build',
      // Short — word-boundary matched
      'saas', 'mrr', 'mvp',
    ],
  },
  {
    id: 'fitness',
    label: 'Fitness & Sport',
    color: '#fb923c', // orange
    designRelevant: false,
    keywords: [
      'bjj', 'jiu-jitsu', 'mma', 'wrestling', 'grappling', 'martial arts',
      'fitness', 'workout', 'gym', 'training', 'athlete', 'sport', 'weight',
      'atos', 'jeanjaques', 'jiu jitsu', 'flo wrestling', 'flowtrestling',
    ],
  },
  {
    id: 'culture',
    label: 'Culture & Entertainment',
    color: '#a78bfa', // violet
    designRelevant: false,
    keywords: [
      'podcast', 'comedy', 'entertainment', 'clip', 'vlog', 'culture',
      'music', 'chess', 'gaming', 'pokemon', 'anime', 'movie', 'film',
      'talk show', 'hot take', 'highlights', 'viral',
    ],
  },
  {
    id: 'finance',
    label: 'Finance & Investing',
    color: '#6ee7b7', // teal
    designRelevant: false,
    keywords: [
      'stock market', 'invest', 'finance', 'trading', 'crypto', 'bitcoin', 'wealth',
      'budget', 'economy', 'inflation', 'hedge fund', 'real estate',
    ],
  },
];

/**
 * Match a single keyword against text.
 * Short keywords (≤3 chars) use word-boundary regex to prevent substring false positives.
 * e.g. 'ai' must not match "att[ai]nable" — only standalone "AI".
 * Longer keywords use plain includes() for performance.
 */
function matchesKeyword(text: string, kw: string): boolean {
  if (kw.length <= 3) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?<![a-z])${escaped}(?![a-z])`, 'i').test(text);
  }
  return text.includes(kw);
}

/** Assign a category to a channel/video based on keyword matching */
export function categorize(text: string): string {
  const lower = text.toLowerCase();
  for (const cat of CATEGORIES) {
    if (cat.keywords.some((kw) => matchesKeyword(lower, kw))) {
      return cat.id;
    }
  }
  return 'other';
}

/**
 * Returns true if the text matches the domain blocklist.
 * Blocklisted content is excluded before category classification.
 */
export function isBlocklisted(text: string): boolean {
  const lower = text.toLowerCase();
  return DOMAIN_BLOCKLIST.some((term) => lower.includes(term));
}

export function getCategoryById(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function getDesignRelevantCategories(): typeof CATEGORIES {
  return CATEGORIES.filter(c => c.designRelevant);
}

export const CATEGORY_COLOR_OTHER = '#6b7280'; // gray

/** AI-related channel and video keywords for the "AI Native" signal */
export const AI_TOOLS_TIMELINE: { name: string; keywords: string[]; mainstreamDate: Date }[] = [
  { name: 'ChatGPT', keywords: ['chatgpt', 'chat gpt', 'openai'], mainstreamDate: new Date('2022-11-30') },
  { name: 'Midjourney', keywords: ['midjourney'], mainstreamDate: new Date('2022-07-12') },
  { name: 'GPT-4', keywords: ['gpt-4', 'gpt4', 'gpt 4'], mainstreamDate: new Date('2023-03-14') },
  { name: 'Claude', keywords: ['claude', 'anthropic'], mainstreamDate: new Date('2023-03-14') },
  { name: 'Stable Diffusion', keywords: ['stable diffusion'], mainstreamDate: new Date('2022-08-22') },
  { name: 'Sora', keywords: ['sora'], mainstreamDate: new Date('2024-02-15') },
  { name: 'Cursor', keywords: ['cursor ai', 'cursor editor'], mainstreamDate: new Date('2024-01-01') },
  { name: 'Runway', keywords: ['runway ml', 'runway gen'], mainstreamDate: new Date('2023-06-01') },
  { name: 'Gemini', keywords: ['gemini', 'google ai', 'bard'], mainstreamDate: new Date('2023-12-06') },
  { name: 'ElevenLabs', keywords: ['elevenlabs', 'eleven labs'], mainstreamDate: new Date('2023-01-23') },
];
