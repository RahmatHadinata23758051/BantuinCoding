<h1 align="center">Project Bootstrapper</h1>

<p align="center">
  Turn project ideas into implementation-ready specifications for coding agents.
</p>

<p align="center">
  <a href="https://github.com/RahmatHadinata23758051/BantuinCoding/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-151515?style=flat" alt="MIT license"></a>
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16-151515?style=flat&logo=next.js" alt="Next.js 16"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat&logo=typescript&logoColor=white" alt="TypeScript strict"></a>
</p>

## What is Project Bootstrapper?

Project Bootstrapper converts a vague software idea into a deterministic specification pack that coding agents can use as implementation context. It is a planning and documentation tool, not an IDE or a source-code generator.

The application analyzes the initial idea, asks targeted clarification questions, normalizes the answers into a canonical project context, and generates the documents needed to plan and execute the project.

## How it works

```text
Idea → Clarification → Canonical Context → Specification Pack → Coding Agent
```

The generated context keeps requirements, technical decisions, design constraints, and execution tasks aligned before coding starts.

### Workflow stages

1. **Idea** — Capture the initial project description and target coding agent.
2. **Clarification** — Identify missing information and resolve high-impact decisions.
3. **Canonical context** — Normalize confirmed decisions, assumptions, goals, constraints, and open questions.
4. **Specification pack** — Plan and generate the documents needed for the project classification.
5. **Coding agent** — Download the pack, place it in the project workspace, and execute the documented backlog.

Each stage has an explicit project state in the application. Generation does not depend on an unstructured chat transcript as its source of truth.

## Specification pack

The pack is a set of Markdown documents that can be reviewed, edited, and exported as a ZIP. Together, the documents provide the implementation context for a coding agent.

### Core documents

- **`PRD.md`** — Product scope, users, goals, flows, features, and acceptance criteria.
- **`ARCHITECTURE.md`** — System boundaries, stack, data, integrations, and deployment concerns.
- **`DESIGN.md`** — Visual and interaction contract for projects with a UI.
- **`Agent.md`** — Operational contract, security rules, workflow, and quality gates for the coding agent.
- **`BACKLOG.md`** — Phased, dependency-aware tasks with acceptance criteria and definition of done.

### Additional documents

The exact pack is selected by project complexity. A simple static project does not need the same document set as a SaaS or full-stack application.

Depending on classification and context, the pack can also include:

- **`SRS.md`** — Detailed software requirements for higher-complexity projects.
- **Database and API specifications** — Included when the project needs deeper technical detail.
- **Security, testing, deployment, or other supporting documents** — Included only when relevant to the generated plan.

The application does not create a standalone `RULES.md` or `SKILLS.md` in the current lean pack flow. Operational rules and recommended skills are consolidated into `Agent.md`.

### Why these files are separate

- Product decisions remain readable without implementation details.
- Architecture decisions can be reviewed independently from product scope.
- UI constraints have one visual source of truth.
- Agent instructions define how the implementation work should be performed.
- Backlog tasks provide an executable order for development.

## Features

- **BYOK provider configuration** — Supply provider credentials through the session workflow; keys are not written to generated documents or exports.
- **Complexity-aware generation** — Select an appropriate document set for the project classification instead of producing the same pack for every idea.
- **Auto-pick clarification** — Let the system choose a reasonable standard when a user does not know which technical option to select.
- **English and Indonesian support** — The interface and project language can be configured for either language.
- **Multiple model providers** — Use Anthropic, OpenAI, Google Gemini, or OpenRouter through one provider abstraction.
- **Structured AI output** — Internal provider responses are validated before they are used by the application.
- **Editable Markdown artifacts** — Review and edit generated documents before exporting the pack.
- **Single-artifact regeneration** — Regenerate one document without replacing unrelated successful artifacts.
- **Dependency-aware backlog** — Generate phases and tasks with dependencies, acceptance criteria, relevant documents, and recommended skills.
- **ZIP export** — Export the current ready or modified artifacts with path validation and secret scanning.

## Quick start

### Prerequisites

Install the following before setting up the repository:

- Node.js 20 or newer
- pnpm 9 or newer
- PostgreSQL

The repository uses pnpm workspaces and Turborepo. The pinned package manager version is declared in the root package manifest.

### Installation

Clone the repository and install workspace dependencies:

```bash
git clone https://github.com/RahmatHadinata23758051/BantuinCoding.git
cd BantuinCoding
pnpm install
```

### Environment

Copy the root environment template:

```bash
cp .env.example .env
```

