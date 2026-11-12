// Operasi tulis ke Supabase (mode server). Setiap fungsi memanggil RPC `public.*`, lalu — bila berhasil — memuat ulang data
// (segarkan) sehingga layar yang membaca dari memori langsung menampilkan keadaan terbaru dari server.
// Bentuk hasil sengaja sama dengan versi demo ({ ok, error?, ... }) agar layar tidak perlu dibedakan.
import * as data from '@/data/sampleData';
import { supabase } from '@/lib/supabase';
import { buatApi, type Hasil } from '@/lib/api';
import { segarkan } from '@/data/store';
import { tampilkanGalat } from '@/lib/galat';
import { unggah, hapus as hapusBerkas, kunciLampiran, BUCKET_SK, BUCKET_LAMPIRAN } from '@/lib/storage';
import type {
  MasterPersonel, AkunPengawas, MasterSubkegiatan, MasterRekeningBelanja, MasterJenisPajak, TAStatus, AccountStatus,
  PeranPenugasan, FieldFormDinamis, BlokBerulangFormDinamis, TemplateKuitansi, TemplateVerifikasi, FormatNomorVerifikasi, SessionPayload,
} from '@/data/types';

export const api = buatApi(supabase as never);
const GALAT_UMUM = 'Layanan tidak tersedia. Periksa koneksi lalu coba lagi.';

/** Jalankan RPC; bila ok, segarkan data. Galat jaringan dijadikan hasil { ok:false }. */
export async function jalankan<T extends Hasil>(p: Promise<T>, opsi?: { toast?: boolean; tanpaSegar?: boolean }): Promise<T> {
  let r: T;
  try { r = await p; } catch { r = { ok: false, error: GALAT_UMUM } as T; }
  if (!r || typeof r !== 'object') r = { ok: false, error: GALAT_UMUM } as T;
  if (r.ok) { if (!opsi?.tanpaSegar) { try { await segarkan(); } catch { /* data lama tetap tampil */ } } }
  else if (opsi?.toast) tampilkanGalat(r.error ?? GALAT_UMUM);
  return r;
}

const tglOrNull = (s: string | null | undefined) => (s && s.trim() ? s : null);
const ukuran = (n: number | null | undefined) => (n == null ? null : Math.round(n));

function pecahPersonel(p: Partial<MasterPersonel>): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  for (const k of ['gelar_depan', 'nama', 'gelar_belakang', 'nip', 'nik', 'pangkat', 'tmt', 'no_whatsapp'] as const) if (p[k] !== undefined) o[k] = p[k];
  return o;
}
function pecahPengawas(p: Partial<AkunPengawas>): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  for (const k of ['nama_lengkap', 'instansi_asal', 'nomor_surat_tugas', 'tanggal_surat_tugas', 'email', 'tanggal_akhir_akses'] as const) if (p[k] !== undefined) o[k] = p[k];
  return o;
}

