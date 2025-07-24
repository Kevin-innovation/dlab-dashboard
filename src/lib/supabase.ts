import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/supabase'

// 실제 작동하는 Supabase 프로젝트 사용
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zxcuyjhfqpkbaxkwnnsg.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4Y3V5amhmcXBrYmF4a3dubnNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc4MDk0MzcsImV4cCI6MjA1MzM4NTQzN30.1yK7wAqQkd4vfj85VEYkUIpG0DgBV7YjWXy3YdHkJaE'

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key length:', supabaseAnonKey?.length)


if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
