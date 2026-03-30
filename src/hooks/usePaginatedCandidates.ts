import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase, type Candidate } from '../lib/supabase'

const PAGE_SIZE = 5 // Số bản ghi mỗi lần load

type UsePaginatedReturn = {
  candidates: Candidate[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  loadMore: () => void
  updateStatus: (id: string, status: Candidate['status']) => Promise<void>
  deleteCandidate: (id: string) => Promise<void>
  total: number
}

export function usePaginatedCandidates(): UsePaginatedReturn {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)

  // cursor = created_at của bản ghi cuối cùng đã load
  // dùng useRef để tránh stale closure trong callback
  const cursorRef = useRef<string | null>(null)
  const candidateIdsRef = useRef<Set<string>>(new Set())

  // ── FETCH TRANG ĐẦU ──
  const fetchFirstPage = useCallback(async () => {
    setLoading(true)
    cursorRef.current = null
    candidateIdsRef.current = new Set()

    const { data, error, count } = await supabase
      .from('candidates')
      .select('*', { count: 'exact' })       // lấy tổng số bản ghi
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)

    if (!error && data) {
      setCandidates(data)
      candidateIdsRef.current = new Set(data.map(c => c.id))

      // Cursor = created_at của bản ghi cuối cùng
      if (data.length > 0) {
        cursorRef.current = data[data.length - 1].created_at
      }
      setHasMore(data.length === PAGE_SIZE)
      if (count !== null) setTotal(count)
    }
    setLoading(false)
  }, [])

  // ── LOAD THÊM (Load More) ──
  const loadMore = useCallback(async () => {
    // Không load nếu đang load hoặc hết data
    if (loadingMore || !hasMore || !cursorRef.current) return

    setLoadingMore(true)

    // KEY: dùng .lt('created_at', cursor) thay vì OFFSET
    // Chỉ lấy các bản ghi CŨ HƠN cursor hiện tại
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .order('created_at', { ascending: false })
      .lt('created_at', cursorRef.current)   // < cursor = cũ hơn
      .limit(PAGE_SIZE)

    if (!error && data) {
      // Lọc duplicate bằng Set ID — đảm bảo không bao giờ trùng
      const newItems = data.filter(c => !candidateIdsRef.current.has(c.id))

      if (newItems.length > 0) {
        setCandidates(prev => [...prev, ...newItems])
        newItems.forEach(c => candidateIdsRef.current.add(c.id))
        cursorRef.current = newItems[newItems.length - 1].created_at
      }

      // Hết data khi trả về ít hơn PAGE_SIZE
      setHasMore(data.length === PAGE_SIZE)
    }

    setLoadingMore(false)
  }, [loadingMore, hasMore])

  // ── REALTIME ──
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchFirstPage()

    const channel = supabase
      .channel('paginated-candidates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'candidates' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newCandidate = payload.new as Candidate

            // Tránh duplicate nếu bản ghi đã có trong list
            if (candidateIdsRef.current.has(newCandidate.id)) return

            // Thêm lên đầu danh sách — bản ghi mới nhất
            setCandidates(prev => [newCandidate, ...prev])
            candidateIdsRef.current.add(newCandidate.id)
            setTotal(prev => prev + 1)
          }

          if (payload.eventType === 'UPDATE') {
            setCandidates(prev =>
              prev.map(c =>
                c.id === (payload.new as Candidate).id
                  ? payload.new as Candidate
                  : c
              )
            )
          }

          if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as Candidate).id
            setCandidates(prev => prev.filter(c => c.id !== deletedId))
            candidateIdsRef.current.delete(deletedId)
            setTotal(prev => Math.max(0, prev - 1))
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime status:', status)
      })

    return () => { supabase.removeChannel(channel) }
  }, [fetchFirstPage])

  // ── ACTIONS ──
  const updateStatus = async (id: string, newStatus: Candidate['status']) => {
    const { error } = await supabase
      .from('candidates')
      .update({ status: newStatus })
      .eq('id', id)
    if (error) console.error('Update error:', error.message)
  }

  const deleteCandidate = async (id: string) => {
    const { error } = await supabase
      .from('candidates')
      .delete()
      .eq('id', id)
    if (error) console.error('Delete error:', error.message)
  }

  return {
    candidates,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    updateStatus,
    deleteCandidate,
    total,
  }
}