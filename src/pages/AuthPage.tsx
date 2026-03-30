import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async () => {
    setLoading(true)
    setMessage('')

    if (isLogin) {
      // ĐĂNG NHẬP
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage(error.message)
      // Nếu thành công → App.tsx sẽ tự detect session thay đổi và chuyển sang Dashboard
    } else {
      // ĐĂNG KÝ
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setMessage(error.message)
      else setMessage('Đăng ký thành công! Kiểm tra email để xác nhận.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          {isLogin ? 'Đăng nhập' : 'Đăng ký'}
        </h1>

        <div className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {message && (
          <p className={`mt-3 text-sm text-center ${
            message.includes('thành công') ? 'text-green-600' : 'text-red-500'
          }`}>
            {message}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !email || !password}
          className="mt-5 w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium
                     hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Đang xử lý...' : (isLogin ? 'Đăng nhập' : 'Đăng ký')}
        </button>

        <p
          className="mt-4 text-center text-sm text-gray-500 cursor-pointer hover:text-blue-600"
          onClick={() => { setIsLogin(!isLogin); setMessage('') }}
        >
          {isLogin ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
        </p>
      </div>
    </div>
  )
}