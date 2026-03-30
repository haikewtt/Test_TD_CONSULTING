import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export type StatusStat = {
  status: string
  count: number
  ratio: number
}

export type TopPosition = {
  position: string
  count: number
}

export type RecentCandidate = {
  id: string
  full_name: string
  applied_position: string
  status: string
  created_at: string
}

export type Analytics = {
  total: number
  statusStats: StatusStat[]
  top3Positions: TopPosition[]
  recentCount: number
  recentCandidates: RecentCandidate[]
}

export function useAnalytics() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Chưa đăng nhập')

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analytics`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      )

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAnalytics(data)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  return { analytics, loading, error, refetch: fetchAnalytics }
}