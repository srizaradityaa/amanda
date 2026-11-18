// Pengaturan portal keterbukaan: video YouTube dan logo kabupaten (diatur Admin, dibaca publik).
// Mode server memakai RPC publik_pengaturan_portal (baca) dan adm_portal_simpan (Admin saja).
import { supabase, modeServer } from '@/lib/supabase';
import { buatApi } from '@/lib/api';
import { jalankan } from '@/data/server';
import { idYoutube } from '@/lib/youtube';
import { tampilkanInfo } from '@/lib/galat';

export interface PengaturanPortal { video_id: string | null; logo: string | null }
let lokal: PengaturanPortal = { video_id: null, logo: null }; // mode demo: hanya di memori

export async function pengaturanPortalAsync(): Promise<PengaturanPortal> {
  if (!modeServer) return lokal;
  try {
    const d = await buatApi(supabase as never).publik_pengaturan_portal() as unknown as Partial<PengaturanPortal>;
    return { video_id: typeof d?.video_id === 'string' ? d.video_id : null, logo: typeof d?.logo === 'string' ? d.logo : null };
  } catch { return { video_id: null, logo: null }; }
}

/** video: tautan atau ID ('' = hapus). logo: undefined = tidak diubah, '' = hapus, selain itu data URL gambar. */
export async function simpanPengaturanPortal(video: string, logo?: string): Promise<{ ok: boolean; error?: string }> {
  if (modeServer) return jalankan(buatApi(supabase as never).adm_portal_simpan({ p_video: video, p_logo: logo ?? null }), { toast: true, tanpaSegar: true });
  const v = video.trim();
  const id = v === '' ? null : idYoutube(v);
  if (v !== '' && !id) return { ok: false, error: 'Tautan harus berupa tautan video YouTube (youtube.com atau youtu.be).' };
  lokal = { video_id: id, logo: logo === undefined ? lokal.logo : logo === '' ? null : logo };
  tampilkanInfo('Tersimpan.');
  return { ok: true };
}
