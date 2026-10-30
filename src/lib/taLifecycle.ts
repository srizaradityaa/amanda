import type { TaStatus } from '@/auth/types';
import type { TaRecord } from '@/data/taMock';

export const NEXT_STATUS: Partial<Record<TaStatus, TaStatus>> = {
  draft: 'aktif_penuh',
  aktif_penuh: 'masa_transisi',
  masa_transisi: 'arsip_readonly',
};

export const TRANSITION_LABEL: Partial<Record<TaStatus, string>> = {
  draft: 'Aktifkan TA',
  aktif_penuh: 'Masuk Masa Transisi',
  masa_transisi: 'Arsipkan TA',
};

export function canDelete(ta: TaRecord): boolean {
  return ta.status === 'draft' && !ta.pernahBertransaksi;
}

export function activationBlocker(records: TaRecord[], ta: TaRecord): string | null {
  if (ta.checklist.some((item) => !item.done)) {
    return 'Lengkapi seluruh checklist kesiapan sebelum mengaktifkan TA.';
  }
  if (records.some((r) => r.id !== ta.id && r.status === 'aktif_penuh')) {
    return 'Sudah ada TA Aktif Penuh. Masuk masa transisi pada TA tersebut terlebih dahulu.';
  }
  return null;
}
