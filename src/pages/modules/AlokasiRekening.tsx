import { useState } from 'react';
import { FileText, Lock, AlertTriangle, Check } from 'lucide-react';
import type { SessionUser } from '@/auth/types';
import { mockSeksiList, mockSubkegiatanBySeksi, mockRekeningBySubkegiatan, formatRupiah, type SubkegiatanRow } from '@/data/mockData';
import { PageHeader, StatusBadge } from '@/components/ui/Primitives';

export function AlokasiRekening({ session }: { session: SessionUser }) {
  const ta = session.activeTa;
  // PPTK only sees own seksi
  const mySeksi = mockSeksiList[0];
  const subs = mockSubkegiatanBySeksi[mySeksi.id] ?? [];
  const [selectedSub, setSelectedSub] = useState<SubkegiatanRow | null>(subs[0] ?? null);

  const [alokasi, setAlokasi] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    Object.values(mockRekeningBySubkegiatan).flat().forEach((r) => { init[r.id] = r.pagu; });
    return init;
  });

  if (session.role !== 'pptk') {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Alokasi Rekening Belanja" subtitle="Akses ditolak" />
        <div className="surface-card p-10 flex flex-col items-center justify-center text-center min-h-[320px]">
          <Lock className="h-8 w-8 text-status-red mb-4" />
          <p className="text-sm text-ink-secondary max-w-md">Hanya PPTK yang dapat mengalokasikan pagu subkegiatan ke rekening belanja. (D03 §4)</p>
        </div>
      </div>
    );
  }

  const rekenings = selectedSub ? (mockRekeningBySubkegiatan[selectedSub.id] ?? []) : [];
  const totalAlokasi = rekenings.reduce((sum, r) => sum + (alokasi[r.id] ?? 0), 0);
  const selisih = (selectedSub?.pagu ?? 0) - totalAlokasi;
  const seimbang = selisih === 0;

  function updateAlokasi(id: string, value: number) {
    setAlokasi((prev) => ({ ...prev, [id]: value }));
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Alokasi Rekening Belanja" subtitle={`${mySeksi.name} • TA ${ta?.taYear ?? 2026} • bagi pagu subkegiatan ke rekening`} mode="PRO" />

      <div className="surface-card px-5 py-4 mb-5 flex items-center justify-between">
        <div>
          <div className="text-2xs uppercase tracking-wider text-ink-muted">Seksi</div>
          <div className="text-sm font-semibold text-ink-primary mt-1">{mySeksi.name}</div>
        </div>
        <div className="text-right">
          <div className="text-2xs uppercase tracking-wider text-ink-muted">Pagu Seksi</div>
          <div className="font-mono tnum text-sm text-amber mt-1">Rp {formatRupiah(mySeksi.pagu)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Subkegiatan list */}
        <div className="surface-card lg:col-span-1">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-ink-primary">Subkegiatan</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-hover">
                <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Kode</th>
                <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Nama</th>
                <th className="text-right font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Pagu</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((sub) => (
                <tr
                  key={sub.id}
                  onClick={() => setSelectedSub(sub)}
                  className={`border-b border-border last:border-0 hover:bg-surface-hover transition-colors h-8 cursor-pointer ${selectedSub?.id === sub.id ? 'bg-amber/5' : ''}`}
                >
                  <td className="px-4 py-1 font-mono text-xs text-ink-secondary whitespace-nowrap">{sub.kode}</td>
                  <td className="px-4 py-1 text-xs text-ink-primary">{sub.nama}</td>
                  <td className="px-4 py-1 text-right font-mono tnum text-xs text-ink-primary">{formatRupiah(sub.pagu)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Rekening editor */}
        <div className="surface-card lg:col-span-2">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink-primary">Rekening Belanja {selectedSub ? `— ${selectedSub.nama}` : ''}</h2>
          </div>

          {selectedSub && (
            <div className={`px-4 py-3 border-b border-border flex items-center gap-3 ${seimbang ? 'bg-status-green/5' : 'bg-status-yellow/5'}`}>
              {seimbang ? <Check className="h-5 w-5 text-status-green shrink-0" /> : <AlertTriangle className="h-5 w-5 text-status-yellow shrink-0" />}
              <div className="flex-1">
                <div className="text-2xs uppercase tracking-wider text-ink-muted">Pagu Subkegiatan vs Total Rekening</div>
                <div className="font-mono tnum text-sm text-ink-primary mt-0.5">
                  Rp {formatRupiah(selectedSub.pagu)} — Rp {formatRupiah(totalAlokasi)} = <span className={seimbang ? 'text-status-green' : 'text-status-yellow'}>Rp {formatRupiah(Math.abs(selisih))} {selisih > 0 ? '(kurang)' : selisih < 0 ? '(lebih)' : ''}</span>
                </div>
              </div>
              <StatusBadge status={seimbang ? 'seimbang' : 'belum_seimbang'} type="seimbang" />
            </div>
          )}

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-hover">
                <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Kode Rekening</th>
                <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Nama</th>
                <th className="text-right font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Alokasi (Rp)</th>
              </tr>
            </thead>
            <tbody>
              {rekenings.map((rek) => (
                <tr key={rek.id} className="border-b border-border last:border-0 h-8">
                  <td className="px-4 py-1 font-mono text-xs text-ink-secondary whitespace-nowrap">{rek.kode}</td>
                  <td className="px-4 py-1 text-xs text-ink-primary">{rek.nama}</td>
                  <td className="px-4 py-1 text-right">
                    <input
                      type="number"
                      value={alokasi[rek.id] ?? 0}
                      onChange={(e) => updateAlokasi(rek.id, Number(e.target.value) || 0)}
                      className="input-base font-mono tnum text-xs text-right w-40 py-0.5"
                    />
                  </td>
                </tr>
              ))}
              {rekenings.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-xs text-ink-muted">Belum ada rekening untuk subkegiatan ini.</td></tr>
              )}
            </tbody>
          </table>

          <div className="px-4 py-3 border-t border-border flex items-center justify-between">
            <p className="text-2xs text-ink-muted">Total alokasi rekening harus sama dengan pagu subkegiatan. (D01 §5, D03 §4)</p>
            <button className={`btn-amber text-xs px-3 py-1.5 ${!seimbang ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={!seimbang}>Simpan</button>
          </div>
        </div>
      </div>

      <div className="mt-6 surface-card px-4 py-3 flex items-start gap-3">
        <FileText className="h-5 w-5 text-ink-secondary shrink-0 mt-0.5" />
        <p className="text-xs text-ink-secondary leading-relaxed">
          <span className="text-ink-primary font-medium">Aturan:</span> PPTK mengalokasikan pagu subkegiatan ke rekening belanja. Pasangan subkegiatan–rekening unik per TA. Seksi belum seimbang memicu Gatekeeper global. (D01 §5, D03 §4)
        </p>
      </div>
    </div>
  );
}
