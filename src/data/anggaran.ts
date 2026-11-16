// Aturan anggaran Bagian 1 Langkah 4 (Dokumen 01 §2–4, Dokumen 03 §494).
// Semua perhitungan dan penolakan terjadi di sini, bukan di tampilan.
// Nominal bilangan bulat rupiah tanpa sen.

import * as data from '@/data/sampleData';
import type { AlokasiRekening, FaseAlokasi, LedgerSPD, RincianVersiAlokasi, TahunAnggaran, VersiAlokasiAnggaran } from '@/data/types';
import { recordAudit } from '@/lib/audit';
import { formatRupiah } from '@/lib/format';
import { nowWita } from '@/lib/wita';
import { mut } from '@/data/mut';
import { server } from '@/data/server';

export interface AktorAnggaran {
  id: string;
  nama: string;
  peran: string;
  seksi_ta_id: string | null;
}

export type Hasil = { ok: boolean; error?: string };

const JENDELA_FORMAT = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;

export function taById(ta_id: string): TahunAnggaran | undefined {
  return data.tahunAnggaran.find((t) => t.id === ta_id);
}

function pemetaanOfTA(ta_id: string) {
  return data.pemetaanSubkegiatanTA.filter((p) => p.ta_id === ta_id);
}

function alokasiSubByPemetaan(pemetaan_id: string) {
  return data.alokasiSubkegiatan.find((a) => a.pemetaan_subkegiatan_id === pemetaan_id);
}

function alokasiRekByPemetaan(pemetaan_id: string) {
  return data.alokasiRekening.filter((a) => a.pemetaan_subkegiatan_id === pemetaan_id);
}

function isBilanganBulat(n: number) {
  return Number.isInteger(n) && n >= 0;
}

// ===== Komitmen, realisasi, sisa SPD bebas (SPD-01) =====

function kuitansiAlokasi(a: AlokasiRekening) {
  return data.kuitansi.filter(
    (k) => k.ta_id === a.ta_id && k.pemetaan_subkegiatan_id === a.pemetaan_subkegiatan_id && k.rekening_id === a.rekening_id,
  );
}

function sudahBKU(kuitansi_id: string) {
  return data.bku.some((b) => b.kuitansi_id === kuitansi_id && b.status === 'Aktif');
}

export function realisasiAlokasi(a: AlokasiRekening): number {
  return kuitansiAlokasi(a).filter((k) => sudahBKU(k.id)).reduce((s, k) => s + k.bruto, 0);
}

export function komitmenAlokasi(a: AlokasiRekening): number {
  return kuitansiAlokasi(a)
    .filter((k) => (k.status === 'Aktif' || k.status === 'Terkunci') && !sudahBKU(k.id))
    .reduce((s, k) => s + k.bruto, 0);
}

export function terpakaiAlokasi(a: AlokasiRekening): number {
  return realisasiAlokasi(a) + komitmenAlokasi(a);
}

export function sisaSpdBebas(a: AlokasiRekening): number {
  return a.spd_aktif - komitmenAlokasi(a) - realisasiAlokasi(a);
}

// ===== Pagu Induk dan pagu subkegiatan (ALK-01, ALK-02, TA-09) =====

// Pagu Induk yang berlaku: Pagu Induk APBD-P bila fase perubahan aktif.
export function paguIndukAktif(ta_id: string): number {
  const ta = taById(ta_id);
  if (!ta) return 0;
  return ta.mode_apbd_p && ta.pagu_induk_perubahan !== null ? ta.pagu_induk_perubahan : ta.pagu_induk;
}

export function paguSubkegiatan(pemetaan_id: string): number {
  return alokasiSubByPemetaan(pemetaan_id)?.pagu ?? 0;
}

export function paguSeksi(ta_id: string, seksi_ta_id: string): number {
  return pemetaanOfTA(ta_id)
    .filter((p) => p.seksi_ta_id === seksi_ta_id)
    .reduce((s, p) => s + paguSubkegiatan(p.id), 0);
}

export function totalRekeningPemetaan(pemetaan_id: string): number {
  return alokasiRekByPemetaan(pemetaan_id).reduce((s, a) => s + a.pagu, 0);
}

// Pagu Induk = total pagu subkegiatan semua seksi (otomatis). Berhenti diperbarui setelah Sahkan.
export function hitungUlangInduk(ta_id: string): void {
  const ta = taById(ta_id);
  if (!ta || sudahDisahkan(ta_id)) return;
  const total = data.alokasiSubkegiatan.filter((a) => a.ta_id === ta_id).reduce((s, a) => s + a.pagu, 0);
  if (ta.mode_apbd_p) ta.pagu_induk_perubahan = total;
  else ta.pagu_induk = total;
}

export function selisihAlokasiInstansi(ta_id: string): number {
  if (!taById(ta_id)) return 0;
  const total = data.alokasiSubkegiatan.filter((a) => a.ta_id === ta_id).reduce((s, a) => s + a.pagu, 0);
  return paguIndukAktif(ta_id) - total;
}

