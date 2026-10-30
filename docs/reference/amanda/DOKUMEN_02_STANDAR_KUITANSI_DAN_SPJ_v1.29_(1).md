# DOKUMEN 02: STANDAR KUITANSI, SPJ, VERIFIKASI & BKU
**Sistem:** AMANDA (Aplikasi Manajemen Data Anggaran)  
**Status:** Terkunci & Disahkan (Single Source of Truth)  
**Tahun dokumen:** 2026
**Versi:** 1.29 (29 Oktober 2026)


## 1. Prinsip pemisahan dokumen
Kuitansi dan SPJ adalah dokumen/proses yang berbeda. Kuitansi dibuat lebih dahulu sebagai bukti pembayaran bruto dan komitmen terhadap SPD. SPJ menyusul, terikat tepat satu kuitansi, dan memuat rincian jenis belanja, pajak, serta bukti pendukung. Dokumen ini mengatur seluruh alur transaksi yang telah dibahas dan disahkan secara final.

## 2. Kuitansi universal
### 2.1 Tata letak dan isi
- Satu template universal digunakan untuk seluruh jenis belanja; bukan template berbeda per jenis belanja.
- Format cetak mengikuti contoh yang diberikan: kertas F4 dibagi dua.
- Header memuat kotak Tahun Anggaran di kiri atas, logo/nama instansi, serta tabel kanan atas dengan satu baris berisi `{Kode Subkegiatan}` dan `{Kode Rekening Belanja}`.
- `{Kode Subkegiatan}` dan `{Kode Rekening Belanja}` diambil dari kode master data. Pada baris kanan atas hanya kodenya yang ditampilkan. No. BKU dan tanggal BKU tidak tampil di kuitansi; keduanya hanya dicatat di Buku Kas.
- **Peniadaan Nomor Kuitansi:** Sistem tidak menggunakan penomoran kuitansi (baik otomatis maupun manual). Kuitansi diidentifikasi secara internal oleh sistem melalui relasi transaksi, kode subkegiatan, kode rekening, uraian, dan tanggal. Satu-satunya nomor pembukuan resmi yang dicatat adalah Nomor BKU oleh Bendahara.
- Badan kuitansi menampilkan sumber dana, nilai bruto, terbilang, `UNTUK PEMBAYARAN {uraian}`, lalu `Sub Keg. : {Nama Subkegiatan}`.
- Empat blok tanda tangan disusun 2x2: PA/KPA, Bendahara Pengeluaran, PPTK, dan Penerima.
- Nama dan NIP pada blok PA/KPA, Bendahara Pengeluaran, dan PPTK diambil dari snapshot penugasan sesuai Dokumen 01 §6 poin 11. Jika penandatangan adalah pejabat Plh./Plt., keterangan atribut jabatan tampil di bawah nama, misalnya "Plh. PPTK Seksi X".
- Bagian Penerima memuat `[Tempat], [Tanggal Kuitansi]`; tempat adalah teks konfigurasi, tanggal adalah tanggal kuitansi.

### 2.2 Elemen yang tidak boleh tampil
- Nomor Kuitansi (tidak ada penomoran kuitansi dalam bentuk apa pun).
- `Kegiatan : {Nama Kegiatan}`.
- `Rekening bank penerima: ________`.
- Daftar pelaksana/nama personel.
- Kotak verifikasi pemeriksaan.
- Nama rekening belanja. Pada baris kanan atas hanya kode subkegiatan dan kode rekening belanja yang ditampilkan; nama subkegiatan hanya muncul pada baris `Sub Keg.` di badan kuitansi.

Pajak dan rincian teknis jenis belanja tidak dicantumkan pada kuitansi; keduanya berada pada SPJ. Kuitansi mencatat nilai bruto.

### 2.3 Editor template
Admin mengelola tata letak dan teks melalui Visual Live Editor tanpa coding, dengan preview cetak. Opsi unggah template `.doc`/`.docx` merupakan alternatif. Editor mengatur template, bukan menggantikan data transaksi; data seperti TA, uraian, nominal, subkegiatan, pejabat dan tanggal diisi dari transaksi/Workspace TA sesuai sumbernya. Editor juga mengatur template Hasil Verifikasi SPJ (§8).

## 3. Data yang diisi Seksi/PPTK saat membuat kuitansi
1. Subkegiatan yang tersedia untuk seksinya pada TA tersebut.
2. Rekening belanja di bawah subkegiatan itu.
3. Nominal bruto.
4. Uraian pembayaran.
5. Nama penerima dan identitas yang diperlukan.
6. Tanggal kuitansi.

