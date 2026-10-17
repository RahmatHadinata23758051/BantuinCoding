---
schema: bantuincoding.design-family/v1
kind: master-template-design-spec
family_id: precision-technical
family_name: Precision Technical
version: 0.1.0
status: reference-draft
category_binding: none
implementation_scope: frontend-only
---

# DESIGN — Precision Technical

> **Purpose:** curated master design-family specification for BantuinCoding Template Foundry. This is **not** a screenshot-to-code recipe, a site category, a locked page tree, or a production backend specification. It is an art-direction and composition contract used to author **original frontend-only reference UIs** and later derive project-specific Design Blueprints.
>
> **Core separation:** `Canonical Project Context` determines *what the product needs*; this document determines *how the visual system behaves*. A specific approved `DesignBlueprint` locks final tokens, recipe choices, and page decisions for one project.

## 1. Family intent and fit


- **Archetype:** Instrument-grade telemetry / engineering clarity
- **Design thesis:** An interface as trustworthy as an instrument panel: exact units, stable alignment, discernible states, and controlled signal density. Technical credibility comes from accuracy, not neon decoration.
- **Mood:** Focused, rigorous, high-signal, calm-dark
- **Strong fit:** IoT, monitoring, cybersecurity, infrastructure, developer tools, observability, equipment calibration, laboratory analytics, technical operations.
- **Watch-outs:** Lifestyle landing pages and image-led luxury brands. This family can work for marketing a technical product if its screens rely on evidence and technical narrative.

## 2. Design DNA — non-negotiable character

**What must be recognizable:** deliberate data density, fine structural rules, disciplined monospace use, stable numerical alignment, and semantic state colors.

**Visual signature:** charcoal work surface, instrument-like readouts, understated labeling, strong state boundaries, and clearly separated live/historical/estimated information.

### Hard invariants (lock these across projects)

| Invariant | Required behavior |
| --- | --- |
| Data provenance | All displayed values have units, source/time labels, or are unmistakably demo placeholders. |
| Signal hierarchy | Critical alerts and active work stand out without making every item bright. |
| Instrument consistency | Fixed alignment for measurements; consistent decimals, units, and timestamp handling. |
| Status semantics | Success, warning, error, and unknown states differ in text/shape as well as color. |
| Keyboard-first controls | Efficient navigation, strong focus indicators, and no essential hover-only info. |


### What is intentionally **not** locked

Dark tone variation, amount of density, side vs top controls, telemetry vs logs vs diagnostics emphasis, single-pane vs multi-pane, accent hue within readable bounds, number of metrics determined by context.

**Interpretation rule:** a cross-category project may choose new pages, entities, and task flows. It must not be forced to reuse a showcase dashboard, catalog, hero, or other page simply because the reference implementation contains it.

## 3. Token foundations (starting values, not a frozen palette)

The following is a **reference palette** for building the master UI. In real project synthesis, derive concrete semantic values from domain/context while respecting contrast, harmony, and family character. Do not force these exact hex codes on every user.

| Semantic token | Reference | Usage / variation |
| --- | --- | --- |
| canvas | #0E1216 | Graphite technical canvas. |
| surface | #161C21 | Panels and workspace. |
| surface-muted | #222B31 | Field, chart and secondary surfaces. |
| text | #E4ECEE | Legible primary text. |
| text-muted | #A2B0B5 | Supporting metadata. |
| accent | #58B3C2 | Selected control / active data series. |
| border | #35424A | 1px structural separation. |
| success | #74BEA0 | Healthy state. |
| warning | #E4AF63 | Degraded state. |
| danger | #E47F7F | Failed state. |


**Typography.** UI: **IBM Plex Sans 400–600** or **Geist**. Technical values: **IBM Plex Mono 400–600**. Use `font-variant-numeric: tabular-nums` on measurements. Metadata mono 11–13px, but body instructions must remain in a highly readable sans.

