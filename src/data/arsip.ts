// Arsip Keuangan: (1) Arsip SPJ BKU (berbasis No. BKU) dan (2) Dokumen Keuangan Non-BKU.
// Mode server: RPC `arsip_*` + Storage (bucket `lampiran-spj` untuk lampiran SPJ, `arsip-dokumen` untuk dokumen Non-BKU).
// Mode demo: data BKU diambil dari data contoh; kategori dan dokumen Non-BKU disimpan di memori peramban.
import { modeServer, supabase } from '@/lib/supabase';
import { buatApi, type Hasil } from '@/lib/api';
import { denganSibuk } from '@/lib/galat';
import { BUCKET_ARSIP, BUCKET_LAMPIRAN, unggah, hapus as hapusObjek, unduh as unduhObjek } from '@/lib/storage';
import { getSession } from '@/lib/auth';
import { repo } from '@/data/repo';
import { buatXlsx, zipSimpan } from '@/lib/xlsx';
import { bangunBundel, type DataLembar, type HasilBundel } from '@/lib/pdfBundel';
import { urlBerkasSesi } from '@/lib/berkas';

const api = buatApi(supabase as never);
const GALAT_UMUM = 'Layanan tidak tersedia. Periksa koneksi lalu coba lagi.';

export const MAKS_BERKAS_ZIP = 500;            // Pilar 08 §3.1: maksimal 500 berkas per paket ZIP
export const MAKS_BYTE_ZIP = 400 * 1024 * 1024; // batas wajar memori peramban saat merakit ZIP
export const MAKS_BYTE_DOKUMEN = 20 * 1024 * 1024; // Pilar 01 §3.2 dan server

export interface ArsipBKU {
  id: string; spj_id: string; nomor_bku: string; tanggal_bku: string; seksi: string; subkegiatan: string; uraian: string;
  bruto: number; pajak: number; nomor_verifikasi: string | null;
  lampiran_key: string | null; lampiran_nama: string | null; lampiran_ukuran: number | null;
  // data Lembar Verifikasi (halaman 1 bundel PDF)
  token?: string | null; tanggal_verifikasi?: string | null; verifikator_nama?: string | null; verifikator_nip?: string | null;
  jenis_belanja?: string; penerima?: string; kode_rekening?: string; tahun?: string;
  rekening_penerima?: { account_name: string; bank_name: string; account_number: string }[];
  rincian_pajak?: { nama: string; nominal: number }[];
}
export interface KategoriArsip { id: string; kode: string; nama: string; deskripsi: string; aktif: boolean; jumlah: number }
export interface DokumenArsip {
  id: string; kategori_id: string; kategori: string; kategori_kode: string; nomor: string; tanggal: string; judul: string; keterangan: string;
  nama_asli: string; berkas_key: string; ukuran: number; diunggah: string; pengunggah: string;
}
export type Daftar<T> = { ok: boolean; error?: string; baris: T[] };

// ===== Penamaan berkas (Pilar 07 §1.1 dan Pilar 02 §1.3) =====
export function sanitasiNama(masukan: string): string {
  return masukan.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').trim();
}
export function namaBerkasBKU(nomorBku: string): string { return `${sanitasiNama(nomorBku) || 'BKU'}.pdf`; }
export function namaBerkasDokumen(d: Pick<DokumenArsip, 'kategori_kode' | 'nomor' | 'tanggal'>): string {
  return `${sanitasiNama(d.kategori_kode) || 'DOK'}_${sanitasiNama(d.nomor) || 'tanpa-nomor'}_${d.tanggal}.pdf`;
}
/** Jamin nama unik di dalam satu ZIP (dua nomor berbeda bisa menghasilkan nama sanitasi sama). */
function namaUnik(nama: string, dipakai: Set<string>): string {
  let hasil = nama; let n = 2;
  while (dipakai.has(hasil.toLowerCase())) { hasil = nama.replace(/\.pdf$/i, `-${n++}.pdf`); }
  dipakai.add(hasil.toLowerCase());
  return hasil;
}
function tglDMY(iso: string): string { const [y, m, d] = iso.slice(0, 10).split('-'); return `${d}/${m}/${y}`; }
function stempelWaktu(): string {
  const n = new Date(); const p = (x: number) => String(x).padStart(2, '0');
  return `${n.getFullYear()}${p(n.getMonth() + 1)}${p(n.getDate())}-${p(n.getHours())}${p(n.getMinutes())}`;
}

