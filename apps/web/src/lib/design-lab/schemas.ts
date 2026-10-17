import { z } from 'zod'

// ─── Surface Grammar ──────────────────────────────────────────────────────────
export const SurfaceGrammarSchema = z.object({
  /** How adjacent slots are visually separated */
  separator: z.enum(['rule', 'space', 'band', 'box']),
  /** Maximum visible nesting depth of containers (0 = flat) */
  nesting_depth: z.union([z.literal(0), z.literal(1)]),
  /** Max simultaneously visible containers at the same level */
  max_visible_containers: z.number().int().min(1).max(8),
})

export type SurfaceGrammar = z.infer<typeof SurfaceGrammarSchema>

// ─── Token Palette ────────────────────────────────────────────────────────────
const HexColorSchema = z.string().regex(/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/, 'must be #RGB or #RRGGBB')

export const PaletteSchema = z.object({
  canvas: HexColorSchema,
  surface: HexColorSchema,
  surface_subtle: HexColorSchema,
  border: HexColorSchema,
  ink: HexColorSchema,
  ink_muted: HexColorSchema,
  accent: HexColorSchema,
  accent_fg: HexColorSchema,
  signal: HexColorSchema.optional(),
})

export type Palette = z.infer<typeof PaletteSchema>

// ─── Typography Token ─────────────────────────────────────────────────────────
const TypeScaleEntrySchema = z.object({
  /** CSS font-family value (reference CSS var or literal) */
  fontFamily: z.string(),
  fontSize: z.string(),
  fontWeight: z.number().int(),
  lineHeight: z.string().optional(),
  fontVariantNumeric: z.enum(['tabular-nums', 'proportional-nums', 'normal']).optional(),
  letterSpacing: z.string().optional(),
})

export const TypographySchema = z.object({
  /** CSS var or family name for display/headline text */
  displayFamily: z.string(),
  /** CSS var or family name for body/UI text */
  bodyFamily: z.string(),
  /** CSS var or family name for monospaced/numeric text */
  monoFamily: z.string(),
  scale: z.object({
    display: TypeScaleEntrySchema,
    headline: TypeScaleEntrySchema,
    body: TypeScaleEntrySchema,
    label: TypeScaleEntrySchema,
    mono: TypeScaleEntrySchema,
  }),
})

export type Typography = z.infer<typeof TypographySchema>

// ─── Spacing, Radius, Elevation ──────────────────────────────────────────────
export const SpacingSchema = z.object({
  xs: z.string(),
  sm: z.string(),
  md: z.string(),
  lg: z.string(),
  xl: z.string(),
})

export const RadiusSchema = z.object({
  none: z.literal('0px'),
  sm: z.string(),
  md: z.string(),
  lg: z.string(),
})

export const ElevationSchema = z.object({
  /** CSS box-shadow value for base elevation */
  base: z.string(),
  /** CSS box-shadow for raised surfaces */
  raised: z.string(),
})

// ─── Theme ────────────────────────────────────────────────────────────────────
export const ThemeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  tagline: z.string().max(120),
  archetype: z.string(),
  material_metaphor: z.string(),
  palette: PaletteSchema,
  typography: TypographySchema,
  spacing: SpacingSchema,
  radius: RadiusSchema,
  elevation: ElevationSchema,
  surface_grammar: SurfaceGrammarSchema,
  /** Exactly 3 measurable signature moves */
  signature_moves: z.tuple([
    z.object({ move: z.string(), spec: z.string() }),
    z.object({ move: z.string(), spec: z.string() }),
    z.object({ move: z.string(), spec: z.string() }),
  ]),
  fit: z.array(z.string()).min(1),
  avoid: z.array(z.string()).min(1),
  do: z.array(z.string()).min(1),
  dont: z.array(z.string()).min(1),
})

export type Theme = z.infer<typeof ThemeSchema>

// ─── Slot ─────────────────────────────────────────────────────────────────────
export const SlotRoleSchema = z.enum([
  'header',        // page/screen title and primary action
  'toolbar',       // secondary controls, filters, search
  'primary',       // main content area
  'supporting',    // supplementary/secondary content
  'aside',         // detail panel, sidebar
  'actions',       // primary CTA(s)
  'status',        // empty, loading, error states
])

export const SlotSchema = z.object({
  role: SlotRoleSchema,
  /** How many units tall (relative weight) */
  weight: z.number().int().min(1),
  optional: z.boolean().default(false),
})

// ─── Template ─────────────────────────────────────────────────────────────────
/** Screen types — templates are reusable by screen type, not industry */
export const ScreenTypeSchema = z.enum([
  'list-table',
  'detail',
  'form',
  'summary',
  'settings',
  'onboarding',
  'landing',
  'sign-in',
  'cli-terminal',
])

export type ScreenType = z.infer<typeof ScreenTypeSchema>

export const TemplateBehaviorSchema = z.object({
  sortable: z.boolean().default(false),
  filterable: z.boolean().default(false),
  empty_state: z.string(),
  loading_state: z.string(),
  error_state: z.string(),
})

export const GrammarVariantSchema = z.object({
  separator: z.enum(['rule', 'space', 'band', 'box']),
  /** CSS class name or token key */
  rowClass: z.string(),
  /** CSS class name or token key */
  groupClass: z.string(),
  notes: z.string().optional(),
})

export const TemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  screen_type: ScreenTypeSchema,
  purpose: z.string(),
  /** What kind of content this screen manages */
  content_model: z.string(),
  /** Ordered slots, highest priority first */
  slots: z.array(SlotSchema).min(2),
  behavior: TemplateBehaviorSchema,
  responsive: z.object({
    /** How layout adapts below 480px */
    mobile: z.string(),
    /** Any tablet-specific notes */
    tablet: z.string().optional(),
  }),
  /** Per-separator variant styling instructions */
  grammar_variants: z.record(
    z.enum(['rule', 'space', 'band', 'box']),
    GrammarVariantSchema,
  ),
  /** IDs of themes that pair naturally with this template */
  compatible_themes: z.array(z.string()).default([]),
})

export type Template = z.infer<typeof TemplateSchema>

// ─── Selection (serializable) ─────────────────────────────────────────────────
export const SelectionSchema = z.object({
  mode: z.enum(['agent', 'manual']),
  themeId: z.string(),
  /** Maps screen_type → templateId.
   *  The Design Lab preview uses a single active template; this record
   *  supports per-screen mapping for generator consumption. */
  templateByScreen: z.record(ScreenTypeSchema, z.string()),
})

export type Selection = z.infer<typeof SelectionSchema>

// ─── Recommendation I/O ───────────────────────────────────────────────────────
export const RecommendContextSchema = z.object({
  /** e.g. "DASHBOARD", "API_SERVICE", "CRUD_APP" */
  projectType: z.string().optional(),
  /** brief phrase from user's idea */
  ideaSnippet: z.string().optional(),
  /** data density signal */
  dataDense: z.boolean().optional(),
  /** is the primary interface a CLI? */
  cli: z.boolean().optional(),
})

export type RecommendContext = z.infer<typeof RecommendContextSchema>

export const RecommendResultSchema = z.object({
  themeId: z.string(),
  templateId: z.string(),
  reasons: z.array(z.string()),
})

export type RecommendResult = z.infer<typeof RecommendResultSchema>
