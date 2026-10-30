# DOKUMEN 04: KAMUS DATA & BLUEPRINT RELASI ENTITAS
**Sistem:** AMANDA (Aplikasi Manajemen Data Anggaran)  
**Status:** Blueprint Konseptual Disahkan (Aturan Logika Terkunci, Skema Fisik Keputusan Teknis)  
**Tahun dokumen:** 2026
**Versi:** 1.34 (29 Oktober 2026)


## 1. Tujuan dan batas
Dokumen ini menjelaskan entitas dan aturan integritas berdasarkan keputusan bisnis yang telah dikunci. Istilah yang dipakai di seluruh dokumen dijelaskan di §9. Nama tabel, tipe database, indeks, dan migrasi fisik masih merupakan keputusan teknis saat implementasi; jangan menganggap dokumen ini sebagai SQL final.

## 2. Domain data global dan data per TA
### 2.1 Master global
| Entitas | Data utama | Prinsip |
|---|---|---|
| Master SOTK | ID (internal), nama unit, tanggal mulai (TMT), tanggal akhir (TMT Selesai), dasar hukum, pengganti_dari_id, status_versi (Aktif / Diarsipkan) | Flat murni; tanpa input kode manual; tanpa pengelompokan jenis unit; aksi Ubah (nomenklatur berversi H-1 vs typo ejaan) & aksi Arsipkan |
| Master Personel | ID, gelar depan, nama, gelar belakang, NIP, NIK, profil/pangkat sesuai kebutuhan | Lintas tahun; NIP fleksibel; NIK wajib bila NIP tidak ada |
| Akun Login | ID akun, personel terkait, username/email, status akun | Opsional 0..1 per personel; akun tidak menggantikan profil; NON-ACTIVE hanya memutus login, bukan penugasan |
| Akun Pengawas/Auditor | ID akun, nama lengkap, instansi asal, nomor dan tanggal surat tugas, email, tanggal akhir akses, status | Terpisah dari personel; tidak memiliki NIP/NIK wajib, pangkat, atau histori; password dikelola Admin |
| Master Subkegiatan | ID, kode, nama, rincian, status | Kamus global, tidak melekat permanen ke seksi |
| Master Rekening Belanja | ID, kode rekening, nama, rincian, status | Kode disimpan sebagai teks agar nol awal/tanda baca terjaga; kamus global, dapat dipakai di subkegiatan mana pun tanpa pembatasan daftar |
| Master Jenis Pajak | ID, kode (opsional), nama jenis pajak, status | Kamus global untuk pilihan pajak pada SPJ; nominal pajak diisi manual dan tidak dihitung dari master |

