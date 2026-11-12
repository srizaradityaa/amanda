// Unggah/unduh berkas ke Supabase Storage. Bucket dan kebijakannya dibuat oleh migrasi 0010.
// Alur lampiran SPJ: (1) unggah objek `<spj_id>/<nama>` ke bucket `lampiran-spj`, (2) panggil RPC pptk_spj_lampiran untuk mencatat metadata.
// Alur hapus: panggil RPC pptk_spj_lampiran_hapus / pptk_spj_lepas / adm_ta_hapus_retensi; hasilnya memuat kunci objek untuk dihapus dari Storage.
export const BUCKET_LAMPIRAN = 'lampiran-spj';
export const BUCKET_SK = 'sk';

export interface KlienStorage {
  storage: { from(bucket: string): {
    upload(path: string, body: Blob | File, opt?: { upsert?: boolean; contentType?: string }): PromiseLike<{ error: { message: string } | null }>;
    download(path: string): PromiseLike<{ data: Blob | null; error: { message: string } | null }>;
    remove(paths: string[]): PromiseLike<{ error: { message: string } | null }>;
  } };
}

export function kunciLampiran(spjId: string, namaBerkas: string): string {
  const aman = namaBerkas.normalize('NFKD').replace(/[^\w.-]+/g, '_').slice(0, 120) || 'lampiran.pdf';
  return `${spjId}/${aman}`;
}

export async function unggah(k: KlienStorage, bucket: string, kunci: string, berkas: Blob | File): Promise<{ ok: boolean; error?: string }> {
  const { error } = await k.storage.from(bucket).upload(kunci, berkas, { upsert: true, contentType: (berkas as File).type || undefined });
  return error ? { ok: false, error: error.message } : { ok: true };
}
export async function unduh(k: KlienStorage, bucket: string, kunci: string): Promise<{ ok: boolean; blob?: Blob; error?: string }> {
  const { data, error } = await k.storage.from(bucket).download(kunci);
  return error || !data ? { ok: false, error: error?.message ?? 'Berkas tidak ditemukan.' } : { ok: true, blob: data };
}
export async function hapus(k: KlienStorage, bucket: string, kunci: string[]): Promise<{ ok: boolean; error?: string }> {
  if (kunci.length === 0) return { ok: true };
  const { error } = await k.storage.from(bucket).remove(kunci);
  return error ? { ok: false, error: error.message } : { ok: true };
}
