import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/supabase'

// 실제 Supabase 연동 (Vercel 환경변수 이슈로 직접 설정)
const supabaseUrl = 'https://siedqjmapsgjybqhfpga.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpZWRxam1hcHNnanlicWhmcGdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNjAzNDUsImV4cCI6MjA2ODgzNjM0NX0.zy4QhI6pzgJ6Ks54NDgaliTEekSAsr0UUevZ-KtZ6PA'

console.log('🔧 환경변수 디버깅:')
console.log('ENV VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('ENV VITE_SUPABASE_ANON_KEY length:', import.meta.env.VITE_SUPABASE_ANON_KEY?.length)

console.log('✅ 실제 Supabase 연결 중...')
console.log('📍 Supabase URL:', supabaseUrl)
console.log('🔑 API Key length:', supabaseAnonKey?.length)

// URL과 Key 유효성 검사
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('❌ Supabase 환경변수가 누락되었습니다')
}

if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  throw new Error('❌ 유효하지 않은 Supabase URL입니다')
}

if (supabaseAnonKey.length < 100) {
  throw new Error('❌ 유효하지 않은 Supabase API Key입니다')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

console.log('🚀 실제 Supabase 클라이언트 생성 완료')