# OpenCode Handoff — BantuinCoding / Project Bootstrapper

Last updated: 2026-09-27

This handoff is sanitized for use with another coding agent. It intentionally omits provider tokens, auth tokens, API keys, personal account emails, and raw transcript content.

## Copy-paste bootstrap prompt for OpenCode

Use this as the first prompt when opening the project in OpenCode:

```text
You are taking over work on the BantuinCoding repository at C:\Users\user\Nata\Project\BantuinCoding.

Critical safety rules:
- First inspect the repository state. Do not overwrite or discard existing uncommitted changes.
- Treat this prompt and OPENCODE_HANDOFF.md as context only; verify every claim against the files in the repository.
- Do not commit, push, delete, reset, rebase, or run destructive git commands unless explicitly asked.
- Never read, print, persist, commit, or expose provider tokens, API keys, auth tokens, or local credential values.
- BYOK provider keys must remain session-scoped and must never be logged, stored in plaintext, returned to browser clients, or exported in ZIP files.
- If Claude/OpenCode provider tooling fails because of 9Router/OpenAI/Codex schema incompatibility, do not continue debugging application code as if it were the app's fault.

Mandatory project-reading order before code changes:
1. PRD.md
2. SRS.md
3. DESIGN.md
4. Agent.md
5. BACKLOG.md
6. ARCHITECTURE.md
7. RULES.md
8. SKILLS.md
9. apps/web/AGENTS.md / apps/web/CLAUDE.md if working in apps/web

Important Next.js instruction:
- apps/web/AGENTS.md says this is Next.js 16 with breaking changes. Before using unfamiliar Next.js APIs, read the relevant local docs under apps/web/node_modules/next/dist/docs/.

Current product scope:
- Project Bootstrapper is a BYOK web app that turns raw project ideas into downloadable Project Bootstrap Packs.
- It is not an IDE, chatbot, autonomous code generator, or model marketplace.
- Keep the modular-monolith architecture.
- All business AI calls must go through the AIProvider abstraction.
- Internal AI responses used by business logic must be schema-validated JSON.
- Canonical Project Context is the central normalized data structure; generators must not consume raw chat history as the primary source.

Current visual direction:
- Premium neo-brutalist comic editorial system from DESIGN.md.
- Warm paper, near-black ink, 2–3 px borders, hard offset shadows, bold editorial typography, controlled functional accents, and a six-stage comic-panel pipeline strip.
- Avoid glassmorphism, generic gradients, fake metrics, random icons/stickers, placeholder data, and generic SaaS dashboards.

Before making changes:
1. Run `git status --short` and identify all modified/untracked files.
2. Inspect BACKLOG.md around BK-023 through BK-032.
3. Confirm the next ready backlog item. At the time of this handoff, BACKLOG.md says: `Next ready task: BK-025 — Harden project state, authentication, and BYOK lifecycle.`
4. Review the plan at C:\Users\user\.claude\plans\nifty-hatching-lantern.md if available, but treat BACKLOG.md and source files as authoritative.
5. Preserve the existing `.claude/` directory and all uncommitted work.

Known validation already run before the tooling interruption:
- `pnpm --dir apps/web exec tsc --noEmit --pretty false` passed with no diagnostics.
- `pnpm --filter @repo/web exec vitest run src/lib/engine/clarification.test.ts src/lib/engine/analyzer.test.ts src/lib/engine/context.test.ts` passed: 3 files, 25 tests.
- `git diff --check` passed with no output.
Re-run relevant validation after any new changes; do not assume these results still apply.

Known Claude Code / 9Router tooling issue:
- The recurring API error is not a BantuinCoding app bug:
  `Invalid JSON schema: regex lookaround is not supported. Found at $.properties.writes.items.properties.collection.pattern.`
- Investigation showed the offending schema comes from the built-in Claude Code Artifact database tool, specifically `write_db.writes[].collection.pattern`, not from this app and not from Linear/MCP.
- 9Router logs showed the `CODING` combo routing Claude Code traffic to `codex/gpt-5.6-sol` with format `claude→openai-responses`, where Codex/OpenAI strict schema validation rejected the regex lookaround.
- Antigravity routes also showed quota/auth failures (`429` and `403`), likely causing fallback into Codex/OpenAI routes.
- User settings were updated to remove `ANTHROPIC_DEFAULT_OPUS_MODEL=CTF` and add top-level `enableArtifact: false` in `C:\Users\user\.claude\settings.json`. Those config changes require a fresh Claude Code session to take effect.
- Recommended route setup: use a dedicated Claude-Code-safe 9Router combo that points only to Claude-native/Anthropic-compatible models, not round-robin/fallback to Codex/OpenAI/Antigravity until 9Router's schema sanitizers are fixed.

Do not spend repository implementation time trying to fix this schema error in app code. If it reappears, fix the local AI gateway/tooling route first or use a provider path compatible with Claude Code's tools.

Mandatory operating contract after setup is stable:
1. Continue from BK-025 unless BACKLOG.md says a different task is ready. Work on one dependency-ready backlog item at a time.
2. For every task use this complete loop:
   UNDERSTAND → INSPECT → PLAN → IMPLEMENT → SELF-REVIEW → VERIFY → INDEPENDENT QC → FIX FINDINGS → RE-VERIFY → REPORT.
3. Before implementation:
   - read the task's complete acceptance criteria and dependencies;
   - inspect existing code and tests before proposing replacements;
   - preserve existing architecture and uncommitted work;
   - write a short, concrete plan for non-trivial changes;
   - do not ask the user questions that can be answered from source files or project docs.
4. During implementation:
   - make the smallest coherent change that satisfies the task;
   - match surrounding naming, structure, comments, and idioms;
   - do not weaken security, validation, state machines, or tests to obtain a pass;
   - add or update behavior-focused tests alongside the implementation;
   - do not make unrelated cleanup changes;
   - after each logical code unit, inspect the diff for accidental edits, duplication, unsafe error output, and missing edge cases.
5. After implementation, run the full task-relevant quality gate:
   - acceptance criteria checked individually;
   - TypeScript/typecheck;
   - lint;
   - focused tests for changed behavior;
   - broader regression tests when shared/domain code changed;
   - Prisma validation/migration checks when database code changed;
   - build when framework/config/runtime boundaries changed;
   - browser/runtime QA when user-facing behavior changed;
   - accessibility and responsive checks for UI work;
   - secret/auth/export security checks when relevant;
   - `git diff --check` and review of changed/untracked files.
6. A separate QC/reviewer pass is mandatory after every backlog implementation:
   - when the harness supports subagents/teams, assign at least one fresh independent QC agent that did not implement the change; for substantial or security-sensitive work, split review into correctness/regression and security/test-coverage reviewers;
   - give reviewers the backlog acceptance criteria, actual diff, affected call paths, and test results—not the desired conclusion;
   - if independent agents are unavailable, perform at least two clearly separated second passes: correctness/regression, then security/test coverage;
   - review for correctness, regressions, concurrency, authorization, security, error handling, data/state transitions, missing tests, and acceptance-criteria gaps;
   - verify every finding against source and concrete failure behavior before changing code; do not blindly apply speculative findings;
   - immediately fix every confirmed in-scope defect;
   - re-run the failed/relevant checks after every fix;
   - repeat review → verify findings → fix → re-verify until no confirmed blocking findings remain;
   - do not report a task DONE while any confirmed defect, failing check, skipped acceptance criterion, or unexplained regression remains.
7. Backlog/status discipline:
   - do not mark a task DONE before QC and re-verification pass;
   - update `BACKLOG.md` only to reflect verified reality, preserving history;
   - do not move to the next task while the current task is failing or partially complete;
   - if QC finds a regression caused by an earlier task, fix the regression before continuing;
   - Linear is not the source of truth for this phase; use repository `BACKLOG.md` unless the user explicitly changes that decision.
8. Commit discipline:
   - never commit or push unless the user explicitly requests it;
   - if asked to commit while on the default branch, create/use an appropriate feature branch first unless the user explicitly directs otherwise;
   - use small atomic commits grouped by coherent behavior, not arbitrary file count;
   - inspect `git diff` and validation results before each commit;
   - never include credentials, local settings, generated secrets, unrelated files, or accidental artifacts;
   - never bypass hooks/signing with `--no-verify`, `--no-gpg-sign`, or destructive history rewriting unless explicitly authorized;
   - do not amend, force-push, reset hard, rebase destructively, or delete branches without explicit authorization;
   - follow any active harness-required commit attribution exactly.
9. Reporting must be factual:
   - name every check actually run and its result;
   - identify checks that were skipped or blocked and explain why;
   - never claim browser QA, tests, lint, typecheck, build, security review, or QC passed unless it actually ran successfully;
   - use the required report format from `CLAUDE.md`:
     Completed: BK-XXX — <title>
     Changed: - ...
     Validation: typecheck/lint/tests: pass/fail
     Notes: - ...
     Next ready task: BK-YYY — <title>
10. Stop conditions:
   - stop and report instead of guessing when requirements conflict, a destructive action is needed, credentials are required, or an external/outward-facing action needs authorization;
   - do not stop merely because a test or QC check failed—diagnose and fix in-scope failures first;
   - ask the user only for decisions that genuinely cannot be resolved from requirements, code, tests, or safe defaults.
```

