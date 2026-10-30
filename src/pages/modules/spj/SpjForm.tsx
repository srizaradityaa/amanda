import { useState } from 'react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import {
  formatRupiah,
  mockJenisBelanja,
  mockJenisPajak,
  type KuitansiRow,
} from '@/data/mockData';
import type { SpjDetail } from '@/state/documentStore';

interface PajakDraft {
  id: string;
  jenis: string;
  nominal: string;
}

interface SpjFormProps {
  kuitansi: KuitansiRow;
  initial: SpjDetail | null;
  onSaveDraft: (detail: SpjDetail) => void;
  onBack: () => void;
}

function digitsOnly(value: string): number {
  return Number(value.replace(/\D/g, '') || '0');
}

export function SpjForm({ kuitansi, initial, onSaveDraft, onBack }: SpjFormProps) {
  const [jenisBelanja, setJenisBelanja] = useState(initial?.jenisBelanja ?? '');
  const [rincian, setRincian] = useState(initial?.rincian ?? '');
  const [pajak, setPajak] = useState<PajakDraft[]>(
    () => initial?.pajak.map((p) => ({ id: p.id, jenis: p.jenis, nominal: String(p.nominal) })) ?? [],
  );
  const [errors, setErrors] = useState<string[]>([]);

  const totalPajak = pajak.reduce((sum, p) => sum + digitsOnly(p.nominal), 0);
  const jumlahDibayarkan = kuitansi.bruto - totalPajak;
  const pajakMelebihi = totalPajak > kuitansi.bruto;

  const updatePajak = (id: string, patch: Partial<PajakDraft>) => {
    setPajak((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const addPajak = () => {
    setPajak((prev) => [...prev, { id: `pjk-${Date.now().toString(36)}`, jenis: '', nominal: '' }]);
  };

  const removePajak = (id: string) => {
    setPajak((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSave = () => {
    const nextErrors: string[] = [];
    if (jenisBelanja === '') nextErrors.push('Jenis belanja wajib dipilih.');
    if (rincian.trim() === '') nextErrors.push('Rincian belanja wajib diisi.');
    if (pajak.some((p) => p.jenis === '')) nextErrors.push('Setiap entri pajak wajib memilih jenis pajak.');
    if (pajakMelebihi) {
      nextErrors.push(
        `Total pajak ${formatRupiah(totalPajak)} melebihi nilai bruto kuitansi ${formatRupiah(kuitansi.bruto)}. Total pajak tidak boleh lebih dari nilai bruto kuitansi.`,
      );
    }
    setErrors(nextErrors);
    if (nextErrors.length > 0) return;

    onSaveDraft({
      jenisBelanja,
      rincian: rincian.trim(),
      pajak: pajak.map((p) => ({ id: p.id, jenis: p.jenis, nominal: digitsOnly(p.nominal) })),
    });
  };

  return (
    <div className="animate-fade-in">
      <button type="button" className="btn-ghost px-2 py-1 text-xs flex items-center gap-1.5 mb-4" onClick={onBack}>
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Kembali ke daftar SPJ
      </button>

      <div className="surface-card mb-5 px-4 py-3">
        <div className="text-2xs uppercase tracking-wider text-ink-muted">Kuitansi terkait</div>
        <div className="text-sm text-ink-primary mt-1">{kuitansi.uraian}</div>
        <div className="text-xs text-ink-secondary mt-0.5">
          {kuitansi.penerima} • Bruto <span className="font-mono tnum text-ink-primary">{formatRupiah(kuitansi.bruto)}</span>
        </div>
      </div>

      <div className="surface-card p-5 space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="spj-jenis" className="block text-xs text-ink-secondary mb-1.5">Jenis belanja</label>
            <select
              id="spj-jenis"
              className="input-base w-full"
              value={jenisBelanja}
              onChange={(e) => setJenisBelanja(e.target.value)}
            >
              <option value="">Pilih jenis belanja</option>
              {mockJenisBelanja.map((j) => (
                <option key={j} value={j}>{j}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="spj-rincian" className="block text-xs text-ink-secondary mb-1.5">Rincian belanja</label>
            <textarea
              id="spj-rincian"
              className="input-base w-full min-h-[88px]"
              value={rincian}
              onChange={(e) => setRincian(e.target.value)}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-ink-primary">Pajak</h3>
            <button type="button" className="btn-teal-outline px-3 py-1.5 text-xs flex items-center gap-1.5" onClick={addPajak}>
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Tambah pajak
            </button>
          </div>

          {pajak.length === 0 ? (
            <p className="text-xs text-ink-muted">Belum ada entri pajak. SPJ tanpa pajak tetap dapat diajukan.</p>
          ) : (
            <ul className="space-y-2">
              {pajak.map((p) => (
                <li key={p.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                  <select
                    className="input-base w-full"
                    aria-label="Jenis pajak"
                    value={p.jenis}
                    onChange={(e) => updatePajak(p.id, { jenis: e.target.value })}
                  >
                    <option value="">Pilih jenis pajak</option>
                    {mockJenisPajak.map((j) => (
                      <option key={j.kode} value={j.kode}>{j.label}</option>
                    ))}
                  </select>
                  <input
                    className="input-base w-full font-mono tnum"
                    aria-label="Nominal pajak"
                    inputMode="numeric"
                    placeholder="0"
                    value={p.nominal}
                    onChange={(e) => updatePajak(p.id, { nominal: e.target.value.replace(/\D/g, '') })}
                  />
                  <button
                    type="button"
                    className="px-2 py-1.5 rounded-md text-status-red hover:bg-status-red/10 transition-colors"
                    aria-label="Hapus entri pajak"
                    onClick={() => removePajak(p.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <dl className="mt-4 grid grid-cols-2 gap-2 text-xs max-w-sm">
            <dt className="text-ink-secondary">Total pajak</dt>
            <dd className={`text-right font-mono tnum ${pajakMelebihi ? 'text-status-red' : 'text-ink-primary'}`}>
              {formatRupiah(totalPajak)}
            </dd>
            <dt className="text-ink-secondary">Jumlah yang dibayarkan</dt>
            <dd className="text-right font-mono tnum text-ink-primary">
              {formatRupiah(Math.max(jumlahDibayarkan, 0))}
            </dd>
          </dl>
        </div>

        {errors.length > 0 && (
          <div role="alert" className="rounded-md border border-status-red/40 bg-status-red/10 px-4 py-3 text-xs text-status-red space-y-1">
            {errors.map((msg) => (
              <p key={msg}>{msg}</p>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <button type="button" className="btn-ghost px-3 py-1.5 text-xs" onClick={onBack}>
            Batal
          </button>
          <button type="button" className="btn-amber px-4 py-1.5 text-xs" onClick={handleSave}>
            Simpan sebagai Draft
          </button>
        </div>
      </div>
    </div>
  );
}
