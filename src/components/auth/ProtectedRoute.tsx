import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, teacher, loading } = useAuth()
  const navigate = useNavigate()
  
  console.log('ProtectedRoute 상태:', { loading, user: !!user, teacher: !!teacher })

  useEffect(() => {
    if (!user) {
      console.log('ProtectedRoute: 로그인하지 않은 사용자 - /login으로 리다이렉트')
      navigate('/login')
    }
  }, [user, navigate])

  // 로그인하지 않은 사용자는 즉시 리다이렉트 (로딩 없음)
  if (!user) {
    return null
  }

  // 사용자는 있지만 선생님 정보가 없는 경우
  if (user && !teacher) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-red-600 mb-4">접근 권한이 없습니다</h2>
          <p className="text-gray-600 mb-4">선생님 계정으로만 접근할 수 있습니다.</p>
          <button onClick={() => navigate('/login')} className="btn-primary">
            로그인 페이지로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
