import { Receipt, ClipboardCheck, Wallet, FileText, Lock, PlusCircle } from 'lucide-react';
import type { SessionUser } from '@/auth/types';
import {
  mockSeksiList,
  mockKuitansiPptk,
  mockCountdown,
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
  StatusBadge,
  GatekeeperBanner,
} from '@/components/ui/Primitives';

export function PptkDashboard({ session }: { session: SessionUser }) {
  const ta = session.activeTa;
  // PPTK only sees their own seksi
  const mySeksi = mockSeksiList[0]; // mock: seksi-pem
  const belumSeimbang = mockSeksiList.filter((s) => s.alokasiStatus !== 'tuntas');
  const gatekeeperTertutup = belumSeimbang.length > 0;
  const sisa = computeSisaSpd(mySeksi);
  const serapan = computeSerapan(mySeksi);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dasbor Seksi / PPTK"
        subtitle={`${mySeksi.name} • TA ${ta?.taYear ?? 2026} • dibatasi hanya untuk seksinya sendiri`}
        mode="PRO"
      />

      {/* Gatekeeper banner — global lock affects PPTK */}
      {gatekeeperTertutup && (
        <GatekeeperBanner seksiNames={belumSeimbang.map((s) => s.name)} />
      )}

      {/* Ticker — seksi own data only (Dokumen 01 §7 poin 5d) */}
      <div className="mb-6">
        <Ticker>
          <StatCard label="Pagu Seksi" value={`Rp ${formatRupiah(mySeksi.pagu)}`} accent="default" icon={Wallet} />
          <StatCard label="Realisasi BKU" value={`Rp ${formatRupiah(mySeksi.realisasiBku)}`} accent="green" icon={Receipt} />
          <StatCard label="Komitmen Kuitansi" value={`Rp ${formatRupiah(mySeksi.komitmenKwitansi)}`} accent="yellow" icon={Lock} />
          <StatCard label="Sisa SPD Bebas" value={`Rp ${formatRupiah(sisa)}`} accent="teal" />
          <StatCard label="Serapan" value={formatPct(serapan)} accent="amber" />
        </Ticker>
      </div>

      {/* Aksi utama — gatekeeper controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <button
          disabled={gatekeeperTertutup}
          className="surface-card px-4 py-4 flex items-center gap-3 text-left transition-colors hover:border-border-strong disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <div className="h-10 w-10 bg-bg border border-border-strong flex items-center justify-center shrink-0">
            <Receipt className="h-5 w-5 text-amber" strokeWidth={1.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-ink-primary">+ Buat Kuitansi</span>
              {gatekeeperTertutup && <Lock className="h-3.5 w-3.5 text-status-red" />}
            </div>
            <div className="text-2xs text-ink-muted mt-0.5">
              {gatekeeperTertutup ? 'Dikunci global — ada seksi belum seimbang' : 'Pilih subkegiatan, rekening, isi nominal bruto'}
            </div>
          </div>
        </button>

        <button
          disabled={gatekeeperTertutup}
          className="surface-card px-4 py-4 flex items-center gap-3 text-left transition-colors hover:border-border-strong disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <div className="h-10 w-10 bg-bg border border-border-strong flex items-center justify-center shrink-0">
            <ClipboardCheck className="h-5 w-5 text-teal" strokeWidth={1.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-ink-primary">+ Buat SPJ</span>
              {gatekeeperTertutup && <Lock className="h-3.5 w-3.5 text-status-red" />}
            </div>
            <div className="text-2xs text-ink-muted mt-0.5">
              {gatekeeperTertutup ? 'Dikunci global — gatekeeper tertutup' : 'Pilih jenis belanja, isi Form Dinamis'}
            </div>
          </div>
        </button>
      </div>

      {/* Daftar kuitansi seksi (Dokumen 02 §2) */}
      <div className="surface-card">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-primary">Kuitansi Seksi</h2>
          <span className="text-2xs text-ink-muted font-mono">48px • STANDAR</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-hover">
                <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2.5">Uraian</th>
                <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2.5 hidden md:table-cell">Subkegiatan</th>
                <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2.5 hidden lg:table-cell">Kode Rekening</th>
                <th className="text-right font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2.5">Bruto</th>
                <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2.5 hidden md:table-cell">Tanggal</th>
                <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {mockKuitansiPptk.map((k) => (
                <tr key={k.id} className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors h-12">
                  <td className="px-4 py-2 text-sm text-ink-primary">{k.uraian}</td>
                  <td className="px-4 py-2 text-xs text-ink-secondary hidden md:table-cell">{k.subkegiatanName}</td>
                  <td className="px-4 py-2 font-mono text-xs text-ink-secondary hidden lg:table-cell">{k.kodeRekening}</td>
                  <td className="px-4 py-2 text-right font-mono tnum text-sm text-ink-primary">{formatRupiah(k.bruto)}</td>
                  <td className="px-4 py-2 text-xs text-ink-secondary hidden md:table-cell">{formatDateID(k.tanggal)}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={k.status} type="kuitansi" />
                      {k.spjStatus !== 'belum' && <StatusBadge status={k.spjStatus} type="spj" />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border text-2xs text-ink-muted">
          Kuitansi Aktif dapat diedit/dibatalkan sampai SPJ Draft dibuat. Sejak SPJ Draft dibuat, kuitansi Terkunci. Pada Masa Transisi hanya dapat dibatalkan. (Dokumen 02 §4)
        </div>
      </div>

      {/* PPTK scope note */}
      <div className="mt-6 surface-card px-4 py-3 flex items-start gap-3">
        <FileText className="h-5 w-5 text-ink-secondary shrink-0 mt-0.5" />
        <p className="text-xs text-ink-secondary leading-relaxed">
          <span className="text-ink-primary font-medium">Cakupan PPTK:</span> Hanya melihat seksinya sendiri. Tidak melihat Pagu Induk.
          Jejak Audit hanya entri seksinya. Tidak dapat melakukan pergeseran anggaran. Tombol buat kuitansi/SPJ terkunci
          global jika gatekeeper mendapati ada seksi lain belum Seimbang. (Dokumen 03 §4, Dokumen 01 §3.2)
        </p>
      </div>
    </div>
  );
}
