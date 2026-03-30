import { useState } from 'react'
import { useRecommendations, type RecommendedCandidate } from '../hooks/useRecommendations'

// Màu medal cho top 3
const MEDAL: Record<number, { bg: string; text: string; label: string }> = {
  0: { bg: 'bg-yellow-100 border-yellow-300', text: 'text-yellow-700', label: '#1' },
  1: { bg: 'bg-gray-100 border-gray-300',     text: 'text-gray-600',   label: '#2' },
  2: { bg: 'bg-orange-50 border-orange-200',  text: 'text-orange-600', label: '#3' },
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-16 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }}/>
      </div>
      <span className="text-xs font-medium text-gray-700 w-8 text-right">{value}%</span>
    </div>
  )
}

function CandidateCard({
  item,
  rank,
  jobSkills,
}: {
  item: RecommendedCandidate
  rank: number
  jobSkills: string[]
}) {
  const medal = MEDAL[rank] ?? MEDAL[2]

  return (
    <div className={`rounded-xl border-2 p-4 ${medal.bg}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold ${medal.text}`}>{medal.label}</span>
            <h3 className="font-semibold text-gray-800 text-sm">{item.candidate.full_name}</h3>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{item.candidate.applied_position}</p>
        </div>
        {/* Final score lớn */}
        <div className="text-right shrink-0">
          <p className={`text-2xl font-bold ${
            item.scores.final >= 70 ? 'text-green-600' :
            item.scores.final >= 40 ? 'text-yellow-600' : 'text-red-500'
          }`}>
            {item.scores.final}%
          </p>
          <p className="text-xs text-gray-400">match</p>
        </div>
      </div>

      {/* Score bars */}
      <div className="space-y-1.5 mb-3">
        <ScoreBar label="Tổng hợp" value={item.scores.final}
          color={item.scores.final >= 70 ? 'bg-green-500' : item.scores.final >= 40 ? 'bg-yellow-500' : 'bg-red-400'}/>
        <ScoreBar label="Coverage" value={item.scores.coverage} color="bg-blue-400"/>
        <ScoreBar label="Jaccard"  value={item.scores.jaccard}  color="bg-purple-400"/>
      </div>

      {/* Skills breakdown */}
      <div className="space-y-1.5">
        {item.matchedSkills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.matchedSkills.map(s => (
              <span key={s} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                {s}
              </span>
            ))}
          </div>
        )}
        {item.missingSkills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.missingSkills.map(s => (
              <span key={s} className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full line-through">
                {s}
              </span>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-400">
          Khớp {item.matchedSkills.length}/{jobSkills.length} kỹ năng yêu cầu
          · Thiếu {item.missingSkills.length} kỹ năng
        </p>
      </div>
    </div>
  )
}

export default function RecommendPanel() {
  const [position, setPosition] = useState('')
  const [topN, setTopN]         = useState(3)
  const { result, loading, error, recommend, clear } = useRecommendations()

  const handleSearch = () => {
    if (position.trim()) recommend(position.trim(), topN)
  }

  return (
    <div className="bg-white rounded-2xl shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Gợi ý ứng viên tiềm năng</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Thuật toán Jaccard Similarity + Coverage Score
          </p>
        </div>
        {result && (
          <button onClick={clear}
            className="text-xs text-gray-400 hover:text-red-500 transition">
            Xóa kết quả
          </button>
        )}
      </div>

      {/* Search bar */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Nhập vị trí cần tìm... (vd: frontend developer)"
          value={position}
          onChange={e => setPosition(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={topN}
          onChange={e => setTopN(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {[3, 5, 10].map(n => (
            <option key={n} value={n}>Top {n}</option>
          ))}
        </select>
        <button
          onClick={handleSearch}
          disabled={loading || !position.trim()}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium
                     hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition
                     flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Đang tính...
            </>
          ) : 'Tìm'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600 mb-4">
          {error}
        </div>
      )}

      {/* Kết quả */}
      {result && (
        <div>
          {/* Meta info */}
          <div className="flex items-center gap-3 mb-4">
            <p className="text-sm text-gray-600">
              Vị trí: <span className="font-medium capitalize">{result.position}</span>
            </p>
            <span className="text-gray-300">·</span>
            <p className="text-sm text-gray-500">
              Đã đánh giá {result.totalCandidatesEvaluated} ứng viên
            </p>
          </div>

          {/* Job skills */}
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1.5">Kỹ năng yêu cầu:</p>
            <div className="flex flex-wrap gap-1">
              {result.jobSkills.map(s => (
                <span key={s} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Candidate cards */}
          {result.recommendations.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-6">
              Không tìm thấy ứng viên phù hợp cho vị trí này.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {result.recommendations.map((item, i) => (
                <CandidateCard
                  key={item.candidate.id}
                  item={item}
                  rank={i}
                  jobSkills={result.jobSkills}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}