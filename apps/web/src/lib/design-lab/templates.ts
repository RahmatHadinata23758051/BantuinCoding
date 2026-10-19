import type { Template } from './schemas'

/**
 * Catalog of design-lab templates.
 * Reset to allow new template systems to be added cleanly.
 */
export const TEMPLATES: Template[] = []

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id)
}
