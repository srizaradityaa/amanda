import { formatRupiahFull, type PajakEntry } from '@/data/mockData';

export function computeTotalPajak(entries: PajakEntry[]): number {
  return entries.reduce((sum, entry) => sum + entry.nominal, 0);
}

export function computeJumlahDibayarkan(bruto: number, entries: PajakEntry[]): number {
  return bruto - computeTotalPajak(entries);
}

export function validateTotalPajak(bruto: number, entries: PajakEntry[]): string | null {
  const totalPajak = computeTotalPajak(entries);
  if (totalPajak <= bruto) return null;
  return `Total Pajak ${formatRupiahFull(totalPajak)} melebihi nilai bruto kuitansi ${formatRupiahFull(bruto)}. Total Pajak tidak boleh lebih dari nilai bruto kuitansi.`;
}
