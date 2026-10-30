import { useState } from 'react';
import { PieChart, Lock, AlertTriangle, Check } from 'lucide-react';
import type { SessionUser } from '@/auth/types';
import { mockSeksiList, mockSubkegiatanBySeksi, formatRupiah, formatPct, type SeksiRow } from '@/data/mockData';
import { PageHeader, StatusBadge } from '@/components/ui/Primitives';

export function AlokasiPagu({ session }: { session: SessionUser }) {
  if (session.role !== 'bendahara') {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Alokasi Pagu per Seksi" subtitle="Akses ditolak" />
        <div className="surface-card p-10 flex flex-col items-center justify-center text-center min-h-[320px]">
          <Lock className="h-8 w-8 text-status-red mb-4" />
          <p className="text-sm text-ink-secondary max-w-md">Hanya Bendahara yang dapat mengalokasikan Pagu Induk ke subkegiatan per seksi. (Dokumen 03 §3)</p>
        </div>
      </div>
    );
  }

  const ta = session.activeTa;
  const paguInduk = 12_480_000_000;
  const [selectedSeksi, setSelectedSeksi] = useState<SeksiRow>(mockSeksiList[0]);

  // Mock editable subkegiatan alokasi (local state for demo)
  const [alokasi, setAlokasi] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    Object.values(mockSubkegiatanBySeksi).flat().forEach((s) => { init[s.id] = s.pagu; });
    return init;
  });

  const seksiSubs = mockSubkegiatanBySeksi[selectedSeksi.id] ?? [];
  const totalAlokasi = seksiSubs.reduce((sum, s) => sum + (alokasi[s.id] ?? 0), 0);
  const selisih = selectedSeksi.pagu - totalAlokasi;
  const seimbang = selisih === 0;

  function updateAlokasi(id: string, value: number) {
    setAlokasi((prev) => ({ ...prev, [id]: value }));
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Alokasi Pagu per Seksi" subtitle={`Bagi Pagu Induk ke subkegiatan • TA ${ta?.taYear ?? 2026}`} mode="PRO" />

      {/* Pagu Induk summary */}
      <div className="surface-card px-5 py-4 mb-5 flex items-center justify-between">
        <div>
          <div className="text-2xs uppercase tracking-wider text-ink-muted">Pagu Induk TA {ta?.taYear ?? 2026}</div>
          <div className="font-mono tnum text-xl font-bold text-amber mt-1">Rp {formatRupiah(paguInduk)}</div>
        </div>
        <div className="text-right">
          <div className="text-2xs uppercase tracking-wider text-ink-muted">Total Pagu Seksi</div>
          <div className="font-mono tnum text-sm text-ink-primary mt-1">Rp {formatRupiah(mockSeksiList.reduce((s, r) => s + r.pagu, 0))}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Seksi list (left) */}
        <div className="surface-card lg:col-span-1">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-ink-primary">Daftar Seksi</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-hover">
                  <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Seksi</th>
                  <th className="text-right font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Pagu</th>
                  <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {mockSeksiList.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => setSelectedSeksi(s)}
                    className={`border-b border-border last:border-0 hover:bg-surface-hover transition-colors h-8 cursor-pointer ${selectedSeksi.id === s.id ? 'bg-amber/5' : ''}`}
                  >
                    <td className="px-4 py-1 text-xs text-ink-primary">{s.name}</td>
                    <td className="px-4 py-1 text-right font-mono tnum text-xs text-ink-primary">{formatRupiah(s.pagu)}</td>
                    <td className="px-4 py-1"><StatusBadge status={s.alokasiStatus} type="seimbang" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alokasi editor (right) */}
        <div className="surface-card lg:col-span-2">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink-primary">Alokasi Subkegiatan — {selectedSeksi.name}</h2>
            <span className="text-2xs text-ink-muted font-mono">32px • PRO</span>
          </div>

          {/* Balance bar */}
          <div className={`px-4 py-3 border-b border-border flex items-center gap-3 ${seimbang ? 'bg-status-green/5' : 'bg-status-yellow/5'}`}>
            {seimbang ? (
              <Check className="h-5 w-5 text-status-green shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-status-yellow shrink-0" />
            )}
            <div className="flex-1">
              <div className="text-2xs uppercase tracking-wider text-ink-muted">Pagu Seksi vs Total Alokasi</div>
              <div className="font-mono tnum text-sm text-ink-primary mt-0.5">
                Rp {formatRupiah(selectedSeksi.pagu)} — Rp {formatRupiah(totalAlokasi)} = <span className={seimbang ? 'text-status-green' : 'text-status-yellow'}>Rp {formatRupiah(Math.abs(selisih))} {selisih > 0 ? '(kurang)' : selisih < 0 ? '(lebih)' : ''}</span>
              </div>
            </div>
            <StatusBadge status={seimbang ? 'seimbang' : 'belum_seimbang'} type="seimbang" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-hover">
                  <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Kode</th>
                  <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Nama Subkegiatan</th>
                  <th className="text-right font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Alokasi (Rp)</th>
                </tr>
              </thead>
              <tbody>
                {seksiSubs.map((sub) => (
                  <tr key={sub.id} className="border-b border-border last:border-0 h-8">
                    <td className="px-4 py-1 font-mono text-xs text-ink-secondary whitespace-nowrap">{sub.kode}</td>
                    <td className="px-4 py-1 text-xs text-ink-primary">{sub.nama}</td>
                    <td className="px-4 py-1 text-right">
                      <input
                        type="number"
                        value={alokasi[sub.id] ?? 0}
                        onChange={(e) => updateAlokasi(sub.id, Number(e.target.value) || 0)}
                        className="input-base font-mono tnum text-xs text-right w-40 py-0.5"
                      />
                    </td>
                  </tr>
                ))}
                {seksiSubs.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-xs text-ink-muted">Belum ada subkegiatan untuk seksi ini.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-border flex items-center justify-between">
            <p className="text-2xs text-ink-muted">Jumlah alokasi subkegiatan harus sama dengan Pagu Seksi. Pagu seksi dihitung otomatis dari penjumlahan subkegiatan. (D03 §3)</p>
            <button
              className={`btn-amber text-xs px-3 py-1.5 ${!seimbang ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!seimbang}
            >
              Simpan Alokasi
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 surface-card px-4 py-3 flex items-start gap-3">
        <PieChart className="h-5 w-5 text-ink-secondary shrink-0 mt-0.5" />
        <p className="text-xs text-ink-secondary leading-relaxed">
          <span className="text-ink-primary font-medium">Aturan alokasi:</span> Pagu Induk dibagi ke subkegiatan per seksi. Total alokasi per seksi harus sama dengan Pagu Seksi. Pagu seksi = jumlah subkegiatan. Seksi belum seimbang memicu Gatekeeper yang mengunci pembuatan kuitansi/SPJ secara global. (D01 §3, D03 §3)
        </p>
      </div>
    </div>
  );
}
