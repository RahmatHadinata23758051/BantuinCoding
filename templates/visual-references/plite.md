# Plate · The Pass — Design System
 
Dokumentasi konsep **C · The Pass**: dashboard Sales overview untuk restoran **Brasa Brooklyn** (Plate). Konsep ini sengaja dibuat dari dunia dapur, bukan dari template SaaS. Nilai di bawah diambil dari file `Pass.dc.html`.
 
---
 
## 1. Konsep
 
**Satu minggu = 7 tiket order yang digantung di rel dapur (the pass).** Panjang tiket sama dengan penjualan hari itu, jadi hari sibuk terlihat langsung tanpa membaca angka.
 
- **Pengguna:** GM / pemilik restoran yang membuka dashboard sebelum atau sesudah service.
- **Tugas utama:** tahu minggu ini berjalan bagaimana, hari mana yang paling menentukan, dan apa yang menyimpang dari target.
- **Satu momen berani:** rel tiket. Semua yang lain sengaja tenang dan disiplin.
- **Prinsip:**
  1. Vernakular dapur dipakai karena fungsinya (tiket, struk, rel, talenan berkode warna), bukan dekorasi.
  2. Angka dibaca lewat kalimat dan bentuk dulu, tabel dan chart sesudahnya.
  3. Merah hanya berarti "perlu perhatian". Tidak dipakai untuk dekorasi atau seri data.
  4. Tidak ada kartu seragam bersudut bulat. Struktur dibuat dari garis, kertas, dan jarak.
---
 
## 2. Color Tokens
 
### Permukaan & tinta
| Token | Nilai | Penggunaan |
|---|---|---|
| `--wall` | `#E9EDEC` | Latar halaman (abu stainless) |
| `--paper` | `#FBFCFA` | Tiket dan struk (kertas thermal) |
| `--paper-edge` | `#CBD3D1` | Outline tipis tiket dan struk |
| `--ink` | `#161D20` | Teks utama, garis tebal, bar, garis data utama |
| `--ink-soft` | `#2B3438` | Paragraf, rel, teks sekunder kuat |
| `--muted` | `#566166` | Subjudul, label sumbu, tanggal di tiket |
| `--steel-clip` | `#5A676C` | Klip tiket di rel |
| `--rule` | `#CFD6D5` | Gridline chart, pemisah daftar |
| `--axis` | `#9AA5A8` | Baseline chart, garis putus-putus di tiket |
| `--track` | `#E1E6E5` | Track progress di struk |
| `--prior` | `#8B9699` | Seri "prior week" (abu, putus-putus) |
 
### Status
| Token | Nilai | Penggunaan |
|---|---|---|
| `--alert` | `#C8281E` | Hanya untuk angka yang melewati target (mis. food cost 31.2% vs 30.0%), meniru tinta merah printer dapur |
 
### Channel (kode warna talenan dapur)
| Channel | Nilai | Catatan |
|---|---|---|
| Dine-in | `#2E7D4F` | Hijau |
| Takeout | `#2F6DB5` | Biru |
| Delivery | `#C07F00` | Kuning-amber (digelapkan supaya kontras ≥ 3:1) |
 
**Hasil validasi** (`validate_palette.js`, mode light): semua check PASS. Jarak CVD terburuk biru↔hijau ΔE 17.2 (deutan) dan 18.1 (normal). Pada tritan biru↔hijau hanya 3.5, jadi identitas channel tidak bergantung warna saja: ada legenda berlabel, nilai, persen, dan jeda 2px antar segmen.
 
---
 
## 3. Typography
 
| Peran | Font | Detail |
|---|---|---|
| Display / judul tiket | **Big Shoulders Display** 800 | Gaya papan industri. Headline, nama hari di tiket, wordmark "plate" |
| Teks & UI | **Barlow** 400 / 500 / 600 | Paragraf, nav, judul section, daftar, chart label |
| Cetakan | **IBM Plex Mono** 400 / 500 / 600 | **Hanya** di tiket dan struk, karena memang itu hasil printer |
 
