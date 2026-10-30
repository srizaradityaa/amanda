import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        className="surface-card w-full max-w-md p-6 animate-slide-up"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 shrink-0 rounded-full bg-status-red/15 flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-status-red" aria-hidden="true" />
          </div>
          <div>
            <h3 id="confirm-dialog-title" className="text-sm font-semibold text-ink-primary">
              {title}
            </h3>
            <p id="confirm-dialog-message" className="mt-1 text-xs text-ink-secondary leading-relaxed">
              {message}
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn-ghost text-xs px-3 py-1.5" onClick={onCancel}>
            Batal
          </button>
          <button
            type="button"
            className="rounded-md bg-status-red px-3 py-1.5 text-xs font-medium text-bg transition-opacity hover:opacity-90"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
