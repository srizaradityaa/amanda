# DOKUMEN 03: WORKFLOW OPERASIONAL PER ROLE
**Sistem:** AMANDA (Aplikasi Manajemen Data Anggaran)  
**Status:** Terkunci & Disahkan (Single Source of Truth)  
**Tahun dokumen:** 2026
**Versi:** 1.52 (29 Oktober 2026)


## 1. Prinsip lintas role
- Master data bersifat global; setiap TA memiliki snapshot operasionalnya sendiri.
- **Autentikasi Cerdas & Desain Antarmuka Halaman Login:**
  - **Arsitektur Visual (Treasury & Market Terminal):**
    - Halaman login memakai tema Treasury & Market Terminal: nuansa terminal keuangan yang tenang dan mudah dibaca, bukan layar hitam pekat dengan teks hijau terang.
    - Latar memakai slate/charcoal gelap (`#0B1120`) dengan permukaan panel `#111827` dan garis tepi 1 px `#1F2937`. Halaman login tidak memakai efek kaca (*glassmorphism*), blur, gradasi cahaya, animasi, atau ticker.
    - Garis kisi mikro boleh dipakai sebagai ornamen statis tipis pada panel kiri, dengan kontras teks tetap memenuhi aturan aksesibilitas pada bagian Tema Visual.
  - **Tata Letak Responsif (Split-Hero):**
    - **Panel Kiri (Identitas & Wibawa Instansi):**
      - Header identitas resmi: *"Pemerintah Kabupaten Balangan • Kecamatan Batumandi"*.
      - Logo instansi daerah bersanding dengan jenama **AMANDA** (*Aplikasi Manajemen Data Anggaran*), tampil datar tanpa efek cahaya.
      - Pesan nilai/etos kerja aparatur muda: *"Tertib Administrasi, Akuntabel, dan Transparan dalam Setiap Rupiah."*
      - Halaman bebas dari ticker/banner animasi yang mengganggu fokus.
    - **Panel Kanan (Kartu Login Datar):**
      - Kartu datar dengan garis tepi 1 px dan tanpa blur atau bayangan tebal.
      - *Field Identitas Terpadu (Single-Field Identifier):* Satu kolom berlabel `NIP / NIK / Email Auditor` dengan teks monospace untuk NIP/NIK. Input angka dikenali sebagai personel internal; tanda `@` dikenali sebagai Pengawas/Auditor dan ditandai dengan ikon serta label teks "Akun Pengawas/Auditor", tidak hanya warna.
      - *Field Kata Sandi:* Dilengkapi **tombol intip sandi** (*toggle show/hide password*) responsif (password minimal 6 karakter).
      - *Tombol Aksi Utama:* Tombol *"Masuk ke Sistem"* berwarna amber (`#F59E0B`) dengan teks gelap (`#0B1120`). Saat diproses, tombol menampilkan teks "Memeriksa akun..." dan tidak dapat ditekan dua kali.
      - *Pesan Galat:* Galat login ditampilkan sebagai teks dengan ikon di atas tombol, tanpa menyebut apakah NIP atau kata sandi yang salah.
      - *Catatan Bantuan Admin:* Kotak informasi mikro berlabel tegas *"Lupa password atau akun terkendala? Hubungi Administrator Sistem."* (karena reset password bersifat terpusat oleh Admin).
      - *Tautan Cepat Portal Publik:* Tombol sekunder teal outline (`#2DD4BF`) berlabel jelas *"Lihat Ringkasan Publik"* untuk akses instan ke Portal Keterbukaan Informasi anonim tanpa login.
  - **Responsif Layar Sempit:** Pada layar sempit, panel kiri menjadi header ringkas di atas kartu login. Seluruh elemen tersusun satu kolom dengan field dan tombol selebar layar.
- **Tata Letak Dasbor (Sidebar & Topbar):**
  - Semua peran kecuali Pengawas/Auditor memakai sidebar untuk menu dan topbar tipis untuk konteks (TA aktif, peran aktif sebagai label, mini progress bar, dan logout).
  - Pengawas/Auditor memakai navigasi atas tanpa sidebar dan tanpa mini progress bar.
  - Admin hanya melihat Pagu Induk pada topbar.
  - Larangan dropdown ganti TA atau peran di topbar tetap berlaku.