Set the database and authentication values in `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/bantuincoding?schema=public"
AUTH_SECRET="replace-with-a-secure-random-secret"
AUTH_URL="http://localhost:3000"
```

Use a different database username, password, database name, and secret for your local environment.

Provider API keys are entered through the BYOK interface for the current session. They are not configured in `.env` by default.

Production deployments must also configure the encryption secret used for provider credential handling. The application requires this secret when encrypted provider credentials are accessed in production.

Do not commit `.env` or any other environment file containing credentials.

### Database

Generate the Prisma client and apply the current schema:

```bash
pnpm --filter @repo/db db:generate
pnpm --filter @repo/db db:push
```

The database package also provides migration, deployment, seed, Studio, and reset scripts:

```bash
pnpm --filter @repo/db db:migrate
pnpm --filter @repo/db db:migrate:deploy
pnpm --filter @repo/db db:seed
pnpm --filter @repo/db db:studio
pnpm --filter @repo/db db:reset
```

Use the reset script only when you intentionally want to reset the local database.

### Development

Start the workspace development process from the repository root:

```bash
pnpm run dev
```

Open the local application at:

```text
http://localhost:3000
```

### Validation

The root workspace exposes the standard validation scripts:

```bash
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
```

Run the relevant checks after changing application code or generation behavior.

## Typical usage

1. Create an account and sign in.
2. Configure a provider and model through the BYOK flow.
3. Create a project with a name and initial idea.
4. Review the requirement analysis.
5. Answer clarification questions or use the auto-pick option for standard decisions.
6. Review and confirm the canonical project context.
7. Generate the planned specification artifacts.
8. Review, edit, or regenerate individual Markdown documents.
9. Generate and review the dependency-aware backlog.
10. Run consistency checks before export.
11. Download the Project Bootstrap Pack as a ZIP.
12. Place the generated files in the target project workspace and start with the backlog.

## Project states

The application uses explicit state machines rather than inferring readiness from UI behavior.

### Project lifecycle

```text
DRAFT
  → CONFIGURED
  → ANALYZING
  → CLARIFYING
  → CONTEXT_READY
  → GENERATING
  → READY
  → EXPORTABLE
```

A failed generation can enter `GENERATION_FAILED` without discarding the rest of the project state.

### Artifact lifecycle

```text
NOT_GENERATED
  → GENERATING
  → READY
  → MODIFIED
  → OUTDATED
  → FAILED
```

A context change can mark affected artifacts as `OUTDATED`. A provider or generation error affects the relevant artifact rather than silently presenting an incomplete document as ready.

### Backlog task lifecycle

```text
PENDING
  → READY
  → IN_PROGRESS
  → BLOCKED
  → REVIEW
  → DONE
```

A task is not ready when a required dependency is incomplete.

## Generation model

All artifact generators consume the current canonical project context. The main generation flow is:

```text
Requirement analysis
  → Clarification
  → Context normalization
  → Artifact planning
  → PRD and technical document generation
  → Agent contract generation
  → Skill resolution
  → Backlog generation
  → Consistency validation
  → ZIP export
```

Prompts are separated by responsibility. The repository includes dedicated prompt modules for analysis, clarification, context normalization, planning, document generation, skill resolution, backlog generation, and consistency validation.

Provider-specific SDK calls are isolated inside provider adapters. Application services use a common interface for connection tests, structured generation, and optional model listing.

## Tech stack

- **Web:** Next.js 16 App Router, React 19, TypeScript
- **Application:** Server Components, Client Components for interactive workbench state, and route handlers
- **Persistence:** PostgreSQL and Prisma
- **Workspace:** pnpm and Turborepo
- **Validation:** Zod
- **Authentication:** Auth.js credentials flow with JWT sessions
- **Testing:** Vitest and Testing Library
- **Export:** JSZip
- **Markdown:** marked and DOMPurify
- **UI utilities:** Tailwind CSS, clsx, tailwind-merge, and lucide-react

## Supported providers

The provider layer currently supports:

- Anthropic
- OpenAI
- Google Gemini
- OpenRouter

Models are selected through the provider configuration flow rather than being fixed in this README. The provider abstraction keeps model and SDK details out of the core generation workflow.

## Security model

- API keys are supplied through the BYOK flow and are not written to generated Markdown or ZIP exports.
- Provider credentials are handled through the session and credential-security layers rather than the public project context.
- Internal provider responses are validated before business logic uses them.
- Public errors are sanitized so provider payloads, prompts, stack traces, and secrets are not returned to the browser.
- Markdown previews are sanitized before rendering HTML.
- ZIP paths are validated against traversal and unsafe absolute paths.
- Exported artifact content is scanned for likely provider or cloud credentials.
- Production authentication and provider credential handling require configured secrets.
- Environment files are ignored by Git and must remain local.

