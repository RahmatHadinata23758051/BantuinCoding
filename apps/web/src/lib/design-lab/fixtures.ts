/**
 * Example domain data for the preview canvas.
 * Explicitly labeled as "contoh" — no fake metrics, no real brand names.
 */
export interface RecordEntry {
  id: string
  code: string
  description: string
  account: string
  amount: string
  direction: 'debit' | 'kredit'
  status: 'TERCATAT' | 'TERVERIFIKASI' | 'PERLU_TINJAUAN'
}

export const CONTOH_CATATAN: RecordEntry[] = [
  {
    id: 'c-01',
    code: 'TRX-1042',
    description: 'Pembelian kertas arsip 80gsm (50 rim)',
    account: 'Beban Operasional',
    amount: 'Rp 2.450.000',
    direction: 'debit',
    status: 'TERVERIFIKASI',
  },
  {
    id: 'c-02',
    code: 'TRX-1043',
    description: 'Penerimaan jasa audit berkala tahap I',
    account: 'Pendapatan Jasa',
    amount: 'Rp 18.000.000',
    direction: 'kredit',
    status: 'TERVERIFIKASI',
  },
  {
    id: 'c-03',
    code: 'TRX-1044',
    description: 'Sewa ruang arsip fisik bulan Oktober',
    account: 'Beban Sewa',
    amount: 'Rp 4.200.000',
    direction: 'debit',
    status: 'TERCATAT',
  },
  {
    id: 'c-04',
    code: 'TRX-1045',
    description: 'Pengembalian selisih pencatatan kas kecil',
    account: 'Kas & Setara Kas',
    amount: 'Rp 350.000',
    direction: 'kredit',
    status: 'PERLU_TINJAUAN',
  },
  {
    id: 'c-05',
    code: 'TRX-1046',
    description: 'Biaya langganan jaringan serat optik',
    account: 'Beban Utilitas',
    amount: 'Rp 1.150.000',
    direction: 'debit',
    status: 'TERCATAT',
  },
]

export const CONTOH_SUMMARY = {
  label: 'Buku Kas Umum · Periode Oktober (Contoh)',
  totalDebit: 'Rp 7.800.000',
  totalKredit: 'Rp 18.350.000',
  saldoAkhir: 'Rp 10.550.000',
  tercatatCount: 5,
}
