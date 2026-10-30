import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { mockKuitansiPptk, mockSpjPajakAwal, type KuitansiRow, type PajakEntry } from '@/data/mockData';
import { mockFormDinamis } from '@/data/formDinamisMock';
import type { KuitansiInput } from '@/pages/modules/kuitansi/KuitansiForm';
import { validateTotalPajak } from '@/pages/modules/spj/pajakRules';
import { validateIsianWajib, type SpjIsian } from '@/pages/modules/spj/formDinamisRules';

interface KuitansiSpjValue {
  rows: KuitansiRow[];
  pajakByKuitansi: Record<string, PajakEntry[]>;
  isianByKuitansi: Record<string, SpjIsian>;
  saveKuitansi: (id: string | null, input: KuitansiInput) => void;
  cancelKuitansi: (id: string) => void;
  createSpj: (id: string, jenisBelanja: string) => void;
  ajukanSpj: (id: string) => string | null;
  lepasSpj: (id: string) => void;
  saveIsian: (id: string, isian: SpjIsian) => string | null;
  savePajak: (id: string, entries: PajakEntry[]) => string | null;
}

const KuitansiSpjContext = createContext<KuitansiSpjValue | null>(null);

function withoutKey<T>(record: Record<string, T>, key: string): Record<string, T> {
  const next = { ...record };
  delete next[key];
  return next;
}

export function KuitansiSpjProvider({ children }: { children: ReactNode }) {
  const [rows, setRows] = useState<KuitansiRow[]>(mockKuitansiPptk);
  const [pajakByKuitansi, setPajakByKuitansi] = useState<Record<string, PajakEntry[]>>(mockSpjPajakAwal);
  const [isianByKuitansi, setIsianByKuitansi] = useState<Record<string, SpjIsian>>({});

  const updateRow = useCallback((id: string, patch: Partial<KuitansiRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
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

  const cancelKuitansi = useCallback((id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
    setPajakByKuitansi((prev) => withoutKey(prev, id));
    setIsianByKuitansi((prev) => withoutKey(prev, id));
  }, []);

  const createSpj = useCallback((id: string, jenisBelanja: string) => {
    updateRow(id, { status: 'terkunci', spjStatus: 'draft', spjJenisBelanja: jenisBelanja });
  }, [updateRow]);

  const ajukanSpj = useCallback((id: string): string | null => {
    const row = rows.find((r) => r.id === id);
    const form = row?.spjJenisBelanja ? mockFormDinamis[row.spjJenisBelanja] : undefined;
    const isian = isianByKuitansi[id];
    if (!form) return 'Form Dinamis untuk SPJ ini belum tersedia.';
    if (!isian) return 'Isi SPJ terlebih dahulu sebelum mengajukan.';
    const error = validateIsianWajib(form, isian);
    if (error) return error;
    updateRow(id, { spjStatus: 'terkunci' });
    return null;
  }, [rows, isianByKuitansi, updateRow]);

  const lepasSpj = useCallback((id: string) => {
    updateRow(id, { status: 'aktif', spjStatus: 'belum', spjJenisBelanja: undefined });
    setPajakByKuitansi((prev) => withoutKey(prev, id));
    setIsianByKuitansi((prev) => withoutKey(prev, id));
  }, [updateRow]);

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

  const value = useMemo<KuitansiSpjValue>(
    () => ({
      rows,
      pajakByKuitansi,
      isianByKuitansi,
      saveKuitansi,
      cancelKuitansi,
      createSpj,
      ajukanSpj,
      lepasSpj,
      saveIsian,
      savePajak,
    }),
    [rows, pajakByKuitansi, isianByKuitansi, saveKuitansi, cancelKuitansi, createSpj, ajukanSpj, lepasSpj, saveIsian, savePajak],
  );

  return <KuitansiSpjContext.Provider value={value}>{children}</KuitansiSpjContext.Provider>;
}

export function useKuitansiSpj(): KuitansiSpjValue {
  const ctx = useContext(KuitansiSpjContext);
  if (!ctx) throw new Error('useKuitansiSpj harus digunakan di dalam KuitansiSpjProvider');
  return ctx;
}
