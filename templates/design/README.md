# BantuinCoding — Design Family Reference Pack

This pack contains **six standalone `design-*.md` master specifications** for creating original, frontend-only reference UI families. They are not copied website designs, per-category page templates, or production application implementations.

## Included design families

- [`design-structured-enterprise.md`](design-structured-enterprise.md) — **Structured Enterprise**: An interface that makes complex work feel controlled. Information is organized by task, urgency, and next action—not by a decorative grid of identical cards.
- [`design-editorial-craft.md`](design-editorial-craft.md) — **Editorial Craft**: Content, cadence, and typographic expression are the product. The interface unfolds through deliberate composition and pacing rather than a stack of uniform components.
- [`design-precision-technical.md`](design-precision-technical.md) — **Precision Technical**: An interface as trustworthy as an instrument panel: exact units, stable alignment, discernible states, and controlled signal density. Technical credibility comes from accuracy, not neon decoration.
- [`design-expressive-creative.md`](design-expressive-creative.md) — **Expressive Creative**: A memorable digital voice built from daring composition and confident typography. Expression is purposeful: the brand has one distinct move instead of fifty competing gimmicks.
- [`design-calm-and-human.md`](design-calm-and-human.md) — **Calm & Human**: A quiet interface that respects attention, reduces anxiety, and helps people complete meaningful tasks without friction. Friendly does not mean childish; clarity is the warmth.
- [`design-refined-luxury.md`](design-refined-luxury.md) — **Refined Luxury**: Confidence through restraint. Editorial craft, impeccable pacing, and imagery do the persuasive work; every extra ornament must earn its place. Luxury is precision and authenticity, not black-and-gold decoration.

## Recommended workflow

1. Choose **one family** to build first; start with Structured Enterprise, Editorial Craft, or Precision Technical.
2. Give Claude Code the chosen `design-*.md` plus 3–5 visual references you have permission to use as inspiration. Do not copy third-party source/UI pixel for pixel.
3. Ask for a **frontend-only original showcase** demonstrating multiple recipes across domain examples; no backend or API scaffolding.
4. Critique the finished screens at desktop, tablet, and mobile. Refine typography, spacing, navigation, density, and states before publishing the family.
5. Extract/validate a machine-readable `TemplateFamily` (Design DNA, grammar, recipe registry, variation bounds) and register it with an immutable version.
6. Only afterward integrate synthesis: `Canonical Context + TemplateFamily -> DesignBlueprint -> preview + DESIGN.md`.

## Suggested Claude Code instruction

> Read the selected `design-*.md` as a family-level art-direction/grammar specification. Build an original frontend-only UI showcase with three distinct domain-specific screens and at least two truly different compositions. Use local typed fixture data and working client-side controls; do not create backend, DB, auth, or fake integrations. Do not lock one demo layout as the only allowed template structure. Preserve family invariants, adapt the screen structure to each sample project's jobs-to-be-done, and validate responsiveness/accessibility. Explain what is locked vs variable and why each recipe was selected.

## Important distinction

- **Family-spec lock:** aesthetic philosophy, UX principles, compatibility grammar, and invariants.
- **Project Blueprint lock:** final palette, typography choice, concrete recipes, layout, and content hierarchy for one approved project.
- **Canonical Context:** the product's real requirements, pages, and interactions; it wins over irrelevant showcase compositions.

The files use **reference values**, not a promise that every website using the family must share colors, fonts, or layout. Version `0.1.0` marks an editorial reference draft, not an implemented or audited production family.
