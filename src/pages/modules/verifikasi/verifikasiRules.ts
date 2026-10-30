import type { KuitansiRow } from '@/data/mockData';

export const TAHUN_ANGGARAN_AKTIF = 2026;

const TOKEN_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

export type AntreanStatus = 'terkunci' | 'dikembalikan' | 'menunggu_bku' | 'dicabut' | 'dibukukan';

export interface AntreanItem {
  row: KuitansiRow;
  status: AntreanStatus;
}

export function formatNomorVerifikasi(seq: number): string {
  return `VER/${TAHUN_ANGGARAN_AKTIF}/${String(seq).padStart(4, '0')}`;
}

export function generateToken(length = 16): string {
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => TOKEN_ALPHABET[b % TOKEN_ALPHABET.length]).join('');
}

export interface KeaslianResult {
  berlaku: boolean;
  taName: string;
  seksiName: string;
  tanggalVerifikasi: string;
}

export function findKeaslianByToken(rows: KuitansiRow[], token: string): KeaslianResult | null {
  for (const row of rows) {
    const current = row.verifikasi?.token === token ? row.verifikasi : null;
    const old = row.verifikasiSebelumnya?.find((v) => v.token === token) ?? null;
    const match = current ?? old;
    if (match) {
      return {
        berlaku: match.status === 'berlaku',
        taName: `Tahun Anggaran ${TAHUN_ANGGARAN_AKTIF}`,
        seksiName: row.seksiName,
        tanggalVerifikasi: match.tanggal,
      };
    }
  }
  return null;
}

export function antreanStatusOf(row: KuitansiRow): AntreanStatus | null {
  if (row.spjStatus === 'terkunci') return 'terkunci';
  if (row.spjStatus === 'draft' && row.catatanRevisi) return 'dikembalikan';
  if (row.spjStatus === 'menunggu_bku') return row.bkuDicabut ? 'dicabut' : 'menunggu_bku';
  if (row.spjStatus === 'dibukukan') return 'dibukukan';
  return null;
}

export function antreanItems(rows: KuitansiRow[]): AntreanItem[] {
  return rows.flatMap((row) => {
    const status = antreanStatusOf(row);
    return status ? [{ row, status }] : [];
  });
}

export function ringkasAntrean(items: AntreanItem[]): { menunggu: number; revisi: number; disetujui: number } {
  return {
    menunggu: items.filter((i) => i.status === 'terkunci').length,
    revisi: items.filter((i) => i.status === 'dikembalikan').length,
    disetujui: items.filter((i) => i.status === 'menunggu_bku' || i.status === 'dicabut' || i.status === 'dibukukan').length,
  };
}
