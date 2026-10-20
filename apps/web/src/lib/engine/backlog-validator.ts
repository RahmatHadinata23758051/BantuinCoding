import type { GeneratedBacklogPhase, GeneratedBacklogTask } from '@/lib/prompts/backlog-generator'

export interface BacklogValidationResult {
  isValid: boolean
  errors: string[]
  taskStatusMap: Record<string, 'READY' | 'PENDING' | 'BLOCKED'>
}

export interface BacklogQualityOptions {
  plannedDocumentPaths: string[]
  sourceTexts: string[]
  confirmedContextJson: string
}

const FILLER_ACCEPTANCE_CRITERIA = new Set([
  'ac',
  'acceptance criteria',
  'done',
  'implemented',
  'it works',
  'n/a',
  'none',
  'placeholder',
  'todo',
  'tbd',
  'works as expected',
])
const FILLER_DEFINITION_OF_DONE = new Set([
  'complete',
  'completed',
  'done',
  'tests pass',
  'verified and tested',
  'verified and tests pass',
  'works',
])
const STACK_AND_TOOL_TERMS = [
  'Prisma', 'Zod', 'TypeScript', 'Vitest', 'Jest', 'Playwright', 'ESLint',
  'pnpm', 'npm', 'yarn', 'bun', 'SQLite', 'PostgreSQL', 'MySQL',
]

function normalizeDocPath(path: string): string {
  return path.trim().replace(/\\/g, '/').replace(/^(?:\.\/)+/, '').toLowerCase()
}

function isDocumentedRepositoryPath(path: string, sourceTexts: string[]): boolean {
  const normalizedPath = normalizeDocPath(path)
  return sourceTexts.some((source) => {
    const normalizedSource = source.replace(/\\/g, '/').toLowerCase()
    return [
      `\`${normalizedPath}\``,
      `"${normalizedPath}"`,
      `'${normalizedPath}'`,
    ].some((quotedPath) => normalizedSource.includes(quotedPath))
  })
}

function confirmedContextFacts(contextJson: string): string[] {
  try {
    const context = JSON.parse(contextJson) as Record<string, unknown>
    const facts: string[] = []
    const addConfirmed = (value: unknown) => {
      if (typeof value !== 'object' || value === null) return
      const item = value as Record<string, unknown>
      if (typeof item.provenance === 'string' && item.provenance.toLowerCase() === 'confirmed' && typeof item.value === 'string') {
        facts.push(item.value)
      }
    }
    const stack = context.stack_preferences
    if (typeof stack === 'object' && stack !== null) Object.values(stack).forEach(addConfirmed)
    for (const key of ['technical_constraints', 'confirmed_decisions']) {
      const items = context[key]
      if (Array.isArray(items)) items.forEach(addConfirmed)
    }
    return facts
  } catch {
    return []
  }
}

function isExplicitlyExcludedByConfirmedFacts(term: string, confirmedFacts: string[]): boolean {
  const exclusions = confirmedFacts.join('\n')
  if (term === 'Prisma' && /\bSQLite\b.*\bwithout\s+Prisma\b/i.test(exclusions)) return true
  if (new RegExp(`\\b(?:without|no|not using|exclude(?:d)?|avoid)\\s+(?:the\\s+)?${term}\\b`, 'i').test(exclusions)) return true
  if (term === 'TypeScript' && /\bplain JavaScript\b|\bJavaScript only\b/i.test(exclusions)) return true
  if (term === 'PostgreSQL' && /\bSQLite\b/i.test(exclusions)) return true
  if (term === 'SQLite' && /\bPostgreSQL\b/i.test(exclusions)) return true
  if (term === 'MySQL' && /\b(?:SQLite|PostgreSQL)\b/i.test(exclusions)) return true
  return false
}

function termPattern(term: string): RegExp {
  return new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
}

function mentionsTermAffirmatively(text: string, term: string): boolean {
  if (!termPattern(term).test(text)) return false
  const negatedTerms = new Set<string>()
  const negatedClauses = text.matchAll(/\b(?:without|no|not\s+using|do\s+not\s+use|exclude(?:d)?|avoid)\b([^.!?;\n]*)/gi)
  for (const [, clause] of negatedClauses) {
    for (const candidate of STACK_AND_TOOL_TERMS) {
      if (termPattern(candidate).test(clause)) negatedTerms.add(candidate)
    }
  }
  return !negatedTerms.has(term)
}

function normalizedText(value: string): string {
  return value.trim().toLowerCase().replace(/[.!?]+$/, '').replace(/\s+/g, ' ')
}

