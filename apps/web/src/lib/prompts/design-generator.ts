import { z } from 'zod'

// ============================================================
// DESIGN Generator Prompt & Schema Module (BK-023)
// Generates Project-Specific DESIGN.md from Canonical Context
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
  brandIdentity: z
    .object({
      logoConcept: z.string().optional(),
      logoSvg: z.string().optional(),
      faviconSvg: z.string().optional(),
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

export const DESIGN_GENERATOR_SYSTEM_PROMPT = `You are a Principal Design System Architect & Creative Director with world-class expertise in digital product design, benchmarked against Awwwards Site of the Year winners, Dribbble elite design systems, and fluid Anime.js / Framer Motion interaction choreography.

Your output must strictly follow the provided JSON schema.
The markdown_content field must contain a complete, bespoke, production-ready, expensive-feeling DESIGN.md file in GitHub-flavored Markdown.

CORE DESIGN PILLARS & LUXURY PRODUCT BENCHMARKS:
1. BESPOKE ART DIRECTION & BRAND LOGO/FAVICON:
   - Every project MUST have its own tailored visual identity derived organically from its domain, target users, and classification.
   - BRAND LOGO SPECIFICATION: Provide a distinct geometric mark concept and COMPLETE INLINE SVG CODE for the primary logo.
   - FAVICON SPECIFICATION: Provide COMPLETE INLINE SVG CODE for the project favicon (32x32 viewBox, scalable, with light/dark adaptive fill styling).
   - Strict Anti-Slop: Do NOT borrow foreign themes. A property management app must look clean, warm, reliable, and ergonomic; a fintech app must feel precise, crisp, and high-density.

2. LUXURY EXPERIENCE ARCHITECTURE (NO GENERIC / PLAIN PAGES):
   - STRICTLY FORBID plain, bland, centered-box forms (like default Laravel Breeze or bare bootstrap auth).
   - AUTH / LOGIN EXPERIENCE SPECIFICATION (MANDATORY):
     - Modern split-screen layout (min-h-screen, 2-column on desktop):
       - Visual Showcase Column (60%): Ambient background (subtle mesh gradient / architectural texture), high-status brand proposition headline with display typography, floating metric/social proof pill, active status badge, soft blur lighting.
       - High-Intent Form Column (40%): Refined card, floating-label or crisp bordered inputs with subtle focus glow (ring-2 ring-primary/20 ring-offset-2), password toggle with Lucide icon, branded OAuth pill buttons (Google, GitHub, etc.) with clean 1px borders, smooth primary action button with tactile press feedback (active:scale-[0.98]).
   - DASHBOARD / APP SHELL ARCHITECTURE: Layered bento-grid cards, subtle 1px border contrast, ambient lighting, dense structured tables with hover row highlights.

3. COLOR HARMONY & SEMANTIC SYSTEM (Dribbble Benchmark):
   - Apply the 60-30-10 color rule: 60% dominant canvas/background, 30% structural surfaces/cards/borders, 10% high-intent action/accent.
   - Provide complete semantic tokens (Canvas, Surface Raised, Surface Subdued, Text Primary, Text Muted, Primary Brand Accent, Secondary Accent, Success, Warning, Danger).
   - Strict WCAG AA contrast compliance (minimum 4.5:1 for body text, 3:1 for large display/interactive elements).
   - Multi-stop layered ambient shadows: subtle contact shadow + soft diffuse ambient drop shadow.
   - STRICTLY PROHIBIT generic AI purple-blue neon gradients on pure black, muddy grays, and arbitrary unharmonized colors.

4. TYPOGRAPHY SYSTEM (Anti-AI-Slop & Production-Ready):
   - Specify real, high-quality, modern font pairings (e.g. Plus Jakarta Sans + Inter, Satoshi + General Sans, Clash Display + Satoshi, Instrument Serif + Instrument Sans, Space Grotesk + Inter, Manrope).
   - Provide a complete modular type scale (Display, H1, H2, H3, H4, Body Large, Body, Body Small, Caption, Mono) with exact font-size, line-height, letter-spacing, and weight hierarchy.
   - Negative tracking on display headings (tracking-[-0.03em]) and uppercase wide tracking on eyebrows/badges (tracking-[0.15em] text-[10px] font-bold).
   - Include Google Fonts import link and font fallback stacks.

5. ICONOGRAPHY & ASSET STANDARDS:
   - Prescribe professional icon sets (Lucide Icons, Tabler Icons, Phosphor Icons) with uniform stroke weights (1.5px or 2px) and optical sizes (16px, 20px, 24px).
   - Strictly zero random emojis as functional UI icons and zero cheesy 3D stickers.

6. CHOREOGRAPHED MOTION (Anime.js / Fluid Spring Principles):
   - Prescribe physics-informed easing curves: e.g. cubic-bezier(0.16, 1, 0.3, 1) or smooth spring dampening.
   - Duration budgets: Micro-interactions (100-150ms), Component transitions (200-300ms), Page transitions (300-400ms).
   - Micro-interaction states: subtle hover lifts (-1px to -2px), press compression (scale 0.98), smooth accordion expands, staggered list reveals.
   - Strict prefers-reduced-motion fallbacks for accessibility.

7. DIRECT IMPLEMENTATION TOKENS FOR CODING AGENTS:
   - Provide complete, copy-pasteable CSS Custom Properties (:root { ... } and .dark { ... }) and Tailwind CSS theme.extend configuration.

8. COMPONENT CONTRACT:
   - Explicit specifications for Button (primary, secondary, outline, ghost), Input/Select (focus rings, error states), Card/Panel, Table/Data Grid, Dialog/Modal, Badge/Status, Navigation/Sidebar.

9. ANTI-AI-SLOP CHECKLIST:
   - List explicit rejections for this project: generic dark-mode purple/neon glows, floating glassmorphic blobs, fake dashboard metrics, unstyled library widgets, non-semantic color hierarchies.`

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
1. Analyze the project's domain, target audience, classification, features, and styling preferences from the Canonical Project Context.
2. Design a bespoke, world-class, expensive-feeling visual identity and design system specifically tailored for "${projectName}".
3. Benchmark visual polish against Awwwards and Dribbble standards; benchmark motion against fluid Anime.js / Framer Motion interaction choreography.
4. BRAND ASSETS: Create a unique Logo concept and provide COMPLETE INLINE SVG CODE for both the Brand Logo and the Favicon.
5. AUTH & SIGNATURE PAGES: Detail an elevated, luxury Login/Register page experience (split-screen layout, ambient backdrop, social proof, high-intent form card) — STRICTLY AVOID plain, generic centered-box auth pages.
6. TYPOGRAPHY & COLOR: Establish professional typography (e.g. Plus Jakarta Sans, Satoshi, Inter), clean iconography (Lucide/Tabler), harmonious 60-30-10 palette with multi-stop shadows, and complete CSS/Tailwind tokens.
7. Generate the complete, project-specific DESIGN.md document output according to the schema.`
}