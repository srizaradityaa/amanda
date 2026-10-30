import {
  Activity,
  AlertTriangle,
  TrendingUp,
  Gauge,
  PieChart,
  ShieldCheck,
} from 'lucide-react';
import type { SessionUser } from '@/auth/types';
import {
  mockSeksiList,
  computeSisaSpd,
  computeSerapan,
  formatRupiah,
  formatPct,
  formatDateID,
} from '@/data/mockData';
import {
  PageHeader,
  StatCard,
  Ticker,
  ZoneDot,
  ZoneBadge,
  type Zona,
} from '@/components/ui/Primitives';

export function PaKpaDashboard({ session }: { session: SessionUser }) {
  const ta = session.activeTa;

  // Sort: MERAH first (Dokumen 01 §12 poin 3 — Kritis diangkat ke teratas)
  const sortedSeksi = [...mockSeksiList].sort((a, b) => {
    const order: Record<Zona, number> = { MERAH: 0, ORANYE: 1, KUNING: 2, HIJAU: 3 };
    return order[a.zona] - order[b.zona];
  });

  // Ticker summary counts (Early Warning Ticker — Dokumen 03 §6 poin 2)
  const zones = mockSeksiList.reduce(
    (acc, s) => {
      acc[s.zona]++;
      return acc;
    },
    { HIJAU: 0, KUNING: 0, MERAH: 0, ORANYE: 0 } as Record<Zona, number>,
  );

  const totalPagu = mockSeksiList.reduce((sum, s) => sum + s.pagu, 0);
  const totalRealisasi = mockSeksiList.reduce((sum, s) => sum + s.realisasiBku, 0);
  const totalKomitmen = mockSeksiList.reduce((sum, s) => sum + s.komitmenKwitansi, 0);
  const totalSisa = totalPagu - totalRealisasi - totalKomitmen;
  const serapanInstansi = totalPagu > 0 ? ((totalRealisasi + totalKomitmen) / totalPagu) * 100 : 0;

  // Time Elapsed is dynamic for Aktif Penuh; frozen 100% for Transisi/Arsip
  const timeElapsedPct = 83.2;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dasbor Eksekutif PA/KPA"
        subtitle={`Pemantauan lintas seksi TA ${ta?.taYear ?? 2026} • Mode baca saja • Advisory (tidak memblokir operasional)`}
        mode="PRO"
      />

      {/* Early Warning Ticker — Dokumen 03 §6 poin 2 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-4 w-4 text-amber" />
          <h2 className="text-sm font-semibold text-ink-primary">Early Warning Ticker</h2>
          <span className="text-2xs text-ink-muted">— rekap seksi per zona analitik</span>
        </div>
        <Ticker>
          <StatCard label="Zona Normal" value={zones.HIJAU} sublabel="seksi seimbang" accent="green" icon={ShieldCheck} />
          <StatCard label="Serapan Lambat" value={zones.KUNING} sublabel="under-absorption" accent="yellow" icon={AlertTriangle} />
          <StatCard label="Kritis" value={zones.MERAH} sublabel="critical under-absorption" accent="red" icon={AlertTriangle} />
          <StatCard label="Lonjakan Tidak Wajar" value={zones.ORANYE} sublabel="spike > 40% / 14 hari" accent="orange" icon={TrendingUp} />
          <StatCard label="Serapan Instansi" value={formatPct(serapanInstansi)} sublabel={`${formatRupiah(totalRealisasi)} / ${formatRupiah(totalPagu)}`} accent="amber" icon={Gauge} />
          <StatCard label="Time Elapsed" value={formatPct(timeElapsedPct)} sublabel="dinamis WITA" accent="default" icon={PieChart} />
        </Ticker>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Pagu Induk TA" value={`Rp ${formatRupiah(totalPagu)}`} accent="default" />
        <StatCard label="Realisasi BKU" value={`Rp ${formatRupiah(totalRealisasi)}`} accent="green" />
        <StatCard label="Komitmen Kuitansi Aktif" value={`Rp ${formatRupiah(totalKomitmen)}`} accent="yellow" />
        <StatCard label="Sisa SPD Bebas" value={`Rp ${formatRupiah(totalSisa)}`} accent="teal" />
      </div>

      {/* Tabel drill-down per seksi (Pro Mode — 32px rows, color dots, Kritis on top) */}
      <div className="surface-card">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-primary">Drill-down per Seksi</h2>
          <div className="flex items-center gap-3">
            <span className="text-2xs text-ink-muted">Kedalaman: Seksi → Subkegiatan</span>
            <span className="text-2xs text-ink-muted font-mono">32px • PRO</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-hover">
                <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Zona</th>
                <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Seksi</th>
                <th className="text-right font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Pagu</th>
                <th className="text-right font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2 hidden md:table-cell">Realisasi BKU</th>
                <th className="text-right font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2 hidden lg:table-cell">Komitmen</th>
                <th className="text-right font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Sisa SPD</th>
                <th className="text-right font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2 hidden md:table-cell">Burn-Rate</th>
                <th className="text-right font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2 hidden lg:table-cell">Time Elapsed</th>
                <th className="text-right font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2 hidden xl:table-cell">Spike 14d</th>
                <th className="text-right font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Serapan</th>
              </tr>
            </thead>
            <tbody>
              {sortedSeksi.map((s) => {
                const sisa = computeSisaSpd(s);
                const serapan = computeSerapan(s);
                return (
                  <tr
                    key={s.id}
                    className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors h-8"
                  >
                    <td className="px-4 py-1">
                      <ZoneBadge zona={s.zona} />
                    </td>
                    <td className="px-4 py-1 text-ink-primary text-xs">{s.name}</td>
                    <td className="px-4 py-1 text-right font-mono tnum text-xs text-ink-primary">{formatRupiah(s.pagu)}</td>
                    <td className="px-4 py-1 text-right font-mono tnum text-xs text-status-green hidden md:table-cell">{formatRupiah(s.realisasiBku)}</td>
                    <td className="px-4 py-1 text-right font-mono tnum text-xs text-status-yellow hidden lg:table-cell">{formatRupiah(s.komitmenKwitansi)}</td>
                    <td className="px-4 py-1 text-right font-mono tnum text-xs text-teal">{formatRupiah(sisa)}</td>
                    <td className="px-4 py-1 text-right font-mono tnum text-xs text-ink-primary hidden md:table-cell">{formatPct(s.burnRatePct)}</td>
                    <td className="px-4 py-1 text-right font-mono tnum text-xs text-ink-secondary hidden lg:table-cell">{formatPct(s.timeElapsedPct)}</td>
                    <td className="px-4 py-1 text-right font-mono tnum text-xs text-ink-secondary hidden xl:table-cell">
                      {s.spike14dPct > 40 ? (
                        <span className="text-status-orange">{formatPct(s.spike14dPct)}</span>
                      ) : (
                        formatPct(s.spike14dPct)
                      )}
                    </td>
                    <td className="px-4 py-1 text-right font-mono tnum text-xs text-ink-primary">{formatPct(serapan)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border flex items-center justify-between text-2xs text-ink-muted">
          <span>Drill-down maksimal sampai tingkat subkegiatan — tingkat rekening belanja tidak ditampilkan untuk PA/KPA.</span>
          <span className="font-mono">Pembaruan: {formatDateID('2026-10-30')} 00:00 WITA</span>
        </div>
      </div>

      {/* Advisory note */}
      <div className="mt-6 surface-card px-4 py-3 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-teal shrink-0 mt-0.5" />
        <p className="text-xs text-ink-secondary leading-relaxed">
          <span className="text-ink-primary font-medium">Sifat Advisory:</span> Badge dan zona analitik bersifat penelaahan
          eksekutif dan tidak memblokir pembuatan kuitansi, pengajuan SPJ, verifikasi, maupun pencatatan BKU.
          Pengesahan transaksi tetap melalui tanda tangan fisik pada lembar kuitansi. (Dokumen 01 §12 poin 1, Dokumen 03 §6)
        </p>
      </div>
    </div>
  );
}
