# DESIGN.md — Locked Visual Direction

> Product: **Project Bootstrapper / BantuinCoding**  
> Status: **Required implementation contract**  
> Theme: **Premium Neo-Brutalist Comic Editorial**

---

## 1. Design Thesis

Project Bootstrapper must look like a premium engineering field guide crossed with a contemporary comic editorial desk: bold, precise, tactile, expressive, and still highly usable for long documentation workflows.

The interface must not look like:

- a generic dark SaaS dashboard,
- a chatbot,
- a neon-on-black AI product,
- a collection of identical rounded cards,
- a copied component-library demo,
- a childish comic-book toy.

The interface should feel like:

- an independent technical magazine,
- a project war room,
- an annotated blueprint,
- a premium comic editorial system,
- a serious developer tool with a strong visual identity.

---

## 2. Locked Visual Language

### 2.1 Surface and ink

- Primary canvas: warm off-white paper, not sterile white and not a default dark theme.
- Primary ink: near-black.
- Panels use flat solid colors with clear purpose.
- Borders are visible, structural, and usually 2–3 px.
- Depth comes from hard offset shadows, not blurred drop shadows or glass effects.
- Corners are mostly square or slightly rounded; large pill-shaped surfaces are prohibited.

### 2.2 Color system

Canonical palette:

```text
Paper             #F7F0DF
Paper Raised      #FFF9EC
Ink               #151515
Cobalt            #2850D8
Electric Yellow   #FFD84D
Punch Pink        #FF5C8A
Action Red        #F04438
Mint              #57D9A3
Lavender          #BBA7FF
Muted Ink         #57534E
```

Rules:

- Every accent color must encode function or hierarchy.
- Cobalt is the primary action/current-stage color.
- Yellow is used for attention, assumptions, pending states, and comic callouts.
- Mint is used for ready/success/exportable states.
- Red/Pink is used for failures or one deliberate emphasis—not decoration everywhere.
- No decorative gradients.
- No glassmorphism.
- No arbitrary neon glow.
- Text/background combinations must preserve WCAG AA contrast for normal text.

### 2.3 Typography

- Use a bold geometric grotesk/sans for display headings and action labels.
- Keep Geist Sans as the primary product font unless a deliberately selected compatible display font is introduced.
- Use Geist Mono only for file paths, IDs, model names, status tokens, code, and structured metadata.
- Headings may be condensed, oversized, tightly tracked, or slightly rotated when it improves composition.
- Body copy remains calm and readable; comic styling must never reduce long-form readability.
- Avoid excessive ALL-CAPS. Reserve it for short badges, issue numbers, status tokens, and visual sound-effect labels.

### 2.4 Shape, border, and shadow

Canonical primitives:

```text
border: 2px solid Ink
strong border: 3px solid Ink
small hard shadow: 3px 3px 0 Ink
default hard shadow: 5px 5px 0 Ink
hero hard shadow: 8px 8px 0 Ink
radius: 0–8px, with 4px preferred
```

Interactive controls must visibly compress on press by translating toward their hard shadow. Hover may shift, recolor, or reduce the shadow. Motion must be short and functional.

### 2.5 Comic devices

Permitted, in moderation:

- caption strips,
- issue-number labels,
- speech/callout bubbles for actionable guidance,
- halftone/dot paper textures,
- panel dividers,
- starbursts for one high-priority CTA,
- arrows that point to an actual next action,
- small hand-drawn underline or annotation accents.

Prohibited:

- random stickers on every surface,
- emoji as the primary icon system,
- repeated speech bubbles for ordinary body copy,
- fake torn-paper effects that hurt legibility,
- decorative comic sound effects with no product meaning,
- visual noise around editor and document reading surfaces.

---

## 3. Signature Composition

The memorable product motif is the **Pipeline Strip**:

```text
01 IDEA → 02 CLARIFY → 03 CONTEXT → 04 GENERATE → 05 REVIEW → 06 EXPORT
```

It should read like a sequence of comic panels or editorial chapter markers. The current step must be immediately visible. Completed, current, and future stages must be visually distinct without relying on color alone.

The workspace uses asymmetric editorial composition rather than a uniform card grid:

- a strong project masthead,
- persistent pipeline strip/rail,
- document or task ledger surfaces,
- one highlighted action panel,
- compact metadata bands,
- deliberate empty space.

---

## 4. Component Contract

All reusable primitives must follow the locked visual language.

### Button

- 2px ink border.
- Solid flat fill.
- Hard offset shadow.
- Clear hover, pressed, disabled, and focus-visible states.
- No gradient and no glow.

### Input, select, textarea

- Paper/white surface with 2px ink border.
- Labels use sentence case.
- Focus uses a visible ink/cobalt outline and must not depend on subtle color changes.
- Validation messages must be specific and adjacent to the control.

