import { useState, type FormEvent } from 'react';
import { ModalShell } from '@/components/ui/ModalShell';
import type { UnitInput } from '@/lib/sotkRules';

interface SotkAddDialogProps {
  onSubmit: (input: UnitInput) => string | null;
  onClose: () => void;
}

export function SotkAddDialog({ onSubmit, onClose }: SotkAddDialogProps) {
  const [nama, setNama] = useState('');
  const [tmtMulai, setTmtMulai] = useState('');
  const [dasarHukum, setDasarHukum] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(onSubmit({ nama, tmtMulai, dasarHukum }));
  }

  return (
    <ModalShell
      titleId="sotk-add-title"
      title="Tambah Unit Baru"
      description="Untuk unit yang berdiri sendiri. Jika unit menggantikan nama yang sudah ada, gunakan aksi Ubah pada baris unit tersebut."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-2xs uppercase tracking-wider text-ink-muted">Nama Unit</span>
          <input
            value={nama}
            onChange={(event) => {
              setNama(event.target.value);
              setError(null);
            }}
            className="input-base mt-1.5"
            autoFocus
          />
        </label>
        <label className="block">
          <span className="text-2xs uppercase tracking-wider text-ink-muted">TMT Mulai</span>
          <input
            type="date"
            value={tmtMulai}
            onChange={(event) => {
              setTmtMulai(event.target.value);
              setError(null);
            }}
            className="input-base mt-1.5 font-mono tnum"
          />
        </label>
        <label className="block">
          <span className="text-2xs uppercase tracking-wider text-ink-muted">Dasar Hukum</span>
          <input
            value={dasarHukum}
            onChange={(event) => {
              setDasarHukum(event.target.value);
              setError(null);
            }}
            placeholder="Contoh: Perbup No. 12 Tahun 2024"
            className="input-base mt-1.5"
          />
        </label>
        {error && <p className="text-xs text-status-red">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost text-xs px-3 py-1.5" onClick={onClose}>
            Batal
          </button>
          <button type="submit" className="btn-amber text-xs px-4 py-2">
            Simpan Unit
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
