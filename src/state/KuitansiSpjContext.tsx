import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  mockAuditEventsFull,
  mockKuitansiPptk,
  mockSpjPajakAwal,
  type AuditEvent,
  type KuitansiRow,
  type PajakEntry,
} from '@/data/mockData';
import { mockFormDinamis } from '@/data/formDinamisMock';
import type { KuitansiInput } from '@/pages/modules/kuitansi/KuitansiForm';
import { validateTotalPajak } from '@/pages/modules/spj/pajakRules';
import { validateIsianWajib, type SpjIsian } from '@/pages/modules/spj/formDinamisRules';
import { formatNomorVerifikasi, generateToken } from '@/pages/modules/verifikasi/verifikasiRules';
import { validateBkuInput, type BkuInput } from '@/pages/modules/bku/bkuRules';
import { todayWita } from '@/lib/witaDate';
import type { Role, SessionUser } from '@/auth/types';

export interface KuitansiActor {
  id: string;
  nama: string;
  nip: string;
  role: Role;
}

export function toKuitansiActor(session: SessionUser): KuitansiActor {
  return { id: session.id, nama: session.displayName, nip: session.nipNikOrEmail, role: session.role };
}

export interface BkuKoreksiInput {
  noBku?: string;
  tanggal?: string;
}

interface KuitansiSpjValue {
  rows: KuitansiRow[];
  pajakByKuitansi: Record<string, PajakEntry[]>;
  isianByKuitansi: Record<string, SpjIsian>;
  auditEvents: AuditEvent[];
  saveKuitansi: (id: string | null, input: KuitansiInput) => void;
  cancelKuitansi: (id: string) => string | null;
  createSpj: (id: string, jenisBelanja: string) => void;
  ajukanSpj: (id: string, actor: KuitansiActor) => string | null;
  lepasSpj: (id: string) => string | null;
  saveIsian: (id: string, isian: SpjIsian) => string | null;
  savePajak: (id: string, entries: PajakEntry[]) => string | null;
  verifySpj: (id: string, actor: KuitansiActor) => string | null;
  returnSpj: (id: string, catatan: string, actor: KuitansiActor) => string | null;
  bukukanSpj: (id: string, input: BkuInput, actor: KuitansiActor) => string | null;
  koreksiBku: (id: string, input: BkuKoreksiInput, actor: KuitansiActor) => string | null;
  cabutBku: (id: string, alasan: string, actor: KuitansiActor) => string | null;
}

const KuitansiSpjContext = createContext<KuitansiSpjValue | null>(null);

const SELF_VERIFY_MESSAGE = 'Anda tidak dapat memverifikasi SPJ yang Anda ajukan sendiri, termasuk saat bertindak sebagai PPTK atau Plh./Plt.';

function withoutKey<T>(record: Record<string, T>, key: string): Record<string, T> {
  const next = { ...record };
  delete next[key];
  return next;
}

