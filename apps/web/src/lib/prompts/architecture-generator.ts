import { z } from 'zod'
import type {
  SystemGraphCategory,
  SystemGraphData,
  SystemGraphEdge,
  SystemGraphNode,
} from '@repo/types'

// ============================================================
// Architecture Generator Prompt & Schema Module (BK-011)
// Generates Architecture Specification from Canonical Context
// ============================================================

export const SystemGraphNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  category: z.enum([
    'client',
    'ui',
    'api',
    'service',
    'database',
    'external',
    'auth',
  ]),
  description: z.string(),
})

export const SystemGraphEdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  label: z.string().optional(),
})

export const SystemGraphSchema = z.object({
  nodes: z.array(SystemGraphNodeSchema),
  edges: z.array(SystemGraphEdgeSchema),
})

export const ArchitectureDocumentSchema = z.object({
  title: z.string().default('ARCHITECTURE.md'),
  system_overview: z.string().optional(),
  stack: z.object({
    frontend: z.string().optional(),
    backend: z.string().optional(),
    database: z.string().optional(),
    styling: z.string().optional(),
    infrastructure: z.string().optional(),
  }).optional(),
  components: z.array(
    z.object({
      name: z.string(),
      responsibility: z.string(),
      boundary: z.string(),
    }),
  ).optional(),
  data_flow: z.array(
    z.object({
      flow_name: z.string(),
      description: z.string(),
    }),
  ).optional(),
  security_architecture: z.array(z.string()).optional(),
  deployment_strategy: z.string().optional(),
  system_graph: SystemGraphSchema.optional(),
  markdown_content: z.string().describe('Full formatted ARCHITECTURE.md content in Markdown'),
})

export type ArchitectureDocumentOutput = z.infer<typeof ArchitectureDocumentSchema>

const GRAPH_CATEGORY_HINTS: Array<{ category: SystemGraphCategory; pattern: RegExp }> = [
  { category: 'client', pattern: /client|browser|mobile|web|app|frontend|user interface/i },
  { category: 'ui', pattern: /ui|interface|screen|page|component|design/i },
  { category: 'api', pattern: /api|endpoint|route|http|graphql|rest/i },
  { category: 'database', pattern: /database|postgres|mysql|mongo|storage|repository|data/i },
  { category: 'auth', pattern: /auth|login|session|identity|permission|access/i },
  { category: 'external', pattern: /external|third[- ]party|provider|integration|stripe|email|storage/i },
  { category: 'service', pattern: /service|worker|engine|module|server|backend/i },
]

function graphId(value: string, fallback: string) {
  const id = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return id || fallback
}

function inferGraphCategory(value: string): SystemGraphCategory {
  return GRAPH_CATEGORY_HINTS.find(({ pattern }) => pattern.test(value))?.category ?? 'service'
}

/**
 * Builds a small project-specific graph only from validated architecture fields.
 * ponytail: this deterministic fallback intentionally uses named components and flows only;
 * add richer context-aware inference when the canonical context models explicit boundaries.
 */
export function buildArchitectureSystemGraph(
  architecture: Pick<ArchitectureDocumentOutput, 'components' | 'data_flow'>,
): SystemGraphData | null {
  const components = architecture.components ?? []
  const flows = architecture.data_flow ?? []
  if (components.length === 0) return null

  const nodes: SystemGraphNode[] = []
  const nodeIds = new Set<string>()
  const addNode = (name: string, description: string, category?: SystemGraphCategory) => {
    const id = graphId(name, `component-${nodes.length + 1}`)
    if (nodeIds.has(id)) return id
    nodeIds.add(id)
    nodes.push({ id, label: name, category: category ?? inferGraphCategory(`${name} ${description}`), description })
    return id
  }

  components.forEach((component) => addNode(component.name, component.responsibility))
  const edges: SystemGraphEdge[] = []
  flows.forEach((flow) => {
    const text = `${flow.flow_name} ${flow.description}`
    const referenced = nodes.filter((node) => text.toLowerCase().includes(node.label.toLowerCase()))
    if (referenced.length >= 2) {
      for (let i = 1; i < referenced.length; i += 1) {
        edges.push({ source: referenced[i - 1].id, target: referenced[i].id, label: flow.flow_name })
      }
    }
  })

  return { nodes, edges }
}

