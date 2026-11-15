// TPL-02 / BNT-02 — aturan Form Dinamis yang murni (tanpa state), dipakai repo dan UI.
import type { FieldFormDinamis, BlokBerulangFormDinamis, SystemTag } from '@/data/types';

export const TAG_SISTEM: SystemTag[] = ['[SYS_PERSONNEL_ID]', '[SYS_PERSONNEL_NAME]', '[SYS_START_DATE]', '[SYS_END_DATE]'];

/** Nama tag sistem yang mudah dipahami Admin (kode tetap disimpan di data). */
export const TAG_SISTEM_LABEL: Record<NonNullable<SystemTag>, string> = {
  '[SYS_PERSONNEL_ID]': 'NIP/NIK (nama terisi otomatis bila sudah dikenal)',
  '[SYS_PERSONNEL_NAME]': 'Nama (mengikuti NIP/NIK)',
  '[SYS_START_DATE]': 'Tanggal mulai tugas',
  '[SYS_END_DATE]': 'Tanggal selesai tugas',
};
export const TAG_SISTEM_SINGKAT: Record<NonNullable<SystemTag>, string> = {
  '[SYS_PERSONNEL_ID]': 'NIP/NIK',
  '[SYS_PERSONNEL_NAME]': 'Nama',
  '[SYS_START_DATE]': 'Tanggal mulai',
  '[SYS_END_DATE]': 'Tanggal selesai',
};

export const TIPE_FIELD_LABEL: Record<FieldFormDinamis['tipe'], string> = {
  teks: 'Jawaban singkat',
  area: 'Paragraf',
  angka: 'Angka',
  pilihan: 'Pilihan ganda',
  kotak: 'Kotak centang',
  dropdown: 'Drop-down',
  skala: 'Skala linier',
  rating: 'Rating',
  kisi_pilihan: 'Kisi pilihan ganda',
  kisi_kotak: 'Petak kotak centang',
  tanggal: 'Tanggal',
  waktu: 'Waktu',
  file: 'Upload file (lama)',
};

/** Urutan dan pengelompokan di pemilih tipe, mengikuti Google Formulir. File lama tidak ditawarkan untuk field baru. */
export const KELOMPOK_TIPE: { tipe: FieldFormDinamis['tipe'][] }[] = [
  { tipe: ['teks', 'area', 'angka'] },
  { tipe: ['pilihan', 'kotak', 'dropdown'] },
  { tipe: ['skala', 'rating'] },
  { tipe: ['kisi_pilihan', 'kisi_kotak'] },
  { tipe: ['tanggal', 'waktu'] },
];

export const TIPE_BERPILIHAN: FieldFormDinamis['tipe'][] = ['pilihan', 'kotak', 'dropdown'];
export const TIPE_KISI: FieldFormDinamis['tipe'][] = ['kisi_pilihan', 'kisi_kotak'];

// Semua jawaban disimpan sebagai teks. Pemisah ini tidak boleh ada di dalam teks pilihan/baris/kolom.
export const PEMISAH_DILARANG = /[;:|]/;

export function pisahDaftar(v: string): string[] {
  return v ? v.split('; ').filter((x) => x !== '') : [];
}
export function gabungDaftar(a: string[]): string {
  return a.join('; ');
}
/** Kisi: "Baris A: Kolom 1 | Kolom 2; Baris B: Kolom 3". */
export function bacaKisi(v: string): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const bagian of pisahDaftar(v)) {
    const i = bagian.indexOf(': ');
    if (i < 0) continue;
    out[bagian.slice(0, i)] = bagian.slice(i + 2).split(' | ').filter((x) => x !== '');
  }
  return out;
}
export function tulisKisi(m: Record<string, string[]>, baris: string[]): string {
  return gabungDaftar(baris.filter((b) => (m[b] ?? []).length > 0).map((b) => `${b}: ${m[b].join(' | ')}`));
}

