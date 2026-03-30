import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AddCandidateForm() {
  const [fullName, setFullName] = useState('')
  const [position, setPosition] = useState('')
  const [status, setStatus] = useState<'New' | 'Interviewing' | 'Hired' | 'Rejected'>('New')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    // Validate
    if (!fullName.trim() || !position.trim() || !file) {
      setError('Vui lòng điền đầy đủ thông tin và chọn file CV.')
      return
    }
    setError('')
    setUploading(true)

    try {
      // BƯỚC 1: Lấy session để có access_token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.')

      // BƯỚC 2: Upload file CV lên Supabase Storage
      // Cấu trúc path: {user_id}/{timestamp}.{ext} — đảm bảo không trùng tên
      const ext = file.name.split('.').pop()
      const filePath = `${session.user.id}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file, { contentType: file.type })

      if (uploadError) throw new Error(`Upload thất bại: ${uploadError.message}`)

      // BƯỚC 3: Lấy public URL của file vừa upload
      const { data: urlData } = supabase.storage
        .from('resumes')
        .getPublicUrl(filePath)

      const resumeUrl = urlData.publicUrl

      // BƯỚC 4: Gọi Edge Function để tạo candidate trong database
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/add-candidate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            full_name: fullName.trim(),
            applied_position: position.trim(),
            status,
            resume_url: resumeUrl,
          }),
        }
      )

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Có lỗi xảy ra.')

      // BƯỚC 5: Reset form — Realtime tự cập nhật danh sách
      setFullName('')
      setPosition('')
      setStatus('New')
      setFile(null)
      // Reset input file (cần dùng ref hoặc key trick)
      const fileInput = document.getElementById('cv-input') as HTMLInputElement
      if (fileInput) fileInput.value = ''

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Thêm ứng viên mới</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <input
          type="text"
          placeholder="Họ và tên *"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="Vị trí ứng tuyển *"
          value={position}
          onChange={e => setPosition(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={status}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onChange={e => setStatus(e.target.value as any)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="New">New</option>
          <option value="Interviewing">Interviewing</option>
          <option value="Hired">Hired</option>
          <option value="Rejected">Rejected</option>
        </select>
        <input
          id="cv-input"
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={e => setFile(e.target.files?.[0] || null)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm
                     file:mr-3 file:py-1 file:px-3 file:rounded file:border-0
                     file:text-sm file:bg-blue-50 file:text-blue-700 cursor-pointer"
        />
      </div>

      {error && (
        <p className="text-red-500 text-sm mb-3">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={uploading}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium
                   hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {uploading ? 'Đang xử lý...' : 'Thêm ứng viên'}
      </button>
    </div>
  )
}