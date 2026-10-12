export type BriefFeature = {
  title: string
  description?: string
}

export type BriefScope = {
  included: string[]
  excluded: string[]
}

export type ParsedProjectBrief = {
  paragraphs: string[]
  lead: string
  features: BriefFeature[]
  pageStructure: string[]
  scope: BriefScope
  audience: string[]
}

type BriefContext = Record<string, unknown> | null | undefined

const LABELS = {
  features: /^(?:features?|key features?|fitur(?: utama)?)\s*:?\s*(.*)$/i,
  pageStructure: /^(?:page structure|sections?|section flow|struktur halaman|bagian halaman)\s*:?\s*(.*)$/i,
  audience: /^(?:target audience|audience|target pengguna|audiens)\s*:?\s*(.*)$/i,
  included: /^(?:mvp scope|included|in scope|termasuk(?: dalam mvp)?)\s*:?\s*(.*)$/i,
  excluded: /^(?:out of scope|excluded|not included|pasca-mvp|di luar cakupan mvp|tidak termasuk)\s*:?\s*(.*)$/i,
} as const

function asText(value: unknown): string | null {
  if (typeof value === 'string') {
    const text = value.trim()
    return text || null
  }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>
    if (typeof record.value === 'string') {
      const text = record.value.trim()
      return text || null
    }
  }

  return null
}

function listFromValue(value: unknown): string[] {
  if (!Array.isArray(value)) {
    const text = asText(value)
    return text ? [text] : []
  }

  return value.flatMap((item) => {
    const text = asText(item)
    return text ? [text] : []
  })
}

function firstContextValue(context: BriefContext, keys: string[]): unknown {
  if (!context) return undefined

  for (const key of keys) {
    if (key in context) return context[key]
  }

  return undefined
}

function splitInlineItems(value: string): string[] {
  return value
    .split(/\s*[;|]\s*/)
    .map((item) => item.replace(/^[-*•]\s*/, '').trim())
    .filter(Boolean)
}

function parseExplicitSections(paragraphs: string[]) {
  const result = {
    features: [] as BriefFeature[],
    pageStructure: [] as string[],
    audience: [] as string[],
    included: [] as string[],
    excluded: [] as string[],
  }

  for (const paragraph of paragraphs) {
    const lines = paragraph
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
    if (lines.length === 0) continue

    const firstLine = lines[0]
    const remainder = lines.slice(1)
    const matches = Object.entries(LABELS).find(([, pattern]) => pattern.test(firstLine))
    if (!matches) continue

    const [section, pattern] = matches
    const inline = firstLine.match(pattern)?.[1]?.trim() ?? ''
    const items = [
      ...(inline ? splitInlineItems(inline) : []),
      ...remainder
        .filter((line) => /^[-*•]\s+/.test(line))
        .map((line) => line.replace(/^[-*•]\s+/, '').trim())
        .filter(Boolean),
    ]

    if (items.length === 0) continue

    if (section === 'features') {
      result.features.push(...items.map((item) => ({ title: item })))
    } else if (section === 'pageStructure') {
      result.pageStructure.push(...items)
    } else if (section === 'audience') {
      result.audience.push(...items)
    } else if (section === 'included') {
      result.included.push(...items)
    } else if (section === 'excluded') {
      result.excluded.push(...items)
    }
  }

  return result
}

function contextFeatures(context: BriefContext): BriefFeature[] {
  const value = firstContextValue(context, ['functional_requirements', 'features', 'key_features'])
  return listFromValue(value).map((title) => ({ title }))
}

function contextScope(context: BriefContext): BriefScope {
  const value = firstContextValue(context, ['mvp_scope', 'scope'])
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { included: [], excluded: [] }
  }

  const record = value as Record<string, unknown>
  return {
    included: listFromValue(record.included ?? record.in_scope ?? record.features),
    excluded: listFromValue(record.excluded ?? record.out_of_scope ?? record.not_included),
  }
}

function splitParagraphs(normalized: string): string[] {
  if (!normalized) return []

  const blocks = normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  return blocks.flatMap((block) => {
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean)
    if (lines.length <= 1) return [block]

    const sectionStart = lines.findIndex((line) =>
      Object.values(LABELS).some((pattern) => pattern.test(line)),
    )
    const firstSectionLine = sectionStart >= 0 ? lines[sectionStart] : null
    const hasListItems = lines.some((line) => /^[-*•]\s+/.test(line))

    if (sectionStart > 0) {
      return [lines.slice(0, sectionStart).join('\n'), lines.slice(sectionStart).join('\n')]
    }
    if (firstSectionLine || hasListItems) return [block]
    return lines
  })
}

export function parseProjectBrief(description: string | null | undefined, context?: BriefContext): ParsedProjectBrief {
  const normalized = (description ?? '').replace(/\r\n?/g, '\n').trim()
  const paragraphs = splitParagraphs(normalized)
  const explicit = parseExplicitSections(paragraphs)
  const structuredScope = contextScope(context)
  const structuredFeatures = contextFeatures(context)
  const structuredAudience = listFromValue(firstContextValue(context, ['target_audience', 'audience', 'users']))
  const structuredStructure = listFromValue(firstContextValue(context, ['page_structure', 'sections', 'section_flow']))

  return {
    paragraphs,
    lead: asText(firstContextValue(context, ['summary', 'project_summary'])) ?? paragraphs[0] ?? '',
    features: structuredFeatures.length > 0 ? structuredFeatures : explicit.features,
    pageStructure: structuredStructure.length > 0 ? structuredStructure : explicit.pageStructure,
    scope: {
      included: structuredScope.included.length > 0 ? structuredScope.included : explicit.included,
      excluded: structuredScope.excluded.length > 0 ? structuredScope.excluded : explicit.excluded,
    },
    audience: structuredAudience.length > 0 ? structuredAudience : explicit.audience,
  }
}