- **Tema Visual Treasury (Login, Pro Mode, dan Mode Standar):**
  - **Token Bersama:** Seluruh antarmuka memakai satu set token warna, huruf, dan jarak. Nilai awal: latar `#0B1120`; permukaan `#111827`; garis tepi `#1F2937`; teks utama `#E5E7EB`; teks sekunder `#9CA3AF`; aksen utama amber `#F59E0B`; aksen sekunder teal `#2DD4BF`; status baik/naik hijau `#34D399`; kritis merah `#F87171`; peringatan kuning `#FBBF24`; lonjakan oranye `#FB923C`.
  - **Huruf:** Sans-serif (Inter) untuk teks umum dan judul. Monospace (JetBrains Mono) untuk NIP/NIK, kode TA, nomor BKU, nomor bukti, dan kode rekening. Angka nominal memakai angka tabular (lebar digit sama) agar kolom angka sejajar.
  - **Pro Mode (Dashboard Utama dan Monitoring/Analitik):**
    - Diterapkan pada dasbor utama dan modul monitoring atau analitik bagi pengelola keuangan tingkat lanjut, yaitu dasbor PA/KPA (§6 dan §11), dasbor Bendahara, dan dasbor Verifikator.
    - Kepadatan tinggi: ticker ringkasan horizontal di bagian atas (sesuai §6 dan §11), tabel rapat dengan tinggi baris sekitar 32 px, angka rata kanan, dan titik warna untuk zona analitik.
    - Pro Mode tidak mengubah cakupan data. Setiap dasbor hanya menampilkan angka yang diizinkan untuk role tersebut.
  - **Mode Standar (Input Transaksi dan Laporan Harian):**
    - Diterapkan pada halaman input kuitansi, SPJ, Form Dinamis, dan halaman BKU serta laporan harian.
    - Kepadatan lega: jarak antarelemen 16–24 px, ukuran teks dasar 16 px, tinggi baris tabel sekitar 48 px, dan hanya kolom yang diperlukan untuk keputusan.
    - Setiap layar memiliki satu aksi utama yang jelas. Pop-up dan halaman sendiri mengikuti Dokumen 01 §15.
    - Tidak ada tombol ganti mode. Mode standar otomatis dipakai pada layar kecil (di bawah 768 px), sedangkan Pro Mode mengikuti lebar layar yang lebih besar.
  - **Status dan Keterbacaan:** Setiap status (zona hijau, kuning, merah, dan oranye; status Dibukukan atau Terkunci; dan sejenisnya) wajib memakai teks atau ikon, tidak hanya warna. Kontras teks normal minimal 4,5:1 dan teks besar serta ikon minimal 3:1 (WCAG AA). Fokus keyboard memakai cincin amber 2 px yang terlihat. Transisi dibatasi, dan dimatikan jika pengguna memilih pengurangan gerak di perangkatnya.
  - **Batas Data:** Tema tidak mengubah cakupan data. Dasbor Admin tidak menampilkan realisasi atau sisa SPD (§2.1 poin 6 dan Dokumen 01 §6). Portal publik tidak menampilkan nominal rupiah (§9 poin 6). Portal publik mengikuti tema ini sesuai §9 poin 7–9.
- **Alur Masuk Berjenjang & Auto-Skip Pasca-Login:**
  1. **Admin:** Langsung masuk ke Dasbor Administrasi Global (Master & TA) tanpa melalui layar pemilih TA atau jabatan.
  2. **Pengawas/Auditor:** Langsung masuk ke Dasbor Pengawas (Laporan & Audit Trail Baca-Saja) TA yang ditugaskan. Jika surat tugas menugaskan lebih dari satu TA, Auditor memilih TA penugasan terlebih dahulu lalu langsung masuk ke dasbor TA tersebut.
  3. **Personel Internal (Bendahara, PPTK, Verifikator, PA/KPA):**
     - Jika personel hanya memiliki tepat 1 penugasan di 1 TA: sistem otomatis langsung masuk (*auto-skip*) ke dasbor TA dan jabatan tersebut.
     - Jika personel memiliki penugasan di lebih dari 1 TA: sistem menampilkan layar daftar TA penugasan terlebih dahulu, dilanjutkan layar daftar jabatan aktif pada TA yang dipilih (bila memegang lebih dari 1 jabatan di TA tersebut), baru kemudian masuk ke dasbor operasional.
     - Jika personel hanya memiliki penugasan di 1 TA tetapi memegang lebih dari 1 jabatan di TA tersebut: sistem langsung menampilkan layar daftar jabatan aktif lalu masuk ke dasbor operasional.
- **Isolasi Konteks Sesi & Larangan Alih Konteks Tanpa Logout:** Sesi operasional terisolasi ketat pada tepat satu TA (`active_ta_id`) dan satu Peran (`active_role`) yang aktif. Sistem dilarang menyediakan mekanisme alih TA (*switch TA*) atau alih peran (*switch role*) secara langsung di dalam aplikasi (misalnya melalui dropdown navbar). Untuk berpindah Tahun Anggaran atau berganti jabatan/peran, pengguna **wajib melakukan Logout** (menghancurkan sesi aktif) dan melakukan login ulang.
- Penugasan, transaksi, dan perubahan anggaran terikat pada TA dan masa berlaku masing-masing.
- **Delegasi Plh./Plt.:** Delegasi sementara mengikuti Dokumen 01 §6 poin 7–11. Penugasan Delegasi Aktif ikut dihitung dalam alur masuk berjenjang, dan selama delegasi aktif hak transaksi pejabat definitif nonaktif.
- Perubahan tidak menghapus sejarah. Dokumen lama tetap dapat ditelusuri dan diakses sesuai hak.
- Mini progress bar di topbar mengikuti Dokumen 01 §3.3; laporan PDF dan Excel mengikuti Dokumen 01 §9 dan hanya memuat data Dibukukan. Rincian Kartu Kendali Kegiatan per subkegiatan dan rekening belanja (Dokumen 01 §9 poin 2g) mengikuti cakupan laporan a. Unduhan Excel rekap isian SPJ berisi satu sheet per jenis belanja (Dokumen 01 §9 poin 6–7). Pajak tidak termasuk rekap isian SPJ; rekap pajak per jenis pajak (Dokumen 01 §9 poin 10, hanya SPJ yang sudah memiliki BKU) dapat dilihat Bendahara, PPTK untuk seksinya, Verifikator, PA/KPA, dan Pengawas.
- Input nominal memakai format Rupiah dengan pemisah ribuan titik; kode dan nomor rekening adalah teks.
- Pencarian dan filter hanya pada daftar yang ditetapkan, dan hanya dalam cakupan data peran pengguna. Aksi singkat dan konfirmasi memakai pop-up; isian panjang memakai halaman sendiri (Dokumen 01 §15).
- Rekening belanja adalah kamus global yang dapat dipakai di subkegiatan mana pun; pasangan subkegiatan dan rekening membedakan baris alokasi (Dokumen 04 §2.2).
- Setiap aksi tercatat atas nama personel yang login, bukan akun generik (lihat Dokumen 04 §6).
- Batas peran Admin dan pemisahan tugas mengikuti Dokumen 01 §6: Bendahara tidak boleh merangkap PPTK pada TA yang sama, dan hanya satu TA yang boleh berstatus Aktif Penuh pada satu waktu.

