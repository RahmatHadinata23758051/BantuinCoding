# ARCHITECTURE.md — Project Bootstrapper

> Architecture contract for the current modular-monolith implementation.

## 1. System Shape

```text
Next.js Web Application
├── Server Components / Client Workbench
├── Route Handlers and Server Actions
├── Application Services
│   ├── Project Service
│   ├── Provider Service
│   ├── Requirement Engine
│   ├── Context Engine
│   ├── Artifact Planner / Generator
│   ├── Skill Resolver
│   ├── Backlog Planner
│   ├── Consistency Validator
│   └── Export Service
├── Provider Adapters
└── Prisma / PostgreSQL Persistence
```

The MVP remains a modular monolith. Microservices, queues, event buses, CQRS, and distributed orchestration are out of scope unless a later approved requirement needs them.

## 2. Frontend Architecture

- Next.js App Router and React Server Components are the default.
- Client Components are used only for interactive workbench state, editor behavior, provider setup, and mutation feedback.
- Server-side authentication protects dashboard and project routes.
- Server Actions own form mutations where already established.
- Route Handlers expose provider, project, generation, artifact, backlog, validation, and export operations.
- Browser code never receives a raw provider key after submission.

## 3. Design-System Boundary

`DESIGN.md` is the canonical visual contract.

Implementation layers:

```text
apps/web/src/app/globals.css
  → semantic color, border, shadow, texture, type, focus, and motion tokens

apps/web/src/lib/ui.ts
  → class composition helper

apps/web/src/app/components/ui/*
  → reusable primitive components when repetition justifies them

apps/web/src/app/components/*
  → product-specific pipeline, provider, project, and document workbench surfaces

apps/web/src/app/**/page.tsx
  → route composition; avoid duplicating primitive style logic
```

The visual system is locked to premium neo-brutalist comic editorial styling. The design architecture must centralize tokens rather than scatter unrelated one-off values across pages.

## 4. Online Component Integration

Curated sources may include Neobrutalism Components, 21st.dev, shadcn/ui, and Base UI.

Integration rules:

- inspect license and dependency footprint,
- import only components needed by an approved flow,
- keep adapted source inside the repository,
- preserve accessibility behavior,
- restyle to canonical semantic tokens,
- do not install a full design-system runtime for one small primitive,
- do not allow copied code to introduce gradients, glass, unsafe HTML, or secret handling.

## 5. State and Data Boundaries

- Canonical Project Context is the source for all artifact generation.
- Provider adapters isolate vendor SDKs from business logic.
- Project, Artifact, and BacklogTask state machines remain explicit domain behavior.
- UI presentation must consume real state and must not infer or fabricate readiness.
- Artifact preview renders sanitized Markdown HTML.
- Export validates paths and scans artifact contents for secrets before creating ZIP output.

## 6. Responsive Composition

- Desktop uses an information-dense workbench with pipeline rail/strip, ledgers, and split panes.
- Tablet/mobile preserve the same semantic order using stacked ledgers, horizontally scrollable chapter navigation, and editor/preview modes.
- Responsive changes must not remove the current project state, next action, provider blocker, or document status.

## 7. Quality Constraints

Every frontend change must verify:

- typecheck,
- lint,
- relevant tests,
- production build when route/module boundaries change,
- keyboard focus and semantics,
- reduced-motion behavior,
- responsive behavior,
- no secret exposure,
- no unreviewed external component code.
