// Turunan angka untuk grafik dasbor. Hanya MEMBACA data yang sudah ada; tidak mengubah apa pun.
import { repo } from '@/data/repo';
import * as anggaran from '@/data/anggaran';

export interface RingkasanAnggaran {
  pagu: number; realisasi: number; komitmen: number; sisaSpd: number; sisaAnggaran: number;
  pctRealisasi: number; pctKomitmen: number; // persen dari pagu
}

function alokasiLingkup(ta_id: string, seksi_id?: string) {
  const semua = anggaran.alokasiRekeningByTA(ta_id);
  if (!seksi_id) return semua;
  const ids = new Set(repo.pemetaanByTA(ta_id).filter((p) => p.seksi_ta_id === seksi_id).map((p) => p.id));
  return semua.filter((a) => ids.has(a.pemetaan_subkegiatan_id));
}

export function ringkasanAnggaran(ta_id: string, seksi_id?: string): RingkasanAnggaran {
  const semua = alokasiLingkup(ta_id, seksi_id);
  const rek = semua.filter((a) => a.disahkan);
  const pagu = semua.reduce((s, a) => s + a.pagu, 0);
  const realisasi = rek.reduce((s, a) => s + anggaran.realisasiAlokasi(a), 0);
  const komitmen = rek.reduce((s, a) => s + anggaran.komitmenAlokasi(a), 0);
  const sisaSpd = rek.reduce((s, a) => s + anggaran.sisaSpdBebas(a), 0);
  const pct = (n: number) => (pagu > 0 ? (n / pagu) * 100 : 0);
  return { pagu, realisasi, komitmen, sisaSpd, sisaAnggaran: pagu - realisasi, pctRealisasi: pct(realisasi), pctKomitmen: pct(komitmen) };
}

/** Realisasi kumulatif (persen dari pagu) per bulan; null untuk bulan yang belum tiba. */
export function kumulatifBulanan(ta_id: string, tahun: number, pagu: number, seksi_id?: string): (number | null)[] {
  const kuit = repo.kuitansiByTA(ta_id).filter((k) => !seksi_id || k.seksi_ta_id === seksi_id);
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

export function jumlahStatusSPJ(ta_id: string, seksi_id?: string) {
  const kuitSeksi = new Set(repo.kuitansiByTA(ta_id).filter((k) => !seksi_id || k.seksi_ta_id === seksi_id).map((k) => k.id));
  const l = repo.spjByTA(ta_id).filter((x) => !seksi_id || kuitSeksi.has(x.kuitansi_id));
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

/** Serapan per subkegiatan milik satu seksi (untuk PPTK). */
export function serapanPerSubkegiatan(ta_id: string, seksi_id: string): { nama: string; pct: number }[] {
  const alok = anggaran.alokasiRekeningByTA(ta_id);
  return repo.pemetaanByTA(ta_id).filter((p) => p.seksi_ta_id === seksi_id).map((p) => {
    const rows = alok.filter((a) => a.pemetaan_subkegiatan_id === p.id);
    const pagu = rows.reduce((t, a) => t + a.pagu, 0);
    const real = rows.reduce((t, a) => t + anggaran.realisasiAlokasi(a), 0);
    return { nama: `${p.kode_snapshot} ${p.nama_snapshot}`, pct: pagu > 0 ? (real / pagu) * 100 : 0 };
  }).sort((a, b) => b.pct - a.pct);
}
