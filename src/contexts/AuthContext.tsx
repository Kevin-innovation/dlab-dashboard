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
  signOut: () => Promise<void>
  refreshTeacher: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchTeacher = async (userEmail: string) => {
    try {
      const mockTeacherId = '550e8400-e29b-41d4-a716-446655440000'
      
      // 먼저 mock teacher가 DB에 존재하는지 확인
      const { data: existingTeacher, error: checkError } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', mockTeacherId)
        .single()

      if (!checkError && existingTeacher) {
        console.log('기존 mock teacher 사용:', existingTeacher)
        return existingTeacher
      }

      // mock teacher가 없으면 생성
      console.log('mock teacher 생성 중...')
      const mockTeacher: Teacher = {
        id: mockTeacherId,
        email: userEmail,
        name: '테스트 선생님',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: createdTeacher, error: createError } = await supabase
        .from('teachers')
        .upsert([mockTeacher])
        .select()
        .single()

      if (createError) {
        console.error('Mock teacher 생성 오류:', createError)
        return mockTeacher // DB 생성 실패해도 메모리상 객체 반환
      }

      console.log('Mock teacher 생성 완료:', createdTeacher)
      return createdTeacher
      
      // TODO: Uncomment this when Docker/Supabase is properly set up
      /*
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('email', userEmail)
        .single()
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching teacher:', error)
        return null
      }
      
      return data
      */
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

    const teacherData = await fetchTeacher(user.email)
    setTeacher(teacherData)
  }

  useEffect(() => {
    // 현재 세션 확인
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      
      if (currentUser?.email) {
        const teacherData = await fetchTeacher(currentUser.email)
        setTeacher(teacherData)
      } else {
        setTeacher(null)
      }
      
      setLoading(false)
    })

    // 인증 상태 변경 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      
      if (currentUser?.email) {
        const teacherData = await fetchTeacher(currentUser.email)
        setTeacher(teacherData)
      } else {
        setTeacher(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    console.log('signIn called with:', email, password)
    
    // Temporary bypass for development - remove this when Supabase is properly configured
    if (email.trim() === 'test@example.com' && password.trim() === 'test123') {
      console.log('Mock login successful')
      const mockUser = {
        id: 'mock-user-id',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated'
      } as User
      
      setUser(mockUser)
      const teacherData = await fetchTeacher(mockUser.email!)
      setTeacher(teacherData)
      console.log('Mock user and teacher set:', mockUser, teacherData)
      return
    }
    
    // Real Supabase authentication
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
      throw new Error('로그인 중 오류가 발생했습니다. 테스트 계정 (test@example.com / test123)을 사용해보세요.')
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
    signOut,
    refreshTeacher,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 