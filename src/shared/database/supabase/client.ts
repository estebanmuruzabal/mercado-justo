import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/shared/types/supabase'
import { getSupabaseAnonKey, getSupabaseUrl } from './config'

export const createClient = () =>
  createBrowserClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
  )