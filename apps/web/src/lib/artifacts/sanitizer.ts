import { marked } from 'marked'

/**
 * Basic HTML sanitizer to strip dangerous elements (script, iframe, style, onclick attributes)
 * ensuring zero script execution or XSS when rendering raw HTML generated from Markdown.
 */
export function sanitizeHtml(html: string): string {
  // Strip <script>...</script>
  let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  // Strip <iframe>...</iframe>
  clean = clean.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
  // Strip inline event handlers e.g. onclick=..., onerror=...
  clean = clean.replace(/\s+on\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
  // Strip javascript: URLs
  clean = clean.replace(/href\s*=\s*(?:'javascript:[^']*'|"javascript:[^"]*")/gi, 'href="#"')

  return clean
}

/**
 * Parses Markdown into sanitized HTML.
 */
export function renderMarkdownToHtml(markdown: string): string {
  const rawHtml = marked.parse(markdown, { async: false }) as string
  return sanitizeHtml(rawHtml)
}
