import { RecommendContextSchema, RecommendResultSchema } from './schemas'
import { THEMES } from './themes'

/**
 * Deterministic first-pass heuristic; never calls an LLM.
 * Uses explicit context flags only and leaves the template unselected.
 */
export function recommend(context: unknown) {
  const ctx = RecommendContextSchema.parse(context)
  const projectType = (ctx.projectType ?? '').toUpperCase()
  const text = (ctx.ideaSnippet ?? '').toLowerCase()
  const reasons: string[] = []

  if (ctx.cli || projectType.includes('API_SERVICE') || /command.line|terminal|cli/.test(text)) {
    reasons.push('Tampilan terminal atau layanan teknis terdeteksi; pilih pola layar yang sesuai setelah menentukan kebutuhan UI.')
  } else if (ctx.dataDense || /ledger|transaksi|inventaris|catatan|audit|rekonsiliasi/.test(text)) {
    reasons.push('Konteks menunjukkan data berulang dan rapat; pilih pola layar yang mengutamakan pemindaian data.')
  } else {
    reasons.push('Belum ada sinyal konteks khusus; tentukan pola layar berdasarkan kebutuhan proyek.')
  }

  return RecommendResultSchema.parse({
    themeId: THEMES[0].id,
    templateId: null,
    reasons,
  })
}
