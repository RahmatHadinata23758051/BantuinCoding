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
  return 'assumed'
}

function extractItem(item: unknown): AuthoritativeContextItem | null {
  if (!item) return null
  if (typeof item === 'string') {
    const trimmed = item.trim()
    return trimmed ? { value: trimmed, provenance: 'assumed' } : null
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
    '',
  ]

  // Stack preferences
  const stack = context.stack_preferences as Record<string, unknown> | undefined
  if (stack && typeof stack === 'object') {
    lines.push('TECHNOLOGY STACK:')
    for (const tier of ['frontend', 'backend', 'database', 'styling'] as const) {
      const item = extractItem(stack[tier])
      if (item) {
        lines.push(`- ${tier.toUpperCase()}: ${item.value} [${item.provenance.toUpperCase()}]`)
      }
    }
  }

  // Deployment target
  const deployment = extractItem(context.deployment_target)
  if (deployment) {
    lines.push(`- DEPLOYMENT: ${deployment.value} [${deployment.provenance.toUpperCase()}]`)
  }

  // Design direction
  const design = extractItem(context.design_direction)
  if (design) {
    lines.push(`- DESIGN DIRECTION: ${design.value} [${design.provenance.toUpperCase()}]`)
  }

  // Confirmed decisions
  const confirmedDecisions = Array.isArray(context.confirmed_decisions)
    ? context.confirmed_decisions.map(extractItem).filter((i): i is AuthoritativeContextItem => i !== null)
    : []
  if (confirmedDecisions.length > 0) {
    lines.push('', 'CONFIRMED DECISIONS (IMMUTABLE):')
    for (const dec of confirmedDecisions) {
      lines.push(`- ${dec.value} [${dec.provenance.toUpperCase()}]`)
    }
  }

  // Technical constraints
  const constraints = Array.isArray(context.technical_constraints)
    ? context.technical_constraints.map(extractItem).filter((i): i is AuthoritativeContextItem => i !== null)
    : []
  if (constraints.length > 0) {
    lines.push('', 'TECHNICAL CONSTRAINTS:')
    for (const c of constraints) {
      lines.push(`- ${c.value} [${c.provenance.toUpperCase()}]`)
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
        lines.push(`- ${name}${fields ? `: fields [${fields}]` : ''}`)
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
        lines.push(`  - ${a.value}`)
      }
    }
    if (openQuestions.length > 0) {
      lines.push('Open Questions:')
      for (const q of openQuestions) {
        lines.push(`  - ${q.value}`)
      }
    }
  }

  return lines.join('\n')
}