### 2.2 Snapshot/operasional TA
| Entitas | Data utama | Prinsip |
|---|---|---|
| Tahun Anggaran | Tahun, pagu induk, status siklus, mode APBD-P, tanggal arsip terakhir | Workspace terisolasi; penghapusan setelah memiliki transaksi hanya melalui retensi 12 tahun sejak tanggal arsip terakhir; paling banyak satu berstatus Aktif Penuh pada satu waktu |
| Seksi TA | Referensi versi SOTK, nama snapshot, periode/status | Perubahan master global tidak mengubah snapshot TA |
| Pemetaan Subkegiatan TA | TA, seksi TA, subkegiatan | Satu subkegiatan hanya untuk satu seksi per TA; satu seksi dapat banyak subkegiatan |
| Penugasan TA | Peran, personel, seksi opsional, TMT, akhir, provisional | Menyimpan riwayat; PA/KPA, Bendahara, Verifikator instansi, PPTK per seksi; satu personel sah memegang peran PPTK di lebih dari satu seksi pada TA yang sama |
| Penugasan Delegasi (Plh./Plt.) | TA, personel pengganti, peran yang digantikan (Bendahara, PPTK, atau PA/KPA), seksi jika PPTK, tanggal mulai, tanggal berakhir, status (Delegasi Aktif, Berakhir, atau Dicabut), alasan pencabutan dini, ID pejabat definitif | Entitas terpisah dari Penugasan TA definitif dan tidak mengakhiri atau memindahkannya; rentang tanggal inklusif; berakhir otomatis 23:59 WITA pada tanggal berakhir; pencabutan dini wajib beralasan; selama Delegasi Aktif hak transaksi definitif nonaktif; penunjukan ditolak bila personel memegang peran yang bertentangan (Dokumen 01 §6 poin 8) |
| Penugasan Pengawas TA | TA, akun Pengawas, tanggal mulai, tanggal akhir | Tanpa seksi; cakupan seluruh TA; berakhir pada tanggal akhir akses |
| Register SK | Penugasan, nomor/tanggal SK, berkas, status provisional | SK lama tetap dapat dibuka setelah penugasan berakhir |
| Versi Alokasi Anggaran | TA, fase (murni/perubahan/pergeseran), tanggal efektif, aktor | Append-only/berhistori secara konseptual; perubahan tidak menimpa jejak lama |
| Alokasi Subkegiatan | TA, subkegiatan, pagu | Dikelola Bendahara sesuai DPA |
| Alokasi Rekening | TA, subkegiatan, rekening, pagu | Dikelola PPTK/Seksi; total sama dengan pagu subkegiatan; perubahan pagu per fase dicatat di Versi Alokasi Anggaran; pasangan subkegiatan + rekening membedakan baris alokasi, unik per TA, subkegiatan, dan rekening; kunci internal berupa ID, kode gabungan (misal 5.1.02.02.6.2.01.01) hanya untuk tampilan dan pencarian |
| Ledger SPD | TA, rekening/alokasi, nilai SPD, perubahan, referensi | SPD otomatis 100% pagu yang disahkan; efisiensi/pergeseran berjejak |
| Kuitansi | TA, seksi, subkegiatan, rekening, penerima, bruto, uraian, tanggal kuitansi, status (Aktif atau Terkunci) | Satu kuitansi Aktif atau Terkunci mengikat komitmen SPD; kuitansi Terkunci sejak SPJ Draft dibuat dan tidak dapat diubah selama SPJ masih terkait; pada Masa Transisi seluruh data kuitansi Aktif tidak dapat diedit dan hanya pembatalan yang diizinkan; tidak ada status Dibatalkan, kuitansi yang dibatalkan langsung dihapus |
| Form Dinamis | Jenis belanja, versi, field (tipe, urutan, wajib/opsional, system tag), blok berulang (maksimal satu per form, berisi field) | Dibuat Admin per jenis belanja; setiap perubahan membentuk versi baru; SPJ menyimpan versi yang berlaku saat dibuat. Untuk perjalanan dinas mendukung tag `[SYS_PERSONNEL_ID]`, `[SYS_PERSONNEL_NAME]`, `[SYS_START_DATE]`, `[SYS_END_DATE]`; tag ID/nama berpasangan dalam konteks field/baris yang sama |
| SPJ | Kuitansi, jenis belanja (pilihan awal Seksi, menentukan form), versi form, jawaban (field tunggal dan entri blok berulang), daftar pajak (jenis pajak dari master dan nominal manual, banyak entri), lampiran PDF beserta nama asli, ukuran asal, ukuran final, dan status optimasi, status (Draft, Terkunci, Menunggu BKU, Dibukukan) | Relasi 1:1 dengan kuitansi; form snapshot saat dibuat; Total Pajak tidak boleh melebihi bruto kuitansi terkait (penyimpanan entri pajak ditolak); isian rincian bersifat informasional murni tanpa validasi matematis terhadap nominal bruto kuitansi; SPJ Terkunci sejak dikirim ke Verifikator; kuitansi terkait ikut Terkunci sejak SPJ Draft dibuat |
| Token Verifikasi SPJ | SPJ, token acak untuk barcode, nomor verifikasi (teks cetak, dibuat otomatis, urut dan tidak dipakai ulang per TA, tidak sama dengan token), waktu verifikasi, status (Berlaku atau Tidak berlaku) | Dibuat saat Verifikator menyetujui SPJ, bersama token dan nomor verifikasi; menjadi Tidak berlaku saat SPJ dikembalikan atau BKU dicabut; token dan nomor verifikasi baru dibuat saat verifikasi ulang; halaman keaslian publik tidak menampilkan nominal atau identitas |
| Format Nomor Verifikasi | Per TA: awalan, pemisah, pola tahun, jumlah digit urut | Diatur Admin; perubahan format tidak mengubah nomor yang sudah tercetak |
| Direktori Transaksional SPJ | Kunci identitas NIP/NIK yang dimasukkan, nama pasangan, referensi sumber/pembaruan seperlunya | Terpisah dari Master Personel; mencakup pegawai organik, honorer, narasumber, dan pihak luar tanpa kategori wajib; dipakai untuk lookup dan auto-fill; tetap dipertahankan saat SPJ dibatalkan/dihapus; Admin dapat mengoreksi dan merge duplikat dengan menjaga referensi SPJ historis |
| Rentang Penugasan SPJ | TA, SPJ, identitas NIP/NIK, tanggal mulai efektif, tanggal selesai efektif | Diperoleh dari field bertag pada Form Dinamis/snapshot jawaban; bukan komitmen terpisah. Validasi overlap hanya pada pengajuan ke Verifikator, dalam TA yang sama, terhadap status SPJ Terkunci/Menunggu BKU/Dibukukan |
| BKU | Kuitansi/SPJ terkait, nomor BKU (input manual), tanggal BKU, status | Menandai realisasi pengeluaran kas belanja (tidak mencatat penerimaan kas/SP2D); satu BKU per kuitansi; nomor diinput manual oleh Bendahara & unik per TA; penanggalan bebas tanpa batasan kronologis; koreksi No. BKU/tanggal tanpa pembatalan jika nominal tidak berubah; nomor BKU yang dicabut bebas digunakan kembali; pencabutan BKU |
| Audit Event | Waktu, aktor (ID akun, snapshot nama, NIP/NIK, peran saat aksi), entitas, aksi, nilai sebelum/sesudah, alasan | Merekam perubahan signifikan, pencabutan dan koreksi BKU, serta perubahan status akun. Pembatalan kuitansi atau SPJ Draft tidak dicatat; entri yang terkait kuitansi atau SPJ tersebut ikut terhapus otomatis oleh sistem dan tidak dapat dihapus manual. Penghapusan TA setelah retensi tidak dicatat, dan seluruh entri audit TA tersebut ikut terhapus. Aktor selalu personel nyata; Admin dapat membaca seluruh entri termasuk nominal. Pada aksi Delegasi Plh./Plt., entri memuat `definitive_officer_id` (ID pejabat definitif), `delegate_officer_id` (ID pejabat penerima delegasi), dan keterangan status Delegasi Aktif. Penetapan, tanggal berlaku, pencabutan dini, dan pengakhiran otomatis wajib tercatat; pengakhiran otomatis diberi penanda otomatis. |

