// Pembaca tabel sederhana dari berkas .xlsx atau .csv tanpa pustaka luar (kontainer ZIP + DecompressionStream bawaan peramban).
// Hanya membaca lembar pertama; sel dibaca sebagai teks (kode seperti "5.1.02.01" atau nol di depan tidak diubah jadi angka bila disimpan sebagai teks).

const dec = new TextDecoder('utf-8');

async function inflasi(data: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream('deflate-raw');
  const w = ds.writable.getWriter();
  void w.write(data as unknown as BufferSource); void w.close();
  return new Uint8Array(await new Response(ds.readable).arrayBuffer());
}

async function bacaZip(buf: Uint8Array): Promise<Map<string, Uint8Array>> {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('Berkas bukan Excel (.xlsx) yang sah.');
  const jumlah = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true);
  const hasil = new Map<string, Uint8Array>();
  for (let n = 0; n < jumlah; n++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const metode = dv.getUint16(p + 10, true);
    const ukuranTerkompres = dv.getUint32(p + 20, true);
    const lenNama = dv.getUint16(p + 28, true), lenEx = dv.getUint16(p + 30, true), lenKom = dv.getUint16(p + 32, true);
    const lokal = dv.getUint32(p + 42, true);
    const nama = dec.decode(buf.subarray(p + 46, p + 46 + lenNama));
    p += 46 + lenNama + lenEx + lenKom;
    if (!/^xl\/(sharedStrings\.xml|worksheets\/sheet\d+\.xml)$/.test(nama)) continue;
    const mulai = lokal + 30 + dv.getUint16(lokal + 26, true) + dv.getUint16(lokal + 28, true);
    const mentah = buf.subarray(mulai, mulai + ukuranTerkompres);
    hasil.set(nama, metode === 0 ? mentah : metode === 8 ? await inflasi(mentah) : new Uint8Array());
  }
  return hasil;
}

const unesc = (s: string) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d))).replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&amp;/g, '&');
const teksNode = (xml: string) => unesc([...xml.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((m) => m[1]).join(''));
const kolomKeIndeks = (ref: string) => { let n = 0; for (const c of ref.replace(/[^A-Z]/gi, '').toUpperCase()) n = n * 26 + c.charCodeAt(0) - 64; return n - 1; };

async function bacaXlsx(buf: Uint8Array): Promise<string[][]> {
  const zip = await bacaZip(buf);
  const lembar = [...zip.keys()].filter((k) => k.includes('worksheets/')).sort((a, b) => parseInt(a.replace(/\D/g, '')) - parseInt(b.replace(/\D/g, '')))[0];
  if (!lembar) throw new Error('Tidak ada lembar kerja pada berkas.');
  const ss = zip.get('xl/sharedStrings.xml');
  const bersama = ss ? [...dec.decode(ss).matchAll(/<si[^>]*>([\s\S]*?)<\/si>/g)].map((m) => teksNode(m[1])) : [];
  const xml = dec.decode(zip.get(lembar));
  const baris: string[][] = [];
  for (const rm of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const sel: string[] = [];
    for (const cm of rm[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attr = cm[1], isi = cm[2] ?? '';
      const ref = /r="([A-Z]+\d+)"/.exec(attr)?.[1];
      const tipe = /t="(\w+)"/.exec(attr)?.[1];
      const v = /<v>([\s\S]*?)<\/v>/.exec(isi)?.[1] ?? '';
      const nilai = tipe === 's' ? (bersama[Number(v)] ?? '') : tipe === 'inlineStr' ? teksNode(isi) : unesc(v);
      sel[ref ? kolomKeIndeks(ref) : sel.length] = nilai;
    }
    baris.push(Array.from(sel, (x) => x ?? ''));
  }
  return baris;
}

function bacaCsv(teks: string): string[][] {
  const t = teks.replace(/^\uFEFF/, '');
  const pemisah = (t.split('\n')[0].match(/;/g)?.length ?? 0) > (t.split('\n')[0].match(/,/g)?.length ?? 0) ? ';' : ',';
  const baris: string[][] = []; let sel = '', row: string[] = [], q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { sel += '"'; i++; } else q = false; } else sel += c; }
    else if (c === '"') q = true;
    else if (c === pemisah) { row.push(sel); sel = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; row.push(sel); baris.push(row); row = []; sel = ''; }
    else sel += c;
  }
  if (sel !== '' || row.length) { row.push(sel); baris.push(row); }
  return baris;
}

/** Baca berkas tabel. Hasil: pasangan { kode, nama } dari dua kolom pertama; baris judul (mengandung "kode") dilewati; baris kosong diabaikan. */
export async function bacaKodeNama(file: File): Promise<{ baris: { kode: string; nama: string }[]; nomorAsli: number[] }> {
  const nama = file.name.toLowerCase();
  const buf = new Uint8Array(await file.arrayBuffer());
  let tabel: string[][];
  if (nama.endsWith('.xlsx')) tabel = await bacaXlsx(buf);
  else if (nama.endsWith('.csv') || nama.endsWith('.txt')) tabel = bacaCsv(dec.decode(buf));
  else throw new Error('Gunakan berkas Excel (.xlsx) atau CSV.');
  const baris: { kode: string; nama: string }[] = []; const nomorAsli: number[] = [];
  tabel.forEach((r, i) => {
    const kode = (r[0] ?? '').trim(), nm = (r[1] ?? '').trim();
    if (!kode && !nm) return;
    if (i === 0 && /kode/i.test(kode)) return;
    baris.push({ kode, nama: nm }); nomorAsli.push(i + 1);
  });
  return { baris, nomorAsli };
}
