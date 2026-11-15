import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'
import { getSupabasePublicConfig } from './config'

export function createClient() {
  const { url, anonKey } = getSupabasePublicConfig()

  return createBrowserClient<Database>(
    url,
    anonKey
  )
}