// ===== Status alokasi seksi (ALK-03, ALK-04, ALK-05) =====

export type StatusSeksi = 'Belum Input' | 'Draft Belum Seimbang' | 'Tuntas (100% Seimbang)';

export function pemetaanSeimbang(pemetaan_id: string): boolean {
  const sub = alokasiSubByPemetaan(pemetaan_id);
  if (!sub) return false;
  const rek = alokasiRekByPemetaan(pemetaan_id);
  return rek.length > 0 && totalRekeningPemetaan(pemetaan_id) === sub.pagu;
}

export function statusSeksi(ta_id: string, seksi_ta_id: string): StatusSeksi {
  const pems = pemetaanOfTA(ta_id).filter((p) => p.seksi_ta_id === seksi_ta_id);
  const adaIsi = pems.some((p) => alokasiSubByPemetaan(p.id) || alokasiRekByPemetaan(p.id).length > 0);
  if (!adaIsi) return 'Belum Input';
  if (pems.length > 0 && pems.every((p) => pemetaanSeimbang(p.id))) return 'Tuntas (100% Seimbang)';
  return 'Draft Belum Seimbang';
}

export function sudahDisahkan(ta_id: string): boolean {
  return data.alokasiRekening.some((a) => a.ta_id === ta_id && a.disahkan);
}

// Gerbang tanggung renteng (ALK-05): terbuka hanya bila disahkan dan seluruh seksi Aktif Tuntas.
export function gerbangStatus(ta_id: string) {
  const seksiList = data.seksiTA.filter((s) => s.ta_id === ta_id && s.status === 'Aktif');
  const seksiBelum = seksiList
    .map((s) => ({ id: s.id, nama: s.nama_snapshot, status: statusSeksi(ta_id, s.id) }))
    .filter((x) => x.status !== 'Tuntas (100% Seimbang)');
  const disahkan = sudahDisahkan(ta_id);
  return { terbuka: disahkan && seksiBelum.length === 0, disahkan, seksiBelum };
}

// ===== Jendela waktu alokasi (ALK-04) =====

export function jendelaTutup(ta_id: string): string | null {
  return data.jendelaAlokasi.find((j) => j.ta_id === ta_id)?.tutup_wita ?? null;
}

export function jendelaTerbuka(ta_id: string): boolean {
  const tutup = jendelaTutup(ta_id);
  return tutup !== null && tutup > nowWita();
}

export function aturJendelaDemo(ta_id: string, tutup_wita: string, aktor: AktorAnggaran): Hasil {
  if (aktor.peran !== 'bendahara') return { ok: false, error: 'Hanya Bendahara Pengeluaran yang mengatur jendela waktu.' };
  if (!taById(ta_id)) return { ok: false, error: 'TA tidak ditemukan.' };
  if (!JENDELA_FORMAT.test(tutup_wita)) return { ok: false, error: 'Format waktu tutup harus tanggal dan jam WITA.' };
  if (tutup_wita <= nowWita()) return { ok: false, error: 'Waktu penutupan harus setelah waktu sekarang.' };
  const j = data.jendelaAlokasi.find((x) => x.ta_id === ta_id);
  if (j) j.tutup_wita = tutup_wita;
  else data.jendelaAlokasi.push({ ta_id, tutup_wita });
  recordAudit({ ta_id, entitas: `Jendela alokasi TA ${taById(ta_id)?.tahun}`, aksi: 'aksi_administratif', nilai_sesudah: `Ditutup ${tutup_wita} WITA` });
  return { ok: true };
}

// ===== Versi alokasi, append-only (ALK-07) =====

export function versiByTA(ta_id: string): VersiAlokasiAnggaran[] {
  return data.versiAlokasiAnggaran.filter((v) => v.ta_id === ta_id);
}

export function faseAktif(ta_id: string): FaseAlokasi {
  return taById(ta_id)?.mode_apbd_p ? 'perubahan' : 'murni';
}

function catatVersi(ta_id: string, aktor: AktorAnggaran, keterangan: string, fase: FaseAlokasi = faseAktif(ta_id)) {
  const rincian: RincianVersiAlokasi[] = [
    ...data.alokasiSubkegiatan.filter((a) => a.ta_id === ta_id).map((a) => ({ pemetaan_subkegiatan_id: a.pemetaan_subkegiatan_id, rekening_id: null, pagu: a.pagu })),
    ...data.alokasiRekening.filter((a) => a.ta_id === ta_id).map((a) => ({ pemetaan_subkegiatan_id: a.pemetaan_subkegiatan_id, rekening_id: a.rekening_id, pagu: a.pagu })),
  ];
  data.versiAlokasiAnggaran.push({
    id: `vaa-${data.versiAlokasiAnggaran.length + 1}`,
    ta_id,
    fase,
    tanggal_efektif: nowWita().slice(0, 10),
    aktor_id: aktor.id,
    aktor_nama_snapshot: aktor.nama,
    aktor_peran_snapshot: aktor.peran,
    keterangan,
    rincian,
  });
}

// ===== Alokasi subkegiatan oleh Bendahara (ALK-01) =====

