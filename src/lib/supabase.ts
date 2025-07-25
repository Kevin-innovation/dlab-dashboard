import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/supabase'

// 실제 Supabase 연동 (올바른 URL)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://siedqjmapsgjybqhfpga.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpZWRxam1hcHNnanlicWhmcGdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNjAzNDUsImV4cCI6MjA2ODgzNjM0NX0.zy4QhI6pzgJ6Ks54NDgaliTEekSAsr0UUevZ-KtZ6PA'

console.log('✅ 실제 Supabase 연결 중...')
console.log('📍 Supabase URL:', supabaseUrl)
console.log('🔑 API Key length:', supabaseAnonKey?.length)

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('❌ Supabase 환경변수가 누락되었습니다')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

console.log('🚀 실제 Supabase 클라이언트 생성 완료')