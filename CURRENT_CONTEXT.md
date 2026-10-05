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