export function simpanAlokasiSubkegiatanDemo(ta_id: string, pagu_per_pemetaan: Record<string, number>, aktor: AktorAnggaran): Hasil {
  const ta = taById(ta_id);
  if (!ta) return { ok: false, error: 'TA tidak ditemukan.' };
  if (aktor.peran !== 'bendahara') return { ok: false, error: 'Hanya Bendahara Pengeluaran yang dapat mengalokasikan pagu subkegiatan.' };
  if (ta.status === 'Arsip Read-Only' || ta.status === 'Masa Transisi') return { ok: false, error: 'Alokasi hanya dapat diubah pada TA yang belum disahkan.' };
  if (!jendelaTerbuka(ta_id)) return { ok: false, error: 'Jendela input alokasi tertutup. Bendahara perlu membuka kembali jendela waktu.' };
  if (sudahDisahkan(ta_id)) return { ok: false, error: 'Alokasi TA ini sudah disahkan dan tidak dapat diubah di Langkah 4.' };
  for (const [pemetaan_id, pagu] of Object.entries(pagu_per_pemetaan)) {
    if (!isBilanganBulat(pagu)) return { ok: false, error: 'Pagu harus bilangan bulat rupiah tanpa sen, dan tidak boleh negatif.' };
    if (!pemetaanOfTA(ta_id).some((p) => p.id === pemetaan_id)) return { ok: false, error: 'Subkegiatan tidak terpetakan pada TA ini.' };
    const terpakai = alokasiRekByPemetaan(pemetaan_id).reduce((s, a) => s + terpakaiAlokasi(a), 0);
    if (pagu < terpakai) {
      return { ok: false, error: `Pagu subkegiatan tidak boleh di bawah realisasi BKU dan komitmen kuitansi aktif (${formatRupiah(terpakai)}).` };
    }
  }
  for (const [pemetaan_id, pagu] of Object.entries(pagu_per_pemetaan)) {
    const existing = alokasiSubByPemetaan(pemetaan_id);
    if (existing) existing.pagu = pagu;
    else data.alokasiSubkegiatan.push({ id: `as-${ta_id}-${pemetaan_id}`, ta_id, pemetaan_subkegiatan_id: pemetaan_id, pagu });
  }
  hitungUlangInduk(ta_id);
  catatVersi(ta_id, aktor, 'Penyimpanan alokasi pagu subkegiatan');
  recordAudit({ ta_id, entitas: `Alokasi subkegiatan TA ${ta.tahun}`, aksi: 'aksi_administratif', nilai_sesudah: `Pagu Induk otomatis ${formatRupiah(paguIndukAktif(ta_id))}` });
  return { ok: true };
}

// ===== Alokasi rekening oleh PPTK (ALK-03) =====

export function simpanAlokasiRekeningDemo(
  ta_id: string,
  pemetaan_id: string,
  baris: { rekening_id: string; pagu: number }[],
  aktor: AktorAnggaran,
): Hasil {
  const ta = taById(ta_id);
  if (!ta) return { ok: false, error: 'TA tidak ditemukan.' };
  const pem = data.pemetaanSubkegiatanTA.find((p) => p.id === pemetaan_id && p.ta_id === ta_id);
  if (!pem) return { ok: false, error: 'Subkegiatan tidak ditemukan pada TA ini.' };
  if (aktor.peran !== 'pptk' || aktor.seksi_ta_id !== pem.seksi_ta_id) {
    return { ok: false, error: 'Hanya PPTK seksi pemilik subkegiatan ini yang dapat mengisi rekening belanja.' };
  }
  if (!jendelaTerbuka(ta_id)) return { ok: false, error: 'Jendela input alokasi tertutup. Hubungi Bendahara untuk membukanya kembali.' };
  if (alokasiRekByPemetaan(pemetaan_id).some((a) => a.disahkan)) return { ok: false, error: 'Alokasi subkegiatan ini sudah disahkan.' };
  const rekIds = new Set<string>();
  for (const b of baris) {
    if (!isBilanganBulat(b.pagu)) return { ok: false, error: 'Pagu rekening harus bilangan bulat rupiah tanpa sen, dan tidak boleh negatif.' };
    if (rekIds.has(b.rekening_id)) return { ok: false, error: 'Rekening yang sama tidak boleh muncul dua kali pada subkegiatan ini.' };
    rekIds.add(b.rekening_id);
    if (!data.masterRekeningBelanja.some((r) => r.id === b.rekening_id && r.status === 'Aktif')) {
      return { ok: false, error: 'Rekening belanja tidak ditemukan atau nonaktif.' };
    }
  }
  const lama = alokasiRekByPemetaan(pemetaan_id);
  for (const x of lama) {
    const terpakai = terpakaiAlokasi(x);
    const baru = baris.find((b) => b.rekening_id === x.rekening_id);
    if (!baru && terpakai > 0) {
      return { ok: false, error: `Rekening ${x.kode_rekening_snapshot} tidak dapat dihapus karena sudah ada realisasi atau komitmen.` };
    }
    if (baru && baru.pagu < terpakai) {
      return { ok: false, error: `Pagu ${x.kode_rekening_snapshot} tidak boleh di bawah realisasi BKU dan komitmen kuitansi aktif (${formatRupiah(terpakai)}).` };
    }
  }
  for (let i = data.alokasiRekening.length - 1; i >= 0; i--) {
    if (data.alokasiRekening[i].pemetaan_subkegiatan_id === pemetaan_id) data.alokasiRekening.splice(i, 1);
  }
  for (const b of baris) {
    const rek = data.masterRekeningBelanja.find((r) => r.id === b.rekening_id)!;
    const sebelumnya = lama.find((a) => a.rekening_id === b.rekening_id);
    data.alokasiRekening.push({
      id: sebelumnya?.id ?? `ar-${ta_id}-${pemetaan_id}-${b.rekening_id}`,
      ta_id,
      pemetaan_subkegiatan_id: pemetaan_id,
      rekening_id: b.rekening_id,
      kode_rekening_snapshot: rek.kode_rekening,
      nama_rekening_snapshot: rek.nama,
      pagu: b.pagu,
      disahkan: false,
      spd_aktif: sebelumnya?.spd_aktif ?? 0,
    });
  }
  catatVersi(ta_id, aktor, `Penyimpanan rekening belanja ${pem.kode_snapshot}`);
  return { ok: true };
}

