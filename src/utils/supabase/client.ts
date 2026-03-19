import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Uses environment variables holding the Supabase URL and ANON KEY
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
