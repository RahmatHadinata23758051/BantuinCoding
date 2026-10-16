export function buildFallbackDesignMarkdown(
  projectName: string,
  context: Record<string, unknown>,
): string {
  const rawSummary = String(context.summary || '').trim()
  const summary = rawSummary.toLowerCase()
  const classification = String(context.classification || '').toLowerCase()
  const designDirection = String((context.design_direction as { value?: string })?.value || '').trim()
  const styling = String(
    (context.stack_preferences as Record<string, { value?: string }>)?.styling?.value || 'framework-neutral CSS',
  )
  const contextText = JSON.stringify(context).toLowerCase()
  const hasAuth = /auth|login|register|sign.?in|password/.test(contextText)
  const hasDataView = /table|list|record|report|dashboard|admin|inventory|transaction/.test(contextText)

  const isExplicitNeoBrutalist = /neo-brutal|comic/.test(designDirection.toLowerCase())
  const isDeveloper = summary.includes('cli') || summary.includes('api') || summary.includes('developer') || classification.includes('api_service')
  const isEditorial = summary.includes('blog') || summary.includes('cms') || summary.includes('publishing') || summary.includes('newsletter')
  const isHealth = summary.includes('health') || summary.includes('clinic') || summary.includes('medical') || summary.includes('wellness')

  let archetype = 'Contemporary Institutional'
  let materialMetaphor = 'a working brief: facts are grouped by decision, not by decorative containers'
  let canvas = '#F2EEE6'
  let surface = '#FBF9F4'
  let ink = '#20251F'
  let muted = '#5E665D'
  let border = '#A8AEA2'
  let accent = '#8B4A2F'
  let headingFont = 'Source Serif 4'
  let bodyFont = 'Source Sans 3'

  if (isExplicitNeoBrutalist) {
    archetype = 'Neo-Brutalist Utility'
    materialMetaphor = 'a printed field manual with blunt section markers and decisive controls'
    canvas = '#EFE4C8'
    surface = '#FFF8E8'
    ink = '#171717'
    muted = '#5D5545'
    border = '#171717'
    accent = '#C34A2C'
    headingFont = 'Bricolage Grotesque'
  } else if (isDeveloper) {
    archetype = 'Industrial Monospace'
    materialMetaphor = 'a terminal runbook where commands, states, and outputs share one measured column'
    canvas = '#E7ECE8'
    surface = '#F8FAF7'
    ink = '#18231F'
    muted = '#53615B'
    border = '#8D9A93'
    accent = '#2C6E5A'
    headingFont = 'IBM Plex Mono'
    bodyFont = 'IBM Plex Sans'
  } else if (isEditorial) {
    archetype = 'Archival / Library Interface'
    materialMetaphor = 'an indexed reading room where titles, references, and annotations establish the path'
    canvas = '#EEE9DF'
    surface = '#FAF7F0'
    ink = '#29251F'
    muted = '#6B6257'
    border = '#B8AEA0'
    accent = '#7A4E32'
    headingFont = 'Literata'
  } else if (isHealth) {
    archetype = 'Clinical Chart'
    materialMetaphor = 'a chart-paper handoff where every status and unit can be read without color alone'
    canvas = '#E9F0EC'
    surface = '#F8FBF8'
    ink = '#173029'
    muted = '#557168'
    border = '#9CB4A9'
    accent = '#28745F'
    headingFont = 'Atkinson Hyperlegible'
    bodyFont = 'Source Sans 3'
  }

  const workflow = rawSummary || `the primary ${classification || 'project'} workflow`
  const screenBlueprint = hasAuth || hasDataView
    ? `- **Context-supported views:** ${hasAuth ? 'Authentication states are specified only if present in the context.' : ''}${hasDataView ? ' Data views use the actual project objects and density stated in the context.' : ''}
- **Responsive rule:** preserve reading order; move secondary controls below the primary task at widths below 768px.
- **State rule:** every context-supported view defines loading, empty, error, and success states without invented content.`
    : '- **Screen scope:** no screen blueprint is invented because the supplied context does not name a concrete UI journey. Add one when the context supplies a route and user task.'

  return `# DESIGN.md — ${projectName}

## 1. Design DNA
- **Visual thesis:** ${workflow} is represented as ${materialMetaphor}.
- **Dominant archetype:** ${archetype}
- **Evidence:** derived from the project summary, classification, and explicit design direction; no external visual reference was inspected.
- **Design direction:** ${designDirection || 'No explicit direction supplied; the fallback uses the domain evidence above.'}
- **Rejected direction 1:** A generic category template — rejected because it would make the project interchangeable with unrelated products.
- **Rejected direction 2:** A decorative, high-motion composition — rejected because it would compete with the primary task and reduce scanability.
- **Exactly three signature moves:**
  1. **Composition:** keep the primary workflow in one readable region with secondary actions attached to the object they affect.
  2. **Typography:** use ${headingFont} for hierarchy and ${bodyFont} for readable task copy; reserve monospace for identifiers or code.
  3. **Material / interaction:** use ${border} rules and ${accent} as a single action signal; motion reports state change only.
- **Visual invariants:** no invented screens or data; focus remains visible; color never carries meaning alone; all controls remain usable at 320px.

## 2. Color & Contrast System
| Token | Value | Role |
|---|---|---|
| canvas | ${canvas} | page background |
| surface | ${surface} | task surface |
| ink | ${ink} | primary text |
| muted | ${muted} | secondary text |
| border | ${border} | structural boundary |
| accent | ${accent} | primary action only |
| success | #28745F | positive state with text label |
| warning | #9A681F | warning state with text label |
| danger | #A33B35 | error state with text label |

- Do not force a color-ratio formula; use the palette by role and verify every foreground/background pair with an automated contrast test.
- Normal text targets at least 4.5:1; large text and required UI indicators target at least 3:1.
- Use shape, text, and status labels in addition to color.

## 3. Typography & Rhythm
- **Display:** ${headingFont}, with a licensed fallback stack for the project environment.
- **Body:** ${bodyFont}, with a readable sans-serif fallback.
- **Technical values:** use a monospace fallback only for code, IDs, and aligned numeric values.
- **Scale:** display 2.75rem/1.05; H1 2rem/1.15; H2 1.375rem/1.25; body 1rem/1.5; label 0.8125rem/1.3.
- **Measure:** keep prose between 45 and 78 characters per line; use tabular numerals only when values are compared.
- **Styling integration:** ${styling}; do not add a framework configuration that is not already used by the project.

## 4. Layout & Surface Grammar
- Use a 4px spacing base with 8, 12, 16, 24, and 32px intervals.
- Use 1px structural borders; reserve any offset elevation for controls that need a pressed-state cue.
- Use square or 4px corners for work surfaces; use a single 999px shape only for status markers where it carries semantic meaning.
- Desktop: primary task region plus an optional secondary rail when the context names one.
- Tablet: collapse the secondary rail beneath the primary task.
- Mobile: one column, 16px page gutters, 44px minimum touch targets, and no horizontal page scrolling.
- Surface hierarchy comes from grouping, spacing, and rules rather than identical cards.

## 5. Signature Screen Blueprints
${screenBlueprint}
- **Shared interaction states:** default, hover, focus-visible, active, disabled, loading, empty, and error states must use real project labels and never placeholder metrics.

## 6. Iconography & Interaction
- Select one icon family already supported by the project; if none is specified, use text labels and native controls before adding a dependency.
- Icons are semantic only, sized at 16 or 20px, and icon-only controls require an accessible name and tooltip.
- Keyboard focus uses a 2px ${accent} outline with a 2px offset.
- Motion is limited to state changes at 120ms or less and is disabled in prefers-reduced-motion.

## 7. Implementation Tokens
\`\`\`css
:root {
  --color-canvas: ${canvas};
  --color-surface: ${surface};
  --color-ink: ${ink};
  --color-muted: ${muted};
  --color-border: ${border};
  --color-accent: ${accent};
  --color-success: #28745F;
  --color-warning: #9A681F;
  --color-danger: #A33B35;
  --space-unit: 4px;
  --focus-ring: 2px solid var(--color-accent);
  --radius-surface: 4px;
  --motion-state: 120ms;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
\`\`\`

## 8. Anti-Defaults & Acceptance Checklist
- [ ] The primary screen and components map to named user tasks in canonical context.
- [ ] No screen, metric, testimonial, illustration, or route is invented.
- [ ] The palette contains one action accent and every contrast pair is verified automatically.
- [ ] Typography includes explicit fallbacks and does not rely on a browser default by accident.
- [ ] Surfaces do not all share the same container treatment.
- [ ] Focus, keyboard, loading, empty, error, and reduced-motion behavior are specified.
- [ ] Mobile layout remains readable at 320px without page-level horizontal overflow.
- [ ] Semantic state meaning is available through text or shape, not color alone.
`
}
