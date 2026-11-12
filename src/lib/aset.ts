// Logo dan stempel template (kuitansi, verifikasi) disimpan permanen di bucket `aset-template` (mode server).
// Di memori tetap dipegang lewat berkas.ts agar komponen cetak/pratinjau bisa membacanya secara sinkron.
import { supabase, modeServer } from '@/lib/supabase';
import { unggah, unduh, hapus, BUCKET_ASET } from '@/lib/storage';
import { simpanBerkasSesi, hapusBerkasSesi } from '@/lib/berkas';

export const KUNCI_ASET = ['tplkui-logo', 'tplver-logo', 'tplver-stempel'] as const;

/** Unggah ke Storage (mode server). Mengembalikan galat bila gagal; di mode demo selalu berhasil. */
export async function simpanAset(kunci: string, file: File): Promise<{ ok: boolean; error?: string }> {
  if (!modeServer) { simpanBerkasSesi(kunci, file); return { ok: true }; }
  const u = await unggah(supabase as never, BUCKET_ASET, kunci, file);
  if (u.ok) simpanBerkasSesi(kunci, file);
  return u.ok ? { ok: true } : { ok: false, error: u.error ?? 'Gagal mengunggah gambar.' };
}

export async function hapusAset(kunci: string): Promise<void> {
  hapusBerkasSesi(kunci);
  if (modeServer) await hapus(supabase as never, BUCKET_ASET, [kunci]).catch(() => undefined);
}

/** Muat semua aset template dari Storage ke memori; aset yang belum ada dilewati. */
export async function muatAset(): Promise<void> {
  if (!modeServer) return;
  await Promise.all(KUNCI_ASET.map(async (k) => {
    try {
      const r = await unduh(supabase as never, BUCKET_ASET, k);
      if (r.ok && r.blob) simpanBerkasSesi(k, new File([r.blob], k, { type: r.blob.type }));
    } catch { /* abaikan: aset belum diunggah */ }
  }));
}
