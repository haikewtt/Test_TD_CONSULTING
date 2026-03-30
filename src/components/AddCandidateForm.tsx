import { useRef, useState } from 'react'
import {
  useBulkUpload,
  MAX_CONCURRENCY,
  type CandidateEntry,
  type UploadStatus,
} from '../hooks/useBulkUpload'

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_STYLE: Record<UploadStatus, string> = {
  pending:   'bg-gray-100 text-gray-500',
  uploading: 'bg-blue-100 text-blue-700 animate-pulse',
  done:      'bg-green-100 text-green-700',
  error:     'bg-red-100 text-red-600',
}
const STATUS_LABEL: Record<UploadStatus, string> = {
  pending:   'Chờ',
  uploading: 'Đang upload…',
  done:      'Hoàn thành',
  error:     'Lỗi',
}

function StatusBadge({ status }: { status: UploadStatus }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  )
}

// ── Upload queue row ──────────────────────────────────────────────────────────
function QueueRow({
  entry,
  onRemove,
}: {
  entry: CandidateEntry
  onRemove: (id: string) => void
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-all
        ${entry.uploadStatus === 'done'    ? 'bg-green-50 border-green-200' :
          entry.uploadStatus === 'error'   ? 'bg-red-50 border-red-200' :
          entry.uploadStatus === 'uploading' ? 'bg-blue-50 border-blue-200' :
          'bg-white border-gray-200'}`}
    >
      {/* Uploading spinner */}
      {entry.uploadStatus === 'uploading' && (
        <svg className="animate-spin shrink-0 h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {entry.uploadStatus === 'done' && (
        <svg className="shrink-0 h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
      {entry.uploadStatus === 'error' && (
        <svg className="shrink-0 h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      {entry.uploadStatus === 'pending' && (
        <svg className="shrink-0 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )}

      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 truncate">{entry.fullName}</p>
        <p className="text-gray-500 text-xs truncate">
          {entry.position} · {entry.file.name}
          {' · '}{(entry.file.size / 1024).toFixed(0)} KB
        </p>
        {entry.error && (
          <p className="text-red-500 text-xs mt-0.5 truncate">{entry.error}</p>
        )}
      </div>

      <StatusBadge status={entry.uploadStatus} />

      {entry.uploadStatus === 'pending' && (
        <button
          onClick={() => onRemove(entry.id)}
          title="Xoá khỏi hàng chờ"
          className="shrink-0 text-gray-400 hover:text-red-500 transition"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

// ── Concurrency progress bar ──────────────────────────────────────────────────
function ProgressBar({
  total,
  done,
  error,
  uploading,
}: {
  total: number
  done: number
  error: number
  uploading: number
}) {
  if (total === 0) return null
  const donePct     = (done / total) * 100
  const errorPct    = (error / total) * 100
  const uploadPct   = (uploading / total) * 100

  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{done + error}/{total} xử lý xong · {uploading} đang upload</span>
        <span>{Math.round(donePct + errorPct)}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
        <div className="bg-green-500 transition-all duration-300" style={{ width: `${donePct}%` }} />
        <div className="bg-blue-400 animate-pulse transition-all duration-300" style={{ width: `${uploadPct}%` }} />
        <div className="bg-red-400 transition-all duration-300" style={{ width: `${errorPct}%` }} />
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AddCandidateForm() {
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Local state for the "add to queue" mini-form
  const [fullName, setFullName] = useState('')
  const [position, setPosition] = useState('')
  const [entryStatus, setEntryStatus] = useState<CandidateEntry['status']>('New')
  const [file, setFile] = useState<File | null>(null)
  const [formError, setFormError] = useState('')

  const {
    entries,
    isUploading,
    concurrency,
    setConcurrency,
    addEntry,
    removeEntry,
    clearFinished,
    startUpload,
    pendingCount,
    uploadingCount,
    doneCount,
    errorCount,
  } = useBulkUpload()

  const handleAddToQueue = () => {
    if (!fullName.trim() || !position.trim() || !file) {
      setFormError('Vui lòng điền đầy đủ thông tin và chọn file CV.')
      return
    }
    setFormError('')
    addEntry({ fullName, position, status: entryStatus, file })
    // Reset mini-form
    setFullName('')
    setPosition('')
    setEntryStatus('New')
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const totalCount = entries.length

  return (
    <div className="bg-white rounded-2xl shadow p-6 mb-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Thêm ứng viên mới</h2>

        {/* Concurrency slider */}
        <label className="flex items-center gap-2 text-sm text-gray-600 select-none">
          <span className="hidden sm:inline">Upload song song:</span>
          <input
            type="range"
            min={1}
            max={MAX_CONCURRENCY}
            value={concurrency}
            onChange={e => setConcurrency(Number(e.target.value))}
            disabled={isUploading}
            className="w-24 accent-blue-600"
          />
          <span className="w-5 text-center font-semibold text-blue-600">{concurrency}</span>
          <span className="text-gray-400 text-xs">/ {MAX_CONCURRENCY}</span>
        </label>
      </div>

      {/* ── Input row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Họ và tên *"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddToQueue()}
          disabled={isUploading}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <input
          type="text"
          placeholder="Vị trí ứng tuyển *"
          value={position}
          onChange={e => setPosition(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddToQueue()}
          disabled={isUploading}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <select
          value={entryStatus}
          onChange={e => setEntryStatus(e.target.value as CandidateEntry['status'])}
          disabled={isUploading}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <option value="New">New</option>
          <option value="Interviewing">Interviewing</option>
          <option value="Hired">Hired</option>
          <option value="Rejected">Rejected</option>
        </select>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={e => setFile(e.target.files?.[0] || null)}
          disabled={isUploading}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm
                     file:mr-3 file:py-1 file:px-3 file:rounded file:border-0
                     file:text-sm file:bg-blue-50 file:text-blue-700
                     cursor-pointer disabled:opacity-50"
        />
      </div>

      {formError && <p className="text-red-500 text-sm">{formError}</p>}

      <button
        onClick={handleAddToQueue}
        disabled={isUploading}
        className="w-full sm:w-auto border-2 border-dashed border-blue-400 text-blue-600
                   px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-50
                   disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        + Thêm vào hàng chờ
      </button>

      {/* ── Upload queue ── */}
      {entries.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span className="font-medium">
              Hàng chờ upload
              <span className="ml-1 text-xs text-gray-400">
                ({pendingCount} chờ · {uploadingCount} đang xử lý · {doneCount} xong · {errorCount} lỗi)
              </span>
            </span>
            {(doneCount > 0 || errorCount > 0) && !isUploading && (
              <button
                onClick={clearFinished}
                className="text-xs text-gray-400 hover:text-gray-600 transition"
              >
                Xoá đã xong
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {entries.map(entry => (
              <QueueRow key={entry.id} entry={entry} onRemove={removeEntry} />
            ))}
          </div>

          <ProgressBar
            total={totalCount}
            done={doneCount}
            error={errorCount}
            uploading={uploadingCount}
          />
        </div>
      )}

      {/* ── Action row ── */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={startUpload}
            disabled={isUploading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium
                       hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition
                       flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Đang upload ({uploadingCount} song song)…
              </>
            ) : (
              `Upload ${pendingCount} ứng viên (song song ${concurrency})`
            )}
          </button>
        </div>
      )}
    </div>
  )
}
