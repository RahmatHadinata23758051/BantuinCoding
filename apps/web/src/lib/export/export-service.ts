import JSZip from 'jszip'
import { db } from '@repo/db'

/**
 * Validates file path inside ZIP pack to prevent path traversal vulnerability.
 * Strictly forbids traversal, absolute paths, control characters, or unsafe segments.
 */
export function validateZipPath(path: string): string {
  if (!path || typeof path !== 'string') {
    throw new Error('Invalid empty file path')
  }

  if (/[\u0000-\u001f\u007f]/.test(path)) {
    throw new Error('Control character detected in filename')
  }

  if (path.includes('../') || path.includes('..\\') || path.startsWith('/') || path.startsWith('\\')) {
    throw new Error(`Path traversal security risk detected in filename: ${path}`)
  }

  const normalized = path.replace(/\\/g, '/')

  if (/^[a-zA-Z]:/.test(normalized)) {
    throw new Error(`Absolute path drive letter detected: ${path}`)
  }

  const segments = normalized.split('/')
  if (segments.some((segment) => segment === '' || segment === '.' || segment === '..')) {
    throw new Error(`Path traversal security risk detected in filename: ${path}`)
  }

  return normalized
}

/**
 * Scans content for accidental API key or secret leakage.
 * Throws security error without including the matched secret in the message.
 */
export function scanContentForSecrets(content: string, filename: string): void {
  const secretPatterns = [
    /sk-[a-zA-Z0-9]{20,}/i,
    /gsk_[a-zA-Z0-9]{20,}/i,
    /AIzaSy[a-zA-Z0-9_\-]{33}/i,
    /lin_api_[a-zA-Z0-9]{20,}/i,
    /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/i,
    /\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/,
    /(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/[^\s"']+/i,
    /(?:^|\n)\s*(?:API_KEY|[A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|PRIVATE_KEY)[A-Z0-9_]*)\s*=\s*[^\s#]+/i,
    /(?:^|\n)\s*(?:AWS_ACCESS_KEY_ID|AWS_SECRET_ACCESS_KEY|GOOGLE_APPLICATION_CREDENTIALS)\s*=\s*[^\s#]+/i,
  ]

  for (const pattern of secretPatterns) {
    if (pattern.test(content)) {
      throw new Error(`SECURITY ALERT: Potential API key leakage detected in ${filename}`)
    }
  }
}

export function generateBootstrapReadme(projectName: string, targetAgent = 'CLAUDE_CODE'): string {
  return `# ${projectName} — Project Bootstrap Pack

> Downloaded from **Project Bootstrapper (BantuinCoding)**.
> Optimized for coding agent: **${targetAgent}**

---

## 📦 What's Inside This Pack

This Project Bootstrap Pack contains structured specifications and operational guides for your AI coding agent:

- \`PRD.md\` — Product and Functional Requirements (business goals, flows, FR/NFR, data, errors)
- \`ARCHITECTURE.md\` — System Architecture (components, boundaries, stack, database design)
- \`DESIGN.md\` — Sole visual and interaction contract when UI scope requires it
- \`Agent.md\` — Unified Agent Operational Contract (rules, security, quality gates, recommended skills)
- \`BACKLOG.md\` — Phased, Dependency-Aware Backlog (atomic tasks with acceptance criteria)

---

## 🚀 How to Start Development with Your Agent

1. Unzip this package into the root folder of your workspace.
2. Initialize git repository if not already done:
   \`\`\`bash
   git init
   \`\`\`
3. Open your CLI agent (e.g., \`claude\`) in this directory.
4. Instruct your agent to read the mandatory documentation order:
   > "Read in order: 1. PRD.md -> 2. ARCHITECTURE.md -> 3. DESIGN.md (if present) -> 4. Agent.md -> 5. BACKLOG.md"
5. Instruct your agent to execute tasks sequentially starting from task \`BK-001\` in \`BACKLOG.md\`.

---

## 🛡️ Security Notice
This bootstrap pack contains zero secrets or API keys. API keys are session-scoped and managed securely.
`
}

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

  const currentContext = project.contexts[0]
  if (!currentContext) {
    throw new Error('Project has no current context. Generate project context first.')
  }

  const requiredTypes = [...new Set(currentContext.artifactPlans.map((plan) => plan.type))]
  const artifactsByType = new Map(
    project.artifacts
      .filter((artifact) => artifact.contextId === currentContext.id)
      .map((artifact) => [artifact.type, artifact]),
  )
  const missingOrIncompleteTypes = requiredTypes.filter((type) => {
    const artifact = artifactsByType.get(type)
    return !artifact || !['READY', 'MODIFIED'].includes(artifact.status)
  })

  if (requiredTypes.length === 0 || missingOrIncompleteTypes.length > 0) {
    const detail = missingOrIncompleteTypes.length > 0
      ? ` Missing or incomplete: ${missingOrIncompleteTypes.join(', ')}.`
      : ''
    throw new Error(`Project documents are not ready for export.${detail}`)
  }

  const exportableArtifacts = requiredTypes
    .map((type) => artifactsByType.get(type))
    .filter((artifact): artifact is NonNullable<typeof artifact> => Boolean(artifact))

  const zip = new JSZip()
  const normalizedPaths = new Set<string>()

  for (const art of exportableArtifacts) {
    const safePath = validateZipPath(art.path)
    if (normalizedPaths.has(safePath)) {
      throw new Error(`Duplicate file path detected in export: ${safePath}`)
    }
    normalizedPaths.add(safePath)
    scanContentForSecrets(art.content, safePath)
    zip.file(safePath, art.content)
  }

  if (!normalizedPaths.has('README.md')) {
    const readmeContent = generateBootstrapReadme(project.name, project.targetAgent)
    scanContentForSecrets(readmeContent, 'README.md')
    zip.file('README.md', readmeContent)
  }

  const uint8Array = await zip.generateAsync({ type: 'uint8array' })
  const buffer = Buffer.from(uint8Array)

  const safeProjectName = project.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
  const filename = `${safeProjectName}-bootstrap-pack.zip`

  return { filename, buffer }
}
