import type { Candidate } from '../lib/supabase'

type Props = {
  candidates: Candidate[]
  loading: boolean
  onUpdateStatus: (id: string, status: Candidate['status']) => void
  onDelete: (id: string) => void
}

// Map status → màu badge
const STATUS_STYLE: Record<Candidate['status'], string> = {
  New:          'bg-blue-100 text-blue-800',
  Interviewing: 'bg-yellow-100 text-yellow-800',
  Hired:        'bg-green-100 text-green-800',
  Rejected:     'bg-red-100 text-red-800',
}

// Bước tiếp theo của status
const NEXT_STATUS: Partial<Record<Candidate['status'], Candidate['status']>> = {
  New:          'Interviewing',
  Interviewing: 'Hired',
}

export default function CandidateList({ candidates, loading, onUpdateStatus, onDelete }: Props) {
  if (loading) {
    return <p className="text-center text-gray-400 py-10">Đang tải danh sách...</p>
  }

  if (candidates.length === 0) {
    return <p className="text-center text-gray-400 py-10">Chưa có ứng viên nào.</p>
  }

  return (
    <div className="bg-white rounded-2xl shadow overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-3 font-medium text-gray-600">Họ tên</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Vị trí</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Trạng thái</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">CV</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Ngày nộp</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((c, i) => (
            <tr
              key={c.id}
              className={`border-b border-gray-100 hover:bg-gray-50 transition
                          ${i % 2 === 0 ? '' : 'bg-gray-50/40'}`}
            >
              <td className="px-4 py-3 font-medium text-gray-800">{c.full_name}</td>
              <td className="px-4 py-3 text-gray-600">{c.applied_position}</td>
              <td className="px-4 py-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLE[c.status]}`}>
                  {c.status}
                </span>
              </td>
              <td className="px-4 py-3">
                <a
                  href={c.resume_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline text-xs"
                >
                  Xem CV
                </a>
              </td>
              <td className="px-4 py-3 text-gray-500 text-xs">
                {new Date(c.created_at).toLocaleDateString('vi-VN')}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  {/* Nút chuyển status — chỉ hiện nếu còn bước tiếp theo */}
                  {NEXT_STATUS[c.status] && (
                    <button
                      onClick={() => onUpdateStatus(c.id, NEXT_STATUS[c.status]!)}
                      className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded
                                 hover:bg-green-100 transition"
                    >
                      → {NEXT_STATUS[c.status]}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm(`Xóa ứng viên "${c.full_name}"?`)) {
                        onDelete(c.id)
                      }
                    }}
                    className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded
                               hover:bg-red-100 transition"
                  >
                    Xóa
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}