import { db } from '@repo/db'
import { getProviderConfig } from '@/lib/byok/session-store'
import { createProvider } from '@/lib/ai/provider'
import {
  BACKLOG_GENERATOR_SYSTEM_PROMPT,
  BacklogGeneratorOutputSchema,
  buildBacklogGeneratorUserPrompt,
  type BacklogGeneratorOutput,
  type GeneratedBacklogPhase,
} from '@/lib/prompts/backlog-generator'
import { validateBacklogDependencies } from '@/lib/engine/backlog-validator'

/**
 * Baseline rule-based fallback backlog when AI call is disabled or fails.
 * Contains comprehensive 14+ tasks across 5 phases broken down by workstream.
 */
export const defaultFallbackPhases: GeneratedBacklogPhase[] = [
  {
    name: 'Phase 1 — Project Foundation & Database Architecture',
    order: 1,
    description: 'Scaffold project, configure tooling, design database schema, and establish core infrastructure.',
    tasks: [
      {
        id: 'BK-001',
        title: 'Initialize project scaffold and tooling',
        description: 'Create Next.js 16 project with App Router, configure ESLint, Prettier, TypeScript strict mode, Husky git hooks, and CI/CD pipeline.',
        dependencies: [],
        acceptance_criteria: [
          'Next.js 16 project initializes with App Router',
          'ESLint + Prettier + TypeScript strict passes',
          'Husky pre-commit hooks run lint + typecheck',
          'GitHub Actions CI pipeline runs on push',
        ],
        definition_of_done: 'Repository initialized with zero-warning build pipeline',
        relevant_docs: ['SRS.md §9', 'ARCHITECTURE.md §2'],
        recommended_skills: ['typescript-backend'],
      },
      {
        id: 'BK-002',
        title: 'Define Prisma database schema and migrations',
        description: 'Model core entities (Room, Tenant, Contract, Payment, User) with Prisma, create initial migration, and seed script.',
        dependencies: ['BK-001'],
        acceptance_criteria: [
          'Prisma schema defines Room, Tenant, Contract, Payment, User models',
          'All relationships (hasMany, belongsTo) correctly mapped',
          'Migration runs without errors',
          'Seed script populates sample data',
        ],
        definition_of_done: 'Database schema deployed and seedable',
        relevant_docs: ['SRS.md §10', 'ARCHITECTURE.md §3'],
        recommended_skills: ['typescript-backend'],
      },
      {
        id: 'BK-003',
        title: 'Configure database client and seed utilities',
        description: 'Set up Prisma client singleton, create seed script with sample kost data, and database utility helpers.',
        dependencies: ['BK-002'],
        acceptance_criteria: [
          'Prisma client exported as singleton',
          'Seed script runs without errors and creates sample data',
          'Database utility functions export CRUD helpers',
        ],
        definition_of_done: 'Database ready for application development',
        relevant_docs: ['ARCHITECTURE.md §3'],
        recommended_skills: ['typescript-backend'],
      },
    ],
  },
  {
    name: 'Phase 2 — Domain Engine & Business Logic',
    order: 2,
    description: 'Implement domain services, business validation rules, and core state machines.',
    tasks: [
      {
        id: 'BK-004',
        title: 'Implement Room domain service',
        description: 'Create RoomService with CRUD operations, status derivation (Available/Occupied/Maintenance), and facility management.',
        dependencies: ['BK-003'],
        acceptance_criteria: [
          'RoomService exports CRUD methods',
          'Room status auto-calculated from active contracts',
          'Facility tags CRUD supported',
          'Unit tests cover status transitions',
        ],
        definition_of_done: 'RoomService unit tested and integrated',
        relevant_docs: ['PRD.md §5', 'SRS.md §FR-001'],
        recommended_skills: ['typescript-backend'],
      },
      {
        id: 'BK-005',
        title: 'Implement Contract/Lease engine',
        description: 'Build contract state machine (draft, active, expired, terminated) with date validation and price management.',
        dependencies: ['BK-004'],
        acceptance_criteria: [
          'Contract state machine enforces valid transitions',
          'Rent calculation based on dates and prorated amounts',
          'Facility inclusions stored per contract',
        ],
        definition_of_done: 'Contract engine handles full lifecycle',
        relevant_docs: ['PRD.md §5', 'SRS.md §FR-004'],
        recommended_skills: ['typescript-backend'],
      },
      {
        id: 'BK-006',
        title: 'Implement Payment tracking service',
        description: 'Track rental payments, due dates, status (paid/unpaid/overdue), and generate payment records.',
        dependencies: ['BK-005'],
        acceptance_criteria: [
          'Payment records link to contracts',
          'Overdue detection logic implemented',
          'Payment history queryable per contract/room',
        ],
        definition_of_done: 'Payment service complete with tests',
        relevant_docs: ['PRD.md §5', 'SRS.md §FR-005'],
        recommended_skills: ['typescript-backend'],
      },
      {
        id: 'BK-007',
        title: 'Implement Tenant management service',
        description: 'Tenant profiles, emergency contacts, document storage references, and lease history.',
        dependencies: ['BK-005'],
        acceptance_criteria: [
          'Tenant CRUD operations',
          'Emergency contact fields',
          'Lease history tracking',
        ],
        definition_of_done: 'Tenant service complete',
        relevant_docs: ['PRD.md §5', 'SRS.md §FR-003'],
        recommended_skills: ['typescript-backend'],
      },
    ],
  },
  {
    name: 'Phase 3 — REST API & Auth Services',
    order: 3,
    description: 'Build REST API layer, authentication, and request validation.',
    tasks: [
      {
        id: 'BK-008',
        title: 'Set up NextAuth authentication',
        description: 'Configure NextAuth with credentials provider, session handling, and role-based access (owner/manager).',
        dependencies: ['BK-007'],
        acceptance_criteria: [
          'NextAuth configured with credentials provider',
          'Session cookies secure and httpOnly',
          'Role-based route protection (owner vs manager)',
          'Session persistence across browser restarts',
        ],
        definition_of_done: 'Authentication flows working end-to-end',
        relevant_docs: ['ARCHITECTURE.md §4', 'SRS.md §NFR-002'],
        recommended_skills: ['typescript-backend'],
      },
      {
        id: 'BK-009',
        title: 'Build Room API endpoints',
        description: 'RESTful CRUD endpoints for rooms with Zod validation, filtering, and pagination.',
        dependencies: ['BK-008'],
        acceptance_criteria: [
          'GET /api/rooms with filters (status, floor, price range)',
          'POST /api/rooms with Zod validation',
          'PATCH /api/rooms/:id with partial updates',
          'DELETE /api/rooms/:id with cascade checks',
        ],
        definition_of_done: 'Room API fully tested with integration tests',
        relevant_docs: ['ARCHITECTURE.md §4', 'SRS.md §FR-001'],
        recommended_skills: ['typescript-backend'],
      },
      {
        id: 'BK-010',
        title: 'Build Contract & Payment API endpoints',
        description: 'REST endpoints for contract lifecycle and payment tracking with Zod validation.',
        dependencies: ['BK-008'],
        acceptance_criteria: [
          'Contract CRUD with state machine enforcement',
          'Payment recording with overdue detection',
          'PDF receipt generation endpoint',
        ],
        definition_of_done: 'Contract & Payment APIs production-ready',
        relevant_docs: ['ARCHITECTURE.md §4', 'SRS.md §FR-004, FR-005'],
        recommended_skills: ['typescript-backend'],
      },
      {
        id: 'BK-011',
        title: 'Build Dashboard summary API',
        description: 'Aggregated dashboard data endpoint for room occupancy, revenue, and upcoming payments.',
        dependencies: ['BK-010'],
        acceptance_criteria: [
          'GET /api/dashboard returns occupancy rate, revenue, overdue count',
          'Response cached for 30 seconds',
          'TypeScript types exported',
        ],
        definition_of_done: 'Dashboard API powers management UI',
        relevant_docs: ['SRS.md §FR-006'],
        recommended_skills: ['typescript-backend'],
      },
    ],
  },
  {
    name: 'Phase 4 — Frontend UI Primitives & Design System',
    order: 4,
    description: 'Implement Neo-Brutalist design system primitives and core UI components.',
    tasks: [
      {
        id: 'BK-012',
        title: 'Implement Design System tokens & primitives',
        description: 'Translate DESIGN.md tokens into Tailwind config: colors, spacing, borders, shadows, typography, motion tokens.',
        dependencies: ['BK-011'],
        acceptance_criteria: [
          'Tailwind config exports DESIGN.md tokens',
          'CSS variables for colors, spacing, shadows',
          'Component variants map to design system',
        ],
        definition_of_done: 'Design system tokens consumed by all components',
        relevant_docs: ['DESIGN.md §2-4', 'DESIGN.md §4'],
        recommended_skills: ['ui-ux-pro-max'],
      },
      {
        id: 'BK-013',
        title: 'Build core UI primitives (Button, Input, Panel, Select, Badge)',
        description: 'Create base components with Design System tokens: Button, Input, Select, Panel, Badge, StatusBadge, Avatar.',
        dependencies: ['BK-012'],
        acceptance_criteria: [
          'All primitives use Design System tokens',
          'Focus-visible states for accessibility',
          'Variant props (primary/secondary/ghost)',
          'Storybook stories for each component',
        ],
        definition_of_done: 'Component library documented and typed',
        relevant_docs: ['DESIGN.md §4'],
        recommended_skills: ['ui-ux-pro-max'],
      },
      {
        id: 'BK-014',
        title: 'Build composite UI components',
        description: 'Compose primitives into Card, Table, Modal, Tabs, Accordion, Form, Toast, Tooltip.',
        dependencies: ['BK-013'],
        acceptance_criteria: [
          'Composites use primitives consistently',
          'Compound component patterns where appropriate',
          'Keyboard navigation and ARIA attributes',
        ],
        definition_of_done: 'Component library production-ready',
        relevant_docs: ['DESIGN.md §4'],
        recommended_skills: ['ui-ux-pro-max'],
      },
    ],
  },
  {
    name: 'Phase 5 — Management Dashboard & Feature Views',
    order: 5,
    description: 'Build application views: Dashboard, Room Grid, Tenant Table, Payment Ledger.',
    tasks: [
      {
        id: 'BK-015',
        title: 'Build Dashboard layout & sidebar',
        description: 'Responsive app shell with collapsible sidebar, top bar, breadcrumbs, and mobile drawer.',
        dependencies: ['BK-014'],
        acceptance_criteria: [
          'Responsive breakpoint at 768px/1024px',
          'Sidebar collapses to icon-only on mobile',
          'Active route highlighted in sidebar',
        ],
        definition_of_done: 'App shell responsive and accessible',
        relevant_docs: ['DESIGN.md §3', 'ARCHITECTURE.md §5'],
        recommended_skills: ['ui-ux-pro-max'],
      },
      {
        id: 'BK-016',
        title: 'Build Room Availability Grid',
        description: 'Interactive grid with room cards showing status badge, price, facilities, and inline occupancy toggle.',
        dependencies: ['BK-015'],
        acceptance_criteria: [
          'Grid responsive (1/2/3/4 columns per breakpoint)',
          'Real-time status badge updates',
          'Facility icons with tooltip details',
        ],
        definition_of_done: 'Room grid operational and responsive',
        relevant_docs: ['SRS.md §FR-001', 'DESIGN.md §3'],
        recommended_skills: ['ui-ux-pro-max'],
      },
      {
        id: 'BK-017',
        title: 'Build Tenant & Contract Table',
        description: 'Sortable, filterable, paginated table with inline actions (view, edit, archive).',
        dependencies: ['BK-015'],
        acceptance_criteria: [
          'Server-side pagination and sorting',
          'Column visibility toggles',
          'Row actions: view, edit, terminate contract',
        ],
        definition_of_done: 'Table component production-ready',
        relevant_docs: ['SRS.md §FR-003, FR-004'],
        recommended_skills: ['ui-ux-pro-max'],
      },
      {
        id: 'BK-018',
        title: 'Build Payment Ledger & Reporting',
        description: 'Payment history table with filters, CSV export, and overdue highlighting.',
        dependencies: ['BK-015'],
        acceptance_criteria: [
          'Date range and status filters',
          'CSV export with BOM for Excel',
          'Overdue rows highlighted per DESIGN.md',
        ],
        definition_of_done: 'Payment ledger operational',
        relevant_docs: ['SRS.md §FR-005', 'DESIGN.md §3'],
        recommended_skills: ['ui-ux-pro-max'],
      },
    ],
  },
  {
    name: 'Phase 6 — Quality Gates & Verification',
    order: 6,
    description: 'Establish testing, linting, typechecking, and CI/CD quality gates.',
    tasks: [
      {
        id: 'BK-019',
        title: 'Configure unit & integration test suite',
        description: 'Set up Vitest with React Testing Library, MSW for API mocking, and test utilities.',
        dependencies: ['BK-018'],
        acceptance_criteria: [
          'Vitest configured with coverage thresholds',
          'MSW handlers for all API routes',
          'Test utilities for Prisma mocking',
        ],
        definition_of_done: 'Test infrastructure ready for TDD',
        relevant_docs: ['ARCHITECTURE.md §6', 'RULES.md §3'],
        recommended_skills: ['typescript-backend'],
      },
      {
        id: 'BK-020',
        title: 'Implement core unit & integration tests',
        description: 'Write tests for domain services, API routes, and React components.',
        dependencies: ['BK-019'],
        acceptance_criteria: [
          'Unit tests cover domain services ≥ 80%',
          'API route integration tests with MSW',
          'Component tests with RTL',
          'CI pipeline runs tests on every PR',
        ],
        definition_of_done: 'Test coverage meets thresholds',
        relevant_docs: ['ARCHITECTURE.md §6', 'RULES.md §3'],
        recommended_skills: ['typescript-backend', 'ui-ux-pro-max'],
      },
      {
        id: 'BK-021',
        title: 'Configure CI/CD pipeline',
        description: 'GitHub Actions workflow for typecheck, lint, test, build, and deploy on merge.',
        dependencies: ['BK-020'],
        acceptance_criteria: [
          'GitHub Actions workflow runs on push/PR',
          'Typecheck + Lint + Test + Build pass',
          'Deploy preview on Vercel for PRs',
        ],
        definition_of_done: 'CI/CD pipeline green',
        relevant_docs: ['ARCHITECTURE.md §6', 'RULES.md §3'],
        recommended_skills: ['typescript-backend'],
      },
    ],
  },
]