**Type scale.** Desktop H1 24–30px/1.2, panel title 14–17px/1.3, body 13–15px/1.5, readouts 22–38px/1.1, labels 11–13px/1.4. Important values must not rely on micro text.

**Geometry and rhythm.** 4px base spacing, common 4/8/12/16/24px. Radius 2–8px. Borders always structural. Little to no shadow. Line work and measured spacing replace glossy effects.

**Layout and breakpoints.** Desktop responsive 12-column instrument layout; optional 44–60px tool rail and resizable main/inspector panes. Tablet collapses inspector behind a tab. Mobile prioritizes one active signal/metric, replaces dense multi-chart walls with scrollable sections and preserves readable values.

### Reference CSS tokens

```css
:root {
  --design-canvas: #0E1216;
  --design-surface: #161C21;
  --design-surface-muted: #222B31;
  --design-text: #E4ECEE;
  --design-text-muted: #A2B0B5;
  --design-accent: #58B3C2;
  --design-border: #35424A;
  --design-success: #74BEA0;
  --design-warning: #E4AF63;
  --design-danger: #E47F7F;
}
```

Do not treat this snippet as a production theme for every domain. The synthesizer must select final values, check contrast and brand appropriateness, and persist them in the approved Blueprint.

## 4. Screen architecture and semantic slots

Only create screens that satisfy Canonical Project Context. The entries below are **supported composition vocabulary**, not mandatory pages.

| Semantic slot | Allowed recipes / variants | Constraint |
| --- | --- | --- |
| SystemNav | tool-rail / command-header / hierarchical-tree | One primary command surface. |
| StatusBand | health-summary / timestamp-strip / incident-priority | Includes acquisition time or explicitly demo data. |
| SignalView | timeseries-plot / event-stream / topology-list / diagnostic-matrix | Domain-specific data presentation. |
| Control | setpoint-form / command-palette / parameter-bank | Critical changes require guarded confirmation. |
| Inspector | signal-details / trace-inspector / device-properties | Follows selection and stays context-bound. |
| History | log-table / event-timeline / comparison-view | Clear temporal labels and filters. |

## 5. Composition grammar and compatibility

1. Never pair dense time-series, dense event-stream, and dense inspector at full visual emphasis simultaneously; choose a primary focus.
2. StatusBand must distinguish current vs stale vs unavailable state, even in static/demo data.
3. Charts require axes/units/legend when meaningful; no decorative sparklines presented as proof.
4. Inspector context is tied to an explicit selection and becomes a route or sheet on small viewports.
5. Control recipe cannot imply a physical device command was sent without a real backend; frontend-only interactions remain simulations clearly identified as demo data.

**General compatibility check:** recipe choices must satisfy required data shape, accessibility, screen size, and available neighboring slots. Never use incompatible combinations by merely hiding broken regions with CSS.

## 6. Sample screen archetype compositions

| Screen pattern | Slot composition | Typical cross-domain fit |
| --- | --- | --- |
| Monitoring console | SystemNav + StatusBand + SignalView + History | Device telemetry, uptime and sensor data |
| Diagnostic workspace | CommandHeader + diagnostic-matrix + signal-details | Lab diagnostics, security investigation |
| Developer utility | Hierarchical-tree + parameter-bank + log-table | API tools, task consoles, infrastructure |

These are **examples**, not universally locked layouts. Variants can be added after manual review and grammar validation.

## 7. Context-driven mappings: same family, different project

| Project example | Resulting UI direction |
| --- | --- |
| IoT cold storage | Time-stamped temperature readings with units, thresholds, alarm history and equipment detail. |
| Infrastructure observability | Service health, latency distribution, incidents, trace detail with sampled mock data. |
| Spray measurement lab | Camera/source states, measurement readouts, calibration visibility, session comparison; no fake hardware connection. |

The UI must derive feature lists, page count, field names, and actions from project context, not from these example domains.

## 8. Variation boundaries