### 2.3 Proyeksi agregat publik (tanpa akses data sumber)
| Proyeksi konseptual | Data yang boleh disajikan | Aturan |
|---|---|---|
| Statistik Keterbukaan Publik per TA | ID/tahun TA, total cacah SPJ, cacah per kategori status, persentase per kategori, persentase realisasi BKU terhadap pagu, waktu pembaruan | Hasil agregasi dihitung di server. Tidak ada nominal pagu/realisasi/sisa atau baris transaksi dalam payload publik. TA Aktif menjadi default; TA historis hanya untuk workspace yang tersedia. |
| Peringkat Realisasi per Seksi | ID seksi TA, nama snapshot seksi, persentase realisasi BKU terhadap pagu seksi, urutan peringkat | Hanya nama seksi dan persentase yang keluar ke pengunjung. Seksi dengan denominator nol/tidak tersedia tidak diberi persentase buatan dan ditandai belum tersedia. |
| Status Keaslian SPJ (halaman keaslian, Dokumen 02 §8) | Status Berlaku atau Tidak berlaku, nama TA, nama seksi, dan tanggal verifikasi; hanya untuk satu token yang diperiksa | Pengecualian terbatas dari portal agregat. Tidak ada persentase, cacah, nominal, identitas, lampiran, atau jejak audit. Token tidak dikenal atau tidak berlaku menghasilkan respons seragam. Tidak ada daftar atau pencarian token. |

