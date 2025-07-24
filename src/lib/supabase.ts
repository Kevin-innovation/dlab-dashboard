import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/supabase'

// 실제 작동하는 Supabase 프로젝트 사용
const supabaseUrl = 'https://lnxezlhfqvdmtjbncdhq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxueGV6bGhmcXZkbXRqYm5jZGhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc4MDkxMDUsImV4cCI6MjA1MzM4NTEwNX0.O9F1v2X6iAqJ6SdXIgpO8-Fl9xmWTX4O_wF-8YdABa8'

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key length:', supabaseAnonKey?.length)

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
