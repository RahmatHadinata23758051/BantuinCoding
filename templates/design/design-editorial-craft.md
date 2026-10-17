---
schema: bantuincoding.design-family/v1
kind: master-template-design-spec
family_id: editorial-craft
family_name: Editorial Craft
version: 0.1.0
status: reference-draft
category_binding: none
implementation_scope: frontend-only
---

# DESIGN — Editorial Craft

> **Purpose:** curated master design-family specification for BantuinCoding Template Foundry. This is **not** a screenshot-to-code recipe, a site category, a locked page tree, or a production backend specification. It is an art-direction and composition contract used to author **original frontend-only reference UIs** and later derive project-specific Design Blueprints.
>
> **Core separation:** `Canonical Project Context` determines *what the product needs*; this document determines *how the visual system behaves*. A specific approved `DesignBlueprint` locks final tokens, recipe choices, and page decisions for one project.

## 1. Family intent and fit


- **Archetype:** Narrative clarity / contemporary editorial
- **Design thesis:** Content, cadence, and typographic expression are the product. The interface unfolds through deliberate composition and pacing rather than a stack of uniform components.
- **Mood:** Thoughtful, literary, tactile, contemporary
- **Strong fit:** Restaurant, portfolio, publisher, independent shop, cultural institution, studio, boutique education, thoughtful brand marketing.
- **Watch-outs:** High-frequency telemetry or ultra-dense control panels. If used for operational software, switch to an editorial-inspired low-density workspace rather than forcing article composition into tables.

## 2. Design DNA — non-negotiable character

**What must be recognizable:** strong typographic contrast, generous but intentional whitespace, an editorial reading rhythm, and imagery with narrative purpose.

**Visual signature:** asymmetric feature compositions, precise captions, long-form reading care, and restrained navigation. A page may have a dramatic opening but must maintain comfortable reading in its inner sections.

### Hard invariants (lock these across projects)

| Invariant | Required behavior |
| --- | --- |
| Typographic hierarchy | Serif/sans contrast or an equivalently distinctive editorial type system. |
| Reading rhythm | Text measures and spacing prioritize narrative flow, not component repetition. |
| Purposeful imagery | Photos or artwork illustrate real content; never anonymous filler collages. |
| Editorial grids | Use alignment and controlled asymmetry rather than random offsets. |
| Readable content | Body text meets contrast, line length and spacing requirements on all viewports. |


### What is intentionally **not** locked

Subject matter, hero arrangement, palette warmth, image aspect ratios, editorial vs commerce emphasis, exact font pairing, page types, placement of table-of-contents and calls-to-action.

**Interpretation rule:** a cross-category project may choose new pages, entities, and task flows. It must not be forced to reuse a showcase dashboard, catalog, hero, or other page simply because the reference implementation contains it.

## 3. Token foundations (starting values, not a frozen palette)

The following is a **reference palette** for building the master UI. In real project synthesis, derive concrete semantic values from domain/context while respecting contrast, harmony, and family character. Do not force these exact hex codes on every user.

| Semantic token | Reference | Usage / variation |
| --- | --- | --- |
| canvas | #F4F0E7 | Paper-like background; may be slightly cooler. |
| surface | #FCFAF5 | Sections and reading surfaces. |
| surface-muted | #E7DED0 | Quote / aside surfaces. |
| text | #25231F | Dark ink. |
| text-muted | #675F55 | Captions and secondary reading. |
| accent | #8B4335 | Selective links and actions; adapt to subject. |
| border | #CEC3B3 | Editorial rules and delineation. |
| success | #346D53 | Positive transactional state. |
| warning | #925A19 | Attention state. |
| danger | #A83A35 | Errors. |


**Typography.** Display: **Newsreader 400–600** or **Fraunces 400–600**; utility/body: **DM Sans 400–600**. Short editorial labels can be letter-spaced; never apply tracking to long paragraphs. Avoid mixing more than two visible families.

**Type scale.** Desktop hero 56–92px/0.95–1.06, H1 40–60px/1.05, H2 30–42px/1.15, paragraph 16–19px/1.65, captions 12–14px/1.45. Use fluid clamp for headings and adapt on mobile.

**Geometry and rhythm.** Spacing in 8/16/24/40/64/96px intervals according to section scale. Radius 0–8px; imagery usually square edges. Thin editorial rules preferred to boxed cards; shadows usually absent.

**Layout and breakpoints.** Desktop 12-column with 5–7 column reading measure, offset imagery, and occasional full-width editorial breaks; max reading measure 65–75ch. Mobile stacks content in editorial reading order; decorative overlaps disappear and text never overlays unreadable images.

### Reference CSS tokens

