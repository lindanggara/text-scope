import { useState } from 'react'
import { CheckCircle2, ChevronDown, Download, Loader2 } from 'lucide-react'
import { downloadTemplate, FORMAT_PREVIEW } from '../lib/templates.js'
import { TEMPLATE_COLUMNS, TEMPLATE_ROWS } from '../lib/sampleData.js'

const FORMATS = [
  { id: 'csv', label: 'CSV', note: 'Baris pertama berisi nama kolom. Teks yang mengandung koma diberi tanda kutip.' },
  { id: 'xlsx', label: 'Excel', note: 'Baris pertama berisi nama kolom. Data diletakkan di sheet pertama.' },
  { id: 'txt', label: 'TXT', note: 'Hanya berisi komentar, tanpa nama kolom. Setiap baris = satu komentar, baris kosong dilewati.' },
]

const COLUMNS = [
  { nama: 'Kolom komentar', contoh: 'komentar, text, comment, textDisplay', wajib: true, isi: 'Satu komentar per baris. Nama kolom bebas, nanti dipilih setelah upload.' },
  { nama: 'Kolom lain', contoh: 'username, waktu, likes, platform', wajib: false, isi: 'Biasanya ikut terbawa dari file ekspor. Boleh ada, tidak ikut dianalisis.' },
]

// Panduan format file, tampil di atas area upload sebelum pengguna mengunggah.
export function FormatGuide() {
  const [open, setOpen] = useState(true)
  const [format, setFormat] = useState('csv')
  const [busy, setBusy] = useState(false)
  const current = FORMATS.find((f) => f.id === format)

  async function handleDownload() {
    setBusy(true)
    try { await downloadTemplate(format) } finally { setBusy(false) }
  }

  return (
    <div className="rounded-[24px] bg-page">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="panduan-format"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-14 w-full cursor-pointer items-center justify-between gap-3 rounded-[24px] px-5 text-left"
      >
        <span>
          <span className="block font-black">Siapkan file seperti ini</span>
          <span className="block text-sm text-muted">Kolom yang dibutuhkan dan contoh file komentar hasil ekspor</span>
        </span>
        <ChevronDown size={20} aria-hidden="true" className={`shrink-0 text-primary transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div id="panduan-format" className="flex flex-col gap-4 px-5 pb-5">
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {COLUMNS.map((c) => (
              <li key={c.nama} className="flex flex-col gap-1.5 rounded-[18px] bg-white p-3.5">
                <span className="flex items-center gap-2">
                  <span className="font-black">{c.nama}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${c.wajib ? 'bg-lilac text-primary' : 'bg-page text-muted'}`}>
                    {c.wajib ? 'Wajib' : 'Opsional'}
                  </span>
                </span>
                <span className="text-sm text-muted">{c.isi}</span>
                <span className="text-[13px] text-muted">Contoh nama: <span className="font-bold text-ink">{c.contoh}</span></span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-3 rounded-[20px] bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-[13px] font-extrabold tracking-wide text-muted uppercase">Contoh isi file</span>
              <div role="tablist" aria-label="Format file" className="flex gap-1 rounded-full bg-page p-1">
                {FORMATS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    role="tab"
                    aria-selected={format === f.id}
                    onClick={() => setFormat(f.id)}
                    className={`min-h-9 cursor-pointer rounded-full px-4 text-sm font-extrabold transition ${format === f.id ? 'bg-primary text-white' : 'text-[#4A4360] hover:bg-white'}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {format === 'xlsx' ? (
              <div className="overflow-x-auto rounded-xl border border-line">
                <table className="w-full min-w-[560px] border-collapse text-sm">
                  <thead>
                    <tr className="text-left">
                      {TEMPLATE_COLUMNS.map((c) => (
                        <th key={c} className={`border-r border-line px-3 py-2 last:border-r-0 ${c === 'komentar' ? 'bg-lilac font-black text-primary' : 'bg-page font-extrabold text-muted'}`}>
                          {c}{c === 'komentar' && ' ← wajib'}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TEMPLATE_ROWS.map((r) => (
                      <tr key={r.username} className="border-t border-line">
                        {TEMPLATE_COLUMNS.map((c) => (
                          <td key={c} className={`border-r border-line px-3 py-2 last:border-r-0 ${c === 'komentar' ? '' : 'text-muted'}`}>{r[c]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <pre className="overflow-x-auto rounded-xl bg-[#2F2A3D] px-4 py-3 font-mono text-[13px] leading-relaxed whitespace-pre text-[#F4F0FF]">{FORMAT_PREVIEW[format]}</pre>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="flex min-w-0 flex-[1_1_240px] items-start gap-2 text-sm text-muted">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#2E8A62]" aria-hidden="true" />
                {current.note}
              </p>
              <button
                type="button"
                onClick={handleDownload}
                disabled={busy}
                className="flex min-h-10 cursor-pointer items-center gap-2 rounded-full bg-lilac px-4 text-sm font-extrabold text-primary disabled:opacity-60"
              >
                {busy ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Download size={16} aria-hidden="true" />}
                Unduh template .{format}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
