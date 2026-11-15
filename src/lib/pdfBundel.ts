// Bundel PDF arsip BKU (Pilar 02 §1): halaman 1 = Lembar Hasil Verifikasi SPJ (hitam-putih, QR keaslian),
// halaman 2 dst = lampiran bukti SPJ yang diunggah PPTK. Lembar Kuitansi tidak disertakan.
// Dirakit di peramban dengan pdf-lib (dimuat malas agar tidak membebani muat awal aplikasi).
import { qrModul } from '@/lib/qr';
import type { TemplateVerifikasi } from '@/data/types';

export interface DataLembar {
  nomor_bku: string;
  nomor_verifikasi: string | null;
  token: string | null;
  tanggal_verifikasi: string | null;
  verifikator_nama: string | null;
  verifikator_nip: string | null;
  tahun: string;
  seksi: string;
  subkegiatan: string;
  kode_rekening: string;
  uraian: string;
  jenis_belanja: string;
  penerima: string;
  bruto: number;
  rekening_penerima: { account_name: string; bank_name: string; account_number: string }[];
  rincian_pajak: { nama: string; nominal: number }[];
}
export interface HasilBundel { bytes: Uint8Array; lampiranMenyatu: boolean; catatan?: string }

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
function tgl(iso: string | null): string {
  if (!iso) return '-';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${d} ${BULAN[(m ?? 1) - 1] ?? ''} ${y}`;
}
function rp(n: number): string { return 'Rp ' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }

/** Huruf standar PDF (WinAnsi) tidak memuat semua karakter: ganti yang umum, buang sisanya. */
function aman(s: string): string {
  return s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/•/g, '*').replace(/✓/g, 'v')
    .replace(/[\r\n\t]+/g, ' ').replace(/[^\x20-\x7E\xA0-\xFF]/g, '?');
}

const A4: [number, number] = [595.28, 841.89];
const M = 40;

type FontPdf = { widthOfTextAtSize(t: string, s: number): number };
function bungkus(teks: string, font: FontPdf, ukuran: number, lebar: number): string[] {
  const kata = aman(teks).split(' ').filter(Boolean);
  const baris: string[] = []; let cur = '';
  for (const k of kata) {
    const coba = cur ? `${cur} ${k}` : k;
    if (font.widthOfTextAtSize(coba, ukuran) <= lebar) { cur = coba; continue; }
    if (cur) baris.push(cur);
    // kata tunggal lebih lebar dari kolom: potong paksa
    let sisa = k;
    while (font.widthOfTextAtSize(sisa, ukuran) > lebar && sisa.length > 1) {
      let n = sisa.length - 1; while (n > 1 && font.widthOfTextAtSize(sisa.slice(0, n), ukuran) > lebar) n--;
      baris.push(sisa.slice(0, n)); sisa = sisa.slice(n);
    }
    cur = sisa;
  }
  if (cur) baris.push(cur);
  return baris.length ? baris : [''];
}

function jenisGambar(b: Uint8Array): 'png' | 'jpg' | null {
  if (b.length > 4 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'png';
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8) return 'jpg';
  return null;
}

export async function bangunBundel(d: DataLembar, tpl: TemplateVerifikasi, urlKeaslian: string | null, lampiran: Uint8Array | null, logo: Uint8Array | null, stempel: Uint8Array | null): Promise<HasilBundel> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const doc = await PDFDocument.create();
  doc.setTitle(`Arsip BKU ${aman(d.nomor_bku)}`);
  doc.setProducer('AMANDA'); doc.setCreator('AMANDA');
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const tebal = await doc.embedFont(StandardFonts.HelveticaBold);
  const miring = await doc.embedFont(StandardFonts.HelveticaOblique);
  const mono = await doc.embedFont(StandardFonts.Courier);
  const serif = await doc.embedFont(StandardFonts.TimesRomanBold);
  const pg = doc.addPage(A4);
  const W = A4[0]; const H = A4[1]; const isi = W - 2 * M;
  const hitam = rgb(0, 0, 0); const abu = rgb(0.27, 0.27, 0.27);
  const garis = (x1: number, y1: number, x2: number, y2: number, t = 0.8) => pg.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: t, color: hitam });
  const kotak = (x: number, y: number, w: number, h: number, t = 0.8) => pg.drawRectangle({ x, y, width: w, height: h, borderColor: hitam, borderWidth: t });
  const teks = (s: string, x: number, y: number, f: typeof reg, size: number, warna = hitam) => pg.drawText(aman(s), { x, y, font: f, size, color: warna });
  const tengah = (s: string, cx: number, y: number, f: typeof reg, size: number) => teks(s, cx - f.widthOfTextAtSize(aman(s), size) / 2, y, f, size);
  const kanan = (s: string, xr: number, y: number, f: typeof reg, size: number) => teks(s, xr - f.widthOfTextAtSize(aman(s), size), y, f, size);

  let y = H - M;
  // ----- Kepala surat -----
  let xTeks = M; let lebarTeks = isi;
  if (logo) {
    const jenis = jenisGambar(logo);
    if (jenis) {
      try {
        const img = jenis === 'png' ? await doc.embedPng(logo) : await doc.embedJpg(logo);
        const sk = 50 / img.height; pg.drawImage(img, { x: M, y: y - 50, width: img.width * sk, height: 50 });
        xTeks = M + img.width * sk + 8; lebarTeks = isi - (xTeks - M) - (img.width * sk + 8);
      } catch { /* logo rusak: lanjut tanpa logo */ }
    }
  }
  const cx = xTeks + lebarTeks / 2;
  let yy = y - 14;
  for (const b of bungkus(tpl.nama_instansi.toUpperCase(), serif, 14, lebarTeks)) { tengah(b, cx, yy, serif, 14); yy -= 16; }
  for (const b of bungkus(tpl.subjudul, reg, 9.5, lebarTeks)) { tengah(b, cx, yy, reg, 9.5); yy -= 11; }
  y = Math.min(yy, y - 52) - 4;
  garis(M, y, W - M, y, 1.6); garis(M, y - 3, W - M, y - 3, 0.6);
  y -= 24;
  tengah(tpl.judul_dokumen.toUpperCase(), W / 2, y, tebal, 12.5); y -= 14;

  // ----- Pita status + nomor -----
  kotak(M, y - 22, isi, 22, 1.2);
  teks('TERVERIFIKASI', M + 10, y - 15, tebal, 10);
  const noVer = d.nomor_verifikasi ?? '-';
  kanan(noVer, W - M - 10, y - 15, mono, 11);
  kanan(`${tpl.label_nomor}:`, W - M - 10 - mono.widthOfTextAtSize(aman(noVer), 11) - 6, y - 14.5, reg, 8.5);
  y -= 22 + 10;

  if (tpl.teks_pembuka) {
    for (const b of bungkus(tpl.teks_pembuka, reg, 9.5, isi - 20)) { teks(b, M + 20, y - 9, reg, 9.5); y -= 12; }
    y -= 6;
  }

  // ----- Rincian pembayaran -----
  const barisRinci: [string, string, boolean, boolean][] = [
    [`Tahun Anggaran / ${tpl.label_seksi}`, `${d.tahun} - ${d.seksi}`, false, false],
    [tpl.label_subkegiatan, d.subkegiatan, false, false],
    [tpl.label_rekening, d.kode_rekening, false, true],
    [tpl.label_uraian, d.uraian, false, false],
    [tpl.label_bruto, rp(d.bruto), true, true],
  ];
  const wLabel = 150; const wNilai = isi - 24 - wLabel - 10;
  const potong = barisRinci.map(([, v, t, m]) => bungkus(v, m ? mono : t ? tebal : reg, 9.5, wNilai));
  const hRinci = potong.reduce((a, b) => a + Math.max(1, b.length) * 12.5, 0) + 12.5 + 14;
  kotak(M, y - hRinci, isi, hRinci);
  let ry = y - 14;
  barisRinci.forEach(([label, , t, m], i) => {
    teks(label, M + 12, ry, reg, 9.5, abu); teks(':', M + 12 + wLabel, ry, reg, 9.5);
    for (const l of potong[i]) { teks(l, M + 12 + wLabel + 10, ry, m ? mono : t ? tebal : reg, 9.5); ry -= 12.5; }
  });
  teks('Terbilang', M + 12, ry, reg, 9.5, abu); teks(':', M + 12 + wLabel, ry, reg, 9.5);
  const terb = terbilangId(d.bruto);
  const barisTerb = bungkus(terb, miring, 9.5, wNilai);
  // tinggi kotak sudah menyisakan satu baris; tambah bila terbilang lebih dari satu baris
  let tinggiExtra = 0;
  barisTerb.forEach((l, i) => { teks(l, M + 12 + wLabel + 10, ry - i * 12.5, miring, 9.5); });
  if (barisTerb.length > 1) tinggiExtra = (barisTerb.length - 1) * 12.5;
  y -= hRinci + tinggiExtra + 12;

  // ----- Dua kolom: pengesahan (QR) | penerima dan perhitungan -----
  const wKiri = isi * 0.34; const xKanan = M + wKiri;
  // kolom kanan: ukur dulu
  const aKanan: { t: string; f: typeof reg; s: number; x: number; kanan?: string; garisAtas?: boolean }[] = [];
  aKanan.push({ t: tpl.label_penerima, f: tebal, s: 9.5, x: 12 });
  const rek = d.rekening_penerima.length ? d.rekening_penerima : [{ account_name: d.penerima, bank_name: '-', account_number: '-' }];
  for (const r of rek) {
    aKanan.push({ t: `Nama : ${r.account_name}`, f: reg, s: 9, x: 12 }); aKanan.push({ t: `Bank : ${r.bank_name}`, f: reg, s: 9, x: 12 }); aKanan.push({ t: `No. Rekening : ${r.account_number}`, f: mono, s: 9, x: 12 });
  }
  const totalPajak = d.rincian_pajak.reduce((a, p) => a + p.nominal, 0);
  const hKananTeks = aKanan.length * 12.5 + 8 + 12.5 * (4 + Math.max(1, d.rincian_pajak.length)) + 30;
  const hKolom = Math.max(hKananTeks, 262);
  kotak(M, y - hKolom, isi, hKolom); garis(xKanan, y, xKanan, y - hKolom);
  // kiri
  let ky = y - 16;
  tengah(tpl.label_tanggal.toUpperCase(), M + wKiri / 2, ky, reg, 7.5); ky -= 13;
  tengah(tgl(d.tanggal_verifikasi), M + wKiri / 2, ky, tebal, 10); ky -= 10;
  const qrUkuran = 112; const qx = M + (wKiri - qrUkuran) / 2; const qy = ky - qrUkuran - 6;
  kotak(qx - 4, qy - 4, qrUkuran + 8, qrUkuran + 8, 0.8);
  if (urlKeaslian) {
    const mtx = qrModul(urlKeaslian); const n = mtx.length; const sel = qrUkuran / n;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (mtx[r][c]) pg.drawRectangle({ x: qx + c * sel, y: qy + qrUkuran - (r + 1) * sel, width: sel + 0.15, height: sel + 0.15, color: hitam });
  } else tengah('(QR tidak tersedia)', M + wKiri / 2, qy + qrUkuran / 2, miring, 8);
  ky = qy - 16;
  tengah(tpl.label_nomor, M + wKiri / 2, ky, reg, 7.5); ky -= 11;
  tengah(noVer, M + wKiri / 2, ky, mono, 9.5);
  ky -= 6;
  if (stempel) {
    const jenis = jenisGambar(stempel);
    if (jenis) {
      try {
        const img = jenis === 'png' ? await doc.embedPng(stempel) : await doc.embedJpg(stempel);
        const sk = 52 / img.height; pg.drawImage(img, { x: M + wKiri / 2 - (img.width * sk) / 2, y: ky - 50, width: img.width * sk, height: 52, opacity: 0.85 });
      } catch { /* stempel rusak: lewati */ }
    }
  }
  ky -= 58;
  tengah(tpl.label_verifikator, M + wKiri / 2, ky, reg, 7.5); ky -= 12;
  const nm = aman(d.verifikator_nama ?? '-');
  tengah(nm, M + wKiri / 2, ky, tebal, 9.5);
  const wn = tebal.widthOfTextAtSize(nm, 9.5); garis(M + wKiri / 2 - wn / 2, ky - 2, M + wKiri / 2 + wn / 2, ky - 2, 0.6);
  ky -= 12; tengah(`NIP. ${d.verifikator_nip ?? '-'}`, M + wKiri / 2, ky, reg, 8.5);
  // kanan
  let py = y - 16;
  for (const a of aKanan) { teks(a.t, xKanan + a.x, py, a.f, a.s); py -= 12.5; }
  py -= 4; garis(xKanan, py + 8, M + isi, py + 8);
  const barisUang = (label: string, nilai: string, f: typeof reg, s: number, indent = 12) => { teks(label, xKanan + indent, py, f, s); kanan(nilai, M + isi - 12, py, f === tebal ? tebal : mono, s); py -= 12.5; };
  barisUang('Jumlah yang diminta', rp(d.bruto), tebal, 9.5);
  teks(tpl.label_pajak, xKanan + 12, py, tebal, 9.5); py -= 12.5;
  if (d.rincian_pajak.length === 0) { teks('Tidak ada potongan pajak', xKanan + 24, py, reg, 9, abu); py -= 12.5; }
  for (const p of d.rincian_pajak) barisUang(p.nama, rp(p.nominal), reg, 9, 24);
  garis(xKanan + 12, py + 8, M + isi - 12, py + 8, 0.6);
  barisUang(tpl.label_total_pajak, rp(totalPajak), reg, 9);
  py -= 3; garis(xKanan + 12, py + 9, M + isi - 12, py + 9, 1.2);
  barisUang(tpl.label_dibayarkan, rp(d.bruto - totalPajak), tebal, 10.5);
  garis(xKanan + 12, py + 8, M + isi - 12, py + 8, 1.2); garis(xKanan + 12, py + 6, M + isi - 12, py + 6, 0.6);
  kanan('Jumlah yang diminta dikurangi total pajak', M + isi - 12, py - 2, miring, 7.5);
  y -= hKolom + 14;

  // ----- Jenis belanja dan catatan -----
  const jb = aman(d.jenis_belanja || '-').toUpperCase(); const wjb = tebal.widthOfTextAtSize(jb, 9.5) + 20;
  kotak(M, y - 18, wjb, 18); teks(jb, M + 10, y - 13, tebal, 9.5);
  y -= 18 + 16;
  garis(M, y, W - M, y, 0.6); y -= 13;
  for (const t of [tpl.teks_qr, tpl.teks_penutup]) if (t) for (const b of bungkus(t, reg, 8, isi)) { tengah(b, W / 2, y, reg, 8); y -= 10; }
  teks(`Arsip BKU ${d.nomor_bku}`, M, M - 14 < 12 ? 12 : M - 14, reg, 7, abu);

  // ----- Gabung lampiran -----
  let lampiranMenyatu = false; let catatan: string | undefined;
  if (lampiran) {
    try {
      const src = await PDFDocument.load(lampiran, { ignoreEncryption: true });
      const hal = await doc.copyPages(src, src.getPageIndices());
      hal.forEach((p) => doc.addPage(p));
      lampiranMenyatu = true;
    } catch { catatan = 'Lampiran tidak dapat digabung (berkas rusak atau terkunci); hanya Lembar Verifikasi yang dimuat.'; }
  } else catatan = 'Lampiran SPJ tidak tersedia; hanya Lembar Verifikasi yang dimuat.';
  return { bytes: await doc.save(), lampiranMenyatu, catatan };
}

// Terbilang singkat bahasa Indonesia (cukup untuk nilai rupiah bulat).
function terbilangId(n: number): string {
  const sat = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
  const f = (x: number): string => {
    if (x < 12) return sat[x];
    if (x < 20) return `${sat[x - 10]} belas`;
    if (x < 100) return `${sat[Math.floor(x / 10)]} puluh${x % 10 ? ' ' + sat[x % 10] : ''}`;
    if (x < 200) return `seratus${x - 100 ? ' ' + f(x - 100) : ''}`;
    if (x < 1000) return `${sat[Math.floor(x / 100)]} ratus${x % 100 ? ' ' + f(x % 100) : ''}`;
    if (x < 2000) return `seribu${x - 1000 ? ' ' + f(x - 1000) : ''}`;
    if (x < 1e6) return `${f(Math.floor(x / 1000))} ribu${x % 1000 ? ' ' + f(x % 1000) : ''}`;
    if (x < 1e9) return `${f(Math.floor(x / 1e6))} juta${x % 1e6 ? ' ' + f(x % 1e6) : ''}`;
    if (x < 1e12) return `${f(Math.floor(x / 1e9))} miliar${x % 1e9 ? ' ' + f(x % 1e9) : ''}`;
    return `${f(Math.floor(x / 1e12))} triliun${x % 1e12 ? ' ' + f(x % 1e12) : ''}`;
  };
  const v = Math.round(n);
  return v === 0 ? 'nol rupiah' : `${f(v)} rupiah`;
}
