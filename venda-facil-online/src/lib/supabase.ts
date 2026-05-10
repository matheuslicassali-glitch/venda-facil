import { createClient } from '@supabase/supabase-js';

// Forçamos a URL correta para evitar conflitos com variáveis de ambiente antigas no Vercel
const supabaseUrl = 'https://axupinryubgmokupryne.supabase.co';
const supabaseAnonKey = 'sb_publishable_Yy8ThifMyJXOLAoXEpGlVQ_wr1UpWu8';

console.log('Supabase Initializing with:', { url: supabaseUrl, key: supabaseAnonKey ? 'Present' : 'Missing' });

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
