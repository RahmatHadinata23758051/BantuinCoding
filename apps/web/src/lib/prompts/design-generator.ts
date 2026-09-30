import { z } from 'zod'

// ============================================================
// DESIGN Generator Prompt & Schema Module (BK-023)
// Generates Project-Specific DESIGN.md from Canonical Context
// Anchored in Curated World-Class Design References:
// - styles.refero.design (Refero: SaaS visual styles & screen patterns)
// - saasframe.io (SaaSframe: High-conversion SaaS UI flows & data tables)
// - land-book.com (Land-book: Curated marketing web art direction & typography)
// - mobbin.com (Mobbin: Production benchmarks: Linear, Stripe, Raycast, Notion, Airbnb, Vercel)
// - godly.website & minimal.gallery (Awwwards-tier micro-interactions & typography)
// - bentogrids.com & tremor.so (Bento grid modularity & KPI dashboard density)
// ============================================================

export const DesignDocumentSchema = z.object({
  title: z.string().default('DESIGN.md'),
  meta: z
    .object({
      generatedAt: z.string().optional(),
      contextVersion: z.number().optional(),
      provenance: z.record(z.string(), z.enum(['confirmed', 'assumed', 'unknown'])).optional(),
    })
    .optional(),
  designArchetype: z
    .object({
      name: z.string(),
      category: z.string(),
      visualThesis: z.string(),
      benchmarkReferences: z.array(z.string()),
    })
    .optional(),
  brandIdentity: z
    .object({
      logoConcept: z.string().optional(),
      logoSvg: z.string().optional(),
      faviconSvg: z.string().optional(),
    })
    .optional(),
  designSystem: z
    .object({
      colorPalette: z
        .array(
          z.object({
            name: z.string(),
            role: z.string(),
            hex: z.string(),
            usage: z.string(),
          }),
        )
        .optional(),
      typography: z
        .object({
          scale: z.string().optional(),
          fontFamilies: z
            .object({
              heading: z.string().optional(),
              body: z.string().optional(),
              mono: z.string().optional(),
            })
            .optional(),
          hierarchy: z.array(z.string()).optional(),
        })
        .optional(),
      spacing: z
        .object({
          baseUnit: z.string().optional(),
          scale: z.array(z.string()).optional(),
          rules: z.array(z.string()).optional(),
        })
        .optional(),
      borders: z
        .object({
          width: z.string().optional(),
          radius: z.string().optional(),
          tokens: z.array(z.string()).optional(),
        })
        .optional(),
      shadows: z
        .array(
          z.object({
            elevation: z.string(),
            token: z.string(),
            usage: z.string(),
          }),
        )
        .optional(),
      motion: z
        .object({
          reducedMotion: z.boolean().optional(),
          durations: z.array(z.string()).optional(),
          easings: z.array(z.string()).optional(),
          rules: z.array(z.string()).optional(),
        })
        .optional(),
      components: z
        .array(
          z.object({
            name: z.string(),
            variants: z.array(z.string()).optional(),
            states: z.array(z.string()).optional(),
            a11yNotes: z.string().optional(),
          }),
        )
        .optional(),
      composition: z
        .object({
          grid: z.string().optional(),
          asymmetry: z.string().optional(),
          density: z.string().optional(),
          rules: z.array(z.string()).optional(),
        })
        .optional(),
      tokens: z
        .object({
          cssVariables: z.record(z.string(), z.string()).optional(),
          tailwindConfig: z.record(z.string(), z.unknown()).optional(),
        })
        .optional(),
    })
    .optional(),
  applicationDesign: z
    .object({
      pages: z
        .array(
          z.object({
            route: z.string(),
            purpose: z.string(),
            keyComponents: z.array(z.string()).optional(),
            responsiveBehavior: z.string().optional(),
          }),
        )
        .optional(),
      userFlows: z
        .array(
          z.object({
            name: z.string(),
            steps: z.array(z.string()),
            entryPoints: z.array(z.string()).optional(),
            exitPoints: z.array(z.string()).optional(),
          }),
        )
        .optional(),
      responsiveBreakpoints: z
        .array(
          z.object({
            name: z.string(),
            width: z.string(),
            layoutShifts: z.array(z.string()).optional(),
          }),
        )
        .optional(),
      accessibility: z
        .object({
          wcagLevel: z.string().optional(),
          colorContrast: z.string().optional(),
          keyboardNavigation: z.string().optional(),
          screenReader: z.string().optional(),
        })
        .optional(),
      internationalization: z
        .object({
          rtlSupport: z.boolean().optional(),
          fontFallbacks: z.array(z.string()).optional(),
          textExpansion: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  implementationGuidance: z
    .object({
      cssArchitecture: z.string().optional(),
      componentLibrary: z.string().optional(),
      themingStrategy: z.string().optional(),
      darkMode: z.string().optional(),
      performanceBudget: z
        .array(
          z.object({
            metric: z.string(),
            target: z.string(),
          }),
        )
        .optional(),
    })
    .optional(),
  pipelineStrip: z
    .object({
      stages: z.array(z.string()).optional(),
      variant: z.enum(['default', 'minimal']).optional(),
    })
    .optional(),
  markdown_content: z.string().describe('Full formatted DESIGN.md content in Markdown'),
})

export type DesignDocumentOutput = z.infer<typeof DesignDocumentSchema>

export const DESIGN_GENERATOR_SYSTEM_PROMPT = `You are a Principal Design System Architect & Creative Director with world-class expertise in digital product design, benchmarked against elite design portals:
- styles.refero.design (Refero: SaaS visual styles & real-world production screen patterns)
- saasframe.io (SaaSframe: High-conversion SaaS UI flows, auth split-screens, data tables)
- land-book.com (Land-book: Curated marketing web art direction & typography)
- mobbin.com (Mobbin: Real-world benchmarks from Linear, Stripe, Raycast, Notion, Airbnb, Vercel)
- godly.website & minimal.gallery (Awwwards-tier micro-interactions, typography, and negative space)
- bentogrids.com & tremor.so (Bento grid modularity, KPI metric cards, and dashboard data density)

Your output must strictly follow the provided JSON schema.
The markdown_content field must contain a complete, bespoke, production-ready, expensive-feeling DESIGN.md file in GitHub-flavored Markdown.

MANDATORY ANTI-DEFAULT RULE:
- NEVER default to Neo-Brutalism or BantuinCoding's internal comic-editorial paper/ink theme (#F7F0DF, 2-3px comic borders, hard offset shadows, speech bubbles) UNLESS the user explicitly requested "neo-brutalist" in canonical_context.design_direction!
- You MUST dynamically select the design archetype that organically fits THIS SPECIFIC PROJECT from the Curated Reference Archetypes below.

CURATED REFERENCE ARCHETYPES (Match the project to the single best-fitting archetype):
1. Modern Enterprise SaaS & Corporate Crisp (Benchmark: Refero Clean SaaS, SaaSframe, Stripe, Ramp):
   - Best for: Operations, inventory, warehouse, logistics, B2B SaaS, CRM, ERP, billing.
   - Aesthetics: Clean slate canvas (#F8FAFC), pure white elevated surfaces (#FFFFFF), refined 1px subtle borders (#E2E8F0), royal sapphire (#2563EB) or deep emerald (#059669) primary accent, layered soft ambient shadows.
   - Typography: Plus Jakarta Sans (headings) + Inter (body), crisp modular scale.
2. Precision DevTools & Dark Monolith (Benchmark: Mobbin Linear, Raycast, Vercel, Supabase):
   - Best for: Developer tools, CLI, APIs, cloud platforms, telemetry, AI infrastructure.
   - Aesthetics: Deep obsidian/charcoal canvas (#08090A), 1px hairline border (rgba(255,255,255,0.08)), neon cyan or electric violet accents, monospace metadata chips.
   - Typography: Geist Sans / Inter + JetBrains Mono.
3. High-Density Fintech & Data Engine (Benchmark: Tremor.so, Stripe Dashboard, Mercury):
   - Best for: Banking, accounting, invoicing, trading, analytics.
   - Aesthetics: High-density canvas (#F9FAFB / #0F172A), emerald gain (#10B981), crimson loss (#EF4444), cobalt primary, strict tabular figures.
   - Typography: Inter + Roboto Mono, compact padding.
4. Warm Editorial & Literary Craft (Benchmark: Minimal.gallery, Land-book, Notion, Readwise):
   - Best for: Publishing, CMS, newsletters, documentation, architecture, boutique hospitality.
   - Aesthetics: Warm stone/linen canvas (#FBFBFA / #F7F5F0), deep ink text (#1C1917), warm brass or terracotta accents, generous leading.
   - Typography: Instrument Serif / Playfair Display (headings) + Instrument Sans / Inter (body).
5. Modern Minimalist Bento & Consumer App (Benchmark: BentoGrids.com, Mobbin Airbnb, Apple):
   - Best for: Productivity, consumer tools, task managers, personal finance, lifestyle.
   - Aesthetics: Soft neutral canvas (#F4F4F5), rounded cards (rounded-2xl), indigo/emerald accents, tactile pill badges.
   - Typography: Satoshi / Manrope + Inter.
6. Vibrant Creative & Dynamic Studio (Benchmark: Godly.website, Land-book, Framer, Pitch):
   - Best for: Creative tools, portfolio, Web3, creator economy, gaming hubs.
   - Aesthetics: High-contrast canvas, electric primary (Cobalt #3B82F6 or Magenta #EC4899), high visual rhythm.
   - Typography: Clash Display / Bricolage Grotesque + Satoshi.
7. Calm HealthTech & Bio-Clean (Benchmark: Refero Soft & Subtle, health apps):
   - Best for: Healthcare, medical, telemedicine, wellness, mental health.
   - Aesthetics: Soothing seafoam/sage canvas (#F0FDF4), restorative teal (#0D9488), soft ambient drop shadows.
   - Typography: Plus Jakarta Sans + Inter.
8. Neo-Brutalist Comic / Retro Pop (Benchmark: Gumroad):
   - ONLY if explicitly requested in canonical_context.design_direction.

DESIGN SYSTEM DELIVERABLES (IN EVERY GENERATED DESIGN.MD):
1. Reference Archetype Citation: Explicitly name the chosen archetype and cite reference benchmarks (e.g. "Primary Style: Modern Enterprise SaaS & Operations Crisp inspired by styles.refero.design, saasframe.io data tables, and Stripe UI").
2. Brand Identity:
   - Provide a distinct geometric mark concept tailored to the project.
   - COMPLETE INLINE SVG CODE for the primary logo (viewBox 0 0 180 40).
   - COMPLETE INLINE SVG CODE for the adaptive favicon (viewBox 0 0 32 32 with @media (prefers-color-scheme: dark)).
3. Color System (60-30-10 Rule):
   - 60% Canvas/Background, 30% Surfaces/Cards/Borders, 10% Purposeful Action Accent.
   - Complete semantic tokens (Canvas, Surface Raised, Surface Subdued, Text Primary, Text Muted, Brand Primary, Secondary, Success, Warning, Danger).
   - Strict WCAG AA compliance (minimum 4.5:1 text contrast).
4. Typography System:
   - Google Fonts pairing (e.g. Plus Jakarta Sans + Inter) with import URL.
   - Complete modular scale (Display, H1-H4, Body, Caption, Mono) with exact font-size, line-height, and tracking.
5. Signature Screen Blueprints:
   - LUXURY SPLIT-SCREEN AUTH (Login & Register): 60% visual showcase column (ambient mesh/texture, display headline, live social proof pill, floating metrics card) + 40% high-intent form card (branded header, 1px bordered inputs with focus ring, password toggle, OAuth pill buttons, tactile submit button). NO plain Laravel Breeze centered white boxes!
   - BENTO-GRID DASHBOARD: 12-column responsive layout with 4 distinct card hierarchy tiles (Hero Metric, Live Stream, KPI Cards, Workflow Queue).
   - FILTERABLE DATA TABLE: Toolbar with search + faceted chips + density toggle, sortable sticky headers, status pills with micro-dots, pagination.
6. Iconography & Assets:
   - Lucide Icons (stroke 1.5px/1.75px, optical sizes 16/20/24px). Strictly ZERO emojis as UI icons.
7. Motion Choreography (Anime.js / Fluid Spring):
   - Custom easing curve: cubic-bezier(0.16, 1, 0.3, 1), active:scale-[0.98] press compression, -1px to -2px hover lifts.
   - Mandatory prefers-reduced-motion fallback.
8. Ready-to-Use Tokens:
   - Complete CSS Custom Properties (:root { ... } and .dark { ... }).
   - Complete Tailwind CSS config (theme.extend).
9. Anti-AI-Slop Checklist: Explicit rejections for this project.`

export function buildDesignGeneratorUserPrompt(
  projectName: string,
  contextJson: string,
  contextVersion: number,
): string {
  return `Project Name: ${projectName}
Canonical Context Version: ${contextVersion}

Canonical Project Context:
"""
${contextJson}
"""

DESIGN BRIEF & INSTRUCTIONS:
1. Analyze the project domain, classification, target users, and summary from the Canonical Project Context.
2. Select the single best-fitting design archetype from the Curated Reference Library (styles.refero.design, saasframe.io, land-book.com, mobbin.com, godly.website, bentogrids.com). DO NOT default to Neo-Brutalism unless explicitly requested!
3. BRAND ASSETS: Create a unique Logo concept and provide COMPLETE INLINE SVG CODE for both the Brand Logo (180x40) and Adaptive Favicon (32x32).
4. AUTH & SIGNATURE SCREENS: Provide architectural blueprints for:
   - Luxury Split-Screen Auth (Login / Register) with visual showcase + high-intent form card (strictly avoid plain centered white boxes).
   - Bento-Grid Dashboard (12-column responsive card layout).
   - Filterable Data Table (search toolbar, status chips, pagination).
5. TYPOGRAPHY & COLOR: Prescribe professional font pairings (e.g. Plus Jakarta Sans + Inter), 60-30-10 palette with multi-stop ambient shadows, and complete copy-pasteable CSS Variables + Tailwind config.
6. Generate the complete, project-specific DESIGN.md document output according to the schema.`
}