Skala:
| Style | Ukuran | Weight | Catatan |
|---|---|---|---|
| Headline | `clamp(48px, 6.4vw, 88px)` | 800 | line-height 0.95, lebar maks 11em |
| Wordmark | 34px | 800 | Big Shoulders |
| Judul section | 24px | 600 | Sentence case, berupa kalimat bermakna |
| Paragraf utama | 19px | 400 | line-height 1.55, lebar maks 34em |
| Nav / UI | 16px | 500 (aktif 600) | |
| Subjudul / caption | 15px | 400 | `--muted` |
| Nama hari di tiket | 30px | 800 | Big Shoulders |
| Isi tiket / struk | 12–13.5px | 400–600 | Plex Mono, line-height 17–20px |
| Label chart | 12px | 400 | `--muted` |
 
Aturan: sentence case di semua tempat, tanpa label huruf kapital, tanpa eyebrow di atas judul.
 
---
 
## 4. Spacing, Border, Shadow
 
- **Padding halaman:** 48px kiri-kanan, maks lebar konten 1440px.
- **Jarak antar section besar:** 56px. Gap kolom 64px.
- **Garis section:** `border-top: 3px solid var(--ink)` + padding atas 16px. Ini pengganti kartu.
- **Radius:** hampir tidak ada. Tombol 4px, bar 4px di ujung data, segmen channel 4px. Tiket sengaja persegi dengan tepi robek zigzag.
- **Shadow:** hanya di tiket dan struk, `0 2px 6px rgba(22,29,32,.10)`.
- **Tepi robek:** SVG polygon zigzag 15 gigi (`viewBox 0 0 120 7`, `preserveAspectRatio="none"`) berwarna `--paper`, tinggi 8px di tiket dan 10px di struk.
---
 
## 5. Layout
 
```
┌──────────────────────────────────────────────────────────────┐
│ plate   Today [Sales] Menu Staff Inventory     ‹ Oct 12–18 › │
├──────────────────────────────────────────────────────────────┤
│  Headline besar (kalimat)               ┌─ Struk ─────────┐  │
│  Paragraf ringkas                       │ Week 42 summary │  │
│                                         └~~~~~~~~~~~~~~~~~┘  │
│                                                              │
│  Every day on the rail                                       │
│  ════════════════════ rel baja ═══════════════════════════   │
│   ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌───┐ ┌────┐ ┌──┐                     │
│   │M │ │T │ │W │ │T │ │ F │ │ S  │ │S │  panjang = penjualan│
│   └~~┘ └~~┘ │  │ │  │ │   │ │    │ │  │                     │
│              └~~┘ └~~┘ │   │ │    │ └~~┘                     │
│                        └~~~┘ │    │                           │
│                              └~~~~┘                           │
│  ─────────────────────────────  ───────────────────────────  │
│  Hourly chart (2/3)             Channel mix (1/3)            │
│                                 Top menu items               │
└──────────────────────────────────────────────────────────────┘
```
 
- **Alignment:** rata kiri semua. Tidak ada elemen yang di-center.
- **Rel:** scroll horizontal di layar sempit (`min-width: 1216px`, tiket `min-width: 160px`).
- **Bawah rel:** dua kolom `flex-wrap`, chart per jam `flex: 2 1 520px`, kolom kanan `flex: 1 1 320px`.
---
 
## 6. Komponen
 
