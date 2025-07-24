import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/supabase'

// 새로운 Supabase 프로젝트 설정
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kbbxhgbsywgqhnxfupqz.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiYnhoZ2JzeXdncWhueGZ1cHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc4MDg2MzQsImV4cCI6MjA1MzM4NDYzNH0.DMmSWcDZIkLQXqPnAW4aFvCjGjgBSFGJhzG7MgE8o8k'

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key length:', supabaseAnonKey?.length)

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
