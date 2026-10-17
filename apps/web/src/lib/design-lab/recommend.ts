import { RecommendContextSchema, RecommendResultSchema } from './schemas'
import { THEMES } from './themes'
import { TEMPLATES } from './templates'

/**
 * Deterministic first-pass heuristic; never calls an LLM.
 * Uses explicit context flags only, with a Ledger Kertas + list-table default.
 */
export function recommend(context: unknown) {
  const ctx = RecommendContextSchema.parse(context)
  const projectType = (ctx.projectType ?? '').toUpperCase()
  const text = (ctx.ideaSnippet ?? '').toLowerCase()

  let templateId = 'daftar-catatan'
  const reasons: string[] = []

  if (ctx.cli || projectType.includes('API_SERVICE') || /command.line|terminal|cli/.test(text)) {
    templateId = 'daftar-catatan'
    reasons.push('Tampilan terminal/layanan teknis terdeteksi; tahap ini menampilkan daftar tugas sebagai dasar struktur CLI.')
  } else if (ctx.dataDense || /ledger|transaksi|inventaris|catatan|audit|rekonsiliasi/.test(text)) {
    reasons.push('Konteks menunjukkan data berulang dan rapat; daftar catatan mengutamakan pemindaian baris.')
  } else {
    reasons.push('Belum ada sinyal konteks khusus; dipilih struktur netral yang mudah dipindai dan diadaptasi.')
  }

  const result = {
    themeId: THEMES[0].id,
    templateId: TEMPLATES.find((t) => t.id === templateId)?.id ?? TEMPLATES[0].id,
    reasons,
  }
  return RecommendResultSchema.parse(result)
}
