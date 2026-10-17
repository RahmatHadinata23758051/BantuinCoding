---
schema: bantuincoding.design-family/v1
kind: master-template-design-spec
family_id: structured-enterprise
family_name: Structured Enterprise
version: 0.1.0
status: reference-draft
category_binding: none
implementation_scope: frontend-only
---

# DESIGN — Structured Enterprise

> **Purpose:** curated master design-family specification for BantuinCoding Template Foundry. This is **not** a screenshot-to-code recipe, a site category, a locked page tree, or a production backend specification. It is an art-direction and composition contract used to author **original frontend-only reference UIs** and later derive project-specific Design Blueprints.
>
> **Core separation:** `Canonical Project Context` determines *what the product needs*; this document determines *how the visual system behaves*. A specific approved `DesignBlueprint` locks final tokens, recipe choices, and page decisions for one project.

## 1. Family intent and fit


- **Archetype:** Operational clarity / systematic productivity
- **Design thesis:** An interface that makes complex work feel controlled. Information is organized by task, urgency, and next action—not by a decorative grid of identical cards.
- **Mood:** Precise, credible, composed, efficient
- **Strong fit:** Inventory, ERP, CRM, institutional systems, finance operations, clinic administration, data-management applications. Also valid for structured marketplaces or booking administration.
- **Watch-outs:** Image-led brand storytelling, immersive art portfolios, experimental cultural campaigns. It can still be used if the user explicitly wants an operational visual identity.

## 2. Design DNA — non-negotiable character

**What must be recognizable:** strong hierarchy, legible status, disciplined alignment, and obvious next actions. Toolbars are functional rather than ornamental. Large tables can coexist with detail panes without overwhelming the user.

**Visual signature:** a clear page title/command band, one dominant work surface, controlled peripheral navigation, and a deliberate treatment of dense data. Status colors always encode meaning.

### Hard invariants (lock these across projects)

| Invariant | Required behavior |
| --- | --- |
| Task-first hierarchy | The primary task or data view is visually dominant; utilities stay secondary. |
| Aligned information | Use consistent columns, baselines, numeric alignment, and semantic labels. |
| Data honesty | No fabricated live counters, fake trends, or decorative analytics for realism. |
| Functional navigation | Navigation communicates location, scope, and hierarchy; no redundant nav bars. |
| Operational contrast | Body text and essential controls meet WCAG AA; color alone never communicates status. |


### What is intentionally **not** locked

Sidebar vs top navigation, number and order of screens, palette accents, density, whether table/board/timeline is primary, chart presence (only if justified), font pair within bounds, radius within specified range.

**Interpretation rule:** a cross-category project may choose new pages, entities, and task flows. It must not be forced to reuse a showcase dashboard, catalog, hero, or other page simply because the reference implementation contains it.

## 3. Token foundations (starting values, not a frozen palette)

The following is a **reference palette** for building the master UI. In real project synthesis, derive concrete semantic values from domain/context while respecting contrast, harmony, and family character. Do not force these exact hex codes on every user.

| Semantic token | Reference | Usage / variation |
| --- | --- | --- |
| canvas | #F4F6F8 | Work canvas; can shift from cool gray to warm neutral. |
| surface | #FFFFFF | Primary data and form surfaces. |
| surface-muted | #E9EEF2 | Secondary fields, rows, filters. |
| text | #17222D | High-contrast operational text. |
| text-muted | #546575 | Contextual labels, not key actions. |
| accent | #245E84 | Actions and selection, never every card. |
| border | #D5DFE7 | Structural division. |
| success | #20755D | Successful completion. |
| warning | #A05C08 | Attention / thresholds. |
| danger | #B83C49 | Errors / destructive actions. |


**Typography.** Headings: **IBM Plex Sans 600–700**; body: **Source Sans 3 400–600**; IDs, codes, timestamps: **IBM Plex Mono 400–500**. Acceptable substitutions: Public Sans / Inter when project needs them. Do not use monospace for long body paragraphs.

**Type scale.** Desktop H1 28–34px/1.2, H2 20–24px/1.3, body 14–16px/1.5, metadata 12–13px/1.4. Dense tables may use 13–14px with an accessible density toggle.

**Geometry and rhythm.** 4px spacing base, 8/12/16/24/32px spacing rhythm. Surface radius 6–12px; inputs 6–10px; pills reserved for status tokens. Borders 1px; shadows barely visible and only for overlays/raised surfaces.

**Layout and breakpoints.** Desktop 12-column content grid, content width 1200–1480px, navigation 220–264px when used. Tablet nav collapses to rail/drawer. Mobile uses one main column, sticky task actions where helpful, horizontal tables replaced with cards or deliberate horizontal scroll with clear cues.

### Reference CSS tokens

