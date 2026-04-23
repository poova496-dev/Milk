// Supabase Configuration for Manjula Milk Forming
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ioixjvjklzbgogwfqxfx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_JRDfhHfvCp3DjrPJOu6YFg_QnLXVLK3';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export { SUPABASE_URL, SUPABASE_ANON_KEY };