- Rumus persentase realisasi publik: total BKU dibukukan ÷ pagu yang berlaku pada TA/cakupan yang sama × 100%. Komitmen kuitansi belum dibukukan tidak dihitung sebagai realisasi. Kalkulasi dilakukan di server; nominal mentah tidak dipulangkan ke klien.
- Kategori cacah SPJ: Selesai/Dibukukan BKU, Dalam Verifikasi, Perlu Perbaikan, dan Draf/Persiapan PPTK. Kategori saling eksklusif dan satu SPJ hanya masuk satu kategori. Karena status Draft dapat berasal dari persiapan atau pengembalian, pembeda workflow perlu direpresentasikan eksplisit sebagai status/penanda agar agregat akurat.
- Grafik pie/donut, gauge/busur, progres horizontal, ticker, dan fullscreen hanya memakai agregat yang diizinkan. Tooltip maupun metadata chart tidak boleh menyertakan nominal atau detail sumber. Pembaruan agregat dilakukan setiap 15–30 menit.
- Skema fisik, nama tabel, materialized view, endpoint, dan strategi cache merupakan keputusan teknis implementasi; proyeksi di atas adalah batas kontrak data, bukan SQL final.
- Akses anonim hanya boleh membaca proyeksi ini, ditambah baris status keaslian SPJ di atas yang hanya dapat dibuka melalui token pada barcode. Endpoint publik tidak boleh menyediakan akses ke tabel transaksi, file lampiran, identitas, atau audit.

### 2.4 Direktori Transaksional SPJ dan validasi jadwal
- Direktori Transaksional SPJ menyimpan pasangan NIP/NIK dan nama yang berasal dari pengisian Form Dinamis perjalanan dinas. Data ini bukan Master Personel, tidak membentuk akun, dan digunakan untuk lookup/auto-fill nama. Identitas dapat berasal dari pegawai organik, honorer, narasumber, atau pihak luar.
- Tag sistem tersembunyi: `[SYS_PERSONNEL_ID]` (NIP/NIK), `[SYS_PERSONNEL_NAME]` (nama pasangan), `[SYS_START_DATE]` dan `[SYS_END_DATE]`. Tag ID/nama harus berpasangan pada field utama yang sama atau pada satu entri blok berulang yang sama. Rentang tanggal pada tingkat dokumen dapat dipakai bersama untuk semua orang di blok; cakupannya ditentukan konfigurasi form.
- Jika NIP/NIK ditemukan, nama pasangan diisi otomatis; jika belum ada, nama diinput PPTK. Identitas dicatat/diperbarui di direktori saat SPJ disimpan atau diajukan. Penghapusan SPJ tidak menghapus profil direktori.
- Pemeriksaan jadwal dijalankan server-side hanya saat pengajuan ke Verifikator. Menyimpan Draft tidak diblokir. Dua rentang inklusif bentrok bila `Mulai Baru ≤ Selesai Lama` dan `Selesai Baru ≥ Mulai Lama`. Jika tanggal selesai kosong/sama dengan tanggal mulai, tanggal selesai efektif sama dengan tanggal mulai; tanggal selesai sebelum tanggal mulai ditolak.
- Cakupan bentrok: identitas sama, TA sama, SPJ pembanding berstatus Terkunci, Menunggu BKU, atau Dibukukan. Draft/yang dikembalikan untuk perbaikan tidak dihitung. SPJ yang dibatalkan/dihapus atau kembali ke status non-komitmen tidak lagi menahan jadwal. Pengajuan dan penetapan status dilakukan atomik untuk mencegah pengajuan serentak lolos bersamaan.
- Admin boleh mengoreksi dan menggabungkan entri direktori duplikat. Merge harus memperbarui referensi identitas validasi tanpa menghapus/mengubah isi historis SPJ yang telah tersimpan; perubahan administratif dicatat dalam Audit Event.


