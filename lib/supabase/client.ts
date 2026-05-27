import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'
import { getSupabaseAnonKey, getSupabaseUrl } from './config'

export const createClient = () =>
  createBrowserClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
  )