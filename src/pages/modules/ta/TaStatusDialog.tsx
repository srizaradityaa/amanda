import { useEffect } from 'react';
import { TriangleAlert as AlertTriangle, ShieldCheck, X } from 'lucide-react';
import type { TaRecord } from '@/data/taMock';
import { TRANSITION_LABEL } from '@/lib/taLifecycle';

interface TaStatusDialogProps {
  ta: TaRecord;
  blocker: string | null;
  onToggleChecklist: (itemId: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

const TRANSITION_MESSAGE: Record<string, string> = {
  draft:
    'Setelah aktif, TA ini menjadi tempat transaksi berjalan. Pastikan seluruh persiapan sudah benar.',
  aktif_penuh:
    'Kuitansi dan SPJ baru tidak dapat dibuat lagi. Data kuitansi terkunci. Pembatalan kuitansi aktif, verifikasi SPJ, dan pencatatan BKU tetap berjalan.',
  masa_transisi:
    'Seluruh data TA menjadi baca-saja untuk kepentingan audit. Masa retensi 12 tahun dihitung sejak tanggal arsip.',
};

export function TaStatusDialog({ ta, blocker, onToggleChecklist, onConfirm, onClose }: TaStatusDialogProps) {
  const isActivation = ta.status === 'draft';
  const actionLabel = TRANSITION_LABEL[ta.status] ?? 'Lanjutkan';

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in"
      onClick={onClose}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="ta-status-title"
        aria-describedby="ta-status-message"
        className="surface-card w-full max-w-md p-6 animate-slide-up"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 shrink-0 bg-bg border border-border-strong flex items-center justify-center">
              {isActivation ? (
                <ShieldCheck className="h-4 w-4 text-teal" aria-hidden="true" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-status-yellow" aria-hidden="true" />
              )}
            </div>
            <div>
              <h3 id="ta-status-title" className="text-base font-semibold text-ink-primary">
                {actionLabel}?
              </h3>
              <p className="text-xs text-ink-secondary mt-0.5">{ta.nama}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-muted hover:text-ink-primary transition-colors"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p id="ta-status-message" className="mt-4 text-xs text-ink-secondary leading-relaxed">
          {TRANSITION_MESSAGE[ta.status]}
        </p>

        {isActivation && (
          <div className="mt-5">
            <div className="text-2xs uppercase tracking-wider text-ink-muted mb-2">
              Checklist kesiapan
            </div>
            <ul className="border border-border divide-y divide-border">
              {ta.checklist.map((item) => (
                <li key={item.id}>
                  <label className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-surface-hover transition-colors">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => onToggleChecklist(item.id)}
                      className="h-4 w-4 accent-amber"
                    />
                    <span className="text-xs text-ink-primary">{item.label}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}

        {blocker && (
          <p className="mt-4 text-xs text-status-red leading-relaxed">{blocker}</p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn-ghost text-xs px-3 py-1.5" onClick={onClose}>
            Batal
          </button>
          <button
            type="button"
            className="btn-amber text-xs px-4 py-2"
            onClick={onConfirm}
            disabled={blocker !== null}
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
