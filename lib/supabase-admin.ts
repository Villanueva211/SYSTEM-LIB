// SERVER-SIDE ONLY — do not import in client components or pages
// This uses the service role key which bypasses Row Level Security.
import { createClient } from '@supabase/supabase-js';

let _admin: ReturnType<typeof createClient> | null = null;

export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    if (!_admin) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY env var');
      _admin = createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
    }
    return (_admin as any)[prop];
  },
});
