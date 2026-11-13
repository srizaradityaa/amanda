// Halaman "Tentang AMANDA" — untuk semua peran. Isi disusun dari dokumen acuan (Dokumen 01–05)
// dan catatan keputusan pemilik (docs/KEPUTUSAN_PEMILIK.md). Tidak memuat data pribadi atau keuangan.

import type { ReactNode } from 'react';
import { Logo } from '@/components/Logo';
import { Card } from '@/components/ui';

function Bagian({ judul, children }: { judul: string; children: ReactNode }) {
  return (
    <Card className="p-5">
      <h3 className="mb-2 text-sm font-semibold text-mist">{judul}</h3>
      <div className="space-y-2 text-sm leading-relaxed text-mist-dim">{children}</div>
    </Card>
  );
}

const KELEBIHAN: { judul: string; isi: string }[] = [
  { judul: 'Pagu berjenjang tanpa selisih', isi: 'Pagu dibagi dari Pagu Induk ke subkegiatan lalu ke rekening belanja sampai selisihnya tepat Rp 0. Pagu seksi dihitung otomatis, dan SPD terbit otomatis saat anggaran disahkan.' },
  { judul: 'Pemisahan tugas ditegakkan sistem', isi: 'Satu orang tidak boleh merangkap jabatan pada TA yang sama, dan tidak ada yang bisa memverifikasi SPJ yang ia kelola sendiri. Aturan ini dijaga di server, bukan hanya disembunyikan di layar.' },
  { judul: 'Alur satu arah dan bisa ditelusuri', isi: 'Kuitansi, SPJ, verifikasi, lalu BKU berjalan berurutan. Koreksi dan pencabutan BKU berjenjang, dan setiap aksi penting tercatat di Jejak Audit dengan pelaku, waktu, serta nilai sebelum dan sesudah.' },
  { judul: 'Data lama tidak ikut berubah', isi: 'Setiap Tahun Anggaran punya ruang kerja sendiri berisi snapshot seksi, pemetaan, dan pejabat. Mengubah master atau pergantian pejabat tidak merusak dokumen tahun-tahun sebelumnya.' },
  { judul: 'Kelengkapan SPJ dijaga', isi: 'SPJ baru bisa diajukan setelah form, rekening penerima, dan lampiran PDF lengkap. Pajak bersifat opsional. Sistem juga mencegah bentrok jadwal perjalanan dinas.' },
  { judul: 'Peringatan dini untuk pimpinan', isi: 'Dasbor PA/KPA menandai seksi yang serapannya tertinggal atau melonjak mendadak dengan zona warna, sehingga tindak lanjut bisa dilakukan lebih awal.' },
  { judul: 'Terbuka kepada publik, aman', isi: 'Portal publik menampilkan persentase realisasi dan progres SPJ tanpa nominal rupiah. Keaslian dokumen hasil verifikasi dapat dicek lewat barcode, dan hanya memperlihatkan status satu SPJ.' },
];

const PERAN: [string, string][] = [
  ['Admin', 'Mengelola data master, Tahun Anggaran, penugasan, dan akun. Tidak melihat alokasi, SPD, kuitansi, SPJ, verifikasi, BKU, maupun angka realisasi.'],
  ['Bendahara Pengeluaran', 'Membagi pagu ke subkegiatan, mengesahkan anggaran, mengelola SPD, mencatat BKU, dan menerbitkan laporan.'],
  ['PPTK / Seksi', 'Membagi pagu ke rekening belanja, membuat kuitansi dan SPJ, lalu mengajukannya untuk diverifikasi.'],
  ['Verifikator', 'Memeriksa SPJ lalu menyetujui atau mengembalikannya dengan catatan.'],
  ['PA/KPA', 'Memantau serapan anggaran, peringatan dini, dan laporan.'],
];

export function TentangPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center gap-4">
        <Logo varian="ikon" tinggi={48} />
        <div>
          <h2 className="text-lg font-bold text-mist">Tentang AMANDA</h2>
          <p className="text-sm text-mist-dim">Aplikasi Manajemen Data Anggaran</p>
        </div>
      </div>

      <Bagian judul="Apa itu AMANDA">
        <p>AMANDA mengelola anggaran belanja instansi dari awal sampai akhir dalam satu tempat: pagu, penyediaan dana (SPD), kuitansi, SPJ, verifikasi, hingga Buku Kas Umum (BKU), lengkap dengan laporan dan jejak audit.</p>
      </Bagian>

      <Bagian judul="Mengapa AMANDA dibuat">
        <p>Pengelolaan anggaran yang tersebar di banyak berkas dan rekap manual rawan selisih angka, salah rangkap tugas, dan dokumen yang sulit ditelusuri ketika diperiksa.</p>
        <p>AMANDA dibuat agar aturan yang sudah ditetapkan, seperti pagu berjenjang, pemisahan tugas, dan alur kuitansi sampai BKU, dijalankan oleh sistem dan bukan bergantung pada ingatan atau ketelitian satu orang. Hasilnya adalah angka yang konsisten, tanggung jawab yang jelas, dan keterbukaan informasi kepada publik.</p>
      </Bagian>

      <Bagian judul="Kelebihan AMANDA">
        <ul className="space-y-2">
          {KELEBIHAN.map((k) => (
            <li key={k.judul}><span className="font-medium text-mist">{k.judul}.</span> {k.isi}</li>
          ))}
        </ul>
      </Bagian>

      <Bagian judul="Siapa mengerjakan apa">
        <ul className="space-y-1.5">
          {PERAN.map(([p, d]) => (
            <li key={p}><span className="font-medium text-mist">{p}.</span> {d}</li>
          ))}
        </ul>
      </Bagian>

      <Bagian judul="Keamanan akun">
        <p>Masuk memakai NIP atau NIK. Akun non-Admin terkunci setelah 10 kali salah sandi, dan sesi berakhir otomatis setelah 1 jam tanpa aktivitas. Satu akun bekerja pada satu Tahun Anggaran dan satu peran dalam satu sesi; untuk berganti, keluar lalu masuk kembali.</p>
      </Bagian>

      <Bagian judul="Versi dan acuan">
        <p>AMANDA tahap uji coba, November 2026. Aturan mengikuti Dokumen 01 (Aturan Bisnis dan Anggaran), 02 (Kuitansi, SPJ, Verifikasi, BKU), 03 (Workflow Operasional), 04 (Kamus Data dan Skema), dan 05 (RBAC dan Skenario Pengujian), beserta catatan keputusan pemilik yang melengkapinya.</p>
      </Bagian>
    </div>
  );
}
