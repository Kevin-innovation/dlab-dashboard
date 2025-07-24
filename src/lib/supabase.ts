import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/supabase'

// 강제로 새로운 Supabase 프로젝트 사용 (환경 변수 캐시 문제 해결)
const supabaseUrl = 'https://kbbxhgbsywgqhnxfupqz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiYnhoZ2JzeXdncWhueGZ1cHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc4MDg2MzQsImV4cCI6MjA1MzM4NDYzNH0.DMmSWcDZIkLQXqPnAW4aFvCjGjgBSFGJhzG7MgE8o8k'

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key length:', supabaseAnonKey?.length)

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
