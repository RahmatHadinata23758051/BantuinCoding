# Plate — Design System

Dokumentasi desain untuk dashboard operasional restoran **Plate** (screen: *Today / Dinner Service*). Nilai warna, ukuran, dan spacing di bawah adalah estimasi dari screenshot, jadi sesuaikan kalau ada token resmi.

---

## 1. Overview

- **Produk:** Dashboard operasional restoran (sales, covers, meja, dapur, inventori, staf).
- **Karakter visual:** Bersih, hangat, modern. Banyak whitespace, kartu putih dengan border tipis, satu warna aksen oranye-terracotta.
- **Kepadatan:** Medium. Data tabel rapat tapi tetap terbaca, KPI besar dan tegas.
- **Prinsip:**
  1. Informasi paling penting (angka, status) harus langsung terlihat.
  2. Warna dipakai untuk makna (status), bukan dekorasi.
  3. Satu aksen utama (oranye) untuk state aktif dan CTA.
  4. Hierarki lewat ukuran dan weight, bukan lewat banyak warna.

---

## 2. Color Tokens

### Brand / Accent


| Token          | Nilai (estimasi) | Penggunaan                                                          |
| -------------- | ---------------- | ------------------------------------------------------------------- |
| `--accent-500` | `#E8650F`        | Tab aktif (gradient atas), ikon logo                                |
| `--accent-600` | `#D4540A`        | Gradient bawah tab aktif                                            |
| `--accent-700` | `#B8480A`        | Teks highlight (mis. "Service starts 17:00"), nilai "78% of target" |
| `--accent-50`  | `#FDEEE3`        | Background pill alert, badge hitungan di sidebar                    |
| `--accent-100` | `#FBE3D0`        | Background ikon toko di location switcher                           |


### Neutral


| Token              | Nilai     | Penggunaan                                     |
| ------------------ | --------- | ---------------------------------------------- |
| `--bg-app`         | `#EEEEF0` | Latar luar aplikasi                            |
| `--bg-surface`     | `#FFFFFF` | Kartu, tabel, header                           |
| `--bg-sidebar`     | `#F7F7F8` | Sidebar                                        |
| `--bg-subtle`      | `#F9F9FA` | Header kolom tabel, panel Kitchen Status       |
| `--border`         | `#E6E6E9` | Border kartu, divider tabel, input             |
| `--text-primary`   | `#16161A` | Judul, angka KPI, isi tabel                    |
| `--text-secondary` | `#5F5F68` | Label menu, subjudul                           |
| `--text-tertiary`  | `#8E8E96` | Caption, header kolom (uppercase), placeholder |


### Semantic / Status


| Status      | Teks      | Background | Contoh                    |
| ----------- | --------- | ---------- | ------------------------- |
| Success     | `#1E8A4C` | `#E4F4EA`  | "On track", "↑ +12"       |
| Warning     | `#B7791F` | `#FBF0DA`  | "Long stay"               |
| Danger      | `#D93025` | `#FCE8E6`  | "Check"                   |
| Info/Accent | `#B8480A` | `#FDEEE3`  | Alert "Service in 23 min" |


> Status selalu dikombinasikan dengan **dot (●)** kecil di depan teks supaya tidak bergantung pada warna saja.

---

## 3. Typography

- **Font family:** Sans-serif geometris modern (mirip Inter / Geist). Fallback: `system-ui, -apple-system, "Segoe UI", sans-serif`.
- **Angka:** Gunakan `font-variant-numeric: tabular-nums` untuk KPI dan tabel.


| Style             | Size      | Weight           | Line-height | Penggunaan                                              |
| ----------------- | --------- | ---------------- | ----------- | ------------------------------------------------------- |
| Page title        | 22px      | 600              | 1.3         | "Today · Tuesday, May 21"                               |
| Page title accent | 22px      | 600              | 1.3         | "Service starts 17:00" (warna accent-700)               |
| Page subtitle     | 14px      | 400              | 1.4         | "Lunch closed: $4,820 · 184 covers …"                   |
| KPI value         | 26px      | 600              | 1.2         | "$4,820", "184", "$26"                                  |
| Card title        | 17px      | 600              | 1.3         | "Today's Schedule", "Needs Attention", "Kitchen Status" |
| Body / table cell | 14.5px    | 400–500          | 1.4         | Isi tabel                                               |
| Nav item          | 15px      | 400 (aktif: 500) | 1.3         | Menu sidebar                                            |
| Caption           | 12.5–13px | 400              | 1.4         | "16 tables active · 84 seats", "vs avg Tuesday"         |
| Table header      | 12.5px    | 500              | 1.3         | Uppercase, letter-spacing `0.04em`, `--text-tertiary`   |
| Section label     | 12.5px    | 500              | 1.3         | "OPERATIONS", "INSIGHTS" (uppercase, tracking)          |


---

## 4. Spacing, Radius, Elevation

