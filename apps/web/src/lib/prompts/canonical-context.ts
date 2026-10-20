import type { CanonicalProjectContext, ContextProvenance } from '@repo/types'

// ============================================================
// Canonical Context Authoritative Block Helper (BK-035)
// Formats confirmed decisions, assumptions, and unknowns
// as a single cross-document source of truth for all generators.
// ============================================================

export interface AuthoritativeContextItem {
  value: string
  provenance: ContextProvenance
}

function normalizeProvenance(val: unknown): ContextProvenance {
  if (typeof val === 'string') {
    const lower = val.toLowerCase()
    if (lower === 'confirmed' || lower === 'assumed' || lower === 'unknown') {
      return lower
    }
  }
  return 'unknown'
}

function extractItem(item: unknown): AuthoritativeContextItem | null {
  if (!item) return null
  if (typeof item === 'string') {
    const trimmed = item.trim()
    return trimmed ? { value: trimmed, provenance: 'unknown' } : null
  }
  if (typeof item === 'object') {
    const record = item as Record<string, unknown>
    const value =
      typeof record.value === 'string'
        ? record.value
        : typeof record.requirement === 'string'
          ? record.requirement
          : typeof record.description === 'string'
            ? record.description
            : typeof record.name === 'string'
              ? record.name
              : ''
    if (value.trim()) {
      return {
        value: value.trim(),
        provenance: normalizeProvenance(record.provenance),
      }
    }
  }
  return null
}

function parseContextInput(
  input: CanonicalProjectContext | Record<string, unknown> | string,
): Record<string, unknown> | null {
  if (!input) return null
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input)
      return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null
    } catch {
      return null
    }
  }
  return typeof input === 'object' ? (input as Record<string, unknown>) : null
}

/**
 * Builds a bounded authoritative decision block from canonical project context.
 * Confirmed decisions are marked immutable; assumptions and unknowns remain explicitly non-authoritative.
 * ponytail: string-formatted block injected directly into generator prompts; upgrade to XML AST if prompts move to structured DSL.
 */
