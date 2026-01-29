import { createClient } from '@supabase/supabase-js';

// FORCE OVERRIDE: Use my external Supabase project
const SUPABASE_URL = "https://sacnvqqjrrrzdkifsxyp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhY252cXFqcnJyemRraWZzeHlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5OTEwODQsImV4cCI6MjA4NDU2NzA4NH0.WEJTll5C-xYwfSMoLSMamtLWVMhlmyF6YLT71FcJYSo";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