// ----------------------------- SOTK -----------------------------
export const server = {
  async tambahSOTK(nama_unit: string, tmt_mulai: string, dasar_hukum: string) {
    const r = await jalankan(api.adm_sotk_tambah({ p_nama: nama_unit, p_tmt: tmt_mulai, p_dasar: dasar_hukum }), { toast: true });
    return data.masterSOTK.find((s) => s.id === r.id) ?? (null as never);
  },
  ubahSOTKNomenklatur: (id: string, nama_baru: string, tmt_baru: string) => jalankan(api.adm_sotk_ubah_nomenklatur({ p_id: id, p_nama_baru: nama_baru, p_tmt_baru: tmt_baru }), { toast: true }),
  ubahSOTKTypo: (id: string, nama_baru: string) => jalankan(api.adm_sotk_koreksi_typo({ p_id: id, p_nama: nama_baru }), { toast: true }),
  arsipkanSOTK: (id: string, tanggal: string) => jalankan(api.adm_sotk_arsipkan({ p_id: id, p_tanggal: tanggal }), { toast: true }),

  // ------------------------- Personel, akun -------------------------
  async tambahPersonel(p: Omit<MasterPersonel, 'id'>) {
    const r = await jalankan(api.adm_personel_tambah({ p: pecahPersonel(p) }));
    return { ...r, personel: data.masterPersonel.find((x) => x.id === r.id) };
  },
  editPersonel: (id: string, p: Partial<MasterPersonel>) => jalankan(api.adm_personel_edit({ p_id: id, p: pecahPersonel(p) })),
  simpanPerubahanPangkat: (id: string, pangkat: string, gd: string, gb: string, tmt: string) =>
    jalankan(api.adm_personel_perubahan_pangkat({ p_id: id, p_pangkat: pangkat, p_gelar_depan: gd, p_gelar_belakang: gb, p_tmt: tmt }), { toast: true }),
  buatAkun: (personel_id: string, sandi: string) => jalankan(api.adm_akun_buat({ p_personel_id: personel_id, p_sandi: sandi })),
  resetPassword: (akun_id: string, sandi: string) => jalankan(api.adm_akun_reset_sandi({ p_akun_id: akun_id, p_sandi: sandi }), { toast: true }),
  setAkunStatus: (akun_id: string, status: AccountStatus) => jalankan(api.adm_akun_set_status({ p_akun_id: akun_id, p_status: status }), { toast: true }),
  tambahPengawas: (p: Omit<AkunPengawas, 'id' | 'failed_attempts' | 'locked' | 'status'>) =>
    jalankan(api.adm_pengawas_tambah({ p: pecahPengawas(p), p_sandi: (p as { password?: string }).password ?? '' })),
  async editPengawas(id: string, p: Partial<AkunPengawas>) {
    if (p.status !== undefined) {
      const rs = await jalankan(api.adm_pengawas_set_status({ p_id: id, p_status: p.status }), { toast: true });
      if (!rs.ok) return;
    }
    const sisa = pecahPengawas(p);
    if (Object.keys(sisa).length) await jalankan(api.adm_pengawas_edit({ p_id: id, p: sisa }), { toast: true });
  },
  resetPengawasPassword: (id: string, sandi: string) => jalankan(api.adm_pengawas_reset_sandi({ p_id: id, p_sandi: sandi })),

  // ------------------------- Master -------------------------
  async tambahSubkegiatan(kode: string, nama: string, rincian: string) {
    await jalankan(api.adm_subkegiatan_simpan({ p_id: '', p_kode: kode, p_nama: nama, p_rincian: rincian }), { toast: true });
  },
  async editSubkegiatan(id: string, p: Partial<MasterSubkegiatan>) {
    const lama = data.masterSubkegiatan.find((x) => x.id === id); if (!lama) return;
    const b = { ...lama, ...p };
    await jalankan(api.adm_subkegiatan_simpan({ p_id: id, p_kode: b.kode, p_nama: b.nama, p_rincian: b.rincian ?? '', p_status: b.status }), { toast: true });
  },
  async tambahRekening(kode: string, nama: string, rincian: string) {
    await jalankan(api.adm_rekening_simpan({ p_id: '', p_kode: kode, p_nama: nama, p_rincian: rincian }), { toast: true });
  },
  async editRekening(id: string, p: Partial<MasterRekeningBelanja>) {
    const lama = data.masterRekeningBelanja.find((x) => x.id === id); if (!lama) return;
    const b = { ...lama, ...p };
    await jalankan(api.adm_rekening_simpan({ p_id: id, p_kode: b.kode_rekening, p_nama: b.nama, p_rincian: b.rincian ?? '', p_status: b.status }), { toast: true });
  },
  async tambahJenisPajak(kode: string | null, nama: string) {
    await jalankan(api.adm_jenis_pajak_simpan({ p_id: '', p_kode: kode ?? '', p_nama: nama }), { toast: true });
  },
  async editJenisPajak(id: string, p: Partial<MasterJenisPajak>) {
    const lama = data.masterJenisPajak.find((x) => x.id === id); if (!lama) return;
    const b = { ...lama, ...p };
    await jalankan(api.adm_jenis_pajak_simpan({ p_id: id, p_kode: b.kode ?? '', p_nama: b.nama_jenis_pajak, p_status: b.status }), { toast: true });
  },
  toggleJenisPajakStatus: (id: string) => jalankan(api.adm_jenis_pajak_toggle({ p_id: id })),

  // ------------------------- Direktori -------------------------
  koreksiDirektori: (id: string, nip_nik: string, nama: string) => jalankan(api.adm_direktori_koreksi({ p_id: id, p_nip_nik: nip_nik, p_nama: nama }), { toast: true }),
  mergeDirektori: (keep: string, drop: string) => jalankan(api.adm_direktori_gabung({ p_keep: keep, p_drop: drop }), { toast: true }),
  koreksiRekeningBank: (id: string, p: { account_name: string; bank_name: string; account_number: string; alias?: string | null }, _s?: SessionPayload) =>
    jalankan(api.adm_rekening_bank_koreksi({ p_id: id, p_nama: p.account_name, p_bank: p.bank_name, p_nomor: p.account_number, p_alias: p.alias ?? undefined })),
  mergeRekeningBank: (keep: string, drop: string, _s?: SessionPayload) => jalankan(api.adm_rekening_bank_gabung({ p_keep: keep, p_drop: drop })),

  // ------------------------- Form, template -------------------------
  simpanVersiForm: (jenis: string, fields: FieldFormDinamis[], blok: BlokBerulangFormDinamis | null) =>
    jalankan(api.adm_form_simpan_versi({ p_jenis: jenis, p_fields: fields, p_blok: blok })),
  simpanTemplateKuitansi: (t: TemplateKuitansi) => jalankan(api.adm_template_simpan({ p_kunci: 'template_kuitansi', p_nilai: t })),
  simpanTemplateVerifikasi: (t: TemplateVerifikasi, _s?: SessionPayload) => jalankan(api.adm_template_simpan({ p_kunci: 'template_verifikasi', p_nilai: t })),
  simpanFormatNomor: (ta_id: string, f: Omit<FormatNomorVerifikasi, 'ta_id'> | FormatNomorVerifikasi, _s?: SessionPayload) =>
    jalankan(api.adm_format_nomor_simpan({ p_ta: ta_id, p_awalan: f.awalan, p_pemisah: f.pemisah, p_pola_tahun: f.pola_tahun, p_digit: f.digit })),

  // ------------------------- Tahun anggaran -------------------------
  async buatTA(tahun: string, pagu: number) {
    const r = await jalankan(api.adm_ta_buat({ p_tahun: tahun, p_pagu: pagu }));
    return { ...r, ta: data.tahunAnggaran.find((t) => t.id === r.id) };
  },
  async salinStruktur(baru: string, lama: string) {
    const r = await jalankan(api.adm_ta_salin_struktur({ p_baru: baru, p_lama: lama }));
    return { ...r, count: Number(r.jumlah ?? 0) };
  },
  hapusTA: (id: string, _s?: SessionPayload) => jalankan(api.adm_ta_hapus({ p_id: id })),
  editPaguInduk: (ta: string, pagu: number) => jalankan(api.adm_ta_edit_pagu({ p_ta: ta, p_pagu: pagu }), { toast: true }),
  ubahStatusTA: (ta: string, status: TAStatus) => jalankan(api.adm_ta_ubah_status({ p_ta: ta, p_status: status })),
  async hapusTARetensi(ta: string, kode: string, _s?: SessionPayload) {
    const r = await jalankan(api.adm_ta_hapus_retensi({ p_ta: ta, p_kode: kode }));
    if (r.ok && Array.isArray(r.lampiran) && r.lampiran.length && supabase) await hapusBerkas(supabase as never, BUCKET_LAMPIRAN, r.lampiran as string[]);
    return r;
  },

  // ------------------------- Seksi, pemetaan, penugasan -------------------------
  async tambahSeksiTA(ta: string, sotk: string) {
    const r = await jalankan(api.adm_seksi_tambah({ p_ta: ta, p_sotk: sotk }));
    return { ...r, seksi: data.seksiTA.find((s) => s.id === r.id) };
  },
  hapusSeksiTA: (seksi: string) => jalankan(api.adm_seksi_hapus({ p_seksi: seksi })),
  tambahPemetaan: (ta: string, seksi: string, sub: string) => jalankan(api.adm_pemetaan_tambah({ p_ta: ta, p_seksi: seksi, p_sub: sub })),
  hapusPemetaan: (id: string) => jalankan(api.adm_pemetaan_hapus({ p_id: id }), { toast: true }),
  tambahPenugasan: (ta: string, peran: PeranPenugasan, personel: string, seksi: string | null, tmt: string, provisional: boolean) =>
    jalankan(api.adm_penugasan_tambah({ p_ta: ta, p_peran: peran, p_personel: personel, p_seksi: seksi as string, p_tmt: tmt, p_provisional: provisional })),
  hapusPenugasan: (id: string) => jalankan(api.adm_penugasan_hapus({ p_id: id }), { toast: true }),
  gantiPejabatDefinitif: (id: string, pengganti: string, tmt: string) => jalankan(api.adm_penugasan_ganti({ p_id: id, p_pengganti: pengganti, p_tmt: tmt })),

  // ------------------------- SK (berkas di bucket `sk`) -------------------------
  async tambahSK(penugasan: string, nomor: string, tanggal: string, berkas: string | null, provisional: boolean, berkas_ukuran: number | null = null, file?: File | null) {
    let kunci = '', nama = '';
    if (berkas && file && supabase) {
      nama = file.name;
      kunci = `${penugasan}/${Date.now()}-${file.name.normalize('NFKD').replace(/[^\w.-]+/g, '_').slice(0, 100)}`;
      const u = await unggah(supabase as never, BUCKET_SK, kunci, file);
      if (!u.ok) return { ok: false, error: u.error ?? 'Gagal mengunggah berkas SK.' } as Hasil & { id?: string };
    }
    return jalankan(api.adm_sk_tambah({ p_penugasan: penugasan, p_nomor: nomor, p_tanggal: tanggal, p_berkas_key: kunci, p_berkas_nama: nama, p_berkas_ukuran: ukuran(berkas_ukuran) ?? 0, p_provisional: provisional }));
  },
  async lengkapiSK(id: string, patch: { nomor_sk: string; tanggal_sk: string; provisional: boolean; berkas?: { nama: string; ukuran: number; file?: File } | 'hapus' | null }, _s?: SessionPayload) {
    const dasar = { p_id: id, p_nomor: patch.nomor_sk, p_tanggal: patch.tanggal_sk, p_provisional: patch.provisional };
    const b = patch.berkas;
    if (b === 'hapus') return jalankan(api.adm_sk_lengkapi({ ...dasar, p_berkas: 'hapus' }));
    if (b && typeof b === 'object') {
      let kunci = '';
      if (b.file && supabase) {
        kunci = `${id}/${Date.now()}-${b.nama.normalize('NFKD').replace(/[^\w.-]+/g, '_').slice(0, 100)}`;
        const u = await unggah(supabase as never, BUCKET_SK, kunci, b.file);
        if (!u.ok) return { ok: false, error: u.error ?? 'Gagal mengunggah berkas SK.' } as Hasil;
      }
      return jalankan(api.adm_sk_lengkapi({ ...dasar, p_berkas: 'ganti', p_berkas_key: kunci, p_berkas_nama: b.nama, p_berkas_ukuran: ukuran(b.ukuran) ?? 0 }));
    }
    return jalankan(api.adm_sk_lengkapi({ ...dasar, p_berkas: 'tetap' }));
  },
  tambahPengawasTA: (ta: string, pengawas: string, mulai: string, akhir: string) => jalankan(api.adm_pengawas_ta_tambah({ p_ta: ta, p_pengawas: pengawas, p_mulai: mulai, p_akhir: akhir })),
  hapusPengawasTA: (id: string) => jalankan(api.adm_pengawas_ta_hapus({ p_id: id }), { toast: true }),
  tambahDelegasi: (ta: string, pengganti: string, peran: PeranPenugasan, seksi: string | null, mulai: string, berakhir: string, definitif: string) =>
    jalankan(api.adm_delegasi_tetapkan({ p_ta: ta, p_pengganti: pengganti, p_peran: peran, p_seksi: seksi as string, p_mulai: mulai, p_berakhir: berakhir, p_definitif: definitif })),
  cabutDelegasi: (id: string, alasan: string) => jalankan(api.adm_delegasi_cabut({ p_id: id, p_alasan: alasan })),
  // Delegasi jatuh tempo diakhiri otomatis oleh pg_cron di server (23:59 WITA); klien tidak perlu mengubah apa pun.
  async akhiriDelegasiJatuhTempo() { return [] as never[]; },
  tglOrNull,

  // ------------------------- Tahap 3: anggaran, SPD, BKU -------------------------
  aturJendela: (ta: string, tutup_wita: string, _a?: unknown) => jalankan(api.bend_jendela_atur({ p_ta: ta, p_tutup: tutup_wita })),
  simpanAlokasiSubkegiatan: (ta: string, pagu: Record<string, number>, _a?: unknown) => jalankan(api.bend_alokasi_sub_simpan({ p_ta: ta, p_pagu: pagu })),
  simpanAlokasiRekening: (ta: string, pemetaan: string, baris: { rekening_id: string; pagu: number }[], _a?: unknown) =>
    jalankan(api.pptk_alokasi_rek_simpan({ p_ta: ta, p_pemetaan: pemetaan, p_baris: baris })),
  sahkanAlokasi: (ta: string, _a?: unknown) => jalankan(api.bend_sahkan({ p_ta: ta })),
  efisiensiSPD: (ar: string, nilai: number, ket: string, _a?: unknown) => jalankan(api.bend_spd_efisiensi({ p_ar: ar, p_nilai: nilai, p_ket: ket })),
  naikkanSPD: (ar: string, nilai: number, alasan: string, _a?: unknown) => jalankan(api.bend_spd_naik({ p_ar: ar, p_nilai: nilai, p_alasan: alasan })),
  aturSPDFinal: (ar: string, final: number, ket: string, _a?: unknown) => jalankan(api.bend_spd_final({ p_ar: ar, p_final: final, p_ket: ket })),
  geserSPD: (ta: string, sumber: string, tujuan: string, nilai: number, alasan: string, _a?: unknown) =>
    jalankan(api.bend_geser({ p_ta: ta, p_sumber: sumber, p_tujuan: tujuan, p_nilai: nilai, p_alasan: alasan })),
  aktifkanApbdP: (ta: string, pagu: number, _a?: unknown) => jalankan(api.adm_apbdp_aktifkan({ p_ta: ta, p_pagu: pagu })),
  koreksiPaguApbdP: (ta: string, pagu: number, _a?: unknown) => jalankan(api.adm_apbdp_koreksi({ p_ta: ta, p_pagu: pagu })),
  catatBKU: (spj: string, nomor: string, tanggal: string, _s?: SessionPayload) => jalankan(api.bend_bku_catat({ p_spj: spj, p_nomor: nomor, p_tanggal: tanggal })),
  koreksiBKU: (bku: string, patch: { nomor_bku: string; tanggal_bku: string }, _s?: SessionPayload) =>
    jalankan(api.bend_bku_koreksi({ p_bku: bku, p_nomor: patch.nomor_bku, p_tanggal: patch.tanggal_bku })),
  cabutBKU: (bku: string, _s?: SessionPayload) => jalankan(api.bend_bku_cabut({ p_bku: bku })),

  // ------------------------- Tahap 4: kuitansi, SPJ, verifikasi -------------------------
  async buatKuitansi(i: { ta_id: string; seksi_ta_id: string; pemetaan_subkegiatan_id: string; rekening_id: string; penerima: string; bruto: number; uraian: string; tanggal_kuitansi: string }, _s?: SessionPayload) {
    const r = await jalankan(api.pptk_kuitansi_buat({ p_ta: i.ta_id, p_seksi: i.seksi_ta_id, p_pemetaan: i.pemetaan_subkegiatan_id, p_rekening: i.rekening_id, p_penerima: i.penerima, p_bruto: Math.round(i.bruto), p_uraian: i.uraian, p_tanggal: i.tanggal_kuitansi }));
    const id = (r as { id?: string }).id;
    return { ok: r.ok, error: r.error, kuitansi: id ? data.kuitansi.find((k) => k.id === id) : undefined };
  },
  ubahKuitansi: (id: string, p: { penerima?: string; bruto?: number; uraian?: string; tanggal_kuitansi?: string }, _s?: SessionPayload) =>
    jalankan(api.pptk_kuitansi_ubah({ p_id: id, p_patch: p })),
  batalkanKuitansi: (id: string, _s?: SessionPayload) => jalankan(api.pptk_kuitansi_batalkan({ p_id: id })),
  async buatSPJ(i: { ta_id: string; kuitansi_id: string; jenis_belanja: string }, _s?: SessionPayload) {
    const r = await jalankan(api.pptk_spj_buat({ p_ta: i.ta_id, p_kuitansi: i.kuitansi_id, p_jenis: i.jenis_belanja }));
    const id = (r as { id?: string }).id;
    return { ok: r.ok, error: r.error, spj: id ? data.spj.find((x) => x.id === id) : undefined };
  },
  simpanJawabanSPJ: (id: string, j: unknown, _s?: SessionPayload) => jalankan(api.pptk_spj_jawaban({ p_spj: id, p_jawaban: j })),
  simpanRekeningSPJ: (id: string, baris: unknown, _s?: SessionPayload) => jalankan(api.pptk_spj_rekening({ p_spj: id, p_baris: baris })),
  simpanEntriPajakSPJ: (id: string, entri: unknown, _s?: SessionPayload) => jalankan(api.pptk_spj_pajak({ p_spj: id, p_entri: entri })),
  /** Unggah PDF ke bucket `lampiran-spj` lalu catat metadatanya. Tanpa File (tidak mungkin di mode server) ditolak. */
  async simpanLampiranSPJ(id: string, berkas: { nama: string; ukuran: number; file?: File; ukuranFinal?: number; statusOptimasi?: string }, _s?: SessionPayload) {
    if (!berkas.file) return { ok: false, error: 'Berkas tidak tersedia untuk diunggah.' };
    const kunci = kunciLampiran(id, berkas.nama);
    const u = await unggah(supabase as never, BUCKET_LAMPIRAN, kunci, berkas.file);
    if (!u.ok) return { ok: false, error: u.error ?? 'Gagal mengunggah berkas.' };
    const r = await jalankan(api.pptk_spj_lampiran({ p_spj: id, p_key: kunci, p_nama: berkas.nama, p_ukuran_asal: Math.round(berkas.ukuran), p_ukuran_final: berkas.ukuranFinal == null ? undefined : Math.round(berkas.ukuranFinal), p_status_optimasi: berkas.statusOptimasi }));
    if (!r.ok) await hapusBerkas(supabase as never, BUCKET_LAMPIRAN, [kunci]).catch(() => {});   // jangan tinggalkan objek yatim
    return r;
  },
  async hapusLampiranSPJ(id: string, _s?: SessionPayload) {
    const r = await jalankan(api.pptk_spj_lampiran_hapus({ p_spj: id }));
    const key = (r as { hapus_key?: string }).hapus_key;
    if (r.ok && key) await hapusBerkas(supabase as never, BUCKET_LAMPIRAN, [key]).catch(() => {});
    return r;
  },
  ajukanSPJ: (id: string, _s?: SessionPayload) => jalankan(api.pptk_spj_ajukan({ p_spj: id })),
  lepasSPJ: (id: string, _s?: SessionPayload) => jalankan(api.pptk_spj_lepas({ p_spj: id })),
  batalkanSPJ: (id: string, _s?: SessionPayload) => jalankan(api.pptk_spj_lepas({ p_spj: id })),
  async setujuiSPJ(id: string, _s?: SessionPayload) {
    const r = await jalankan(api.ver_spj_setujui({ p_spj: id }));
    return { ok: r.ok, error: r.error, nomor: (r as { nomor?: string }).nomor };
  },
  kembalikanSPJ: (id: string, catatan: string, _s?: SessionPayload) => jalankan(api.ver_spj_kembalikan({ p_spj: id, p_catatan: catatan })),
};