### 2.5. Direktori Rekening Bank (Global & Transaksional Mandiri)
- `bank_accounts_directory`: Koleksi referensi rekening bank yang dihimpun secara otomatis dari pengisian SPJ (*auto-capture*) dan dikelola Admin.
  - Atribut konseptual: `id`, `account_name` (nama pemilik/penerima), `bank_name` (nama bank), `account_number` (nomor rekening), `alias` (nama alias/instansi, opsional), `created_at`, `updated_at`.
  - Bersifat global lintas-seksi untuk memudahkan penggunaan ulang (*reusability*) rekening pihak ketiga/rekanan/pegawai.
  - Tidak memiliki indeks unik kaku yang memblokir penambahan variasi penulisan dari form PPTK. Penggabungan dan standardisasi dikontrol oleh Admin melalui fungsi *merge* dan koreksi.
  - Pembatalan transaksi SPJ tidak menghapus baris pada direktori ini.

## 3. Identitas personel, histori pangkat/gelar, dan akun login
- **Identitas Angka Fleksibel:** Jika memiliki NIP gunakan NIP; jika tidak memiliki NIP gunakan NIK. Input hanya menerima karakter angka, tanpa batasan kaku persis 18 atau 16 digit. Nilai angka wajib unik di direktori personel (validasi keunikan mengecualikan profil yang sedang diedit).
- **Atribut Wajib:** Nama lengkap, pangkat/golongan, Tanggal Mulai Berlaku (TMT), dan Nomor WhatsApp (hanya angka dan tanda +).
- **Atribut Opsional:** Gelar depan dan gelar belakang.
- **Histori Pangkat & Gelar Berversi:**
  - Setiap personel memiliki relasi ke tabel/log histori pangkat & gelar.
  - Saat pendaftaran baru, sistem otomatis mencatat entri histori awal.
  - Saat edit profil, jika terjadi perubahan pangkat atau gelar, sistem menyediakan opsi *"Simpan sebagai perubahan baru"*. Jika dipilih, periode sebelumnya ditutup dan catatan periode baru dibuat dengan TMT baru.
- **Akun Login Terpisah & Username Otomatis:**
  - Akun dikelola melalui dialog kelola akun terpisah.
  - Username dibangkitkan otomatis dari NIP personel (atau NIK jika NIP kosong).
  - Password minimal 6 karakter.
  - Status akun bertipe enum tegas: `Belum Ada Akun`, `ACTIVE`, `NON-ACTIVE`.
  - Menonaktifkan akun menjadi `NON-ACTIVE` tidak menghapus data personel maupun riwayat penugasan historisnya.
  - Menonaktifkan akun wajib disertai alasan yang tercatat di Audit Event. Admin tidak dapat menonaktifkan akun miliknya sendiri atau Admin ACTIVE terakhir.
  - Sebelum menonaktifkan, sistem menampilkan penugasan aktif yang terdampak. Penugasan tidak berubah otomatis.

- **Akun Pengawas/Auditor (terpisah dari personel):** Dibuat Admin dengan nama, instansi asal, nomor dan tanggal surat tugas (wajib), email, dan tanggal akhir akses. Password awal ditetapkan Admin (minimal 6 karakter) dan dikelola Admin seperti akun lain; pengguna tidak diwajibkan mengganti password saat login pertama. Akun tidak masuk Master Personel dan tidak memiliki histori pangkat atau gelar.
- **Spesifikasi Sesi Autentikasi & Isolasi Konteks (Single-Context Session):**
  - Autentikasi mendukung *single-field identifier* untuk NIP/NIK (personel) dan Email (auditor).
  - Objek payload sesi aktif mengikat secara atomik: `user_id`, `actor_type` (`internal` atau `auditor`), `active_ta_id`, `active_role`, dan `active_seksi_id` (khusus PPTK).
  - Sesi bersifat tunggal dan statis selama masa login. Tidak ada endpoint atau mekanisme mutasi `active_ta_id` atau `active_role` dalam sesi berjalan. Setiap perubahan TA atau peran mewajibkan terminasi token/sesi (*hard logout*) dan pembentukan sesi baru via login ulang.