export function KuitansiSpjProvider({ children }: { children: ReactNode }) {
  const [rows, setRows] = useState<KuitansiRow[]>(mockKuitansiPptk);
  const [pajakByKuitansi, setPajakByKuitansi] = useState<Record<string, PajakEntry[]>>(mockSpjPajakAwal);
  const [isianByKuitansi, setIsianByKuitansi] = useState<Record<string, SpjIsian>>({});
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(mockAuditEventsFull);
  const [verifikasiSeq, setVerifikasiSeq] = useState(2);

  const updateRow = useCallback((id: string, patch: Partial<KuitansiRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  const logAudit = useCallback((actor: KuitansiActor, event: Omit<AuditEvent, 'id' | 'waktu' | 'aktorName' | 'aktorNipNik' | 'peran'>) => {
    setAuditEvents((prev) => [
      {
        ...event,
        id: `ev-${Date.now().toString(36)}-${prev.length}`,
        waktu: new Date().toISOString(),
        aktorName: actor.nama,
        aktorNipNik: actor.nip,
        peran: actor.role,
      },
      ...prev,
    ]);
  }, []);

  const saveKuitansi = useCallback((id: string | null, input: KuitansiInput) => {
    if (id) {
      updateRow(id, input);
      return;
    }
    setRows((prev) => [
      ...prev,
      { ...input, id: `kwt-${Date.now().toString(36)}`, status: 'aktif', spjStatus: 'belum' },
    ]);
  }, [updateRow]);

  const cancelKuitansi = useCallback((id: string): string | null => {
    const row = rows.find((r) => r.id === id);
    if (!row) return 'Kuitansi tidak ditemukan.';
    if (row.spjStatus !== 'belum') return 'Kuitansi yang sudah masuk SPJ tidak dapat dibatalkan. Lepas SPJ terlebih dahulu.';
    setRows((prev) => prev.filter((r) => r.id !== id));
    setPajakByKuitansi((prev) => withoutKey(prev, id));
    setIsianByKuitansi((prev) => withoutKey(prev, id));
    return null;
  }, [rows]);

  const createSpj = useCallback((id: string, jenisBelanja: string) => {
    updateRow(id, { status: 'terkunci', spjStatus: 'draft', spjJenisBelanja: jenisBelanja });
  }, [updateRow]);

  const ajukanSpj = useCallback((id: string, actor: KuitansiActor): string | null => {
    const row = rows.find((r) => r.id === id);
    if (!row) return 'Kuitansi tidak ditemukan.';
    const form = row.spjJenisBelanja ? mockFormDinamis[row.spjJenisBelanja] : undefined;
    const isian = isianByKuitansi[id];
    if (!form) return 'Form Dinamis untuk SPJ ini belum tersedia.';
    if (!isian) return 'Isi SPJ terlebih dahulu sebelum mengajukan.';
    const error = validateIsianWajib(form, isian);
    if (error) return error;
    updateRow(id, { spjStatus: 'terkunci', pengajuId: actor.id, pengajuName: actor.nama, catatanRevisi: undefined });
    return null;
  }, [rows, isianByKuitansi, updateRow]);

  const lepasSpj = useCallback((id: string): string | null => {
    const row = rows.find((r) => r.id === id);
    if (!row) return 'Kuitansi tidak ditemukan.';
    if (row.spjStatus === 'menunggu_bku' || row.spjStatus === 'dibukukan') {
      return 'SPJ yang sudah diverifikasi tidak dapat dilepas. Minta Bendahara mencabut BKU dan Verifikator mengembalikan SPJ ke Draft.';
    }
    updateRow(id, { status: 'aktif', spjStatus: 'belum', spjJenisBelanja: undefined, pengajuId: undefined, pengajuName: undefined, catatanRevisi: undefined });
    setPajakByKuitansi((prev) => withoutKey(prev, id));
    setIsianByKuitansi((prev) => withoutKey(prev, id));
    return null;
  }, [rows, updateRow]);

  const saveIsian = useCallback((id: string, isian: SpjIsian): string | null => {
    const row = rows.find((r) => r.id === id);
    if (!row || row.spjStatus !== 'draft') {
      return 'SPJ tidak berstatus Draft, sehingga isian tidak dapat diubah.';
    }
    const form = row.spjJenisBelanja ? mockFormDinamis[row.spjJenisBelanja] : undefined;
    if (!form) return 'Form Dinamis untuk jenis belanja ini belum tersedia.';
    const error = validateIsianWajib(form, isian);
    if (error) return error;
    setIsianByKuitansi((prev) => ({ ...prev, [id]: isian }));
    return null;
  }, [rows]);

  const savePajak = useCallback((id: string, entries: PajakEntry[]): string | null => {
    const row = rows.find((r) => r.id === id);
    if (!row || row.spjStatus !== 'draft') {
      return 'SPJ tidak berstatus Draft, sehingga pajak tidak dapat diubah.';
    }
    const error = validateTotalPajak(row.bruto, entries);
    if (error) return error;
    setPajakByKuitansi((prev) => ({ ...prev, [id]: entries }));
    return null;
  }, [rows]);

  const verifySpj = useCallback((id: string, actor: KuitansiActor): string | null => {
    const row = rows.find((r) => r.id === id);
    if (!row || row.spjStatus !== 'terkunci') return 'SPJ tidak berstatus Terkunci dan tidak dapat diverifikasi.';
    if (row.pengajuId === actor.id) return SELF_VERIFY_MESSAGE;
    const nomor = formatNomorVerifikasi(verifikasiSeq);
    setVerifikasiSeq((seq) => seq + 1);
    updateRow(id, {
      spjStatus: 'menunggu_bku',
      verifikasi: {
        nomor,
        token: generateToken(),
        status: 'berlaku',
        tanggal: todayWita(),
        verifikatorName: actor.nama,
        verifikatorNip: actor.nip,
      },
    });
    logAudit(actor, { entitas: `SPJ ${row.id}`, aksi: 'Verifikasi SPJ disetujui', nilaiSesudah: nomor });
    return null;
  }, [rows, verifikasiSeq, updateRow, logAudit]);

  const returnSpj = useCallback((id: string, catatan: string, actor: KuitansiActor): string | null => {
    const row = rows.find((r) => r.id === id);
    if (!row || (row.spjStatus !== 'terkunci' && row.spjStatus !== 'menunggu_bku')) {
      return 'SPJ tidak dapat dikembalikan pada status ini.';
    }
    if (row.pengajuId === actor.id) return SELF_VERIFY_MESSAGE;
    const alasan = catatan.trim();
    if (!alasan) return 'Catatan revisi wajib diisi.';
    const tokenLama = row.verifikasi ? [...(row.verifikasiSebelumnya ?? []), { ...row.verifikasi, status: 'tidak_berlaku' as const }] : row.verifikasiSebelumnya;
    updateRow(id, {
      spjStatus: 'draft',
      catatanRevisi: alasan,
      bkuDicabut: false,
      verifikasi: undefined,
      verifikasiSebelumnya: tokenLama,
    });
    logAudit(actor, { entitas: `SPJ ${row.id}`, aksi: 'SPJ dikembalikan ke Draft', alasan });
    return null;
  }, [rows, updateRow, logAudit]);

  const bukukanSpj = useCallback((id: string, input: BkuInput, actor: KuitansiActor): string | null => {
    const row = rows.find((r) => r.id === id);
    if (!row || row.spjStatus !== 'menunggu_bku' || row.bkuDicabut) {
      return 'SPJ tidak berstatus Menunggu BKU.';
    }
    const error = validateBkuInput(rows, input);
    if (error) return error;
    const noBku = input.noBku.trim();
    updateRow(id, { spjStatus: 'dibukukan', bku: { noBku, tanggal: input.tanggal } });
    logAudit(actor, { entitas: `BKU ${noBku}`, aksi: 'Pencatatan BKU', nilaiSesudah: `No. ${noBku} · ${input.tanggal}` });
    return null;
  }, [rows, updateRow, logAudit]);

  const koreksiBku = useCallback((id: string, input: BkuKoreksiInput, actor: KuitansiActor): string | null => {
    const row = rows.find((r) => r.id === id);
    if (!row || !row.bku) return 'BKU tidak ditemukan.';
    const nextNo = (input.noBku ?? row.bku.noBku).trim();
    const nextTanggal = input.tanggal ?? row.bku.tanggal;
    const error = validateBkuInput(rows, { noBku: nextNo, tanggal: nextTanggal }, id);
    if (error) return error;
    if (nextNo === row.bku.noBku && nextTanggal === row.bku.tanggal) return null;
    updateRow(id, { bku: { noBku: nextNo, tanggal: nextTanggal } });
    logAudit(actor, {
      entitas: `BKU ${row.bku.noBku}`,
      aksi: 'Koreksi BKU',
      nilaiSebelum: `No. ${row.bku.noBku} · ${row.bku.tanggal}`,
      nilaiSesudah: `No. ${nextNo} · ${nextTanggal}`,
    });
    return null;
  }, [rows, updateRow, logAudit]);

  const cabutBku = useCallback((id: string, alasan: string, actor: KuitansiActor): string | null => {
    const row = rows.find((r) => r.id === id);
    if (!row || row.spjStatus !== 'dibukukan' || !row.bku) return 'BKU tidak ditemukan untuk dicabut.';
    const catatan = alasan.trim();
    if (!catatan) return 'Alasan pencabutan wajib diisi.';
    const noBku = row.bku.noBku;
    updateRow(id, { spjStatus: 'menunggu_bku', bku: undefined, bkuDicabut: true });
    logAudit(actor, { entitas: `BKU ${noBku}`, aksi: 'Pencabutan BKU', nilaiSebelum: `No. ${noBku}`, alasan: catatan });
    return null;
  }, [rows, updateRow, logAudit]);

  const value = useMemo<KuitansiSpjValue>(
    () => ({
      rows,
      pajakByKuitansi,
      isianByKuitansi,
      auditEvents,
      saveKuitansi,
      cancelKuitansi,
      createSpj,
      ajukanSpj,
      lepasSpj,
      saveIsian,
      savePajak,
      verifySpj,
      returnSpj,
      bukukanSpj,
      koreksiBku,
      cabutBku,
    }),
    [
      rows, pajakByKuitansi, isianByKuitansi, auditEvents, saveKuitansi, cancelKuitansi, createSpj, ajukanSpj,
      lepasSpj, saveIsian, savePajak, verifySpj, returnSpj, bukukanSpj, koreksiBku, cabutBku,
    ],
  );

  return <KuitansiSpjContext.Provider value={value}>{children}</KuitansiSpjContext.Provider>;
}

export function useKuitansiSpj(): KuitansiSpjValue {
  const ctx = useContext(KuitansiSpjContext);
  if (!ctx) throw new Error('useKuitansiSpj harus digunakan di dalam KuitansiSpjProvider');
  return ctx;
}