**Spacing scale (4px base):** 4, 8, 12, 16, 20, 24, 32.

**Radius**


| Token           | Nilai   | Penggunaan                           |
| --------------- | ------- | ------------------------------------ |
| `--radius-sm`   | 8px     | Badge hitungan, tombol kecil         |
| `--radius-md`   | 12px    | Input search, tombol, item nav aktif |
| `--radius-lg`   | 18–20px | Kartu KPI, kartu tabel, panel        |
| `--radius-full` | 999px   | Tab segmented, pill alert            |


**Elevation**

- Kartu: border `1px solid var(--border)` + shadow sangat halus `0 1px 2px rgba(16,16,20,.04)`.
- Item nav aktif &amp; tab aktif: shadow sedikit lebih jelas `0 1px 3px rgba(16,16,20,.08)`.
- Tidak ada shadow tebal. Kedalaman dibuat lewat border + kontras putih vs abu.

---

## 5. Layout

```
┌──────────────┬────────────────────────────────────────────┐
│  Sidebar     │  Header (title + alert pill)               │
│  ~280px      ├────────────────────────────────────────────┤
│              │  Toolbar: segmented tabs  |  Dinner Service│
│  - Brand     │  KPI row (4 kartu)                         │
│  - Location  │  ┌───────────────────┬──────────────────┐  │
│  - Search    │  │ Today's Schedule  │ Needs Attention  │  │
│  - Nav       │  │ (tabel, ~2/3)     │ (list, ~1/3)     │  │
│              │  └───────────────────┴──────────────────┘  │
│              │  Kitchen Status (tabel full width)         │
└──────────────┴────────────────────────────────────────────┘

```

- **Sidebar:** lebar ± 280px, fixed, background `--bg-sidebar`, padding 16–20px.
- **Konten:** padding 24px, gap antar section 20–24px.
- **KPI row:** 4 kolom sama lebar, gap 20px (kolom ke-4 terpotong di screenshot, tetap grid 4).
- **Schedule + Attention:** grid `2fr / 1fr` (± 68% / 32%), gap 20px.
- **Kitchen Status:** full width di bawah.
- **Header:** tinggi ± 80px, border-bottom `--border`, background putih.
- Aplikasi dibungkus frame dengan radius besar dan margin tipis dari tepi viewport.

---

## 6. Components

### 6.1 Sidebar

- **Brand:** logo lingkaran oranye (ring + dot) 36px + wordmark "Plate" 20px/600. Di kanan ada tombol collapse (ikon panel, kotak putih 36px, radius 12, border).
- **Location switcher:** kartu border tipis radius 12, ikon toko di kotak oranye muda, dua baris teks ("Brasa Brooklyn" / "1 of 1 location"), chevron di kanan.
- **Search:** input radius 12, ikon kaca pembesar, placeholder "Search…", shortcut badge `⌘ F` di kanan.
- **Nav group:** label uppercase kecil ("OPERATIONS", "INSIGHTS"), lalu daftar item.
- **Nav item:** tinggi ± 40px, ikon outline 20px + label, padding horizontal 12px, radius 12.
  - *Default:* teks `--text-secondary`, tanpa background.
  - *Active:* background putih, shadow halus, ikon + teks warna accent, weight 500.
  - *Badge hitungan* (Tables 16, Inventory 4): pill `--accent-50`, teks accent, 12px/600, radius 8.
- **Menu:** Today, Tables, Menu, Inventory, Staff · Insights: Schedule, Reports, Customers.

### 6.2 Page Header

- Kiri: judul 22px dengan bagian akhir berwarna accent; subjudul abu di bawahnya.
- Kanan: **alert pill** (background `--accent-50`, dot oranye, teks accent 13.5px, radius full, padding 8×16) — contoh "Service in 23 min · Steak frites low".

### 6.3 Segmented Tabs (Lunch / Dinner / Brunch / All day)

- Container: border `--border`, radius full, padding 4px, background putih.
- Tab default: teks `--text-secondary`, padding 8×18.
- Tab aktif: background **gradient vertikal** `accent-500 → accent-600`, teks putih, radius full, shadow halus.
- Di kanan toolbar: tombol outline "Dinner Service" dengan ikon kalender (radius 12, border, background putih).

### 6.4 KPI Card

- Ukuran ± 280×155px, radius 20, border `--border`, background putih, padding 20px.
- Struktur dari atas ke bawah:
  1. Ikon dalam lingkaran putih berborder (36px) + label kecil abu ("Net Sales · Today").
  2. Baris nilai: angka besar kiri, delta/trend kanan.
  3. Divider tipis.
  4. Caption pembanding ("target $6,200", "vs avg Tuesday").
- **Delta:** hijau dengan panah ↑ untuk positif, abu untuk "flat", accent untuk progres ke target ("78% of target").
- Kartu: Net Sales, Covers, Avg Ticket, Food Cost (32.4%, target 30%).

### 6.5 Data Table (Today's Schedule)

