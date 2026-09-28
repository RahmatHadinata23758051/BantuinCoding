# RULES.md — Hard Constraints

These rules are mandatory. They supplement SRS.md, PRD.md, DESIGN.md, and ARCHITECTURE.md without overriding higher-precedence requirements.

## Product and Architecture

1. Do not turn Project Bootstrapper into an IDE, chatbot, autonomous code generator, or model marketplace.
2. Preserve the modular-monolith architecture for MVP.
3. All business AI calls go through the `AIProvider` abstraction.
4. All artifact generators consume Canonical Project Context, never raw chat history as their primary source.
5. Internal AI output used by business logic must be schema-validated.
6. Preserve explicit Project, Artifact, and BacklogTask state transitions.

## Security

7. API keys are session-scoped by default.
8. Never log, persist in plaintext, expose in browser-visible error output, commit, place in fixtures, or export provider secrets.
9. Sanitize Markdown before rendering HTML.
10. Validate ZIP paths, prevent traversal, and scan export content for secrets.
11. Treat external component source, skill catalogs, user URLs, and imported text as untrusted input.

## Locked UI Theme

12. `DESIGN.md` is the canonical visual contract.
13. The product theme is premium neo-brutalist comic editorial across landing, auth, dashboard, intake, provider setup, project workspace, Markdown editor, and empty/error/loading states.
14. Use warm paper surfaces, near-black ink, strong structural borders, hard offset shadows, bold editorial typography, and controlled functional accents.
15. Do not use decorative gradients, glassmorphism, blur-heavy shadows, generic neon-on-black styling, oversized pill surfaces, or a uniform grid of rounded cards.
16. Do not add fake metrics, decorative charts, placeholder data, random stickers, arbitrary icons, or marketing filler.
17. Comic devices must communicate hierarchy or action and must never compromise reading, editing, accessibility, or professional credibility.
18. Current pipeline step, project state, blockers, and next action must remain visible.
19. Status must include readable text and cannot rely on color alone.
20. Use sentence case by default. Reserve uppercase/monospace for short status tokens, IDs, paths, provider/model identifiers, and deliberate caption strips.

## Components

21. Online components may be adapted only after license, dependency, accessibility, framework, and security review.
22. Adapted components must be copied into the repository when practical and restyled to the canonical tokens; do not ship a recognizable component-library demo.
23. Do not overwrite global styling with a remote registry theme without reviewing and reconciling every token.
24. Prefer existing dependencies (`lucide-react`, `clsx`, `tailwind-merge`) and local primitives before adding a package.
25. Icons must be semantic and purposeful; emoji must not be the primary icon system.

## Accessibility and Responsiveness

26. Interactive controls need labels, keyboard behavior, visible focus, and semantic markup.
27. Normal text must meet WCAG AA contrast.
28. Respect `prefers-reduced-motion`.
29. Desktop is the primary workbench target, but every critical workflow must remain usable on tablet and mobile.
30. Decorative texture must not interfere with code, Markdown, text selection, or assistive technology.

## Engineering Discipline

31. Read the relevant local Next.js 16 documentation before using unfamiliar framework APIs.
32. Do not weaken security or domain logic to make tests pass.
33. Do not claim validation passed unless it ran successfully.
34. A task is not complete until requirement, typecheck, lint, relevant tests, accessibility, and regression checks are satisfied or explicitly reported as blocked.