## Repository and branch snapshot

- Repository root: `C:\Users\user\Nata\Project\BantuinCoding`
- Current branch observed at session start: `main`
- Main branch: `main`
- Git user: `Rahmat Hadinata`
- There are many existing uncommitted changes and untracked files. Do not assume they were all made by the current agent; inspect before editing.

Notable modified paths observed in the session include:

```text
apps/web/src/app/api/projects/[id]/analyze/route.ts
apps/web/src/app/api/projects/[id]/artifacts/[type]/route.ts
apps/web/src/app/api/projects/[id]/backlog/route.ts
apps/web/src/app/api/projects/[id]/clarifications/route.ts
apps/web/src/app/api/projects/[id]/context/route.ts
apps/web/src/app/api/projects/[id]/export/route.ts
apps/web/src/app/api/projects/[id]/generate/route.ts
apps/web/src/app/api/projects/[id]/planner/route.ts
apps/web/src/app/api/projects/[id]/route.ts
apps/web/src/app/api/projects/[id]/skills/route.ts
apps/web/src/app/api/projects/[id]/validate/route.ts
apps/web/src/app/components/MarkdownWorkspace.tsx
apps/web/src/app/components/ProjectWorkspaceContainer.tsx
apps/web/src/app/dashboard/page.tsx
apps/web/src/app/globals.css
apps/web/src/app/layout.tsx
apps/web/src/app/login/page.tsx
apps/web/src/app/page.tsx
apps/web/src/app/projects/new/page.tsx
apps/web/src/app/register/page.tsx
apps/web/src/lib/artifacts/artifact-service.ts
apps/web/src/lib/auth/actions/index.ts
apps/web/src/lib/engine/analyzer.test.ts
apps/web/src/lib/engine/clarification-engine.ts
apps/web/src/lib/engine/clarification.test.ts
apps/web/src/lib/engine/context-engine.ts
apps/web/src/lib/engine/context.test.ts
apps/web/src/lib/engine/requirement-analyzer.ts
apps/web/src/lib/projects/workspace-service.ts
apps/web/src/lib/prompts/clarification-generator.ts
packages/db/prisma/schema.prisma
```

