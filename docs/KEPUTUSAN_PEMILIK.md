# Keputusan pemilik yang mengubah atau melengkapi dokumen acuan

## 12 November 2026 — Pop-up SPJ berlangkah dan kelengkapan data
- **Tampilan:** membuat atau melengkapi SPJ memakai satu pop-up berlangkah (1 Isian Form → 2 Rekening Penerima → 3 Pajak → 4 Lampiran & Ajukan), bukan tab. Ini mengubah Dokumen 01 §15 poin 7 dan R-148 (yang menyebut SPJ di halaman sendiri). Pajak tidak lagi pop-up terpisah.
- **Penyimpanan:** data tersimpan sebagai draft pada setiap langkah ("Simpan & Lanjut").
- **Syarat diajukan ke Verifikator (ditegakkan di server, migrasi 0015):** isian Form Dinamis wajib terisi, minimal satu rekening penerima, dan lampiran PDF terunggah. Pajak tetap opsional ("SPJ tanpa pajak tetap dapat diterima").

## 12 November 2026 — Lampiran PDF di atas 5 MB
- Belum ada kompresi PDF. Berkas 5–30 MB disimpan apa adanya dan dicatat berstatus `FAILED` (migrasi 0012), bukan `SERVER_FALLBACK_COMPRESSED`.

## 12 November 2026 — Format nama
- Gelar belakang dipisah koma: "Adit, S.Sos" (migrasi 0013).
