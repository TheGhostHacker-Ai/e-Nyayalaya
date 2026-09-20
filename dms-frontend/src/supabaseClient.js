import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qsmuvcijmmzjwwuqftbm.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eUCl9QvC0n-NICppruvESg_1mtG-F3w';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    flowType: 'implicit',
    storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
    storageKey: 'dms-auth-token'
  }
});