## 2. Admin
### 2.1 Menyiapkan master data
1. Mengelola Master SOTK datar: tambah unit atau buat versi pengganti dengan tanggal efektif; versi lama berakhir H-1 dan diarsipkan read-only.
2. Mendaftarkan personel dan mengelola histori:
   - Identitas Utama: Jika memiliki NIP gunakan NIP; jika tidak memiliki NIP gunakan NIK. Tidak ada batas kaku 18 atau 16 digit, input hanya angka dan wajib unik (kecuali terhadap profil diri sendiri saat edit).
   - Struktur Nama & Gelar: Nama lengkap (wajib), gelar depan (opsional), gelar belakang (opsional).
   - Data Wajib Tambahan: Pangkat/golongan (wajib), Tanggal Mulai Berlaku / TMT (wajib), dan Nomor WhatsApp (wajib, hanya angka dan tanda +).
   - Histori Pangkat & Gelar Berversi: Saat personel baru disimpan, sistem otomatis membuat entri awal histori pangkat dan gelar. Saat edit, jika pangkat/gelar berubah, tersedia opsi "Simpan sebagai perubahan baru" (menutup periode lama dan membuat periode baru berjejak) untuk menjamin akurasi dokumen historis.
   - Ringkasan Statistik & Navigasi: Halaman Manajemen Personel menyajikan kartu statistik (Total Personel, Akun Aktif, Entri Histori) serta navigasi ke Organisasi, Unit Kerja, dan Peta Jabatan.
3. Mengelola Akun Login (Dialog Kelola Akun):
   - Akses via tombol khusus "Akun" pada tabel personel.
   - Username otomatis dibuat oleh sistem dari NIP (atau dari NIK jika personel tidak memiliki NIP).
   - Jika belum memiliki akun, Admin dapat membuat akun baru dengan password minimal 6 karakter.
   - Jika akun sudah ada, Admin dapat mengatur ulang password dan mengubah status akun menjadi ACTIVE atau NON-ACTIVE.
   - Status akun pada tabel ditampilkan secara tegas: Belum Ada Akun, ACTIVE, atau NON-ACTIVE.
   - Menonaktifkan akun hanya memutus akses login. Penugasan dan riwayat personel tidak berubah; penugasan aktif tetap tercatat sampai diakhiri melalui mutasi.
   - Sebelum menonaktifkan, sistem menampilkan daftar penugasan aktif yang terdampak. Untuk Bendahara atau PPTK, peringatan menyebut bahwa transaksi seksi terkait terhenti sampai ada pengganti aktif. Alasan wajib diisi dan tercatat di Jejak Audit.
   - Admin tidak dapat menonaktifkan akun miliknya sendiri, dan tidak dapat menonaktifkan Admin ACTIVE terakhir.
   - Daftar penugasan menandai "akun NON-ACTIVE, penugasan masih aktif" sebagai peringatan.
3a. Mengelola Akun Pengawas/Auditor secara terpisah dari personel: membuat akun dengan nama, instansi asal, nomor dan tanggal surat tugas (wajib), email, dan tanggal akhir akses; menetapkan password awal; mengatur ulang password; mengubah status ACTIVE atau NON-ACTIVE dengan alasan tercatat. Password tidak diwajibkan diganti saat login pertama (Dokumen 01 §8).
4. Mengelola kamus global Subkegiatan dan Rekening Belanja tanpa menempelkan pagu lintas TA. Tidak ada daftar pasangan subkegiatan dan rekening yang dibatasi. Mengelola Master Jenis Pajak sebagai pilihan pajak pada SPJ.
5. Mengelola template Hasil Verifikasi SPJ, format nomor verifikasi Hasil Verifikasi SPJ per TA, dan template kuitansi universal dan Form Dinamis SPJ, termasuk menandai setiap field sebagai wajib atau opsional (Dokumen 01 §9 poin 8), membuat paling banyak satu blok berulang per form (Dokumen 01 §9 poin 9), serta mengonfigurasi tag sistem perjalanan dinas sesuai Dokumen 01 §11. Sebelum menyimpan, Admin dapat menguji form melalui tab "Pratinjau Langsung" di Visual Live Editor sesuai Dokumen 01 §9 poin 11.
6a. Mengelola Direktori Transaksional SPJ secara terpisah dari Master Personel: melihat daftar identitas yang terkumpul dari SPJ, mengoreksi nama/NIP/NIK, dan menggabungkan entri duplikat sambil menjaga relasi SPJ historis. Perubahan direktori dicatat sesuai Jejak Audit administratif. Direktori tidak membuat profil Master Personel atau akun login.
6. Melihat dashboard dengan countdown dan banner merah (mode baca saja), kartu TA beserta Pagu Induk, serta status TA. Admin tidak melihat alokasi, SPD, kuitansi, SPJ, verifikasi, atau BKU.
7. Membaca Jejak Audit, termasuk entri keuangan, untuk seluruh TA. Admin tidak dapat mengubah atau menghapus entri audit. Entri audit hanya terhapus otomatis bersama kuitansi atau SPJ yang dibatalkan (Dokumen 01 §6 poin 6).
8. Tidak memiliki tampilan drill-down anggaran (Dokumen 01 §7).

