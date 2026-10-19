import type { GeneratedBacklogPhase, GeneratedBacklogTask } from '@/lib/prompts/backlog-generator'

export interface BacklogValidationResult {
  isValid: boolean
  errors: string[]
  taskStatusMap: Record<string, 'READY' | 'PENDING' | 'BLOCKED'>
}

/**
 * Validates backlog tasks for:
 * 1. Missing dependency references
 * 2. Circular dependencies (using DFS cycle detection)
 * 3. Correct readiness status calculation based on dependencies
 */
export function validateBacklogDependencies(
  phases: GeneratedBacklogPhase[],
  completedTaskIds: Set<string> = new Set(),
): BacklogValidationResult {
  const errors: string[] = []
  const allTasks = new Map<string, GeneratedBacklogTask>()

  // 1. Collect all task IDs
  for (const phase of phases) {
    for (const task of phase.tasks) {
      if (allTasks.has(task.id)) {
        errors.push(`Duplicate task ID found: ${task.id}`)
      }
      allTasks.set(task.id, task)
    }
  }

  // 2. Validate existence of dependency references
  for (const task of allTasks.values()) {
    for (const depId of task.dependencies) {
      if (!allTasks.has(depId) && !completedTaskIds.has(depId)) {
        errors.push(`Task ${task.id} references non-existent dependency: ${depId}`)
      }
    }
  }

  // 3. Detect Circular Dependencies using DFS
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
    if (!visited.has(taskId)) {
      detectCycle(taskId, [taskId])
    }
  }

  // 4. Compute readiness after all IDs are known, regardless of declaration order.
  const taskStatusMap: Record<string, 'READY' | 'PENDING' | 'BLOCKED'> = {}
  const readinessVisited = new Set<string>()

  function resolveReadiness(taskId: string): 'READY' | 'PENDING' {
    if (completedTaskIds.has(taskId)) return 'READY'
    if (readinessVisited.has(taskId)) {
      return taskStatusMap[taskId] === 'READY' ? 'READY' : 'PENDING'
    }

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

  return {
    isValid: errors.length === 0,
    errors,
    taskStatusMap,
  }
}