// ===== Demo (memori) =====
const demoKategori: KategoriArsip[] = [];
const demoDokumen: (DokumenArsip & { file: File | null })[] = [];
let demoSeq = 1;

// Admin tidak terikat satu TA: TA yang dilihat dipilih di halaman Arsip (khusus baca).
let taPilihanAdmin: string | null = null;
export function setTaArsip(id: string | null): void { taPilihanAdmin = id; }
function taAktif(): string { const s = getSession(); return s?.active_role === 'admin' ? taPilihanAdmin ?? '' : s?.active_ta_id ?? ''; }
function taParam(): { p_ta: string | null } { return { p_ta: getSession()?.active_role === 'admin' ? taPilihanAdmin : null }; }

// ===== Baca =====
export async function muatBKU(): Promise<Daftar<ArsipBKU>> {
  if (!modeServer) {
    const ta = taAktif();
    const kui = repo.kuitansiByTA(ta); const seksi = repo.seksiTAByTA(ta); const pem = repo.pemetaanByTA(ta);
    const baris = repo.bkuByTA(ta).filter((b) => b.status === 'Aktif').map((b): ArsipBKU => {
      const k = kui.find((q) => q.id === b.kuitansi_id); const sp = repo.spjByTA(ta).find((x) => x.id === b.spj_id);
      const pm = pem.find((p) => p.id === k?.pemetaan_subkegiatan_id);
      const sesi = getSession(); const cetak = sesi ? repo.dataCetakVerifikasi(b.spj_id, sesi) : null; const c = cetak && cetak.ok ? cetak.data : null;
      return {
        token: c?.token ?? null, tanggal_verifikasi: c?.tanggal_verifikasi ?? null, verifikator_nama: c?.verifikator_nama ?? null, verifikator_nip: c?.verifikator_nip ?? null,
        jenis_belanja: c?.jenis_belanja ?? '', penerima: c?.penerima ?? '', kode_rekening: c?.kode_rekening ?? '', tahun: c?.ta_tahun ?? '',
        rekening_penerima: c?.rekening_penerima ?? [], rincian_pajak: c?.pajak ?? [],
        id: b.id, spj_id: b.spj_id, nomor_bku: b.nomor_bku, tanggal_bku: b.tanggal_bku,
        seksi: seksi.find((s) => s.id === k?.seksi_ta_id)?.nama_snapshot ?? '', subkegiatan: pm ? `${pm.kode_snapshot} ${pm.nama_snapshot}` : '',
        uraian: k?.uraian ?? '', bruto: k?.bruto ?? 0, pajak: (sp?.entri_pajak ?? []).reduce((a, e) => a + e.nominal, 0),
        nomor_verifikasi: repo.tokenAktifSPJ(b.spj_id)?.nomor_verifikasi ?? null,
        lampiran_key: null, lampiran_nama: sp?.lampiran_nama_asli ?? null, lampiran_ukuran: sp?.lampiran_ukuran_final ?? sp?.lampiran_ukuran_asal ?? null,
      };
    }).sort((a, b) => a.nomor_bku.localeCompare(b.nomor_bku));
    return { ok: true, baris };
  }
  return panggilDaftar<ArsipBKU>(() => api.arsip_bku_daftar(taParam()));
}
export async function muatKategori(): Promise<Daftar<KategoriArsip>> {
  if (!modeServer) return { ok: true, baris: demoKategori.map((c) => ({ ...c, jumlah: demoDokumen.filter((d) => d.kategori_id === c.id).length })) };
  return panggilDaftar<KategoriArsip>(() => api.arsip_kategori_daftar(taParam()));
}
export async function muatDokumen(): Promise<Daftar<DokumenArsip>> {
  if (!modeServer) return { ok: true, baris: demoDokumen.map((d): DokumenArsip => ({ id: d.id, kategori_id: d.kategori_id, kategori: d.kategori, kategori_kode: d.kategori_kode, nomor: d.nomor, tanggal: d.tanggal, judul: d.judul, keterangan: d.keterangan, nama_asli: d.nama_asli, berkas_key: d.berkas_key, ukuran: d.ukuran, diunggah: d.diunggah, pengunggah: d.pengunggah })) };
  return panggilDaftar<DokumenArsip>(() => api.arsip_dokumen_daftar(taParam()));
}
async function panggilDaftar<T>(f: () => Promise<Hasil>): Promise<Daftar<T>> {
  try {
    const r = await denganSibuk(f);
    if (!r.ok) return { ok: false, error: r.error ?? GALAT_UMUM, baris: [] };
    return { ok: true, baris: (r.baris as T[]) ?? [] };
  } catch { return { ok: false, error: GALAT_UMUM, baris: [] }; }
}

