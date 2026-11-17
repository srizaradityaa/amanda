// Nama lampiran SPJ yang ditampilkan/diunduh: bila SPJ sudah dibukukan, nama berkas = nomor BKU aktif (otomatis ikut koreksi/cabut).
import { repo } from '@/data/repo';
import { namaBerkasBKU } from '@/data/arsip';

export function namaLampiranSPJ(spjId: string, namaAsli: string | null | undefined): string {
  const spj = repo.spjById(spjId);
  if (spj && spj.status === 'Dibukukan') {
    const bku = repo.bkuByTA(spj.ta_id).find((b) => b.spj_id === spjId && b.status === 'Aktif');
    if (bku) return namaBerkasBKU(bku.nomor_bku);
  }
  return namaAsli ?? '';
}