Notable untracked paths observed include:

```text
.claude/
ARCHITECTURE.md
DESIGN.md
RULES.md
SKILLS.md
apps/web/src/app/components/PipelineSpine.tsx
apps/web/src/app/components/ProviderSetupPanel.tsx
apps/web/src/app/components/ui/
apps/web/src/app/dashboard/provider/
apps/web/src/lib/api/
apps/web/src/lib/engine/analysis-store.ts
apps/web/src/lib/projects/readiness-service.ts
apps/web/src/lib/ui.ts
packages/db/prisma/migrations/20260926000000_analysis_validation_metadata/
```

Run `git status --short` and `git diff --stat` again before touching anything.

## Project instructions that matter most

`CLAUDE.md` is the project instruction file. Key points:

- Read docs in this order before making code changes:
  1. `PRD.md`
  2. `SRS.md`
  3. `DESIGN.md`
  4. `Agent.md`
  5. `BACKLOG.md`
  6. `ARCHITECTURE.md`
  7. `RULES.md`
  8. `SKILLS.md`
- Document precedence:
  - explicit user instruction
  - `SRS.md`
  - `PRD.md`
  - `DESIGN.md`
  - `ARCHITECTURE.md`
  - `RULES.md`
  - `Agent.md`
  - `BACKLOG.md`
- Core pipeline:
  `User Idea → Requirement Analysis → Clarification Interview → Canonical Project Context → Project Classification → Document Planning → Document Generation → Skill Resolution → Backlog Generation → Consistency Validation → ZIP Export`
- State machines:
  - Project: `DRAFT → CONFIGURED → ANALYZING → CLARIFYING → CONTEXT_READY → GENERATING → READY → EXPORTABLE (+ GENERATION_FAILED)`
  - Artifact: `NOT_GENERATED → GENERATING → READY → MODIFIED → OUTDATED → FAILED`
  - BacklogTask: `PENDING → READY → IN_PROGRESS → BLOCKED → REVIEW → DONE`
- Quality gate before marking any task complete:
  - requirement satisfied
  - typecheck passes
  - lint passes
  - relevant tests pass
  - no secret exposed
  - no obvious regression
  - acceptance criteria checked
  - no unrelated changes

