import { fileURLToPath } from 'node:url'
import type { NextConfig } from 'next'
import { getSupabasePublicConfig } from './lib/supabase/config'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))

if (process.env.NODE_ENV === 'production') {
  getSupabasePublicConfig()
}

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
}

export default nextConfig
