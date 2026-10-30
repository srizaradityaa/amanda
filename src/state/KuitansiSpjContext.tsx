import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { mockKuitansiPptk, mockSpjPajakAwal, type KuitansiRow, type PajakEntry } from '@/data/mockData';
import type { KuitansiInput } from '@/pages/modules/kuitansi/KuitansiForm';
import { validateTotalPajak } from '@/pages/modules/spj/pajakRules';

interface KuitansiSpjValue {
  rows: KuitansiRow[];
  pajakByKuitansi: Record<string, PajakEntry[]>;
  saveKuitansi: (id: string | null, input: KuitansiInput) => void;
  cancelKuitansi: (id: string) => void;
  createSpj: (id: string, jenisBelanja: string) => void;
  ajukanSpj: (id: string) => void;
  lepasSpj: (id: string) => void;
  savePajak: (id: string, entries: PajakEntry[]) => string | null;
}

const KuitansiSpjContext = createContext<KuitansiSpjValue | null>(null);

export function KuitansiSpjProvider({ children }: { children: ReactNode }) {
  const [rows, setRows] = useState<KuitansiRow[]>(mockKuitansiPptk);
  const [pajakByKuitansi, setPajakByKuitansi] = useState<Record<string, PajakEntry[]>>(mockSpjPajakAwal);

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
    setPajakByKuitansi((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const createSpj = useCallback((id: string, jenisBelanja: string) => {
    updateRow(id, { status: 'terkunci', spjStatus: 'draft', spjJenisBelanja: jenisBelanja });
  }, [updateRow]);

  const ajukanSpj = useCallback((id: string) => {
    updateRow(id, { spjStatus: 'terkunci' });
  }, [updateRow]);

  const lepasSpj = useCallback((id: string) => {
    updateRow(id, { status: 'aktif', spjStatus: 'belum', spjJenisBelanja: undefined });
    setPajakByKuitansi((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, [updateRow]);

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
    () => ({ rows, pajakByKuitansi, saveKuitansi, cancelKuitansi, createSpj, ajukanSpj, lepasSpj, savePajak }),
    [rows, pajakByKuitansi, saveKuitansi, cancelKuitansi, createSpj, ajukanSpj, lepasSpj, savePajak],
  );

  return <KuitansiSpjContext.Provider value={value}>{children}</KuitansiSpjContext.Provider>;
}

export function useKuitansiSpj(): KuitansiSpjValue {
  const ctx = useContext(KuitansiSpjContext);
  if (!ctx) throw new Error('useKuitansiSpj harus digunakan di dalam KuitansiSpjProvider');
  return ctx;
}