### 2.2 Membuat dan menyiapkan Workspace TA
1. Membuat TA, menetapkan Pagu Induk SKPD, dan memulai dengan status Draft.
2. Opsional menyalin hanya seksi aktif dan pemetaan subkegiatan dari TA sebelumnya. Pagu, SK dan mutasi tidak disalin.
3. Menarik seksi dari Master SOTK sebagai snapshot TA dan memetakan subkegiatan. Satu subkegiatan hanya dimiliki satu seksi pada TA yang sama; seksi boleh memiliki banyak subkegiatan.
4. Menetapkan PA/KPA, Bendahara, Verifikator tingkat instansi, dan PPTK untuk setiap seksi aktif. Satu personel sah dan diperbolehkan ditugaskan sebagai PPTK pada lebih dari satu seksi di TA yang sama jika diperlukan (misal karena keterbatasan pejabat). Pengawas/Auditor dapat ditugaskan ke TA tanpa seksi.
5. Mencatat SK; bila dokumen resmi terlambat, penugasan provisional dapat digunakan dan berkas/nomor SK dilengkapi kemudian.
6. Memeriksa konfigurasi sebelum mengaktifkan TA. Draft tanpa transaksi boleh dihapus; TA yang pernah memiliki kuitansi tidak boleh dihapus, meskipun kuitansinya sudah dihapus, kecuali melalui retensi 12 tahun (§2.3).
   - Sistem menolak aktivasi TA kedua selama masih ada satu TA berstatus Aktif Penuh.
   - Admin mengaktifkan TA secara manual. Sistem menampilkan checklist kesiapan (pagu induk, seluruh seksi terpetakan, penugasan PA/KPA, Bendahara, Verifikator, dan PPTK, serta SK atau penugasan provisional) dan hanya mengizinkan pengaktifan jika checklist lengkap.

### 2.3 Perubahan selama TA
- Mencatat mutasi SOTK atau pejabat dengan tanggal efektif dan audit trail; penugasan lama berakhir sehari sebelum penugasan pengganti.
- Menetapkan penugasan Delegasi Aktif (Plh./Plt.) dengan tanggal mulai dan tanggal berakhir, serta mencabutnya lebih awal dengan alasan tertulis. Sistem menolak penunjukan jika personel memegang peran yang bertentangan pada TA tersebut (Dokumen 01 §6 poin 8).
- Mengaktifkan fase APBD-P dan menetapkan Pagu Induk perubahan. Pembagian ulang dilakukan melalui alur Bendahara lalu PPTK/Seksi, bukan dengan menghapus histori.
- Menetapkan status TA ke Masa Transisi/Tutup Buku lalu Arsip Read-Only pada akhir siklus. Seluruh perpindahan status dilakukan Admin secara manual; sistem tidak memindahkan status berdasarkan tanggal. Sebelum menetapkan Arsip Read-Only, sistem menampilkan SPJ atau BKU yang belum selesai sebagai peringatan; keputusan tetap di tangan Admin.
- Admin tidak membagi pagu ke subkegiatan/rekening, tidak mengelola efisiensi SPD atau pergeseran, dan tidak membuat kuitansi, SPJ, verifikasi, atau BKU.
- Membuka kembali TA Arsip Read-Only secara manual bila diperlukan. Setiap kali TA diarsipkan kembali, masa retensi dihitung ulang dari tanggal arsip terbaru.
- Setelah TA Arsip Read-Only melewati 12 tahun sejak tanggal arsip terakhir (WITA), Admin dapat menghapus TA secara manual. Sistem menampilkan ringkasan jumlah kuitansi, SPJ, BKU, dan lampiran tanpa nominal, lalu Admin mengetik kode TA untuk konfirmasi. Penghapusan total menghapus seluruh data TA, lampiran, dan jejak audit terkait, tanpa catatan penghapusan. Salinan cadangan platform mengikuti kebijakan platform.

### 2.4 Pratinjau form dinamis (Admin)
1. Admin membuka tab "Pratinjau Langsung" di halaman Visual Live Editor, berdampingan dengan tab "Konfigurasi Editor". Pratinjau tidak dibuka sebagai pop-up, dan Admin berpindah tab tanpa kehilangan draf.
2. Pratinjau merender draf form yang belum disimpan, termasuk field wajib, blok berulang dengan tombol "+ Tambah", dan tag sistem, sesuai tampilan pengisian PPTK.
3. Field wajib yang dikosongkan memunculkan peringatan dan simulasi pengajuan ditolak. Field opsional yang kosong tetap diterima.
4. NIP/NIK pada field bertag dicari secara read-only di Direktori Transaksional SPJ. Jika ditemukan, nama terisi otomatis. Pencarian ini tidak mengubah direktori dan tidak menambah entri Jejak Audit.
5. Cek bentrok jadwal di pratinjau memakai data contoh yang terisolasi dan tidak membaca atau menampilkan SPJ operasional.
6. Isian pratinjau hanya berada di memori browser. Tidak ada data yang disimpan ke server, dan tidak membentuk kuitansi, SPJ, BKU, atau entri Jejak Audit.
7. Pratinjau hanya dapat diakses Admin. Peran lain ditolak oleh server, termasuk saat mengakses alamat secara langsung.
8. Uji batas satu blok berulang dilakukan di Form Builder, bukan di pratinjau. Pratinjau hanya menguji kenyamanan pengisian field bagi PPTK.
(Dokumen 01 §9 poin 11; Dokumen 05 skenario 64a sampai 64g.)

