import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import type { Session } from '@supabase/supabase-js'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Lần đầu load → lấy session hiện tại (nếu user đã login trước đó)
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    // Lắng nghe thay đổi auth realtime:
    // - Khi login xong → session có giá trị → render Dashboard
    // - Khi logout → session = null → render AuthPage
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Đang tải...</p>
      </div>
    )
  }

  // Chưa đăng nhập → AuthPage, đã đăng nhập → Dashboard
  return session ? <Dashboard /> : <AuthPage />
}