# Migrasi 0021 — penugasan_pengelola_arsip_ta_berjalan
Sudah diterapkan ke Supabase (15 Nov 2026). Mengubah `public.adm_penugasan_tambah`: peran `pengelola_arsip` boleh ditambahkan pada TA selain "Arsip Read-Only"; peran lain tetap hanya pada TA Draft. Isi lengkap fungsi dapat dibaca dari basis data (`pg_get_functiondef`).

# Migrasi 0022 — arsip_bku_data_lembar_verifikasi
Sudah diterapkan (15 Nov 2026). `public.arsip_bku_daftar` kini juga mengembalikan token QR, verifikator, penerima, rekening, jenis belanja, dan rincian pajak (token terbaru per SPJ) agar halaman 1 bundel PDF dapat dibuat. Ditambah kebijakan baca `konfigurasi` hanya untuk kunci `template_verifikasi` bagi peran `pengelola_arsip`.

# Migrasi 0023 — arsip_admin_baca
Sudah diterapkan (15 Nov 2026). Admin boleh melihat/mengunduh Arsip (hanya baca) untuk TA mana pun: fungsi `arsip_*_daftar` dan `arsip_catat_unduh` menerima `p_ta` (dipakai hanya oleh Admin), `amanda.arsip_ta()` baru, kebijakan baca bucket `arsip-dokumen` dan `amanda.lampiran_boleh_baca` diperluas (Admin hanya untuk SPJ yang sudah dibukukan). Kelola kategori/dokumen tetap hanya Bendahara.
