import { useMemo } from 'react'
import type { Candidate } from '../lib/supabase'

export type Filters = {
  search: string
  status: string
  position: string
  dateFrom: string
  dateTo: string
  sortBy: 'date' | 'name' | 'relevance'
}

export const DEFAULT_FILTERS: Filters = {
  search: '',
  status: 'All',
  position: '',
  dateFrom: '',
  dateTo: '',
  sortBy: 'date',
}

// Thuật toán tính điểm "gần đúng" với từ khóa
function calcRelevanceScore(candidate: Candidate, keyword: string): number {
  if (!keyword.trim()) return 0

  const kw = keyword.toLowerCase().trim()
  const name = candidate.full_name.toLowerCase()
  const pos = candidate.applied_position.toLowerCase()
  let score = 0

  // Khớp chính xác toàn bộ = điểm cao nhất
  if (name === kw || pos === kw) score += 100

  // Bắt đầu bằng keyword
  if (name.startsWith(kw) || pos.startsWith(kw)) score += 60

  // Chứa keyword nguyên vẹn
  if (name.includes(kw) || pos.includes(kw)) score += 30

  // Từng từ trong keyword khớp riêng lẻ
  const words = kw.split(/\s+/)
  words.forEach(word => {
    if (word.length < 2) return
    if (name.includes(word)) score += 10
    if (pos.includes(word)) score += 10
  })

  return score
}

export function useFilteredCandidates(candidates: Candidate[], filters: Filters) {
  return useMemo(() => {
    let result = [...candidates]

    // 1. Full-text search — tìm trên cả tên lẫn vị trí
    if (filters.search.trim()) {
      const kw = filters.search.toLowerCase().trim()
      result = result.filter(c =>
        c.full_name.toLowerCase().includes(kw) ||
        c.applied_position.toLowerCase().includes(kw)
      )
    }

    // 2. Lọc theo status
    if (filters.status && filters.status !== 'All') {
      result = result.filter(c => c.status === filters.status)
    }

    // 3. Lọc theo vị trí (riêng biệt với search)
    if (filters.position.trim()) {
      result = result.filter(c =>
        c.applied_position.toLowerCase()
          .includes(filters.position.toLowerCase().trim())
      )
    }

    // 4. Lọc theo range date
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom)
      from.setHours(0, 0, 0, 0)
      result = result.filter(c => new Date(c.created_at) >= from)
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo)
      to.setHours(23, 59, 59, 999)
      result = result.filter(c => new Date(c.created_at) <= to)
    }

    // 5. Sort thông minh
    if (filters.sortBy === 'relevance' && filters.search.trim()) {
      // Sắp xếp theo điểm relevance — cao nhất lên đầu
      result.sort((a, b) =>
        calcRelevanceScore(b, filters.search) -
        calcRelevanceScore(a, filters.search)
      )
    } else if (filters.sortBy === 'name') {
      result.sort((a, b) =>
        a.full_name.localeCompare(b.full_name, 'vi')
      )
    } else {
      // Mặc định: mới nhất lên đầu
      result.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    }

    return result
  }, [candidates, filters])
}