import { useState, type FormEvent } from 'react';
import { ModalShell } from '@/components/ui/ModalShell';
import type { KuitansiRow } from '@/data/mockData';

export const JENIS_BELANJA_OPTIONS = ['Honor', 'Barang & Jasa', 'Perjalanan Dinas'] as const;

interface SpjCreateDialogProps {
  kuitansi: KuitansiRow;
  onConfirm: (jenisBelanja: string) => void;
  onClose: () => void;
}

export function SpjCreateDialog({ kuitansi, onConfirm, onClose }: SpjCreateDialogProps) {
  const [jenisBelanja, setJenisBelanja] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!jenisBelanja) return;
    onConfirm(jenisBelanja);
  };

  return (
    <ModalShell
      titleId="spj-create-title"
      title="Buat SPJ Draft"
      description={`${kuitansi.uraian}. Kuitansi ini akan terkunci selama SPJ masih terkait.`}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="spj-jenis" className="block text-xs font-medium text-ink-primary mb-1.5">
            Jenis belanja <span className="text-status-red">*</span>
          </label>
          <select
            id="spj-jenis"
            value={jenisBelanja}
            onChange={(event) => setJenisBelanja(event.target.value)}
            required
            className="input-base w-full text-sm"
          >
            <option value="">Pilih jenis belanja</option>
            {JENIS_BELANJA_OPTIONS.map((jenis) => (
              <option key={jenis} value={jenis}>{jenis}</option>
            ))}
          </select>
          <p className="mt-1.5 text-2xs text-ink-muted">Jenis belanja menentukan isian form SPJ yang tampil.</p>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost text-xs px-3 py-1.5" onClick={onClose}>
            Batal
          </button>
          <button
            type="submit"
            disabled={!jenisBelanja}
            className="btn-amber text-xs px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Buat SPJ Draft
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
