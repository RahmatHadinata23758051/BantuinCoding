---
schema: bantuincoding.design-family/v1
kind: master-template-design-spec
family_id: refined-luxury
family_name: Refined Luxury
version: 0.1.0
status: reference-draft
category_binding: none
implementation_scope: frontend-only
---

# DESIGN — Refined Luxury

> **Purpose:** curated master design-family specification for BantuinCoding Template Foundry. This is **not** a screenshot-to-code recipe, a site category, a locked page tree, or a production backend specification. It is an art-direction and composition contract used to author **original frontend-only reference UIs** and later derive project-specific Design Blueprints.
>
> **Core separation:** `Canonical Project Context` determines *what the product needs*; this document determines *how the visual system behaves*. A specific approved `DesignBlueprint` locks final tokens, recipe choices, and page decisions for one project.

## 1. Family intent and fit


- **Archetype:** Quiet prestige / material-led storytelling
- **Design thesis:** Confidence through restraint. Editorial craft, impeccable pacing, and imagery do the persuasive work; every extra ornament must earn its place. Luxury is precision and authenticity, not black-and-gold decoration.
- **Mood:** Restrained, architectural, assured, sensual, timeless
- **Strong fit:** Architecture, fashion, hospitality, premium product collections, interiors, real estate, galleries, design-led boutique commerce.
- **Watch-outs:** Dense enterprise tools, real-time network monitoring, and public services requiring high operational density. Can be adapted into premium catalogs or marketing pages, not forced onto specialized control panels.

## 2. Design DNA — non-negotiable character

**What must be recognizable:** exceptional typographic balance, cinematic but real content framing, deliberate whitespace and hierarchy, subtle navigation, and sparing accent use.

**Visual signature:** broad image compositions or editorial product still-lifes, extremely controlled text measure, precise dividers, and measured rhythm rather than conventional card dashboards.

### Hard invariants (lock these across projects)

| Invariant | Required behavior |
| --- | --- |
| Restraint | No decorative noise; most screens use few distinct visual elements. |
| Content quality | Imagery and copy must tell a real product or project story, not borrowed brand prestige. |
| Art-directed hierarchy | Large imagery and fine typography operate in clear visual sequence. |
| Accessible utility | Shopping, booking and contact controls stay visible, accessible and obvious. |
| Honest craft | Never fabricate awards, endorsements, product origin, or availability. |


### What is intentionally **not** locked

Warm vs cool neutrals, photography-heavy vs type-led, hero image ratio, exact serif pairing, subtle accent, product grid density, navigation style, image-to-text ratio.

**Interpretation rule:** a cross-category project may choose new pages, entities, and task flows. It must not be forced to reuse a showcase dashboard, catalog, hero, or other page simply because the reference implementation contains it.

## 3. Token foundations (starting values, not a frozen palette)

The following is a **reference palette** for building the master UI. In real project synthesis, derive concrete semantic values from domain/context while respecting contrast, harmony, and family character. Do not force these exact hex codes on every user.

| Semantic token | Reference | Usage / variation |
| --- | --- | --- |
| canvas | #F6F2EA | Soft bone, replaceable with chalk or cool stone. |
| surface | #FFFCF8 | Gallery surface. |
| surface-muted | #E5DED3 | Subtle alt surface. |
| text | #24211D | Near-black warm ink. |
| text-muted | #655E56 | Refined secondary. |
| accent | #665144 | Deep umber functional accent. |
| border | #CFC4B7 | Fine divisions. |
| success | #356A55 | Confirmed positive state. |
| warning | #956624 | Attention state. |
| danger | #A53F3C | Errors. |


**Typography.** Display: **Cormorant Garamond 400–600** or **Instrument Serif 400**; body/interface: **Manrope 400–600** or **Neue Haas Grotesk-style licensed alternative such as Inter**. Uppercase tracked labels may be used for short headings only.

**Type scale.** Desktop hero 64–108px/0.95–1.05 when text-led, H1 44–68px/1.08, H2 28–42px/1.2, body 15–18px/1.65, captions 12–14px/1.5. On mobile, hero content remains readable without forced line breaks.

**Geometry and rhythm.** Space follows an intentional 8/16/24/40/64/96px cadence. 0–6px radii for gallery surfaces; avoid plush UI. Dividers 1px and shadows generally off. Buttons are clean and never mistaken for decoration.

**Layout and breakpoints.** Desktop 12-column gallery and staggered layouts; content width 1100–1480px with long-form measure 62–72ch. Images maintain aspect ratio and meaningful crop focal points. Mobile becomes a calm single column with a visible booking/purchase CTA.

