import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { SignUpForm } from './SignUpForm'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showSignUp, setShowSignUp] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  if (showSignUp) {
    return <SignUpForm onBackToLogin={() => setShowSignUp(false)} />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      console.log('LoginForm: signIn 호출 시작')
      await signIn(email, password)
      console.log('LoginForm: signIn 완료, 대시보드로 이동 중...')
      // 로그인 성공 시 대시보드로 리다이렉션
      navigate('/dashboard')
      console.log('LoginForm: navigate 호출 완료')
    } catch (err) {
      console.error('LoginForm: signIn 에러:', err)
      setError(err instanceof Error ? err.message : '로그인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            코딩학원 관리 시스템
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">선생님 계정으로 로그인</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                이메일
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input-field rounded-t-md"
                placeholder="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="input-field rounded-b-md"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <div className="text-red-500 text-sm text-center">{error}</div>}

          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex justify-center"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
            
            <button
              type="button"
              onClick={() => setShowSignUp(true)}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              새 계정 만들기
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
