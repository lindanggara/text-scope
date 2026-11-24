// Semua akses ke database Supabase dikumpulkan di sini.
// Hak akses (siapa boleh lihat/ubah apa) dijaga oleh aturan RLS di supabase/schema.sql,
// jadi fungsi-fungsi ini aman walau dipanggil dari browser.
import { supabase } from './supabase.js'

function check({ data, error }) {
  if (error) throw error
  return data
}

// ---------- Riwayat analisis (pengguna) ----------

export async function saveAnalysis(result) {
  const { summary, distribution, meta } = result
  return check(
    await supabase
      .from('analyses')
      .insert({
        file_name: meta?.fileName ?? '',
        total_texts: summary.total_texts,
        dominant_emotion: summary.dominant_emotion,
        avg_confidence: summary.avg_confidence,
        censored_count: summary.censored_count ?? 0,
        privacy_shield: meta?.privacyShield ?? true,
        distribution: distribution.map(({ emotion, count, percentage }) => ({ emotion, count, percentage })),
        result,
      })
      .select('id')
      .single(),
  ).id
}

export async function listAnalyses({ limit = 50 } = {}) {
  return check(
    await supabase
      .from('analyses')
      .select('id, file_name, total_texts, dominant_emotion, avg_confidence, censored_count, privacy_shield, distribution, created_at')
      .order('created_at', { ascending: false })
      .limit(limit),
  )
}

export async function getAnalysis(id) {
  return check(await supabase.from('analyses').select('id, result').eq('id', id).single())
}

export async function deleteAnalysis(id) {
  check(await supabase.from('analyses').delete().eq('id', id))
}

// ---------- Laporan prediksi salah ----------

export async function sendReport({ text, predicted, correct, confidence, source, analysisId, note }) {
  check(
    await supabase.from('reports').insert({
      text: text.slice(0, 2000),
      predicted_emotion: predicted,
      correct_emotion: correct,
      confidence,
      source,
      analysis_id: analysisId ?? null,
      note: (note ?? '').slice(0, 300),
    }),
  )
}

export async function listMyReports(userId) {
  return check(
    await supabase
      .from('reports')
      .select('id, text, predicted_emotion, correct_emotion, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50),
  )
}

// ---------- Khusus admin ----------

export async function adminStats(days = 14) {
  return check(await supabase.rpc('admin_stats', { days }))
}

export async function adminListUsers() {
  return check(await supabase.rpc('admin_list_users'))
}

export async function adminUpdateUser(id, changes) {
  check(await supabase.from('profiles').update(changes).eq('id', id))
}

export async function adminListReports(status) {
  let q = supabase
    .from('reports')
    .select('id, text, predicted_emotion, correct_emotion, confidence, source, note, status, created_at, reviewed_at, user_id, profiles!reports_user_id_fkey(email, full_name)')
    .order('created_at', { ascending: false })
    .limit(500)
  if (status && status !== 'semua') q = q.eq('status', status)
  return check(await q)
}

export async function adminSetReportStatus(id, status) {
  check(await supabase.from('reports').update({ status }).eq('id', id))
}
