import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ioixjvjklzbgogwfqxfx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_JRDfhHfvCp3DjrPJOu6YFg_QnLXVLK3';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
