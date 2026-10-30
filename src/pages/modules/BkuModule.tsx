import { useState } from 'react';
import { BookOpen, Lock, Plus } from 'lucide-react';
import type { SessionUser } from '@/auth/types';
import { formatRupiah, formatDateID } from '@/data/mockData';
import { PageHeader, StatusBadge } from '@/components/ui/Primitives';

interface BkuRow {
  id: string;
  noBku: string;
  tanggal: string;
  uraian: string;
  kuitansiRef: string;
  bruto: number;
  status: 'tercatat' | 'dicabut';
}

const mockBku: BkuRow[] = [
  { id: 'bku-001', noBku: 'B-0142', tanggal: '2026-10-28', uraian: 'Honor narasumber kegiatan evaluasi', kuitansiRef: 'kwt-001', bruto: 4_500_000, status: 'tercatat' },
  { id: 'bku-002', noBku: 'B-0138', tanggal: '2026-10-26', uraian: 'Belanja alat tulis kantor Q3', kuitansiRef: 'KWT-PEN-014', bruto: 8_200_000, status: 'tercatat' },
  { id: 'bku-003', noBku: 'B-0120', tanggal: '2026-10-22', uraian: 'Sewa ruang rapat koordinasi', kuitansiRef: 'kwt-012', bruto: 2_800_000, status: 'dicabut' },
  { id: 'bku-004', noBku: 'B-0115', tanggal: '2026-10-20', uraian: 'Perjalanan dinas koordinasi wilayah', kuitansiRef: 'KWT-PUB-007', bruto: 12_800_000, status: 'tercatat' },
  { id: 'bku-005', noBku: 'B-0108', tanggal: '2026-10-18', uraian: 'Pembinaan kelompok UMKM kecamatan', kuitansiRef: 'KWT-PUG-003', bruto: 6_000_000, status: 'tercatat' },
];

export function BkuModule({ session }: { session: SessionUser }) {
  const [showForm, setShowForm] = useState(false);
  const allowed = session.role === 'bendahara' || session.role === 'verifikator';
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

  return (
    <div className="animate-fade-in">
      <PageHeader title="Buku Kas (BKU)" subtitle={`TA ${ta?.taYear ?? 2026} ${canEdit ? '• Bendahara pencatat' : '• Verifikator (baca)'}`} mode="PRO" />

      <div className="surface-card mb-5 px-4 py-3 flex items-center justify-between">
        <div className="text-xs text-ink-secondary">
          <span className="text-ink-primary font-medium">{mockBku.filter((r) => r.status === 'tercatat').length}</span> tercatat • <span className="text-status-red">{mockBku.filter((r) => r.status === 'dicabut').length}</span> dicabut
        </div>
        {canEdit && (
          <button className="btn-amber text-xs px-3 py-1.5 flex items-center gap-1.5" onClick={() => setShowForm((v) => !v)}>
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
              <label className="text-2xs uppercase tracking-wider text-ink-muted">No. BKU</label>
              <input className="input-base w-full mt-1 text-sm font-mono" placeholder="B-0143" />
            </div>
            <div>
              <label className="text-2xs uppercase tracking-wider text-ink-muted">Tanggal BKU</label>
              <input type="date" className="input-base w-full mt-1 text-sm" defaultValue="2026-10-30" />
            </div>
            <div>
              <label className="text-2xs uppercase tracking-wider text-ink-muted">Kuitansi Terkait</label>
              <select className="input-base w-full mt-1 text-sm">
                <option>kwt-001 — Honor narasumber (Rp 4.500.000)</option>
                <option>KWT-PEN-014 — ATK Q3 (Rp 8.200.000)</option>
              </select>
            </div>
            <div>
              <label className="text-2xs uppercase tracking-wider text-ink-muted">Nominal (Rp)</label>
              <input type="number" className="input-base w-full mt-1 text-sm font-mono tnum" placeholder="0" />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 mt-4">
            <button className="btn-ghost text-xs px-3 py-1.5" onClick={() => setShowForm(false)}>Batal</button>
            <button className="btn-amber text-xs px-3 py-1.5" onClick={() => setShowForm(false)}>Simpan BKU</button>
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
              {mockBku.map((r) => (
                <tr key={r.id} className={`border-b border-border last:border-0 hover:bg-surface-hover transition-colors h-8 ${r.status === 'dicabut' ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-1 font-mono text-xs text-ink-primary">{r.noBku}</td>
                  <td className="px-4 py-1 text-xs text-ink-secondary">{formatDateID(r.tanggal)}</td>
                  <td className="px-4 py-1 text-xs text-ink-primary">{r.uraian}</td>
                  <td className="px-4 py-1 font-mono text-xs text-ink-secondary hidden md:table-cell">{r.kuitansiRef}</td>
                  <td className="px-4 py-1 text-right font-mono tnum text-xs text-ink-primary">{formatRupiah(r.bruto)}</td>
                  <td className="px-4 py-1"><StatusBadge status={r.status} /></td>
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