## Current backlog phase

`BACKLOG.md` already contains Phase 9 backend reliability and user acceptance tasks. At handoff time it listed:

```text
Next ready task: BK-025 — Harden project state, authentication, and BYOK lifecycle.
```

Relevant Phase 9 tasks:

- BK-025 — Harden project state, authentication, and BYOK lifecycle
- BK-026 — Persist requirement analysis and unify canonical context
- BK-027 — Make clarification, context, and backlog writes atomic
- BK-028 — Complete the required document-generation pipeline
- BK-029 — Add server-authoritative animated generation progress
- BK-030 — Correct backlog readiness, validation, and export gates
- BK-031 — Build route integration, security, and recovery tests
- BK-032 — Run real-user browser E2E and acceptance QA

Also relevant:

- BK-023 — Make `DESIGN.md` a first-class generated artifact
- BK-024 — Frontend accessibility, regression, and browser QA

Before implementation, re-open `BACKLOG.md` around these tasks and verify acceptance criteria, dependencies, and current status.

## Plan file context

A plan file exists at:

```text
C:\Users\user\.claude\plans\nifty-hatching-lantern.md
```

The plan says the next goal is making the full product workflow reliable:

```text
Register/Login → Configure BYOK → Create Project → Analyze → Clarify → Canonical Context → Plan → Generate Documents → Resolve Skills → Build Backlog → Validate → Export ZIP
```

Important constraints from that plan:

- Do not introduce microservices, queues, WebSockets, or SSE for MVP.
- Use small synchronous per-stage requests with persisted state.
- Do not fabricate token-level generation progress.
- Make generation progress stage-authoritative and deterministic.
- Linear was explicitly skipped; repository `BACKLOG.md` is the source of truth.
- Preserve uncommitted user work and `.claude/`.
- Do not commit or push unless explicitly requested.

## Validation already run before handoff

Earlier validation in this session:

```text
pnpm --dir apps/web exec tsc --noEmit --pretty false
```

Result: passed with no output.

```text
pnpm --filter @repo/web exec vitest run src/lib/engine/clarification.test.ts src/lib/engine/analyzer.test.ts src/lib/engine/context.test.ts
```

Result: passed.

```text
Test Files 3 passed (3)
Tests 25 passed (25)
```

```text
git diff --check
```

Result: passed with no output.

These results are historical. Re-run relevant checks after any additional edits.

## Known tests and behavior already inspected

### `apps/web/src/lib/engine/context.test.ts`

Tests cover:

- `CanonicalContextSchema.safeParse(validData)` validates provenance.
- Invalid provenance enum is rejected.
- `generateCanonicalContext()`:
  - throws `Project not found`
  - saves versioned snapshot
  - transitions to `CONTEXT_READY`
  - preserves previous `confirmed_decisions`
- `getCurrentContext()` returns the parsed current context snapshot.

### `apps/web/src/lib/engine/analyzer.test.ts`

Tests cover:

- `RequirementAnalysisSchema`
- prompt builder includes metadata/raw idea
- `analyzeProjectRequirements()`:
  - throws project not found
  - throws no provider session
  - transitions status to `ANALYZING`
  - marks `GENERATION_FAILED` after retry failure

### `apps/web/src/lib/engine/clarification.test.ts`

Tests cover:

- clarification schemas
- prompt builder includes round and `DO NOT REPEAT`
- pending-question guard:
  `Answer pending clarification questions before generating a new round.`
- does not mark context ready until snapshot persisted
- submit answers updates question status to `ANSWERED`

### `apps/web/src/app/api/projects/[id]/context/route.ts`

The route was inspected. It:

- requires `auth()` and `session.user.id`
- returns 401 when unauthenticated
- reads params as `Promise<{ id: string }>` for Next.js 16 route-handler style
- GET returns current context or 404
- POST calls `generateCanonicalContext()` and maps safe errors through `getSafeApiErrorMessage()`

## 9Router / Claude Code tooling incident

This section is included so the next agent does not misdiagnose the app.

The user uses 9Router as an Anthropic-compatible gateway for Claude Code. Logs showed the `CODING` combo contains multiple models and uses round-robin/sticky behavior. Some routes were Antigravity/Gemini, some Codex/OpenAI Responses.

Observed failures:

- Antigravity returned quota/auth errors (`429 RESOURCE_EXHAUSTED`, `403 HTTP 403`) on some accounts/routes.
- 9Router then routed Claude Code traffic to `codex/gpt-5.6-sol` with format `claude→openai-responses`.
- Codex/OpenAI rejected the built-in Artifact tool schema:

