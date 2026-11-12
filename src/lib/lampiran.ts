// Buka / unduh lampiran PDF SPJ dari Storage (mode server). Hak dicek ulang oleh RPC `spj_lampiran_hak`.
import { supabase, modeServer } from '@/lib/supabase';
import { buatApi } from '@/lib/api';
import { unduh, BUCKET_LAMPIRAN, BUCKET_SK } from '@/lib/storage';
import { adaBerkasSesi, bukaBerkasSesi, unduhBerkasSesi } from '@/lib/berkas';

async function ambil(spjId: string): Promise<{ ok: boolean; blob?: Blob; nama?: string; error?: string }> {
  try {
    const h = (await buatApi(supabase as never).spj_lampiran_hak({ p_spj: spjId })) as { ok: boolean; key?: string; nama?: string; error?: string };
    if (!h.ok || !h.key) return { ok: false, error: h.error ?? 'Lampiran tidak tersedia.' };
    const u = await unduh(supabase as never, BUCKET_LAMPIRAN, h.key);
    return u.ok ? { ok: true, blob: u.blob, nama: h.nama } : { ok: false, error: u.error };
  } catch { return { ok: false, error: 'Layanan tidak tersedia. Periksa koneksi lalu coba lagi.' }; }
}

/** Ada isi berkas yang bisa dibuka? Mode server: selalu bila SPJ memiliki lampiran (diperiksa pemanggil). */
export const bisaBukaLampiran = (spjId: string, adaLampiran: boolean) => (modeServer ? adaLampiran : adaBerkasSesi(spjId));

export async function bukaLampiranSPJ(spjId: string): Promise<{ ok: boolean; error?: string }> {
  if (!modeServer) return bukaBerkasSesi(spjId) ? { ok: true } : { ok: false, error: 'Isi berkas hanya tersedia pada sesi unggah.' };
  const r = await ambil(spjId);
  if (!r.ok || !r.blob) return { ok: false, error: r.error };
  const u = URL.createObjectURL(r.blob);
  window.open(u, '_blank', 'noopener');
  window.setTimeout(() => URL.revokeObjectURL(u), 60_000);
  return { ok: true };
}

export async function unduhLampiranSPJ(spjId: string, nama: string): Promise<{ ok: boolean; error?: string }> {
  if (!modeServer) return unduhBerkasSesi(spjId, nama) ? { ok: true } : { ok: false, error: 'Isi berkas hanya tersedia pada sesi unggah.' };
  const r = await ambil(spjId);
  if (!r.ok || !r.blob) return { ok: false, error: r.error };
  const u = URL.createObjectURL(r.blob);
  const a = document.createElement('a'); a.href = u; a.download = r.nama ?? nama; document.body.appendChild(a); a.click(); a.remove();
  window.setTimeout(() => URL.revokeObjectURL(u), 10_000);
  return { ok: true };
}

// ---- Berkas SK (bucket `sk`, hanya Admin) ----
export const bisaBukaSK = (skId: string, berkasKey: string | null | undefined) => (modeServer ? !!berkasKey : adaBerkasSesi(skId));

async function ambilSK(berkasKey: string): Promise<{ ok: boolean; blob?: Blob; error?: string }> {
  try { return await unduh(supabase as never, BUCKET_SK, berkasKey); } catch { return { ok: false, error: 'Layanan tidak tersedia. Periksa koneksi lalu coba lagi.' }; }
}
export async function bukaSK(skId: string, berkasKey: string | null | undefined): Promise<{ ok: boolean; error?: string }> {
  if (!modeServer) return bukaBerkasSesi(skId) ? { ok: true } : { ok: false, error: 'Isi berkas hanya tersedia pada sesi unggah.' };
  if (!berkasKey) return { ok: false, error: 'SK ini belum memiliki berkas.' };
  const r = await ambilSK(berkasKey);
  if (!r.ok || !r.blob) return { ok: false, error: r.error };
  const u = URL.createObjectURL(r.blob);
  window.open(u, '_blank', 'noopener');
  window.setTimeout(() => URL.revokeObjectURL(u), 60_000);
  return { ok: true };
}
export async function unduhSK(skId: string, berkasKey: string | null | undefined, nama: string): Promise<{ ok: boolean; error?: string }> {
  if (!modeServer) return unduhBerkasSesi(skId, nama) ? { ok: true } : { ok: false, error: 'Isi berkas hanya tersedia pada sesi unggah.' };
  if (!berkasKey) return { ok: false, error: 'SK ini belum memiliki berkas.' };
  const r = await ambilSK(berkasKey);
  if (!r.ok || !r.blob) return { ok: false, error: r.error };
  const u = URL.createObjectURL(r.blob);
  const a = document.createElement('a'); a.href = u; a.download = nama; document.body.appendChild(a); a.click(); a.remove();
  window.setTimeout(() => URL.revokeObjectURL(u), 10_000);
  return { ok: true };
}
