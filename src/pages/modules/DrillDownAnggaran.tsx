import { useState } from 'react';
import { ChevronRight, PieChart, ArrowLeft, Lock, Home } from 'lucide-react';
import type { SessionUser } from '@/auth/types';
import {
  mockSeksiList,
  mockSubkegiatanBySeksi,
  mockRekeningBySubkegiatan,
  computeSisaSpd,
  computeSerapan,
  computeSubSisaSpd,
  computeSubSerapan,
  formatRupiah,
  formatPct,
  type SeksiRow,
  type SubkegiatanRow,
  type RekeningRow,
} from '@/data/mockData';
import { PageHeader, StatusBadge } from '@/components/ui/Primitives';

type Level = 'seksi' | 'subkegiatan' | 'rekening';

interface DrillState {
  level: Level;
  seksiId?: string;
  subkegiatanId?: string;
}

export function DrillDownAnggaran({ session }: { session: SessionUser }) {
  const role = session.role;
  const ta = session.activeTa;

  // Admin has no drill-down access (Dokumen 01 §7 poin 5f)
  if (role === 'admin') {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Drill-down Anggaran" subtitle="Akses ditolak" />
        <div className="surface-card p-10 flex flex-col items-center justify-center text-center min-h-[320px]">
          <Lock className="h-8 w-8 text-status-red mb-4" />
          <h2 className="text-base font-semibold text-ink-primary mb-1.5">Tidak memiliki akses drill-down anggaran</h2>
          <p className="text-sm text-ink-secondary max-w-md">
            Admin tidak memiliki tampilan drill-down anggaran maupun dapat memanggil datanya melalui URL atau pemanggilan langsung. (Dokumen 01 §7 poin 5f, Dokumen 05 skenario 41)
          </p>
        </div>
      </div>
    );
  }

  const [state, setState] = useState<DrillState>({ level: 'seksi' });

  // PPTK only sees own seksi (Dokumen 01 §7 poin 5d)
  const visibleSeksi: SeksiRow[] =
    role === 'pptk'
      ? mockSeksiList.filter((s) => s.id === 'seksi-pem')
      : mockSeksiList.filter((s) => s.alokasiStatus === 'tuntas' || (s.realisasiBku > 0 || s.komitmenKwitansi > 0));

  // PA/KPA depth limit: stops at subkegiatan (Dokumen 01 §7 poin 5c, Dokumen 05 skenario 40)
  const maxLevel: Level = role === 'pa_kpa' ? 'subkegiatan' : 'rekening';
  const canSeeRekening = maxLevel === 'rekening';

  function navigateSeksi(seksiId: string) {
    setState({ level: 'subkegiatan', seksiId });
  }
  function navigateSubkegiatan(subkegiatanId: string) {
    if (canSeeRekening) {
      setState((prev) => ({ ...prev, level: 'rekening', subkegiatanId }));
    }
  }
  function goBack(target: Level) {
    setState((prev) => {
      if (target === 'seksi') return { level: 'seksi' };
      if (target === 'subkegiatan') return { level: 'subkegiatan', seksiId: prev.seksiId };
      return prev;
    });
  }

  // Breadcrumb
  const currentSeksi = state.seksiId ? visibleSeksi.find((s) => s.id === state.seksiId) : undefined;
  const currentSub = state.subkegiatanId && state.seksiId
    ? (mockSubkegiatanBySeksi[state.seksiId] ?? []).find((s) => s.id === state.subkegiatanId)
    : undefined;

  const breadcrumb = (
    <div className="flex items-center gap-1.5 text-xs mb-4 flex-wrap">
      <button
        onClick={() => goBack('seksi')}
        className={`flex items-center gap-1 transition-colors ${state.level === 'seksi' ? 'text-ink-primary font-medium' : 'text-ink-secondary hover:text-ink-primary'}`}
      >
        <Home className="h-3.5 w-3.5" />
        Seksi
      </button>
      {state.level !== 'seksi' && currentSeksi && (
        <>
          <ChevronRight className="h-3.5 w-3.5 text-ink-muted" />
          <button
            onClick={() => goBack('subkegiatan')}
            className={`transition-colors ${state.level === 'subkegiatan' ? 'text-ink-primary font-medium' : 'text-ink-secondary hover:text-ink-primary'}`}
          >
            {currentSeksi.name}
          </button>
        </>
      )}
      {state.level === 'rekening' && currentSub && (
        <>
          <ChevronRight className="h-3.5 w-3.5 text-ink-muted" />
          <span className="text-ink-primary font-medium">{currentSub.nama}</span>
        </>
      )}
    </div>
  );

  // Column header helper
  const colHeaders = (showKode: boolean) => (
    <tr className="border-b border-border bg-surface-hover">
      {showKode && <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Kode</th>}
      <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Nama</th>
      <th className="text-right font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Pagu</th>
      <th className="text-right font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2 hidden md:table-cell">Realisasi BKU</th>
      <th className="text-right font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2 hidden lg:table-cell">Komitmen</th>
      <th className="text-right font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Sisa SPD</th>
      <th className="text-right font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Serapan</th>
      <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Status</th>
    </tr>
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Drill-down Anggaran"
        subtitle={
          role === 'pptk'
            ? `Seksinya sendiri • TA ${ta?.taYear ?? 2026} • sampai rekening belanja`
            : role === 'pa_kpa'
            ? `Seluruh seksi • TA ${ta?.taYear ?? 2026} • sampai subkegiatan (rekening tidak ditampilkan)`
            : `Seluruh seksi • TA ${ta?.taYear ?? 2026} • sampai rekening belanja`
        }
        mode="PRO"
      />

      {/* Pagu Induk card — only for roles that can see it (Bendahara, Verifikator, PA/KPA; NOT PPTK) */}
      {role !== 'pptk' && (
        <div className="surface-card px-5 py-4 mb-5 flex items-center justify-between">
          <div>
            <div className="text-2xs uppercase tracking-wider text-ink-muted">Pagu Induk TA {ta?.taYear ?? 2026}</div>
            <div className="font-mono tnum text-xl font-bold text-amber mt-1">Rp {formatRupiah(12_480_000_000)}</div>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-2xs uppercase tracking-wider text-ink-muted">Total Seksi (jumlah)</div>
            <div className="font-mono tnum text-sm text-ink-primary mt-1">Rp {formatRupiah(visibleSeksi.reduce((s, r) => s + r.pagu, 0))}</div>
          </div>
        </div>
      )}

      {breadcrumb}

      {/* Level: Seksi */}
      {state.level === 'seksi' && (
        <div className="surface-card">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink-primary">Daftar Seksi</h2>
            <span className="text-2xs text-ink-muted font-mono">32px • PRO</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>{colHeaders(false)}</thead>
              <tbody>
                {visibleSeksi.map((s) => {
                  const sisa = computeSisaSpd(s);
                  const serapan = computeSerapan(s);
                  return (
                    <tr
                      key={s.id}
                      onClick={() => navigateSeksi(s.id)}
                      className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors h-8 cursor-pointer"
                    >
                      <td className="px-4 py-1 text-xs text-ink-primary flex items-center gap-1.5">
                        {s.name}
                        <ChevronRight className="h-3.5 w-3.5 text-ink-muted" />
                      </td>
                      <td className="px-4 py-1 text-right font-mono tnum text-xs text-ink-primary">{formatRupiah(s.pagu)}</td>
                      <td className="px-4 py-1 text-right font-mono tnum text-xs text-status-green hidden md:table-cell">{formatRupiah(s.realisasiBku)}</td>
                      <td className="px-4 py-1 text-right font-mono tnum text-xs text-status-yellow hidden lg:table-cell">{formatRupiah(s.komitmenKwitansi)}</td>
                      <td className="px-4 py-1 text-right font-mono tnum text-xs text-teal">{formatRupiah(sisa)}</td>
                      <td className="px-4 py-1 text-right font-mono tnum text-xs text-ink-primary">{formatPct(serapan)}</td>
                      <td className="px-4 py-1"><StatusBadge status={s.status} type="seimbang" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {role === 'pptk' && (
            <div className="px-4 py-3 border-t border-border text-2xs text-ink-muted">
              Hanya seksinya sendiri. Pagu Induk tidak tampil. Permintaan data seksi lain melalui URL ditolak di server. (Dokumen 01 §7 poin 5d)
            </div>
          )}
        </div>
      )}

      {/* Level: Subkegiatan */}
      {state.level === 'subkegiatan' && state.seksiId && currentSeksi && (
        <div className="surface-card">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink-primary">
              Subkegiatan — {currentSeksi.name}
            </h2>
            <div className="flex items-center gap-2">
              {!canSeeRekening && (
                <span className="text-2xs text-status-yellow border border-status-yellow/40 px-2 py-0.5">
                  Kedalaman maks: Subkegiatan
                </span>
              )}
              <span className="text-2xs text-ink-muted font-mono">32px • PRO</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>{colHeaders(true)}</thead>
              <tbody>
                {(mockSubkegiatanBySeksi[state.seksiId] ?? []).map((sub: SubkegiatanRow) => {
                  const sisa = computeSubSisaSpd(sub);
                  const serapan = computeSubSerapan(sub);
                  const clickable = canSeeRekening;
                  return (
                    <tr
                      key={sub.id}
                      onClick={() => clickable && navigateSubkegiatan(sub.id)}
                      className={`border-b border-border last:border-0 hover:bg-surface-hover transition-colors h-8 ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      <td className="px-4 py-1 font-mono text-xs text-ink-secondary whitespace-nowrap">{sub.kode}</td>
                      <td className="px-4 py-1 text-xs text-ink-primary">
                        <span className="flex items-center gap-1.5">
                          {sub.nama}
                          {clickable && <ChevronRight className="h-3.5 w-3.5 text-ink-muted" />}
                        </span>
                      </td>
                      <td className="px-4 py-1 text-right font-mono tnum text-xs text-ink-primary">{formatRupiah(sub.pagu)}</td>
                      <td className="px-4 py-1 text-right font-mono tnum text-xs text-status-green hidden md:table-cell">{formatRupiah(sub.realisasiBku)}</td>
                      <td className="px-4 py-1 text-right font-mono tnum text-xs text-status-yellow hidden lg:table-cell">{formatRupiah(sub.komitmenKwitansi)}</td>
                      <td className="px-4 py-1 text-right font-mono tnum text-xs text-teal">{formatRupiah(sisa)}</td>
                      <td className="px-4 py-1 text-right font-mono tnum text-xs text-ink-primary">{formatPct(serapan)}</td>
                      <td className="px-4 py-1"><StatusBadge status={sub.status} type="seimbang" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!canSeeRekening && (
            <div className="px-4 py-3 border-t border-border text-2xs text-ink-muted flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              Tingkat rekening belanja tidak ditampilkan untuk PA/KPA. Permintaan langsung ke data rekening ditolak di server. (Dokumen 01 §7 poin 5c, Dokumen 05 skenario 40)
            </div>
          )}
        </div>
      )}

      {/* Level: Rekening */}
      {state.level === 'rekening' && state.subkegiatanId && currentSub && currentSeksi && (
        <div className="surface-card">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink-primary">
              Rekening Belanja — {currentSub.nama}
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={() => goBack('subkegiatan')} className="btn-ghost text-xs flex items-center gap-1">
                <ArrowLeft className="h-3.5 w-3.5" />
                Kembali ke Subkegiatan
              </button>
              <span className="text-2xs text-ink-muted font-mono">32px • PRO</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>{colHeaders(true)}</thead>
              <tbody>
                {(mockRekeningBySubkegiatan[state.subkegiatanId] ?? []).map((rek: RekeningRow) => {
                  const sisa = computeSubSisaSpd(rek);
                  const serapan = computeSubSerapan(rek);
                  return (
                    <tr key={rek.id} className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors h-8">
                      <td className="px-4 py-1 font-mono text-xs text-ink-secondary whitespace-nowrap">{rek.kode}</td>
                      <td className="px-4 py-1 text-xs text-ink-primary">{rek.nama}</td>
                      <td className="px-4 py-1 text-right font-mono tnum text-xs text-ink-primary">{formatRupiah(rek.pagu)}</td>
                      <td className="px-4 py-1 text-right font-mono tnum text-xs text-status-green hidden md:table-cell">{formatRupiah(rek.realisasiBku)}</td>
                      <td className="px-4 py-1 text-right font-mono tnum text-xs text-status-yellow hidden lg:table-cell">{formatRupiah(rek.komitmenKwitansi)}</td>
                      <td className="px-4 py-1 text-right font-mono tnum text-xs text-teal">{formatRupiah(sisa)}</td>
                      <td className="px-4 py-1 text-right font-mono tnum text-xs text-ink-primary">{formatPct(serapan)}</td>
                      <td className="px-4 py-1"><StatusBadge status={rek.status} type="seimbang" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-border text-2xs text-ink-muted">
            Satu rekening belanja boleh dipakai di subkegiatan mana pun dalam TA yang sama; setiap pasangan tampil sebagai baris terpisah. (Dokumen 04 §2.2, Dokumen 01 §7 poin 9)
          </div>
        </div>
      )}

      {/* Consistency note */}
      <div className="mt-6 surface-card px-4 py-3 flex items-start gap-3">
        <PieChart className="h-5 w-5 text-ink-secondary shrink-0 mt-0.5" />
        <p className="text-xs text-ink-secondary leading-relaxed">
          <span className="text-ink-primary font-medium">Konsistensi berjenjang:</span> Nilai setiap tingkat
          adalah hasil penjumlahan tingkat di bawahnya. Pagu seksi = jumlah subkegiatan; pagu subkegiatan = jumlah rekening.
          Kode subkegiatan & rekening tampil sebagai teks (bukan angka). Nominal memakai Rupiah dengan pemisah ribuan titik.
          (Dokumen 01 §7 poin 2–6, Dokumen 05 skenario 37–43)
        </p>
      </div>
    </div>
  );
}