## 3. Bendahara Pengeluaran
1. Membagi Pagu Induk ke subkegiatan sesuai DPA hingga total sama dengan Pagu Induk. Pagu seksi dihitung otomatis.
2. Mengatur jendela waktu input alokasi (WITA) dan memantau countdown serta status penyelesaian seluruh seksi.
3. Menangani pembukaan kembali jendela input bila diperlukan. Selama ada seksi belum seimbang, gatekeeper menahan pembuatan kuitansi dan SPJ baru untuk semua seksi. Pemrosesan SPJ yang sudah ada dan pencatatan BKU tetap berjalan.
4. Mengelola efisiensi dengan menurunkan SPD, maksimal sebesar sisa SPD bebas.
5. Melakukan pergeseran anggaran; Seksi tidak memiliki kewenangan pergeseran. Sumber dibatasi sisa SPD bebas dan setiap perubahan berjejak.
6. Pada APBD-P, mengalokasikan pagu perubahan ke subkegiatan dan mengkoordinasikan penyelesaian alokasi rekening oleh PPTK.
7. Mencatat No. BKU dan tanggal BKU saat pembukuan, satu BKU per kuitansi. No. BKU diinput secara manual oleh Bendahara (bukan auto-number) dan wajib unik per TA. BKU AMANDA murni mencatat realisasi pengeluaran kas belanja per kuitansi/SPJ tanpa mencatat transaksi penerimaan kas (SP2D, UP, GU, TU) maupun saldo kas riil. Sistem membebaskan tanggal BKU tanpa batasan urutan kronologis terhadap tanggal kuitansi atau tanggal SPJ. Mengoreksi No. BKU atau tanggal BKU tanpa pencabutan jika nominal tidak berubah, dengan jejak di Jejak Audit. Mencabut BKU dan mengikuti urutan pencabutan berjenjang (Dokumen 02 §6).
8. Menekan tombol "Sahkan" setelah seluruh seksi berstatus Seimbang. SPD terbit sebesar pagu yang disahkan.
9. Tidak boleh merangkap PPTK/Seksi pada TA yang sama.
10. Melihat tampilan anggaran berjenjang seksi → subkegiatan → rekening belanja, dengan nilai pagu, realisasi, komitmen, sisa SPD bebas, serapan, dan status pada setiap tingkat.

- Menyusun dan mengunduh laporan kustom untuk seluruh seksi, dengan pilihan kolom sesuai Matriks Kolom yang Diizinkan per Peran (Dokumen 01 §9 poin 12).

## 4. PPTK / Seksi
1. Melihat seksi dan subkegiatan yang ditetapkan untuknya pada TA.
2. Setelah alokasi Bendahara tersedia, membagi pagu subkegiatan ke rekening belanja hingga total rekening sama persis dengan pagu subkegiatan. Satu rekening belanja dapat dialokasikan di lebih dari satu subkegiatan milik seksinya; setiap pasangan dialokasikan terpisah dan pasangan yang sama tidak boleh ganda.
3. Menyelesaikan alokasi sesuai tenggat. Jika satu seksi belum seimbang, pembuatan kuitansi ditahan untuk semua seksi.
4. Setelah gatekeeper terbuka, membuat kuitansi dengan memilih subkegiatan dan rekening, mengisi nominal bruto, uraian, penerima dan tanggal kuitansi.
5. Kuitansi mengikat saldo SPD sebagai komitmen. SPJ merupakan alur terpisah setelah kuitansi, sesuai aturan SPJ yang disepakati. Kuitansi Aktif dapat diedit atau dibatalkan sampai SPJ Draft dibuat pada status TA Aktif Penuh; pada Masa Transisi kuitansi Aktif hanya dapat dibatalkan, tidak diedit. Sejak SPJ Draft dibuat, kuitansi Terkunci. SPJ Draft dapat dilepas atau dibatalkan, dan kuitansinya kembali Aktif.
6. Seksi tidak boleh melakukan pergeseran anggaran.
7. Tidak melihat Pagu Induk instansi. Jejak Audit yang terlihat hanya entri milik seksinya sendiri.
8. Melihat drill-down anggaran hanya untuk seksinya: seksi → subkegiatan → rekening belanja.
9. Mengunduh laporan seksinya dalam PDF atau Excel (Dokumen 01 §9).
10. Mengisi Form Dinamis SPJ sesuai jenis belanja yang dipilih di awal SPJ. Jika form memiliki blok berulang, PPTK menambah entri sesuai jumlah item atau orang yang dicakup SPJ (Dokumen 01 §9 poin 9).

11. Mengisi pajak pada SPJ setelah isian SPJ disimpan: memilih jenis pajak dari Master Jenis Pajak, mengisi nominal secara manual, dan dapat menambah beberapa entri. Sistem tidak menghitung pajak secara otomatis dari tarif atau master. Satu-satunya perhitungan otomatis terkait pajak adalah Total Pajak, yaitu jumlah seluruh entri pajak, dan Jumlah yang dibayarkan, yaitu nilai bruto dikurangi Total Pajak. Sistem menolak penyimpanan jika Total Pajak melebihi nilai bruto kuitansi dan menampilkan pesan validasi yang menjelaskan batas tersebut (Dokumen 02 §5).
12. Mengunduh lampiran PDF SPJ seksinya (Dokumen 02 §9).
13. Mencetak Hasil Verifikasi SPJ dengan barcode untuk SPJ seksinya setelah SPJ disetujui Verifikator (Dokumen 02 §8).
14. Selama menjadi Plh./Plt. PPTK, menjalankan kewenangan PPTK untuk seksinya. Tidak memverifikasi SPJ yang ia ajukan atau kelola sendiri (Dokumen 01 §6 poin 9).

- Menyusun dan mengunduh laporan kustom untuk seksinya sendiri, dengan pilihan kolom sesuai Matriks Kolom yang Diizinkan per Peran (Dokumen 01 §9 poin 12).

