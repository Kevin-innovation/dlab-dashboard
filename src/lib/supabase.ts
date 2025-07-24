import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/supabase'

// 임시: 유효한 Supabase 프로젝트가 준비될 때까지 더미 클라이언트 사용
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dummy.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'dummy-key'

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key length:', supabaseAnonKey?.length)

// Mock Supabase client for demo purposes
const mockSupabaseClient = {
  auth: {
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      console.log('Mock 로그인 시도:', { email, password })
      
      // 데모용 계정
      if (email === 'teacher@test.com' && password === 'password') {
        return {
          data: {
            user: {
              id: 'mock-user-id',
              email: 'teacher@test.com',
              created_at: new Date().toISOString(),
            },
            session: {
              access_token: 'mock-token',
              refresh_token: 'mock-refresh',
            }
          },
          error: null
        }
      }
      
      return {
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      }
    },
    
    signUp: async ({ email, password }: { email: string; password: string }) => {
      console.log('Mock 회원가입 시도:', { email, password })
      return {
        data: {
          user: {
            id: 'mock-new-user-id',
            email,
            created_at: new Date().toISOString(),
          },
          session: {
            access_token: 'mock-token',
            refresh_token: 'mock-refresh',
          }
        },
        error: null
      }
    },
    
    signOut: async () => {
      console.log('Mock 로그아웃')
      return { error: null }
    },
    
    getSession: async () => {
      return { data: { session: null }, error: null }
    },
    
    onAuthStateChange: (callback: any) => {
      console.log('Mock auth state change listener')
      return {
        data: {
          subscription: { unsubscribe: () => {} }
        }
      }
    }
  },
  
  from: (table: string) => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: null, error: { code: 'PGRST116' } }),
        order: async () => ({ data: [], error: null })
      }),
      order: async () => ({ data: [], error: null })
    }),
    insert: () => ({
      select: () => ({
        single: async () => ({ 
          data: { id: 'mock-id', email: 'test@test.com', name: 'Mock User' }, 
          error: null 
        })
      })
    }),
    update: () => ({
      eq: () => ({
        select: () => ({
          single: async () => ({ data: null, error: null })
        })
      })
    })
  })
}

export const supabase = supabaseUrl.includes('dummy') ? mockSupabaseClient as any : createClient<Database>(supabaseUrl, supabaseAnonKey)
