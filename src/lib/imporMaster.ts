// Pembaca berkas impor Master Personel & Master SOTK. Kolom dikenali dari judul di baris pertama (urutan bebas).
import { bacaTabel } from '@/lib/xlsxBaca';
import { pangkatBaku } from '@/data/pangkat';
import { todayWita } from '@/lib/wita';

export interface HasilBaca<T> { baris: T[]; nomorAsli: number[]; galat: { baris: number; pesan: string }[] }

export const KOLOM_PERSONEL = ['NIP', 'NIK', 'Gelar Depan', 'Nama', 'Gelar Belakang', 'Pangkat/Golongan', 'TMT', 'Nomor WhatsApp'];
export const KOLOM_SOTK = ['Nama Unit', 'TMT Mulai', 'Dasar Hukum'];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const SINONIM: Record<string, string[]> = {
  nip: ['nip'], nik: ['nik'], gelar_depan: ['gelardepan'], nama: ['nama', 'namatanpagelar'], gelar_belakang: ['gelarbelakang'],
  pangkat: ['pangkatgolongan', 'pangkat', 'golongan'], tmt: ['tmt', 'tmtpangkat'], no_whatsapp: ['nomorwhatsapp', 'nowhatsapp', 'whatsapp', 'nowa', 'nomorwa'],
  nama_unit: ['namaunit', 'unit', 'unitkerja'], tmt_mulai: ['tmtmulai', 'tmt'], dasar_hukum: ['dasarhukum'],
};

function petaKolom(judul: string[], butuh: string[], wajib: string[], label: Record<string, string>): Record<string, number> {
  const n = judul.map(norm); const peta: Record<string, number> = {};
  for (const k of butuh) { const i = n.findIndex((x) => SINONIM[k].includes(x)); if (i >= 0) peta[k] = i; }
  const hilang = wajib.filter((k) => peta[k] === undefined);
  if (hilang.length) throw new Error(`Kolom tidak ditemukan: ${hilang.map((k) => label[k]).join(', ')}. Baris pertama harus berisi judul kolom; unduh templat Excel.`);
  return peta;
}

/** Terima ISO, dd/mm/yyyy, dd-mm-yyyy, atau nomor seri Excel. Kosong → null. Tidak sah → undefined. */
export function bacaTanggal(v: string): string | null | undefined {
  const t = v.trim(); if (!t) return null;
  let y: number, m: number, d: number; let g: RegExpExecArray | null;
  if ((g = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(t))) { y = +g[1]; m = +g[2]; d = +g[3]; }
  else if ((g = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(t))) { d = +g[1]; m = +g[2]; y = +g[3]; }
  else if (/^\d{5}(\.\d+)?$/.test(t)) { const dt = new Date(Math.round((Number(t) - 25569) * 86400000)); y = dt.getUTCFullYear(); m = dt.getUTCMonth() + 1; d = dt.getUTCDate(); }
  else return undefined;
  const cek = new Date(Date.UTC(y, m - 1, d));
  if (cek.getUTCFullYear() !== y || cek.getUTCMonth() !== m - 1 || cek.getUTCDate() !== d) return undefined;
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export interface BarisPersonel { nip: string; nik: string; gelar_depan: string; nama: string; gelar_belakang: string; pangkat: string; tmt: string; no_whatsapp: string }
export interface BarisSOTK { nama_unit: string; tmt_mulai: string; dasar_hukum: string }

export async function bacaPersonel(file: File): Promise<HasilBaca<BarisPersonel>> {
  const t = await bacaTabel(file);
  if (!t.length) throw new Error('Berkas kosong.');
  const label = { nama: 'Nama', pangkat: 'Pangkat/Golongan', no_whatsapp: 'Nomor WhatsApp', nip: 'NIP', nik: 'NIK' };
  const pk = petaKolom(t[0], ['nip', 'nik', 'gelar_depan', 'nama', 'gelar_belakang', 'pangkat', 'tmt', 'no_whatsapp'], ['nama', 'pangkat', 'no_whatsapp'], label);
  if (pk.nip === undefined && pk.nik === undefined) throw new Error('Kolom NIP atau NIK harus ada.');
  const ambil = (r: string[], k: string) => (pk[k] === undefined ? '' : (r[pk[k]] ?? '').trim());
  const baris: BarisPersonel[] = []; const nomorAsli: number[] = []; const galat: { baris: number; pesan: string }[] = [];
  t.slice(1).forEach((r, i) => {
    if (r.every((x) => !(x ?? '').trim())) return;
    const tmt = bacaTanggal(ambil(r, 'tmt'));
    const b: BarisPersonel = { nip: ambil(r, 'nip'), nik: ambil(r, 'nik'), gelar_depan: ambil(r, 'gelar_depan'), nama: ambil(r, 'nama'), gelar_belakang: ambil(r, 'gelar_belakang'), pangkat: ambil(r, 'pangkat'), tmt: tmt ?? todayWita(), no_whatsapp: ambil(r, 'no_whatsapp').replace(/[\s-]/g, '') };
    baris.push(b); nomorAsli.push(i + 2);
    const n = baris.length;
    if (/e\+/i.test(b.nip) || /e\+/i.test(b.nik)) galat.push({ baris: n, pesan: 'NIP/NIK terbaca sebagai angka ilmiah. Format kolom sebagai Teks di Excel lalu isi ulang.' });
    else if (b.pangkat && !pangkatBaku(b.pangkat)) galat.push({ baris: n, pesan: `Pangkat/Golongan "${b.pangkat}" bukan pilihan baku. Salin persis dari daftar di formulir.` });
    if (tmt === undefined) galat.push({ baris: n, pesan: 'TMT tidak sah. Gunakan tanggal seperti 2026-01-31 atau 31/01/2026.' });
  });
  return { baris, nomorAsli, galat };
}

export async function bacaSOTK(file: File): Promise<HasilBaca<BarisSOTK>> {
  const t = await bacaTabel(file);
  if (!t.length) throw new Error('Berkas kosong.');
  const pk = petaKolom(t[0], ['nama_unit', 'tmt_mulai', 'dasar_hukum'], ['nama_unit'], { nama_unit: 'Nama Unit' });
  const ambil = (r: string[], k: string) => (pk[k] === undefined ? '' : (r[pk[k]] ?? '').trim());
  const baris: BarisSOTK[] = []; const nomorAsli: number[] = []; const galat: { baris: number; pesan: string }[] = [];
  t.slice(1).forEach((r, i) => {
    if (r.every((x) => !(x ?? '').trim())) return;
    const tmt = bacaTanggal(ambil(r, 'tmt_mulai'));
    baris.push({ nama_unit: ambil(r, 'nama_unit'), tmt_mulai: tmt ?? todayWita(), dasar_hukum: ambil(r, 'dasar_hukum') }); nomorAsli.push(i + 2);
    if (tmt === undefined) galat.push({ baris: baris.length, pesan: 'TMT mulai tidak sah. Gunakan tanggal seperti 2026-01-31 atau 31/01/2026.' });
  });
  return { baris, nomorAsli, galat };
}