// ===== Tulis (kategori dan dokumen Non-BKU; hanya Bendahara, ditegakkan server) =====
async function tulis(f: () => Promise<Hasil>): Promise<Hasil> {
  try { const r = await denganSibuk(f); return r && typeof r === 'object' ? r : { ok: false, error: GALAT_UMUM }; } catch { return { ok: false, error: GALAT_UMUM }; }
}
export async function kategoriBawaan(): Promise<Hasil> {
  if (!modeServer) {
    if (demoKategori.length) return { ok: false, error: 'TA ini sudah memiliki kategori.' };
    for (const [kode, nama, d] of [
      ['BA-REKON', 'Berita Acara Rekon GU / Kas', 'Rekonsiliasi Uang Persediaan / Ganti Uang'], ['REK-KORAN', 'Rekening Koran Bank', 'Laporan koran bank bulanan kas'],
      ['SP2D', 'Dokumen SP2D / SPM / SPP', 'Surat perintah pencairan dana'], ['KAS-OPNAME', 'BA Pemeriksaan Kas / Kas Opname', 'Berita acara bulanan kas tunai dan bank'],
      ['NTPN', 'Bukti Setor Pajak / NTPN Kolektif', 'Rekap surat setoran pajak'], ['KONTRAK', 'Perjanjian / Kontrak / SK Keuangan', 'Dokumen penetapan dan kontrak pendukung'],
    ]) demoKategori.push({ id: `kat-${demoSeq++}`, kode, nama, deskripsi: d, aktif: true, jumlah: 0 });
    return { ok: true };
  }
  return tulis(() => api.arsip_kategori_bawaan());
}
export async function simpanKategori(k: { id?: string; kode: string; nama: string; deskripsi: string; aktif: boolean }): Promise<Hasil> {
  if (!modeServer) {
    const kode = k.kode.trim(); const nama = k.nama.trim();
    if (!kode || !nama) return { ok: false, error: 'Kode dan nama kategori wajib diisi.' };
    if (demoKategori.some((c) => c.kode.toLowerCase() === kode.toLowerCase() && c.id !== k.id)) return { ok: false, error: 'Kode kategori sudah ada.' };
    const ada = demoKategori.find((c) => c.id === k.id);
    if (ada) Object.assign(ada, { kode, nama, deskripsi: k.deskripsi.trim(), aktif: k.aktif });
    else demoKategori.push({ id: `kat-${demoSeq++}`, kode, nama, deskripsi: k.deskripsi.trim(), aktif: true, jumlah: 0 });
    return { ok: true };
  }
  return tulis(() => api.arsip_kategori_simpan({ p_id: k.id ?? '', p_kode: k.kode, p_nama: k.nama, p_deskripsi: k.deskripsi, p_aktif: k.aktif }));
}
export async function hapusKategori(id: string): Promise<Hasil> {
  if (!modeServer) {
    if (demoDokumen.some((d) => d.kategori_id === id)) return { ok: false, error: 'Kategori sudah memiliki berkas dan tidak dapat dihapus. Nonaktifkan saja.' };
    const i = demoKategori.findIndex((c) => c.id === id); if (i >= 0) demoKategori.splice(i, 1);
    return { ok: true };
  }
  return tulis(() => api.arsip_kategori_hapus({ p_id: id }));
}