| Axis | Allowed range / choices | Selection guidance |
| --- | --- | --- |
| Navigation | tool-rail \| command-header \| hierarchical-tree | Depends on switching frequency and information depth. |
| Primary surface | timeseries \| event-stream \| matrix \| logs | Choose per actual data shape. |
| Density | compact \| precision-comfortable | Maintain minimum legibility. |
| Accent | cyan \| amber \| desaturated blue | Use semantic feedback distinctly. |
| Pane | single focus \| 2-pane \| 3-pane | Only when supported at target viewport. |
| Surface character | graphite \| midnight slate | No gratuitous RGB glow. |

**Lock strategy:** Design DNA + invariants + grammar remain stable at family level. Concrete choices of axis values, recipes, entity mapping, and page hierarchy are locked only after a project-specific Blueprint is approved.

## 9. Anti-patterns and demo brief

**Avoid:** Hacker-movie neon, glow behind every element, fake live indicators, unitless metrics, charts without axes, opaque abbreviations without help, random terminal text, low-contrast 10px labels.

**Original UI-only showcase:** Build three original demo screens for fictional **Vector Instruments**: (1) telemetry command center, (2) incident/event investigation, (3) device configuration with local-only interactive parameters. Every demo reading must be labeled SAMPLE or DEMO, with time and unit conventions.

## 10. Frontend-only authoring contract for Claude Code

Implement a **reference UI**, not a real product. Required technical scope:

- Use React + TypeScript + Tailwind CSS, components with semantic HTML; follow the host app's conventions where practical.
- No backend, APIs, database, real sign-in, payment, email delivery, external analytics, or server-side persistence.
- Use small, typed local fixture arrays for demo content. Mark invented operational data as demo/sample and do not represent frontend changes as committed server actions.
- Implement meaningful client-only interaction states: open/close, tabs, sort/filter, selection, form validation, loading mock if needed, empty/error/demo success.
- Support desktop (>=1280px), tablet (~768px), and mobile (~375px) without horizontal overflow except intentionally scrollable data surfaces.
- Extract semantic design tokens as CSS custom properties. Avoid scattering raw colors/sizing throughout components.
- Maintain a useful component structure with re-usable primitives and **at least two composition alternatives**; do not produce one hardcoded layout with a color switch.
- Use icons only for semantic actions/states. All interactive controls have visible/accessible names and keyboard focus.
- Honor `prefers-reduced-motion`, and keep essential content available with motion disabled.
- Do not claim that the live reference UI is the project's final design; it is a family showcase and grammar test.

## 11. Quality gates before calling the family ready

- [ ] Two meaningfully different screen compositions work using the same family identity.
- [ ] At least three project categories can be mapped without forcing irrelevant slots.
- [ ] Every chosen recipe exists and satisfies the stated constraints.
- [ ] No invented chart, metric, testimonial, claim, or data is presented as real.
- [ ] Keyboard path, focus visibility, labels, and contrast have been checked.
- [ ] At ~375px and ~768px, long titles, menus, forms and tables remain usable.
- [ ] Client-only flows communicate honestly; no fake completed backend actions.
- [ ] `design-dna`, constraints, and composition rules are documented separately from per-project brand decisions.
- [ ] A different selected recipe produces structural—not merely chromatic—variation.

## 12. Blueprint handoff contract

When BantuinCoding later synthesizes a project-specific visual specification, persist at minimum:

```json
{
  "familyId": "precision-technical",
  "familyVersion": "0.1.0",
  "contextVersion": 1,
  "screenArchetypes": ["selected-for-project"],
  "recipeSelections": {"page:slot": "registered-recipe-id"},
  "tokens": {"semanticTokens": "final-concrete-values"},
  "designDecisions": ["why this composition fits the real requirements"],
  "constraintsPassed": true,
  "status": "APPROVED"
}
```

The shape above is **illustrative**, not a ready-to-run Zod schema. In the product, only mark `APPROVED` after deterministic validation and explicit user approval. The renderer and `DESIGN.md` compiler must consume this same approved snapshot; do not silently invent new visual decisions during document compilation.
