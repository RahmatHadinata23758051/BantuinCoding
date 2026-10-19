# Visual Reference Preview Workspace

Place each source visual specification here as a standalone Markdown file, for example `notion.md`, `ramp.md`, or `cursor.md`. These files are inputs for generating original, frontend-only previews; they are not runtime data and must not include backend, API, database, or production-app implementation instructions.

Codex should read a chosen specification and create its isolated static preview under the matching public directory, for example:

```text
templates/visual-references/notion.md
apps/web/public/visual-references/notion/index.html
apps/web/public/visual-references/notion/thumbnail.webp
```

The preview should be original, responsive, self-contained, and use local illustrative content. Capture only the visual direction—do not copy third-party source code, assets, or product screens pixel-for-pixel, and do not imply affiliation with the referenced product. A preview is a visual sample, not a functional or connected application.

Keep large preview media in the matching `apps/web/public/visual-references/<id>/` directory and load full previews only when opened. Use a small thumbnail in any future gallery. This directory layout prepares the workspace only; it does not add a gallery, modal, iframe, generator workflow, or runtime integration.
