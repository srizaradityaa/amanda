// Alur masuk AMANDA lewat Edge Function `masuk` (dua langkah).
// 1) verifikasi NIP/NIK (atau email Pengawas) + kata sandi -> tiket + daftar konteks (TA, peran, seksi)
// 2) buka sesi pada satu konteks -> token Supabase yang dipasang ke klien (setSession)
export interface Konteks { ta_id: string | null; tahun: string | null; peran: string; seksi_ta_id: string | null; seksi_nama: string | null; delegasi: boolean }
export interface HasilVerifikasi { ok: boolean; error?: string; tiket?: string; nama?: string; konteks?: Konteks[] }
export interface SesiToken { access_token: string; refresh_token: string; expires_in: number }
export interface HasilBuka { ok: boolean; error?: string; sesi?: SesiToken; payload?: Record<string, unknown> }
export interface KlienAuth { auth: { setSession(s: { access_token: string; refresh_token: string }): PromiseLike<{ error: { message: string } | null }>; signOut(): PromiseLike<unknown> } }

async function pos<T>(url: string, anonKey: string, badan: Record<string, unknown>): Promise<T> {
  const r = await fetch(`${url}/functions/v1/masuk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    body: JSON.stringify(badan),
  });
  try { return (await r.json()) as T; } catch { return { ok: false, error: 'Layanan tidak tersedia. Coba lagi.' } as unknown as T; }
}

export function verifikasiMasuk(url: string, anonKey: string, identitas: string, sandi: string): Promise<HasilVerifikasi> {
  return pos<HasilVerifikasi>(url, anonKey, { aksi: 'verifikasi', identitas, sandi });
}

export async function bukaSesi(url: string, anonKey: string, klien: KlienAuth, tiket: string, k: { ta_id: string | null; peran: string; seksi_ta_id: string | null }): Promise<HasilBuka> {
  const h = await pos<HasilBuka>(url, anonKey, { aksi: 'buka', tiket, ta_id: k.ta_id, peran: k.peran, seksi_ta_id: k.seksi_ta_id });
  if (!h.ok || !h.sesi) return { ok: false, error: h.error ?? 'Gagal membuka sesi.' };
  const { error } = await klien.auth.setSession({ access_token: h.sesi.access_token, refresh_token: h.sesi.refresh_token });
  if (error) return { ok: false, error: 'Gagal memasang sesi.' };
  return h;
}
