import { TemplateFamilyId, TemplateFamilyMeta } from './types'

export const TEMPLATE_FAMILIES: Record<TemplateFamilyId, TemplateFamilyMeta> = {
  'structured-enterprise': {
    id: 'structured-enterprise',
    name: 'Structured Enterprise',
    version: '0.1.0',
    archetype: 'Operational clarity / systematic productivity',
    thesis: 'An interface that makes complex work feel controlled. Information is organized by task, urgency, and next action—not by a decorative grid of identical cards.',
    mood: 'Precise, credible, composed, efficient',
    fit: [
      'Inventory Management',
      'ERP / Internal Tooling',
      'Clinic Administration',
      'B2B Operations & Logistics',
      'Complex Data Workspaces'
    ],
    watchOuts: [
      'Image-led consumer brand storytelling',
      'Immersive art portfolios',
      'Decorative bento boxes without data density'
    ],
    signatureMoves: [
      'Command band with single primary action',
      'Dense tabular data with split inspector drawer',
      'Borderless stat-rail with tabular numerals',
      'Strict radius system (6-12px) without pill buttons'
    ],
    tokens: {
      canvas: '#F4F6F8',
      surface: '#FFFFFF',
      surfaceMuted: '#E9EEF2',
      text: '#17222D',
      textMuted: '#546575',
      accent: '#245E84',
      border: '#D5DFE7',
      success: '#20755D',
      warning: '#A05C08',
      danger: '#B83C49'
    },
    typography: {
      headingFont: 'IBM Plex Sans, sans-serif',
      bodyFont: 'Source Sans 3, sans-serif',
      monoFont: 'IBM Plex Mono, monospace'
    },
    supportedArchetypes: [
      'operational-workspace',
      'management-overview',
      'transactional-flow'
    ]
  },
  'editorial-craft': {
    id: 'editorial-craft',
    name: 'Editorial Craft',
    version: '0.1.0',
    archetype: 'Narrative depth / literary cadence',
    thesis: 'Content, cadence, and typographic expression are the product. The interface unfolds through deliberate composition and pacing rather than a stack of uniform components.',
    mood: 'Thoughtful, literary, cultured, patient',
    fit: [
      'Publishing & Media',
      'Research Monographs & Whitepapers',
      'Curation Platforms',
      'Cultural Archives'
    ],
    watchOuts: [
      'High-frequency real-time stock dashboards',
      'Dense transactional spreadsheets'
    ],
    signatureMoves: [
      'Asymmetrical multi-column typographic layouts',
      'Deep serif headlines with generous leading',
      'Marginalia and side-rail commentary'
    ],
    tokens: {
      canvas: '#F8F6F0',
      surface: '#FFFFFF',
      surfaceMuted: '#EFECE6',
      text: '#1C1917',
      textMuted: '#78716C',
      accent: '#854D0E',
      border: '#E7E5E4',
      success: '#15803D',
      warning: '#B45309',
      danger: '#B91C1C'
    },
    typography: {
      headingFont: 'Newsreader, Georgia, serif',
      bodyFont: 'Source Serif 4, serif',
      monoFont: 'JetBrains Mono, monospace'
    },
    supportedArchetypes: ['operational-workspace', 'management-overview']
  },
  'precision-technical': {
    id: 'precision-technical',
    name: 'Precision Technical',
    version: '0.1.0',
    archetype: 'Instrumentation / verified accuracy',
    thesis: 'An interface as trustworthy as an instrument panel: exact units, stable alignment, discernible states, and controlled signal density. Technical credibility comes from accuracy, not neon decoration.',
    mood: 'Analytical, disciplined, rigorous, quiet',
    fit: [
      'Developer Platforms & APIs',
      'Observability & Telemetry Consoles',
      'Scientific Instrument Control',
      'Industrial Hardware Telemetry'
    ],
    watchOuts: [
      'Decorative animations that obscure real metrics',
      'Vague marketing copy replacing exact measurements'
    ],
    signatureMoves: [
      'Hairline dividers (1px) with zero ambient glow',
      'Tabular numbers on all telemetry outputs',
      'Visual signal status matrix'
    ],
    tokens: {
      canvas: '#0D1117',
      surface: '#161B22',
      surfaceMuted: '#21262D',
      text: '#E6EDF3',
      textMuted: '#8B949E',
      accent: '#2F81F7',
      border: '#30363D',
      success: '#238636',
      warning: '#D29922',
      danger: '#F85149'
    },
    typography: {
      headingFont: 'Space Grotesk, sans-serif',
      bodyFont: 'Inter, sans-serif',
      monoFont: 'JetBrains Mono, monospace'
    },
    supportedArchetypes: ['operational-workspace', 'management-overview']
  },
  'expressive-creative': {
    id: 'expressive-creative',
    name: 'Expressive Creative',
    version: '0.1.0',
    archetype: 'Distinctive voice / unapologetic brand',
    thesis: 'A memorable digital voice built from daring composition and confident typography. Expression is purposeful: the brand has one distinct move instead of fifty competing gimmicks.',
    mood: 'Vibrant, bold, artistic, visionary',
    fit: [
      'Creative Studios & Agencies',
      'Fashion & Independent Labels',
      'Music & Festival Platforms',
      'Product Launch Experiences'
    ],
    watchOuts: [
      'Critical medical administration or compliance systems',
      'High-density financial auditing tools'
    ],
    signatureMoves: [
      'Kinetic typography moments',
      'Deliberate asymmetric layout breaks',
      'High-contrast focal points'
    ],
    tokens: {
      canvas: '#F5F3EF',
      surface: '#FFFFFF',
      surfaceMuted: '#EAE6DF',
      text: '#121212',
      textMuted: '#666666',
      accent: '#FF4A22',
      border: '#121212',
      success: '#10B981',
      warning: '#F59E0B',
      danger: '#EF4444'
    },
    typography: {
      headingFont: 'Clash Display, sans-serif',
      bodyFont: 'General Sans, sans-serif',
      monoFont: 'Space Mono, monospace'
    },
    supportedArchetypes: ['management-overview', 'transactional-flow']
  },
  'calm-and-human': {
    id: 'calm-and-human',
    name: 'Calm & Human',
    version: '0.1.0',
    archetype: 'Thoughtful pacing / low cognitive load',
    thesis: 'A quiet interface that respects attention, reduces anxiety, and helps people complete meaningful tasks without friction. Friendly does not mean childish; clarity is the warmth.',
    mood: 'Serene, inviting, empathetic, clear',
    fit: [
      'Mental Health & Wellness Apps',
      'Caregiver & Patient Portals',
      'Personal Budgeting & Financial Planning',
      'Community Education & Mentorship'
    ],
    watchOuts: [
      'Fast-paced trading terminals',
      'High-density system administration'
    ],
    signatureMoves: [
      'Warm natural tones with soft contrast',
      'Generous whitespace breathing room',
      'Single-focus step sequences'
    ],
    tokens: {
      canvas: '#F9F8F6',
      surface: '#FFFFFF',
      surfaceMuted: '#F1EFEA',
      text: '#2C3437',
      textMuted: '#6C757D',
      accent: '#3D7068',
      border: '#E2DFD8',
      success: '#4A7C59',
      warning: '#C28238',
      danger: '#B34A4A'
    },
    typography: {
      headingFont: 'Plus Jakarta Sans, sans-serif',
      bodyFont: 'Plus Jakarta Sans, sans-serif',
      monoFont: 'IBM Plex Mono, monospace'
    },
    supportedArchetypes: ['operational-workspace', 'transactional-flow']
  },
  'refined-luxury': {
    id: 'refined-luxury',
    name: 'Refined Luxury',
    version: '0.1.0',
    archetype: 'Subtle elegance / meticulous craftsmanship',
    thesis: 'Confidence through restraint. Editorial craft, impeccable pacing, and imagery do the persuasive work; every extra ornament must earn its place. Luxury is precision and authenticity, not black-and-gold decoration.',
    mood: 'Understated, immaculate, prestigious, serene',
    fit: [
      'High-End Architectural Portfolios',
      'Fine Goods & Bespoke Craft Catalogs',
      'Private Wealth & Family Office Portals',
      'Exclusive Hospitality & Dining Reservations'
    ],
    watchOuts: [
      'Cluttered feature-heavy dashboards',
      'Noisy promotional popups and banners'
    ],
    signatureMoves: [
      'Strict geometric proportions (golden ratio)',
      'Understated monochrome with singular bronze/slate accent',
      'Immaculate macro-photography staging'
    ],
    tokens: {
      canvas: '#FBFBFA',
      surface: '#FFFFFF',
      surfaceMuted: '#F3F3F1',
      text: '#141413',
      textMuted: '#706E6B',
      accent: '#5E5245',
      border: '#E5E4E2',
      success: '#2E5A44',
      warning: '#9C6B30',
      danger: '#8E2828'
    },
    typography: {
      headingFont: 'Cormorant Garamond, serif',
      bodyFont: 'Inter, sans-serif',
      monoFont: 'IBM Plex Mono, monospace'
    },
    supportedArchetypes: ['management-overview', 'transactional-flow']
  }
}

export function getTemplateFamily(id: TemplateFamilyId): TemplateFamilyMeta {
  return TEMPLATE_FAMILIES[id] ?? TEMPLATE_FAMILIES['structured-enterprise']
}

export function listTemplateFamilies(): TemplateFamilyMeta[] {
  return Object.values(TEMPLATE_FAMILIES)
}
