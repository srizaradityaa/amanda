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
