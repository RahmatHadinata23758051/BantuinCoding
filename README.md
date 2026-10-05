<h1 align="center">Project Bootstrapper</h1>

<p align="center">
  <strong>Transforms vague prompts into strict, deterministic specification packs for autonomous coding agents (Claude Code, Cursor, Codex).</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.3-black?style=flat&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19.2-blue?style=flat&logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-Strict-blue?style=flat&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Prisma-ORM-1B222D?style=flat&logo=prisma" alt="Prisma">
  <img src="https://img.shields.io/badge/License-MIT-green.svg?style=flat" alt="License">
</p>

## The Problem
Coding agents stall or hallucinate when fed unstructured ideas. They invent database architectures, pick conflicting UI libraries, and skip security boundaries because humans rarely provide complete specifications upfront.

## The Solution
Project Bootstrapper acts as a disciplined **documentation control room**. It intercepts raw intent, exposes missing boundaries through a targeted clarification interview, and compiles the answers into a canonical project context. This context drives a multi-model generative pipeline that outputs a lean, dependency-aware specification pack.

Agents receive exact instructions:
- **`PRD.md`** — Product goals, target users, core flows, and testable functional requirements.
- **`ARCHITECTURE.md`** — Tech stack, database models, and API surface boundaries.
- **`DESIGN.md`** — The sole visual authority (palette, typography, layout, UI constraints).
- **`Agent.md`** — Unified operational rulebook, security boundaries, and quality gates.
- **`BACKLOG.md`** — Atomic, phased task ledger built for sequential autonomous execution.

## Features

- **Bring-Your-Own-Key (BYOK) Security**
  Keys are session-scoped or encrypted at rest via AES-256. The system ensures provider credentials never leak into generated Markdown, error messages, or ZIP exports.
- **Dynamic Tiered Pack Generation**
  Adapts output based on project complexity. A landing page yields 4 lean documents; a complex SaaS yields 5 tightly coupled specifications.
- **Autonomous CTO Mode**
  Non-technical users can rely on an auto-pick mode during clarification. The engine autonomously decides the best-in-class industry standard for any unresolved technical boundary.
- **Bilingual Context Engine**
  Full English and Indonesian (Bahasa Indonesia) support across the UI and the generated specifications.

## Quick Start

### Prerequisites
- Node.js >= 20.x
- pnpm >= 9.x
- PostgreSQL

### Install

```bash
git clone https://github.com/RahmatHadinata23758051/BantuinCoding.git
cd BantuinCoding

pnpm install
```

### Configure
```bash
cp apps/web/.env.example apps/web/.env
```
Edit `.env` to add your PostgreSQL connection and generate a secure `AUTH_SECRET`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/bantuincoding"
AUTH_SECRET="your-32-byte-secret"
```

### Initialize Database
```bash
cd packages/db
pnpm run db:push
pnpm run db:generate
cd ../..
```

### Run
```bash
pnpm run dev
```
Navigate to `http://localhost:3000`.

## Architecture

This is a Turborepo monorepo enforcing strict workspace isolation:

```text
BantuinCoding/
├── apps/
│   └── web/            # Next.js 16 App Router application
│       ├── messages/   # i18n dictionaries
│       └── src/
│           ├── app/    # Route handlers and UI views
│           └── lib/    # Multi-provider AI engine, planners, and export logic
├── packages/
│   ├── db/             # Prisma schema, migrations, and typed client
│   └── types/          # Shared domain interfaces and schemas
└── turbo.json          # Build pipeline and caching configuration
```

## Supported Providers
The AI engine dynamically routes requests based on your BYOK vault configuration:
- Anthropic (Claude Opus, Sonnet, Haiku)
- OpenAI (GPT-4o)
- Google (Gemini Flash, Pro)
- OpenRouter (Aggregated models)

## License
MIT License. See [LICENSE](LICENSE) for details.