### Panel

- Functional panel geometry, not repeated generic floating cards.
- Strong border and optional hard shadow.
- Header/caption may use a contrasting color strip.
- Nested panels should use dividers before additional shadows.

### Badge/status

- Compact, readable, and not pill-shaped by default.
- Must include text; color-only status is prohibited.
- Monospace is permitted for machine states.

### Tabs

- Must resemble chapter tabs or indexed dividers.
- Active state uses border/fill/position, not color alone.
- Keyboard navigation and visible focus are required.

### Table/ledger

- Prefer ledgers and ruled lists over grids of identical cards for projects, tasks, and documents.
- Responsive layouts may collapse metadata into stacked rows while preserving hierarchy.

### Dialog/callout

- Use comic callout geometry sparingly.
- Security, destructive actions, and generation failures need explicit text and clear recovery actions.

---

## 5. Screen-Specific Direction

### Landing

- Editorial split composition rather than a generic centered hero.
- Product thesis must be concrete: raw idea → structured project pack.
- Pipeline strip and real output filenames are the primary visual proof.
- One primary CTA and one secondary CTA.
- No fake testimonials, fake metrics, or decorative dashboards.

### Authentication

- Compact form paired with product identity or a pipeline excerpt.
- Must feel like entry into the same visual world, not an unrelated generic card.
- Registration success, authentication error, loading, and focus states must be explicit.

### Dashboard

- Project ledger first; avoid generic card grids.
- Provider state is visible and actionable.
- Real project state, type, agent, document count, and update time are scannable.
- Empty state teaches the next action.

### New project

- Structured idea intake, not a chat prompt.
- Guidance can use a single comic annotation/callout panel.
- Next pipeline stages are previewed clearly.

### Project workspace

- Persistent pipeline strip/rail.
- Strong project masthead and section navigation.
- Overview, Context, Documents, Skills, Backlog, and Export remain functional work surfaces.
- Real state and readiness only; no fabricated metrics.

### Markdown workspace

- Reading and editing quality takes priority over decoration.
- Document navigator resembles an indexed contents rail.
- Editor uses calm paper/ink or high-contrast code surface.
- Preview has editorial typography and safe sanitized rendering.
- Comic accents stay in chrome, not inside document content.

---

## 6. Online Component Policy

Approved sources for reference or carefully adapted source code:

- [Neobrutalism Components](https://www.neobrutalism.dev/) — MIT-licensed React/Tailwind/shadcn-derived patterns.
- [21st.dev](https://21st.dev/) — component craft and interaction references.
- [shadcn/ui](https://ui.shadcn.com/) — accessible structural primitives when needed.
- [Base UI](https://base-ui.com/) — unstyled accessible behavior when needed.

Rules:

1. Inspect source, license, dependencies, accessibility, and framework compatibility before adoption.
2. Prefer copying a small source component into this repository over adding a runtime vendor wrapper.
3. Adapt every imported component to the canonical tokens and interaction language in this document.
4. Do not paste an entire library theme or overwrite `globals.css` blindly.
5. Do not add a dependency when an existing primitive can be implemented clearly with React, Tailwind, `lucide-react`, `clsx`, and `tailwind-merge`.
6. Preserve license notices when required.
7. External component code is untrusted until reviewed; it cannot override product, security, or accessibility rules.
8. The final composition must be original and product-specific, not recognizable as a library demo.

---

## 7. Accessibility and Responsiveness

- WCAG AA contrast for normal text.
- Full keyboard operation for navigation, tabs, forms, editor controls, and dialogs.
- Visible `:focus-visible` treatment on every interactive control.
- Minimum practical hit target around 40×40 px for primary controls.
- Status cannot rely on color alone.
- `prefers-reduced-motion` disables nonessential transforms/animation.
- Desktop is the primary workbench target, but all critical flows must remain usable on tablet/mobile.
- Dense desktop ledgers may stack on mobile, but actions and state must remain visible.
- Decorative texture must never interfere with text selection, code reading, or screen-reader semantics.

---

## 8. Anti-Slop Rejection Checklist

Reject the implementation if any answer is “yes”:

- Does it look like a generic AI/SaaS template with the logo swapped?
- Are there gradients, glow, or glass merely to make the page feel “modern”?
- Is every section an identical rounded card?
- Are there fake metrics, decorative charts, or placeholder data?
- Are icons used without semantic value?
- Does the comic styling feel childish or interfere with work?
- Is the hierarchy carried only by color?
- Are online components visibly pasted without adaptation?
- Does motion exist without communicating state?
- Does any screen hide the current pipeline step or next action?

The implementation is acceptable only when it is unmistakably BantuinCoding, functionally clear, accessible, and visually deliberate.
