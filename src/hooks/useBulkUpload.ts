import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export type UploadStatus = 'pending' | 'uploading' | 'done' | 'error'

export type CandidateEntry = {
  id: string
  fullName: string
  position: string
  status: 'New' | 'Interviewing' | 'Hired' | 'Rejected'
  file: File
  uploadStatus: UploadStatus
  error?: string
}

/**
 * Worker-pool concurrency limiter.
 * Spawns `concurrency` workers; each worker grabs the next task from the
 * shared index until all tasks finish — no UI thread blocking.
 */
async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number,
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = new Array(tasks.length)
  let cursor = 0

  async function worker() {
    while (cursor < tasks.length) {
      const i = cursor++
      try {
        results[i] = { status: 'fulfilled', value: await tasks[i]() }
      } catch (err) {
        results[i] = { status: 'rejected', reason: err }
      }
    }
  }

  // Spawn min(concurrency, tasks.length) parallel workers
  const workerCount = Math.min(concurrency, tasks.length)
  await Promise.all(Array.from({ length: workerCount }, worker))
  return results
}

export const MAX_CONCURRENCY = 5
export const DEFAULT_CONCURRENCY = 3

export function useBulkUpload() {
  const [entries, setEntries] = useState<CandidateEntry[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [concurrency, setConcurrency] = useState(DEFAULT_CONCURRENCY)

  /** Add one candidate to the queue */
  const addEntry = useCallback(
    (entry: Omit<CandidateEntry, 'id' | 'uploadStatus'>) => {
      setEntries(prev => [
        ...prev,
        { ...entry, id: `${Date.now()}-${Math.random()}`, uploadStatus: 'pending' },
      ])
    },
    [],
  )

  /** Remove a pending entry from the queue */
  const removeEntry = useCallback((id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id))
  }, [])

  /** Reset all done/error entries, keep pending ones */
  const clearFinished = useCallback(() => {
    setEntries(prev => prev.filter(e => e.uploadStatus === 'pending'))
  }, [])

  /** Update a single entry's upload status (patch) */
  const patchEntry = useCallback(
    (id: string, patch: Partial<CandidateEntry>) => {
      setEntries(prev => prev.map(e => (e.id === id ? { ...e, ...patch } : e)))
    },
    [],
  )

  /** Upload a single candidate entry to Supabase */
  const uploadOne = useCallback(
    async (entry: CandidateEntry): Promise<void> => {
      patchEntry(entry.id, { uploadStatus: 'uploading', error: undefined })

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Phiên đăng nhập hết hạn.')

      // Storage: {user_id}/{timestamp}-{originalName}
      const ext = entry.file.name.split('.').pop()
      const filePath = `${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, entry.file, { contentType: entry.file.type })

      if (uploadError) throw new Error(`Upload thất bại: ${uploadError.message}`)

      const { data: urlData } = supabase.storage
        .from('resumes')
        .getPublicUrl(filePath)

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/add-candidate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            full_name: entry.fullName.trim(),
            applied_position: entry.position.trim(),
            status: entry.status,
            resume_url: urlData.publicUrl,
          }),
        },
      )

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Có lỗi xảy ra.')

      patchEntry(entry.id, { uploadStatus: 'done' })
    },
    [patchEntry],
  )

  /**
   * Start uploading all pending entries using the concurrency worker-pool.
   * Already-done or errored entries are skipped.
   */
  const startUpload = useCallback(async () => {
    const pending = entries.filter(e => e.uploadStatus === 'pending')
    if (pending.length === 0) return

    setIsUploading(true)

    const tasks = pending.map(entry => async () => {
      try {
        await uploadOne(entry)
      } catch (err: unknown) {
        patchEntry(entry.id, {
          uploadStatus: 'error',
          error: err instanceof Error ? err.message : 'Lỗi không xác định',
        })
      }
    })

    await runWithConcurrency(tasks, concurrency)
    setIsUploading(false)
  }, [entries, concurrency, uploadOne, patchEntry])

  const pendingCount = entries.filter(e => e.uploadStatus === 'pending').length
  const uploadingCount = entries.filter(e => e.uploadStatus === 'uploading').length
  const doneCount = entries.filter(e => e.uploadStatus === 'done').length
  const errorCount = entries.filter(e => e.uploadStatus === 'error').length

  return {
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
  }
}
