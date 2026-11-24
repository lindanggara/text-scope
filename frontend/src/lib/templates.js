import Papa from 'papaparse'
import writeExcelFile from 'write-excel-file/browser'
import { TEMPLATE_COLUMNS, TEMPLATE_ROWS } from './sampleData.js'

function save(blob, name) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// Teks contoh yang ditampilkan di panel "Contoh isi file".
export const FORMAT_PREVIEW = {
  csv: Papa.unparse(TEMPLATE_ROWS, { columns: TEMPLATE_COLUMNS, quotes: [false, false, true, false] }),
  txt: TEMPLATE_ROWS.map((r) => r.komentar).join('\n'),
}

// Unduh template berisi contoh dalam format csv / xlsx / txt.
export async function downloadTemplate(format) {
  if (format === 'csv') {
    // BOM \uFEFF agar Excel membaca huruf dan emoji dengan benar
    const csv = Papa.unparse(TEMPLATE_ROWS, { columns: TEMPLATE_COLUMNS })
    save(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }), 'template_komentar_textscope.csv')
  } else if (format === 'txt') {
    save(new Blob([FORMAT_PREVIEW.txt], { type: 'text/plain;charset=utf-8' }), 'template_komentar_textscope.txt')
  } else {
    const sheet = [
      TEMPLATE_COLUMNS.map((c) => ({ value: c, fontWeight: 'bold' })),
      ...TEMPLATE_ROWS.map((r) => TEMPLATE_COLUMNS.map((c) => ({ value: r[c] }))),
    ]
    await writeExcelFile(sheet, { columns: [{ width: 16 }, { width: 18 }, { width: 60 }, { width: 8 }] }).toFile('template_komentar_textscope.xlsx')
  }
}

// Ubah data hasil baca (.txt) menjadi file CSV sebelum dikirim ke backend.
export function rowsToCsvFile(rows, name) {
  return new File([Papa.unparse(rows)], name.replace(/\.[^.]+$/, '') + '.csv', { type: 'text/csv' })
}
