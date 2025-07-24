import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://siedqjmapsgjybqhfpga.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpZWRxam1hcHNnanlicWhmcGdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNjAzNDUsImV4cCI6MjA2ODgzNjM0NX0.zy4QhI6pzgJ6Ks54NDgaliTEekSAsr0UUevZ-KtZ6PA'

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key length:', supabaseAnonKey?.length)

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