export function rekeningPemetaan(pemetaan_id: string): AlokasiRekening[] {
  return alokasiRekByPemetaan(pemetaan_id);
}

// ===== Sahkan dan penerbitan SPD (ALK-05, ALK-06, SPD-04) =====

export function sahkanAlokasiDemo(ta_id: string, aktor: AktorAnggaran): Hasil {
  const ta = taById(ta_id);
  if (!ta) return { ok: false, error: 'TA tidak ditemukan.' };
  if (aktor.peran !== 'bendahara') return { ok: false, error: 'Hanya Bendahara Pengeluaran yang dapat menekan Sahkan.' };
  if (sudahDisahkan(ta_id)) return { ok: false, error: 'Alokasi TA ini sudah disahkan.' };
  if (data.alokasiSubkegiatan.filter((a) => a.ta_id === ta_id).reduce((t, a) => t + a.pagu, 0) <= 0) {
    return { ok: false, error: 'Belum ada pagu subkegiatan. Tempatkan subkegiatan pada seksi dan isi pagunya sebelum Sahkan.' };
  }
  const g = gerbangStatus(ta_id);
  if (g.seksiBelum.length > 0) {
    return { ok: false, error: `Seksi belum seimbang: ${g.seksiBelum.map((s) => s.nama).join(', ')}.` };
  }
  const rows = data.alokasiRekening.filter((x) => x.ta_id === ta_id);
  for (const a of rows) {
    const terpakai = terpakaiAlokasi(a);
    if (a.pagu < terpakai) {
      return { ok: false, error: `Pagu ${a.kode_rekening_snapshot} di bawah realisasi dan komitmen (${formatRupiah(terpakai)}). SPD tidak boleh diturunkan di bawah nilai itu.` };
    }
  }
  const perubahan = ta.mode_apbd_p;
  const waktu = nowWita();
  for (const a of rows) {
    const sebelum = a.spd_aktif;
    a.disahkan = true;
    a.spd_aktif = a.pagu;
    data.ledgerSPD.push({
      id: `ldg-${data.ledgerSPD.length + 1}`,
      ta_id,
      alokasi_rekening_id: a.id,
      jenis: perubahan ? 'penyesuaian_apbdp' : 'terbit',
      perubahan: a.spd_aktif - sebelum,
      spd_sesudah: a.spd_aktif,
      keterangan: perubahan ? 'SPD disesuaikan ke pagu APBD-P saat Sahkan ulang' : 'SPD terbit 100% pagu saat Sahkan',
      waktu,
      aktor_id: aktor.id,
      aktor_nama_snapshot: aktor.nama,
      aktor_peran_snapshot: aktor.peran,
      referensi: null,
    });
  }
  catatVersi(ta_id, aktor, perubahan ? 'Sahkan ulang pagu APBD-P dan penyesuaian SPD' : 'Pengesahan alokasi dan terbitnya SPD');
  recordAudit({
    ta_id,
    entitas: `TA ${ta.tahun}`,
    aksi: 'sahkan',
    nilai_sesudah: perubahan ? 'SPD disesuaikan ke pagu APBD-P' : 'SPD terbit 100% pagu disahkan',
  });
  return { ok: true };
}

// ===== Efisiensi dan kenaikan SPD (SPD-02) =====