## 4. Representasi angka dan kode
- Nominal disimpan sebagai nilai numerik presisi uang (representasi database final ditentukan saat implementasi), tidak sebagai teks berformat.
- Tampilan/edit nominal menggunakan pemisah ribuan titik, tanpa spin button, dan nilai kosong benar-benar kosong.
- Kode rekening belanja, nomor rekening bank, NIP/NIK, dan kode lain yang dapat berawalan nol disimpan sebagai teks. Jangan menjalankan format Rupiah pada kode.

Zona waktu sistem: WITA (UTC+8) untuk jendela input, tanggal arsip, dan seluruh tanggal/jam yang ditampilkan kepada pengguna.

Istilah nomor BKU: "No. BKU" adalah satu-satunya istilah untuk nomor pembukuan kas. Tidak ada istilah lain yang berbeda untuk nomor yang sama.

## 5. Konsistensi alokasi dan saldo
### 5.1 Keseimbangan pagu
- Jumlah pagu subkegiatan sama dengan pagu induk pada fase anggaran yang harus diseimbangkan.
- Pagu seksi adalah agregasi otomatis subkegiatan yang dipetakan ke seksi itu.
- Jumlah pagu rekening pada suatu subkegiatan sama dengan pagu subkegiatan.
- Gatekeeper memerlukan kesiapan semua seksi sebelum tombol buat kuitansi aktif secara global.

### 5.2 SPD dan saldo bebas
Konsep saldo bebas pada suatu alokasi rekening:

`Sisa SPD Bebas = SPD aktif - Komitmen Kuitansi Aktif - Realisasi BKU`

Efisiensi dan sumber pergeseran tidak boleh mengambil lebih dari saldo bebas. Pastikan implementasi menghindari penghitungan ganda atas nilai yang telah dibukukan sesuai model ledger yang dipilih.

### 5.3 Pagu perubahan
- Pagu murni, perubahan/pergeseran, dan pagu akhir harus dapat ditelusuri terpisah.
- Pagu baru tidak boleh lebih kecil dari realisasi kas BKU ditambah komitmen kuitansi aktif.
- Transaksi historis menunjuk versi anggaran/penugasan/form yang berlaku saat transaksi dibuat.

## 6. Dokumen, snapshot, dan histori
- Perubahan Master SOTK tidak memindahkan transaksi lama.
- Penugasan pejabat memiliki tanggal efektif; pejabat lama berakhir H-1 tanggal mulai pengganti. Penugasan Delegasi Plh./Plt. tidak memakai aturan H-1 ini karena tidak menggantikan penugasan definitif.
- Snapshot identitas pejabat, versi form SPJ, versi anggaran, dan data kuitansi perlu tersedia untuk cetak/peninjauan historis.
- Penghapusan TA hanya diperbolehkan jika TA belum pernah memiliki kuitansi, atau melalui retensi 12 tahun setelah TA Arsip Read-Only (D01 §1.3 poin 6); penanda "sudah ada transaksi" disimpan pada data TA dan tetap berlaku meskipun seluruh kuitansi telah dibatalkan.
- Pembatalan kuitansi Aktif diperbolehkan sesuai Dokumen 02 §4 dan §7 dan tidak meninggalkan jejak. Entri Audit Event yang terkait kuitansi atau SPJ tersebut ikut terhapus otomatis.
- Pencabutan BKU memakai urutan pencabutan berjenjang (Dokumen 02 §6) dan dicatat di Audit Event. Koreksi No. BKU atau tanggal BKU dicatat dengan nilai lama dan nilai baru.
- **Identitas Aktor Audit:** Setiap Audit Event menyimpan ID akun pelaku, snapshot nama lengkap, NIP/NIK, dan peran/jabatan pada saat aksi. Snapshot tidak berubah walau data personel kemudian diubah. Efek otomatis sistem (misalnya penutupan unit pada H-1) dicatat atas nama pengguna pemicunya dengan penanda otomatis.

- **Aktor Pengawas/Auditor:** Snapshot berisi nama lengkap, instansi asal, nomor surat tugas, dan peran Pengawas, sebagai pengganti NIP/NIK.

