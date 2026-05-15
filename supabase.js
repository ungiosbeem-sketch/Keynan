import { createClient } from '@supabase/supabase-js'; // Halkan waa 'import' yar
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://ghtpmdxehfuswwxjemyt.supabase.co';

// HALKAN GELI KEY-GA DHEER EE KA BILOWDA 'eyJ...'
const supabaseAnonKey = 'YOUR_ACTUAL_LONG_ANON_KEY_HERE'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
