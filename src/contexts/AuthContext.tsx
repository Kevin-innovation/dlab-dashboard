import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { Tables } from '../types/supabase'

type Teacher = Tables<'teachers'>

interface AuthContextType {
  user: User | null
  teacher: Teacher | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
  refreshTeacher: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [loading, setLoading] = useState(false) // 즉시 로그인 창 표시를 위해 false로 시작

  const fetchTeacher = async (userEmail: string, userId?: string) => {
    try {
      console.log('fetchTeacher 시작:', { userEmail, userId })
      
      // 실제 DB에서 teacher 정보 조회 (10초 타임아웃)
      const teacherQuery = supabase
        .from('teachers')
        .select('*')
        .eq('email', userEmail)
        .single()
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          console.log('fetchTeacher 타임아웃 - 10초 초과')
          reject(new Error('TIMEOUT'))
        }, 10000)
      })
      
      const { data, error } = await Promise.race([teacherQuery, timeoutPromise]) as any
      console.log('fetchTeacher DB 응답:', { data, error })
      
      if (error && error.code === 'PGRST116') {
        // 데이터가 없는 경우, 기존 인증된 사용자를 위해 자동으로 teacher 레코드 생성
        if (userId) {
          console.log('기존 사용자를 위한 teacher 레코드 생성 중:', userEmail)
          const { data: newTeacher, error: insertError } = await supabase
            .from('teachers')
            .insert([{
              id: userId,
              email: userEmail,
              name: userEmail.split('@')[0], // 이메일의 @ 앞부분을 이름으로 사용
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }])
            .select()
            .single()
          
          if (insertError) {
            console.error('기존 사용자 teacher 레코드 생성 오류:', insertError)
            return null
          }
          
          console.log('기존 사용자 teacher 레코드 생성 성공:', newTeacher)
          return newTeacher
        }
        return null
      }
      
      if (error) {
        console.error('Error fetching teacher:', error)
        return null
      }
      
      return data
    } catch (error) {
      console.error('fetchTeacher 에러:', error)
      
      // 타임아웃 에러인 경우
      if (error instanceof Error && error.message === 'TIMEOUT') {
        console.error('❌ fetchTeacher 타임아웃 - 10초 초과')
        return null
      }
      
      return null
    }
  }

  const refreshTeacher = async () => {
    if (!user?.email) {
      setTeacher(null)
      return
    }

    const teacherData = await fetchTeacher(user.email, user.id)
    setTeacher(teacherData)
  }

  useEffect(() => {
    // 현재 세션 확인 (백그라운드에서 실행, UI 블록하지 않음)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null
      console.log('초기 세션 확인:', { currentUser: !!currentUser })
      setUser(currentUser)

      if (currentUser?.email) {
        const teacherData = await fetchTeacher(currentUser.email, currentUser.id)
        setTeacher(teacherData)
      } else {
        setTeacher(null)
      }
    })

    // 인증 상태 변경 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        console.log('AuthContext: 인증 상태 변경됨', { event, session })
        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (currentUser?.email) {
          console.log('AuthContext: Teacher 정보 가져오는 중...', currentUser.email)
          const teacherData = await fetchTeacher(currentUser.email, currentUser.id)
          console.log('AuthContext: Teacher 정보 설정됨', teacherData)
          setTeacher(teacherData)
        } else {
          setTeacher(null)
        }
      } catch (error) {
        console.error('onAuthStateChange 에러:', error)
        setTeacher(null)
      } finally {
        // 중요: 에러가 발생해도 반드시 로딩 완료
        console.log('AuthContext: onAuthStateChange 로딩 완료')
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      console.log('로그인 시도:', { email, passwordLength: password.length })
      console.log('Supabase client configured:', !!supabase)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      console.log('로그인 응답:', { data, error })
      
      if (error) {
        console.error('Supabase 로그인 오류:', error)
        if (error.message === 'Invalid login credentials') {
          throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.')
        }
        throw error
      }
      
      console.log('로그인 성공:', data)
      console.log('signIn 함수 정상 완료 - 에러 없음')
      
    } catch (err) {
      console.error('Supabase auth error:', err)
      throw err // 원본 에러를 다시 던지기
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      console.log('🚀 회원가입 시작:', { email, name })
      
      // Supabase Auth에 사용자 등록
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      console.log('Auth 사용자 생성 결과:', { authData, authError })

      if (authError) {
        console.error('Auth 오류:', authError)
        throw new Error(`인증 오류: ${authError.message}`)
      }

      if (!authData.user) {
        throw new Error('사용자 생성에 실패했습니다.')
      }

      console.log('✅ Auth 사용자 생성 성공:', authData.user.id)

      // teachers 테이블에 선생님 정보 저장
      console.log('📝 Teacher 레코드 생성 중:', { id: authData.user.id, email, name })
      
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .insert([
          {
            id: authData.user.id,
            email: email,
            name: name
          }
        ])
        .select()
        
      console.log('Teacher 생성 결과:', { teacherData, teacherError })

      if (teacherError) {
        console.error('❌ Teacher 생성 실패:', teacherError)
        
        // 일반적인 오류들 체크
        if (teacherError.code === '23505') {
          throw new Error('이미 존재하는 이메일입니다.')
        }
        if (teacherError.code === '42501') {
          throw new Error('데이터베이스 권한 오류가 발생했습니다.')
        }
        
        throw new Error(`선생님 정보 저장 실패: ${teacherError.message}`)
      }

      console.log('✅ 전체 회원가입 완료:', { user: authData.user.id, teacher: teacherData })
      
      // teacher 정보를 상태에 즉시 설정
      if (teacherData && teacherData.length > 0) {
        setTeacher(teacherData[0])
      }
      
    } catch (err) {
      console.error('💥 회원가입 전체 오류:', err)
      if (err instanceof Error) {
        throw err
      }
      throw new Error('회원가입 중 오류가 발생했습니다.')
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const value = {
    user,
    teacher,
    loading,
    signIn,
    signUp,
    signOut,
    refreshTeacher,
  }

  console.log('AuthProvider 렌더링 상태:', { loading, user: !!user, teacher: !!teacher })
  
  // 로딩 화면 제거 - 무조건 바로 UI 표시
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