export interface MetaDokumen { kategori_id: string; nomor: string; tanggal: string; judul: string; keterangan: string }
export async function unggahDokumen(meta: MetaDokumen, file: File): Promise<Hasil> {
  if (!/\.pdf$/i.test(file.name) || (file.type && file.type !== 'application/pdf')) return { ok: false, error: 'Berkas harus berformat PDF.' };
  if (file.size > MAKS_BYTE_DOKUMEN) return { ok: false, error: 'Ukuran berkas maksimal 20 MB.' };
  if (!modeServer) {
    const kat = demoKategori.find((c) => c.id === meta.kategori_id);
    if (!kat || !kat.aktif) return { ok: false, error: 'Kategori tidak ditemukan atau tidak aktif.' };
    if (!meta.nomor.trim() || !meta.judul.trim() || !meta.tanggal) return { ok: false, error: 'Nomor, tanggal, dan judul dokumen wajib diisi.' };
    if (demoDokumen.some((d) => d.kategori_id === kat.id && d.nomor.toLowerCase() === meta.nomor.trim().toLowerCase())) return { ok: false, error: 'Nomor dokumen sudah dipakai pada kategori ini.' };
    demoDokumen.push({ id: `dok-${demoSeq++}`, kategori_id: kat.id, kategori: kat.nama, kategori_kode: kat.kode, nomor: meta.nomor.trim(), tanggal: meta.tanggal, judul: meta.judul.trim(), keterangan: meta.keterangan.trim(), nama_asli: file.name, berkas_key: '', ukuran: file.size, diunggah: new Date().toISOString(), pengunggah: getSession()?.nama_snapshot ?? '', file });
    return { ok: true };
  }
  const ta = taAktif();
  const kunci = `${ta}/${meta.kategori_id}/${Date.now()}_${sanitasiNama(file.name.replace(/\.pdf$/i, '')).slice(0, 80) || 'dokumen'}.pdf`;
  const u = await unggah(supabase as never, BUCKET_ARSIP, kunci, file);
  if (!u.ok) return { ok: false, error: u.error ?? 'Gagal mengunggah berkas.' };
  const r = await tulis(() => api.arsip_dokumen_catat({ p_kategori: meta.kategori_id, p_nomor: meta.nomor, p_tanggal: meta.tanggal, p_judul: meta.judul, p_keterangan: meta.keterangan, p_key: kunci, p_nama_asli: file.name, p_ukuran: file.size }));
  if (!r.ok) await hapusObjek(supabase as never, BUCKET_ARSIP, [kunci]).catch(() => {}); // jangan tinggalkan objek yatim
  return r;
}
export async function ubahDokumen(id: string, m: Omit<MetaDokumen, 'kategori_id'>): Promise<Hasil> {
  if (!modeServer) {
    const d = demoDokumen.find((x) => x.id === id); if (!d) return { ok: false, error: 'Dokumen tidak ditemukan.' };
    if (!m.nomor.trim() || !m.judul.trim() || !m.tanggal) return { ok: false, error: 'Nomor, tanggal, dan judul dokumen wajib diisi.' };
    if (demoDokumen.some((x) => x.id !== id && x.kategori_id === d.kategori_id && x.nomor.toLowerCase() === m.nomor.trim().toLowerCase())) return { ok: false, error: 'Nomor dokumen sudah dipakai pada kategori ini.' };
    Object.assign(d, { nomor: m.nomor.trim(), tanggal: m.tanggal, judul: m.judul.trim(), keterangan: m.keterangan.trim() });
    return { ok: true };
  }
  return tulis(() => api.arsip_dokumen_ubah({ p_id: id, p_nomor: m.nomor, p_tanggal: m.tanggal, p_judul: m.judul, p_keterangan: m.keterangan }));
}
export async function hapusDokumen(id: string): Promise<Hasil> {
  if (!modeServer) { const i = demoDokumen.findIndex((d) => d.id === id); if (i >= 0) demoDokumen.splice(i, 1); return { ok: true }; }
  const r = await tulis(() => api.arsip_dokumen_hapus({ p_id: id }));
  if (r.ok && typeof r.berkas_key === 'string') await hapusObjek(supabase as never, BUCKET_ARSIP, [r.berkas_key]).catch(() => {});
  return r;
}

