// Turunan angka untuk grafik dasbor. Hanya MEMBACA data yang sudah ada; tidak mengubah apa pun.
import { repo } from '@/data/repo';
import * as anggaran from '@/data/anggaran';

export interface RingkasanAnggaran {
  pagu: number; realisasi: number; komitmen: number; sisaSpd: number; sisaAnggaran: number;
  pctRealisasi: number; pctKomitmen: number; // persen dari pagu
}

export function ringkasanAnggaran(ta_id: string): RingkasanAnggaran {
  const rek = anggaran.alokasiRekeningByTA(ta_id).filter((a) => a.disahkan);
  const semua = anggaran.alokasiRekeningByTA(ta_id);
  const pagu = semua.reduce((s, a) => s + a.pagu, 0);
  const realisasi = rek.reduce((s, a) => s + anggaran.realisasiAlokasi(a), 0);
  const komitmen = rek.reduce((s, a) => s + anggaran.komitmenAlokasi(a), 0);
  const sisaSpd = rek.reduce((s, a) => s + anggaran.sisaSpdBebas(a), 0);
  const pct = (n: number) => (pagu > 0 ? (n / pagu) * 100 : 0);
  return { pagu, realisasi, komitmen, sisaSpd, sisaAnggaran: pagu - realisasi, pctRealisasi: pct(realisasi), pctKomitmen: pct(komitmen) };
}

/** Realisasi kumulatif (persen dari pagu) per bulan; null untuk bulan yang belum tiba. */
export function kumulatifBulanan(ta_id: string, tahun: number, pagu: number): (number | null)[] {
  const kuit = repo.kuitansiByTA(ta_id);
  const perBulan = new Array<number>(12).fill(0);
  for (const b of repo.bkuByTA(ta_id)) {
    if (b.status !== 'Aktif') continue;
    if (Number(b.tanggal_bku.slice(0, 4)) !== tahun) continue;
    const m = Number(b.tanggal_bku.slice(5, 7)) - 1;
    const k = kuit.find((x) => x.id === b.kuitansi_id);
    if (k && m >= 0 && m < 12) perBulan[m] += k.bruto;
  }
  const sekarang = new Date();
  const bulanIni = sekarang.getFullYear() === tahun ? sekarang.getMonth() : sekarang.getFullYear() > tahun ? 11 : -1;
  let acc = 0;
  return perBulan.map((v, i) => {
    acc += v;
    return i <= bulanIni ? (pagu > 0 ? (acc / pagu) * 100 : 0) : null;
  });
}

/** Persen waktu berjalan pada akhir tiap bulan (garis target). */
export function targetWaktu(): number[] {
  return Array.from({ length: 12 }, (_, i) => ((i + 1) / 12) * 100);
}

export function jumlahStatusSPJ(ta_id: string) {
  const l = repo.spjByTA(ta_id);
  const n = (s: string) => l.filter((x) => x.status === s).length;
  return { draft: n('Draft'), terkunci: n('Terkunci'), menungguBku: n('Menunggu BKU'), dibukukan: n('Dibukukan') };
}

export function serapanPerSeksi(ta_id: string): { nama: string; pct: number }[] {
  const pem = repo.pemetaanByTA(ta_id);
  const alok = anggaran.alokasiRekeningByTA(ta_id);
  return repo.seksiTAByTA(ta_id).filter((s) => s.status === 'Aktif').map((s) => {
    const ids = new Set(pem.filter((p) => p.seksi_ta_id === s.id).map((p) => p.id));
    const rows = alok.filter((a) => ids.has(a.pemetaan_subkegiatan_id));
    const pagu = rows.reduce((t, a) => t + a.pagu, 0);
    const real = rows.reduce((t, a) => t + anggaran.realisasiAlokasi(a), 0);
    return { nama: s.nama_snapshot, pct: pagu > 0 ? (real / pagu) * 100 : 0 };
  }).sort((a, b) => b.pct - a.pct);
}