Data TA, instansi, kode/nama subkegiatan dan rekening, nilai terbilang, serta identitas pejabat yang sesuai penugasan aktif pada waktu pembuatan dokumen (Dokumen 01 §6 poin 11) diambil atau dihitung dari data terkait. No. BKU dan tanggal BKU dicatat pada pembukuan Bendahara di Buku Kas, tidak di kuitansi.

## 4. Alur kuitansi dan dampak saldo
1. Gatekeeper anggaran mengizinkan atau menahan pembuatan kuitansi dan SPJ baru sesuai status kesiapan alokasi seluruh seksi (Dokumen 01 §3.2). Gatekeeper tidak menahan pemrosesan SPJ yang sudah ada, verifikasi, maupun pencatatan BKU.
2. Seksi/PPTK membuat dan menyimpan kuitansi dengan nilai bruto. Kuitansi berstatus **Aktif**.
3. Kuitansi Aktif mengunci/mengurangi saldo SPD yang tersedia sebagai komitmen. Saldo yang sudah terikat tidak dapat dipakai membuat kuitansi lain.
4. Status kuitansi:
   - **Aktif:** belum dikaitkan SPJ, yaitu belum ada SPJ Draft. Boleh diedit dan dibatalkan pada status TA Aktif Penuh; pada Masa Transisi hanya boleh dibatalkan (§7). Pembatalan kuitansi melepas komitmen SPD.
   - **Terkunci:** sudah dikaitkan SPJ, yaitu sejak SPJ Draft dibuat dan selama SPJ masih terkait. Tidak dapat diedit atau dibatalkan. Untuk mengubahnya, SPJ harus dilepas atau dibatalkan dari kuitansi terlebih dahulu. Pelepasan SPJ Draft mengembalikan kuitansi menjadi Aktif.
   - Tidak ada status Dibatalkan. Kuitansi yang dibatalkan langsung dihapus dan tidak meninggalkan jejak (§6.3).
5. Kuitansi dapat dicetak.
6. **Sifat dan Input BKU:**
   - **Input Manual & Keunikan:** No. BKU diinput secara manual oleh Bendahara (bukan auto-number sistem) untuk menyesuaikan penomoran buku kas fisik/manual instansi. No. BKU wajib unik per TA; sistem menolak No. BKU yang sedang aktif dipakai di TA yang sama.
   - **Cakupan Murni Pengeluaran Belanja:** BKU AMANDA murni merupakan buku pembukuan realisasi pengeluaran belanja per kuitansi/SPJ. Sistem tidak mencatat transaksi penerimaan kas, SP2D (UP/GU/TU/LS), maupun saldo kas tunai/bank.
   - **Fleksibilitas Penanggalan (Bebas Batasan Kronologis):** Sistem membebaskan penanggalan transaksi tanpa validasi urutan kronologis antara Tanggal Kuitansi, tanggal pengajuan SPJ, dan Tanggal BKU, guna mengakomodasi pencatatan faktual lapangan maupun input susulan (backdate).
   - **Ketentuan Nomor Dicabut & Satu BKU per Kuitansi:** Jika suatu BKU dicabut melalui alur pencabutan berjenjang (§6.2), nomor BKU tersebut berstatus bebas kembali dan sah digunakan untuk transaksi kuitansi/SPJ lain di TA yang sama. Satu kuitansi hanya boleh memiliki satu BKU; sistem menolak input BKU kedua.
7. Saat BKU dicatat, komitmen kuitansi berubah menjadi realisasi. Sisa SPD Bebas tidak berubah karena nilainya hanya berpindah dari komitmen ke realisasi.

