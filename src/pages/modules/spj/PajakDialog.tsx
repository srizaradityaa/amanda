import { useState, type FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ModalShell } from '@/components/ui/ModalShell';
import {
  formatRupiahFull,
  mockJenisPajak,
  type KuitansiRow,
  type PajakEntry,
} from '@/data/mockData';
import {
  computeJumlahDibayarkan,
  computeTotalPajak,
  validateTotalPajak,
} from '@/pages/modules/spj/pajakRules';

interface DraftEntry {
  key: string;
  jenisPajakId: string;
  nominal: string;
}

interface PajakDialogProps {
  kuitansi: KuitansiRow;
  initialEntries: PajakEntry[];
  readOnly: boolean;
  onSave: (entries: PajakEntry[]) => string | null;
  onClose: () => void;
}

const JENIS_PAJAK_AKTIF = mockJenisPajak.filter((j) => j.aktif);

function newKey(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function PajakDialog({ kuitansi, initialEntries, readOnly, onSave, onClose }: PajakDialogProps) {
  const [drafts, setDrafts] = useState<DraftEntry[]>(() =>
    initialEntries.map((e) => ({ key: e.id, jenisPajakId: e.jenisPajakId, nominal: String(e.nominal) })),
  );
  const [saveError, setSaveError] = useState<string | null>(null);

  const parsed: PajakEntry[] = drafts.map((d) => ({
    id: d.key,
    jenisPajakId: d.jenisPajakId,
    nominal: Number(d.nominal) || 0,
  }));
  const totalPajak = computeTotalPajak(parsed);
  const dibayarkan = computeJumlahDibayarkan(kuitansi.bruto, parsed);
  const liveError = validateTotalPajak(kuitansi.bruto, parsed);
  const message = liveError ?? saveError;

  const updateDraft = (key: string, patch: Partial<DraftEntry>) => {
    setDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, ...patch } : d)));
    setSaveError(null);
  };

  const removeDraft = (key: string) => {
    setDrafts((prev) => prev.filter((d) => d.key !== key));
    setSaveError(null);
  };

  const addDraft = () => {
    setDrafts((prev) => [...prev, { key: newKey(), jenisPajakId: '', nominal: '' }]);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (readOnly) return;
    const entries: PajakEntry[] = [];
    for (const d of drafts) {
      if (!d.jenisPajakId || d.nominal.trim() === '') {
        setSaveError('Lengkapi jenis pajak dan nominal pada setiap entri.');
        return;
      }
      const nominal = Number(d.nominal);
      if (!Number.isInteger(nominal) || nominal < 0) {
        setSaveError('Nominal pajak harus berupa bilangan bulat dan tidak negatif.');
        return;
      }
      entries.push({ id: d.key, jenisPajakId: d.jenisPajakId, nominal });
    }
    const result = onSave(entries);
    if (result) {
      setSaveError(result);
      return;
    }
    onClose();
  };

  return (
    <ModalShell
      titleId="pajak-dialog-title"
      title="Entri Pajak SPJ"
      description={`${kuitansi.uraian}. Pajak diisi manual dan tidak mengubah nilai bruto kuitansi.`}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div className="space-y-2">
          {drafts.length === 0 && (
            <p className="text-xs text-ink-muted py-2">Belum ada entri pajak. SPJ tanpa pajak tetap dapat diterima.</p>
          )}
          {drafts.map((d) => (
            <div key={d.key} className="flex items-center gap-2">
              <select
                aria-label="Jenis pajak"
                value={d.jenisPajakId}
                disabled={readOnly}
                onChange={(event) => updateDraft(d.key, { jenisPajakId: event.target.value })}
                className="input-base flex-1 min-w-0 text-sm"
              >
                <option value="">Pilih jenis pajak</option>
                {JENIS_PAJAK_AKTIF.map((j) => (
                  <option key={j.id} value={j.id}>{j.kode} — {j.nama}</option>
                ))}
              </select>
              <input
                aria-label="Nominal pajak"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={d.nominal}
                disabled={readOnly}
                onChange={(event) => updateDraft(d.key, { nominal: event.target.value })}
                className="input-base w-36 text-sm font-mono tnum text-right"
                placeholder="0"
              />
              {!readOnly && (
                <button
                  type="button"
                  aria-label="Hapus entri pajak"
                  onClick={() => removeDraft(d.key)}
                  className="p-2 text-status-red hover:bg-status-red/10 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
          {!readOnly && (
            <button type="button" onClick={addDraft} className="btn-ghost text-xs px-2 py-1 flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Tambah entri pajak
            </button>
          )}
        </div>

        <dl className="border border-border bg-bg/60 divide-y divide-border text-xs">
          <div className="flex justify-between px-3 py-2">
            <dt className="text-ink-secondary">Nilai bruto kuitansi</dt>
            <dd className="font-mono tnum text-ink-primary">{formatRupiahFull(kuitansi.bruto)}</dd>
          </div>
          <div className="flex justify-between px-3 py-2">
            <dt className="text-ink-secondary">Total Pajak</dt>
            <dd className="font-mono tnum text-ink-primary">{formatRupiahFull(totalPajak)}</dd>
          </div>
          <div className="flex justify-between px-3 py-2">
            <dt className="text-ink-secondary">Jumlah yang dibayarkan</dt>
            <dd className="font-mono tnum text-ink-primary">{formatRupiahFull(dibayarkan)}</dd>
          </div>
        </dl>

        {message && (
          <p role="alert" className="text-xs text-status-red leading-relaxed">{message}</p>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost text-xs px-3 py-1.5" onClick={onClose}>
            {readOnly ? 'Tutup' : 'Batal'}
          </button>
          {!readOnly && (
            <button type="submit" className="btn-amber text-xs px-3 py-1.5">
              Simpan Pajak
            </button>
          )}
        </div>
      </form>
    </ModalShell>
  );
}
