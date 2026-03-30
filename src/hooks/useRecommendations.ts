import { useState } from 'react'
import { supabase } from '../lib/supabase'

export type RecommendedCandidate = {
  candidate: {
    id: string
    full_name: string
    applied_position: string
    status: string
    skills: string[]
    created_at: string
  }
  scores: {
    final: number      // điểm tổng hợp
    jaccard: number    // độ tương đồng tập hợp
    coverage: number   // tỷ lệ cover kỹ năng job
  }
  matchedSkills: string[]
  missingSkills: string[]
}

export type RecommendResult = {
  position: string
  jobSkills: string[]
  totalCandidatesEvaluated: number
  recommendations: RecommendedCandidate[]
}

export function useRecommendations() {
  const [result, setResult] = useState<RecommendResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const recommend = async (position: string, topN = 3) => {
    if (!position.trim()) return
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Chưa đăng nhập')

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/recommend`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ position, top_n: topN }),
        }
      )

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const clear = () => { setResult(null); setError('') }

  return { result, loading, error, recommend, clear }
}