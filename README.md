<h1 align="center">Project Bootstrapper / BantuinCoding</h1>

<p align="center">
  <strong>A disciplined documentation control room that transforms raw ideas into strict, execution-ready documentation packs for autonomous coding agents (Claude Code, Cursor, Codex).</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.3-black?style=flat&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19.2-blue?style=flat&logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-Strict-blue?style=flat&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Prisma-ORM-1B222D?style=flat&logo=prisma" alt="Prisma">
  <img src="https://img.shields.io/badge/License-MIT-green.svg?style=flat" alt="License">
</p>

## Features

- **Lean Specification Architecture**: Compiles intent into a strict 5-file pack (`PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, `Agent.md`, `BACKLOG.md`).
- **Bring-Your-Own-Key (BYOK)**: API keys remain session-scoped or AES-256 encrypted in the vault. Zero secret leakage into exported Markdown.
- **Multi-Provider AI**: Unified integration with Anthropic, OpenAI, Gemini, and OpenRouter for context analysis and generation.
- **Smart Clarification Flow**: Resolves ambiguities by asking targeted questions before generating documents, with an auto-pick mode for non-technical users.
- **Bilingual Interface**: Full i18n support generating UI and specifications in English and Indonesian.
- **Monorepo Setup**: Architected with Turborepo separating the Next.js `web` app, Prisma `db` layer, and shared `types`.

## Quick Start

### Prerequisites

- Node.js >= 20.x
- pnpm >= 9.x
- PostgreSQL database

### Install

```bash
# Clone the repository
git clone https://github.com/RahmatHadinata23758051/BantuinCoding.git
cd BantuinCoding

# Install dependencies across the monorepo
pnpm install

# Setup environment variables (copy from .env.example)
# Add your DATABASE_URL and a generated AUTH_SECRET
cp apps/web/.env.example apps/web/.env

# Sync database schema and generate Prisma client
cd packages/db
pnpm run db:push
pnpm run db:generate
cd ../..
```

### Run

```bash
# Start the Turborepo development server
pnpm run dev
```
Access the application at `http://localhost:3000`.

## Configuration

Environment variables configured in `apps/web/.env`:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string for Prisma. |
| `AUTH_SECRET` | 32-byte secret used for NextAuth session encryption. |

## Project Structure

```text
BantuinCoding/
├── apps/
│   └── web/            # Next.js 16 App Router application
│       ├── messages/   # i18n translation dictionaries (en, id)
│       ├── src/app/    # Application routes and UI components
│       └── src/lib/    # AI engine, prompt generators, BYOK vault, export services
├── packages/
│   ├── db/             # Prisma schema, migrations, and generated client
│   └── types/          # Shared domain interfaces and schemas
└── turbo.json          # Monorepo build pipeline configuration
```

## Tech Stack

- **Frontend & Backend:** Next.js 16, React 19, Tailwind CSS v4
- **Database & ORM:** PostgreSQL, Prisma, Auth.js (NextAuth v5)
- **AI & Validation:** @anthropic-ai/sdk, @google/generative-ai, openai, Zod
- **Testing:** Vitest, React Testing Library

## License

This project is licensed under the [MIT License](LICENSE).
