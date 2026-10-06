# CURRENT_CONTEXT.md — Active Work State & Context Bridge

> **Tujuan Dokumen:** Ringkasan status terakhir pekerjaan agar sesi berikutnya bisa lanjut tanpa menanyakan ulang.

---

## 1. Pekerjaan yang Sudah Selesai (Done)

### A. Multi-bahasa (en/id) — SELESAI
- `next-intl` terpasang, routing `[locale]`, middleware komposisi dengan NextAuth (`src/proxy.ts`).
- Kamus `messages/en.json` & `messages/id.json`.
- LanguageSwitcher hanya di Landing/Auth/Dashboard. Tidak di halaman project/workspace.

### B. Pengaturan Bahasa Proyek — SELESAI
- Field `language` di `Project` (Prisma), default `id`.
- Dropdown bahasa di halaman "Buat Proyek Baru".
- Modal "Pengaturan Proyek" Neo-Brutalist di workspace (ubah nama & bahasa).
- Injeksi bahasa ke prompt: requirement-analyzer, clarification-generator, context-normalizer.

### C. Dokumen Terpotong — SELESAI
- `maxTokens` dinaikkan (artifact 32000, context 16384).
- Deteksi `finish_reason === 'length'` → error eksplisit, artifact FAILED (bukan READY).
- Skema PRD/SRS/DESIGN diringkas ke `{ title, markdown_content }`.
- SRS generator dipertahankan tapi SRS hanya untuk Tier 3.

### D. Neo-Brutalism Leak — SELESAI
- Prompt one-shot tidak lagi mendefinisikan token visual.
- `DESIGN.md` = otoritas visual tunggal.
- Agent.md/BACKLOG.md hanya merujuk DESIGN.md.
- MCP & live dashboard dihapus dari prompt one-shot.

### E. Paket Dokumen Lean — SELESAI
- Tier 1 (STATIC_SITE/LANDING_PAGE): PRD, DESIGN, Agent, BACKLOG.
- Tier 2 (CRUD/DASHBOARD/MOBILE): + ARCHITECTURE.
- Tier 3 (SAAS/FULLSTACK/AI/IOT): + SRS + dokumen opsional.
- `RULES.md` & `SKILLS.md` tidak dibuat lagi; dilebur ke `Agent.md`.

### F. Bug Data Dummy "Kost" — SELESAI
- `defaultFallbackPhases` (hardcoded 14 task kos-kosan) dihapus total.
- Generator tidak lagi menelan error lalu mengisi backlog dengan template project lain.

### G. Fitur User Pemula — SELESAI
- `ClarificationQuestion.options` di DB.
- UI pilihan ganda + tombol "✨ Saya kurang paham, pilihkan standar terbaik".
- Nilai `[AUTO]` diproses context-normalizer sebagai keputusan otomatis.

### H. Backlog Generation — SELESAI (terbaru)
- Schema backlog = `{ phases }` saja (tanpa `backlog_md_content`).
- Input PRD/SRS/Architecture/DESIGN dipotong 2500 char.
- Markdown `BACKLOG.md` dibuat server via `generateBacklogMdContent`.
- Timeout 120s + status FAILED.
- `normalizeBacklogOutput` untuk toleransi output JSON longgar dari model.
- `isAssumptionConfirmationAccepted` menerima `[AUTO]`.

---

## 2. Status Project FreshBite (id: 51b3a1d2-8d69-4356-8107-2cfb0efca0fd)
- Context: 1 (sudah jadi).
- Artifacts READY: PRD, SRS, ARCHITECTURE, DESIGN, AGENT, SKILLS.
- BACKLOG: sudah di-reset ke `NOT_GENERATED`; project di-reset ke `READY` agar bisa regenerate dengan kode terbaru.

---

## 3. Catatan
- `check_db.js` dan `packages/db/check_srs.js` adalah file debug lokal, tidak dipush.
- Semua commit di `main`, tanpa atribusi AI.

---

## 4. Jika User Bilang "lanjut"
1. Baca `CURRENT_CONTEXT.md` (file ini).
2. Cek apakah backlog FreshBite sudah berhasil di-generate; jika belum, telusuri error provider-nya.
3. Lanjutkan task berikutnya dari BACKLOG.md atau instruksi user.

---

## 5. In-Progress / Handoff — README Repository Cleanup (2026-10-06)

### User Request
User meminta refactor `README.md` menjadi README open-source yang compact, polished, professional, developer-focused, dan restrained, terinspirasi gaya OpenCode/Pi/Hermes/shadcn/ui.

