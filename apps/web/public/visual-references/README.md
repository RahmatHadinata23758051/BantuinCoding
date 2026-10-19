# Generated Static Previews

This directory holds standalone static previews generated for each visual reference.

## Structure
```
apps/web/public/visual-references/
├── [theme-id]/
│   ├── index.html        # Standalone HTML preview (CSS + HTML only, zero backend)
│   ├── preview.webp      # Static screenshot / card thumbnail (small file size)
│   └── preview.webm      # Optional short loop video for hover effect (< 500 KB)
```

## Direct Browser URL
Each preview is accessible at:
`http://localhost:3000/visual-references/[theme-id]/index.html`

## Rules for Previews
1. **Frontend only:** zero external API calls, zero database connections, zero secrets.
2. **Self-contained:** all styles (Tailwind CDN, standard CSS) are embedded or loaded cleanly without leaking into the main application.
3. **Scrollable:** full-page layout so users can scroll and explore the visual feel in the modal.
