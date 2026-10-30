import { useState, type FormEvent } from 'react';
import { ModalShell } from '@/components/ui/ModalShell';
import type { SotkUnit } from '@/data/sotkMock';
import type { UnitInput } from '@/lib/sotkRules';

type EditMode = 'nomenklatur' | 'ejaan';

interface SotkEditDialogProps {
  unit: SotkUnit;
  onReorganize: (input: UnitInput) => string | null;
  onCorrectName: (nama: string) => string | null;
  onClose: () => void;
}

const MODE_OPTIONS: { value: EditMode; label: string; hint: string }[] = [
  {
    value: 'nomenklatur',
    label: 'Pergantian Nomenklatur',
    hint: 'Untuk reorganisasi. Unit lama ditutup H-1 dari TMT baru dan diarsipkan; nama baru berlaku mulai TMT tersebut.',
  },
  {
    value: 'ejaan',
    label: 'Koreksi Ejaan',
    hint: 'Untuk memperbaiki salah ketik nama. Nama diperbarui langsung tanpa versi baru.',
  },
];

export function SotkEditDialog({ unit, onReorganize, onCorrectName, onClose }: SotkEditDialogProps) {
  const [mode, setMode] = useState<EditMode>('nomenklatur');
  const [nama, setNama] = useState(unit.nama);
  const [tmtMulai, setTmtMulai] = useState('');
  const [dasarHukum, setDasarHukum] = useState('');
  const [error, setError] = useState<string | null>(null);

  const activeHint = MODE_OPTIONS.find((option) => option.value === mode)?.hint;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result =
      mode === 'nomenklatur'
        ? onReorganize({ nama, tmtMulai, dasarHukum })
        : onCorrectName(nama);
    setError(result);
  }

  return (
    <ModalShell
      titleId="sotk-edit-title"
      title="Ubah Unit Kerja"
      description={`Unit saat ini: ${unit.nama}`}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {MODE_OPTIONS.map((option) => {
            const active = option.value === mode;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setMode(option.value);
                  setError(null);
                }}
                className={`text-left px-3 py-2.5 border text-xs font-medium transition-colors ${
                  active
                    ? 'border-amber text-amber bg-amber/10'
                    : 'border-border text-ink-secondary hover:text-ink-primary hover:border-ink-muted'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        {activeHint && <p className="text-2xs text-ink-muted leading-relaxed">{activeHint}</p>}

        <label className="block">
          <span className="text-2xs uppercase tracking-wider text-ink-muted">
            {mode === 'nomenklatur' ? 'Nama Baru' : 'Nama Unit'}
          </span>
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

        {mode === 'nomenklatur' && (
          <>
            <label className="block">
              <span className="text-2xs uppercase tracking-wider text-ink-muted">TMT Nama Baru</span>
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
                placeholder="Contoh: Perbup No. 3 Tahun 2025"
                className="input-base mt-1.5"
              />
            </label>
          </>
        )}

        {error && <p className="text-xs text-status-red">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost text-xs px-3 py-1.5" onClick={onClose}>
            Batal
          </button>
          <button type="submit" className="btn-amber text-xs px-4 py-2">
            {mode === 'nomenklatur' ? 'Terapkan Pergantian' : 'Simpan Koreksi'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
