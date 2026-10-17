---
schema: bantuincoding.design-family/v1
kind: master-template-design-spec
family_id: expressive-creative
family_name: Expressive Creative
version: 0.1.0
status: reference-draft
category_binding: none
implementation_scope: frontend-only
---

# DESIGN — Expressive Creative

> **Purpose:** curated master design-family specification for BantuinCoding Template Foundry. This is **not** a screenshot-to-code recipe, a site category, a locked page tree, or a production backend specification. It is an art-direction and composition contract used to author **original frontend-only reference UIs** and later derive project-specific Design Blueprints.
>
> **Core separation:** `Canonical Project Context` determines *what the product needs*; this document determines *how the visual system behaves*. A specific approved `DesignBlueprint` locks final tokens, recipe choices, and page decisions for one project.

## 1. Family intent and fit


- **Archetype:** Art-directed digital expression / deliberate provocation
- **Design thesis:** A memorable digital voice built from daring composition and confident typography. Expression is purposeful: the brand has one distinct move instead of fifty competing gimmicks.
- **Mood:** Energetic, unconventional, assured, playful-but-designed
- **Strong fit:** Creative agencies, events, artist sites, product launches, gaming communities, experimentation-focused startups, cultural campaigns.
- **Watch-outs:** Regulated administration, high-stakes medical workflows, and very dense operational tools where expressive effects obstruct accuracy. Can support those only with a significantly restrained expression mode.

## 2. Design DNA — non-negotiable character

**What must be recognizable:** editorial-scale display type, expressive negative space, striking alignment, and a distinctive interaction rhythm.

**Visual signature:** one primary motif per screen (oversized type, bold color plane, dynamic crop, or geometric punctuation), contrasted with functional secondary sections.

### Hard invariants (lock these across projects)

| Invariant | Required behavior |
| --- | --- |
| Single hero gesture | One deliberate expressive signature per screen, not an avalanche of effects. |
| High legibility | Large type must still wrap intelligibly and preserve reading order. |
| Intentional contrast | Bold color pairing stays accessible for text and controls. |
| Functional restraint | Forms, navigation and task completion remain familiar and clear. |
| Art-direction coherence | Illustration, imagery and motion share one consistent visual language. |


### What is intentionally **not** locked

Typeface within display bounds, dominant motif, palette pairing, grid asymmetry, interaction emphasis, navigation arrangement, intensity mode, presence of abstract graphic elements.

**Interpretation rule:** a cross-category project may choose new pages, entities, and task flows. It must not be forced to reuse a showcase dashboard, catalog, hero, or other page simply because the reference implementation contains it.

## 3. Token foundations (starting values, not a frozen palette)

The following is a **reference palette** for building the master UI. In real project synthesis, derive concrete semantic values from domain/context while respecting contrast, harmony, and family character. Do not force these exact hex codes on every user.

| Semantic token | Reference | Usage / variation |
| --- | --- | --- |
| canvas | #F1EDDF | Neutral light ground for strong color blocks. |
| surface | #FFFCF5 | Readability canvas. |
| surface-muted | #E5DFD0 | Secondary sections. |
| text | #16171A | Near-black ink. |
| text-muted | #494B50 | Supporting copy. |
| accent | #E34B2F | Expressive warm action accent. |
| border | #27282B | Confident strokes. |
| success | #216B52 | Positive UI state. |
| warning | #9B5B11 | Warning UI state. |
| danger | #B63741 | Errors. |


**Typography.** Display: **Syne 600–800** or **Space Grotesk 600–700**. Body: **DM Sans 400–600**. Optional monospace utility labels only where semantically relevant. Avoid using multiple display fonts on the same screen.

**Type scale.** Desktop hero 64–120px/0.88–1.02, H1 44–72px/1.02, H2 28–44px/1.15, body 15–18px/1.5, utility label 12–13px/1.4. Fluid scales are mandatory.

**Geometry and rhythm.** Spacing base 8px with deliberate deviations for art direction. Radius may range 0–16px but must follow chosen motif. Borders 1.5–2px are allowed when part of identity. Motion should feel kinetic but optional.

**Layout and breakpoints.** Desktop 12-column with offset or overlapping sections only where the DOM remains clear. Mobile removes unessential overlaps and preserves the same visual thesis through typography, color and rhythm rather than tiny squeezed compositions.

### Reference CSS tokens

