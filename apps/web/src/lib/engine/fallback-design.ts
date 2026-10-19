export function buildFallbackDesignMarkdown(
  projectName: string,
  context: Record<string, unknown>,
): string {
  const rawSummary = String(context.summary || '').trim()
  const designDirection = String((context.design_direction as { value?: string })?.value || '').trim()
  const styling = String(
    (context.stack_preferences as Record<string, { value?: string }>)?.styling?.value || '',
  )
  const contextText = JSON.stringify(context).toLowerCase()
  const hasAuth = /auth|login|register|sign.?in|password/.test(contextText)
  const hasDataView = /table|list|record|report|dashboard|admin|inventory|transaction/.test(contextText)
  const yaml = (value: string) => JSON.stringify(value)
  const visualDirection = designDirection || 'Not confirmed; choose from the project context before implementation.'
  const screenBlueprint = hasAuth || hasDataView
    ? `- **Context-supported views:** ${hasAuth ? 'Authentication states are described only if present in the context.' : ''}${hasDataView ? ' Data views use only project objects and density stated in the context.' : ''}
- **Responsive behavior:** preserve reading order and keep primary tasks usable at narrow widths.
- **Relevant states:** define loading, empty, error, success, and recovery states only for supported views.`
    : '- **Screen scope:** no screen blueprint is invented because the supplied context does not name a concrete UI journey.'

  return `---
name: ${yaml(`${projectName} Design System`)}
archetype: ${yaml(visualDirection)}
colors:
  canvas: "#FFFFFF"
  surface: "#F5F5F5"
  border: "#D1D5DB"
  ink-primary: "#111827"
  ink-muted: "#4B5563"
  accent: "#334155"
typography:
  display: { fontFamily: "system-ui, sans-serif" }
  headline: { fontFamily: "system-ui, sans-serif" }
  body: { fontFamily: "system-ui, sans-serif" }
  mono: { fontFamily: "ui-monospace, monospace" }
rounded:
  sm: "project-specific"
  md: "project-specific"
  lg: "project-specific"
spacing:
  xs: "project-specific"
  sm: "project-specific"
  md: "project-specific"
  lg: "project-specific"
iconography:
  library: "existing project library or choose during design"
  defaultStrokeWidth: "project-specific"
  sizes: { sm: "project-specific", md: "project-specific", lg: "project-specific" }
---
# DESIGN.md — ${projectName}

## 1. Design DNA
- **Visual direction:** ${designDirection || 'Not confirmed. Choose a direction that fits the project’s users, workflows, domain, and existing constraints.'}
- **Context:** ${rawSummary || 'The supplied context does not describe the project workflow in detail.'}
- **Decision status:** colors above are neutral fallback values, not confirmed brand choices. Choose typography, surfaces, layout, and component forms to support the confirmed project needs.
- Preserve explicit design direction and distinguish confirmed decisions from recommendations; do not invent product features or screens.

## 2. Color & Contrast System
Use the fallback colors as provisional values only. Select colors that support the project’s direction and semantic states; verify normal text contrast at 4.5:1 and large text and essential UI indicators at 3:1 or better. Never communicate state through color alone.

## 3. Typography & Rhythm
Use the listed system font stacks only as a fallback. Choose hierarchy, typefaces, sizing, and line lengths to suit the content and existing stack.${styling ? ` Styling integration: ${styling}.` : ''}

## 4. Layout & Spatial System
Determine composition, spacing, responsive regions, corner shapes, borders, shadows, and elevation from the project’s confirmed direction and actual workflows. Cards, containers, and other surface treatments are optional design choices, not universal requirements. Keep supported tasks usable on desktop, tablet, and mobile without horizontal page overflow.

## 5. Signature Screen Blueprints
${screenBlueprint}

## 6. Iconography & Interaction
Use an existing icon library when present; otherwise choose an appropriate one during design. Give icon-only controls accessible names, provide visible keyboard focus and relevant interaction states, use adequate touch targets, and respect prefers-reduced-motion. Choose icon containers, arrows, and motion only when they serve the interface.

## 7. Implementation Tokens
The fallback values are placeholders to replace with project-specific decisions before implementation.

\`\`\`css
:root {
  --color-canvas: #FFFFFF;
  --color-surface: #F5F5F5;
  --color-ink: #111827;
  --color-muted: #4B5563;
  --color-border: #D1D5DB;
  --color-accent: #334155;
}
\`\`\`

## 8. Anti-Defaults & Acceptance Checklist
- [ ] Visual decisions follow confirmed project direction and context.
- [ ] Recommendations and unresolved choices are clearly identified.
- [ ] No unsupported product screens, features, or data are invented.
- [ ] Responsive behavior supports the actual project workflows.
- [ ] Keyboard focus, accessible names, and non-color status cues are specified.
- [ ] Color contrast targets are met for the chosen palette.
- [ ] Implementation tokens match the documented design choices.
`
}
