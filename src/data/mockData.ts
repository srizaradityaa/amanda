import type { Role } from '@/auth/types';

// ── Format helpers (WITA display; separators use dot per Dokumen 04 §4) ──
export function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(value);
}

export function formatRupiahFull(value: number): string {
  return `Rp ${formatRupiah(value)}`;
}

export function formatPct(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

export function formatDateID(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// ── TA mock ──
export interface TaCard {
  id: string;
  year: number;
  status: 'draft' | 'aktif_penuh' | 'masa_transisi' | 'arsip_readonly';
  paguInduk: number;
  hasTransactions: boolean;
  arsipDate?: string;
  createdAt: string;
}

export const mockTas: TaCard[] = [
  { id: 'ta-2026', year: 2026, status: 'aktif_penuh', paguInduk: 12_480_000_000, hasTransactions: true, createdAt: '2025-12-15' },
  { id: 'ta-2025', year: 2025, status: 'arsip_readonly', paguInduk: 11_920_000_000, hasTransactions: true, arsipDate: '2026-01-20', createdAt: '2024-12-10' },
  { id: 'ta-2024', year: 2024, status: 'arsip_readonly', paguInduk: 10_850_000_000, hasTransactions: true, arsipDate: '2025-01-15', createdAt: '2023-12-12' },
];

// ── Seksi mock (TA 2026) ──
export interface SeksiRow {
  id: string;
  name: string;
  pagu: number;
  realisasiBku: number;
  komitmenKwitansi: number;
  status: 'seimbang' | 'belum_seimbang' | 'belum_input';
  alokasiStatus: 'tuntas' | 'draft_belum_seimbang' | 'belum_input';
  burnRatePct: number;
  timeElapsedPct: number;
  zona: 'HIJAU' | 'KUNING' | 'MERAH' | 'ORANYE';
  spike14dPct: number;
  pptkName: string;
}

export const mockSeksiList: SeksiRow[] = [
  { id: 'seksi-pem', name: 'Seksi Perencanaan & Evaluasi', pagu: 1_840_000_000, realisasiBku: 612_400_000, komitmenKwitansi: 180_000_000, status: 'seimbang', alokasiStatus: 'tuntas', burnRatePct: 33.3, timeElapsedPct: 83.2, zona: 'KUNING', spike14dPct: 8.2, pptkName: 'Dwi Putri Lestari, S.T.' },
  { id: 'seksi-pen', name: 'Seksi Penataan Keuangan', pagu: 2_560_000_000, realisasiBku: 1_980_000_000, komitmenKwitansi: 340_000_000, status: 'seimbang', alokasiStatus: 'tuntas', burnRatePct: 77.3, timeElapsedPct: 83.2, zona: 'HIJAU', spike14dPct: 12.5, pptkName: 'Rizki Ananda, S.E.' },
  { id: 'seksi-pug', name: 'Seksi Pengembangan UMKM', pagu: 1_200_000_000, realisasiBku: 420_000_000, komitmenKwitansi: 90_000_000, status: 'seimbang', alokasiStatus: 'tuntas', burnRatePct: 35.0, timeElapsedPct: 83.2, zona: 'KUNING', spike14dPct: 5.1, pptkName: 'Hendra Wijaya, S.Sos.' },
  { id: 'seksi-pub', name: 'Seksi Pelayanan Publik', pagu: 3_480_000_000, realisasiBku: 1_306_100_000, komitmenKwitansi: 520_000_000, status: 'seimbang', alokasiStatus: 'tuntas', burnRatePct: 37.5, timeElapsedPct: 83.2, zona: 'MERAH', spike14dPct: 48.3, pptkName: 'Siti Rahmawati, S.AP.' },
  { id: 'seksi-bin', name: 'Seksi Bina Pemerintahan', pagu: 1_900_000_000, realisasiBku: 0, komitmenKwitansi: 0, status: 'belum_seimbang', alokasiStatus: 'belum_input', burnRatePct: 0, timeElapsedPct: 83.2, zona: 'MERAH', spike14dPct: 0, pptkName: '—' },
  { id: 'seksi-kess', name: 'Seksi Kesejahteraan Sosial', pagu: 1_500_000_000, realisasiBku: 0, komitmenKwitansi: 0, status: 'belum_seimbang', alokasiStatus: 'draft_belum_seimbang', burnRatePct: 0, timeElapsedPct: 83.2, zona: 'MERAH', spike14dPct: 0, pptkName: 'Belum ditugaskan' },
];

export function computeSisaSpd(row: SeksiRow): number {
  return row.pagu - row.realisasiBku - row.komitmenKwitansi;
}

export function computeSerapan(row: SeksiRow): number {
  if (row.pagu === 0) return 0;
  return ((row.realisasiBku + row.komitmenKwitansi) / row.pagu) * 100;
}

// ── SPJ antrean mock (Verifikator) ──
export interface SpjAntrean {
  id: string;
  noRef: string;
  seksiName: string;
  uraian: string;
  bruto: number;
  jenisBelanja: string;
  tanggalKwitansi: string;
  status: 'terkunci' | 'menunggu_bku' | 'dibukukan' | 'draft';
  diajukanOleh: string;
}

export const mockSpjAntrean: SpjAntrean[] = [
  { id: 'spj-001', noRef: 'KWT-PEM-001', seksiName: 'Seksi Perencanaan & Evaluasi', uraian: 'Honor narasumber kegiatan evaluasi', bruto: 4_500_000, jenisBelanja: 'Honor', tanggalKwitansi: '2026-10-18', status: 'terkunci', diajukanOleh: 'Dwi Putri Lestari, S.T.' },
  { id: 'spj-002', noRef: 'KWT-PEN-014', seksiName: 'Seksi Penataan Keuangan', uraian: 'Belanja alat tulis kantor Q3', bruto: 8_200_000, jenisBelanja: 'Barang & Jasa', tanggalKwitansi: '2026-10-20', status: 'terkunci', diajukanOleh: 'Rizki Ananda, S.E.' },
  { id: 'spj-003', noRef: 'KWT-PUB-007', seksiName: 'Seksi Pelayanan Publik', uraian: 'Perjalanan dinas koordinasi wilayah', bruto: 12_800_000, jenisBelanja: 'Perjalanan Dinas', tanggalKwitansi: '2026-10-22', status: 'menunggu_bku', diajukanOleh: 'Siti Rahmawati, S.AP.' },
  { id: 'spj-004', noRef: 'KWT-PUG-003', seksiName: 'Seksi Pengembangan UMKM', uraian: 'Pembinaan kelompok UMKM kecamatan', bruto: 6_000_000, jenisBelanja: 'Barang & Jasa', tanggalKwitansi: '2026-10-24', status: 'terkunci', diajukanOleh: 'Hendra Wijaya, S.Sos.' },
  { id: 'spj-005', noRef: 'KWT-PEM-009', seksiName: 'Seksi Perencanaan & Evaluasi', uraian: 'Cetak dokumen perencanaan', bruto: 1_200_000, jenisBelanja: 'Barang & Jasa', tanggalKwitansi: '2026-10-25', status: 'dibukukan', diajukanOleh: 'Dwi Putri Lestari, S.T.' },
];

// ── Kuitansi mock (PPTK) ──
export interface KuitansiRow {
  id: string;
  uraian: string;
  subkegiatanName: string;
  kodeSubkegiatan: string;
  kodeRekening: string;
  bruto: number;
  tanggal: string;
  status: 'aktif' | 'terkunci';
  spjStatus: 'belum' | 'draft' | 'terkunci' | 'menunggu_bku' | 'dibukukan';
}

export const mockKuitansiPptk: KuitansiRow[] = [
  { id: 'kwt-001', uraian: 'Honor narasumber kegiatan evaluasi', subkegiatanName: 'Penyelenggaraan Perencanaan & Evaluasi', kodeSubkegiatan: '2.16.03.2.01', kodeRekening: '5.1.02.02.6.2.01.01', bruto: 4_500_000, tanggal: '2026-10-18', status: 'terkunci', spjStatus: 'terkunci' },
  { id: 'kwt-009', uraian: 'Cetak dokumen perencanaan', subkegiatanName: 'Penyelenggaraan Perencanaan & Evaluasi', kodeSubkegiatan: '2.16.03.2.01', kodeRekening: '5.1.02.01.6.1.02.01', bruto: 1_200_000, tanggal: '2026-10-25', status: 'terkunci', spjStatus: 'dibukukan' },
  { id: 'kwt-012', uraian: 'Sewa ruang rapat koordinasi', subkegiatanName: 'Penyelenggaraan Perencanaan & Evaluasi', kodeSubkegiatan: '2.16.03.2.01', kodeRekening: '5.1.02.02.6.2.01.05', bruto: 2_800_000, tanggal: '2026-10-28', status: 'aktif', spjStatus: 'belum' },
];

// ── Jejak Audit mock ──
export interface AuditEvent {
  id: string;
  waktu: string;
  aktorName: string;
  aktorNipNik: string;
  peran: Role | string;
  entitas: string;
  aksi: string;
  nilaiSebelum?: string;
  nilaiSesudah?: string;
  alasan?: string;
}

export const mockAuditEvents: AuditEvent[] = [
  { id: 'ev-001', waktu: '2026-10-28T14:32:00', aktorName: 'Rahmat Hidayat, S.E.', aktorNipNik: '199411172025031001', peran: 'Bendahara', entitas: 'BKU #B-0142', aksi: 'Pencatatan BKU', nilaiSesudah: 'Rp 4.500.000' },
  { id: 'ev-002', waktu: '2026-10-28T11:15:00', aktorName: 'Agus Setiawan, M.Si.', aktorNipNik: '198812122020121003', peran: 'Verifikator', entitas: 'SPJ spj-001', aksi: 'Verifikasi SPJ disetujui' },
  { id: 'ev-003', waktu: '2026-10-27T09:48:00', aktorName: 'Rahmat Hidayat, S.E.', aktorNipNik: '199411172025031001', peran: 'Bendahara', entitas: 'BKU #B-0138', aksi: 'Koreksi No. BKU', nilaiSebelum: 'B-0138X', nilaiSesudah: 'B-0138' },
  { id: 'ev-004', waktu: '2026-10-26T16:20:00', aktorName: 'Administrator Sistem', aktorNipNik: 'admin01', peran: 'Admin', entitas: 'Penugasan PA/KPA TA 2026', aksi: 'Penetapan pejabat' },
  { id: 'ev-005', waktu: '2026-10-25T13:05:00', aktorName: 'Rahmat Hidayat, S.E.', aktorNipNik: '199411172025031001', peran: 'Bendahara', entitas: 'BKU #B-0120', aksi: 'Pencabutan BKU (berjenjang)', alasan: 'Rincian salah rekening' },
  { id: 'ev-006', waktu: '2026-10-24T10:30:00', aktorName: 'BPKP Kalimantan Selatan', aktorNipNik: 'auditor@balangan.go.id', peran: 'Pengawas', entitas: 'Laporan Realisasi per Seksi', aksi: 'Unduh laporan (audit)' },
];

// ── Gatekeeper countdown mock ──
export const mockCountdown = {
  deadline: '2026-11-05T23:59:00+08:00',
  selesai: 4,
  total: 6,
  belumSeimbang: 2,
};

// ── Drill-down hierarchy mock (Dokumen 01 §7) ──
export interface SubkegiatanRow {
  id: string;
  kode: string;
  nama: string;
  pagu: number;
  realisasiBku: number;
  komitmenKwitansi: number;
  status: 'seimbang' | 'belum_seimbang';
}

export interface RekeningRow {
  id: string;
  kode: string;
  nama: string;
  pagu: number;
  realisasiBku: number;
  komitmenKwitansi: number;
  status: 'seimbang' | 'belum_seimbang';
}

// Map seksi → subkegiatan list
export const mockSubkegiatanBySeksi: Record<string, SubkegiatanRow[]> = {
  'seksi-pem': [
    { id: 'sub-pem-01', kode: '2.16.03.2.01', nama: 'Penyelenggaraan Perencanaan & Evaluasi', pagu: 1_240_000_000, realisasiBku: 512_400_000, komitmenKwitansi: 120_000_000, status: 'seimbang' },
    { id: 'sub-pem-02', kode: '2.16.03.2.02', nama: 'Penyelenggaraan Rapat Koordinasi', pagu: 600_000_000, realisasiBku: 100_000_000, komitmenKwitansi: 60_000_000, status: 'seimbang' },
  ],
  'seksi-pen': [
    { id: 'sub-pen-01', kode: '2.16.01.2.01', nama: 'Penataan Keuangan Daerah', pagu: 2_560_000_000, realisasiBku: 1_980_000_000, komitmenKwitansi: 340_000_000, status: 'seimbang' },
  ],
  'seksi-pub': [
    { id: 'sub-pub-01', kode: '2.16.05.2.01', nama: 'Pelayanan Administrasi Umum', pagu: 3_480_000_000, realisasiBku: 1_306_100_000, komitmenKwitansi: 520_000_000, status: 'seimbang' },
  ],
};

// Map subkegiatan → rekening list (Dokumen 04 §2.2 — pasangan unik per TA)
export const mockRekeningBySubkegiatan: Record<string, RekeningRow[]> = {
  'sub-pem-01': [
    { id: 'rek-pem-01a', kode: '5.1.02.02.6.2.01.01', nama: 'Honor Narasumber', pagu: 740_000_000, realisasiBku: 312_400_000, komitmenKwitansi: 80_000_000, status: 'seimbang' },
    { id: 'rek-pem-01b', kode: '5.1.02.01.6.1.02.01', nama: 'Belanja Alat Tulis Kantor', pagu: 500_000_000, realisasiBku: 200_000_000, komitmenKwitansi: 40_000_000, status: 'seimbang' },
  ],
  'sub-pem-02': [
    { id: 'rek-pem-02a', kode: '5.1.02.02.6.2.01.05', nama: 'Sewa Ruang Rapat', pagu: 300_000_000, realisasiBku: 50_000_000, komitmenKwitansi: 30_000_000, status: 'seimbang' },
    { id: 'rek-pem-02b', kode: '5.1.02.02.6.2.01.03', nama: 'Konsumsi Rapat', pagu: 300_000_000, realisasiBku: 50_000_000, komitmenKwitansi: 30_000_000, status: 'seimbang' },
  ],
  'sub-pen-01': [
    { id: 'rek-pen-01a', kode: '5.1.02.01.6.1.01.01', nama: 'Belanja Bahan Aksesori Kantor', pagu: 1_560_000_000, realisasiBku: 1_280_000_000, komitmenKwitansi: 200_000_000, status: 'seimbang' },
    { id: 'rek-pen-01b', kode: '5.1.02.02.6.2.02.01', nama: 'Jasa Konsultan Keuangan', pagu: 1_000_000_000, realisasiBku: 700_000_000, komitmenKwitansi: 140_000_000, status: 'seimbang' },
  ],
  'sub-pub-01': [
    { id: 'rek-pub-01a', kode: '5.1.02.02.6.2.03.01', nama: 'Belanja Perjalanan Dinas', pagu: 1_480_000_000, realisasiBku: 606_100_000, komitmenKwitansi: 320_000_000, status: 'seimbang' },
    { id: 'rek-pub-01b', kode: '5.1.02.01.6.1.03.01', nama: 'Belanja Cetak Dokumen', pagu: 2_000_000_000, realisasiBku: 700_000_000, komitmenKwitansi: 200_000_000, status: 'seimbang' },
  ],
};

export function computeSubSisaSpd(row: { pagu: number; realisasiBku: number; komitmenKwitansi: number }): number {
  return row.pagu - row.realisasiBku - row.komitmenKwitansi;
}

export function computeSubSerapan(row: { pagu: number; realisasiBku: number; komitmenKwitansi: number }): number {
  if (row.pagu === 0) return 0;
  return ((row.realisasiBku + row.komitmenKwitansi) / row.pagu) * 100;
}

// ── Extended audit events for full Jejak Audit page ──
export const mockAuditEventsFull: AuditEvent[] = [
  ...mockAuditEvents,
  { id: 'ev-007', waktu: '2026-10-23T08:15:00', aktorName: 'Dwi Putri Lestari, S.T.', aktorNipNik: '200001012026011002', peran: 'PPTK', entitas: 'Kuitansi kwt-012', aksi: 'Pembuatan kuitansi', nilaiSesudah: 'Rp 2.800.000' },
  { id: 'ev-008', waktu: '2026-10-22T15:40:00', aktorName: 'Agus Setiawan, M.Si.', aktorNipNik: '198812122020121003', peran: 'Verifikator', entitas: 'SPJ spj-003', aksi: 'Verifikasi SPJ disetujui' },
  { id: 'ev-009', waktu: '2026-10-21T10:05:00', aktorName: 'Administrator Sistem', aktorNipNik: 'admin01', peran: 'Admin', entitas: 'Akun pengawas BPKP', aksi: 'Pembuatan akun Pengawas', alasan: 'Surat tugas 045/SK/ID-PROV/2026' },
  { id: 'ev-010', waktu: '2026-10-20T13:25:00', aktorName: 'Rahmat Hidayat, S.E.', aktorNipNik: '199411172025031001', peran: 'Bendahara', entitas: 'SPD rekening 5.1.02.02.6.2.01.01', aksi: 'Efisiensi SPD', nilaiSebelum: 'Rp 740.000.000', nilaiSesudah: 'Rp 720.000.000' },
  { id: 'ev-011', waktu: '2026-10-19T09:30:00', aktorName: 'Rahmat Hidayat, S.E.', aktorNipNik: '199411172025031001', peran: 'Bendahara', entitas: 'Pergeseran PG-003', aksi: 'Pergeseran anggaran', nilaiSebelum: 'rek-pem-02a → rek-pem-01b', nilaiSesudah: 'Rp 50.000.000' },
  { id: 'ev-012', waktu: '2026-10-18T11:00:00', aktorName: 'Administrator Sistem', aktorNipNik: 'admin01', peran: 'Admin', entitas: 'Delegasi Plh. PPTK Seksi PUG', aksi: 'Penetapan delegasi Plh./Plt.', alasan: 'PPTK cuti 18–25 Okt 2026' },
];

// ── Katalog Laporan definitions (Dokumen 01 §9) ──
export interface LaporanDef {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string;
  format: 'PDF' | 'Excel' | 'PDF+Excel';
  // Roles allowed to see this report
  roles: string[];
  // Extra notes
  catatan?: string;
}

export const mockLaporanList: LaporanDef[] = [
  { id: 'lap-a', kode: 'a', nama: 'Rekap Realisasi per Seksi', deskripsi: 'Pagu, realisasi BKU, serapan, dan status per seksi.', format: 'PDF+Excel', roles: ['bendahara', 'verifikator', 'pa_kpa', 'auditor', 'pptk'] },
  { id: 'lap-b', kode: 'b', nama: 'Buku Kas (BKU)', deskripsi: 'No. BKU, tanggal BKU, nominal, kuitansi terkait. Kolom kuitansi tidak tampil untuk PA/KPA.', format: 'PDF+Excel', roles: ['bendahara', 'verifikator', 'pa_kpa', 'auditor'], catatan: 'PA/KPA: kolom kuitansi tidak ditampilkan. BKU murni mencatat realisasi pengeluaran belanja.' },
  { id: 'lap-c', kode: 'c', nama: 'Daftar Kuitansi & SPJ', deskripsi: 'Nomor, tanggal, seksi, status kuitansi & SPJ. Hanya Dibukukan.', format: 'PDF+Excel', roles: ['bendahara', 'verifikator', 'auditor'], catatan: 'Tidak ditampilkan kepada PA/KPA.' },
  { id: 'lap-d', kode: 'd', nama: 'Laporan Serapan', deskripsi: 'Serapan per seksi dan per subkegiatan.', format: 'PDF+Excel', roles: ['bendahara', 'verifikator', 'pa_kpa', 'auditor', 'pptk'] },
  { id: 'lap-e', kode: 'e', nama: 'Rekap Isian SPJ per Jenis Belanja', deskripsi: 'Isian Form Dinamis per SPJ dalam Excel, satu sheet per jenis belanja. NIP & Nomor Rekening tampil penuh tanpa masking.', format: 'Excel', roles: ['bendahara', 'verifikator', 'pa_kpa', 'auditor', 'pptk'], catatan: 'Kolom BKU, kode subkegiatan, kode rekening, dan nominal bruto tidak muncul. Pajak tidak termasuk.' },
  { id: 'lap-f', kode: 'f', nama: 'Rekap Pajak per Jenis Pajak', deskripsi: 'Entri pajak SPJ ber-BKU, dikelompokkan per jenis pajak. Kolom Tanggal Kuitansi tidak tampil untuk PA/KPA.', format: 'Excel', roles: ['bendahara', 'verifikator', 'pa_kpa', 'auditor', 'pptk'], catatan: 'Hanya SPJ yang sudah memiliki BKU. Satu sheet per jenis pajak. Tidak ada subtotal otomatis.' },
  { id: 'lap-g', kode: 'g', nama: 'Rincian Kartu Kendali Kegiatan', deskripsi: 'Realisasi per subkegiatan & rekening, blok ke bawah, kolom BKU & sisa anggaran.', format: 'PDF+Excel', roles: ['bendahara', 'verifikator', 'pa_kpa', 'auditor', 'pptk'], catatan: 'Satu blok per pasangan subkegiatan & rekening ber-BKU. Tanpa LS, UP/GU/TU, unit organisasi, program, kegiatan, atau aktivitas.' },
];
