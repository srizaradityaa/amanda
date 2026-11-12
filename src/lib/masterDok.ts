// Buka PDF daftar subkegiatan/rekening dari bucket `master-dokumen` (hanya Admin).
import { supabase, modeServer } from '@/lib/supabase';
import { unduh, BUCKET_MASTER } from '@/lib/storage';

export async function bukaDokumenMaster(berkasKey: string): Promise<{ ok: boolean; error?: string }> {
  if (!modeServer) return { ok: false, error: 'Isi berkas tidak tersimpan pada mode contoh.' };
  try {
    const r = await unduh(supabase as never, BUCKET_MASTER, berkasKey);
    if (!r.ok || !r.blob) return { ok: false, error: r.error };
    const u = URL.createObjectURL(r.blob);
    window.open(u, '_blank', 'noopener');
    window.setTimeout(() => URL.revokeObjectURL(u), 60_000);
    return { ok: true };
  } catch { return { ok: false, error: 'Layanan tidak tersedia. Periksa koneksi lalu coba lagi.' }; }
}