function ubahSPD(
  alokasi_rekening_id: string,
  nilai: number,
  jenis: 'efisiensi' | 'kenaikan',
  keterangan: string,
  aktor: AktorAnggaran,
): Hasil {
  const a = data.alokasiRekening.find((x) => x.id === alokasi_rekening_id);
  if (!a) return { ok: false, error: 'Rekening belanja tidak ditemukan.' };
  if (aktor.peran !== 'bendahara') return { ok: false, error: 'Hanya Bendahara Pengeluaran yang dapat mengubah SPD.' };
  if (!a.disahkan) return { ok: false, error: 'SPD belum terbit atau sedang menunggu Sahkan ulang. Alokasi harus disahkan terlebih dahulu.' };
  if (!Number.isInteger(nilai) || nilai <= 0) return { ok: false, error: 'Nilai harus bilangan bulat rupiah lebih dari nol.' };
  const perubahan = jenis === 'efisiensi' ? -nilai : nilai;
  if (jenis === 'efisiensi') {
    const sisa = sisaSpdBebas(a);
    if (nilai > sisa) {
      return { ok: false, error: `Efisiensi ${formatRupiah(nilai)} melebihi Sisa SPD Bebas ${formatRupiah(sisa)}.` };
    }
  } else {
    if (!keterangan.trim()) return { ok: false, error: 'Kenaikan SPD wajib disertai alasan tertulis.' };
    if (a.spd_aktif + nilai > a.pagu) {
      return { ok: false, error: `Kenaikan melebihi pagu rekening. Batas maksimal ${formatRupiah(a.pagu - a.spd_aktif)}.` };
    }
  }
  a.spd_aktif += perubahan;
  const idLedger = `ldg-${data.ledgerSPD.length + 1}`;
  const entri: LedgerSPD = {
    id: idLedger,
    ta_id: a.ta_id,
    alokasi_rekening_id: a.id,
    jenis,
    perubahan,
    spd_sesudah: a.spd_aktif,
    keterangan: keterangan.trim(),
    waktu: nowWita(),
    aktor_id: aktor.id,
    aktor_nama_snapshot: aktor.nama,
    aktor_peran_snapshot: aktor.peran,
    referensi: idLedger,
  };
  data.ledgerSPD.push(entri);
  recordAudit({
    ta_id: a.ta_id,
    entitas: `SPD ${a.kode_rekening_snapshot} ${a.nama_rekening_snapshot}`,
    aksi: jenis === 'efisiensi' ? 'efisiensi_spd' : 'kenaikan_spd',
    nilai_sebelum: formatRupiah(a.spd_aktif - perubahan),
    nilai_sesudah: formatRupiah(a.spd_aktif),
    alasan: keterangan.trim() || null,
  });
  return { ok: true };
}

export function efisiensiSPDDemo(alokasi_rekening_id: string, nilai: number, keterangan: string, aktor: AktorAnggaran): Hasil {
  return ubahSPD(alokasi_rekening_id, nilai, 'efisiensi', keterangan, aktor);
}

export function naikkanSPDDemo(alokasi_rekening_id: string, nilai: number, alasan: string, aktor: AktorAnggaran): Hasil {
  return ubahSPD(alokasi_rekening_id, nilai, 'kenaikan', alasan, aktor);
}

// Bendahara mengisi SPD final yang diperlukan; selisih terhadap SPD aktif dicatat otomatis
// sebagai Efisiensi (turun) atau Kenaikan (naik) dengan aturan yang sama (SPD-02, SPD-03).
export function aturSPDFinalDemo(alokasi_rekening_id: string, spd_final: number, keterangan: string, aktor: AktorAnggaran): Hasil {
  const a = data.alokasiRekening.find((x) => x.id === alokasi_rekening_id);
  if (!a) return { ok: false, error: 'Rekening tidak ditemukan.' };
  if (!Number.isInteger(spd_final) || spd_final < 0) return { ok: false, error: 'SPD final harus bilangan bulat rupiah tanpa sen, dan tidak boleh negatif.' };
  const selisih = spd_final - a.spd_aktif;
  if (selisih === 0) return { ok: false, error: 'SPD final sama dengan SPD aktif. Tidak ada perubahan.' };
  return selisih < 0
    ? ubahSPD(alokasi_rekening_id, -selisih, 'efisiensi', keterangan, aktor)
    : ubahSPD(alokasi_rekening_id, selisih, 'kenaikan', keterangan, aktor);
}