### 6.1 Top bar
- Tinggi 72px, border-bottom `#C3CCCB`.
- Wordmark "plate" (Big Shoulders 34px), nav teks biasa, kontrol minggu di kanan.
- Nav aktif: teks `--ink` weight 600 + garis bawah 3px `--ink`. Nav non-aktif `--muted`.
- Kontrol minggu: tombol panah 44×44 (border 1.5px, radius 4px) + teks "Oct 12 to Oct 18". Tombol "next" disabled kalau sudah minggu terakhir.
### 6.2 Headline + paragraf
- Berupa kalimat penuh: "Brasa Brooklyn took $31,420 this week."
- Paragraf di bawahnya merangkum tiga hal: perubahan vs minggu lalu, hari yang membawa minggu itu, dan penyimpangan (ticket rata-rata, food cost).
- Tidak ada aksen satu kata, tidak ada gradient.
### 6.3 Struk ringkasan (Week 42 summary)
- Lebar ± 300px, kertas `--paper`, Plex Mono 13.5px, tepi bawah zigzag.
- Isi: Net sales, Covers, Avg ticket, Food cost, Weekly target, Reached + progress bar 8px.
- Food cost dan keterangan "1.2 pts over 30.0% target" memakai `--alert`.
- Progress bar: track `--track`, isi `--ink`, radius 2px.
### 6.4 Rel dan tiket (elemen utama)
- **Rel:** batang `#2B3438` tinggi 12px, radius 6px, memanjang 8px di kiri-kanan area tiket.
- **Klip:** 28×24px `#5A676C`, radius `4px 4px 2px 2px`, menimpa tepi atas tiket.
- **Tiket:** `--paper`, border 1px `--paper-edge` (tanpa border bawah), padding 12×14px, Plex Mono 12px / line-height 17px, tepi robek zigzag di bawah.
- **Panjang tiket (data!):** `tinggi = penjualan × 0.075 px`, dari nol. Contoh: Senin $3,120 → 234px, Sabtu $7,320 → 549px. Isi cetakan paling padat masih muat di tiket terpendek.
- **Isi, dari atas ke bawah:**
  1. Nama hari (Big Shoulders 30px) + tanggal (`--muted`).
  2. Garis putus-putus.
  3. Covers, rata-rata per cover, jam sibuk.
  4. Garis putus-putus.
  5. Tiga menu teratas dengan jumlah terjual.
  6. Spacer (kertas kosong, inilah yang membuat panjang terbaca).
  7. Garis 1.5px + "Net" dan total, weight 600.
- **Penekanan:** tiket hari tersibuk (Sabtu) memakai border 2px `--ink` dan tepi robek berwarna ink. Tidak memakai merah.
Data tiket (contoh):
| Hari | Net | Covers | Per cover | Peak |
|---|---|---|---|---|
| Mon 10/12 | $3,120 | 142 | $21.97 | 7p |
| Tue 10/13 | $3,340 | 151 | $22.12 | 7p |
| Wed 10/14 | $3,680 | 163 | $22.58 | 7p |
| Thu 10/15 | $3,910 | 178 | $21.97 | 7p |
| Fri 10/16 | $5,980 | 241 | $24.81 | 8p |
| Sat 10/17 | $7,320 | 262 | $27.94 | 7p |
| Sun 10/18 | $4,070 | 147 | $27.69 | 6p |
 
### 6.5 Chart per jam ("Seven o'clock is the rush")
- Line chart 2 seri: **This week** (`--ink`, 2.5px, solid) dan **Prior week** (`--prior`, 2px, putus-putus `5 4`). Tanpa area fill.
- Sumbu: gridline `--rule`, baseline `--axis`, label 12px `--muted`; y: $0–$800 per $200; x: 11a–10p tiap 2 jam.
- Legenda selalu tampil (swatch garis di atas chart), karena ada ≥ 2 seri.
- **Interaksi (default hover layer):**
  - 12 tombol transparan menutupi tiap jam; `mouseenter` atau `focus` memilih jam.
  - Crosshair vertikal 1px `--ink`, dot 14px (this week) dan 10px (prior week) dengan ring `--wall`.
  - Tooltip `--ink` dengan teks putih: jam, nilai this week, nilai prior week + selisih.
  - Tooltip pindah ke kiri titik kalau titik berada di sisi kanan chart (> 60%).
  - State awal: jam 7p (puncak) sudah terpilih.
- **Aksesibilitas:** `role="img"` + `aria-label` ringkasan, tombol jam punya `aria-label` berisi nilainya, dan `<details>` "Show these numbers as a table" berisi tabel 12 jam.
### 6.6 Channel mix ("Six in ten dine in")
- Stacked bar 18px, segmen proporsional 62 / 21 / 17, jeda 2px, radius 4px.
- Daftar di bawahnya: swatch 12px, nama, nominal (`--muted`), persen (weight 600), pemisah `--rule`.
- Dine-in $19,480 · Takeout $6,598 · Delivery $5,342 (total $31,420).
### 6.7 Top menu items ("What left the pass most")
- Satu seri → satu warna (`--ink`) untuk semua bar. Tidak ada ramp warna.
- Bar 8px, sudut kanan 4px, mulai dari baseline kiri. Panjang proporsional ke 312.
- Steak frites 312 · Empanadas 248 · Ribeye 196 · Burrata salad 171 · Old fashioned 164.
---
 
