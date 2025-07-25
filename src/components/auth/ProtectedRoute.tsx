import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  
  console.log('ProtectedRoute 상태:', { user: !!user, loading })

  useEffect(() => {
    // 로딩이 완료되고 사용자가 없을 때만 리다이렉트
    if (!loading && !user) {
      console.log('ProtectedRoute: 로그인하지 않은 사용자 - /login으로 리다이렉트')
      navigate('/login')
    }
  }, [user, loading, navigate])

  // 초기 로딩 중이면 로딩 화면 표시
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  // 로그인하지 않은 사용자는 리다이렉트 (useEffect에서 처리됨)
  if (!user) {
    return null
  }

  // 로그인한 사용자는 바로 대시보드 접근 허용
  return <>{children}</>
}
