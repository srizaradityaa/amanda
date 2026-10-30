import {
  Banknote,
  CheckCircle2,
  Clock,
  Wallet,
  ArrowLeftRight,
} from 'lucide-react';
import type { SessionUser } from '@/auth/types';
import {
  mockSeksiList,
  mockCountdown,
  computeSisaSpd,
  computeSerapan,
  formatRupiah,
  formatPct,
  type SeksiRow,
} from '@/data/mockData';
import {
  PageHeader,
  StatCard,
  Ticker,
  StatusBadge,
  CountdownWidget,
  GatekeeperBanner,
} from '@/components/ui/Primitives';

const alokasiLabel: Record<SeksiRow['alokasiStatus'], string> = {
  tuntas: 'Tuntas (100% Seimbang)',
  draft_belum_seimbang: 'Draft Belum Seimbang',
  belum_input: 'Belum Input',
};

export function BendaharaDashboard({ session }: { session: SessionUser }) {
  const ta = session.activeTa;
  const belumSeimbang = mockSeksiList.filter((s) => s.alokasiStatus !== 'tuntas');
  const semuaSeimbang = belumSeimbang.length === 0;

  const totalPagu = mockSeksiList.reduce((sum, s) => sum + s.pagu, 0);
  const totalRealisasi = mockSeksiList.reduce((sum, s) => sum + s.realisasiBku, 0);
  const totalKomitmen = mockSeksiList.reduce((sum, s) => sum + s.komitmenKwitansi, 0);
  const totalSisa = totalPagu - totalRealisasi - totalKomitmen;
  const serapanInstansi = totalPagu > 0 ? ((totalRealisasi + totalKomitmen) / totalPagu) * 100 : 0;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dasbor Bendahara Pengeluaran"
        subtitle={`Alokasi pagu, SPD, efisiensi, pergeseran & BKU • TA ${ta?.taYear ?? 2026}`}
        mode="PRO"
      />

      {/* Countdown + SPD status */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <CountdownWidget deadline={mockCountdown.deadline} />
        <StatCard label="Status SPD" value={semuaSeimbang ? 'Sah & Terbit' : 'Belum Disahkan'} sublabel={semuaSeimbang ? '100% pagu disahkan' : 'tunggu semua seksi seimbang'} accent={semuaSeimbang ? 'green' : 'yellow'} icon={Banknote} />
        <StatCard label="Seksi Tuntas" value={`${mockCountdown.selesai}/${mockCountdown.total}`} sublabel="alokasi seimbang" accent="green" icon={CheckCircle2} />
      </div>

      {/* Gatekeeper banner */}
      <GatekeeperBanner seksiNames={belumSeimbang.map((s) => s.name)} />

      {/* Ticker — instansi overview */}
      <div className="mb-6">
        <Ticker>
          <StatCard label="Pagu Induk" value={`Rp ${formatRupiah(totalPagu)}`} accent="default" icon={Wallet} />
          <StatCard label="Realisasi BKU" value={`Rp ${formatRupiah(totalRealisasi)}`} accent="green" />
          <StatCard label="Komitmen Kuitansi" value={`Rp ${formatRupiah(totalKomitmen)}`} accent="yellow" />
          <StatCard label="Sisa SPD Bebas" value={`Rp ${formatRupiah(totalSisa)}`} accent="teal" />
          <StatCard label="Serapan Instansi" value={formatPct(serapanInstansi)} accent="amber" />
          <StatCard label="Efisiensi Aktif" value="Rp 0" sublabel="belum ada pemotongan" accent="default" icon={ArrowLeftRight} />
        </Ticker>
      </div>

      {/* Tabel pemantau kesiapan seksi (Dokumen 01 §3.1 poin 3) */}
      <div className="surface-card">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-primary">Tabel Pemantau Kesiapan Seksi</h2>
          <span className="text-2xs text-ink-muted font-mono">32px • PRO</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-hover">
                <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Seksi</th>
                <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">PPTK</th>
                <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2 hidden md:table-cell">Status Alokasi</th>
                <th className="text-right font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Pagu</th>
                <th className="text-right font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2 hidden lg:table-cell">Realisasi BKU</th>
                <th className="text-right font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2 hidden lg:table-cell">Komitmen</th>
                <th className="text-right font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Sisa SPD</th>
                <th className="text-right font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Serapan</th>
              </tr>
            </thead>
            <tbody>
              {mockSeksiList.map((s) => {
                const sisa = computeSisaSpd(s);
                const serapan = computeSerapan(s);
                return (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors h-8">
                    <td className="px-4 py-1 text-xs text-ink-primary">{s.name}</td>
                    <td className="px-4 py-1 text-xs text-ink-secondary hidden md:table-cell">{s.pptkName}</td>
                    <td className="px-4 py-1 hidden md:table-cell">
                      <StatusBadge status={s.alokasiStatus === 'tuntas' ? 'tuntas' : s.alokasiStatus} type="seimbang" />
                    </td>
                    <td className="px-4 py-1 text-right font-mono tnum text-xs text-ink-primary">{formatRupiah(s.pagu)}</td>
                    <td className="px-4 py-1 text-right font-mono tnum text-xs text-status-green hidden lg:table-cell">{formatRupiah(s.realisasiBku)}</td>
                    <td className="px-4 py-1 text-right font-mono tnum text-xs text-status-yellow hidden lg:table-cell">{formatRupiah(s.komitmenKwitansi)}</td>
                    <td className="px-4 py-1 text-right font-mono tnum text-xs text-teal">{formatRupiah(sisa)}</td>
                    <td className="px-4 py-1 text-right font-mono tnum text-xs text-ink-primary">{formatPct(serapan)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border flex items-center gap-2 text-2xs text-ink-muted">
          <Clock className="h-3.5 w-3.5" />
          <span>Bendahara dapat membuka kembali jendela input alokasi bila waktu sempat kadaluarsa. Tombol "Sahkan" aktif setelah seluruh seksi Seimbang.</span>
        </div>
      </div>

      {/* Action hints */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="surface-card px-4 py-3 flex items-center gap-3">
          <Wallet className="h-5 w-5 text-amber shrink-0" />
          <div>
            <div className="text-xs font-medium text-ink-primary">Alokasi Pagu</div>
            <div className="text-2xs text-ink-muted">Bagi pagu induk ke subkegiatan sesuai DPA</div>
          </div>
        </div>
        <div className="surface-card px-4 py-3 flex items-center gap-3">
          <Banknote className="h-5 w-5 text-teal shrink-0" />
          <div>
            <div className="text-xs font-medium text-ink-primary">SPD & Efisiensi</div>
            <div className="text-2xs text-ink-muted">Terbit sebesar pagu disahkan; efisiensi maks sisa SPD bebas</div>
          </div>
        </div>
        <div className="surface-card px-4 py-3 flex items-center gap-3">
          <ArrowLeftRight className="h-5 w-5 text-ink-secondary shrink-0" />
          <div>
            <div className="text-xs font-medium text-ink-primary">Pergeseran Anggaran</div>
            <div className="text-2xs text-ink-muted">Satu pintu Bendahara; sumber dibatasi sisa SPD bebas</div>
          </div>
        </div>
      </div>
    </div>
  );
}
