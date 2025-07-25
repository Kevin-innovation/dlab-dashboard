import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  console.log('ProtectedRoute 상태:', { user: !!user })

  useEffect(() => {
    if (!user) {
      console.log('ProtectedRoute: 로그인하지 않은 사용자 - /login으로 리다이렉트')
      navigate('/login')
    }
  }, [user, navigate])

  // 로그인하지 않은 사용자는 즉시 리다이렉트
  if (!user) {
    return null
  }

  // 로그인한 사용자는 바로 대시보드 접근 허용
  return <>{children}</>
}
