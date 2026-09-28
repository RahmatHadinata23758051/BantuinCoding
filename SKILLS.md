# SKILLS.md — Frontend Craft and Implementation Skills

This file records the skills and references relevant to the locked premium neo-brutalist comic editorial direction.

## Anti-Slop UI Review

**Purpose:** Prevent generic AI/SaaS composition, visual filler, fake data, and copy-pasted component-library appearance.

**Use when:**

- composing any page,
- reviewing visual hierarchy,
- evaluating empty/loading/error states,
- performing final UI QC.

**Checks:**

- no generic gradient hero,
- no glassmorphism,
- no repeated identical rounded-card grid,
- no fake metrics or decorative charts,
- no irrelevant icons or filler copy,
- one clear signature motif: the pipeline strip.

## Neo-Brutalist Design System

**Purpose:** Implement the tokens and primitives defined by `DESIGN.md` consistently.

**Use when:**

- editing global tokens,
- building buttons, inputs, badges, panels, tabs, ledgers, dialogs, and callouts,
- styling landing/auth/dashboard/workspace/editor surfaces.

**Core techniques:**

- warm paper canvas,
- near-black 2–3 px borders,
- hard offset shadows,
- flat functional accent colors,
- restrained comic/editorial devices,
- active press transforms,
- responsive asymmetric composition.

## Component Source Curation

**Purpose:** Select high-quality online components without creating dependency bloat or a pasted-template result.

**Approved references:**

- [Neobrutalism Components](https://www.neobrutalism.dev/) — React/Tailwind patterns, MIT license.
- [21st.dev](https://21st.dev/) — component craft and interaction references.
- [shadcn/ui](https://ui.shadcn.com/) — source-owned component structures.
- [Base UI](https://base-ui.com/) — accessible unstyled interaction behavior.

**Required workflow:**

1. Inspect source and license.
2. Check Next.js 16, React 19, and Tailwind v4 compatibility.
3. Review dependencies and bundle impact.
4. Audit keyboard behavior, labels, focus, and reduced motion.
5. Copy only the needed source when permitted.
6. Replace library theme values with local semantic tokens.
7. Remove decorative features unrelated to the product task.
8. Run typecheck, lint, tests, and browser QA.

## Accessibility

**Purpose:** Keep expressive visuals usable.

**Use when:** implementing or reviewing every interactive screen.

**Checks:**

- semantic landmarks and headings,
- associated form labels,
- keyboard-operable tabs and controls,
- visible focus,
- readable contrast,
- text alternatives where needed,
- no color-only status,
- practical touch targets,
- reduced-motion support.

## Responsive Workbench Design

**Purpose:** Preserve an information-dense developer workflow across desktop, tablet, and mobile.

**Patterns:**

- ledgers collapse into stacked rows,
- pipeline chapters may scroll horizontally,
- editor split view switches to explicit editor/preview modes on narrow screens,
- actions stay near the content they affect,
- project state and blockers remain visible.

## Secure BYOK UI

**Purpose:** Present provider configuration without leaking secrets.

**Rules:**

- password-style key input,
- never echo the full key,
- clear key state after a successful request,
- show safe provider/model metadata only,
- actionable typed error messages,
- no keys in client logs, URL parameters, analytics, generated Markdown, or ZIP files.

## Markdown Workspace Craft

**Purpose:** Deliver high-quality document editing and preview.

**Rules:**

- preserve sanitized rendering,
- optimize line length and heading rhythm,
- make file/status navigation scannable,
- keep editor chrome expressive but reading surfaces calm,
- preserve edit/split/preview behavior,
- make saving and modified/outdated/failed states explicit.