```css
:root {
  --design-canvas: #F1EDDF;
  --design-surface: #FFFCF5;
  --design-surface-muted: #E5DFD0;
  --design-text: #16171A;
  --design-text-muted: #494B50;
  --design-accent: #E34B2F;
  --design-border: #27282B;
  --design-success: #216B52;
  --design-warning: #9B5B11;
  --design-danger: #B63741;
}
```

Do not treat this snippet as a production theme for every domain. The synthesizer must select final values, check contrast and brand appropriateness, and persist them in the approved Blueprint.

## 4. Screen architecture and semantic slots

Only create screens that satisfy Canonical Project Context. The entries below are **supported composition vocabulary**, not mandatory pages.

| Semantic slot | Allowed recipes / variants | Constraint |
| --- | --- | --- |
| IdentityHeader | wordmark-led / oversized-index / compact-menu | All nav remains discoverable and keyboard accessible. |
| Hero | type-poster / image-crop / split-provocation | Only one dominant hero motif. |
| Proof | project-wall / product-demo / narrative-stats | Proof must be verifiable or labeled demo. |
| Exploration | asymmetric-grid / horizontal-gallery / featured-story | No scroll-jacking required. |
| Conversion | bold-callout / focused-signup / ticket-flow | Functional clarity overrides art direction. |
| Footer | editorial-colophon / structured-directory | Essential legal and contact info stays readable. |

## 5. Composition grammar and compatibility

1. Each screen chooses at most one dominant expressive treatment: typographic scale OR dramatic imagery OR color blocking.
2. Allow one secondary motif for cohesion (rule lines, numbers, stickers, or type labels); no random decorative shapes.
3. Non-standard navigation must still expose a predictable menu, active state and back path.
4. Animations must respect prefers-reduced-motion and may not block first meaningful content.
5. Forms, pricing, checkout and account flows revert to restrained components while keeping identity.

**General compatibility check:** recipe choices must satisfy required data shape, accessibility, screen size, and available neighboring slots. Never use incompatible combinations by merely hiding broken regions with CSS.

## 6. Sample screen archetype compositions

| Screen pattern | Slot composition | Typical cross-domain fit |
| --- | --- | --- |
| Campaign landing | IdentityHeader + type-poster + project-wall + bold-callout | Launches, events, agencies |
| Creative collection | IdentityHeader + featured-story + asymmetric-grid | Artist work, game showcases, portfolios |
| Conversion microsite | compact-menu + image-crop + focused-signup | Workshops, event registration, product waitlists |

These are **examples**, not universally locked layouts. Variants can be added after manual review and grammar validation.

## 7. Context-driven mappings: same family, different project

| Project example | Resulting UI direction |
| --- | --- |
| Creative agency | Typographic statement, case study teasers, process narrative, direct inquiry. |
| Music festival | Schedule grouped by stages/dates, artist cards and a clear ticket CTA; art direction never harms date readability. |
| Indie game site | Hero key art, gameplay features, media gallery and store links; no fake player counts. |

The UI must derive feature lists, page count, field names, and actions from project context, not from these example domains.

## 8. Variation boundaries

| Axis | Allowed range / choices | Selection guidance |
| --- | --- | --- |
| Expressive mode | restrained \| balanced \| statement | Intensity shifts composition, not accessibility. |
| Motif | type scale \| color plane \| photography crop \| geometric rule | Choose one primary motif. |
| Accent direction | vermilion \| cobalt \| acidic green | Pass contrast on functional UI. |
| Layout | asymmetric \| poster-led \| feature-wall | Align with actual content needs. |
| Display face | Syne \| Space Grotesk \| Bricolage Grotesque | Use a single expressive family. |
| Motion | none \| restrained \| characterful | Reduced-motion equivalent required. |

**Lock strategy:** Design DNA + invariants + grammar remain stable at family level. Concrete choices of axis values, recipes, entity mapping, and page hierarchy are locked only after a project-specific Blueprint is approved.

## 9. Anti-patterns and demo brief

**Avoid:** Rainbow gradients, ornamental emojis, stickers in every card, meaningless 3D objects, aggressive scroll-jacking, unreadable display type, fake hype/endorsements, animation hiding primary actions.

**Original UI-only showcase:** Build three original demo screens for fictional **Good Noise Studio**: (1) agency launch hero + case studies, (2) cultural event schedule and ticketing front-end mock, (3) artist portfolio detail. Each should share the same family principles but use a distinct composition motif.

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
  "familyId": "expressive-creative",
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