## 5. Verifikator
1. Memeriksa SPJ yang diajukan Seksi.
2. Menyetujui untuk diteruskan ke proses pembukuan atau mengembalikan ke Seksi sebagai Draft dengan catatan revisi wajib.
3. Pengembalian membuka kunci SPJ menjadi Draft, tetapi tidak melepaskan kuitansi atau komitmen SPD.
4. Mengikuti urutan pencabutan berjenjang ketika BKU dicabut dan transaksi harus dikembalikan.
5. Melihat Pagu Induk pada kartu TA dan seluruh Jejak Audit TA, dalam mode baca saja.
6. Melihat drill-down anggaran seluruh seksi sampai rekening belanja, dalam mode baca saja.
7. Mengunduh laporan seluruh seksi dalam mode baca saja (Dokumen 01 §9).
8. Mengunduh lampiran PDF SPJ seluruh seksi (Dokumen 02 §9).
9. Mencetak Hasil Verifikasi SPJ dengan barcode dan nomor verifikasi untuk SPJ seluruh seksi setelah SPJ disetujui (Dokumen 02 §8).
10. Tidak memverifikasi SPJ yang ia ajukan atau kelola sendiri, baik sebagai pejabat definitif maupun Plh./Plt. PPTK (Dokumen 01 §6 poin 9).

- Menyusun dan mengunduh laporan kustom untuk seluruh seksi, dengan pilihan kolom sesuai Matriks Kolom yang Diizinkan per Peran (Dokumen 01 §9 poin 12). Kolom kuitansi, NIP/NIK, Nomor Rekening, dan kolom rekening belanja tersedia, dan NIP/NIK serta Nomor Rekening ditampilkan penuh tanpa penyamaran (Dokumen 01 §9 poin 12d dan Dokumen 05 skenario 158).

## 6. PA / KPA (Pengguna Anggaran / Kuasa Pengguna Anggaran)
1. **Peran Resmi Dokumen:** Menjadi otoritas penanggung jawab anggaran instansi yang identitasnya (nama, NIP, pangkat, jabatan) tampil otomatis pada blok tanda tangan resmi kuitansi universal (kiri atas) sesuai snapshot penugasan SK pada TA berjalan.
2. **Kewenangan Akun (Monitoring Eksekutif & Early Warning System):**
   - Mengakses Dashboard Eksekutif lintas seksi secara real-time dengan dukungan analitik cerdas *burn-rate vs time-elapsed*.
   - Memantau total Pagu Induk, progres realisasi kas BKU, sisa SPD bebas, dan serapan anggaran per seksi/subkegiatan.
   - **Widget Ringkasan Eksekutif (Early Warning Ticker):** Memantau kartu ringkasan instan di bagian atas dasbor ("X Seksi Zona Normal, Y Seksi Perlu Perhatian/Kuning/Merah, Z Seksi Terdeteksi Lonjakan/Oranye").
   - **Indikator Visual Titik Warna (Color Dot) & Tooltip:** Pada tabel drill-down per seksi, memantau ikon titik warna (🟢 Hijau, 🟡 Kuning, 🔴 Merah, 🟠 Oranye) beserta tooltip rincian deviasi burn-rate terhadap waktu berjalan. Seksi berstatus Kritis otomatis diprioritaskan di baris teratas.
   - Bersifat *read-only & advisory* (tidak membebani input transaksi atau approval berjenjang, dan tidak memblokir operasional; pengesahan transaksi tetap melalui tanda tangan fisik pada lembar kuitansi).
   - Melihat drill-down anggaran seluruh seksi sampai subkegiatan, mode baca saja; tingkat rekening belanja tidak ditampilkan.
   - Membuka arsip TA masa lalu dengan metrik analitik yang terkunci (Time Elapsed beku 100%, status historis aman dari anomali).
   - Melihat bar navbar instansi (Dokumen 01 §3.3). Laporan yang dapat dilihat: a, b, d, e, f, dan g untuk seluruh seksi, hanya data SPJ Dibukukan; kolom kuitansi tidak tampil pada b dan f (Dokumen 01 §9 poin 3). Laporan c tidak ditampilkan. Pada laporan e (Excel), NIP/NIK dan Nomor Rekening tampil penuh tanpa penyamaran (Dokumen 01 §9 poin 6). PA/KPA juga dapat mengunduh lampiran PDF SPJ seluruh seksi (Dokumen 02 §9).

- Menyusun dan mengunduh laporan kustom untuk seluruh seksi, dengan pilihan kolom sesuai Matriks Kolom yang Diizinkan per Peran (Dokumen 01 §9 poin 12).

- Melihat Heatmap Sebaran Realisasi Bulanan untuk seluruh seksi sampai tingkat subkegiatan, dalam mode baca saja (Dokumen 01 §12 poin 5). Tingkat rekening belanja tidak ditampilkan.

## 7. Pengawas / Auditor
- Mengakses laporan dan Jejak Audit seluruh TA dalam mode baca saja (Dokumen 01 §8).
- Tidak melihat countdown, banner merah, atau mini progress bar topbar. Tidak memiliki sidebar. Tidak dapat mengunduh lampiran SPJ.
- Tidak mengubah pagu, penugasan, kuitansi, SPJ, atau BKU, dan tidak memiliki akses master, akun, atau drill-down anggaran.
- Akun dibuat Admin dan terpisah dari Master Personel. Login ditolak setelah tanggal akhir akses.
- Aksi mengunduh atau mencetak laporan tercatat di Jejak Audit.

- Tidak memiliki akses ke Penyusunan Laporan Kustom. Pengawas/Auditor tetap memakai Katalog Laporan baku secara baca saja (Dokumen 01 §9).
- Tidak memiliki akses ke Heatmap Sebaran Realisasi Bulanan (Dokumen 01 §12 poin 5).

## 8. Urutan siklus operasional TA
1. Admin menyiapkan master dan Workspace TA.
2. Admin menetapkan pagu induk, struktur, pemetaan, pejabat dan status TA.
3. Bendahara mengalokasikan pagu ke subkegiatan.
4. PPTK/Seksi mengalokasikan pagu ke rekening belanja.
5. Gatekeeper memastikan semua seksi selesai dan seimbang.
6. Bendahara menekan "Sahkan" setelah seluruh seksi Seimbang; SPD terbit sebesar pagu yang disahkan dan transaksi kuitansi dibuka.
7. Kuitansi, SPJ, verifikasi dan BKU berjalan sesuai pemisahan proses.
8. Efisiensi/pergeseran/APBD-P dikelola pihak berwenang dengan histori.
9. TA ditutup dan diarsipkan read-only. Setelah 12 tahun sejak arsip terakhir, Admin dapat menghapus TA secara total (§2.3).