export function validateBacklogQuality(
  phases: GeneratedBacklogPhase[],
  options: BacklogQualityOptions,
): string[] {
  const errors: string[] = []
  const plannedPaths = new Set(options.plannedDocumentPaths.map(normalizeDocPath))
  const sourceTexts = [...options.sourceTexts, options.confirmedContextJson]
  const documentedText = sourceTexts.join('\n')
  const confirmedFacts = confirmedContextFacts(options.confirmedContextJson)

  for (const phase of phases) {
    for (const task of phase.tasks) {
      if (task.acceptance_criteria.length === 0) {
        errors.push(`${task.id} must have at least one concrete acceptance criterion.`)
      }
      if (task.acceptance_criteria.some((criterion) => FILLER_ACCEPTANCE_CRITERIA.has(normalizedText(criterion)))) {
        errors.push(`${task.id} contains an empty or placeholder acceptance criterion.`)
      }
      if (FILLER_DEFINITION_OF_DONE.has(normalizedText(task.definition_of_done))) {
        errors.push(`${task.id} needs a specific, verifiable definition of done.`)
      }
      for (const doc of task.relevant_docs) {
        const normalized = normalizeDocPath(doc)
        if (!plannedPaths.has(normalized) && !isDocumentedRepositoryPath(normalized, sourceTexts)) {
          errors.push(`${task.id} references unplanned or undocumented document path "${doc}".`)
        }
      }
      const taskText = [task.title, task.description, ...task.acceptance_criteria, task.definition_of_done].join('\n')
      for (const term of STACK_AND_TOOL_TERMS) {
        if (!mentionsTermAffirmatively(taskText, term)) continue
        if (!termPattern(term).test(documentedText) || isExplicitlyExcludedByConfirmedFacts(term, confirmedFacts)) {
          errors.push(`${task.id} uses unsupported or conflicting technology/tool "${term}".`)
        }
      }
    }
  }

  return errors
}

/**
 * Validates backlog tasks for missing dependency references, circular dependencies,
 * and readiness status based on dependencies.
 */
export function validateBacklogDependencies(
  phases: GeneratedBacklogPhase[],
  completedTaskIds: Set<string> = new Set(),
): BacklogValidationResult {
  const errors: string[] = []
  const allTasks = new Map<string, GeneratedBacklogTask>()

  for (const phase of phases) {
    for (const task of phase.tasks) {
      if (allTasks.has(task.id)) errors.push(`Duplicate task ID found: ${task.id}`)
      allTasks.set(task.id, task)
    }
  }

  for (const task of allTasks.values()) {
    for (const depId of task.dependencies) {
      if (!allTasks.has(depId) && !completedTaskIds.has(depId)) {
        errors.push(`Task ${task.id} references non-existent dependency: ${depId}`)
      }
    }
  }

  const visited = new Set<string>()
  const recursionStack = new Set<string>()

  function detectCycle(taskId: string, path: string[]): boolean {
    visited.add(taskId)
    recursionStack.add(taskId)

    const task = allTasks.get(taskId)
    if (task) {
      for (const depId of task.dependencies) {
        if (!visited.has(depId)) {
          if (detectCycle(depId, [...path, depId])) return true
        } else if (recursionStack.has(depId)) {
          errors.push(`Circular dependency detected: ${[...path, depId].join(' -> ')}`)
          return true
        }
      }
    }

    recursionStack.delete(taskId)
    return false
  }

  for (const taskId of allTasks.keys()) {
    if (!visited.has(taskId)) detectCycle(taskId, [taskId])
  }

  const taskStatusMap: Record<string, 'READY' | 'PENDING' | 'BLOCKED'> = {}
  const readinessVisited = new Set<string>()

  function resolveReadiness(taskId: string): 'READY' | 'PENDING' {
    if (completedTaskIds.has(taskId)) return 'READY'
    if (readinessVisited.has(taskId)) return taskStatusMap[taskId] === 'READY' ? 'READY' : 'PENDING'

    readinessVisited.add(taskId)
    const task = allTasks.get(taskId)
    if (!task) {
      taskStatusMap[taskId] = 'PENDING'
      return 'PENDING'
    }

    const ready = task.dependencies.every((depId) => resolveReadiness(depId) === 'READY')
    taskStatusMap[taskId] = ready ? 'READY' : 'PENDING'
    return taskStatusMap[taskId]
  }

  for (const taskId of allTasks.keys()) resolveReadiness(taskId)

  return { isValid: errors.length === 0, errors, taskStatusMap }
}
