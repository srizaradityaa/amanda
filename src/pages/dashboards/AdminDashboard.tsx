import { CalendarRange, Database, ScrollText, ShieldAlert, FileText } from 'lucide-react';
import type { SessionUser } from '@/auth/types';
import {
  mockTas,
  mockSeksiList,
  mockCountdown,
  formatRupiah,
  formatDateID,
  type TaCard,
} from '@/data/mockData';
import {
  PageHeader,
  StatCard,
  Ticker,
  StatusBadge,
  CountdownWidget,
} from '@/components/ui/Primitives';

const taStatusLabel: Record<TaCard['status'], string> = {
  draft: 'Draft',
  aktif_penuh: 'Aktif Penuh',
  masa_transisi: 'Masa Transisi',
  arsip_readonly: 'Arsip Read-Only',
};

export function AdminDashboard({ session }: { session: SessionUser }) {
  const belumSeimbang = mockSeksiList.filter((s) => s.alokasiStatus !== 'tuntas');

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dasbor Administrasi Global"
        subtitle="Master data, status TA, dan Jejak Audit — tanpa akses alokasi, kuitansi, SPJ, atau BKU."
        mode="PRO"
      />

      {/* Countdown (read-only for Admin — Dokumen 01 §3.1 poin 2) */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <CountdownWidget deadline={mockCountdown.deadline} readOnly />
        <StatCard label="Seksi Tuntas" value={`${mockCountdown.selesai}/${mockCountdown.total}`} sublabel="seimbang 100%" accent="green" />
        <StatCard label="Belum Seimbang" value={mockCountdown.belumSeimbang} sublabel="seksi tertahan" accent="yellow" />
      </div>

      {/* Banner merah gatekeeper (read-only for Admin — Dokumen 01 §3.2, §6 poin 3c) */}
      {belumSeimbang.length > 0 && (
        <div className="border border-status-red/50 bg-status-red/10 px-4 py-3 mb-6 animate-slide-up">
          <div className="flex items-start gap-3">
            <span className="status-dot bg-status-red mt-1.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-status-red">
                Gatekeeper tertutup — mode baca saja untuk Admin (tidak ada kendali jendela waktu).
              </p>
              <p className="text-xs text-ink-secondary mt-1">
                Seksi belum menyelesaikan alokasi: <span className="text-ink-primary">{belumSeimbang.map((s) => s.name).join(', ')}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick stat ticker — Master data counts */}
      <div className="mb-6">
        <Ticker>
          <StatCard label="Master SOTK" value="18" sublabel="unit aktif" accent="default" icon={Database} />
          <StatCard label="Master Personel" value="42" sublabel="personel terdaftar" accent="default" icon={ShieldAlert} />
          <StatCard label="Master Subkegiatan" value="24" sublabel="subkegiatan aktif" accent="default" icon={CalendarRange} />
          <StatCard label="Master Rekening" value="56" sublabel="rekening belanja" accent="default" icon={Database} />
          <StatCard label="Master Jenis Pajak" value="8" sublabel="jenis pajak" accent="default" icon={FileText} />
          <StatCard label="Total TA" value={mockTas.length} sublabel="workspace" accent="amber" icon={ScrollText} />
        </Ticker>
      </div>

      {/* TA Cards — Pagu Induk shown (Dokumen 01 §6 poin 3a — pengecualian disetujui) */}
      <div>
        <h2 className="text-sm font-semibold text-ink-primary mb-3">Kartu Tahun Anggaran</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {mockTas.map((ta) => (
            <div key={ta.id} className="surface-card p-5 hover:border-border-strong transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-2xl font-bold text-ink-primary">{ta.year}</span>
                    <StatusBadge status={ta.status} type="ta" />
                  </div>
                  <p className="text-2xs text-ink-muted mt-1">Dibuat {formatDateID(ta.createdAt)}</p>
                </div>
                {ta.hasTransactions && (
                  <span className="text-2xs text-ink-muted border border-border px-2 py-0.5">Bertransaksi</span>
                )}
              </div>

              {/* Pagu Induk — satu-satunya angka keuangan yang terlihat Admin (§6 poin 3a) */}
              <div className="border-t border-border pt-3">
                <div className="text-2xs uppercase tracking-wider text-ink-muted mb-1">Pagu Induk SKPD</div>
                <div className="font-mono tnum text-lg font-semibold text-amber">
                  Rp {formatRupiah(ta.paguInduk)}
                </div>
                <p className="text-2xs text-ink-muted mt-1">
                  Pengecualian disetujui — tidak melihat alokasi, SPD, kuitansi, SPJ, atau BKU.
                </p>
              </div>

              {ta.status === 'arsip_readonly' && ta.arsipDate && (
                <div className="mt-3 border-t border-border pt-2">
                  <p className="text-2xs text-ink-muted">Diarsipkan: {formatDateID(ta.arsipDate)}</p>
                  <p className="text-2xs text-ink-muted">Retensi 12 tahun — penghapusan manual Admin setelah retensi.</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Admin scope note */}
      <div className="mt-6 surface-card px-4 py-3 flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-amber shrink-0 mt-0.5" />
        <div className="text-xs text-ink-secondary leading-relaxed">
          <span className="text-ink-primary font-medium">Batas Peran Admin:</span> Hanya mengelola master dan status TA.
          Tidak melihat alokasi, SPD, kuitansi, SPJ, verifikasi, atau BKU. Satu-satunya angka keuangan: Pagu Induk pada
          kartu TA dan entri Jejak Audit (baca saja). (Dokumen 01 §6 poin 2–3, Dokumen 03 §2)
        </div>
      </div>
    </div>
  );
}