export function nomorPergeseranBerikutnya(ta_id: string): string {
  const urut = data.ledgerSPD
    .filter((l) => l.ta_id === ta_id && l.jenis === 'pergeseran' && l.referensi)
    .reduce((maks, l) => Math.max(maks, Number(/^Pergeseran\/(\d{3})\//.exec(l.referensi ?? '')?.[1] ?? 0)), 0);
  return `Pergeseran/${String(urut + 1).padStart(3, '0')}/${taById(ta_id)?.tahun}`;
}

export function geserSPDDemo(
  ta_id: string,
  sumber_id: string,
  tujuan_id: string,
  nilai: number,
  alasan: string,
  aktor: AktorAnggaran,
): Hasil {
  if (aktor.peran !== 'bendahara') return { ok: false, error: 'Hanya Bendahara Pengeluaran yang dapat menggeser anggaran.' };
  const ta = taById(ta_id);
  if (!ta) return { ok: false, error: 'TA tidak ditemukan.' };
  if (ta.status !== 'Aktif Penuh') return { ok: false, error: 'Pergeseran hanya dapat dilakukan pada TA Aktif Penuh.' };
  if (!isBilanganBulat(nilai) || nilai <= 0) return { ok: false, error: 'Nilai pergeseran harus bilangan bulat rupiah lebih dari nol.' };
  if (sumber_id === tujuan_id) return { ok: false, error: 'Rekening sumber dan tujuan tidak boleh sama.' };
  const sumber = data.alokasiRekening.find((a) => a.id === sumber_id && a.ta_id === ta_id);
  const tujuan = data.alokasiRekening.find((a) => a.id === tujuan_id && a.ta_id === ta_id);
  if (!sumber || !tujuan) return { ok: false, error: 'Rekening sumber atau tujuan tidak ditemukan pada TA ini.' };
  if (!sumber.disahkan || !tujuan.disahkan) return { ok: false, error: 'Pergeseran hanya dapat dilakukan ke rekening yang alokasinya sudah disahkan.' };
  const sisa = sisaSpdBebas(sumber);
  if (nilai > sisa) return { ok: false, error: `Nilai melebihi Sisa SPD Bebas rekening sumber (${formatRupiah(sisa)}).` };

  const asSumber = alokasiSubByPemetaan(sumber.pemetaan_subkegiatan_id);
  const asTujuan = alokasiSubByPemetaan(tujuan.pemetaan_subkegiatan_id);
  if (!asSumber || !asTujuan) return { ok: false, error: 'Pagu subkegiatan belum dialokasikan pada TA ini.' };
  const antarSubkegiatan = sumber.pemetaan_subkegiatan_id !== tujuan.pemetaan_subkegiatan_id;
  if (antarSubkegiatan && asSumber.pagu < nilai) return { ok: false, error: 'Pagu subkegiatan sumber tidak cukup untuk nilai pergeseran ini.' };

  const nomor = nomorPergeseranBerikutnya(ta_id);
  const kodeSumber = sumber.kode_rekening_snapshot;
  const kodeTujuan = tujuan.kode_rekening_snapshot;
  sumber.pagu -= nilai;
  sumber.spd_aktif -= nilai;
  tujuan.pagu += nilai;
  tujuan.spd_aktif += nilai;
  if (antarSubkegiatan) {
    asSumber.pagu -= nilai;
    asTujuan.pagu += nilai;
  }
  const catatan = alasan.trim();
  for (const [rek, perubahan] of [[sumber, -nilai], [tujuan, nilai]] as const) {
    data.ledgerSPD.push({
      id: `ldg-${data.ledgerSPD.length + 1}`,
      ta_id,
      alokasi_rekening_id: rek.id,
      jenis: 'pergeseran',
      perubahan,
      spd_sesudah: rek.spd_aktif,
      keterangan: catatan,
      waktu: nowWita(),
      aktor_id: aktor.id,
      aktor_nama_snapshot: aktor.nama,
      aktor_peran_snapshot: aktor.peran,
      referensi: nomor,
    });
  }
  catatVersi(ta_id, aktor, `${nomor}: ${kodeSumber} (-) ke ${kodeTujuan} (+) ${formatRupiah(nilai)}`, 'pergeseran');
  recordAudit({
    ta_id,
    entitas: `${nomor} • ${formatRupiah(nilai)}`,
    aksi: 'pergeseran_spd',
    nilai_sebelum: `Sumber (-) ${kodeSumber}`,
    nilai_sesudah: `Tujuan (+) ${kodeTujuan}`,
    alasan: catatan || null,
  });
  return { ok: true };
}

// ===== APBD-P (TA-09) dan pembanding pagu murni (SPD-04) =====

export function aktifkanApbdPDemo(ta_id: string, _pagu: number, aktor: AktorAnggaran): Hasil {
  const ta = taById(ta_id);
  if (!ta) return { ok: false, error: 'TA tidak ditemukan.' };
  if (aktor.peran !== 'admin') return { ok: false, error: 'Hanya Admin yang dapat mengaktifkan APBD-P.' };
  if (ta.status !== 'Aktif Penuh') return { ok: false, error: 'APBD-P hanya dapat diaktifkan pada TA Aktif Penuh.' };
  if (ta.mode_apbd_p) return { ok: false, error: 'APBD-P pada TA ini sudah aktif.' };
  if (!sudahDisahkan(ta_id)) return { ok: false, error: 'Alokasi murni belum disahkan. APBD-P diaktifkan setelah Sahkan murni.' };
  ta.mode_apbd_p = true;
  for (const a of data.alokasiRekening.filter((x) => x.ta_id === ta_id)) a.disahkan = false;
  hitungUlangInduk(ta_id);
  const j = data.jendelaAlokasi.find((x) => x.ta_id === ta_id);
  if (j) j.tutup_wita = null;
  recordAudit({
    ta_id,
    entitas: `TA ${ta.tahun}`,
    aksi: 'alokasi_apbd_p',
    nilai_sebelum: `Pagu Induk ${formatRupiah(ta.pagu_induk)}`,
    nilai_sesudah: 'APBD-P diaktifkan; Pagu Induk mengikuti total pagu subkegiatan',
  });
  return { ok: true };
}

// Pagu Induk APBD-P dihitung otomatis; tidak ada lagi koreksi manual oleh Admin.
export function koreksiPaguApbdPDemo(_ta_id: string, _pagu: number, _aktor: AktorAnggaran): Hasil {
  return { ok: false, error: 'Pagu Induk APBD-P dihitung otomatis dari total pagu subkegiatan. Ubah pagu subkegiatan oleh Bendahara.' };
}

// ===== Penempatan subkegiatan ke seksi oleh Bendahara =====

function bolehUbahPenempatan(ta_id: string, aktor: AktorAnggaran): string | null {
  const ta = taById(ta_id);
  if (!ta) return 'TA tidak ditemukan.';
  if (aktor.peran !== 'bendahara') return 'Hanya Bendahara Pengeluaran yang dapat menempatkan subkegiatan ke seksi.';
  if (ta.status === 'Arsip Read-Only' || ta.status === 'Masa Transisi') return 'Subkegiatan tidak dapat diubah pada TA ini.';
  if (!jendelaTerbuka(ta_id)) return 'Jendela input alokasi tertutup. Bendahara perlu membuka kembali jendela waktu.';
  if (sudahDisahkan(ta_id)) return 'Alokasi TA ini sudah disahkan dan subkegiatan tidak dapat diubah.';
  return null;
}

export function tarikSubkegiatanDemo(ta_id: string, subkegiatan_ids: string[], aktor: AktorAnggaran): Hasil {
  const e = bolehUbahPenempatan(ta_id, aktor);
  if (e) return { ok: false, error: e };
  if (subkegiatan_ids.length === 0) return { ok: false, error: 'Pilih minimal satu subkegiatan.' };
  let n = 0;
  for (const id of subkegiatan_ids) {
    const sub = data.masterSubkegiatan.find((x) => x.id === id && x.status === 'Aktif');
    if (!sub) return { ok: false, error: 'Subkegiatan tidak ditemukan atau nonaktif.' };
    if (data.subkegiatanTA.some((x) => x.ta_id === ta_id && x.subkegiatan_id === id)) continue;
    data.subkegiatanTA.push({ id: `skt-${ta_id}-${id}`, ta_id, subkegiatan_id: id, kode_snapshot: sub.kode, nama_snapshot: sub.nama });
    n += 1;
  }
  recordAudit({ ta_id, entitas: 'Subkegiatan TA', aksi: 'aksi_administratif', nilai_sesudah: `Menarik ${n} subkegiatan dari kamus ke TA` });
  return { ok: true };
}

export function buangSubkegiatanDemo(ta_id: string, subkegiatan_id: string, aktor: AktorAnggaran): Hasil {
  const e = bolehUbahPenempatan(ta_id, aktor);
  if (e) return { ok: false, error: e };
  const i = data.subkegiatanTA.findIndex((x) => x.ta_id === ta_id && x.subkegiatan_id === subkegiatan_id);
  if (i < 0) return { ok: false, error: 'Subkegiatan tidak ada di TA ini.' };
  if (pemetaanOfTA(ta_id).some((p) => p.subkegiatan_id === subkegiatan_id)) return { ok: false, error: 'Subkegiatan ini masih terkait dengan seksi. Lepaskan dari seksi dulu.' };
  const [r] = data.subkegiatanTA.splice(i, 1);
  recordAudit({ ta_id, entitas: `Subkegiatan ${r.kode_snapshot}`, aksi: 'aksi_administratif', nilai_sebelum: 'Ada di TA', nilai_sesudah: 'Dibuang dari TA' });
  return { ok: true };
}

export function tempatkanSubkegiatanDemo(ta_id: string, seksi_ta_id: string, subkegiatan_id: string, aktor: AktorAnggaran): Hasil {
  const e = bolehUbahPenempatan(ta_id, aktor);
  if (e) return { ok: false, error: e };
  const seksi = data.seksiTA.find((x) => x.id === seksi_ta_id && x.ta_id === ta_id && x.status === 'Aktif');
  if (!seksi) return { ok: false, error: 'Seksi tidak ditemukan pada TA ini.' };
  const kolam = data.subkegiatanTA.find((x) => x.ta_id === ta_id && x.subkegiatan_id === subkegiatan_id);
  if (!kolam) return { ok: false, error: 'Tarik subkegiatan ke TA terlebih dahulu sebelum mengaitkannya ke seksi.' };
  if (pemetaanOfTA(ta_id).some((p) => p.subkegiatan_id === subkegiatan_id)) {
    return { ok: false, error: 'Subkegiatan ini sudah dimiliki seksi lain di TA ini. Satu subkegiatan hanya untuk satu seksi.' };
  }
  data.pemetaanSubkegiatanTA.push({ id: `pem-${ta_id}-${Date.now()}`, ta_id, seksi_ta_id, subkegiatan_id, kode_snapshot: kolam.kode_snapshot, nama_snapshot: kolam.nama_snapshot });
  recordAudit({ ta_id, entitas: `Subkegiatan ${kolam.kode_snapshot}`, aksi: 'aksi_administratif', nilai_sesudah: `Dikaitkan dengan seksi ${seksi.nama_snapshot}` });
  return { ok: true };
}

export function lepasSubkegiatanDemo(pemetaan_id: string, aktor: AktorAnggaran): Hasil {
  const p = data.pemetaanSubkegiatanTA.find((x) => x.id === pemetaan_id);
  if (!p) return { ok: false, error: 'Subkegiatan pada seksi tidak ditemukan.' };
  const e = bolehUbahPenempatan(p.ta_id, aktor);
  if (e) return { ok: false, error: e };
  if (data.kuitansi.some((k) => k.pemetaan_subkegiatan_id === pemetaan_id)) return { ok: false, error: 'Subkegiatan ini sudah dipakai kuitansi dan tidak dapat dihapus.' };
  if (data.ledgerSPD.some((l) => alokasiRekByPemetaan(pemetaan_id).some((a) => a.id === l.alokasi_rekening_id))) {
    return { ok: false, error: 'SPD subkegiatan ini sudah terbit dan tidak dapat dihapus. Nolkan pagunya bila tidak dipakai.' };
  }
  if (data.alokasiSubkegiatan.some((a) => a.pemetaan_subkegiatan_id === pemetaan_id && a.pagu > 0)) {
    return { ok: false, error: 'Subkegiatan ini sudah punya pagu. Nolkan pagunya dulu sebelum dilepas dari seksi.' };
  }
  const idxRek = (arr: { pemetaan_subkegiatan_id: string }[]) => { for (let i = arr.length - 1; i >= 0; i--) if (arr[i].pemetaan_subkegiatan_id === pemetaan_id) arr.splice(i, 1); };
  idxRek(data.alokasiRekening);
  idxRek(data.alokasiSubkegiatan);
  const i = data.pemetaanSubkegiatanTA.findIndex((x) => x.id === pemetaan_id);
  if (i >= 0) data.pemetaanSubkegiatanTA.splice(i, 1);
  hitungUlangInduk(p.ta_id);
  recordAudit({ ta_id: p.ta_id, entitas: `Subkegiatan ${p.kode_snapshot}`, aksi: 'aksi_administratif', nilai_sebelum: 'Pada seksi', nilai_sesudah: 'Dilepas dari seksi' });
  return { ok: true };
}

// Pagu murni per pasangan subkegiatan-rekening, dari versi 'murni' terakhir.
export function paguMurniByRekening(ta_id: string): Map<string, number> {
  const murniList = data.versiAlokasiAnggaran.filter((v) => v.ta_id === ta_id && v.fase === 'murni');
  const murni = murniList[murniList.length - 1];
  const peta = new Map<string, number>();
  for (const r of murni?.rincian ?? []) {
    if (r.rekening_id === null) continue;
    peta.set(`${r.pemetaan_subkegiatan_id}|${r.rekening_id}`, r.pagu);
  }
  return peta;
}

export function ledgerByTA(ta_id: string): LedgerSPD[] {
  return data.ledgerSPD.filter((l) => l.ta_id === ta_id);
}

export function alokasiRekeningByTA(ta_id: string): AlokasiRekening[] {
  return data.alokasiRekening.filter((x) => x.ta_id === ta_id);
}


// ===== Operasi tulis: mode demo memakai logika lokal di atas; mode server memanggil RPC Supabase (server.ts) =====
export const aturJendela = mut(aturJendelaDemo, server.aturJendela);
export const simpanAlokasiSubkegiatan = mut(simpanAlokasiSubkegiatanDemo, server.simpanAlokasiSubkegiatan);
export const simpanAlokasiRekening = mut(simpanAlokasiRekeningDemo, server.simpanAlokasiRekening);
export const sahkanAlokasi = mut(sahkanAlokasiDemo, server.sahkanAlokasi);
export const efisiensiSPD = mut(efisiensiSPDDemo, server.efisiensiSPD);
export const naikkanSPD = mut(naikkanSPDDemo, server.naikkanSPD);
export const aturSPDFinal = mut(aturSPDFinalDemo, server.aturSPDFinal);
export const geserSPD = mut(geserSPDDemo, server.geserSPD);
export const aktifkanApbdP = mut(aktifkanApbdPDemo, server.aktifkanApbdP);
export const koreksiPaguApbdP = mut(koreksiPaguApbdPDemo, server.koreksiPaguApbdP);
export const tempatkanSubkegiatan = mut(tempatkanSubkegiatanDemo, server.tempatkanSubkegiatan);
export const lepasSubkegiatan = mut(lepasSubkegiatanDemo, server.lepasSubkegiatan);
export const tarikSubkegiatan = mut(tarikSubkegiatanDemo, server.tarikSubkegiatan);
export const buangSubkegiatan = mut(buangSubkegiatanDemo, server.buangSubkegiatan);
