import { useState } from 'react'
import { Link } from 'react-router-dom'
import SocialInsights from '../components/SocialInsights.jsx'
import { PageHeader } from '../components/ui.jsx'
import { useAnalysis } from '../context/AnalysisContext.jsx'

// Halaman "Tren & Sosial": tren waktu, komentar paling disukai, emoji & hashtag.
export default function Sosial() {
  const { result } = useAnalysis()
  const { summary, distribution, results, meta } = result
  const [activeEmotion, setActiveEmotion] = useState(summary.dominant_emotion ?? distribution[0].emotion)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tren & Sosial"
        subtitle={`${meta?.fileName ?? 'File'} · kapan emosi muncul, komentar paling disukai, serta emoji dan hashtag`}
        actions={<Link to="/hasil" className="flex min-h-12 items-center rounded-full bg-white px-5 font-extrabold text-primary no-underline shadow-soft">Kembali ke Hasil</Link>}
      />
      <SocialInsights results={results} meta={meta} activeEmotion={activeEmotion} onSelectEmotion={setActiveEmotion} />
    </div>
  )
}