### Reference CSS tokens

```css
:root {
  --design-canvas: #F6F2EA;
  --design-surface: #FFFCF8;
  --design-surface-muted: #E5DED3;
  --design-text: #24211D;
  --design-text-muted: #655E56;
  --design-accent: #665144;
  --design-border: #CFC4B7;
  --design-success: #356A55;
  --design-warning: #956624;
  --design-danger: #A53F3C;
}
```

Do not treat this snippet as a production theme for every domain. The synthesizer must select final values, check contrast and brand appropriateness, and persist them in the approved Blueprint.

## 4. Screen architecture and semantic slots

Only create screens that satisfy Canonical Project Context. The entries below are **supported composition vocabulary**, not mandatory pages.

| Semantic slot | Allowed recipes / variants | Constraint |
| --- | --- | --- |
| BrandHeader | quiet-wordmark / centered-brand / editorial-menu | Stay functional; no hidden-only navigation. |
| Opening | full-bleed-imagery / quiet-type-led / asymmetrical-campaign | One memorable composition with editorial pacing. |
| Collection | curated-gallery / numbered-index / product-atelier-grid | Choose based on browsable content. |
| Detail | image-sequence / material-story / specification-sheet | Technical information is still legible. |
| Trust | process-narrative / factual-credentials / transparent-policy | Use verified or fictional demo-labeled copy only. |
| Conversion | request-visit / purchase-controls / booking-panel | Clear functional path to completion. |

## 5. Composition grammar and compatibility

1. One dominant image sequence or type composition per screen; avoid a patchwork of luxury-looking cards.
2. Hero image must have real focal point and meaningful alt text; use placeholder art honestly when photos unavailable.
3. Product details and pricing are legible with clear shipping/booking information; luxury is not opacity.
4. Long content uses readable measure; use generous spacing only where it supports narrative hierarchy.
5. Hover effects may enhance but never exclusively reveal purchase actions or gallery navigation.

**General compatibility check:** recipe choices must satisfy required data shape, accessibility, screen size, and available neighboring slots. Never use incompatible combinations by merely hiding broken regions with CSS.

## 6. Sample screen archetype compositions

| Screen pattern | Slot composition | Typical cross-domain fit |
| --- | --- | --- |
| Architectural portfolio | quiet-wordmark + full-bleed-imagery + numbered-index | Studios, galleries, interiors |
| Boutique commerce | editorial-menu + curated-gallery + specification-sheet + purchase-controls | Fashion, furniture, premium goods |
| Hospitality narrative | centered-brand + quiet-type-led + material-story + booking-panel | Hotels, retreats, restaurants |

These are **examples**, not universally locked layouts. Variants can be added after manual review and grammar validation.

## 7. Context-driven mappings: same family, different project

| Project example | Resulting UI direction |
| --- | --- |
| Architecture studio | Full-bleed case studies, material descriptions, compact studio profile, project inquiry. |
| Premium furniture store | Art-directed catalog, product material/size details, functional cart and delivery information. |
| Boutique hotel | Rooms and amenity stories, rates or availability placeholders clearly labeled, booking inquiry CTA. |

The UI must derive feature lists, page count, field names, and actions from project context, not from these example domains.

## 8. Variation boundaries

| Axis | Allowed range / choices | Selection guidance |
| --- | --- | --- |
| Composition | image-led \| type-led \| split-atelier | Based on content/asset quality. |
| Temperature | bone \| chalk \| cool stone | Neutrals define atmosphere. |
| Accent | umber \| graphite \| muted burgundy | One low-chroma accent, ensure contrast. |
| Display serif | Cormorant \| Instrument Serif \| Newsreader | Keep typography refined and readable. |
| Gallery recipe | curated \| numbered \| atelier-grid | Choose by content count. |
| Radius | 0–6px | Low-chrome surfaces. |

**Lock strategy:** Design DNA + invariants + grammar remain stable at family level. Concrete choices of axis values, recipes, entity mapping, and page hierarchy are locked only after a project-specific Blueprint is approved.

## 9. Anti-patterns and demo brief

**Avoid:** Automatic black-and-gold palette, excessive blur and glassmorphism, fake scarcity or testimonials, image-heavy layout with no content, unreadable 11px labels, invisible buttons, overly slow transitions.

**Original UI-only showcase:** Build three original demo screens for fictional **Atelier Forma**: (1) architecture studio home and selected projects, (2) premium furniture collection with detail, (3) boutique stay story with inquiry flow. Frontend-only interactions must never indicate completed reservations or charges.

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
  "familyId": "refined-luxury",
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
