# Migrasi 0021 — penugasan_pengelola_arsip_ta_berjalan
Sudah diterapkan ke Supabase (15 Nov 2026). Mengubah `public.adm_penugasan_tambah`: peran `pengelola_arsip` boleh ditambahkan pada TA selain "Arsip Read-Only"; peran lain tetap hanya pada TA Draft. Isi lengkap fungsi dapat dibaca dari basis data (`pg_get_functiondef`).