Target utama:
- Jangan mengubah behavior produk, klaim teknis, command install, URL repo, arsitektur, atau capability kecuali terverifikasi dari repo.
- Compact over comprehensive; hindari copy yang terdengar marketing/AI-generated.
- Tidak pakai emoji, decorative clutter, table of contents yang tidak perlu, fake cards, atau badge berlebihan.
- Hero centered berisi nama project, one-sentence tagline, maksimal 3–4 badge berguna, optional compact nav.
- Ganti section “The Problem” dan “The Solution” dengan `What is Project Bootstrapper?` maksimal 2 paragraf pendek.
- Tambahkan compact workflow: `Idea → Clarification → Canonical Context → Specification Pack → Coding Agent`.
- Jadikan generated specification pack sebagai section kuat dan ringkas.
- Dokumen pack yang harus jelas: `PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, `Agent.md`, `BACKLOG.md`.
- Features hanya yang benar-benar membedakan: BYOK provider/credential handling, complexity-aware generation, autonomous CTO/auto-pick clarification behavior, English/Indonesian support, multi-provider model support.
- Quick Start harus praktis dengan urutan: Prerequisites, Installation, Environment, Database, Development.
- Semua shell commands wajib fenced code block.
- Tech Stack compact, bukan badge/package list panjang.
- Project structure tetap ada tapi dipindah ke `<details><summary>Project structure</summary>`.
- Providers compact: Anthropic, OpenAI, Google, OpenRouter; jangan hard-code model names cepat basi kecuali repo mengharuskan.
- Jangan masukkan screenshot/demo placeholder kalau tidak ada asset yang sah di repo.
- Target panjang final README sekitar 120–200 lines kecuali perlu lebih.

### Transcript / Session Notes
- Session IDs `2f7b2710-944e-4ad0-b256-b046d5fa5374` dan `85b7dab9-7b9e-494f-a27a-4b8805c3ddbd` hanya berisi `/resume` wrapper yang membuka background session `cleanup-repository-readme`; keduanya bukan transcript task lengkap.
- Background session `cleanup-repository-readme` sempat tampak running/stuck tanpa output jelas. User meminta konteksnya disimpan agar tidak perlu menjelaskan ulang.
- Session `cleanup-repository-readme ⑂` sempat diminta summary/handoff, tetapi belum ada handoff final yang bisa dipercaya saat konteks ini ditulis.

### Verification Already Started
- `CURRENT_CONTEXT.md` sempat tidak ada di working tree karena status git menunjukkan `D CURRENT_CONTEXT.md`; isi lama diambil dari `git show HEAD:CURRENT_CONTEXT.md` lalu section ini ditambahkan.
- Current git status sebelum update ini menunjukkan root docs terhapus: `ARCHITECTURE.md`, `CURRENT_CONTEXT.md`, `DESIGN.md`, `RULES.md`, `SKILLS.md`.
- `README.md` yang ada saat inspeksi masih memakai section `The Problem`, `The Solution`, feature bullets verbose, tech badges, dan supported providers dengan model names.
- Root `package.json` verified:
  - package manager: `pnpm@12.6.0`
  - scripts: `dev`, `build`, `lint`, `typecheck`, `test`, `format`
- `apps/web/package.json` verified major stack:
  - Next.js `16.3.6`, React `19.2.8`, TypeScript, NextAuth, next-intl, Prisma client via workspace, Vitest, ESLint, Tailwind CSS v4, JSZip, marked, DOMPurify, Zod.
- `packages/db/package.json` verified database scripts:
  - `db:generate`, `db:push`, `db:migrate`, `db:migrate:deploy`, `db:studio`, `db:seed`, `db:reset`, `typecheck`
- Root `.env.example` verified:
  - `DATABASE_URL`
  - `AUTH_SECRET`
  - `AUTH_URL`
  - note says provider API keys are supplied per session via BYOK UI and never persisted.
- `apps/web/.env.example` exists but uses `NEXTAUTH_SECRET` / `NEXTAUTH_URL`; root `.env.example` uses `AUTH_SECRET` / `AUTH_URL`. Be careful before documenting env setup; prefer verified current app expectation if further inspection confirms one canonical file.
- `apps/web/src/lib/ai/provider.ts` verified provider abstraction supports Anthropic, OpenAI, Gemini, and OpenRouter via common provider factory.
- `apps/web/src/lib/export/export-service.ts` indicates exported pack README references `PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, `Agent.md`, `BACKLOG.md`, with `DESIGN.md` conditional if present.
- `apps/web/src/lib/engine/skill-resolver.ts` notes standalone `SKILLS.md` is no longer created; skills are embedded/recommended through `Agent.md`.
- No valid screenshot/demo asset was identified yet; only default Next.js public SVGs and dependency assets appeared in broad image search, so do not add screenshot placeholder unless a real asset is later found.

### Next Steps for README Task
1. Finish verification before editing README:
   - Inspect current `README.md` fully.
   - Inspect `apps/web/src/lib/ai/provider.ts` enough to confirm provider names only, not model-specific claims.
   - Inspect export/planner code enough to confirm generated artifact filenames and optionality.
   - Resolve which env example is canonical for setup commands (`.env.example` vs `apps/web/.env.example`) before writing Quick Start.
2. Replace `README.md` with compact polished version following the requested hierarchy.
3. Keep existing verified commands accurate:
   - `git clone https://github.com/RahmatHadinata23758051/BantuinCoding.git`
   - `cd BantuinCoding`
   - `pnpm install`
   - env copy command only after canonical env target is verified.
   - database commands should use verified package scripts.
   - development command likely `pnpm run dev`, verified at root.
4. Run relevant validation after docs edit:
   - At minimum inspect diff and run formatting/lint only if appropriate for README-only change.
   - Do not run expensive app tests unless needed.
5. Final report should mention README-only docs change and exact validation performed.
