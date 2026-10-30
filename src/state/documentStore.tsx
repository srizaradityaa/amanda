import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { mockKuitansiPptk, type KuitansiRow } from '@/data/mockData';
import type { KuitansiInput } from '@/pages/modules/kuitansi/KuitansiForm';

export interface PajakEntry {
  id: string;
  jenis: string;
  nominal: number;
}

export interface SpjDetail {
  jenisBelanja: string;
  rincian: string;
  pajak: PajakEntry[];
}

interface DocumentStore {
  rows: KuitansiRow[];
  spjByKuitansi: Record<string, SpjDetail>;
  addKuitansi: (input: KuitansiInput) => void;
  updateKuitansi: (id: string, input: KuitansiInput) => void;
  cancelKuitansi: (id: string) => void;
  saveSpjDraft: (kuitansiId: string, detail: SpjDetail) => void;
  ajukanSpj: (kuitansiId: string) => void;
  lepasSpj: (kuitansiId: string) => void;
}

const DocumentStoreContext = createContext<DocumentStore | null>(null);

const seedSpj: Record<string, SpjDetail> = {
  'kwt-001': {
    jenisBelanja: 'Honor',
    rincian: 'Honor narasumber kegiatan evaluasi, 2 orang',
    pajak: [{ id: 'pjk-seed-1', jenis: 'PPH21', nominal: 450_000 }],
  },
  'kwt-009': {
    jenisBelanja: 'Barang & Jasa',
    rincian: 'Cetak dokumen perencanaan 200 eksemplar',
    pajak: [],
  },
};

export function DocumentStoreProvider({ children }: { children: ReactNode }) {
  const [rows, setRows] = useState<KuitansiRow[]>(mockKuitansiPptk);
  const [spjByKuitansi, setSpjByKuitansi] = useState<Record<string, SpjDetail>>(seedSpj);

  const addKuitansi = useCallback((input: KuitansiInput) => {
    const id = `kwt-${Date.now().toString(36)}`;
    setRows((prev) => [...prev, { ...input, id, status: 'aktif', spjStatus: 'belum' }]);
  }, []);

  const updateKuitansi = useCallback((id: string, input: KuitansiInput) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...input } : r)));
  }, []);

  const cancelKuitansi = useCallback((id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const saveSpjDraft = useCallback((kuitansiId: string, detail: SpjDetail) => {
    setSpjByKuitansi((prev) => ({ ...prev, [kuitansiId]: detail }));
    setRows((prev) =>
      prev.map((r) => (r.id === kuitansiId ? { ...r, status: 'terkunci', spjStatus: 'draft' } : r)),
    );
  }, []);

  const ajukanSpj = useCallback((kuitansiId: string) => {
    setRows((prev) => prev.map((r) => (r.id === kuitansiId ? { ...r, spjStatus: 'terkunci' } : r)));
  }, []);

  const lepasSpj = useCallback((kuitansiId: string) => {
    setSpjByKuitansi((prev) => {
      const next = { ...prev };
      delete next[kuitansiId];
      return next;
    });
    setRows((prev) =>
      prev.map((r) => (r.id === kuitansiId ? { ...r, status: 'aktif', spjStatus: 'belum' } : r)),
    );
  }, []);

  const value = useMemo<DocumentStore>(
    () => ({
      rows,
      spjByKuitansi,
      addKuitansi,
      updateKuitansi,
      cancelKuitansi,
      saveSpjDraft,
      ajukanSpj,
      lepasSpj,
    }),
    [rows, spjByKuitansi, addKuitansi, updateKuitansi, cancelKuitansi, saveSpjDraft, ajukanSpj, lepasSpj],
  );

  return <DocumentStoreContext.Provider value={value}>{children}</DocumentStoreContext.Provider>;
}

export function useDocumentStore(): DocumentStore {
  const ctx = useContext(DocumentStoreContext);
  if (!ctx) throw new Error('useDocumentStore harus dipakai di dalam DocumentStoreProvider');
  return ctx;
}
