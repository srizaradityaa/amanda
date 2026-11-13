// Kamus pangkat/golongan baku (format penulisan seragam). Tetap, mengikuti peraturan kepegawaian;
// tidak dapat diubah dari aplikasi agar penulisan tidak kembali beragam.

const PNS: [string, string][] = [
  ['Juru Muda', 'I/a'], ['Juru Muda Tk. I', 'I/b'], ['Juru', 'I/c'], ['Juru Tk. I', 'I/d'],
  ['Pengatur Muda', 'II/a'], ['Pengatur Muda Tk. I', 'II/b'], ['Pengatur', 'II/c'], ['Pengatur Tk. I', 'II/d'],
  ['Penata Muda', 'III/a'], ['Penata Muda Tk. I', 'III/b'], ['Penata', 'III/c'], ['Penata Tk. I', 'III/d'],
  ['Pembina', 'IV/a'], ['Pembina Tk. I', 'IV/b'], ['Pembina Utama Muda', 'IV/c'], ['Pembina Utama Madya', 'IV/d'], ['Pembina Utama', 'IV/e'],
];

const ROMAWI = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII'];

export const KELOMPOK_PANGKAT: { label: string; nilai: string[] }[] = [
  { label: 'PNS', nilai: PNS.map(([p, g]) => `${p} (${g})`) },
  { label: 'PPPK', nilai: ROMAWI.map((r) => `PPPK Gol. ${r}`) },
  { label: 'Lainnya', nilai: ['Non-ASN'] },
];

export const SEMUA_PANGKAT: string[] = KELOMPOK_PANGKAT.flatMap((k) => k.nilai);

export function pangkatBaku(p: string): boolean { return SEMUA_PANGKAT.includes(p); }
