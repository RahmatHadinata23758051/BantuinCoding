import type { LucideIcon } from 'lucide-react'
import type { SystemGraphData } from '@repo/types'
import type { WorkspaceArtifactItem } from '@/app/components/MarkdownWorkspace'
import type { WorkspaceSection } from '@/lib/navigation/workspace'

export type ReadinessTone = 'ready' | 'attention' | 'idle'

export type ContextProvenance = 'confirmed' | 'assumed' | 'unknown'
export type ContextProvenanceCounts = Record<ContextProvenance, number>

export interface WorkspaceSectionItem {
  id: WorkspaceSection
  labelKey: string
  descriptionKey: string
  icon: LucideIcon
}

export interface ContextCategoryDefinition {
  id: string
  labelKey: string
  descriptionKey: string
  keys: readonly string[]
}

export interface ContextCategoryData extends ContextCategoryDefinition {
  total: number
  counts: ContextProvenanceCounts
}

export interface ProjectWorkspaceProps {
  initialData: {
    id: string
    name: string
    description: string | null
    classification: string
    classificationStatus: string
    classificationError: string | null
    language: string
    status: string
    createdAt: string
    updatedAt: string
    context: Record<string, unknown> | null
    contextVersion: number
    requiredArtifactTypes: string[]
    systemGraph: SystemGraphData | null
    clarifications: {
      id: string
      round: number
      question: string
      impact: string | null
      options?: string[]
      answer: string | null
      status: string
    }[]
    artifacts: WorkspaceArtifactItem[]
    skills: {
      id: string
      name: string
      source: string
      purpose: string
      trigger: string
      metadata: {
        applicable_phases?: string[]
        applicable_task_types?: string[]
        installation_hint?: string
      } | null
    }[]
    phases: {
      id: string
      name: string
      order: number
      description: string | null
      tasks: {
        id: string
        taskKey: string
        title: string
        description: string
        status: string
        acceptanceCriteria: string[]
        definitionOfDone: string
        relevantDocs: string[]
        recommendedSkills: string[]
        dependencies: string[]
      }[]
    }[]
  }
}
