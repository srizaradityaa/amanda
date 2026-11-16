# Migrasi 0021 — penugasan_pengelola_arsip_ta_berjalan
Sudah diterapkan ke Supabase (15 Nov 2026). Mengubah `public.adm_penugasan_tambah`: peran `pengelola_arsip` boleh ditambahkan pada TA selain "Arsip Read-Only"; peran lain tetap hanya pada TA Draft. Isi lengkap fungsi dapat dibaca dari basis data (`pg_get_functiondef`).

# Migrasi 0022 — arsip_bku_data_lembar_verifikasi
Sudah diterapkan (15 Nov 2026). `public.arsip_bku_daftar` kini juga mengembalikan token QR, verifikator, penerima, rekening, jenis belanja, dan rincian pajak (token terbaru per SPJ) agar halaman 1 bundel PDF dapat dibuat. Ditambah kebijakan baca `konfigurasi` hanya untuk kunci `template_verifikasi` bagi peran `pengelola_arsip`.

# Migrasi 0023 — arsip_admin_baca
Sudah diterapkan (15 Nov 2026). Admin boleh melihat/mengunduh Arsip (hanya baca) untuk TA mana pun: fungsi `arsip_*_daftar` dan `arsip_catat_unduh` menerima `p_ta` (dipakai hanya oleh Admin), `amanda.arsip_ta()` baru, kebijakan baca bucket `arsip-dokumen` dan `amanda.lampiran_boleh_baca` diperluas (Admin hanya untuk SPJ yang sudah dibukukan). Kelola kategori/dokumen tetap hanya Bendahara.

## 0024 pagu_induk_otomatis_bendahara_tempatkan_sk_menyusul (+ sk_menyusul_tangani_berkas_kosong)
- Trigger `tr_hitung_induk` pada `alokasi_subkegiatan` memperbarui `tahun_anggaran.pagu_induk` (murni) atau `pagu_induk_perubahan` (APBD-P) = total pagu subkegiatan, selama belum disahkan.
- `adm_ta_buat` menerima pagu 0 (diabaikan); `adm_ta_edit_pagu` dan `adm_apbdp_koreksi` ditolak; `adm_apbdp_aktifkan` mengabaikan nilai.
- `bend_alokasi_sub_simpan` tanpa batas induk; `bend_sahkan` mensyaratkan total > 0.
- Baru: `bend_pemetaan_tambah`, `bend_pemetaan_hapus`; `adm_pemetaan_*` ditolak.
- `adm_penugasan_tambah` selalu provisional (SK menyusul); `adm_sk_tambah` dan `adm_sk_lengkapi` menghitung provisional dari kelengkapan nomor, tanggal, berkas.
- `ta_checklist`: tanpa pagu induk dan pemetaan; SK hanya saran (`saran: true`).

### Catatan 0025: kolam subkegiatan TA
Migrasi `subkegiatan_ta_tarik_lalu_kaitkan`: tabel `subkegiatan_ta` (RLS baca per TA, bukan PPTK), RPC `bend_subkegiatan_tarik`, `bend_subkegiatan_buang`; `bend_pemetaan_tambah` mensyaratkan subkegiatan sudah ada di kolam; `bend_pemetaan_hapus` mengembalikan ke kolam dan ditolak bila pagu>0, kuitansi, atau SPD ada.