export const SKALA_MIN_PILIHAN = [0, 1];
export function rentangSkala(f: FieldFormDinamis): number[] {
  const min = f.skala_min === 0 ? 0 : 1;
  const maks = Math.min(10, Math.max(min + 1, f.skala_maks ?? 5));
  return Array.from({ length: maks - min + 1 }, (_, i) => min + i);
}
export function maksRating(f: FieldFormDinamis): number {
  return Math.min(10, Math.max(3, f.skala_maks ?? 5));
}

function cekDaftar(nama: string, label: string, a: string[] | undefined, min: number): string | null {
  const d = (a ?? []).map((x) => x.trim());
  if (d.length < min) return `Field "${label}": ${nama} minimal ${min}.`;
  if (d.some((x) => x === '')) return `Field "${label}": ${nama} tidak boleh kosong.`;
  if (d.some((x) => PEMISAH_DILARANG.test(x))) return `Field "${label}": ${nama} tidak boleh memuat tanda ; : atau |.`;
  if (new Set(d.map((x) => x.toLowerCase())).size !== d.length) return `Field "${label}": ${nama} tidak boleh ada yang sama.`;
  return null;
}

/** Aturan isi per tipe field. Server menyimpan field apa adanya, jadi aturan ini dijaga di sisi aplikasi. */
export function validasiFieldForm(fields: FieldFormDinamis[]): string | null {
  for (const f of fields) {
    const l = f.label.trim() || '(tanpa label)';
    if (TIPE_BERPILIHAN.includes(f.tipe)) { const e = cekDaftar('pilihan', l, f.opsi, 1); if (e) return e; }
    if (TIPE_KISI.includes(f.tipe)) {
      const e = cekDaftar('baris', l, f.baris, 1) ?? cekDaftar('kolom', l, f.kolom, 2);
      if (e) return e;
    }
    if (f.tipe === 'skala') {
      if (f.skala_min !== undefined && f.skala_min !== 0 && f.skala_min !== 1) return `Field "${l}": skala dimulai dari 0 atau 1.`;
      const maks = f.skala_maks ?? 5;
      if (!Number.isInteger(maks) || maks < 2 || maks > 10) return `Field "${l}": akhir skala antara 2 dan 10.`;
    }
    if (f.tipe === 'rating') {
      const maks = f.skala_maks ?? 5;
      if (!Number.isInteger(maks) || maks < 3 || maks > 10) return `Field "${l}": jumlah bintang antara 3 dan 10.`;
    }
  }
  return null;
}

// BNT-02 — ID dan nama harus berpasangan dalam konteks yang sama; tiap tag hanya sekali per konteks.
export function validasiTagSistem(fields: FieldFormDinamis[], blok: BlokBerulangFormDinamis | null): string | null {
  const konteks: [string, FieldFormDinamis[]][] = [['field utama', fields]];
  if (blok) konteks.push([`blok "${blok.nama}"`, blok.fields]);
  for (const [nama, daftar] of konteks) {
    const tags = daftar.map((f) => f.system_tag).filter((t): t is Exclude<SystemTag, null> => t !== null);
    const duplikat = tags.find((t, i) => tags.indexOf(t) !== i);
    if (duplikat) return `Tag ${duplikat} hanya boleh dipakai sekali dalam ${nama}.`;
    const adaId = tags.includes('[SYS_PERSONNEL_ID]');
    const adaNama = tags.includes('[SYS_PERSONNEL_NAME]');
    if (adaId !== adaNama) {
      return `[SYS_PERSONNEL_ID] dan [SYS_PERSONNEL_NAME] harus dipasangkan dalam ${nama} yang sama.`;
    }
  }
  return null;
}

export function versiBerikutnya(versi: string | undefined): string {
  const n = versi ? parseInt(versi.replace(/^v/, ''), 10) : 0;
  return `v${(Number.isFinite(n) ? n : 0) + 1}`;
}
