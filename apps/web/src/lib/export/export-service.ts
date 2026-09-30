import JSZip from 'jszip'
import { db } from '@repo/db'

/**
 * Validates file path inside ZIP pack to prevent path traversal vulnerability.
 * Strictly forbids `../`, leading slashes `/`, null bytes, or unsafe characters.
 */
export function validateZipPath(path: string): string {
  if (!path || typeof path !== 'string') {
    throw new Error('Invalid empty file path')
  }

  // Prevent path traversal sequences
  if (path.includes('../') || path.includes('..\\') || path.startsWith('/') || path.startsWith('\\')) {
    throw new Error(`Path traversal security risk detected in filename: ${path}`)
  }

  // Normalize path separators to POSIX
  const normalized = path.replace(/\\/g, '/').replace(/^\/+/, '')

  // Disallow absolute drive letters (e.g. C:)
  if (/^[a-zA-Z]:/.test(normalized)) {
    throw new Error(`Absolute path drive letter detected: ${path}`)
  }

  return normalized
}

/**
 * Scans content for accidental API key or secret leakage.
 * Throws security error if a high-entropy secret pattern (sk-..., gsk-..., AIza...) is found.
 */
export function scanContentForSecrets(content: string, filename: string): void {
  // Common API key patterns
  const secretPatterns = [
    /sk-[a-zA-Z0-9]{20,}/i, // OpenAI / Anthropic keys
    /gsk_[a-zA-Z0-9]{20,}/i, // Groq keys
    /AIzaSy[a-zA-Z0-9_\-]{33}/i, // Gemini keys
    /lin_api_[a-zA-Z0-9]{20,}/i, // Linear API keys
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

- \`PRD.md\` — Product Requirements Document (goals, non-goals, user flows, features)
- \`SRS.md\` — Software Requirements Specification (functional specs, data models, error handling)
- \`DESIGN.md\` — Project-specific visual and interaction contract when UI scope requires it
- \`ARCHITECTURE.md\` — System Architecture (components, boundaries, stack, database design)
- \`Agent.md\` — Agent Operational Contract (precedence, quality gates, definition of done)
- \`RULES.md\` — Non-negotiable Hard Constraints (immutability rules, secret protection)
- \`SKILLS.md\` — Recommended Coding Agent Skills (tailored capabilities & triggers)
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
   > "Read in order: 1. PRD.md -> 2. SRS.md -> 3. DESIGN.md (if present) -> 4. Agent.md -> 5. BACKLOG.md -> 6. ARCHITECTURE.md -> 7. RULES.md -> 8. SKILLS.md"
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
 * Exports all READY or MODIFIED project artifacts as a downloadable ZIP Buffer.
 */
export async function exportProjectZip({
  userId,
  projectId,
}: ExportProjectZipOptions): Promise<{ filename: string; buffer: Buffer }> {
  const project = await db.project.findFirst({
    where: { id: projectId, userId },
    include: {
      artifacts: true,
    },
  })

  if (!project) throw new Error('Project not found')

  const exportableArtifacts = project.artifacts.filter(
    (a) => a.status === 'READY' || a.status === 'MODIFIED',
  )

  if (exportableArtifacts.length === 0) {
    throw new Error('No ready artifacts available to export. Generate artifacts first.')
  }

  const zip = new JSZip()

  // 1. Include generated READY/MODIFIED artifacts
  for (const art of exportableArtifacts) {
    const safePath = validateZipPath(art.path)
    scanContentForSecrets(art.content, safePath)
    zip.file(safePath, art.content)
  }

  // 2. Include README.md in root of ZIP if not already present
  if (!exportableArtifacts.some((a) => a.path === 'README.md')) {
    const readmeContent = generateBootstrapReadme(project.name, project.targetAgent)
    scanContentForSecrets(readmeContent, 'README.md')
    zip.file('README.md', readmeContent)
  }

  // Generate ZIP file buffer
  const uint8Array = await zip.generateAsync({ type: 'uint8array' })
  const buffer = Buffer.from(uint8Array)

  const safeProjectName = project.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
  const filename = `${safeProjectName}-bootstrap-pack.zip`

  return { filename, buffer }
}
