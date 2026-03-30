import { useEffect, useState } from 'react'
import { supabase, type Candidate } from '../lib/supabase'

export function useCandidates() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // --- FETCH lần đầu ---
    const fetchAll = async () => {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) setCandidates(data)
      setLoading(false)
    }
    fetchAll()

    // --- SUBSCRIBE Realtime ---
    // Mỗi khi bất kỳ client nào (kể cả mình) thay đổi bảng candidates,
    // callback này chạy ngay lập tức — không cần reload trang
    const channel = supabase
      .channel('realtime-candidates')        // tên channel tùy đặt
      .on(
        'postgres_changes',
        {
          event: '*',           // lắng nghe INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'candidates',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // Thêm bản ghi mới lên đầu danh sách
            setCandidates(prev => [payload.new as Candidate, ...prev])
          }

          if (payload.eventType === 'UPDATE') {
            // Cập nhật đúng bản ghi được sửa
            setCandidates(prev =>
              prev.map(c =>
                c.id === (payload.new as Candidate).id
                  ? payload.new as Candidate
                  : c
              )
            )
          }

          if (payload.eventType === 'DELETE') {
            // Xóa bản ghi khỏi list
            setCandidates(prev =>
              prev.filter(c => c.id !== (payload.old as Candidate).id)
            )
          }
        }
      )
      .subscribe()

    // Cleanup: hủy channel khi component unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // --- CÁC ACTION ---

  // Cập nhật status — Realtime sẽ tự cập nhật UI, không cần setCandidates thủ công
  const updateStatus = async (id: string, newStatus: Candidate['status']) => {
    const { error } = await supabase
      .from('candidates')
      .update({ status: newStatus })
      .eq('id', id)

    if (error) console.error('Update error:', error.message)
  }

  // Xóa ứng viên — Realtime tự xử lý UI
  const deleteCandidate = async (id: string) => {
    const { error } = await supabase
      .from('candidates')
      .delete()
      .eq('id', id)

    if (error) console.error('Delete error:', error.message)
  }

  return { candidates, loading, updateStatus, deleteCandidate }
}