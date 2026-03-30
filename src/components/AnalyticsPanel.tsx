import { useAnalytics } from '../hooks/useAnalytics'

const STATUS_COLOR: Record<string, string> = {
  New:          'bg-blue-500',
  Interviewing: 'bg-yellow-500',
  Hired:        'bg-green-500',
  Rejected:     'bg-red-500',
}

export default function AnalyticsPanel() {
  const { analytics, loading, error, refetch } = useAnalytics()

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow p-6 mb-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-32 mb-4"/>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl"/>
          ))}
        </div>
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="bg-white rounded-2xl shadow p-4 mb-6 text-sm text-red-500">
        Không thể tải thống kê. <button onClick={refetch} className="underline">Thử lại</button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-800">Thống kê tổng quan</h2>
        <button
          onClick={refetch}
          className="text-xs text-gray-400 hover:text-blue-500 transition"
        >
          Làm mới
        </button>
      </div>

      {/* Tổng số + Status stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Tổng */}
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-2xl font-bold text-gray-800">{analytics.total}</p>
          <p className="text-xs text-gray-500 mt-1">Tổng ứng viên</p>
        </div>

        {/* Từng status */}
        {analytics.statusStats.map(s => (
          <div key={s.status} className="bg-gray-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-gray-800">{s.count}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${STATUS_COLOR[s.status] ?? 'bg-gray-400'}`}/>
              <p className="text-xs text-gray-500">{s.status} ({s.ratio}%)</p>
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar tỷ lệ status */}
      <div className="mb-6">
        <p className="text-xs text-gray-500 mb-2">Phân bổ trạng thái</p>
        <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
          {analytics.statusStats.map(s => (
            s.ratio > 0 && (
              <div
                key={s.status}
                className={`${STATUS_COLOR[s.status] ?? 'bg-gray-400'} transition-all`}
                style={{ width: `${s.ratio}%` }}
                title={`${s.status}: ${s.ratio}%`}
              />
            )
          ))}
        </div>
        <div className="flex gap-4 mt-2">
          {analytics.statusStats.map(s => (
            <div key={s.status} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${STATUS_COLOR[s.status] ?? 'bg-gray-400'}`}/>
              <span className="text-xs text-gray-500">{s.status} {s.ratio}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 3 vị trí */}
        <div>
          <p className="text-xs font-medium text-gray-600 mb-3">Top 3 vị trí ứng tuyển</p>
          <div className="space-y-2">
            {analytics.top3Positions.map((p, i) => (
              <div key={p.position} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-400 w-4">#{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-700 capitalize">{p.position}</span>
                    <span className="text-xs text-gray-500">{p.count} người</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-400 rounded-full"
                      style={{
                        width: `${Math.round((p.count / analytics.total) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ứng viên 7 ngày gần nhất */}
        <div>
          <p className="text-xs font-medium text-gray-600 mb-3">
            Mới trong 7 ngày
            <span className="ml-2 bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-xs">
              {analytics.recentCount}
            </span>
          </p>
          <div className="space-y-2 max-h-36 overflow-y-auto">
            {analytics.recentCandidates.length === 0 ? (
              <p className="text-xs text-gray-400">Không có ứng viên mới</p>
            ) : (
              analytics.recentCandidates.map(c => (
                <div key={c.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-700">{c.full_name}</p>
                    <p className="text-xs text-gray-400">{c.applied_position}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(c.created_at).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}