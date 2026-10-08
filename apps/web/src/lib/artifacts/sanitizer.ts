import { marked } from 'marked'

/**
 * Basic HTML sanitizer to strip dangerous elements (script, iframe, style, onclick attributes)
 * ensuring zero script execution or XSS when rendering raw HTML generated from Markdown.
 */
export function sanitizeHtml(html: string): string {
  // Strip executable elements and their contents.
  let clean = html.replace(
    /<(script|iframe|object|embed|style|link|meta|base)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,
    '',
  )
  clean = clean.replace(/<\/?(script|iframe|object|embed|style|link|meta|base)\b[^>]*>/gi, '')

  // Strip inline event handlers e.g. onclick=..., onerror=... (quoted or unquoted).
  clean = clean.replace(/\s+on[\w:-]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')

  // Replace dangerous URL schemes in every URL-bearing attribute, including unquoted values.
  clean = clean.replace(
    /\b(?:href|src|action|formaction|poster|background|cite|data|xlink:href)\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi,
    (attribute) => {
      const separator = attribute.indexOf('=')
      const name = attribute.slice(0, separator)
      const value = attribute.slice(separator + 1).trim()
      const unquotedValue = value.replace(/^['"]|['"]$/g, '')
      const normalizedValue = unquotedValue.replace(/[\u0000- ]+/g, '').toLowerCase()

      return /^(?:javascript|vbscript|data):/.test(normalizedValue) ? `${name}="#"` : attribute
    },
  )

  return clean
}

/**
 * Parses Markdown into sanitized HTML.
 */
export function renderMarkdownToHtml(markdown: string): string {
  const rawHtml = marked.parse(markdown, { async: false }) as string
  return sanitizeHtml(rawHtml)
}
