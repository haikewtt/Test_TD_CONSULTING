import { supabase } from '../lib/supabase'
import { useCandidates } from '../hooks/useCandidates'
import AddCandidateForm from '../components/AddCandidateForm'
import CandidateList from '../components/CandidateList'

export default function Dashboard() {
  const { candidates, loading, updateStatus, deleteCandidate } = useCandidates()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    // App.tsx tự detect session = null và chuyển về AuthPage
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">
            Candidate Management
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {candidates.length} ứng viên
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-500 hover:text-red-700 transition"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Form thêm ứng viên */}
        <AddCandidateForm />

        {/* Danh sách ứng viên — cập nhật realtime */}
        <CandidateList
          candidates={candidates}
          loading={loading}
          onUpdateStatus={updateStatus}
          onDelete={deleteCandidate}
        />
      </main>
    </div>
  )
}