## Architecture

Project Bootstrapper is a modular monolith. The web application owns the product workflow and application services, while Prisma/PostgreSQL handles persistence and provider adapters isolate vendor SDKs from business logic.

```text
Browser
  → Next.js App Router
  → Route handlers and server actions
  → Project, context, artifact, backlog, and export services
  → Provider abstraction
  → Prisma / PostgreSQL
```

The main application boundaries are:

- **Project service** — Owns project creation, updates, ownership, and lifecycle transitions.
- **Provider service** — Manages provider configuration and connection tests through the common adapter contract.
- **Requirement engine** — Analyzes the initial idea and identifies missing or ambiguous information.
- **Context engine** — Normalizes answers into a versioned canonical project context.
- **Artifact planner** — Selects the document set from project classification and context.
- **Artifact generator** — Produces and persists structured Markdown artifacts.
- **Skill resolver** — Maps project needs to relevant implementation guidance.
- **Backlog planner** — Produces phases, tasks, dependencies, and readiness states.
- **Consistency validator** — Checks relationships and terminology across the generated documents.
- **Export service** — Validates artifacts and packages the current set into a ZIP archive.

The MVP intentionally does not require microservices, event buses, queues, CQRS, or Kubernetes.

<details>
<summary>Project structure</summary>

```text
BantuinCoding/
├── apps/
│   └── web/
│       ├── messages/       # English and Indonesian dictionaries
│       ├── public/         # Static application assets
│       └── src/
│           ├── app/        # App Router pages, layouts, and route handlers
│           └── lib/        # Providers, engines, prompts, export, and services
├── packages/
│   ├── db/                # Prisma schema, migrations, seed, and client
│   └── types/             # Shared domain types and schemas
├── .env.example           # Local environment template
├── LICENSE                # MIT license
├── package.json            # Workspace scripts and package manager metadata
├── pnpm-workspace.yaml    # Workspace package definitions
└── turbo.json             # Build and task pipeline
```

### Web application areas

```text
apps/web/src/
├── app/                   # Routes, pages, layouts, API handlers, and UI
└── lib/
    ├── ai/                # Common provider interface and adapters
    ├── artifacts/         # Artifact workspace behavior
    ├── auth/              # Auth.js configuration and session helpers
    ├── byok/              # Provider session and credential flow
    ├── engine/             # Analysis, context, planning, generation, and validation
    ├── export/             # ZIP creation and export safety checks
    ├── prompts/            # Responsibility-specific AI prompts and schemas
    ├── projects/           # Project services and readiness behavior
    └── security/           # Encryption and secret handling
```

</details>

## Development notes

### Workspace commands

Run root commands from the repository root. Package-specific commands can be run with the pnpm filter shown in the Quick Start section.

The root package scripts are:

```text
dev       Start the workspace development processes.
build     Build workspace packages and applications.
lint      Run lint checks across workspace packages.
typecheck Run TypeScript checks across workspace packages.
test      Run the configured test suites.
format    Format supported source and Markdown files.
```

### Database package

The database package contains the Prisma schema and database client used by the web application.

```text
packages/db/
├── prisma/                # Schema, migrations, and seed data
├── src/                   # Prisma client export
└── package.json           # Database scripts
```

### Testing focus

The test suite covers domain behavior as well as application helpers. Important areas include:

- clarification state and round handling,
- canonical context validation and provenance,
- provider adapter contracts,
- artifact state transitions,
- backlog dependency logic,
- export secret exclusion,
- ZIP path traversal prevention,
- authentication and route ownership checks.

## Contributing

Before changing application behavior:

1. Inspect the relevant existing service, route, component, and test.
2. Keep provider SDK calls inside the provider adapter layer.
3. Keep artifact generation based on canonical project context.
4. Preserve explicit project, artifact, and backlog state transitions.
5. Do not add secrets to fixtures, logs, generated documents, or exports.
6. Add or update domain tests for behavior changes.
7. Run the relevant lint, typecheck, test, and build checks.

Frontend changes should preserve the repository's visual direction: warm paper surfaces, near-black ink, structural borders, hard offset shadows, functional accent colors, accessible focus states, and a readable documentation workspace.

## License

MIT. See [LICENSE](LICENSE).
