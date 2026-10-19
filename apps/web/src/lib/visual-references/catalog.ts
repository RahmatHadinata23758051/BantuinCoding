export interface VisualReferenceItem {
  id: string
  name: string
  tagline: string
  description: string
  tags: string[]
  theme: 'light' | 'dark'
  accentColor: string
  surfaceColor: string
  canvasColor: string
  previewUrl: string
  dnaPrompt: string
}

export const VISUAL_REFERENCES: VisualReferenceItem[] = [
  {
    id: 'notion',
    name: 'Notion',
    tagline: 'Warm paper notebook under afternoon sun',
    description: 'Tactile off-white paper canvas, confident sans typography with compact letter-spacing, and sparse chromatic accents like sticky notes.',
    tags: ['Light Theme', 'Warm Paper', 'Editorial', 'Tactile Canvas', 'Minimalist'],
    theme: 'light',
    accentColor: '#0075de',
    surfaceColor: '#ffffff',
    canvasColor: '#f6f5f4',
    previewUrl: '/visual-references/notion/index.html',
    dnaPrompt: 'Warm paper notebook aesthetic with tactile off-white canvas (#f6f5f4), pure white cards with 1px hairline borders and 12px corners without heavy shadows. Notion blue (#0075de) as the primary chromatic CTA, ink black typography deployed at subtle alphas, and sparse warm callout accents (marigold, coral).',
  },
  {
    id: 'launchdarkly',
    name: 'LaunchDarkly',
    tagline: 'Neon control room with charcoal panels and violet pulses',
    description: 'Midnight control room with deep charcoal canvas, violet-blue electric pulse, monospace accents, and pill-soft components.',
    tags: ['Dark Theme', 'Control Room', 'Developer Tool', 'Violet Glow', 'High Contrast'],
    theme: 'dark',
    accentColor: '#405bff',
    surfaceColor: '#191919',
    canvasColor: '#0e0e0e',
    previewUrl: '/visual-references/launchdarkly/index.html',
    dnaPrompt: 'Midnight control room aesthetic with deep charcoal canvas (#0e0e0e), carbon surfaces (#191919), hairline borders, and luminous violet-to-blue gradient accents (#405bff to #7084ff). Dense, technical hierarchy with pill-soft controls (30-60px radii) and monospace accents.',
  },
  {
    id: 'plate',
    name: 'Plate',
    tagline: 'Modern hospitality & operational command with terracotta warmth',
    description: 'Clean, warm, and highly functional operational dashboard. Lots of breathable whitespace, crisp white cards, and confident terracotta orange accents.',
    tags: ['Light Theme', 'Clean Dashboard', 'Terracotta Accent', 'Operational', 'High Legibility'],
    theme: 'light',
    accentColor: '#ff6b35',
    surfaceColor: '#ffffff',
    canvasColor: '#f8f9fa',
    previewUrl: '/visual-references/plate/index.html',
    dnaPrompt: 'Clean, warm operational dashboard aesthetic with generous whitespace, crisp white cards with subtle hairline borders, and a signature terracotta-orange accent (#ff6b35) for active states and primary CTAs. High-legibility numbers, compact data tables, and purposeful status badges.',
  },
  {
    id: 'plite',
    name: 'Plate · The Pass',
    tagline: 'Vernacular kitchen ticket rail & operational clarity',
    description: 'Hospitality overview inspired by professional kitchen order rails. Thermal paper tickets, steel rail clip metaphor, Barlow and IBM Plex Mono typography, and alert-only red.',
    tags: ['Light Theme', 'Hospitality', 'Ticket Rail', 'Mono Print', 'Operational'],
    theme: 'light',
    accentColor: '#2b3438',
    surfaceColor: '#fbfcfa',
    canvasColor: '#e9edec',
    previewUrl: '/visual-references/plite/index.html',
    dnaPrompt: 'Professional kitchen ticket rail aesthetic with stainless steel wall canvas (#e9edec), thermal paper ticket surfaces (#fbfcfa) with hairline paper-edge outlines (#cbd3d1) and zigzag tear edges. High-contrast ink typography (#161d20), Barlow for UI/nav, IBM Plex Mono for receipts and ticket contents, Big Shoulders Display for headlines. Red (#c8281e) is reserved strictly for alerts and target deviations, never decorative.',
  },
  {
    id: 'ui',
    name: 'Shadcn UI',
    tagline: 'Clinical blueprint on frosted paper',
    description: 'Achromatic design-system workshop with pure white surfaces, soft neutral grays, large-radius cards, and strict geometric precision.',
    tags: ['Light Theme', 'Achromatic', 'Monochrome', 'Geometric', 'Developer Utility'],
    theme: 'light',
    accentColor: '#0a0a0a',
    surfaceColor: '#ffffff',
    canvasColor: '#f5f5f5',
    previewUrl: '/visual-references/ui/index.html',
    dnaPrompt: 'Achromatic design-system workshop aesthetic with pure white canvas (#ffffff), soft neutral gray surfaces (#fafafa, #f5f5f5), sharp hairline borders (#e5e5e5), and high-contrast ink black (#0a0a0a) typography. Quiet, disciplined, code-adjacent feel with zero decorative clutter.',
  },
]

export function getVisualReference(id: string): VisualReferenceItem | undefined {
  return VISUAL_REFERENCES.find((ref) => ref.id === id)
}

export function isValidVisualReferenceId(id: string): boolean {
  return VISUAL_REFERENCES.some((ref) => ref.id === id)
}
