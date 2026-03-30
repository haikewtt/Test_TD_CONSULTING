import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { usePaginatedCandidates } from '../hooks/usePaginatedCandidates'
import { useFilteredCandidates, DEFAULT_FILTERS, type Filters } from '../hooks/useFilteredCandidates'
import AddCandidateForm from '../components/AddCandidateForm'
import CandidateList from '../components/CandidateList'
import FilterBar from '../components/FilterBar'
import LoadMoreButton from '../components/LoadMoreButton'
import AnalyticsPanel from '../components/AnalyticsPanel'
import RecommendPanel from '../components/RecommendPanel'

export default function Dashboard() {
  const {
    candidates,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    updateStatus,
    deleteCandidate,
    total,
  } = usePaginatedCandidates()

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
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
            <span className="text-sm text-gray-500">{total} ứng viên</span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-500 hover:text-red-700 transition"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <AnalyticsPanel />
        <RecommendPanel />
        <AddCandidateForm />
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

        
        {!filters.search && filters.status === 'All' && !filters.position && (
          <LoadMoreButton
            hasMore={hasMore}
            loading={loadingMore}
            onLoadMore={loadMore}
            total={total}
            loaded={candidates.length}
          />
        )}
      </main>
    </div>
  )
}