export function generateBacklogMdContent(
  projectName: string,
  phases: GeneratedBacklogPhase[],
): string {
  const phasesMd = phases
    .map((phase) => {
      const tasksMd = phase.tasks
        .map(
          (t) => `### ${t.id} — ${t.title}
**Dependencies:** ${t.dependencies.length ? t.dependencies.join(', ') : 'None'}
**Description:** ${t.description}

**Acceptance Criteria:**
- ${t.acceptance_criteria.join('\n- ')}

**Definition of Done:** ${t.definition_of_done}
**Relevant Docs:** ${t.relevant_docs.join(', ')}
**Skills:** ${t.recommended_skills.join(', ')}`,
        )
        .join('\n\n---\n\n')

      return `## ${phase.name}
${phase.description ? `*${phase.description}*\n\n` : ''}${tasksMd}`
    })
    .join('\n\n---\n\n')

  return `# BACKLOG.md — ${projectName}

> Phased, dependency-aware backlog for coding agents.

---

${phasesMd}
`
}

export interface GenerateBacklogOptions {
  userId: string
  projectId: string
}

/**
 * Generates BACKLOG.md and persists BacklogPhase & BacklogTask records in DB.
 */
export async function generateProjectBacklog({
  userId,
  projectId,
}: GenerateBacklogOptions): Promise<BacklogGeneratorOutput> {
  const project = await db.project.findFirst({
    where: { id: projectId, userId },
    include: {
      contexts: {
        where: { isCurrent: true },
        take: 1,
      },
      artifacts: true,
    },
  })

  if (!project) throw new Error('Project not found')

  const currentContextRecord = project.contexts[0]
  if (!currentContextRecord) {
    throw new Error('No Canonical Project Context found. Generate context first.')
  }

  const prdArtifact = project.artifacts.find((a) => a.type === 'PRD')?.content || ''
  const srsArtifact = project.artifacts.find((a) => a.type === 'SRS')?.content || ''
  const archArtifact = project.artifacts.find((a) => a.type === 'ARCHITECTURE')?.content || ''
  const designArtifact = project.artifacts.find((a) => a.type === 'DESIGN')?.content || ''

  const providerConfig = getProviderConfig(userId)
  if (!providerConfig) {
    throw new Error('No active AI provider session found. Please configure your BYOK provider first.')
  }
  const provider = createProvider(providerConfig)

  // Set artifact to GENERATING before provider call
  await db.artifact.upsert({
    where: { projectId_type: { projectId, type: 'BACKLOG' } },
    update: { status: 'GENERATING', contextId: currentContextRecord.id },
    create: {
      projectId,
      contextId: currentContextRecord.id,
      type: 'BACKLOG',
      path: 'BACKLOG.md',
      content: '',
      status: 'GENERATING',
    },
  })

  const userPrompt = buildBacklogGeneratorUserPrompt(
    project.name,
    currentContextRecord.contentJson,
    prdArtifact,
    srsArtifact,
    archArtifact,
    designArtifact,
  )
  let backlogOutput: BacklogGeneratorOutput
  try {
    backlogOutput = await provider.generateStructured(
      userPrompt,
      BacklogGeneratorOutputSchema,
      {
        system: BACKLOG_GENERATOR_SYSTEM_PROMPT,
        maxTokens: 4096,
        temperature: 0.2,
      },
    )
  } catch {
    backlogOutput = {
      phases: defaultFallbackPhases,
      backlog_md_content: generateBacklogMdContent(project.name, defaultFallbackPhases),
    }
  }

  // Validate dependency references and circular dependencies
  let validation = validateBacklogDependencies(backlogOutput.phases)
  if (!validation.isValid) {
    // If AI generated invalid dependencies, fall back to safe baseline phases
    backlogOutput = {
      phases: defaultFallbackPhases,
      backlog_md_content: generateBacklogMdContent(project.name, defaultFallbackPhases),
    }
    // Recompute validation for fallback phases to ensure correct task statuses
    validation = validateBacklogDependencies(backlogOutput.phases)
  }

  try {
    await db.$transaction(async (tx) => {
      // Cascades remove the old tasks and dependencies with their phases. All
      // replacement records and the artifact are committed together.
      await tx.backlogPhase.deleteMany({ where: { projectId } })

      const createdTasksMap = new Map<string, string>()
      for (const phase of backlogOutput.phases) {
        const dbPhase = await tx.backlogPhase.create({
          data: {
            projectId,
            order: phase.order,
            name: phase.name,
            description: phase.description,
          },
        })

        for (const task of phase.tasks) {
          const initialStatus = validation.taskStatusMap[task.id] || 'PENDING'
          const dbTask = await tx.backlogTask.create({
            data: {
              projectId,
              phaseId: dbPhase.id,
              taskKey: task.id,
              title: task.title,
              description: task.description,
              acceptanceCriteria: JSON.stringify(task.acceptance_criteria),
              definitionOfDone: task.definition_of_done,
              relevantDocs: JSON.stringify(task.relevant_docs),
              recommendedSkills: JSON.stringify(task.recommended_skills),
              status: initialStatus,
            },
          })
          createdTasksMap.set(task.id, dbTask.id)
        }
      }

      for (const phase of backlogOutput.phases) {
        for (const task of phase.tasks) {
          const dbTaskId = createdTasksMap.get(task.id)
          if (!dbTaskId) continue
          for (const depKey of task.dependencies) {
            const depDbTaskId = createdTasksMap.get(depKey)
            if (!depDbTaskId) continue
            await tx.backlogDependency.create({
              data: { taskId: dbTaskId, dependsOnTaskId: depDbTaskId },
            })
          }
        }
      }

      await tx.artifact.update({
        where: { projectId_type: { projectId, type: 'BACKLOG' } },
        data: {
          content: backlogOutput.backlog_md_content,
          status: 'READY',
          contextId: currentContextRecord.id,
          provider: providerConfig.provider,
          model: providerConfig.model,
        },
      })
    })
  } catch {
    await db.artifact.update({
      where: { projectId_type: { projectId, type: 'BACKLOG' } },
      data: { status: 'FAILED' },
    })
    throw new Error('Backlog replacement failed. The previous backlog was preserved.')
  }

  return backlogOutput
}
