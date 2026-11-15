# Keputusan pemilik yang mengubah atau melengkapi dokumen acuan

## 12 November 2026 — Pop-up SPJ berlangkah dan kelengkapan data
- **Tampilan:** membuat atau melengkapi SPJ memakai satu pop-up berlangkah (1 Isian Form → 2 Rekening Penerima → 3 Pajak → 4 Lampiran & Ajukan), bukan tab. Ini mengubah Dokumen 01 §15 poin 7 dan R-148 (yang menyebut SPJ di halaman sendiri). Pajak tidak lagi pop-up terpisah.
- **Penyimpanan:** data tersimpan sebagai draft pada setiap langkah ("Simpan & Lanjut").
- **Syarat diajukan ke Verifikator (ditegakkan di server, migrasi 0015):** isian Form Dinamis wajib terisi, minimal satu rekening penerima, dan lampiran PDF terunggah. Pajak tetap opsional ("SPJ tanpa pajak tetap dapat diterima").

## 12 November 2026 — Lampiran PDF di atas 5 MB
- Belum ada kompresi PDF. Berkas 5–30 MB disimpan apa adanya dan dicatat berstatus `FAILED` (migrasi 0012), bukan `SERVER_FALLBACK_COMPRESSED`.

## 12 November 2026 — Format nama
- Gelar belakang dipisah koma: "Adit, S.Sos" (migrasi 0013).

## Master Subkegiatan & Rekening Belanja (13 Nov 2026)
- Kolom/isian "Rincian" dihapus dari daftar dan form (kolom basis data dibiarkan, tidak dipakai).
- Impor massal Excel (.xlsx) atau CSV: subkegiatan = kode + nama; rekening belanja = kode rekening + nama. Semua baris harus sah, kalau tidak, tidak ada yang disimpan. Kode yang sudah ada hanya diperbarui namanya.
- PDF daftar subkegiatan/rekening disimpan sebagai arsip rujukan (bucket `master-dokumen`, hanya Admin). PDF tidak dibaca otomatis.
- Perbaikan galat "Rekening/Subkegiatan tidak ditemukan": tombol Tambah mengirim ID kosong sehingga dianggap ubah. Kode ganda kini ditolak dengan pesan jelas.
- Semua galat operasi tulis kini selalu ditampilkan (sebelumnya ada yang diam-diam gagal).

## Larangan rangkap jabatan (2026-11-13)
Keputusan pemilik: satu orang dilarang merangkap jabatan pada TA yang sama (PA/KPA, Bendahara, PPTK, Verifikator), termasuk saat ditunjuk sebagai Plh./Plt. Ini memperluas Dokumen 01 §6 poin 1 (yang hanya melarang Bendahara merangkap PPTK). Satu orang tetap boleh memegang peran yang sama pada beberapa seksi. Ditegakkan di server (migrasi 0017); penugasan lama yang sudah merangkap tidak diubah otomatis dan harus dikoreksi Admin.

## Peran Pengawas/Auditor dihapus (2026-11-13)
Keputusan pemilik: peran Pengawas/Auditor dihapus total karena hanya memantau; pemantauan publik tetap lewat Portal Publik dan halaman Keaslian. Dampak terhadap dokumen acuan: Dokumen 01 §8–9 (akun dan jejak unduhan Pengawas), Dokumen 03 §7 (workflow Pengawas), Dokumen 04 (akun Pengawas), Dokumen 05 §2 (kolom Pengawas) dan skenario H, serta login dengan email tidak berlaku lagi. Migrasi 0018 menghapus tabel `akun_pengawas`, `penugasan_pengawas_ta`, tujuh fungsi `adm_pengawas_*`/`pengawas_catat_aksi`, dan jalur login email. Login kini hanya NIP/NIK. Entri audit lama bernilai `aksi_pengawas` tetap diperbolehkan oleh batasan tabel agar riwayat tidak rusak.

## Modul Arsip Keuangan dan WhatsApp (2026-11-15)
- **Arsip dahulu, WhatsApp ditunda:** dokumen Pilar 01–08 dan draf Arsip SPJ BKU v7.0 dipakai untuk modul Arsip. Seluruh fitur WhatsApp Bot (tombol interaktif, notifikasi 09:00) ditunda karena memerlukan WhatsApp Business API berbayar.
- **Tanpa Auditor/Pengawas:** baris Auditor pada Pilar 05 dan draf Arsip diabaikan; peran itu sudah dihapus total. Akses Arsip: Pengelola Arsip, Bendahara, Verifikator (lihat/unduh); hanya Bendahara yang mengelola kategori dan dokumen Non-BKU.
- **Pengelola Arsip** (peran opsional, instansi) dapat ditugaskan pada TA Draft maupun TA yang sedang berjalan (bukan TA Arsip Read-Only). Larangan rangkap jabatan tetap berlaku. Migrasi `penugasan_pengelola_arsip_ta_berjalan` (docs/migrasi/0021).
- **Unduhan:** setiap BKU diunduh sebagai satu PDF bundel (halaman 1 Lembar Verifikasi hitam-putih + QR keaslian, halaman berikutnya lampiran SPJ), bernama `[No_BKU_sanitasi].pdf`; ZIP massal memuat `00_DAFTAR_ARSIP_BKU.xlsx`. Berkas dirakit di peramban dengan `pdf-lib` saat diunduh (tidak disimpan permanen, tanpa hash SHA-256). Workflow build memakai `npm install` (bukan `npm ci`) agar paket baru terpasang otomatis.
- **Admin boleh melihat dan mengunduh Arsip** (hanya baca) pada TA mana pun, dengan pemilih TA di halaman Arsip (disetujui pemilik, migrasi 0023).

## Formulir Dinamis: jenis isian lengkap (2026-11-16)
- Permintaan pemilik: Admin dapat memilih banyak jenis isian seperti Google Formulir.
- Jenis isian: jawaban singkat, paragraf, angka, pilihan ganda, kotak centang, drop-down, skala linier (0/1 sampai 2–10), rating (3–10 bintang), kisi pilihan ganda, petak kotak centang, tanggal, waktu. Tipe "Upload file" lama tetap terbaca tetapi tidak ditawarkan untuk field baru (berkas diunggah di langkah Lampiran).
- Field dapat diubah setelah dibuat. Teks pilihan, baris, kolom tidak boleh memuat `;` `:` `|` dan tidak boleh kembar. Jawaban disimpan sebagai teks, sehingga tidak perlu migrasi basis data dan form lama tetap berlaku.
