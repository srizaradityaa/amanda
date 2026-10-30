import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';

interface TaCreateDialogProps {
  existingYears: number[];
  onCreate: (tahun: number) => void;
  onClose: () => void;
}

export function TaCreateDialog({ existingYears, onCreate, onClose }: TaCreateDialogProps) {
  const [tahunInput, setTahunInput] = useState(String(Math.max(...existingYears) + 1));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const tahun = Number(tahunInput);
    if (!Number.isInteger(tahun) || tahun < 2000 || tahun > 2100) {
      setError('Masukkan tahun yang valid (2000 sampai 2100).');
      return;
    }
    if (existingYears.includes(tahun)) {
      setError(`TA ${tahun} sudah ada.`);
      return;
    }
    onCreate(tahun);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ta-create-title"
        className="surface-card w-full max-w-md p-6 animate-slide-up"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id="ta-create-title" className="text-base font-semibold text-ink-primary">
              Tambah Tahun Anggaran
            </h3>
            <p className="text-xs text-ink-secondary mt-1 leading-relaxed">
              TA baru dibuat dengan status Draft. Pagu dan checklist kesiapan diisi setelahnya.
            </p>
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

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-2xs uppercase tracking-wider text-ink-muted">Tahun Anggaran</span>
            <input
              type="number"
              inputMode="numeric"
              value={tahunInput}
              onChange={(event) => {
                setTahunInput(event.target.value);
                setError(null);
              }}
              className="input-base mt-1.5 font-mono tnum"
              autoFocus
            />
          </label>
          {error && <p className="text-xs text-status-red">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost text-xs px-3 py-1.5" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn-amber text-xs px-4 py-2">
              Simpan sebagai Draft
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