## 5. Relasi SPJ dan verifikasi
- Satu kuitansi berpasangan dengan satu SPJ (1:1); kuitansi dapat dibuat terlebih dahulu.
- Seksi memilih jenis belanja di awal pembuatan SPJ, dan pilihan itu menentukan Form Dinamis yang tampil. Form disusun Admin per jenis belanja. Isian form manual; jangan mengasumsikan auto-kalkulasi yang belum disepakati.
- SPJ memuat rincian teknis belanja (Form Dinamis), pajak, serta unggahan bukti SPJ.
- Pajak diisi manual oleh Seksi sebagai bagian SPJ. Setelah isian SPJ disimpan, sistem menampilkan pop-up pajak. Seksi dapat menambah beberapa entri pajak; setiap entri memilih jenis pajak dari Master Jenis Pajak dan mengisi nominalnya secara manual. Sistem tidak menghitung pajak secara otomatis dari tarif atau master. Satu-satunya perhitungan otomatis terkait pajak adalah Total Pajak, yaitu jumlah seluruh entri pajak, dan Jumlah yang dibayarkan, yaitu nilai bruto dikurangi Total Pajak. Admin mengelola Master Jenis Pajak. Entri pajak tidak mengubah nominal bruto kuitansi. Sistem menolak penyimpanan entri pajak jika Total Pajak melebihi nilai bruto kuitansi terkait; Total Pajak yang sama dengan bruto tetap diterima, sehingga Jumlah yang dibayarkan bernilai nol. Pesan validasi menampilkan nilai bruto, Total Pajak, dan batas bahwa Total Pajak tidak boleh lebih dari nilai bruto kuitansi; entri yang ditolak tidak tersimpan. Penolakan ini hanya berlaku untuk pajak dan tidak berlaku untuk Form Dinamis. SPJ tanpa pajak diperbolehkan. Pajak tidak masuk Excel rekap isian SPJ; pajak dilaporkan pada rekap pajak per jenis pajak, hanya untuk SPJ yang sudah memiliki BKU (Dokumen 01 §9 poin 10).
- Isian Form Dinamis merupakan rincian administratif yang diisi oleh Seksi/PPTK untuk keperluan pertanggungjawaban. Pengisian ini bersifat pencatatan informasional murni dan tidak menambah maupun mengurangi anggaran. Sistem tidak melakukan validasi perhitungan matematis atau kecocokan antara total rincian pada Form Dinamis dengan nominal bruto kuitansi.
- Isian Form Dinamis disimpan sebagai jawaban SPJ sesuai versi form saat SPJ dibuat, dan dapat direkap per jenis belanja (Dokumen 01 §9). Unduhan Excel rekap tersebut berisi satu sheet per jenis belanja, dengan kolom berupa gabungan field dari versi form yang dipakai SPJ di sheet tersebut (Dokumen 01 §9 poin 6). Form dapat memiliki paling banyak satu blok berulang (Dokumen 01 §9 poin 9). Entri blok disimpan sebagai daftar pada SPJ, dan setiap entri menjadi satu baris di Excel.
- **Standar Format & Batas Berkas Unggahan (Terkunci):**
  - **Format Wajib:** Hanya menerima format `.pdf` (`application/pdf`). Berkas gambar mentah dan format dokumen lain ditolak.
  - **Hard Ceiling Berkas Asal:** Maksimum **30 MB** per berkas PDF sebelum optimasi. Berkas di atas batas ini ditolak sebelum kompresi.
  - **Client-First Threshold:** Berkas berukuran `<= 5 MB` diunggah tanpa kompresi. Berkas `> 5 MB` hingga 30 MB otomatis dikompresi lokal di peramban terlebih dahulu.
  - **Target Hasil:** Ukuran berkas final ditargetkan `<= 10 MB` (ideal `<= 5 MB`) dengan keterbacaan dokumen keuangan tetap terjaga.
  - **Server Fallback:** Jika kompresi peramban gagal, kehabisan memori, atau melewati toleransi proses 15 detik, sistem otomatis mengalihkan optimasi ke worker kompresi server. Kegagalan lokal tidak langsung menggagalkan unggahan.
  - **Integritas & Metadata:** Kompresi hanya mengubah representasi fisik berkas PDF, tidak mengubah Form Dinamis, data Excel, atau data transaksi terstruktur. Sistem menyimpan nama berkas asli, ukuran sebelum optimasi, dan ukuran akhir. File asli tetap dipertahankan sebagai arsip sesuai kebijakan retensi lampiran.
  - **Keterbacaan:** Target kompresi sekitar 150 DPI dan kualitas JPEG gambar minimal 70% sebagai pedoman teknis; teks nominal, tanda tangan, dan stempel harus tetap terbaca jelas.
  - **Uji Pra-Rilis:** Pengujian menggunakan PDF berukuran kecil, menengah, dan mendekati batas 30 MB pada perangkat kelas rendah; berkas hasil harus lolos pemeriksaan visual dan dapat diunduh kembali.
