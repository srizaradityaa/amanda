import { useMemo, useState } from 'react';
import { BookOpen, Lock, Plus } from 'lucide-react';
import type { SessionUser } from '@/auth/types';
import { formatRupiah, formatDateID, type KuitansiRow } from '@/data/mockData';
import { PageHeader, StatusBadge } from '@/components/ui/Primitives';
import { toKuitansiActor, useKuitansiSpj } from '@/state/KuitansiSpjContext';
import { todayWita } from '@/lib/witaDate';

export function BkuModule({ session }: { session: SessionUser }) {
  const { rows, bukukanSpj } = useKuitansiSpj();
  const actor = toKuitansiActor(session);
  const [showForm, setShowForm] = useState(false);
  const [formNoBku, setFormNoBku] = useState('');
  const [formTanggal, setFormTanggal] = useState(todayWita());
  const [formSpjId, setFormSpjId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const allowed = session.role === 'bendahara' || session.role === 'verifikator';

  const bukuRows = useMemo(() => rows.filter((r) => r.spjStatus === 'dibukukan' && r.bku), [rows]);
  const dicabutCount = useMemo(() => rows.filter((r) => r.bkuDicabut).length, [rows]);
  const spjMenungguBku = useMemo(
    () => rows.filter((r) => r.spjStatus === 'menunggu_bku' && !r.bkuDicabut),
    [rows],
  );
  const selectedSpj: KuitansiRow | undefined = spjMenungguBku.find((s) => s.id === formSpjId);

  if (!allowed) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Buku Kas (BKU)" subtitle="Akses ditolak" />
        <div className="surface-card p-10 flex flex-col items-center justify-center text-center min-h-[320px]">
          <Lock className="h-8 w-8 text-status-red mb-4" />
          <p className="text-sm text-ink-secondary max-w-md">Hanya Bendahara dan Verifikator yang dapat mengakses BKU. (D02 §6, D03 §3/§5)</p>
        </div>
      </div>
    );
  }

  const ta = session.activeTa;
  const canEdit = session.role === 'bendahara';

  const resetForm = () => {
    setFormNoBku('');
    setFormTanggal(todayWita());
    setFormSpjId('');
    setFormError(null);
    setShowForm(false);
  };

  const handleSaveBku = () => {
    if (!selectedSpj) {
      setFormError('Pilih SPJ yang sudah disetujui Verifikator.');
      return;
    }
    const error = bukukanSpj(selectedSpj.id, { noBku: formNoBku, tanggal: formTanggal }, actor);
    if (error) {
      setFormError(error);
      return;
    }
    resetForm();
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Buku Kas (BKU)" subtitle={`TA ${ta?.taYear ?? 2026} ${canEdit ? '• Bendahara pencatat' : '• Verifikator (baca)'}`} mode="PRO" />

      <div className="surface-card mb-5 px-4 py-3 flex items-center justify-between">
        <div className="text-xs text-ink-secondary">
          <span className="text-ink-primary font-medium">{bukuRows.length}</span> tercatat • <span className="text-status-red">{dicabutCount}</span> dicabut
        </div>
        {canEdit && (
          <button className="btn-amber text-xs px-3 py-1.5 flex items-center gap-1.5" onClick={() => (showForm ? resetForm() : setShowForm(true))}>
            <Plus className="h-3.5 w-3.5" />
            Catat BKU
          </button>
        )}
      </div>

      {showForm && canEdit && (
        <div className="surface-card p-5 mb-5 animate-slide-up">
          <h3 className="text-sm font-semibold text-ink-primary mb-4">Catat BKU Baru</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="bku-no" className="text-2xs uppercase tracking-wider text-ink-muted">No. BKU</label>
              <input
                id="bku-no"
                value={formNoBku}
                onChange={(e) => setFormNoBku(e.target.value)}
                className="input-base w-full mt-1 text-sm font-mono"
                placeholder="B-0143"
              />
            </div>
            <div>
              <label htmlFor="bku-tgl" className="text-2xs uppercase tracking-wider text-ink-muted">Tanggal BKU</label>
              <input
                id="bku-tgl"
                type="date"
                value={formTanggal}
                onChange={(e) => setFormTanggal(e.target.value)}
                className="input-base w-full mt-1 text-sm"
              />
            </div>
            <div>
              <label htmlFor="bku-spj" className="text-2xs uppercase tracking-wider text-ink-muted">SPJ Menunggu BKU</label>
              <select
                id="bku-spj"
                value={formSpjId}
                onChange={(e) => setFormSpjId(e.target.value)}
                className="input-base w-full mt-1 text-sm"
              >
                <option value="">Pilih SPJ</option>
                {spjMenungguBku.map((s) => (
                  <option key={s.id} value={s.id}>{`${s.verifikasi?.nomor ?? s.id} — ${s.uraian}`}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="bku-nominal" className="text-2xs uppercase tracking-wider text-ink-muted">Nominal (Rp)</label>
              <input
                id="bku-nominal"
                readOnly
                value={selectedSpj ? formatRupiah(selectedSpj.bruto) : ''}
                placeholder="Mengikuti nilai bruto SPJ"
                className="input-base w-full mt-1 text-sm font-mono tnum opacity-80"
              />
            </div>
          </div>
          {formError && <p className="mt-3 text-xs text-status-red">{formError}</p>}
          <div className="flex items-center justify-end gap-2 mt-4">
            <button className="btn-ghost text-xs px-3 py-1.5" onClick={resetForm}>Batal</button>
            <button className="btn-amber text-xs px-3 py-1.5" onClick={handleSaveBku}>Simpan BKU</button>
          </div>
        </div>
      )}

      <div className="surface-card">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-ink-primary">Daftar BKU</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-hover">
                <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">No. BKU</th>
                <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Tanggal</th>
                <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Uraian</th>
                <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2 hidden md:table-cell">Kuitansi</th>
                <th className="text-right font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Nominal</th>
                <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {bukuRows.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors h-8">
                  <td className="px-4 py-1 font-mono text-xs text-ink-primary">{r.bku?.noBku}</td>
                  <td className="px-4 py-1 text-xs text-ink-secondary">{r.bku ? formatDateID(r.bku.tanggal) : '—'}</td>
                  <td className="px-4 py-1 text-xs text-ink-primary">{r.uraian}</td>
                  <td className="px-4 py-1 font-mono text-xs text-ink-secondary hidden md:table-cell">{r.verifikasi?.nomor ?? '—'}</td>
                  <td className="px-4 py-1 text-right font-mono tnum text-xs text-ink-primary">{formatRupiah(r.bruto)}</td>
                  <td className="px-4 py-1"><StatusBadge status="dibukukan" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 surface-card px-4 py-3 flex items-start gap-3">
        <BookOpen className="h-5 w-5 text-ink-secondary shrink-0 mt-0.5" />
        <p className="text-xs text-ink-secondary leading-relaxed">
          <span className="text-ink-primary font-medium">BKU murni:</span> Mencatat realisasi pengeluaran belanja. Pencabutan BKU berjenjang — BKU terbaru dicabut dulu. Kolom kuitansi tidak tampil untuk PA/KPA di laporan. (D02 §6, D03 §3)
        </p>
      </div>
    </div>
  );
}
