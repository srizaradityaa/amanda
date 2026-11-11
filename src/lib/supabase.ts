// Klien Supabase. Mode "server" aktif hanya bila VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY terisi saat build.
// Tanpa keduanya, aplikasi berjalan dengan data contoh (mode demo) seperti sebelumnya.
// Kunci anon bersifat publik. JANGAN PERNAH memasukkan service_role key ke kode frontend.
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL: string = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
export const SUPABASE_ANON_KEY: string = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();
export const modeServer = SUPABASE_URL !== '' && SUPABASE_ANON_KEY !== '';

export const supabase = modeServer
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } })
  : null;