- Wrapper kartu radius 20, border, header kartu berisi judul + subjudul dan tombol filter ("All Servers", outline radius 12).
- **Header kolom:** background `--bg-subtle`, uppercase 12.5px, tracking, border-bottom, ada divider vertikal tipis antar kolom.
- **Baris:** tinggi ± 52px, border-bottom `--border`, teks 14.5px. Kolom pertama (nomor meja) weight 600.
- **Kolom:** Table · Server · Guests · Course · Time at table · Status.
- **Status cell:** dot 8px + label berwarna (On track = hijau, Long stay = amber, Check = merah).
- Hover row: background `--bg-subtle` (disarankan).

### 6.6 Needs Attention (List Panel)

- Kartu sama dengan tabel; judul + subjudul "During service · auto-updates".
- Item list: ikon dalam lingkaran putih berborder 36px (warning, clock, flame, terminal, box), judul 15px/500, subjudul abu 13px. Divider tipis antar item, padding vertikal ± 12px.
- Contoh isi: Check Waiting, Long Stay, Steak Frites Low, Terminal #2 Offline, Ribeye Running Out.

### 6.7 Kitchen Status

- Kartu dengan header background `--bg-subtle`, judul + subjudul ("Dinner service · 5 tickets on the rail · target &lt;18 min").
- Badge hijau di kanan atas ("Avg Ticket …") — pill background `#E4F4EA`, teks hijau.
- Tabel: Ticket · Table · Items · Time on rail · Station. Ticket ID weight 600 (`#4821`), item punya sub-baris kecil abu (mis. "MR"), station teks abu ("Grill", "Cold + Fryer").

---

## 7. Iconography

- Gaya **outline**, stroke ± 1.5px, ukuran 20px (nav) dan 18–20px (kartu).
- Ikon dalam kartu ditempatkan di **lingkaran putih 36px** dengan border `--border` dan shadow sangat halus.
- Warna ikon: `--text-secondary` (default), accent (state aktif).

---

## 8. States &amp; Interaction


| Elemen         | Hover                    | Active/Selected              | Focus           |
| -------------- | ------------------------ | ---------------------------- | --------------- |
| Nav item       | background `#EFEFF1`     | Putih + shadow + teks accent | Ring accent 2px |
| Tab            | teks `--text-primary`    | Gradient oranye, teks putih  | Ring accent 2px |
| Tombol outline | background `--bg-subtle` | —                            | Ring accent 2px |
| Row tabel      | background `--bg-subtle` | —                            | —               |


- **Auto-update:** panel "Needs Attention" diperbarui real-time saat service (tampilkan transisi halus 150–200ms saat item masuk/keluar).
- Transisi default: `150ms ease-out`.

---

## 9. Content &amp; Data Conventions

- **Mata uang:** `$` tanpa desimal untuk nilai besar ("$4,820"), tanpa pemisah spasi.
- **Durasi:** "38 min", "1h 18m", "8 min".
- **Ukuran meja:** "2-top", "4-top", "8-top".
- **Pemisah info:** titik tengah `·` dengan spasi di kiri dan kanan.
- **Waktu:** format 24 jam ("17:00", "21:00").
- **Tone teks:** singkat, operasional, tanpa kalimat panjang.

---

## 10. Accessibility

- Kontras teks utama terhadap putih ≥ 4.5:1; hati-hati dengan `--text-tertiary` untuk teks kecil, naikkan sedikit kalau perlu.
- Status tidak hanya warna: selalu ada dot + label teks.
- Target klik minimal 40×40px (nav, tab, tombol).
- Pastikan fokus keyboard terlihat jelas, dan shortcut `⌘ F` punya padanan `Ctrl + F` di non-Mac.
- Tabel pakai markup semantik (`<table>`, `<th scope>`), dan alert pill memakai `role="status"`.

---

## 11. Contoh CSS Tokens

```css
:root {
  /* Accent */
  --accent-50:  #FDEEE3;
  --accent-100: #FBE3D0;
  --accent-500: #E8650F;
  --accent-600: #D4540A;
  --accent-700: #B8480A;

  /* Neutral */
  --bg-app:     #EEEEF0;
  --bg-surface: #FFFFFF;
  --bg-sidebar: #F7F7F8;
  --bg-subtle:  #F9F9FA;
  --border:     #E6E6E9;
  --text-primary:   #16161A;
  --text-secondary: #5F5F68;
  --text-tertiary:  #8E8E96;

  /* Status */
  --success: #1E8A4C;  --success-bg: #E4F4EA;
  --warning: #B7791F;  --warning-bg: #FBF0DA;
  --danger:  #D93025;  --danger-bg:  #FCE8E6;

  /* Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --radius-full: 999px;

  /* Shadow */
  --shadow-card: 0 1px 2px rgba(16, 16, 20, .04);
  --shadow-active: 0 1px 3px rgba(16, 16, 20, .08);

  --font-sans: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
}

```