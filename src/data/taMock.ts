import type { TaStatus } from '@/auth/types';

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface TaRecord {
  id: string;
  tahun: number;
  nama: string;
  status: TaStatus;
  pernahBertransaksi: boolean;
  paguInduk: number;
  checklist: ChecklistItem[];
}

const CHECKLIST_TEMPLATE: Pick<ChecklistItem, 'id' | 'label'>[] = [
  { id: 'pagu', label: 'Pagu induk sudah ditetapkan' },
  { id: 'formasi', label: 'Formasi pejabat lengkap (Bendahara, PPTK, Verifikator, PA/KPA)' },
  { id: 'subkegiatan', label: 'Pemetaan subkegiatan selesai' },
];

export function buildChecklist(done: boolean): ChecklistItem[] {
  return CHECKLIST_TEMPLATE.map((item) => ({ ...item, done }));
}

export const initialTaRecords: TaRecord[] = [
  {
    id: 'ta-2027',
    tahun: 2027,
    nama: 'Tahun Anggaran 2027',
    status: 'draft',
    pernahBertransaksi: false,
    paguInduk: 0,
    checklist: buildChecklist(false),
  },
  {
    id: 'ta-2026',
    tahun: 2026,
    nama: 'Tahun Anggaran 2026',
    status: 'aktif_penuh',
    pernahBertransaksi: true,
    paguInduk: 48_750_000_000,
    checklist: buildChecklist(true),
  },
  {
    id: 'ta-2025',
    tahun: 2025,
    nama: 'Tahun Anggaran 2025',
    status: 'arsip_readonly',
    pernahBertransaksi: true,
    paguInduk: 45_200_000_000,
    checklist: buildChecklist(true),
  },
];