## 9. Pengunjung Publik (Anonim)
1. Pengunjung membuka halaman keterbukaan informasi tanpa login dan secara default melihat TA Aktif; TA terdahulu/arsip yang tersedia dapat dipilih.
2. Pengunjung membaca persentase realisasi berdasarkan BKU yang telah dibukukan, grafik distribusi status SPJ dalam bentuk cacah dan proporsi, serta peringkat seksi berdasarkan persentase realisasi.
3. Halaman dapat menampilkan donut/pie status SPJ, gauge atau busur realisasi, bar progres horizontal dan ticker ringkasan. Ticker, label, tooltip, dan tampilan fullscreen hanya menampilkan informasi yang telah diizinkan untuk publik.
4. Pengunjung dapat mengaktifkan fullscreen melalui kontrol halaman; tata letak menyesuaikan layar besar. Pintasan seperti F dapat didukung. F11 merupakan kendali browser/perangkat dan tidak dijamin oleh aplikasi.
5. Data agregat diperbarui di latar belakang setiap 15–30 menit. Pengunjung tetap anonim dan tidak memperoleh akses ke menu internal.
6. Tidak tersedia akses publik ke nominal rupiah, data sumber transaksi, kuitansi, lampiran, identitas penerima/personel, NIP/NIK, nomor rekening, akun, maupun jejak audit. Server hanya menyediakan agregat aman sebagaimana Dokumen 01 §10 dan Dokumen 04 §2.3, kecuali halaman keaslian SPJ pada poin 10 yang hanya memuat status, nama TA, nama seksi, dan tanggal verifikasi satu SPJ.
7. Tampilan portal publik memakai tema Treasury & Market Terminal (§1, Tema Visual Treasury) dengan token warna dan huruf yang sama dengan login dan Pro Mode: latar `#0B1120`, permukaan `#111827`, garis tepi `#1F2937`, huruf sans-serif untuk teks umum, dan angka monospace bertabel angka sejajar untuk persentase dan cacah. Amber dipakai untuk bar realisasi utama; teal untuk aksen sekunder dan tautan.
8. Di layar besar dan mode fullscreen, portal memakai kepadatan Pro Mode: ticker ringkasan di bagian atas, lalu donut status SPJ, gauge realisasi, dan bar peringkat seksi sesuai poin 2 dan 3. Huruf dibuat lebih besar agar terbaca dari jarak jauh. Di layar kecil, portal beralih ke mode standar satu kolom dengan kartu bertumpuk.
9. Setiap zona atau status pada portal publik wajib memakai ikon dan teks, tidak hanya warna, dan memenuhi kontras WCAG AA sebagaimana aturan Keterbacaan pada §1. Portal tidak menampilkan nominal rupiah, nomor, nama personel, atau lampiran sesuai poin 6, dan hanya menampilkan persentase, cacah, proporsi, serta peringkat seksi.
10. **Halaman terpisah:** Halaman keaslian SPJ (Dokumen 02 §8) adalah halaman publik terpisah dari portal ini. Halaman itu hanya memeriksa keaslian satu SPJ melalui token pada barcode, dengan batas tampilan mengikuti Dokumen 02 §8 poin 4. Portal ini tidak menampilkan data keaslian SPJ, dan halaman keaslian tidak menampilkan persentase, cacah, atau grafik.

## 10. Alur Validasi Bentrok Jadwal Perjalanan Dinas
1. Admin menandai field Form Dinamis perjalanan dengan `[SYS_PERSONNEL_ID]`, `[SYS_PERSONNEL_NAME]`, `[SYS_START_DATE]`, dan `[SYS_END_DATE]`. Pasangan ID/nama berada pada konteks yang sama; field tanggal dapat ditempatkan di tingkat dokumen atau blok sesuai cakupannya.
2. PPTK memasukkan NIP/NIK pada field bertag. Jika identitas tersedia di Direktori Transaksional SPJ, sistem mengisi nama pasangan otomatis; jika belum, PPTK mengisi nama. Untuk setiap peserta dalam Blok Berulang, lookup dan pasangan nama dilakukan pada baris yang sama.
3. PPTK dapat menyimpan, mencetak, dan melanjutkan SPJ sebagai Draft tanpa validasi bentrok yang memblokir. Ketika menekan “Ajukan ke Verifikator”, server menguji jadwal seluruh identitas pada SPJ terhadap SPJ lain di TA yang sama berstatus Terkunci, Menunggu BKU, atau Dibukukan. Draft dan SPJ yang dikembalikan untuk perbaikan diabaikan.
4. Rentang tanggal inklusif diuji dengan rumus overlap yang ditetapkan pada Dokumen 01 §11. Jika tanggal selesai kosong/sama dengan tanggal mulai, sistem memakai tanggal mulai sebagai tanggal selesai.
5. Jika bentrok, pengajuan ditolak dan SPJ tetap Draft; PPTK menerima identitas, tanggal bentrok, dan referensi pembanding secukupnya untuk koreksi, tanpa rincian SPJ atau nominal lain. Jika tidak bentrok, SPJ diajukan dan statusnya berubah sesuai workflow. Pemeriksaan server dan transisi status dilakukan atomik.
6. Saat SPJ dihapus/dibatalkan atau kembali menjadi status non-komitmen melalui alur yang berlaku, jadwalnya tidak lagi menghalangi pengajuan lain. Entri identitas pada Direktori Transaksional SPJ tetap disimpan untuk auto-fill berikutnya.
7. Verifikator hanya menerima SPJ yang berhasil melewati pemeriksaan saat diajukan. Admin mengelola koreksi dan penggabungan identitas melalui panel direktori; perubahan tidak menghapus relasi transaksi historis.

