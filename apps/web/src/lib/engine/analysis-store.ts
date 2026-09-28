import { db } from '@repo/db'
import {
  RequirementAnalysisSchema,
  type RequirementAnalysisResult,
} from '@/lib/prompts/requirement-analyzer'

export interface PersistAnalysisOptions {
  projectId: string
  analysis: RequirementAnalysisResult
}

export async function persistRequirementAnalysis({
  projectId,
  analysis,
}: PersistAnalysisOptions) {
  // Strict validation rejects provider wrappers, secrets, transcripts, and any
  // other undeclared data before it can cross the persistence boundary.
  const validatedAnalysis = RequirementAnalysisSchema.parse(analysis)

  return db.$transaction(async (tx) => {
    const latest = await tx.projectAnalysis.findFirst({
      where: { projectId },
      orderBy: { version: 'desc' },
    })
    const nextVersion = (latest?.version ?? 0) + 1

    await tx.projectAnalysis.updateMany({
      where: { projectId },
      data: { isCurrent: false },
    })

    return tx.projectAnalysis.create({
      data: {
        projectId,
        version: nextVersion,
        contentJson: JSON.stringify(validatedAnalysis),
        isCurrent: true,
      },
    })
  })
}

export async function getCurrentRequirementAnalysis(projectId: string) {
  const record = await db.projectAnalysis.findFirst({
    where: { projectId, isCurrent: true },
  })

  if (!record) return null

  try {
    const parsed = JSON.parse(record.contentJson)
    const analysis = RequirementAnalysisSchema.parse(parsed)

    return {
      id: record.id,
      version: record.version,
      analysis,
      createdAt: record.createdAt,
    }
  } catch {
    throw new Error('Persisted requirement analysis is invalid.')
  }
}