## 7. State & Interaksi
 
| Elemen | Hover / focus | Aktif |
|---|---|---|
| Nav | — | Garis bawah 3px + weight 600 |
| Tombol minggu | Fokus: ring bawaan browser | Disabled: border dan ikon `#AEB8B7` |
| Jam di chart | Crosshair + dot + tooltip | Terpilih sampai jam lain dipilih |
| `<details>` tabel | Buka/tutup standar | — |
 
- Tidak ada animasi masuk otomatis. Gerak hanya muncul sebagai respons aksi pengguna.
- Target klik minimal 44×44px (nav, tombol minggu, summary tabel).
---
 
## 8. Konvensi Konten
 
- **Judul section = pernyataan**, bukan label: "Seven o'clock is the rush", "Six in ten dine in".
- **Tanggal:** "Oct 12 to Oct 18" (tanpa titik tengah), tiket pakai "10/12".
- **Mata uang:** `$` tanpa desimal untuk total, dua desimal untuk nilai per cover.
- **Jam:** "7p", "11a" di chart dan tiket.
- **Tone:** singkat, langsung, seperti catatan GM. Tidak ada kalimat promosi.
- **Merah** hanya muncul bersama kata yang menjelaskan masalahnya ("1.2 pts over 30.0% target").
---
 
## 9. Responsif
 
- Header: nav dan kontrol minggu membungkus ke baris baru.
- Headline mengecil lewat `clamp`, struk turun di bawah paragraf kalau ruang kurang (`flex-wrap`, struk min 260px).
- Rel tiket scroll horizontal, bukan menumpuk, supaya makna "panjang = penjualan" tidak rusak.
- Chart per jam dan kolom kanan saling menumpuk di bawah ~ 900px.
---
 
## 10. Aksesibilitas
 
- Kontras teks ≥ 4.5:1 di atas `--wall` dan `--paper` (muted `#566166`, alert `#C8281E`).
- Warna tidak jadi satu-satunya pembawa makna: channel punya label + nilai, merah selalu disertai teks.
- Semua kontrol memakai `<button>` / `<a>` asli, ikon dekoratif `aria-hidden`.
- Chart punya `aria-label` ringkasan dan padanan tabel.
- Tiket memakai `<article>` dengan `<h3>` nama hari.
---
 
## 11. CSS Tokens
 
```css
:root {
  /* Surfaces & ink */
  --wall:       #E9EDEC;
  --paper:      #FBFCFA;
  --paper-edge: #CBD3D1;
  --ink:        #161D20;
  --ink-soft:   #2B3438;
  --muted:      #566166;
  --steel-clip: #5A676C;
  --rule:       #CFD6D5;
  --axis:       #9AA5A8;
  --track:      #E1E6E5;
  --prior:      #8B9699;
 
  /* Status */
  --alert: #C8281E;
 
  /* Channels (kode warna talenan) */
  --ch-dine-in:  #2E7D4F;
  --ch-takeout:  #2F6DB5;
  --ch-delivery: #C07F00;
 
  /* Type */
  --font-display: "Big Shoulders Display", Impact, sans-serif;
  --font-body:    "Barlow", system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-print:   "IBM Plex Mono", ui-monospace, monospace;
 
  /* Shape */
  --radius-btn: 4px;
  --radius-bar: 4px;
  --shadow-ticket: 0 2px 6px rgba(22, 29, 32, .10);
 
  /* Rail */
  --ticket-px-per-dollar: 0.075; /* tinggi tiket = penjualan × 0.075 px */
}
```
 
---
 
## 12. Catatan Data
 
Semua angka adalah **data contoh** (bukan data asli restoran). Sambungkan ke sumber sebenarnya sebelum dipakai: penjualan harian, covers, rata-rata per cover, jam sibuk, tiga menu teratas per hari, penjualan per jam (minggu ini dan lalu), channel, dan target mingguan ($40,320 = $5,760 × 7).