import JSZip from 'jszip'
import { db } from '@repo/db'
import {
  generateBootstrapReadme,
  scanContentForSecrets,
  validateExportPreflight,
  validateZipPath,
} from '@/lib/export/preflight'

export { generateBootstrapReadme, scanContentForSecrets, validateZipPath }

export interface ExportProjectZipOptions {
  userId: string
  projectId: string
}

/**
 * Exports the complete current required artifact pack as a downloadable ZIP Buffer.
 * The route separately enforces the EXPORTABLE project state; these checks protect
 * direct service callers from exporting stale or incomplete documents.
 */
export async function exportProjectZip({
  userId,
  projectId,
}: ExportProjectZipOptions): Promise<{ filename: string; buffer: Buffer }> {
  const project = await db.project.findFirst({
    where: { id: projectId, userId },
    include: {
      contexts: {
        where: { isCurrent: true },
        take: 1,
        include: {
          artifactPlans: { where: { isRequired: true } },
        },
      },
      artifacts: true,
    },
  })

  if (!project) throw new Error('Project not found')
  if (project.status !== 'EXPORTABLE') {
    throw new Error('Project is not exportable. Complete validation first.')
  }

  const exportableArtifacts = validateExportPreflight(project)
  const normalizedPaths = new Set<string>()
  const zip = new JSZip()

  for (const art of exportableArtifacts) {
    const safePath = validateZipPath(art.path)
    normalizedPaths.add(safePath)
    zip.file(safePath, art.content)
  }

  if (!normalizedPaths.has('README.md')) {
    zip.file('README.md', generateBootstrapReadme(project.name))
  }

  const uint8Array = await zip.generateAsync({ type: 'uint8array' })
  const buffer = Buffer.from(uint8Array)

  const safeProjectName = project.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
  const filename = `${safeProjectName}-bootstrap-pack.zip`

  return { filename, buffer }
}
