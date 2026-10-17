import { Template, TemplateSchema } from './schemas'

/**
 * list-table template: primary composition is a full-width data table.
 * Suitable for item management, ledger entries, log records.
 * Template adapts styling (separator grammar) but never changes its slot ordering.
 */
const listTableTemplate: Template = {
  id: 'daftar-catatan',
  name: 'Daftar Catatan',
  screen_type: 'list-table',
  purpose: 'Tampilkan dan kelola kumpulan item terstruktur sebagai baris data yang dapat dipindai.',
  content_model:
    'Koleksi rekaman homogen — akun, transaksi, produk, tugas — dengan field kunci yang terlihat di tabel dan semua detail di baris atau laci ekspansi.',
  slots: [
    {
      role: 'header',
      weight: 1,
      optional: false,
    },
    {
      role: 'toolbar',
      weight: 1,
      optional: false,
    },
    {
      role: 'primary',
      weight: 6,
      optional: false,
    },
    {
      role: 'status',
      weight: 2,
      optional: true,
    },
  ],
  behavior: {
    sortable: true,
    filterable: true,
    empty_state: 'Belum ada catatan. Buat catatan pertama dari tombol di atas.',
    loading_state: 'Memuat daftar — skeleton baris dengan lebar acak 60–90%.',
    error_state: 'Gagal memuat daftar. Coba ulangi atau periksa koneksi.',
  },
  responsive: {
    mobile:
      'Sembunyikan kolom sekunder (tanggal, tag, dsb.). Tampilkan setiap baris sebagai blok vertikal dengan label inline.',
    tablet: 'Sembunyikan paling banyak satu kolom sekunder; tabel tetap horizontal.',
  },
  grammar_variants: {
    rule: {
      separator: 'rule',
      rowClass: 'border-b-rule',
      groupClass: 'border-t-rule-thick',
      notes: 'Setiap baris dipisahkan oleh garis tipis 1px. Grup header dipisahkan garis 2px.',
    },
    space: {
      separator: 'space',
      rowClass: 'mb-space',
      groupClass: 'pt-space-lg',
      notes: 'Baris dipisahkan oleh spasi vertikal; tidak ada garis atau border.',
    },
    band: {
      separator: 'band',
      rowClass: 'row-band-alt',
      groupClass: 'group-band-header',
      notes: 'Baris genap diberi latar subtle; header kelompok diberi warna surface.',
    },
    box: {
      separator: 'box',
      rowClass: 'row-box-border',
      groupClass: 'group-box-thick',
      notes: 'Setiap baris dibingkai border tebal 2px; kelompok menggunakan bingkai offset.',
    },
  },
  compatible_themes: ['ledger-kertas', 'instrumen'],
}

// Validate at module load
TemplateSchema.parse(listTableTemplate)

export const TEMPLATES: Template[] = [listTableTemplate]

export function getTemplate(id: string): Template {
  const found = TEMPLATES.find((t) => t.id === id)
  return found ?? TEMPLATES[0]
}