```css
:root {
  --design-canvas: #F4F6F8;
  --design-surface: #FFFFFF;
  --design-surface-muted: #E9EEF2;
  --design-text: #17222D;
  --design-text-muted: #546575;
  --design-accent: #245E84;
  --design-border: #D5DFE7;
  --design-success: #20755D;
  --design-warning: #A05C08;
  --design-danger: #B83C49;
}
```

Do not treat this snippet as a production theme for every domain. The synthesizer must select final values, check contrast and brand appropriateness, and persist them in the approved Blueprint.

## 4. Screen architecture and semantic slots

Only create screens that satisfy Canonical Project Context. The entries below are **supported composition vocabulary**, not mandatory pages.

| Semantic slot | Allowed recipes / variants | Constraint |
| --- | --- | --- |
| Navigation | fixed-sidebar / compact-rail / top-command-nav | Choose exactly one global primary navigation pattern. |
| PageCommand | title-actions / title-filter-band / contextual-breadcrumb | One primary action; secondary actions overflow. |
| Overview | stat-rail / workflow-queue / priority-summary | Only instantiate metrics supported by domain requirements. |
| Collection | dense-table / sortable-card-list / status-board / event-timeline | Select by record shape and user task; not visual preference alone. |
| Inspection | right-drawer / dedicated-detail / split-inspector | Choose based on data complexity and screen width. |
| Feedback | inline-validation / toast / resolution-banner | Show actionable language and recovery. |

## 5. Composition grammar and compatibility

1. Maximum one global nav; a local secondary nav is allowed only for multi-level workspaces.
2. A dense table with an inspector may use a right drawer or split view on desktop; on mobile the inspector becomes a full-screen sheet or separate route.
3. An Overview slot is optional. Do not add KPI cards unless metrics represent genuine user decisions.
4. Main action appears consistently across list and detail screens. Destructive actions require confirmation and clear consequence.
5. Use sticky headers only where they improve long-record scanning; sticky controls must not cover content.

**General compatibility check:** recipe choices must satisfy required data shape, accessibility, screen size, and available neighboring slots. Never use incompatible combinations by merely hiding broken regions with CSS.

## 6. Sample screen archetype compositions

| Screen pattern | Slot composition | Typical cross-domain fit |
| --- | --- | --- |
| Operation workspace | Navigation + PageCommand + Collection + optional Inspection | Inventory, support tickets, ERP workflows |
| Management overview | PageCommand + workflow-queue + Collection | Clinic operations, asset assignments, CRM |
| Transactional flow | ProgressHeader + structured form + persistent summary + Feedback | Booking administration, purchase order intake |

These are **examples**, not universally locked layouts. Variants can be added after manual review and grammar validation.

## 7. Context-driven mappings: same family, different project

| Project example | Resulting UI direction |
| --- | --- |
| Warehouse inventory | Stock-by-location table, adjustment reason form, reserved/out-of-stock states, batch labels. Favor dense-table + split-inspector. |
| Clinic administration | Appointment timeline, patient directory, check-in state. Favor event-timeline + dedicated-detail; avoid pretending medical metrics exist. |
| Educational admin | Course/participant management, enrollment states, import flow. Favor sortable-card-list or dense-table based on volume. |

The UI must derive feature lists, page count, field names, and actions from project context, not from these example domains.

## 8. Variation boundaries

| Axis | Allowed range / choices | Selection guidance |
| --- | --- | --- |
| Navigation | fixed-sidebar \| compact-rail \| top-command-nav | Determined by hierarchy depth and task switching frequency. |
| Density | compact \| comfortable | Never compromise touch targets or readability. |
| Accent family | marine / mineral green / restrained amber | Change semantic accent while retaining neutral surfaces. |
| Collection recipe | table \| board \| timeline \| list | Choose from project entities and workflows. |
| Radius | 6–12px | Keep one coherent radius system. |
| Heading font | IBM Plex Sans \| Public Sans \| Inter | Never switch family just to look different. |

**Lock strategy:** Design DNA + invariants + grammar remain stable at family level. Concrete choices of axis values, recipes, entity mapping, and page hierarchy are locked only after a project-specific Blueprint is approved.

## 9. Anti-patterns and demo brief

**Avoid:** Generic bento KPI dashboard, left sidebar on every page regardless of task, gradients on data cards, fake charts, excessive shadows, pill buttons everywhere, icon badges for non-actions.

**Original UI-only showcase:** Build three original demo screens using fictional **Northline Operations**: (1) inventory overview, (2) item catalog with filtering and detail inspector, (3) receiving/adjustment form with validation and success states. Make every datum explicitly sample/demo; use interactive client-side filters, sorting, tabs and drawer.

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
  "familyId": "structured-enterprise",
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
