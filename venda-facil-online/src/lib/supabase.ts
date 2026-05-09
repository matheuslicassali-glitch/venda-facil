import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://axupinryubgmokupryne.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Yy8ThifMyJXOLAoXEpGlVQ_wr1UpWu8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
