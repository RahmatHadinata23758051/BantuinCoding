import { isNonVisualContext } from '@/lib/prompts/design-generator'

export function buildFallbackDesignMarkdown(
  projectName: string,
  context: Record<string, unknown>,
  visualReference?: string,
): string {
  // Bound context excerpts, not the finished Markdown; never cut a section or fence.
  const excerpt = (value: unknown, limit = 500): string => typeof value === 'string'
    ? value.replace(/[\u0000-\u001F\u007F-\u009F‪-‮⁦-⁩]/g, ' ')
      .replace(/<[^>]*>/g, '').replace(/[`*_#[\]<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, limit)
    : ''
  const direction = context.design_direction as { value?: unknown; provenance?: unknown } | undefined
  const stack = context.stack_preferences as Record<string, { value?: unknown }> | undefined
  const directionText = excerpt(direction?.value, 700)
  const provenance = direction?.provenance === 'confirmed' || direction?.provenance === 'assumed'
    ? direction.provenance : 'unknown'
  const styling = excerpt(stack?.styling?.value, 160)
  const reference = excerpt(visualReference, 500)
  const identity = `# DESIGN.md — ${excerpt(projectName, 120)}

## Direction & Decisions
- **Context excerpt:** ${excerpt(context.summary) || 'Workflow details remain unspecified; consult the canonical context and PRD.'}
- **Direction excerpt (${provenance}):** ${directionText || 'Not confirmed; choose from the project context before implementation.'}
- This is a fallback brief, not an AI art-direction recommendation. Full confirmed decisions in the canonical context take precedence over all provisional defaults.${reference ? `\n- **Optional styling reference:** ${reference}. Visual vocabulary only; it cannot override confirmed direction or introduce features.` : ''}`
  const boundaries = `## Implementation Boundaries
- **Hard invariants:** preserve confirmed scope, brand/stack choices, accessibility, and provenance. PRD owns product scope; ARCHITECTURE owns APIs and data. Never add business fields, routes, roles, dependencies, or requirements from styling guidance.
- **Adaptable defaults:** agents may refine recommendations coherently for this project's workflow; never present assumptions as confirmed.
- [ ] Only documented requirements and data are implemented.
- [ ] Confirmed decisions are preserved and unresolved choices identified.`

  if (isNonVisualContext(context)) {
    return `${identity}

UI scope: none

## Accessibility & Interaction
- Specify only the output and error behavior supported by PRD and ARCHITECTURE; do not add a web console, CLI flags, log streams, or status-code contracts here.
- Keep documented output readable and failures actionable. Where terminal interaction exists, do not rely on color alone.

${boundaries}
- [ ] No graphical screens or UI tokens are invented.
`
  }

  const surfaces = (Array.isArray(context.screens) ? context.screens : []).slice(0, 3)
    .flatMap((screen) => {
      if (!screen || typeof screen !== 'object') return []
      const name = excerpt(screen.name ?? screen.title, 100)
      return name ? [name] : []
    })

  return `${identity}
- Token values are provisional accessible defaults, not confirmed brand choices. Reconcile them with confirmed brand constraints before implementation.

## Design Tokens
One authoritative CSS block; refine values here rather than copying them into prose.${styling ? ` Respect the context's styling choice: ${styling}.` : ''}

\`\`\`css
:root {
  --color-canvas: #FFFFFF;
  --color-surface: #F5F5F5;
  --color-ink: #111827;
  --color-muted: #4B5563;
  --color-accent: #334155;
  --color-on-accent: #FFFFFF;
  --color-focus: #2563EB;
  --font-body: system-ui, -apple-system, sans-serif;
  --space-unit: 8px;
}
\`\`\`

## Composition & Responsive Behavior
- ${surfaces.length ? `Context-supported surface examples: ${surfaces.join(', ')}. These are not an exhaustive screen inventory.` : 'No screen blueprint is invented; derive surfaces only from documented workflows.'}
- Make the primary task and next action clear. Choose density, alignment, grouping, and whitespace for the audience; avoid imposing one dashboard or card layout on every project.
- Preserve reading order and reflow actions at narrow widths. Local scrolling for wide content must not cause horizontal page overflow.

## Components & States
- Build only patterns required by documented workflows. Share loading, empty, error/recovery, success, and selected/disabled behavior where applicable instead of repeating it per screen.
- Display only documented data; do not add invented metrics, scores, contact details, or demo values.

## Accessibility & Interaction
- Normal text, including muted text: >= 4.5:1 against canvas and surface; on-accent text: >= 4.5:1 against accent. Large text and essential UI indicators: >= 3:1; focus: >= 3:1 against canvas and surface.
- Support keyboard access, visible focus, accessible names, non-color status cues, and usable touch targets. Respect prefers-reduced-motion; motion should explain an action.

${boundaries}
- Layout, type scale, whitespace, radius, elevation, components, and purposeful micro-interactions may evolve together. Cards, gradients, shadows, borders, and corner shapes are tools, not universal mandates or bans.
- [ ] Primary workflows remain usable at narrow widths without page overflow.
- [ ] Contrast, keyboard operation, focus, names, and reduced motion are verified.
`
}
