export function getSupabasePublicConfig() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (!rawUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL. Set it to the Supabase Project URL.')
  }

  if (!anonKey || /^your[_-]/i.test(anonKey)) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Set it to the Supabase anon or publishable key.')
  }

  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    throw new Error('Invalid NEXT_PUBLIC_SUPABASE_URL. Use the Supabase Project URL, not a dashboard URL.')
  }

  if (
    (url.protocol !== 'https:' && url.protocol !== 'http:') ||
    !url.hostname ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash ||
    url.hostname === 'supabase.com' ||
    url.hostname.endsWith('.supabase.com')
  ) {
    throw new Error('Invalid NEXT_PUBLIC_SUPABASE_URL. Use the project base URL, such as https://<project-ref>.supabase.co.')
  }

  if (isServiceRoleKey(anonKey)) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY must be a public anon or publishable key, never a service-role or secret key.')
  }

  return { url: url.origin, anonKey }
}

function isServiceRoleKey(key: string): boolean {
  if (key.startsWith('sb_secret_')) return true

  const payload = key.split('.')[1]
  if (!payload) return false

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = globalThis.atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))
    return JSON.parse(decoded).role === 'service_role'
  } catch {
    return false
  }
}