- Rekap pajak per jenis pajak membaca entri pajak pada SPJ yang sudah memiliki BKU (Dokumen 01 §9 poin 10). Entri pajak tidak mengubah nominal bruto kuitansi maupun komitmen SPD, dan tidak masuk rekap isian SPJ per jenis belanja.
- **Snapshot Penandatangan Dokumen:** Nama dan NIP pejabat pada dokumen cetak disimpan sebagai snapshot saat dokumen dibuat (kuitansi saat disimpan; SPJ dan Hasil Verifikasi SPJ saat diajukan ke Verifikator), termasuk keterangan Plh./Plt. bila berlaku. Cetak ulang tidak mengubah snapshot, dan snapshot tidak dihitung ulang setelah delegasi berakhir.


### 6.6. Snapshot Data Rekening Bank pada SPJ
- Ketika rincian SPJ disimpan, data penerima (`recipient_name`, `bank_name`, `account_number`, `alias`) disimpan sebagai bagian dari dokumen/payload SPJ (`spj_recipients` / snapshot transaksi).
- Snapshot ini bersifat *immutable* (tidak terpengaruh) terhadap operasi pembaruan (*update*), koreksi nama, atau penggabungan (*merge*) yang dilakukan Admin di tabel `bank_accounts_directory`.

## 7. Catatan untuk rancangan teknis lanjutan
Sebelum membentuk skema database final, tetapkan: mekanisme transaksi atomik lintas ledger, presisi mata uang, relasi lampiran (lampiran ikut dihapus saat TA diretensi), sisa granularitas audit event yang belum diputuskan (sebagian sudah ditetapkan di §2.2 dan §6), pembatasan akses baris per TA/seksi, serta perlakuan kode rekening yang berubah antar tahun.
- Laporan rekap isian SPJ per jenis belanja membaca jawaban SPJ per versi form. Pengelompokan mengikuti jenis belanja yang dipilih di awal SPJ, dan Excel berisi satu sheet per jenis belanja (Dokumen 01 §9 poin 4, 6–7). Pajak tidak termasuk rekap ini. Satu SPJ menjadi satu baris, atau satu baris per entri blok berulang (Dokumen 01 §9 poin 9).

## 8. Batasan penghapusan cadangan (konsep lanjutan)
- Penghapusan TA dilakukan total di database aktif dan penyimpanan berkas. Penghapusan dari salinan cadangan platform belum dapat dijamin dari aplikasi.
- Konsep "hapus total termasuk cadangan" dicatat sebagai kebutuhan lanjutan. Hanya dapat diterapkan jika platform menyediakan mekanisme penghapusan data tertentu dari cadangan atau masa simpan cadangan yang sesuai.
- Sampai ada kepastian tersebut, berlaku kebijakan retensi cadangan platform.

## 9. Glosarium istilah
Istilah berikut dipakai dengan arti yang sama di seluruh dokumen.
- **Komitmen Kuitansi Aktif:** nilai kuitansi berstatus Aktif atau Terkunci yang mengurangi SPD dan belum menjadi realisasi.
- **Realisasi:** nilai yang sudah dibukukan sebagai BKU.
- **Sisa SPD Bebas:** SPD aktif dikurangi Komitmen Kuitansi Aktif dan Realisasi.
- **Pembatalan:** menghapus kuitansi Aktif atau SPJ Draft tanpa jejak.
- **Pelepasan:** melepas SPJ Draft dari kuitansi. Kuitansi kembali Aktif tanpa jejak.
- **Pencabutan:** membatalkan BKU yang sudah dicatat. Tercatat di Jejak Audit.
- **Penghapusan TA:** penghapusan total seluruh data TA setelah masa retensi 12 tahun. Tidak meninggalkan catatan.
- **Status kuitansi:** Aktif atau Terkunci.
- **Status SPJ:** Draft, Terkunci, Menunggu BKU, atau Dibukukan.
- **Agregat publik:** proyeksi server-side yang hanya memuat persentase, cacah, nama TA/seksi, kategori status, dan waktu pembaruan yang disetujui untuk portal keterbukaan tanpa login.
- **No. BKU:** satu-satunya istilah untuk nomor pembukuan kas. Diinput secara manual oleh Bendahara (teks/angka bebas, divalidasi keunikan per TA). BKU AMANDA murni mencatat realisasi pengeluaran belanja per kuitansi, tanpa pencatatan penerimaan kas atau SP2D. Hubungan tanggal kuitansi, SPJ, dan BKU bersifat bebas tanpa batasan kronologis.

