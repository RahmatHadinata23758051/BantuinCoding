import { z } from 'zod'
import { buildAuthoritativeContextBlock } from './canonical-context'
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
  { category: 'auth', pattern: /\b(?:auth|login|session|identity|permission|access)\b/i },
  { category: 'database', pattern: /\b(?:database|postgres|postgresql|mysql|mongo|sqlite|storage|repository)\b/i },
  { category: 'external', pattern: /\b(?:external|third[- ]party|provider|integration|stripe|email)\b/i },
  { category: 'api', pattern: /\b(?:api|endpoint|route|graphql|rest)\b/i },
  { category: 'service', pattern: /\b(?:service|worker|engine|module|server|backend)\b/i },
  { category: 'client', pattern: /\b(?:client|browser|mobile|frontend)\b/i },
  { category: 'ui', pattern: /\b(?:ui|interface|screen|page|design)\b/i },
]

function graphId(value: string, fallback: string) {
  const id = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return id || fallback
}

function inferGraphCategory(value: string, secondary = ''): SystemGraphCategory {
  return (
    GRAPH_CATEGORY_HINTS.find(({ pattern }) => pattern.test(value))?.category ??
    GRAPH_CATEGORY_HINTS.find(({ pattern }) => pattern.test(secondary))?.category ??
    'service'
  )
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Builds a small project-specific graph only from validated architecture fields.
 * Falls back to Markdown Section 3 (Components) and Section 4 (Data Flows) when components are omitted.
 * ponytail: this deterministic fallback intentionally uses named components and flows only;
 * add richer context-aware inference when the canonical context models explicit boundaries.
 */
export function buildArchitectureSystemGraph(
  architecture: Pick<ArchitectureDocumentOutput, 'components' | 'data_flow'> & {
    markdown_content?: string
  },
): SystemGraphData | null {
  const components = architecture.components ?? []
  const flows = architecture.data_flow ?? []
  if (components.length === 0) {
    if (architecture.markdown_content) {
      return extractSystemGraphFromMarkdown(architecture.markdown_content)
    }
    return null
  }

  const nodes: SystemGraphNode[] = []
  const nodeIds = new Set<string>()
  const addNode = (name: string, description: string, category?: SystemGraphCategory) => {
    const id = graphId(name, `component-${nodes.length + 1}`)
    if (nodeIds.has(id)) return id
    nodeIds.add(id)
    nodes.push({ id, label: name, category: category ?? inferGraphCategory(name, description), description })
    return id
  }

  components.forEach((component) => addNode(component.name, component.responsibility))
  const edges: SystemGraphEdge[] = []
  const edgeKeys = new Set<string>()
  flows.forEach((flow) => {
    const text = `${flow.flow_name}\n${flow.description}`
    const referenced = nodes
      .map((node) => ({ node, index: text.toLowerCase().indexOf(node.label.toLowerCase()) }))
      .filter((item) => item.index >= 0)
      .sort((a, b) => a.index - b.index)

    for (let i = 1; i < referenced.length; i += 1) {
      const source = referenced[i - 1].node.id
      const target = referenced[i].node.id
      const key = `${source}->${target}`
      if (source !== target && !edgeKeys.has(key)) {
        edgeKeys.add(key)
        edges.push({ source, target, label: flow.flow_name })
      }
    }
  })

  if (edges.length === 0 && architecture.markdown_content) {
    const extracted = extractSystemGraphFromMarkdown(architecture.markdown_content)
    if (extracted?.edges.length) return extracted
  }

  return { nodes, edges }
}

/**
 * Extracts named components and numbered data-flow steps from architecture Markdown.
 * Edges only come from components mentioned in an explicitly ordered flow sequence.
 */
export function extractSystemGraphFromMarkdown(markdown: string): SystemGraphData | null {
  const section3 = markdown.match(/##\s+3[.\s][^\n]*\n([\s\S]*?)(?=\n##\s+[4-8][.\s]|\s*$)/i)?.[1]
  if (!section3) return null

  const headings: Array<{ name: string; start: number; bodyStart: number }> = []
  const headingPattern = /^###\s+(?:\d+(?:\.\d+)*\s+)?([^\n]+)/gm
  let match: RegExpExecArray | null
  while ((match = headingPattern.exec(section3)) !== null) {
    headings.push({
      name: match[1].trim(),
      start: match.index,
      bodyStart: match.index + match[0].length,
    })
  }

  const nodes: SystemGraphNode[] = []
  const nodeIds = new Set<string>()
  for (let i = 0; i < headings.length; i += 1) {
    const heading = headings[i]
    const end = headings[i + 1]?.start ?? section3.length
    const firstParagraph = section3.slice(heading.bodyStart, end).trim().split(/\n\s*\n/)[0] || heading.name
    const description = firstParagraph.replace(/[*_#`[\]]/g, '').replace(/\n+/g, ' ').slice(0, 200).trim()
    const id = graphId(heading.name, `component-${nodes.length + 1}`)
    if (nodeIds.has(id)) continue
    nodeIds.add(id)
    nodes.push({
      id,
      label: heading.name,
      category: inferGraphCategory(heading.name, description),
      description,
    })
  }

  if (nodes.length === 0) return null

  const section4 = markdown.match(/##\s+4[.\s][^\n]*\n([\s\S]*?)(?=\n##\s+[5-8][.\s]|\s*$)/i)?.[1]
  if (!section4) return { nodes, edges: [] }

  const flows: Array<{ name: string; body: string }> = []
  const flowPattern = /^###\s+(?:\d+(?:\.\d+)*\s+)?([^\n]+)/gm
  const flowHeadings: Array<{ name: string; start: number; bodyStart: number }> = []
  while ((match = flowPattern.exec(section4)) !== null) {
    flowHeadings.push({
      name: match[1].trim(),
      start: match.index,
      bodyStart: match.index + match[0].length,
    })
  }
  for (let i = 0; i < flowHeadings.length; i += 1) {
    flows.push({
      name: flowHeadings[i].name,
      body: section4.slice(flowHeadings[i].bodyStart, flowHeadings[i + 1]?.start ?? section4.length),
    })
  }

  const stopWords = new Set(['and', 'the', 'for', 'with', 'from', 'into', 'onto', 'module', 'system', 'component', 'breakdown', 'boundaries'])
  const matchers = nodes.map((node) => {
    const terms = new Set<string>([node.label])
    node.label.split(/[^a-zA-Z0-9]+/).forEach((word) => {
      if (word.length >= 4 && !stopWords.has(word.toLowerCase())) terms.add(word)
      else if (word.length === 3 && word === word.toUpperCase()) terms.add(word)
    })
    return {
      node,
      patterns: [...terms].map((term) => new RegExp(`\\b${escapeRegex(term)}\\b`, 'i')),
    }
  })
  const edges: SystemGraphEdge[] = []
  const edgeKeys = new Set<string>()

  for (const flow of flows) {
    const stepPattern = /^\s*\d+[.)]\s+([\s\S]*?)(?=^\s*\d+[.)]\s+|\s*$)/gm
    const steps: string[] = []
    while ((match = stepPattern.exec(flow.body)) !== null) steps.push(match[1])
    const orderedMentions: Array<{ node: SystemGraphNode; index: number }> = []

    for (const step of steps) {
      const inStep = matchers.flatMap(({ node, patterns }) => {
        const matches = patterns
          .map((pattern) => pattern.exec(step))
          .filter((result): result is RegExpExecArray => result !== null)
          .sort((a, b) => a.index - b.index)
        return matches[0] ? [{ node, index: matches[0].index }] : []
      }).sort((a, b) => a.index - b.index)
      orderedMentions.push(...inStep)
    }

    for (let i = 1; i < orderedMentions.length; i += 1) {
      const source = orderedMentions[i - 1].node.id
      const target = orderedMentions[i].node.id
      const key = `${source}->${target}`
      if (source !== target && !edgeKeys.has(key)) {
        edgeKeys.add(key)
        edges.push({ source, target, label: flow.name })
      }
    }
  }

  return { nodes, edges }
}

/** Resolves graph data from an explicit Mermaid diagram, then architecture prose. */
export function resolveArchitectureSystemGraph(
  markdown: string,
  architecture: Pick<ArchitectureDocumentOutput, 'components' | 'data_flow'> = {},
): SystemGraphData | null {
  return parseMermaidSystemGraph(markdown) ??
    buildArchitectureSystemGraph({ ...architecture, markdown_content: markdown })
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
8. Hidden System Architecture Graph (include a fenced Mermaid flowchart with the real runtime components and supported directional data flows)

SYSTEM_GRAPH REQUIREMENTS:
- Return system_graph as a project-specific directed graph of real components and relationships described by the canonical context.
- Always provide system_graph whenever the architecture describes identifiable components, modules, or services.
- In Section 8 of markdown_content, always embed a fenced Mermaid flowchart using the same component ids and direction as system_graph; leave the graph without edges when no supported relationships are described.
- Use the allowed categories only: client, ui, api, service, database, external, auth.
- Each node needs a stable id, a concise label, and a plain-language responsibility description.
- Each edge must reference existing node ids and describe a real data or control-flow relationship.
- Do not use backlog tasks, phases, generic filler nodes, or invented services that are not supported by the project context.
- If the context genuinely lacks architectural components or flows, omit system_graph rather than fabricating architecture.

CRITICAL CONSTRAINTS:
- Keep the architecture practical (modular monolith first; avoid unnecessary microservices or over-engineering).
- Explicitly detail data flow and security boundaries.
- Strictly adhere to the AUTHORITATIVE CANONICAL DECISIONS block. Confirmed decisions ([CONFIRMED]) must NEVER be contradicted or replaced. Treat [ASSUMED] items as provisional recommendations and [UNKNOWN] items as open questions.
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
  const authoritativeBlock = buildAuthoritativeContextBlock(contextJson)

  return `Project Name: ${projectName}

Canonical Project Context:
"""
${contextJson}
"""

${authoritativeBlock}

Generate the complete ARCHITECTURE.md document output according to the schema.`
}
