import { useState, type FormEvent } from 'react';
import { ModalShell } from '@/components/ui/ModalShell';
import type { SpjAntrean } from '@/data/mockData';

interface SpjReturnDialogProps {
  spj: SpjAntrean;
  onConfirm: (catatan: string) => void;
  onClose: () => void;
}

export function SpjReturnDialog({ spj, onConfirm, onClose }: SpjReturnDialogProps) {
  const [catatan, setCatatan] = useState('');
  const trimmed = catatan.trim();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmed) return;
    onConfirm(trimmed);
  };

  return (
    <ModalShell
      titleId="spj-return-title"
      title="Kembalikan SPJ ke Seksi"
      description={`${spj.noRef} • ${spj.uraian}. SPJ kembali berstatus Draft dan kuitansi terkait tetap Terkunci.`}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="spj-return-note" className="block text-xs font-medium text-ink-primary mb-1.5">
            Catatan revisi <span className="text-status-red">*</span>
          </label>
          <textarea
            id="spj-return-note"
            value={catatan}
            onChange={(event) => setCatatan(event.target.value)}
            rows={4}
            required
            placeholder="Tuliskan bagian yang perlu diperbaiki oleh Seksi"
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-xs text-ink-primary placeholder:text-ink-muted focus:outline-none focus:border-amber"
          />
          {!trimmed && catatan.length > 0 && (
            <p className="mt-1 text-2xs text-status-red">Catatan revisi tidak boleh kosong.</p>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost text-xs px-3 py-1.5" onClick={onClose}>
            Batal
          </button>
          <button
            type="submit"
            disabled={!trimmed}
            className="rounded-md bg-status-red px-3 py-1.5 text-xs font-medium text-bg transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Kembalikan ke Draft
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