### 2.5 Proyeksi Analitik Burn-Rate & Early Warning Dasbor PA/KPA

Untuk mendukung kebutuhan analitik eksekutif PA/KPA tanpa membebani performa database transaksional, sistem menyediakan entitas agregasi atau *computed projection* harian di tingkat backend:

1. **Atribut Analitik per Seksi:**
   - `id_seksi`: Referensi ke seksi pada TA aktif.
   - `pagu_sah_terakhir`: Pagu Induk Seksi (sebelum APBD-P) atau Pagu Perubahan DPA-P (setelah APBD-P disahkan).
   - `realisasi_bku_terbukukan`: Total nominal kuitansi/SPJ yang telah memiliki `no_bku` dan berstatus `Dibukukan`.
   - `budget_burn_rate_pct`: `(realisasi_bku_terbukukan / pagu_sah_terakhir) * 100%`.
   - `time_elapsed_pct`: Persentase hari terlewati sejak 1 Januari dalam TA bersangkutan. Pada status TA Masa Transisi atau Arsip Read-Only, bernilai statis `100%`.
   - `bku_spike_14d_pct`: Akumulasi kenaikan serapan realisasi BKU dalam jendela 14 hari kalender terakhir (berdasarkan `tanggal_bku`).
   - `zona_analitik`: Enum (`HIJAU`, `KUNING`, `MERAH`, `ORANYE`) berdasarkan ambang batas matematis yang ditetapkan di Dokumen 01 §12.
   - `is_frozen`: Boolean penanda apakah metrik analitik dalam status terkunci/beku (true untuk Masa Transisi dan Arsip).

2. **Aturan Eksekusi Query & Caching:**
   - Evaluasi harian dihitung secara terjadwal atau saat pembukaan dasbor dengan mekanisme caching (TTL 15-30 menit) dalam zona waktu WITA.
   - Perhitungan lonjakan abnormal (Zona Oranye) mengevaluasi agregasi `tanggal_bku` dalam rentang 14 hari terakhir terhadap pagu sah terakhir seksi.
   - Seluruh payload endpoint analitik PA/KPA terisolasi di rute khusus internal PA/KPA dan Pengawas/Auditor, tidak pernah dipaparkan ke publik.

### 2.6 Metadata dan pipeline lampiran PDF SPJ

Entitas lampiran PDF menyimpan metadata yang memisahkan identitas berkas asli dari representasi hasil optimasi:

| Atribut | Keterangan |
|---|---|
| `original_file_name` | Nama berkas dari perangkat PPTK, dipertahankan untuk tampilan dan audit |
| `original_size_bytes` | Ukuran berkas sebelum proses kompresi |
| `stored_size_bytes` | Ukuran berkas final setelah optimasi, atau ukuran asal jika bypass |
| `compression_status` | `BYPASSED`, `CLIENT_COMPRESSED`, `SERVER_FALLBACK_COMPRESSED`, atau `FAILED` |
| `content_type` | Harus `application/pdf`; tipe lain ditolak |
| `storage_object_key` | Lokasi aman berkas final yang diotorisasi sesuai peran dan TA |

Aturan pipeline: berkas asal di atas 30 MB ditolak; berkas sampai dengan 5 MB melewati kompresi; berkas di atas 5 MB sampai 30 MB mencoba kompresi klien, lalu beralih ke worker server jika gagal atau timeout 15 detik. Hasil final ditargetkan paling besar 10 MB. Kegagalan server tidak boleh membuat status upload sukses palsu. Berkas asli dipertahankan sebagai arsip sesuai kebijakan retensi lampiran. Kompresi hanya memproses representasi PDF dan tidak pernah mengubah jawaban Form Dinamis atau ekspor Excel.
