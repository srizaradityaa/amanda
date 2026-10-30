import { useState, type FormEvent } from 'react';
import { ModalShell } from '@/components/ui/ModalShell';
import type { SotkUnit } from '@/data/sotkMock';
import { previousDay, todayWita } from '@/lib/witaDate';

interface SotkArchiveDialogProps {
  unit: SotkUnit;
  onArchive: (tmtSelesai: string) => string | null;
  onClose: () => void;
}

export function SotkArchiveDialog({ unit, onArchive, onClose }: SotkArchiveDialogProps) {
  const [tmtSelesai, setTmtSelesai] = useState(() => previousDay(todayWita()));
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(onArchive(tmtSelesai));
  }

  return (
    <ModalShell
      titleId="sotk-archive-title"
      title="Arsipkan Unit Kerja"
      description={`${unit.nama} akan berstatus Diarsipkan (read-only) dan tidak dapat dipilih untuk Workspace TA baru. Riwayat transaksinya tetap utuh.`}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-2xs uppercase tracking-wider text-ink-muted">Tanggal Pengakhiran Efektif</span>
          <input
            type="date"
            value={tmtSelesai}
            onChange={(event) => {
              setTmtSelesai(event.target.value);
              setError(null);
            }}
            className="input-base mt-1.5 font-mono tnum"
            autoFocus
          />
          <span className="block text-2xs text-ink-muted mt-1.5">
            Default H-1 dari hari ini. Ubah bila mengikuti tanggal SK.
          </span>
        </label>
        {error && <p className="text-xs text-status-red">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost text-xs px-3 py-1.5" onClick={onClose}>
            Batal
          </button>
          <button
            type="submit"
            className="text-xs px-4 py-2 font-medium text-status-red border border-status-red/50 hover:bg-status-red/10 transition-colors"
          >
            Arsipkan Unit
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