export function buildAuthoritativeContextBlock(
  contextInput: CanonicalProjectContext | Record<string, unknown> | string,
): string {
  const context = parseContextInput(contextInput)
  if (!context) {
    return [
      '### AUTHORITATIVE CANONICAL DECISIONS & PRECEDENCE (BK-035)',
      '- Context data not available or malformed.',
      '- PRECEDENCE RULE: Confirmed project facts override any inferred defaults. Do not fabricate unstated facts.',
    ].join('\n')
  }

  const lines: string[] = [
    '### AUTHORITATIVE CANONICAL DECISIONS & PRECEDENCE (BK-035)',
    'PRECEDENCE & TRUTH RULES:',
    '1. [CONFIRMED] items are immutable ground truth. All generated specifications MUST adhere to them. Never contradict or replace them.',
    '2. [ASSUMED] items are provisional recommendations. Maintain alignment with them, but do not upgrade them to confirmed facts without explicit basis.',
    '3. [UNKNOWN] items are unresolved decisions. Preserve them as open questions; do NOT fabricate facts, secrets, or fake metrics.',
    'DOCUMENT OWNERSHIP: PRD.md owns product scope and requirements; ARCHITECTURE.md owns technical design; DESIGN.md owns visual and interaction decisions; Agent.md owns coding-agent operating rules; BACKLOG.md translates these sources into tasks. These documents do not override confirmed canonical decisions or create new confirmed facts.',
    '',
  ]

  // Stack preferences
  const stack = context.stack_preferences as Record<string, unknown> | undefined
  if (stack && typeof stack === 'object') {
    lines.push('TECHNOLOGY STACK:')
    for (const tier of ['frontend', 'backend', 'database', 'styling'] as const) {
      const item = extractItem(stack[tier])
      if (item) {
        const provenance = item.provenance.toUpperCase()
        lines.push(`${provenance === 'CONFIRMED' ? '- ' : '- [NON-AUTHORITATIVE] '}${tier.toUpperCase()}: ${item.value} [${provenance}]`)
      }
    }
  }

  // Deployment target
  const deployment = extractItem(context.deployment_target)
  if (deployment) {
    const provenance = deployment.provenance.toUpperCase()
    lines.push(`${provenance === 'CONFIRMED' ? '- ' : '- [NON-AUTHORITATIVE] '}DEPLOYMENT: ${deployment.value} [${provenance}]`)
  }

  // Design direction
  const design = extractItem(context.design_direction)
  if (design) {
    const provenance = design.provenance.toUpperCase()
    lines.push(`${provenance === 'CONFIRMED' ? '- ' : '- [NON-AUTHORITATIVE] '}DESIGN DIRECTION: ${design.value} [${provenance}]`)
  }

  // Confirmed decisions
  const confirmedDecisions = Array.isArray(context.confirmed_decisions)
    ? context.confirmed_decisions.map(extractItem).filter((i): i is AuthoritativeContextItem => i !== null)
    : []
  if (confirmedDecisions.length > 0) {
    lines.push('', 'CANONICAL DECISIONS:')
    for (const dec of confirmedDecisions) {
      const provenance = dec.provenance.toUpperCase()
      lines.push(`${provenance === 'CONFIRMED' ? '- ' : '- [NON-AUTHORITATIVE] '}${dec.value} [${provenance}]`)
    }
  }

  // Technical constraints
  const constraints = Array.isArray(context.technical_constraints)
    ? context.technical_constraints.map(extractItem).filter((i): i is AuthoritativeContextItem => i !== null)
    : []
  if (constraints.length > 0) {
    lines.push('', 'TECHNICAL CONSTRAINTS:')
    for (const c of constraints) {
      const provenance = c.provenance.toUpperCase()
      lines.push(`${provenance === 'CONFIRMED' ? '- ' : '- [NON-AUTHORITATIVE] '}${c.value} [${provenance}]`)
    }
  }

  // Core entities
  const entities = Array.isArray(context.core_entities) ? context.core_entities : []
  if (entities.length > 0) {
    lines.push('', 'CORE DOMAIN ENTITIES:')
    for (const ent of entities) {
      if (typeof ent === 'object' && ent !== null) {
        const entObj = ent as Record<string, unknown>
        const name = typeof entObj.name === 'string' ? entObj.name : 'Entity'
        const fields = Array.isArray(entObj.fields) ? entObj.fields.join(', ') : ''
        const provenance = typeof entObj.provenance === 'string' ? normalizeProvenance(entObj.provenance).toUpperCase() : 'UNKNOWN'
        const value = `${name}${fields ? `: fields [${fields}]` : ''}`
        lines.push(`${provenance === 'CONFIRMED' ? '- ' : '- [NON-AUTHORITATIVE] '}${value} [${provenance}]`)
      }
    }
  }

  // Functional Requirements summary
  const funcReqs = Array.isArray(context.functional_requirements) ? context.functional_requirements : []
  if (funcReqs.length > 0) {
    lines.push('', 'FUNCTIONAL REQUIREMENTS:')
    for (const req of funcReqs) {
      if (typeof req === 'object' && req !== null) {
        const r = req as Record<string, unknown>
        const id = typeof r.id === 'string' ? r.id : 'FR'
        const title = typeof r.title === 'string' ? r.title : ''
        const prov = normalizeProvenance(r.provenance).toUpperCase()
        lines.push(`- ${id}: ${title} [${prov}]`)
      }
    }
  }

  // Provisional / Open areas
  const assumptions = Array.isArray(context.assumptions)
    ? context.assumptions.map(extractItem).filter((i): i is AuthoritativeContextItem => i !== null)
    : []
  const openQuestions = Array.isArray(context.open_questions)
    ? context.open_questions.map(extractItem).filter((i): i is AuthoritativeContextItem => i !== null)
    : []

  if (assumptions.length > 0 || openQuestions.length > 0) {
    lines.push('', 'PROVISIONAL / NON-AUTHORITATIVE ITEMS (DO NOT TREAT AS FACT):')
    if (assumptions.length > 0) {
      lines.push('Assumptions:')
      for (const a of assumptions) {
        lines.push(`  - ${a.value} [${a.provenance.toUpperCase()}]`)
      }
    }
    if (openQuestions.length > 0) {
      lines.push('Open Questions:')
      for (const q of openQuestions) {
        lines.push(`  - ${q.value} [${q.provenance.toUpperCase()}]`)
      }
    }
  }

  return lines.join('\n')
}