- **Status SPJ:** SPJ berstatus **Terkunci** sejak dikirim ke Verifikator dan tidak dapat diedit selama Terkunci. Setelah disetujui Verifikator, SPJ berstatus Menunggu BKU hingga Bendahara mencatat BKU; sesudah itu SPJ berstatus Dibukukan. SPJ Menunggu BKU dan Dibukukan tetap Terkunci, dan kuitansi terkait tetap Terkunci.
- **Penandatangan SPJ saat Plh./Plt.:** Tanggal pengajuan SPJ ke Verifikator menentukan pejabat penanggung jawab pada dokumen SPJ dan Hasil Verifikasi SPJ. SPJ yang diajukan sebelum delegasi dimulai tetap atas nama pejabat definitif, meskipun diverifikasi saat delegasi Plh./Plt. berjalan, karena penguncian terjadi sejak pengiriman.
- Verifikator dapat mengembalikan SPJ kepada Seksi sebagai Draft dengan catatan revisi wajib. Pengembalian membuka kunci SPJ, tetapi tidak melepas komitmen kuitansi dari SPD. Kuitansi tetap Terkunci selama SPJ masih terkait.
- SPJ berstatus Draft, yaitu yang belum dikirim atau dikembalikan Verifikator, boleh dilepas atau dibatalkan oleh Seksi. Kuitansi terkait kembali Aktif tanpa jejak. SPJ yang sudah dikirim berstatus Terkunci dan hanya dapat dilepas setelah dikembalikan Verifikator menjadi Draft. Jika BKU sudah dicatat, tindakan mengikuti pencabutan berjenjang §6.2.


- **Pengisian Rincian Rekening Bank Penerima (Split View Workspace):**
  - Pada formulir rincian penerima SPJ, antarmuka ditampilkan dalam mode layar terbagi (*Split View*):
    - **Panel Sisi Kiri (Direktori Rekening Bank):** Menyediakan daftar rekening yang telah terdaftar dengan kotak pencarian terpadu (*omni-search*). Pencarian dapat dilakukan secara fleksibel melalui Nama Penerima, Alias/Instansi, atau Nomor Rekening. Menekan tombol *"Pilih / Gunakan"* langsung mengisi rincian ke form sisi kanan secara otomatis.
    - **Panel Sisi Kanan (Form Rincian SPJ):** Tempat PPTK melengkapi data penerima pembayaran. Jika data belum tersedia di direktori kiri, PPTK mengetik manual data baru tanpa validasi angka/format unik yang membatasi.
  - **Auto-Capture Rekening Baru:** Saat rincian atau draf SPJ disimpan, data rekening baru otomatis tersimpan ke Direktori Rekening Bank sistem untuk pemakaian berulang di masa mendatang.
  - **Snapshot Permanen pada SPJ:** Data rekening yang dipilih/diinput pada SPJ disalin sebagai snapshot permanen dokumen transaksi. Pembersihan data atau penggabungan duplikat oleh Admin di direktori tidak mengubah data SPJ yang sudah berstatus Terkunci, Menunggu BKU, atau Dibukukan.
  - **Dampak Pembatalan SPJ Draft:** Pembatalan SPJ Draft menghapus dokumen SPJ secara bersih, namun data rekening baru yang sempat ter-capture ke Direktori Rekening Bank tetap tersimpan di direktori.

## 6. BKU, koreksi, dan pencabutan berjenjang
BKU menandai penyelesaian pembukuan oleh Bendahara dan mengubah komitmen menjadi realisasi kas.

1. **Koreksi tanpa pencabutan:** Bendahara dapat mengoreksi No. BKU atau tanggal BKU tanpa mencabut BKU, selama nominal tidak berubah. Sistem mengecek keunikan No. BKU. Setiap koreksi tercatat di Jejak Audit dengan nilai lama dan nilai baru.
2. **Pencabutan berjenjang:** Untuk mencabut BKU yang salah, urutan yang terkunci adalah:
   1. Bendahara mencabut BKU; pencabutan tercatat di Jejak Audit.
   2. Verifikator mengembalikan SPJ menjadi Draft dengan catatan.
   3. Seksi melepas SPJ dari kuitansi.
   4. Seksi membatalkan kuitansi.
   5. Sistem memulihkan komitmen/saldo SPD terkait.
3. **Pembatalan tanpa jejak mutlak:** Pembatalan kuitansi atau SPJ Draft benar-benar dihapus tuntas dari sistem tanpa meninggalkan jejak. Seluruh entri Jejak Audit yang terkait kuitansi atau SPJ tersebut, termasuk riwayat pencatatan, koreksi, dan pencabutan BKU, ikut terhapus bersih secara otomatis oleh sistem bersama data kuitansi atau SPJ. Tidak ada rekaman pembatalan yang tersisa di audit trail.

