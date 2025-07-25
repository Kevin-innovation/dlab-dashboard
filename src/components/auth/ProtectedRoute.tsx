import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, teacher, loading } = useAuth()
  const navigate = useNavigate()
  const [waitTime, setWaitTime] = useState(0)
  
  console.log('ProtectedRoute 상태:', { loading, user: !!user, teacher: !!teacher, waitTime })

  useEffect(() => {
    if (!user) {
      console.log('ProtectedRoute: 로그인하지 않은 사용자 - /login으로 리다이렉트')
      navigate('/login')
    }
  }, [user, navigate])

  // Teacher 정보 로딩 대기 시간 카운터
  useEffect(() => {
    if (user && !teacher) {
      const timer = setInterval(() => {
        setWaitTime(prev => prev + 1)
      }, 1000)

      return () => clearInterval(timer)
    } else {
      setWaitTime(0)
    }
  }, [user, teacher])

  // 로그인하지 않은 사용자는 즉시 리다이렉트 (로딩 없음)
  if (!user) {
    return null
  }

  // 사용자는 있지만 선생님 정보가 없는 경우 - 5초 후에는 teacher 없이도 진행
  if (user && !teacher && waitTime < 5) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">선생님 정보 확인 중...</h2>
          <p className="text-gray-500 text-sm">잠시만 기다려주세요 ({waitTime}/5초)</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
