type Props = {
    hasMore: boolean
    loading: boolean
    onLoadMore: () => void
    total: number
    loaded: number
  }
  
  export default function LoadMoreButton({ hasMore, loading, onLoadMore, total, loaded }: Props) {
    if (!hasMore && loaded > 0) {
      return (
        <p className="text-center text-sm text-gray-400 py-6">
          Đã hiển thị tất cả {total} ứng viên
        </p>
      )
    }
  
    return (
      <div className="flex flex-col items-center py-6 gap-2">
        {/* Progress indicator */}
        <p className="text-xs text-gray-400">
          Đang hiển thị {loaded} / {total} ứng viên
        </p>
  
        {/* Progress bar */}
        <div className="w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-400 rounded-full transition-all duration-300"
            style={{ width: total > 0 ? `${Math.round((loaded / total) * 100)}%` : '0%' }}
          />
        </div>
  
        {hasMore && (
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="mt-2 px-6 py-2 bg-white border border-gray-300 rounded-lg text-sm
                       text-gray-600 hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600
                       disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                Đang tải...
              </span>
            ) : (
              'Tải thêm'
            )}
          </button>
        )}
      </div>
    )
  }