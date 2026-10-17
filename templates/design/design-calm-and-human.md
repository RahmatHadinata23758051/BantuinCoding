---
schema: bantuincoding.design-family/v1
kind: master-template-design-spec
family_id: calm-and-human
family_name: Calm & Human
version: 0.1.0
status: reference-draft
category_binding: none
implementation_scope: frontend-only
---

# DESIGN — Calm & Human

> **Purpose:** curated master design-family specification for BantuinCoding Template Foundry. This is **not** a screenshot-to-code recipe, a site category, a locked page tree, or a production backend specification. It is an art-direction and composition contract used to author **original frontend-only reference UIs** and later derive project-specific Design Blueprints.
>
> **Core separation:** `Canonical Project Context` determines *what the product needs*; this document determines *how the visual system behaves*. A specific approved `DesignBlueprint` locks final tokens, recipe choices, and page decisions for one project.

## 1. Family intent and fit


- **Archetype:** Accessible service experience / humane reassurance
- **Design thesis:** A quiet interface that respects attention, reduces anxiety, and helps people complete meaningful tasks without friction. Friendly does not mean childish; clarity is the warmth.
- **Mood:** Considerate, calm, grounded, open, reliable
- **Strong fit:** Learning platforms, public services, wellbeing apps, community spaces, healthcare appointment interfaces, nonprofits, family services.
- **Watch-outs:** Ultra-dense real-time trading or stylized luxury campaigns. If used outside service domains, the family remains centered on guidance, accessibility and clarity.

## 2. Design DNA — non-negotiable character

**What must be recognizable:** clear explanations, approachable forms, forgiving input patterns, comfortable line-height, human-scale photography/illustration only where useful, and transparent status feedback.

**Visual signature:** soft shapes used sparingly, calming neutral surfaces, clear progress landmarks, and strong primary tasks rather than decorative cards.

### Hard invariants (lock these across projects)

| Invariant | Required behavior |
| --- | --- |
| Task reassurance | Explain what will happen, required input, and the next step without vague promises. |
| Inclusive readability | Accessible contrast, comfortable body size, labels above fields, ample targets. |
| Forgiving forms | Inline error text, recovery paths, saved progress only when implemented. |
| Real-world respect | Avoid fake testimonials, invented professional credentials, ungrounded outcome claims. |
| Quiet focus | Reduce simultaneous competing actions; clear progress and completion state. |


### What is intentionally **not** locked

Warmth of palette, illustration/photo presence, card softness, guided vs freeform navigation, progress format, typography inside legibility bounds, density for skilled users.

**Interpretation rule:** a cross-category project may choose new pages, entities, and task flows. It must not be forced to reuse a showcase dashboard, catalog, hero, or other page simply because the reference implementation contains it.

## 3. Token foundations (starting values, not a frozen palette)

The following is a **reference palette** for building the master UI. In real project synthesis, derive concrete semantic values from domain/context while respecting contrast, harmony, and family character. Do not force these exact hex codes on every user.

| Semantic token | Reference | Usage / variation |
| --- | --- | --- |
| canvas | #F5F7F3 | Warm mist neutral. |
| surface | #FFFFFF | Clean readable panels. |
| surface-muted | #E8F0EA | Supportive contextual surfaces. |
| text | #21312C | Grounded near-black green. |
| text-muted | #51645C | Supporting content. |
| accent | #326F5C | Primary progress and action. |
| border | #CDDCD1 | Gentle delineation. |
| success | #26715B | Success without false reassurance. |
| warning | #98631D | Attention state. |
| danger | #B24443 | Error / destructive. |


**Typography.** Headings: **Nunito Sans 600–800** or **Manrope 600–700**; body: **Atkinson Hyperlegible 400–700** or **Source Sans 3**. Choose typography based on readability first; do not over-round text or use infantilizing copy.

**Type scale.** Desktop H1 36–48px/1.12, H2 26–32px/1.25, body 16–18px/1.65, form labels 14–16px/1.45, helper text >=14px for core guidance. Mobile retains comfortable text size.

**Geometry and rhythm.** 8px spacing base with generous 12/16/24/32px intervals. Radius 10–18px for card/fields but do not nest soft cards repeatedly. Shadow optional, subtle. Maintain obvious control boundaries.

**Layout and breakpoints.** Desktop 12-column marketing or 8-column task content; key forms keep 480–680px reading width. Tablet and mobile prioritize single-column guided flow; no information loss behind toggles.