// ===== Ambil berkas & unduh =====
async function ambilBlob(bucket: string, kunci: string | null): Promise<Blob | null> {
  if (!kunci || !supabase) return null;
  const r = await unduhObjek(supabase as never, bucket, kunci);
  return r.ok && r.blob ? r.blob : null;
}
export async function blobLampiranBKU(b: ArsipBKU): Promise<Blob | null> { return modeServer ? ambilBlob(BUCKET_LAMPIRAN, b.lampiran_key) : null; }
export async function blobDokumen(d: DokumenArsip): Promise<Blob | null> {
  if (!modeServer) return demoDokumen.find((x) => x.id === d.id)?.file ?? null;
  return ambilBlob(BUCKET_ARSIP, d.berkas_key);
}

const KUNCI_LOGO = 'tplver-logo'; const KUNCI_STEMPEL = 'tplver-stempel';
async function bacaGambarSesi(kunci: string): Promise<Uint8Array | null> {
  try { const u = urlBerkasSesi(kunci); if (!u) return null; const r = await fetch(u); return r.ok ? new Uint8Array(await r.arrayBuffer()) : null; } catch { return null; }
}
/** Rakit bundel PDF arsip: halaman 1 Lembar Verifikasi + lampiran SPJ (Pilar 02 §1.1). */
export async function bundelBKU(b: ArsipBKU): Promise<HasilBundel> {
  const lamp = await blobLampiranBKU(b);
  const lampBytes = lamp ? new Uint8Array(await lamp.arrayBuffer()) : null;
  const [logo, stempel] = await Promise.all([bacaGambarSesi(KUNCI_LOGO), bacaGambarSesi(KUNCI_STEMPEL)]);
  const d: DataLembar = {
    nomor_bku: b.nomor_bku, nomor_verifikasi: b.nomor_verifikasi, token: b.token ?? null, tanggal_verifikasi: b.tanggal_verifikasi ?? null,
    verifikator_nama: b.verifikator_nama ?? null, verifikator_nip: b.verifikator_nip ?? null, tahun: b.tahun ?? '', seksi: b.seksi, subkegiatan: b.subkegiatan,
    kode_rekening: b.kode_rekening ?? '', uraian: b.uraian, jenis_belanja: b.jenis_belanja ?? '', penerima: b.penerima ?? '', bruto: b.bruto,
    rekening_penerima: b.rekening_penerima ?? [], rincian_pajak: b.rincian_pajak ?? [],
  };
  const url = b.token ? `${window.location.origin}${window.location.pathname}#/keaslian/${b.token}` : null;
  return bangunBundel(d, repo.templateVerifikasi(), url, lampBytes, logo, stempel);
}
export async function blobBundelBKU(b: ArsipBKU): Promise<{ blob: Blob; catatan?: string }> {
  const h = await bundelBKU(b);
  return { blob: new Blob([h.bytes as BlobPart], { type: 'application/pdf' }), catatan: h.catatan };
}

/** Catat unduhan pada jejak audit (Pilar 07 §4.1). Kegagalan mencatat tidak menghalangi unduhan. */
export async function catatUnduh(jenis: 'BKU_PDF' | 'BKU_ZIP' | 'DOK_PDF' | 'DOK_ZIP', rujukan: string, jumlah: number): Promise<void> {
  if (!modeServer) return;
  try { await api.arsip_catat_unduh({ p_jenis: jenis, p_rujukan: rujukan, p_jumlah: jumlah, ...taParam() }); } catch { /* abaikan */ }
}

export function simpanBlob(nama: string, blob: Blob): void {
  const u = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = u; a.download = nama; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}

// ===== Paket ZIP + manifest Excel (Pilar 02 §2 dan §3) =====
export interface HasilZip { ok: boolean; error?: string; jumlah?: number; dilewati?: string[] }

