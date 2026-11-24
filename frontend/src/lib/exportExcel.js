import writeExcelFile from 'write-excel-file/browser'
import { emotionInfo, LOW_CONFIDENCE } from './emotions.js'
import { formatTime } from './social.js'

const HEADER = { fontWeight: 'bold', backgroundColor: '#ECE6FB' }

export async function exportResults(result) {
  const hasTime = Boolean(result.meta?.timeColumn)
  const hasLikes = Boolean(result.meta?.likesColumn)

  const header = [
    { value: 'No', ...HEADER },
    { value: 'Komentar', ...HEADER },
    { value: 'Emosi', ...HEADER },
    { value: 'Label', ...HEADER },
    { value: 'Keyakinan (%)', ...HEADER },
    { value: 'Perlu dicek', ...HEADER },
  ]
  const widths = [{ width: 6 }, { width: 70 }, { width: 12 }, { width: 10 }, { width: 14 }, { width: 12 }]
  if (hasTime) { header.push({ value: 'Waktu', ...HEADER }); widths.push({ width: 22 }) }
  if (hasLikes) { header.push({ value: 'Likes', ...HEADER }); widths.push({ width: 10 }) }

  const sheet = [
    header,
    ...result.results.map((r, i) => {
      const row = [
        { value: i + 1 },
        { value: r.text },
        { value: emotionInfo(r.emotion).nama },
        { value: r.emotion },
        { value: Math.round(r.confidence * 100) },
        { value: r.confidence < LOW_CONFIDENCE ? 'Ya' : '' },
      ]
      if (hasTime) row.push({ value: r.time ? formatTime(r.time) : '' })
      if (hasLikes) row.push({ value: r.likes ?? null })
      return row
    }),
  ]
  const base = (result.meta?.fileName ?? 'data').replace(/\.[^.]+$/, '')
  await writeExcelFile(sheet, { columns: widths }).toFile(`hasil_textscope_${base}.xlsx`)
}
