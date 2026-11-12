// Muat data dari Supabase ke memori (mode server). Layar tetap membaca sinkron dari repo; yang berubah hanya sumber datanya.
// Setiap baris dibatasi RLS per peran, jadi hanya data yang berhak dilihat sesi ini yang masuk.
// Perubahan data selalu lewat RPC (server.ts), lalu segarkan() memuat ulang dan memberi tahu layar.
import * as data from '@/data/sampleData';
import { supabase, modeServer } from '@/lib/supabase';
import type {
  TahunAnggaran, VersiAlokasiAnggaran, SPJ, DirektoriTransaksionalSPJ, RegisterSK, JendelaAlokasi, FormatNomorVerifikasi,
  AkunLogin, AkunPengawas, SeksiTA,
} from '@/data/types';

type Baris = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const HALAMAN = 1000; // batas baris per permintaan PostgREST

let versi = 0;
const pendengar = new Set<() => void>();
export function langgananData(fn: () => void): () => void {
  pendengar.add(fn);
  return () => { pendengar.delete(fn); };
}
export function versiData(): number { return versi; }
function beritahu() { versi += 1; for (const f of pendengar) f(); }

/** 'timestamptz' ISO -> 'YYYY-MM-DD HH:mm' pada WITA (UTC+8), format yang dipakai layar. */
export function keWita(iso: string | null | undefined): string {
  if (!iso) return '';
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return String(iso);
  const w = new Date(t.getTime() + 8 * 3600 * 1000);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${w.getUTCFullYear()}-${p(w.getUTCMonth() + 1)}-${p(w.getUTCDate())} ${p(w.getUTCHours())}:${p(w.getUTCMinutes())}`;
}

async function ambil(tabel: string, kolom: string, urut: string[]): Promise<Baris[] | null> {
  if (!supabase) return null;
  const keluar: Baris[] = [];
  for (let dari = 0; ; dari += HALAMAN) {
    let q = supabase.from(tabel).select(kolom);
    for (const u of urut) q = q.order(u, { ascending: true });
    const { data: rows, error } = await q.range(dari, dari + HALAMAN - 1);
    if (error) return null;
    const r = (rows ?? []) as Baris[];
    keluar.push(...r);
    if (r.length < HALAMAN) break;
  }
  return keluar;
}

function ganti<T>(arr: T[], baris: T[]) { arr.splice(0, arr.length, ...baris); }

/** Kosongkan data contoh. Dipanggil sekali saat mode server, sebelum layar apa pun dirender. */
export function kosongkanDataContoh(): void {
  for (const arr of [
    data.masterSOTK, data.masterPersonel, data.pangkatHistory, data.akunLogin, data.akunPengawas, data.masterSubkegiatan,
    data.masterRekeningBelanja, data.masterJenisPajak, data.formDinamis, data.tahunAnggaran, data.seksiTA, data.pemetaanSubkegiatanTA,
    data.penugasanTA, data.penugasanDelegasi, data.penugasanPengawasTA, data.registerSK, data.versiAlokasiAnggaran, data.jendelaAlokasi,
    data.ledgerSPD, data.alokasiSubkegiatan, data.alokasiRekening, data.kuitansi, data.spj, data.bku, data.tokenVerifikasi,
    data.formatNomorVerifikasi, data.direktoriTransaksional, data.rekeningBankDirektori, data.auditEvents,
  ] as unknown[][]) arr.length = 0;
  for (const k of Object.keys(data.verifikasiSeq)) delete data.verifikasiSeq[k];
}
if (modeServer) kosongkanDataContoh();

let berjalan: Promise<void> | null = null;

/** Muat seluruh data yang boleh dilihat sesi ini. Gagal bila tahun anggaran tidak terbaca (sesi tidak sah). */
export function muatSemua(): Promise<void> {
  if (!modeServer || !supabase) return Promise.resolve();
  if (berjalan) return berjalan;
  berjalan = (async () => {
    const [
      sotk, personel, pangkat, akun, pengawas, sub, rek, pajak, form, ta, seksi, pemetaan, tugas, delegasi, tugasPengawas, sk,
      versiA, versiRinci, jendela, ledger, alokSub, alokRek, kui, spj, spjPajak, spjRek, bku, token, fmt, dir, dirRef, rekBank, audit, konf,
    ] = await Promise.all([
      ambil('sotk', 'id,nama_unit,tmt_mulai,tmt_selesai,dasar_hukum,pengganti_dari_id,status_versi', ['id']),
      ambil('personel', 'id,gelar_depan,nama,gelar_belakang,nip,nik,pangkat,tmt,no_whatsapp', ['id']),
      ambil('riwayat_pangkat', 'id,personel_id,pangkat,gelar_depan,gelar_belakang,tmt_mulai,tmt_selesai', ['tmt_mulai', 'id']),
      ambil('akun_login', 'id,personel_id,username,status,failed_attempts,locked', ['id']),
      ambil('akun_pengawas', 'id,nama_lengkap,instansi_asal,nomor_surat_tugas,tanggal_surat_tugas,email,tanggal_akhir_akses,status,failed_attempts,locked', ['id']),
      ambil('subkegiatan', 'id,kode,nama,rincian,status', ['kode']),
      ambil('rekening_belanja', 'id,kode_rekening,nama,rincian,status', ['kode_rekening']),
      ambil('jenis_pajak', 'id,kode,nama_jenis_pajak,status', ['id']),
      ambil('form_dinamis', 'id,jenis_belanja,versi,fields,blok_berulang,tanggal_dibuat', ['jenis_belanja', 'tanggal_dibuat', 'id']),
      ambil('v_tahun_anggaran', 'id,tahun,pagu_induk,status,mode_apbd_p,pagu_induk_perubahan,tanggal_arsip_terakhir,pernah_transaksi', ['tahun']),
      ambil('seksi_ta', 'id,ta_id,sotka_id:sotk_id,nama_snapshot,tmt_mulai,tmt_selesai,status', ['id']),
      ambil('pemetaan_subkegiatan_ta', 'id,ta_id,seksi_ta_id,subkegiatan_id,kode_snapshot,nama_snapshot', ['kode_snapshot', 'id']),
      ambil('penugasan_ta', 'id,ta_id,peran,personel_id,seksi_ta_id,tmt_mulai,tmt_selesai,provisional,nama_snapshot,nip_snapshot', ['tmt_mulai', 'id']),
      ambil('penugasan_delegasi', 'id,ta_id,personel_pengganti_id,peran_digantikan,seksi_ta_id,tanggal_mulai,tanggal_berakhir,status,alasan_pencabutan,definitive_officer_id,nama_snapshot,nip_snapshot', ['tanggal_mulai', 'id']),
      ambil('penugasan_pengawas_ta', 'id,ta_id,pengawas_id,tanggal_mulai,tanggal_akhir', ['id']),
      ambil('register_sk', 'id,penugasan_id,nomor_sk,tanggal_sk,berkas_key,berkas_nama,berkas_ukuran,provisional', ['tanggal_sk', 'id']),
      ambil('versi_alokasi', 'id,ta_id,fase,tanggal_efektif,aktor_id,aktor_nama_snapshot,aktor_peran_snapshot,keterangan', ['tanggal_efektif', 'id']),
      ambil('versi_alokasi_rincian', 'versi_id,pemetaan_subkegiatan_id,rekening_id,pagu', ['versi_id', 'pemetaan_subkegiatan_id']),
      ambil('jendela_alokasi', 'ta_id,tutup_at', ['ta_id']),
      ambil('ledger_spd', 'id,ta_id,alokasi_rekening_id,jenis,perubahan,spd_sesudah,keterangan,waktu,aktor_id,aktor_nama_snapshot,aktor_peran_snapshot,referensi', ['waktu', 'id']),
      ambil('alokasi_subkegiatan', 'id,ta_id,pemetaan_subkegiatan_id,pagu', ['id']),
      ambil('alokasi_rekening', 'id,ta_id,pemetaan_subkegiatan_id,rekening_id,kode_rekening_snapshot,nama_rekening_snapshot,pagu,disahkan,spd_aktif', ['id']),
      ambil('kuitansi', 'id,ta_id,seksi_ta_id,pemetaan_subkegiatan_id,rekening_id,penerima,bruto,uraian,tanggal_kuitansi,status,pa_kpa_nama,pa_kpa_nip,bendahara_nama,bendahara_nip,pptk_nama,pptk_nip,versi_alokasi_snapshot_id', ['tanggal_kuitansi', 'id']),
      ambil('spj', 'id,ta_id,kuitansi_id,jenis_belanja,versi_form,jawaban,lampiran_nama_asli,lampiran_ukuran_asal,lampiran_ukuran_final,lampiran_status_optimasi,catatan_revisi,tanggal_pengajuan,penandatangan_pengajuan,status', ['id']),
      ambil('spj_pajak', 'id,spj_id,jenis_pajak_id,nominal', ['id']),
      ambil('spj_rekening_penerima', 'id,spj_id,account_name,bank_name,account_number,alias', ['id']),
      ambil('bku', 'id,ta_id,kuitansi_id,spj_id,nomor_bku,tanggal_bku,status', ['tanggal_bku', 'id']),
      ambil('token_verifikasi_spj', 'id,ta_id,spj_id,token,nomor_verifikasi,urut,tanggal_verifikasi,verifikator_nama,verifikator_nip,status', ['urut', 'id']),
      ambil('format_nomor_verifikasi', 'ta_id,awalan,pemisah,pola_tahun,digit', ['ta_id']),
      ambil('direktori_transaksional', 'id,nip_nik,nama', ['nip_nik']),
      ambil('direktori_transaksional_ref', 'direktori_id,spj_id', ['direktori_id', 'spj_id']),
      ambil('direktori_rekening_bank', 'id,account_name,bank_name,account_number,alias,created_at,updated_at', ['account_name', 'id']),
      ambil('audit_event', 'id,ta_id,waktu,aktor_id,aktor_nama_snapshot,aktor_nip_snapshot,aktor_peran_snapshot,entitas,aksi,nilai_sebelum,nilai_sesudah,alasan,otomatis,definitive_officer_id,delegate_officer_id,kuitansi_id,spj_id', ['waktu', 'id']),
      ambil('konfigurasi', 'kunci,nilai', ['kunci']),
    ]);

    // Tahun anggaran wajib terbaca: bila tidak, sesi tidak sah atau jaringan bermasalah.
    if (ta === null) { berjalan = null; throw new Error('Data tidak dapat dimuat dari server. Periksa koneksi atau masuk kembali.'); }

    const a = <T,>(x: Baris[] | null): T[] => (x ?? []) as T[];
    ganti(data.masterSOTK, a(sotk));
    ganti(data.masterPersonel, a(personel));
    ganti(data.pangkatHistory, a(pangkat));
    ganti(data.akunLogin, a<Baris>(akun).map((r) => ({ ...r, password: '' }) as AkunLogin));
    ganti(data.akunPengawas, a<Baris>(pengawas).map((r) => ({ ...r, password: '' }) as AkunPengawas));
    ganti(data.masterSubkegiatan, a(sub));
    ganti(data.masterRekeningBelanja, a(rek));
    ganti(data.masterJenisPajak, a(pajak));
    ganti(data.formDinamis, a(form));
    ganti(data.tahunAnggaran, a<Baris>(ta).map((r) => ({ ...r, pagu_induk: Number(r.pagu_induk ?? 0), pagu_induk_perubahan: r.pagu_induk_perubahan ?? null }) as TahunAnggaran));
    ganti(data.seksiTA, a<SeksiTA>(seksi));
    ganti(data.pemetaanSubkegiatanTA, a(pemetaan));
    ganti(data.penugasanTA, a(tugas));
    ganti(data.penugasanDelegasi, a(delegasi));
    ganti(data.penugasanPengawasTA, a(tugasPengawas));
    ganti(data.registerSK, a<Baris>(sk).map(({ berkas_nama, ...r }) => ({ ...r, berkas: berkas_nama ?? null }) as RegisterSK));

    const rinci = new Map<string, { pemetaan_subkegiatan_id: string; rekening_id: string | null; pagu: number }[]>();
    for (const r of a<Baris>(versiRinci)) {
      const l = rinci.get(r.versi_id) ?? [];
      l.push({ pemetaan_subkegiatan_id: r.pemetaan_subkegiatan_id, rekening_id: r.rekening_id ?? null, pagu: Number(r.pagu) });
      rinci.set(r.versi_id, l);
    }
    ganti(data.versiAlokasiAnggaran, a<Baris>(versiA).map((r) => ({ ...r, rincian: rinci.get(r.id) ?? [] }) as VersiAlokasiAnggaran));
    ganti(data.jendelaAlokasi, a<Baris>(jendela).map((r) => ({ ta_id: r.ta_id, tutup_wita: r.tutup_at ? keWita(r.tutup_at) : null }) as JendelaAlokasi));
    ganti(data.ledgerSPD, a<Baris>(ledger).map((r) => ({ ...r, waktu: keWita(r.waktu) }) as never));
    ganti(data.alokasiSubkegiatan, a(alokSub));
    ganti(data.alokasiRekening, a(alokRek));
    ganti(data.kuitansi, a(kui));

    const pajakPer = new Map<string, Baris[]>(); for (const r of a<Baris>(spjPajak)) { const l = pajakPer.get(r.spj_id) ?? []; l.push({ id: r.id, jenis_pajak_id: r.jenis_pajak_id, nominal: Number(r.nominal) }); pajakPer.set(r.spj_id, l); }
    const rekPer = new Map<string, Baris[]>(); for (const r of a<Baris>(spjRek)) { const l = rekPer.get(r.spj_id) ?? []; l.push({ id: r.id, account_name: r.account_name, bank_name: r.bank_name, account_number: r.account_number, alias: r.alias ?? null }); rekPer.set(r.spj_id, l); }
    ganti(data.spj, a<Baris>(spj).map((r) => ({ ...r, entri_pajak: pajakPer.get(r.id) ?? [], rekening_penerima: rekPer.get(r.id) ?? [] }) as SPJ));
    ganti(data.bku, a(bku));
    ganti(data.tokenVerifikasi, a(token));
    ganti(data.formatNomorVerifikasi, a<FormatNomorVerifikasi>(fmt));

    const refPer = new Map<string, string[]>(); for (const r of a<Baris>(dirRef)) { const l = refPer.get(r.direktori_id) ?? []; l.push(r.spj_id); refPer.set(r.direktori_id, l); }
    ganti(data.direktoriTransaksional, a<Baris>(dir).map((r) => ({ ...r, referensi_spj_ids: refPer.get(r.id) ?? [] }) as DirektoriTransaksionalSPJ));
    ganti(data.rekeningBankDirektori, a<Baris>(rekBank).map((r) => ({ ...r, alias: r.alias ?? null, created_at: keWita(r.created_at), updated_at: keWita(r.updated_at) }) as never));
    ganti(data.auditEvents, a<Baris>(audit).map((r) => ({ ...r, waktu: keWita(r.waktu) }) as never));
    for (const k of a<Baris>(konf)) {
      if (k.kunci === 'template_kuitansi') Object.assign(data.templateKuitansi, k.nilai);
      if (k.kunci === 'template_verifikasi') Object.assign(data.templateVerifikasi, k.nilai);
    }
    beritahu();
  })().finally(() => { berjalan = null; });
  return berjalan;
}

/** Muat ulang setelah operasi tulis, lalu beri tahu layar. */
export async function segarkan(): Promise<void> {
  if (berjalan) { try { await berjalan; } catch { /* muat ulang di bawah */ } }
  await muatSemua();
}

/** Kosongkan seluruh data di memori (saat keluar), supaya data pengguna sebelumnya tidak tersisa di browser. */
export function resetData(): void {
  if (!modeServer) return;
  kosongkanDataContoh();
  beritahu();
}