export async function unduhZipBKU(pilih: ArsipBKU[], tahun: string): Promise<HasilZip> {
  if (pilih.length === 0) return { ok: false, error: 'Tidak ada baris dipilih.' };
  if (pilih.length > MAKS_BERKAS_ZIP) return { ok: false, error: `Maksimal ${MAKS_BERKAS_ZIP} berkas per paket ZIP. Pilih lebih sedikit atau unduh per periode.` };
  return denganSibuk(async () => {
    const dipakai = new Set<string>(); const berkas: { nama: string; isi: Uint8Array }[] = []; const dilewati: string[] = [];
    const manifest: (string | number | null)[][] = [['No', 'No. BKU', 'Tanggal BKU', 'Seksi / Unit Kerja', 'Subkegiatan', 'Uraian Transaksi', 'Nilai Bruto (Rp)', 'Potongan Pajak (Rp)', 'Nilai Netto (Rp)', 'Nama Berkas PDF']];
    let total = 0; let no = 0;
    for (const b of pilih) {
      const h = await bundelBKU(b);
      total += h.bytes.length;
      if (total > MAKS_BYTE_ZIP) return { ok: false, error: 'Total ukuran melebihi 400 MB. Pilih lebih sedikit berkas.' };
      const nama = namaUnik(namaBerkasBKU(b.nomor_bku), dipakai);
      berkas.push({ nama, isi: h.bytes });
      if (!h.lampiranMenyatu) dilewati.push(b.nomor_bku);
      manifest.push([++no, b.nomor_bku, tglDMY(b.tanggal_bku), b.seksi, b.subkegiatan, b.uraian, b.bruto, b.pajak, b.bruto - b.pajak, nama]);
    }
    const xlsx = buatXlsx([{ nama: 'Daftar Arsip BKU', baris: manifest, tebal: [0] }]);
    const zip = zipSimpan([{ nama: '00_DAFTAR_ARSIP_BKU.xlsx', isi: xlsx }, ...berkas]);
    simpanBlob(`ARSIP_SPJ_BKU_${tahun}_${stempelWaktu()}.zip`, new Blob([zip as BlobPart], { type: 'application/zip' }));
    await catatUnduh('BKU_ZIP', `ARSIP_SPJ_BKU_${tahun}`, berkas.length);
    return { ok: true, jumlah: berkas.length, dilewati };
  });
}

export async function unduhZipDokumen(pilih: DokumenArsip[], tahun: string, labelKategori: string): Promise<HasilZip> {
  if (pilih.length === 0) return { ok: false, error: 'Tidak ada dokumen dipilih.' };
  if (pilih.length > MAKS_BERKAS_ZIP) return { ok: false, error: `Maksimal ${MAKS_BERKAS_ZIP} berkas per paket ZIP.` };
  return denganSibuk(async () => {
    const dipakai = new Set<string>(); const berkas: { nama: string; isi: Uint8Array }[] = []; const dilewati: string[] = [];
    const manifest: (string | number | null)[][] = [['No', 'Kategori', 'Nomor Surat', 'Tanggal Dokumen', 'Judul Dokumen', 'Tanggal Unggah', 'Ukuran Berkas (KB)', 'Pengunggah', 'Nama File PDF']];
    let total = 0; let no = 0;
    for (const d of pilih) {
      const blob = await blobDokumen(d);
      if (!blob) { dilewati.push(d.nomor); continue; }
      total += blob.size;
      if (total > MAKS_BYTE_ZIP) return { ok: false, error: 'Total ukuran melebihi 400 MB. Pilih lebih sedikit berkas.' };
      const nama = namaUnik(namaBerkasDokumen(d), dipakai);
      berkas.push({ nama, isi: new Uint8Array(await blob.arrayBuffer()) });
      manifest.push([++no, d.kategori, d.nomor, tglDMY(d.tanggal), d.judul, tglDMY(d.diunggah), Math.max(1, Math.round(d.ukuran / 1024)), d.pengunggah, nama]);
    }
    if (berkas.length === 0) return { ok: false, error: 'Berkas tidak dapat diunduh.', dilewati };
    const kunciKat = sanitasiNama(labelKategori).toUpperCase() || 'DOKUMEN';
    const xlsx = buatXlsx([{ nama: 'Daftar Arsip', baris: manifest, tebal: [0] }]);
    const zip = zipSimpan([{ nama: `00_DAFTAR_ARSIP_${kunciKat}.xlsx`, isi: xlsx }, ...berkas]);
    simpanBlob(`ARSIP_${kunciKat}_${tahun}_${stempelWaktu()}.zip`, new Blob([zip as BlobPart], { type: 'application/zip' }));
    await catatUnduh('DOK_ZIP', `ARSIP_${kunciKat}_${tahun}`, berkas.length);
    return { ok: true, jumlah: berkas.length, dilewati };
  });
}
