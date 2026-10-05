# BantuinCoding / Project Bootstrapper

Project Bootstrapper is a disciplined documentation control room and Bring-Your-Own-Key (BYOK) web application. It transforms raw, unstructured project ideas into strict, execution-ready documentation packs designed specifically for autonomous coding agents (Claude Code, Cursor, Codex).

It is not a code generator, an IDE, or a chatbot. It is a systematic pipeline that extracts intent, resolves ambiguities through targeted clarification, and compiles a canonical project context into a lean, 5-file specification architecture.

## Overview

Modern coding agents fail when given ambiguous prompts. Project Bootstrapper bridges the gap between a human's raw intent and an agent's need for deterministic constraints. 

By analyzing the initial input, the system identifies missing architectural decisions, asks the user focused clarification questions, and locks down the project scope. The result is a downloadable, secret-safe ZIP archive containing a phased, dependency-aware backlog and strict operational guidelines.

## Lean Specification Architecture

The system enforces a consolidated, highly efficient documentation pack tailored to project complexity (Static Site, SaaS, IoT Dashboard, etc.). All projects yield a maximum of 5 deterministic files:

- **`PRD.md`** — Product and Functional Specification. Absorbs traditional SRS components (FR-xxx, NFR-xxx, data models, error handling).
- **`ARCHITECTURE.md`** — System, Stack, and Data Architecture. Details database schemas, API surfaces, and deployment strategies.
- **`DESIGN.md`** — Visual and Interaction Authority. The sole source of truth for UI tokens, typography, and neo-brutalist or editorial design directives.
- **`Agent.md`** — Unified Operational Contract. Contains hard technology constraints, security rules, BYOK isolation directives, and mapped agent skills.
- **`BACKLOG.md`** — Phased Execution Ledger. Atomic, dependency-aware task graph with strict acceptance criteria and Definition of Done.

## Core Features

- **BYOK Architecture**: API keys are session-scoped and never persisted to the database unless explicitly saved to an AES-256 encrypted vault. Secrets never leak into the generated Markdown or ZIP exports.
- **Multi-Provider Support**: Supports Anthropic, OpenAI, Gemini, and OpenRouter via a unified AI provider interface.
- **Context Normalization**: Converts conversational clarifications into a structured, versioned canonical context (`ProjectContext`).
- **Resilient Generation**: Gracefully handles model output limitations, automatically recovers from JSON truncation, and manages dependency validation.
- **Multi-language Support (i18n)**: Fully localized UI and documentation generation in English and Indonesian (Bahasa Indonesia).
- **Expertise Modes**: Supports both highly technical users and business-focused founders through an auto-pick "CTO" mode during clarification.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Library**: React 19
- **Language**: TypeScript (Strict Mode)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Auth.js (NextAuth v5)
- **Styling**: Tailwind CSS v4
- **Localization**: next-intl
- **Validation**: Zod
- **Testing**: Vitest, React Testing Library

## Getting Started

### Prerequisites
- Node.js >= 20.x
- pnpm >= 9.x
- PostgreSQL database

### Installation

1. Clone the repository and install dependencies:
```bash
git clone https://github.com/RahmatHadinata23758051/BantuinCoding.git
cd BantuinCoding
pnpm install
```

2. Configure environment variables:
Create a `.env` file in `apps/web/` based on `.env.example`.
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/bantuincoding"
AUTH_SECRET="your-32-byte-secret"
```

3. Run database migrations and generate the Prisma client:
```bash
cd packages/db
pnpm run db:push
pnpm run db:generate
```

4. Start the development server:
```bash
cd ../..
pnpm run dev
```

The application will be available at `http://localhost:3000`.

## Architecture & Monorepo Structure

This project uses a monorepo setup managed by Turborepo:
- `apps/web`: The core Next.js application, UI components, AI engines, and export services.
- `packages/db`: Prisma schema, migrations, and database client.
- `packages/types`: Shared TypeScript interfaces and domain types.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
