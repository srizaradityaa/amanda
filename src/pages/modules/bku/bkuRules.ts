import {
  mockRekeningBySubkegiatan,
  type BkuInfo,
  type KuitansiRow,
  type PajakEntry,
} from '@/data/mockData';
import { jenisPajakLabel } from '@/pages/modules/spj/pajakRules';

export interface BkuInput {
  noBku: string;
  tanggal: string;
}

export type BkuRow = KuitansiRow & { bku: BkuInfo };

export function validateBkuInput(rows: KuitansiRow[], input: BkuInput, exceptId?: string): string | null {
  const noBku = input.noBku.trim();
  if (!noBku) return 'No. BKU wajib diisi.';
  if (!input.tanggal) return 'Tanggal BKU wajib diisi.';
  const dipakai = rows.some(
    (r) => r.id !== exceptId && r.bku !== undefined && r.bku.noBku.toLowerCase() === noBku.toLowerCase(),
  );
  if (dipakai) return `No. BKU ${noBku} sudah dipakai pada TA ini.`;
  return null;
}

export function bkuTercatat(rows: KuitansiRow[]): BkuRow[] {
  return rows
    .filter((r): r is BkuRow => r.spjStatus === 'dibukukan' && r.bku !== undefined)
    .sort(
      (a, b) =>
        a.bku.tanggal.localeCompare(b.bku.tanggal) ||
        a.bku.noBku.localeCompare(b.bku.noBku, 'id', { numeric: true }),
    );
}

export interface PajakRekapRow {
  key: string;
  jenisPajakId: string;
  jenisPajakLabel: string;
  nominal: number;
  seksiName: string;
  jenisBelanja: string;
  kodeSubkegiatan: string;
  kodeRekening: string;
  noBku: string;
  tanggalKuitansi: string;
}

export function buildPajakRekap(rows: BkuRow[], pajakByKuitansi: Record<string, PajakEntry[]>): PajakRekapRow[] {
  return rows.flatMap((row) =>
    (pajakByKuitansi[row.id] ?? []).map((entry) => ({
      key: `${row.id}-${entry.id}`,
      jenisPajakId: entry.jenisPajakId,
      jenisPajakLabel: jenisPajakLabel(entry.jenisPajakId),
      nominal: entry.nominal,
      seksiName: row.seksiName,
      jenisBelanja: row.spjJenisBelanja ?? '—',
      kodeSubkegiatan: row.kodeSubkegiatan,
      kodeRekening: row.kodeRekening,
      noBku: row.bku.noBku,
      tanggalKuitansi: row.tanggal,
    })),
  );
}

export interface KartuLine {
  row: BkuRow;
  sisaSetelah: number;
}

export interface KartuBlock {
  key: string;
  kodeSubkegiatan: string;
  namaSubkegiatan: string;
  kodeRekening: string;
  namaRekening: string;
  pagu: number;
  lines: KartuLine[];
  totalRealisasi: number;
  sisaAkhir: number;
}

export function buildKartuKendali(rows: BkuRow[]): KartuBlock[] {
  const groups = new Map<string, BkuRow[]>();
  for (const row of rows) {
    const key = `${row.subkegiatanId}|${row.rekeningId}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  return Array.from(groups, ([key, items]) => {
    const first = items[0];
    const rekening = mockRekeningBySubkegiatan[first.subkegiatanId]?.find((r) => r.id === first.rekeningId);
    const pagu = rekening?.pagu ?? 0;
    let running = 0;
    const lines = items.map((row) => {
      running += row.bruto;
      return { row, sisaSetelah: pagu - running };
    });
    return {
      key,
      kodeSubkegiatan: first.kodeSubkegiatan,
      namaSubkegiatan: first.subkegiatanName,
      kodeRekening: first.kodeRekening,
      namaRekening: rekening?.nama ?? '—',
      pagu,
      lines,
      totalRealisasi: running,
      sisaAkhir: pagu - running,
    };
  });
}
