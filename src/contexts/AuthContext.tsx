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
  const [loading, setLoading] = useState(true)

  const fetchTeacher = async (userEmail: string, userId?: string) => {
    try {
      // 실제 DB에서 teacher 정보 조회
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('email', userEmail)
        .single()
      
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
      console.error('Error fetching teacher:', error)
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
    // 현재 세션 확인
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser?.email) {
        const teacherData = await fetchTeacher(currentUser.email, currentUser.id)
        setTeacher(teacherData)
      } else {
        setTeacher(null)
      }

      setLoading(false)
    })

    // 인증 상태 변경 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser?.email) {
        const teacherData = await fetchTeacher(currentUser.email, currentUser.id)
        setTeacher(teacherData)
      } else {
        setTeacher(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        if (error.message === 'Invalid login credentials') {
          throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.')
        }
        throw error
      }
    } catch (err) {
      console.error('Supabase auth error:', err)
      throw new Error('로그인 중 오류가 발생했습니다.')
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      // Supabase Auth에 사용자 등록
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) {
        throw authError
      }

      if (!authData.user) {
        throw new Error('사용자 생성에 실패했습니다.')
      }

      // teachers 테이블에 선생님 정보 저장
      const { error: teacherError } = await supabase
        .from('teachers')
        .insert([
          {
            id: authData.user.id,
            email: email,
            name: name,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ])

      if (teacherError) {
        console.error('Teacher 생성 오류:', teacherError)
        throw new Error('선생님 정보 저장에 실패했습니다.')
      }

      console.log('회원가입 성공:', authData.user)
    } catch (err) {
      console.error('Supabase signup error:', err)
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

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
