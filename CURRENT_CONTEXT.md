# CURRENT_CONTEXT.md — Active Work State & Context Bridge

> **Tujuan Dokumen:** Dokumen ini merangkum status terakhir pekerjaan secara presisi agar sesi Claude Code baru langsung mengetahui seluruh konteks, keputusan yang telah dibuat, dan tugas yang sedang berjalan tanpa user perlu mengulang dari awal.

---

## 1. Konteks Percakapan & Keputusan yang Sudah Selesai (Done)

### A. Generator `DESIGN.md` (Anti-Default Neo-Brutalism & Anti-Slop) — **SUDAH SELESAI**
- **File:** `apps/web/src/lib/prompts/design-generator.ts`
- **Aturan yang sudah terkunci:**
  1. **Anti-Default Rule:** Project yang di-generate untuk user **DILARANG KERAS** menggunakan tema internal BantuinCoding (kertas warm paper `#F7F0DF`, border tebal komik 2–3px, offset shadow hitam, atau speech bubble) kecuali jika user secara eksplisit meminta tema *neo-brutalist*.
  2. **7 Arketipe Industri:** AI wajib memilih 1 dari 7 arketipe desain (Enterprise SaaS, Precision DevTools/Dark Monolith, High-Density Fintech, Warm Editorial, Modern Bento, Vibrant Studio, Calm HealthTech).
  3. **Anti-Slop Iconography (Kasus Gambar #34):** Melarang icon acak mengambang di kotak pastel tanpa label, emoji sebagai icon UI, stiker 3D kartun. Wajib menggunakan 1 library konsisten (Lucide/Tabler/Heroicons) dengan stroke seragam dan fungsi semantik jelas.
  4. **Auth / Login Non-Generik:** Menolak layout centered card mini ala Laravel Breeze. Wajib domain-specific split-screen showcase dengan visual preview dan form lengkap (focus ring, password toggle, error states).
  5. **Pengujian:** Sudah dites dengan ide project `Kost Managemeng` dan menghasilkan tema Emerald & Slate yang 100% bersih dari tema komik internal.

### B. Migrasi Visual `ProviderSetupPanel.tsx` — **SUDAH SELESAI**
- **File:** `apps/web/src/app/components/ProviderSetupPanel.tsx`
- **Latar Belakang:**
  - Desain `ProviderSetupPanel` sebelumnya sempat berubah menjadi gaya SaaS modern (warna `slate`, `emerald-50`, rounded soft dari Gambar #37).
  - **Tujuan:** Mengembalikan dan menyelaraskan styling `ProviderSetupPanel.tsx` ke tema internal BantuinCoding (**Premium Neo-Brutalist Comic Editorial**: border `2px border-[var(--ink)]`, hard shadows `shadow-[var(--shadow-xs)]`, warna `var(--paper-raised)`, `var(--mint)`, `var(--electric-yellow)`) **sambil tetap mempertahankan fitur multi-key provider yang sudah ada**.
- **Hasil:**
  - Header panel dan status bar sudah disesuaikan ke Neo-Brutalist.
  - Typo syntax kurung tutup pada baris 304 sudah diperbaiki.
  - Elemen di dalam `open` dropdown, khususnya `Saved Keys List` (card item, radio button aktivasi key, tombol delete/edit/tambah key) telah selesai memakai border 2px dan token tema neo-brutalist (ink, mint, paper) secara konsisten.

---

## 2. Tugas yang Sedang Berjalan (In-Progress)
*Belum ada tugas aktif selanjutnya. Silakan cek `BACKLOG.md` atau instruksi dari user.*

---

## 3. Daftar File yang Terlibat / Berubah
1. `apps/web/src/lib/prompts/design-generator.ts` (Guardrails generator - modified)
2. `apps/web/src/app/components/ProviderSetupPanel.tsx` (In-progress visual sync)
3. `apps/web/src/app/components/MarkdownWorkspace.tsx` (Workspace adjustments)
4. `apps/web/src/app/globals.css` (CSS variables & tokens)

---

## 4. Instruksi untuk Claude Code di Sesi Baru
Jika user mengatakan **"lanjut"**, **"lanjutkan"**, atau **"gas"**:
1. Langsung baca `apps/web/src/app/components/ProviderSetupPanel.tsx`.
2. Selesaikan penyesuaian style `Saved Keys List` dan form `Add New Key` ke tema Neo-Brutalist Comic Editorial (border 2px ink, hard shadow, palet ink/paper).
3. Jalankan `npm run lint` atau typecheck untuk memastikan tidak ada error regresi.