```css
:root {
  --design-canvas: #F4F0E7;
  --design-surface: #FCFAF5;
  --design-surface-muted: #E7DED0;
  --design-text: #25231F;
  --design-text-muted: #675F55;
  --design-accent: #8B4335;
  --design-border: #CEC3B3;
  --design-success: #346D53;
  --design-warning: #925A19;
  --design-danger: #A83A35;
}
```

Do not treat this snippet as a production theme for every domain. The synthesizer must select final values, check contrast and brand appropriateness, and persist them in the approved Blueprint.

## 4. Screen architecture and semantic slots

Only create screens that satisfy Canonical Project Context. The entries below are **supported composition vocabulary**, not mandatory pages.

| Semantic slot | Allowed recipes / variants | Constraint |
| --- | --- | --- |
| Masthead | minimal-wordmark / compact-section-index / journal-navigation | Navigation remains understated and navigable. |
| Opening | typographic-proclamation / image-led-hero / split-editorial-lead | Opening varies with narrative emphasis. |
| Story | long-form-essay / alternating-feature / annotated-gallery | Content may contain lists or cards where functional. |
| Collection | editorial-index / photographic-grid / product-ledger | Choose according to article, portfolio, catalog or menu content. |
| Context | caption-rail / pull-quote / facts-aside | Support the story; no decorative filler. |
| Conversion | reservation-form / inquiry-panel / purchase-action / newsletter | Task clarity wins over ornamental style. |

## 5. Composition grammar and compatibility

1. One dominant visual or typographic gesture per viewport; subsequent content follows a quieter rhythm.
2. Editorial asymmetry must maintain meaningful reading order and intact heading hierarchy in DOM.
3. Story sections use constrained text measure; do not put long paragraphs in 4-column card grids.
4. Product/booking flows may become structured UI, but inherit editorial typography and surface philosophy.
5. Image overlays require contrast-safe backing or text outside the image. Never hide critical CTA in a hover-only state.

**General compatibility check:** recipe choices must satisfy required data shape, accessibility, screen size, and available neighboring slots. Never use incompatible combinations by merely hiding broken regions with CSS.

## 6. Sample screen archetype compositions

| Screen pattern | Slot composition | Typical cross-domain fit |
| --- | --- | --- |
| Narrative landing | Masthead + Opening + alternating-feature + Conversion | Restaurants, editorial brands, boutiques |
| Curated collection | Masthead + editorial-index or photographic-grid + detail + Conversion | Bookshop, portfolio, art catalog |
| Deep content | Masthead + essay + caption-rail + related stories | Publishing, courses, cultural organizations |

These are **examples**, not universally locked layouts. Variants can be added after manual review and grammar validation.

## 7. Context-driven mappings: same family, different project

| Project example | Resulting UI direction |
| --- | --- |
| Restaurant | Large headline, menu as editorial index, seasonal story, reservation form. Avoid turning dining into SaaS dashboards. |
| Independent bookstore | Category-led catalog, tactile product detail, reading notes, clear add-to-cart interactions. |
| Architecture portfolio | Asymmetric project gallery, discipline-specific captions, project case studies with measured reading width. |

The UI must derive feature lists, page count, field names, and actions from project context, not from these example domains.

## 8. Variation boundaries

| Axis | Allowed range / choices | Selection guidance |
| --- | --- | --- |
| Hero | text-first \| image-first \| split-editorial | Choose based on available content and visual quality. |
| Collection | editorial-index \| photographic-grid \| product-ledger | Must still serve browse, filter and detail needs. |
| Temperature | warm paper \| neutral mineral \| high-contrast ink | Avoid exact palette clones. |
| Accent | oxide red \| forest green \| deep navy | Single purposeful accent at a time. |
| Serif | Newsreader \| Fraunces \| Instrument Serif | Contrast with one restrained sans. |
| Image ratio | portrait 3:4 \| landscape 4:3 \| wide 16:9 | Apply per content slot rather than globally. |

**Lock strategy:** Design DNA + invariants + grammar remain stable at family level. Concrete choices of axis values, recipes, entity mapping, and page hierarchy are locked only after a project-specific Blueprint is approved.

## 9. Anti-patterns and demo brief

**Avoid:** Uniform SaaS bento grid, giant meaningless gradients, generic corporate icons, oversized hero on every subpage, text baked into images, random mixed serif pairs, every section inside a card.

**Original UI-only showcase:** Build three original demo screens under fictional **Fieldnotes House**: (1) restaurant/editorial home, (2) curated book/product collection, (3) portfolio/story detail. These are demonstrations of the family across domains, not three clones with recolored content. All interactions front-end only.

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
  "familyId": "editorial-craft",
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
