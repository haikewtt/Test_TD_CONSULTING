import type { Filters } from '../hooks/useFilteredCandidates'

type Props = {
  filters: Filters
  onChange: (filters: Filters) => void
  onReset: () => void
  totalCount: number
  filteredCount: number
}

export default function FilterBar({ filters, onChange, onReset, totalCount, filteredCount }: Props) {
  const set = (key: keyof Filters, value: string) =>
    onChange({ ...filters, [key]: value })

  return (
    <div className="bg-white rounded-2xl shadow p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">
          Tìm kiếm & Lọc
          <span className="ml-2 text-xs font-normal text-gray-400">
            {filteredCount}/{totalCount} ứng viên
          </span>
        </h3>
        <button
          onClick={onReset}
          className="text-xs text-gray-400 hover:text-red-500 transition"
        >
          Xóa bộ lọc
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Full-text search */}
        <input
          type="text"
          placeholder="Tìm theo tên hoặc vị trí..."
          value={filters.search}
          onChange={e => set('search', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm col-span-1 sm:col-span-2 lg:col-span-1
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Filter theo status */}
        <select
          value={filters.status}
          onChange={e => set('status', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="All">Tất cả trạng thái</option>
          <option value="New">New</option>
          <option value="Interviewing">Interviewing</option>
          <option value="Hired">Hired</option>
          <option value="Rejected">Rejected</option>
        </select>

        {/* Filter theo vị trí */}
        <input
          type="text"
          placeholder="Lọc theo vị trí..."
          value={filters.position}
          onChange={e => set('position', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Date range */}
        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={filters.dateFrom}
            onChange={e => set('dateFrom', e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-400 text-xs">→</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={e => set('dateTo', e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Sort */}
        <select
          value={filters.sortBy}
          onChange={e => set('sortBy', e.target.value as Filters['sortBy'])}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="date">Sắp xếp: Mới nhất</option>
          <option value="name">Sắp xếp: Tên A-Z</option>
          <option value="relevance">Sắp xếp: Độ liên quan</option>
        </select>
      </div>
    </div>
  )
}