import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useCandidates } from '../hooks/useCandidates'
import { useFilteredCandidates, DEFAULT_FILTERS, type Filters } from '../hooks/useFilteredCandidates'
import AddCandidateForm from '../components/AddCandidateForm'
import CandidateList from '../components/CandidateList'
import FilterBar from '../components/FilterBar'
import AnalyticsPanel from '../components/AnalyticsPanel'

export default function Dashboard() {
  const { candidates, loading, updateStatus, deleteCandidate } = useCandidates()
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)

  // Áp dụng filter/search/sort lên danh sách realtime
  const filteredCandidates = useFilteredCandidates(candidates, filters)

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">Candidate Management</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{candidates.length} ứng viên</span>
            <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700 transition">
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <AnalyticsPanel />
        <AddCandidateForm />

        {/* FilterBar nằm giữa form và danh sách */}
        <FilterBar
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(DEFAULT_FILTERS)}
          totalCount={candidates.length}
          filteredCount={filteredCandidates.length}
        />

        <CandidateList
          candidates={filteredCandidates}
          loading={loading}
          onUpdateStatus={updateStatus}
          onDelete={deleteCandidate}
        />
      </main>
    </div>
  )
}