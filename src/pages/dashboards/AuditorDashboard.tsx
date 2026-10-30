import { FileSearch, ScrollText, ShieldCheck, Lock, Download, Eye } from 'lucide-react';
import type { SessionUser } from '@/auth/types';
import { mockAuditEvents, mockTas, formatDateID, type TaCard } from '@/data/mockData';
import { PageHeader, StatCard, Ticker, StatusBadge } from '@/components/ui/Primitives';

const taStatusLabel: Record<TaCard['status'], string> = {
  draft: 'Draft',
  aktif_penuh: 'Aktif Penuh',
  masa_transisi: 'Masa Transisi',
  arsip_readonly: 'Arsip Read-Only',
};

export function AuditorDashboard({ session }: { session: SessionUser }) {
  const ta = session.activeTa;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dasbor Pengawas / Auditor"
        subtitle={`${session.instansiAsal ?? 'Inspektorat'} • Surat Tugas ${session.nomorSuratTugas ?? '—'} • TA ${ta?.taYear ?? 2026} • mode baca saja`}
        mode="PRO"
      />

      {/* Auditor info — no sidebar, no mini progress bar, no countdown/banner (Dokumen 03 §7, §1) */}
      <div className="surface-card px-4 py-3 mb-6 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-teal shrink-0 mt-0.5" />
        <div className="text-xs text-ink-secondary leading-relaxed">
          <span className="text-ink-primary font-medium">Mode Baca Saja:</span> Mengakses laporan dan Jejak Audit
          seluruh TA. Tidak melihat countdown, banner merah, mini progress bar, atau sidebar. Tidak mengubah pagu,
          penugasan, kuitansi, SPJ, atau BKU. Tidak memiliki akses master, akun, drill-down, atau tombol proses.
          (Dokumen 03 §7, Dokumen 01 §8)
        </div>
      </div>

      {/* Ticker — TA coverage summary */}
      <div className="mb-6">
        <Ticker>
          <StatCard label="TA Tersedia" value={mockTas.length} sublabel="seluruh TA" accent="teal" icon={ScrollText} />
          <StatCard label="Entri Jejak Audit" value={mockAuditEvents.length} sublabel="seluruh TA" accent="default" icon={Eye} />
          <StatCard label="Akses Aktif" value="Sampai 31 Des 2026" sublabel="tanggal akhir akses" accent="yellow" icon={Lock} />
        </Ticker>
      </div>

      {/* Katalog Laporan — baca saja (Dokumen 01 §9, §8 poin 7) */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-ink-primary mb-3 flex items-center gap-2">
          <FileSearch className="h-4 w-4 text-amber" />
          Katalog Laporan (Baca Saja)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { id: 'a', name: 'Rekap Realisasi per Seksi', desc: 'Pagu, realisasi BKU, serapan, status' },
            { id: 'b', name: 'Buku Kas (BKU)', desc: 'No. BKU, tanggal, nominal, kuitansi' },
            { id: 'd', name: 'Laporan Serapan', desc: 'Serapan per seksi & subkegiatan' },
            { id: 'e', name: 'Rekap Isian SPJ per Jenis Belanja', desc: 'Excel, satu sheet per jenis belanja' },
            { id: 'f', name: 'Rekap Pajak per Jenis Pajak', desc: 'Entri pajak SPJ ber-BKU' },
            { id: 'g', name: 'Rincian Kartu Kendali Kegiatan', desc: 'Realisasi per subkegiatan & rekening' },
          ].map((r) => (
            <div key={r.id} className="surface-card p-4 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-amber border border-amber/40 px-1.5 py-0.5">{r.id.toUpperCase()}</span>
                  <span className="text-sm font-medium text-ink-primary">{r.name}</span>
                </div>
                <p className="text-2xs text-ink-muted">{r.desc}</p>
              </div>
              <button className="btn-ghost flex items-center gap-1 text-xs shrink-0" title="Unduh (tercatat di Jejak Audit)">
                <Download className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <p className="text-2xs text-ink-muted mt-2">
          Setiap unduhan atau cetakan oleh Pengawas tercatat di Jejak Audit dengan snapshot nama, instansi asal, nomor surat tugas, dan peran. Laporan c ditolak untuk PA/KPA. (Dokumen 01 §9 poin 3, §8 poin 8)
        </p>
      </div>

      {/* Jejak Audit seluruh TA — baca saja (Dokumen 01 §8 poin 7, Dokumen 03 §7) */}
      <div className="surface-card">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-primary flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-amber" />
            Jejak Audit — Seluruh TA (Baca Saja)
          </h2>
          <span className="text-2xs text-ink-muted">Pengawas tidak dapat mengubah/menghapus entri</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-hover">
                <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2.5">Waktu</th>
                <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2.5">Aktor</th>
                <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2.5 hidden md:table-cell">NIP/NIK</th>
                <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2.5">Peran</th>
                <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2.5">Entitas</th>
                <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2.5">Aksi</th>
                <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2.5 hidden lg:table-cell">Detail</th>
              </tr>
            </thead>
            <tbody>
              {mockAuditEvents.map((ev) => {
                const d = new Date(ev.waktu);
                const waktuStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                return (
                  <tr key={ev.id} className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors h-12">
                    <td className="px-4 py-2 font-mono text-xs text-ink-secondary whitespace-nowrap">{waktuStr}</td>
                    <td className="px-4 py-2 text-sm text-ink-primary whitespace-nowrap">{ev.aktorName}</td>
                    <td className="px-4 py-2 font-mono text-xs text-ink-secondary hidden md:table-cell whitespace-nowrap">{ev.aktorNipNik}</td>
                    <td className="px-4 py-2 text-xs text-ink-secondary">{ev.peran}</td>
                    <td className="px-4 py-2 text-xs text-ink-primary">{ev.entitas}</td>
                    <td className="px-4 py-2 text-xs text-ink-secondary">{ev.aksi}</td>
                    <td className="px-4 py-2 text-2xs text-ink-muted hidden lg:table-cell">
                      {ev.nilaiSebelum && ev.nilaiSesudah
                        ? `${ev.nilaiSebelum} → ${ev.nilaiSesudah}`
                        : ev.nilaiSesudah ?? ev.alasan ?? '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border text-2xs text-ink-muted">
          Aktor selalu personel nyata. Pengawas/Auditor tidak dapat mengubah atau menghapus entri audit. Pencabutan BKU & koreksi tercatat dengan nilai lama dan baru. (Dokumen 04 §2.2, §6)
        </div>
      </div>
    </div>
  );
}