## 7. Izin aksi per status TA
| Aksi | Aktif Penuh | Masa Transisi | Arsip Read-Only |
|---|---|---|---|
| Membuat kuitansi baru | Boleh, jika gatekeeper terbuka | Tidak | Tidak |
| Membuat SPJ baru | Boleh, jika gatekeeper terbuka | Tidak | Tidak |
| Mengedit data kuitansi Aktif (nominal, uraian, penerima, tanggal) | Boleh | Tidak | Tidak |
| Membatalkan kuitansi Aktif | Boleh | Boleh | Tidak |
| Mengunggah dan mengajukan SPJ yang sudah ada | Boleh | Boleh | Tidak |
| Memverifikasi atau mengembalikan SPJ | Boleh | Boleh | Tidak |
| Mencatat BKU, dan mengoreksi No. BKU atau tanggal BKU | Boleh | Boleh | Tidak |
| Mencabut BKU | Boleh | Boleh | Tidak |
| Pengawas/Auditor | Baca saja | Baca saja | Baca saja |

Kuitansi Terkunci tidak dapat diubah pada status apa pun, kecuali SPJ-nya dilepas atau dihapus terlebih dahulu.

## 8. Cetak hasil verifikasi SPJ dan verifikasi keaslian (barcode)
1. Setelah SPJ disetujui Verifikator (berstatus Menunggu BKU atau Dibukukan), PPTK pada seksi SPJ tersebut, dan Verifikator untuk seluruh seksi, dapat mencetak "Hasil Verifikasi SPJ" dalam format PDF.
2. Cetakan memakai template terpisah yang diatur Admin melalui Visual Live Editor seperti template kuitansi (§2.3). Data berikut diisi dari sistem, bukan dari editor: TA, seksi, identitas SPJ, nomor verifikasi, tanggal verifikasi, nama dan NIP Verifikator, sub kegiatan, kode rekening belanja, uraian, nilai bruto, nama penerima, bank dan nomor rekening penerima, serta setiap entri pajak beserta nominal yang diisi manual. Jumlah yang dibayarkan dan Total Pajak dihitung sistem sesuai §5 dan dicetak. Admin dapat mengubah tata letak, label, teks statis, logo, dan gambar stempel, tetapi tidak dapat mengubah data sistem dari editor.
3. Setiap cetakan memuat dua pengenal yang terpisah. (a) Barcode (QR) berisi tautan verifikasi keaslian dengan token acak yang dibuat sistem saat SPJ disetujui. Token tidak dicetak sebagai teks, bukan nomor urut, dan tidak memuat nomor kuitansi. (b) Nomor verifikasi tercetak sebagai teks di samping barcode. Sistem membuat nomor secara otomatis bersamaan dengan token, dengan urutan yang terus bertambah dalam TA dan tidak pernah dipakai ulang. Nomor tidak sama dengan token, serta tidak memuat nomor kuitansi, nominal, atau nama. Admin mengatur format nomor per TA (awalan, pemisah, pola tahun, dan jumlah digit urut). Nomor yang sudah tercetak tidak berubah ketika format diganti. Nomor verifikasi tidak dipakai sebagai pengganti token pada tautan.
4. Halaman verifikasi keaslian dapat dibuka tanpa login. Halaman hanya menampilkan status keaslian (Berlaku atau Tidak berlaku), nama TA, nama seksi, dan tanggal verifikasi. Halaman tidak menampilkan nominal, nama penerima, NIP/NIK, nomor rekening, lampiran, rincian kuitansi/SPJ, atau jejak audit. Ketentuan ini berlaku pada respons server, bukan hanya pada tampilan.
5. Status keaslian mengikuti status SPJ. Jika Verifikator mengembalikan SPJ menjadi Draft atau BKU dicabut, halaman menampilkan Tidak berlaku untuk cetakan sebelumnya. Setelah SPJ kembali disetujui, token dan nomor verifikasi baru dibuat, dan token serta nomor lama tidak berlaku.
6. Pencetakan ulang diperbolehkan selama SPJ berstatus Menunggu BKU atau Dibukukan. Cetakan untuk SPJ berstatus Draft atau Terkunci ditolak. Selama token belum berganti, cetakan ulang memuat nomor verifikasi dan barcode yang sama.
7. Nama dan NIP pejabat pada Hasil Verifikasi SPJ diambil dari snapshot penugasan sesuai Dokumen 01 §6 poin 11. Cetak ulang selalu memakai snapshot tersebut dan tidak berubah setelah delegasi Plh./Plt. berakhir.

## 9. Unduh lampiran PDF SPJ
1. Lampiran PDF SPJ dapat diunduh oleh: Bendahara, Verifikator, dan PA/KPA untuk seluruh seksi; PPTK untuk seksinya sendiri.
2. Admin, Pengawas/Auditor, dan Publik tidak dapat mengunduh lampiran, termasuk melalui URL langsung.
3. Berkas yang diunduh adalah berkas final yang tersimpan pada SPJ. Berkas asli tetap menjadi arsip sistem sesuai kebijakan retensi lampiran.
