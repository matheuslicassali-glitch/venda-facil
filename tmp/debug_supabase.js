
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Manual loading of .env because this script is in /tmp
const envPath = 'c:/venda-facil-master/venda-facil-master/.env';
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Testing with URL:', supabaseUrl);
console.log('Testing with Key (partial):', supabaseAnonKey ? supabaseAnonKey.substring(0, 10) + '...' : 'NONE');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
    console.log('Attempting to fetch from "produtos"...');
    const { data, error } = await supabase.from('produtos').select('*').limit(1);

    if (error) {
        console.log('ERROR STATUS:', error.status);
        console.log('ERROR MESSAGE:', error.message);
        console.log('ERROR CODE:', error.code);
        console.log('FULL ERROR object:', JSON.stringify(error, null, 2));
    } else {
        console.log('SUCCESS! Received data:', data);
    }
}

test();