export const ARCHITECTURE_GENERATOR_SYSTEM_PROMPT = `You are a Principal Software Architect drafting an ARCHITECTURE.md specification for a coding agent.

Your output must strictly follow the provided JSON schema.
The markdown_content field must contain a complete, architectural blueprint in GitHub-flavored Markdown.

ARCHITECTURE STRUCTURE REQUIREMENTS:
1. Executive System Overview
2. Selected Technology Stack & Rationale
3. System Component Breakdown & Module Boundaries
4. Data Flow & Sequence Descriptions
5. Security & BYOK Key Handling Architecture
6. Storage & Database Design
7. Deployment Expectations & Environment Setup
8. Hidden System Architecture Graph

SYSTEM_GRAPH REQUIREMENTS:
- Return system_graph as a project-specific directed graph of real components and relationships described by the canonical context.
- Always provide system_graph whenever the architecture describes identifiable components, modules, or services.
- Use the allowed categories only: client, ui, api, service, database, external, auth.
- Each node needs a stable id, a concise label, and a plain-language responsibility description.
- Each edge must reference existing node ids and describe a real data or control-flow relationship.
- Do not use backlog tasks, phases, generic filler nodes, or invented services that are not supported by the project context.
- If the context genuinely lacks architectural components or flows, omit system_graph rather than fabricating architecture.

CRITICAL CONSTRAINTS:
- Keep the architecture practical (modular monolith first; avoid unnecessary microservices or over-engineering).
- Explicitly detail data flow and security boundaries.
- Never emit real or realistic fake API keys, passwords, tokens, secret values, private keys, or database connection URLs. Do not include populated assignments such as API_KEY=..., NEXTAUTH_SECRET=..., JWT_SECRET=..., AWS_ACCESS_KEY_ID=..., AWS_SECRET_ACCESS_KEY=..., or GOOGLE_APPLICATION_CREDENTIALS=....
- For environment examples, use only empty assignments, unresolved variables, or comments: DATABASE_URL="", DATABASE_URL=\${DATABASE_URL}, API_KEY=\${API_KEY}, NEXTAUTH_SECRET="", and JWT_SECRET="". Do not emit localhost, credential-free, or credential-bearing database URLs; the scanner rejects every database URL. Never use values such as "placeholder", "your-secret", "password", or invented hexadecimal strings as secret examples.
- Ensure the specification is dense, rigorous, and completes cleanly within token limits.`

const ALLOWED_GRAPH_CATEGORIES: SystemGraphCategory[] = [
  'client',
  'ui',
  'api',
  'service',
  'database',
  'external',
  'auth',
]

/**
 * Parses an explicit Mermaid architecture diagram from Markdown content.
 * Extracts declared components, categories, and directed flow edges.
 * ponytail: line-based regex parses standard flowchart/graph syntax; upgrade to full AST parser if complex nested subgraphs are required.
 */
export function parseMermaidSystemGraph(markdown: string): SystemGraphData | null {
  const match = markdown.match(/```mermaid\s*([\s\S]*?)```/i)
  if (!match) return null

  const content = match[1]
  const nodes: SystemGraphNode[] = []
  const nodeIds = new Set<string>()
  const edges: SystemGraphEdge[] = []

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim()
    if (
      !line ||
      line.startsWith('graph ') ||
      line.startsWith('flowchart ') ||
      line.startsWith('subgraph ') ||
      line === 'end' ||
      line.startsWith('%%')
    ) {
      continue
    }

    // Edge pattern: A -->|label| B or A --> B or A -.-> B or A ==> B
    const edgeMatch = line.match(/^([a-zA-Z0-9_-]+)\s*(?:-->|-\.->|==>)\s*(?:\|([^|]+)\|\s*)?([a-zA-Z0-9_-]+)$/)
    if (edgeMatch) {
      edges.push({
        source: edgeMatch[1],
        target: edgeMatch[3],
        label: edgeMatch[2]?.trim(),
      })
      continue
    }

    // Node pattern: id[label\ncategory] or id[(label)\ncategory] etc
    const nodeMatch = line.match(/^([a-zA-Z0-9_-]+)\s*([\[\(\{]+[\/\\]?)([\s\S]*?)([\/\\]?[\]\)\}]+)$/)
    if (nodeMatch) {
      const id = nodeMatch[1]
      const rawText = nodeMatch[3]
      const parts = rawText.split(/\\n|\n/)
      const label = parts[0].trim().replace(/^["'([/\\<]+|["')\]/\\>]+$/g, '') || id
      let category: SystemGraphCategory | undefined

      if (parts[1]) {
        const candidate = parts[1].toLowerCase()
        category = ALLOWED_GRAPH_CATEGORIES.find((cat) => candidate.includes(cat))
      }
      if (!category) {
        category = inferGraphCategory(label)
      }

      if (!nodeIds.has(id)) {
        nodeIds.add(id)
        nodes.push({
          id,
          label,
          category,
          description: label,
        })
      }
    }
  }

  if (nodes.length === 0) return null

  const validEdges = edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))
  return { nodes, edges: validEdges }
}

export function buildArchitectureGeneratorUserPrompt(
  projectName: string,
  contextJson: string,
): string {
  return `Project Name: ${projectName}

Canonical Project Context:
"""
${contextJson}
"""

Generate the complete ARCHITECTURE.md document output according to the schema.`
}
