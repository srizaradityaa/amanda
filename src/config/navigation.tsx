import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  FileText,
  Wallet,
  Receipt,
  ClipboardCheck,
  ShieldAlert,
  FileSearch,
  BarChart3,
  Database,
  ScrollText,
  Banknote,
  PieChart,
  Landmark,
  CalendarRange,
  ArrowLeftRight,
  type LucideIcon,
} from 'lucide-react';
import type { Role } from '@/auth/types';

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  mode?: 'pro' | 'standard';
}

export interface NavSection {
  heading: string;
  items: NavItem[];
}

export const roleNav: Record<Role, NavSection[]> = {
  admin: [
    {
      heading: 'Master Data',
      items: [
        { id: 'dashboard', label: 'Dasbor Administrasi', icon: LayoutDashboard, mode: 'pro' },
        { id: 'sotk', label: 'Master SOTK', icon: Building2 },
        { id: 'personel', label: 'Master Personel', icon: Users },
        { id: 'subkegiatan', label: 'Master Subkegiatan', icon: Briefcase },
        { id: 'rekening', label: 'Master Rekening Belanja', icon: Database },
        { id: 'pajak', label: 'Master Jenis Pajak', icon: FileText },
      ],
    },
    {
      heading: 'Workspace TA',
      items: [
        { id: 'ta', label: 'Tahun Anggaran', icon: CalendarRange },
        { id: 'akun', label: 'Akun & Pengawas', icon: ShieldAlert },
        { id: 'template', label: 'Template & Form Builder', icon: FileText },
        { id: 'spj-direktori', label: 'Direktori Transaksional SPJ', icon: ScrollText },
        { id: 'bank-direktori', label: 'Direktori Rekening Bank', icon: Landmark },
        { id: 'audit', label: 'Jejak Audit', icon: ScrollText },
      ],
    },
  ],
  bendahara: [
    {
      heading: 'Operasional',
      items: [
        { id: 'dashboard', label: 'Dasbor Bendahara', icon: LayoutDashboard, mode: 'pro' },
        { id: 'alokasi', label: 'Alokasi Pagu', icon: Wallet },
        { id: 'spd', label: 'SPD & Efisiensi', icon: Banknote },
        { id: 'pergeseran', label: 'Pergeseran Anggaran', icon: ArrowLeftRight },
      ],
    },
    {
      heading: 'Pembukuan & Laporan',
      items: [
        { id: 'bku', label: 'Buku Kas (BKU)', icon: ClipboardCheck },
        { id: 'laporan', label: 'Katalog Laporan', icon: FileSearch },
        { id: 'laporan-kustom', label: 'Laporan Kustom', icon: BarChart3 },
        { id: 'drilldown', label: 'Drill-down Anggaran', icon: PieChart },
        { id: 'audit', label: 'Jejak Audit', icon: ScrollText },
      ],
    },
  ],
  pptk: [
    {
      heading: 'Operasional Seksi',
      items: [
        { id: 'dashboard', label: 'Dasbor Seksi', icon: LayoutDashboard, mode: 'pro' },
        { id: 'alokasi-rekening', label: 'Alokasi Rekening', icon: Wallet },
        { id: 'kuitansi', label: 'Kuitansi', icon: Receipt },
        { id: 'spj', label: 'SPJ & Form Dinamis', icon: ClipboardCheck },
      ],
    },
    {
      heading: 'Laporan',
      items: [
        { id: 'drilldown', label: 'Drill-down Anggaran', icon: PieChart },
        { id: 'laporan', label: 'Katalog Laporan', icon: FileSearch },
        { id: 'laporan-kustom', label: 'Laporan Kustom', icon: BarChart3 },
        { id: 'audit', label: 'Jejak Audit Seksi', icon: ScrollText },
      ],
    },
  ],
  verifikator: [
    {
      heading: 'Verifikasi',
      items: [
        { id: 'dashboard', label: 'Dasbor Verifikator', icon: LayoutDashboard, mode: 'pro' },
        { id: 'antrean', label: 'Antrean SPJ', icon: ClipboardCheck },
        { id: 'bku', label: 'Pembukuan BKU', icon: ClipboardCheck },
      ],
    },
    {
      heading: 'Pemantauan & Laporan',
      items: [
        { id: 'drilldown', label: 'Drill-down Anggaran', icon: PieChart },
        { id: 'laporan', label: 'Katalog Laporan', icon: FileSearch },
        { id: 'laporan-kustom', label: 'Laporan Kustom', icon: BarChart3 },
        { id: 'audit', label: 'Jejak Audit', icon: ScrollText },
      ],
    },
  ],
  pa_kpa: [
    {
      heading: 'Eksekutif',
      items: [
        { id: 'dashboard', label: 'Dasbor Eksekutif', icon: LayoutDashboard, mode: 'pro' },
        { id: 'drilldown', label: 'Drill-down Anggaran', icon: PieChart },
        { id: 'heatmap', label: 'Heatmap Realisasi Bulanan', icon: BarChart3 },
        { id: 'laporan', label: 'Katalog Laporan', icon: FileSearch },
        { id: 'laporan-kustom', label: 'Laporan Kustom', icon: BarChart3 },
      ],
    },
  ],
  auditor: [
    {
      heading: 'Pengawasan (Baca Saja)',
      items: [
        { id: 'dashboard', label: 'Dasbor Pengawas', icon: LayoutDashboard, mode: 'pro' },
        { id: 'laporan', label: 'Katalog Laporan', icon: FileSearch },
        { id: 'audit', label: 'Jejak Audit', icon: ScrollText },
      ],
    },
  ],
};

export const roleShortLabel: Record<Role, string> = {
  admin: 'Admin',
  bendahara: 'Bendahara',
  pptk: 'PPTK',
  verifikator: 'Verifikator',
  pa_kpa: 'PA/KPA',
  auditor: 'Pengawas',
};

export const roleFullLabel: Record<Role, string> = {
  admin: 'Administrator Sistem',
  bendahara: 'Bendahara Pengeluaran',
  pptk: 'PPTK / Seksi',
  verifikator: 'Verifikator',
  pa_kpa: 'Pengguna Anggaran / KPA',
  auditor: 'Pengawas / Auditor',
};
