import { Theme, ThemeSchema } from './schemas'

export const ledgerKertasTheme: Theme = {
  id: 'ledger-kertas',
  name: 'Ledger Kertas',
  tagline: 'Presisi pembukuan cetak: aturan garis tegas, tipografi serif akuntansi, dan stempel tunggal.',
  archetype: 'Print Ledger',
  material_metaphor: 'Kertas katun hangat, tinta karbon hitam pekat, aturan garis tipis, dan stempel tinta indigo.',
  palette: {
    canvas: '#F6F3EB',
    surface: '#EDE8DC',
    surface_subtle: '#E5DFD1',
    border: '#D2CABC',
    ink: '#1E1D19',
    ink_muted: '#5E5B52',
    accent: '#1A4B75',
    accent_fg: '#F6F3EB',
    signal: '#8A2C18',
  },
  typography: {
    displayFamily: "var(--font-lyon-text), Georgia, serif",
    bodyFamily: "var(--font-lyon-text), Georgia, serif",
    monoFamily: "var(--font-geist-mono), ui-monospace, monospace",
    scale: {
      display: {
        fontFamily: "var(--font-lyon-text), Georgia, serif",
        fontSize: '28px',
        fontWeight: 600,
        lineHeight: '1.2',
        letterSpacing: '-0.01em',
      },
      headline: {
        fontFamily: "var(--font-lyon-text), Georgia, serif",
        fontSize: '18px',
        fontWeight: 600,
        lineHeight: '1.3',
      },
      body: {
        fontFamily: "var(--font-lyon-text), Georgia, serif",
        fontSize: '13px',
        fontWeight: 400,
        lineHeight: '1.5',
      },
      label: {
        fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
        fontSize: '10px',
        fontWeight: 500,
        lineHeight: '1.2',
        letterSpacing: '0.04em',
      },
      mono: {
        fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
        fontSize: '12px',
        fontWeight: 500,
        fontVariantNumeric: 'tabular-nums',
      },
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  radius: {
    none: '0px',
    sm: '1px',
    md: '2px',
    lg: '3px',
  },
  elevation: {
    base: 'none',
    raised: '0 1px 2px rgba(30, 29, 25, 0.05)',
  },
  surface_grammar: {
    separator: 'rule',
    nesting_depth: 0,
    max_visible_containers: 4,
  },
  signature_moves: [
    {
      move: 'Garis ganda penutup saldo',
      spec: 'border-top: 2px solid var(--theme-border); border-bottom: 3px double var(--theme-border) pada baris rekapitulasi penutup',
    },
    {
      move: 'Kolom debet-kredit tabular',
      spec: 'font-variant-numeric: tabular-nums pada setiap angka moneter, perataan kanan tegas',
    },
    {
      move: 'Badge status terstruktur',
      spec: 'Badge status monospasi dengan border kontras tinggi, background subtle, dan tipografi tegas untuk visibilitas cepat',
    },
  ],
  fit: [
    'Aplikasi pembukuan keuangan & kas operasional',
    'Laporan audit, neraca, dan rekonsiliasi bank',
    'Pencatatan inventaris fisik dan log inventaris gudang',
  ],
  avoid: [
    'Dashboard metrik analitik real-time berbasis grafik donat',
    'Aplikasi media sosial, feed interaktif, atau obrolan santai',
    'Landing page bergaya konsumer dengan gradien warna-warni',
  ],
  do: [
    'Gunakan hierarki tipografi serif yang jelas dengan ritme vertikal teratur',
    'Ratakan semua angka moneter ke kanan dengan angka tabular',
    'Tampilkan status penting dengan badge kontras tinggi yang mudah dipindai',
  ],
  dont: [
    'Jangan gunakan warna aksen berlebihan di luar titik fokus tindakan',
    'Jangan sembunyikan status penting tanpa pembeda teks dan kontras memadai',
    'Jangan abaikan keterbacaan angka dan alignment pada tabel data',
  ],
}

// Instrumen — band grammar, industrial telemetry aesthetic.
// Accent hue: amber ~35°, distance from Ledger Kertas blue ~208° is 173° ≥ 40°.
export const instrumenTheme: Theme = {
  id: 'instrumen',
  name: 'Instrumen',
  tagline: 'Telemetri teknis: pita data horizontal, tipografi monospasi konsisten, dan hierarki warna fungsional.',
  archetype: 'Industrial Instrument',
  material_metaphor: 'Lembar instrumen lab dengan pita data horizontal abu-baja dan aksen amber sinyal.',
  palette: {
    canvas: '#F3F4F6',
    surface: '#E8EAED',
    surface_subtle: '#DDE0E6',
    border: '#C4C8D2',
    ink: '#1B1E23',
    ink_muted: '#525866',
    accent: '#9A4800',
    accent_fg: '#F3F4F6',
    signal: '#6B2B0E',
  },
  typography: {
    displayFamily: "\"JetBrains Mono\", ui-monospace, monospace",
    bodyFamily: "\"JetBrains Mono\", ui-monospace, monospace",
    monoFamily: "\"JetBrains Mono\", ui-monospace, monospace",
    scale: {
      display: {
        fontFamily: "\"JetBrains Mono\", ui-monospace, monospace",
        fontSize: '26px',
        fontWeight: 700,
        lineHeight: '1.15',
        letterSpacing: '-0.02em',
      },
      headline: {
        fontFamily: "\"JetBrains Mono\", ui-monospace, monospace",
        fontSize: '16px',
        fontWeight: 600,
        lineHeight: '1.25',
      },
      body: {
        fontFamily: "\"JetBrains Mono\", ui-monospace, monospace",
        fontSize: '12px',
        fontWeight: 400,
        lineHeight: '1.6',
      },
      label: {
        fontFamily: "\"JetBrains Mono\", ui-monospace, monospace",
        fontSize: '10px',
        fontWeight: 600,
        lineHeight: '1.2',
        letterSpacing: '0.05em',
      },
      mono: {
        fontFamily: "\"JetBrains Mono\", ui-monospace, monospace",
        fontSize: '12px',
        fontWeight: 500,
        fontVariantNumeric: 'tabular-nums',
      },
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  radius: {
    none: '0px',
    sm: '0px',
    md: '2px',
    lg: '3px',
  },
  elevation: {
    base: 'none',
    raised: 'none',
  },
  surface_grammar: {
    separator: 'band',
    nesting_depth: 1,
    max_visible_containers: 4,
  },
  signature_moves: [
    {
      move: 'Pita zebra teknis',
      spec: 'background: var(--theme-surface-subtle) pada setiap baris genap; baris ganjil tetap var(--theme-canvas); tanpa border antar-baris',
    },
    {
      move: 'Header toolbar berbeda latar',
      spec: 'background: var(--theme-surface) pada header/toolbar; dipisahkan dari area data oleh background kontras minimal',
    },
    {
      move: 'Badge status warna sinyal',
      spec: 'status menggunakan warna sinyal amber/merah tegas sebagai background badge; teks kontras tinggi; bentuk bulat pill konsisten',
    },
  ],
  fit: [
    'Telemetri sistem, monitoring log teknis, dan dashboard operasional',
    'Manajemen perintah kerja teknik dan jadwal pemeliharaan',
    'Antarmuka data sensor dan rekaman metrik mesin',
  ],
  avoid: [
    'Aplikasi jurnal akuntansi dengan stempel verifikasi formal',
    'Landing page bergaya editorial atau media cetak',
    'Antarmuka seni dan kreatif dengan estetika hangat',
  ],
  do: [
    'Gunakan pita band untuk membedakan baris genap-ganjil secara visual',
    'Pertahankan tipografi monospasi konsisten di semua level hierarki',
    'Sajikan status dan metrik sebagai badge pill dengan background warna jelas',
  ],
  dont: [
    'Jangan campur serif dan sans-serif — sistem ini murni monospasi',
    'Jangan gunakan border keliling berlebihan pada baris data — band sudah cukup',
    'Jangan gunakan dekorasi visual yang tidak membawa informasi nyata',
  ],
}

// Validate catalog entries at module load
ThemeSchema.parse(ledgerKertasTheme)
ThemeSchema.parse(instrumenTheme)

export const THEMES: Theme[] = [ledgerKertasTheme, instrumenTheme]

export function getTheme(id: string): Theme {
  const found = THEMES.find((t) => t.id === id)
  return found ?? THEMES[0]
}