## 11. ALUR ANALITIK BURN-RATE & EARLY WARNING DASBOR PA/KPA

1. **Perhitungan Harian Otomatis (WITA):**
   - Server menghitung persentase `Time Elapsed` terhadap jumlah hari kalender TA (365/366 hari).
   - Server menghitung persentase `Budget Burn-Rate` per seksi dari total realisasi BKU yang telah dibukukan dibagi Pagu Sah Terakhir (Pagu Induk sebelum APBD-P, atau Pagu Perubahan setelah APBD-P disahkan).
   - Server mengevaluasi riwayat pembukuan BKU 14 hari terakhir per seksi untuk mendeteksi lonjakan belanja $\ge 40\%$.

2. **Penguncian pada Masa Transisi dan Arsip:**
   - Saat TA berstatus Masa Transisi atau Arsip Read-Only, `Time Elapsed` otomatis bernilai tetap 100% dan klasifikasi zona analitik dibekukan berdasarkan posisi akhir tutup buku.

3. **Penyajian pada Dasbor Eksekutif PA/KPA:**
   - Ticker ringkasan di bagian atas dasbor menampilkan rekap seksi per zona warna.
   - Tabel drill-down per seksi menyematkan indikator visual titik warna dan tooltip persentase analitik.
   - Seksi Zona Merah (Kritis) diangkat ke urutan teratas daftar untuk mempermudah supervisi.

## 12. ALUR UNGGAH LAMPIRAN SPJ: KOMPRESI PDF CLIENT-FIRST

1. PPTK memilih lampiran PDF dari perangkat lokal melalui form SPJ.
2. Peramban memeriksa tipe dan ukuran berkas sebelum upload: berkas di atas 30 MB ditolak langsung dengan pesan batas ukuran; berkas berukuran sampai dengan 5 MB dikirim langsung tanpa kompresi.
3. Untuk berkas di atas 5 MB hingga 30 MB, peramban menampilkan status "Menyiapkan dokumen..." dan mencoba mengompresi PDF secara lokal.
4. Jika proses lokal berhasil, sistem melanjutkan dengan status "Mengunggah dokumen..." dan mengirim hasil kompresi.
5. Jika proses lokal gagal, tidak tersedia, kehabisan memori, atau melewati batas waktu 15 detik, upload beralih otomatis ke jalur server fallback (kompresi sisi server). PPTK tidak perlu mengulang pilihan file karena kendala teknis kompresi lokal.
6. Setelah proses selesai, UI menampilkan status berhasil dan nama berkas asli. Sistem mencatat ukuran sebelum dan sesudah optimasi; Form Dinamis dan data Excel tidak berubah.
7. Jika worker server juga gagal mengoptimalkan atau memvalidasi berkas, sistem menyampaikan pesan yang dapat ditindaklanjuti dan tidak menandai upload sebagai berhasil.

## 13. ALUR DIREKTORI REKENING BANK & LAYAR TERBAGI (SPLIT VIEW)
1. **Latar Belakang:** Mengurangi beban pengetikan berulang data rekening penerima pembayaran bagi PPTK dan menghindari hambatan akibat validasi kaku nomor rekening.
2. **Alur Kerja PPTK pada Halaman SPJ (Split View):**
   - **Langkah 1 (Buka Lembar Kerja):** PPTK membuka formulir SPJ / rincian penerima pembayaran. Sistem menampilkan tata letak Split View (Layar Terbagi): Panel Sisi Kiri sebagai Direktori Rekening dan Panel Sisi Kanan sebagai Form SPJ.
   - **Langkah 2 (Pencarian Fleksibel):** PPTK mengetik kata kunci pencarian pada kotak pencarian di Panel Kiri. Pencarian dapat berupa sebagian nama orang, instansi/alias, atau deretan nomor rekening.
   - **Langkah 3A (Data Ditemukan):** PPTK menekan tombol *"Pilih"* pada hasil pencarian di panel kiri. Seluruh field rekening penerima di form panel kanan langsung terisi secara instan.
   - **Langkah 3B (Data Baru / Tidak Ditemukan):** PPTK langsung mengisi nama penerima, nama bank, nomor rekening, dan alias (opsional) secara manual pada form panel kanan. Tidak ada validasi unik atau format ketat yang memblokir.
   - **Langkah 4 (Auto-Capture saat Simpan):** Saat SPJ atau draf disimpan, sistem menyimpan data ke form SPJ sebagai snapshot independen dan secara otomatis menyalin entri rekening baru tersebut ke Direktori Rekening Bank sistem.
3. **Alur Pemeliharaan oleh Admin:**
   - Admin membuka menu *"Direktori Rekening Bank"*.
   - Admin dapat melihat seluruh daftar rekening yang dihimpun dari aktivitas pembuatan SPJ lintas-seksi.
   - Admin dapat melakukan standardisasi ejaan nama bank, koreksi salah ketik, atau penggabungan (*merge*) duplikasi jika ada beberapa variasi penulisan untuk satu nomor rekening yang sama.
   - Seluruh tindakan Admin hanya memengaruhi referensi pencarian baru ke depan; data SPJ yang telah disahkan/dibukukan ke BKU tetap mempertahankan snapshot aslinya.
4. **Penanganan Pembatalan SPJ Draft:**
   - Jika SPJ Draft dihapus/dibatalkan, dokumen SPJ terhapus secara bersih tanpa jejak audit. Entri rekening baru yang terlanjur tercatat di direktori tetap tersimpan di database direktori sehingga tetap dapat dipakai kembali pada transaksi berikutnya.