```text
Invalid JSON schema: regex lookaround is not supported.
Found at $.properties.writes.items.properties.collection.pattern.
```

An agent investigated and found the problematic regex is in the built-in Claude Code Artifact database tool, not in BantuinCoding app code:

```regex
^(?!\.\.?(?:\/|$))[A-Za-z0-9_\-.~:@+]{1,200}(?:\/(?!\.\.?(?:\/|$))[A-Za-z0-9_\-.~:@+]{1,200}){0,14}$
```

What was changed in local Claude Code settings:

- Removed `env.ANTHROPIC_DEFAULT_OPUS_MODEL` when it was `CTF`.
- Added top-level:

```json
"enableArtifact": false
```

Important: this only takes effect after fully exiting Claude Code and starting a fresh session. `/resume` can re-use the failing context/toolset.

Recommended 9Router setup for Claude Code:

- Use a dedicated Claude-Code-safe combo.
- Route it only to Claude-native or Anthropic-compatible Claude models.
- Do not use round-robin/fallback to Codex/OpenAI/Antigravity for Claude Code until 9Router sanitizer support is confirmed.
- Keep Codex/OpenAI/Antigravity combos separate for other use cases.

This is a local tooling/provider issue, not an app implementation issue.

## Pending non-repo cleanup from Claude Code doctor

A prior `/doctor`-style flow found cleanup items, but they were not applied because the schema/proxy issue took priority.

Pending optional cleanup items:

- remove duplicate Claude Code npm install from another npm global prefix
- add YAML frontmatter to user skill `qc-validator`
- disable unused user skills in global settings
- trim root `CLAUDE.md` and move UI guidance to app-local instructions

Do not do these while implementing the app unless the user explicitly asks. They are not part of BK-025.

Security note: a previous Linear token was reportedly stored plaintext at some point and should be rotated by the user. Do not print or search for token values unless explicitly needed and safe.

## Expected working style for OpenCode

The user expects OpenCode to behave like the prior Claude Code workflow, not like a one-shot patch generator.

Operational expectations:

- Work backlog-by-backlog, not by broad speculative refactors.
- Before changing behavior, understand product docs, backlog acceptance criteria, existing code, and current tests.
- Keep a clear task loop: understand, inspect, plan, implement, verify, report.
- Add tests for domain behavior, not just snapshots.
- Run validation yourself instead of asking the user to check manually when tooling allows it.
- When UI changes are made, run or request browser/runtime verification rather than relying only on code inspection.
- When security-sensitive areas are touched, explicitly check for secrets, unsafe error messages, auth bypasses, cross-user access, and export leakage.
- After code is written, perform a separate QC/reviewer pass before calling the task done.
- If QC finds defects, fix them immediately and rerun relevant checks.
- Do not continue to a new backlog task while the current task is broken, unverified, or partially complete.
- Do not commit or push unless the user explicitly asks. When asked to commit, prefer small atomic commits and never include accidental/local/secret files.
- Preserve the user's uncommitted work and do not erase `.claude/` or local configuration.
- Be honest in reports: passed means actually run and passed; skipped means skipped and must be named.

Use these as standing instructions for the handoff.

## Immediate recommended next actions for OpenCode

1. Confirm current tool/provider session is stable.
2. Run:

```bash
git status --short
git diff --stat
```

3. Read required docs in mandatory order.
4. Read `BACKLOG.md` around BK-025 through BK-032.
5. Inspect current implementations in:

```text
apps/web/src/lib/projects/project-service.ts
apps/web/src/lib/auth/index.ts
apps/web/src/lib/auth/actions/index.ts
apps/web/src/lib/byok/session-store.ts
apps/web/src/app/api/provider/configure/route.ts
apps/web/src/app/api/projects/[id]/**/route.ts
apps/web/src/lib/api/errors.ts
```

6. Start with BK-025 only if still ready.
7. Before editing, form a short implementation plan based on the actual current code.
8. Implement narrowly.
9. Run relevant validation:

```bash
pnpm --dir apps/web exec tsc --noEmit --pretty false
pnpm --filter @repo/web exec vitest run <relevant test files>
git diff --check
```

Add lint/build/test commands if the task scope requires them.

## Reporting format expected by project

Use this after completing a task:

```text
Completed: BK-XXX — <title>
Changed:
- ...
Validation: typecheck/lint/tests: pass/fail
Notes:
- ...
Next ready task: BK-YYY — <title>
```

Do not mark a task complete if validation was skipped or failed; report it honestly as blocked or partial.
