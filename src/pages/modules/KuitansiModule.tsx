import { useState } from 'react';
import { Receipt, Lock, Plus, AlertTriangle } from 'lucide-react';
import type { SessionUser } from '@/auth/types';
import { mockKuitansiPptk, formatRupiah, formatDateID, type KuitansiRow } from '@/data/mockData';
import { PageHeader, StatusBadge, GatekeeperBanner } from '@/components/ui/Primitives';
import { mockSeksiList } from '@/data/mockData';

export function KuitansiModule({ session }: { session: SessionUser }) {
  if (session.role !== 'pptk') {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Kuitansi" subtitle="Akses ditolak" />
        <div className="surface-card p-10 flex flex-col items-center justify-center text-center min-h-[320px]">
          <Lock className="h-8 w-8 text-status-red mb-4" />
          <p className="text-sm text-ink-secondary max-w-md">Hanya PPTK yang dapat membuat dan mengelola kuitansi. (D02 §2, D03 §4)</p>
        </div>
      </div>
    );
  }

  const ta = session.activeTa;
  const mySeksi = mockSeksiList[0];
  const belumSeimbang = mockSeksiList.filter((s) => s.alokasiStatus !== 'tuntas');
  const gatekeeperActive = belumSeimbang.length > 0;

  const [rows] = useState<KuitansiRow[]>(mockKuitansiPptk);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Kuitansi" subtitle={`${mySeksi.name} • TA ${ta?.taYear ?? 2026}`} mode="PRO" />

      {gatekeeperActive && <GatekeeperBanner seksiNames={belumSeimbang.map((s) => s.name)} />}

      <div className="surface-card mb-5 px-4 py-3 flex items-center justify-between">
        <div className="text-xs text-ink-secondary">
          <span className="text-ink-primary font-medium">{rows.length}</span> kuitansi • <span className="text-status-yellow">{rows.filter((r) => r.status === 'terkunci').length}</span> terkunci • <span className="text-status-green">{rows.filter((r) => r.spjStatus === 'dibukukan').length}</span> dibukukan
        </div>
        <button
          className={`btn-amber text-xs px-3 py-1.5 flex items-center gap-1.5 ${gatekeeperActive ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={gatekeeperActive}
          onClick={() => setShowForm((v) => !v)}
        >
          <Plus className="h-3.5 w-3.5" />
          Buat Kuitansi
        </button>
      </div>

      {showForm && !gatekeeperActive && (
        <div className="surface-card p-5 mb-5 animate-slide-up">
          <h3 className="text-sm font-semibold text-ink-primary mb-4">Kuitansi Baru</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-2xs uppercase tracking-wider text-ink-muted">Uraian</label>
              <input className="input-base w-full mt-1 text-sm" placeholder="Mis. Honor narasumber kegiatan" />
            </div>
            <div>
              <label className="text-2xs uppercase tracking-wider text-ink-muted">Subkegiatan</label>
              <select className="input-base w-full mt-1 text-sm">
                <option>2.16.03.2.01 — Penyelenggaraan Perencanaan & Evaluasi</option>
                <option>2.16.03.2.02 — Penyelenggaraan Rapat Koordinasi</option>
              </select>
            </div>
            <div>
              <label className="text-2xs uppercase tracking-wider text-ink-muted">Rekening Belanja</label>
              <select className="input-base w-full mt-1 text-sm">
                <option>5.1.02.02.6.2.01.01 — Honor Narasumber</option>
                <option>5.1.02.01.6.1.02.01 — Belanja Alat Tulis Kantor</option>
                <option>5.1.02.02.6.2.01.05 — Sewa Ruang Rapat</option>
              </select>
            </div>
            <div>
              <label className="text-2xs uppercase tracking-wider text-ink-muted">Bruto (Rp)</label>
              <input type="number" className="input-base w-full mt-1 text-sm font-mono tnum" placeholder="0" />
            </div>
            <div>
              <label className="text-2xs uppercase tracking-wider text-ink-muted">Tanggal Kuitansi</label>
              <input type="date" className="input-base w-full mt-1 text-sm" defaultValue="2026-10-30" />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 mt-4">
            <button className="btn-ghost text-xs px-3 py-1.5" onClick={() => setShowForm(false)}>Batal</button>
            <button className="btn-amber text-xs px-3 py-1.5" onClick={() => setShowForm(false)}>Simpan Kuitansi</button>
          </div>
        </div>
      )}

      <div className="surface-card">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-ink-primary">Daftar Kuitansi</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-hover">
                <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">No.</th>
                <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Uraian</th>
                <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2 hidden md:table-cell">Kode Rekening</th>
                <th className="text-right font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Bruto</th>
                <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2 hidden lg:table-cell">Tanggal</th>
                <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Status</th>
                <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">SPJ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors h-8">
                  <td className="px-4 py-1 font-mono text-xs text-ink-muted">{idx + 1}</td>
                  <td className="px-4 py-1 text-xs text-ink-primary">{r.uraian}</td>
                  <td className="px-4 py-1 font-mono text-xs text-ink-secondary hidden md:table-cell">{r.kodeRekening}</td>
                  <td className="px-4 py-1 text-right font-mono tnum text-xs text-ink-primary">{formatRupiah(r.bruto)}</td>
                  <td className="px-4 py-1 text-xs text-ink-secondary hidden lg:table-cell">{formatDateID(r.tanggal)}</td>
                  <td className="px-4 py-1"><StatusBadge status={r.status} type="kuitansi" /></td>
                  <td className="px-4 py-1"><StatusBadge status={r.spjStatus} type="spj" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 surface-card px-4 py-3 flex items-start gap-3">
        <Receipt className="h-5 w-5 text-ink-secondary shrink-0 mt-0.5" />
        <p className="text-xs text-ink-secondary leading-relaxed">
          <span className="text-ink-primary font-medium">Siklus kuitansi:</span> Aktif → Terkunci (setelah masuk SPJ) → tidak dapat diedit. Kuitansi berisi subkegiatan, rekening, bruto, tanggal. PPTK hanya membuat kuitansi untuk seksinya sendiri. (D02 §2-4, D03 §4)
        </p>
      </div>
    </div>
  );
}