### Reference CSS tokens

```css
:root {
  --design-canvas: #F5F7F3;
  --design-surface: #FFFFFF;
  --design-surface-muted: #E8F0EA;
  --design-text: #21312C;
  --design-text-muted: #51645C;
  --design-accent: #326F5C;
  --design-border: #CDDCD1;
  --design-success: #26715B;
  --design-warning: #98631D;
  --design-danger: #B24443;
}
```

Do not treat this snippet as a production theme for every domain. The synthesizer must select final values, check contrast and brand appropriateness, and persist them in the approved Blueprint.

## 4. Screen architecture and semantic slots

Only create screens that satisfy Canonical Project Context. The entries below are **supported composition vocabulary**, not mandatory pages.

| Semantic slot | Allowed recipes / variants | Constraint |
| --- | --- | --- |
| Welcome | reassurance-hero / task-intro / plain-language-banner | Sets expectation, not fabricated social proof. |
| Guidance | step-by-step / contextual-help / FAQ-inline | Use when tasks involve unfamiliar decisions. |
| Action | single-form / wizard-step / appointment-selector | One focal task per step. |
| Discovery | topic-cards / accessible-list / resource-rail | User searches and filters where necessary. |
| Progress | stepper / checklist / status-timeline | Never imply work is saved unless persistence exists. |
| Outcome | confirmation / next-steps / error-recovery | Clear what was completed and what is simulated. |

## 5. Composition grammar and compatibility

1. One primary task per screen; secondary explanations may be progressive-disclosure but never hide essential safety information.
2. Labels must stay visible when inputs contain values; placeholders cannot act as sole labels.
3. Progress is honest: a frontend-only flow must not say appointment booked, payment complete, or record submitted.
4. Mobile tasks use full-width controls and clear back/next pathways.
5. Error and success states always provide a helpful next step and are announced accessibly.

**General compatibility check:** recipe choices must satisfy required data shape, accessibility, screen size, and available neighboring slots. Never use incompatible combinations by merely hiding broken regions with CSS.

## 6. Sample screen archetype compositions

| Screen pattern | Slot composition | Typical cross-domain fit |
| --- | --- | --- |
| Guided service | task-intro + stepper + wizard-step + outcome | Appointments, enrollments, assistance forms |
| Supportive learning | reassurance-hero + topic-cards + checklist | Education, onboarding, self-service portals |
| Community directory | plain-language-banner + accessible-list + contextual-help | Nonprofits, local services, community apps |

These are **examples**, not universally locked layouts. Variants can be added after manual review and grammar validation.

## 7. Context-driven mappings: same family, different project

| Project example | Resulting UI direction |
| --- | --- |
| Education platform | Course overview, learning steps, support prompts, lesson progress and accessible exercises. |
| Clinic appointments | Service selection and time preferences, clear cancellation explanation; no claim of real booking without backend. |
| Community resources | Service directory with understandable eligibility text and simple filters. |

The UI must derive feature lists, page count, field names, and actions from project context, not from these example domains.

## 8. Variation boundaries

| Axis | Allowed range / choices | Selection guidance |
| --- | --- | --- |
| Journey | guided wizard \| open directory \| learning checklist | Based on task complexity. |
| Warmth | neutral sage \| soft ocean \| sunlit clay | Text contrast remains strong. |
| Illustration | none \| meaningful spot art \| human photography | No stock smiles as automatic filler. |
| Navigation | compact top nav \| left service index \| task-only | One clear primary location. |
| Radius | 10–18px | Consistent gentle geometry. |
| Typography | Nunito + Atkinson \| Manrope + Source Sans 3 | Preserve legibility. |

**Lock strategy:** Design DNA + invariants + grammar remain stable at family level. Concrete choices of axis values, recipes, entity mapping, and page hierarchy are locked only after a project-specific Blueprint is approved.

## 9. Anti-patterns and demo brief

**Avoid:** Pastel-on-pastel low contrast, overly cute emojis, giant rounded boxes nested inside rounded boxes, fake progress assurance, inaccessible multistep forms, clinical claims without evidence.

**Original UI-only showcase:** Build three original demo screens for fictional **Common Ground**: (1) community resources directory, (2) appointment request flow with explicitly demo-only confirmation, (3) lesson progress dashboard. These show how the same design principles apply across domains.

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
  "familyId": "calm-and-human",
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
