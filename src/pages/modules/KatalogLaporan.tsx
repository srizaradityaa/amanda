import { FileText, FileSpreadsheet, Download, Lock, FileSearch, ShieldCheck } from 'lucide-react';
import type { SessionUser } from '@/auth/types';
import { mockLaporanList, type LaporanDef } from '@/data/mockData';
import { PageHeader } from '@/components/ui/Primitives';

export function KatalogLaporan({ session }: { session: SessionUser }) {
  const role = session.role;
  const ta = session.activeTa;

  // Admin has no reports (Dokumen 01 §9 poin 3, Dokumen 05 skenario 124)
  if (role === 'admin') {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Katalog Laporan" subtitle="Akses ditolak" />
        <div className="surface-card p-10 flex flex-col items-center justify-center text-center min-h-[320px]">
          <Lock className="h-8 w-8 text-status-red mb-4" />
          <h2 className="text-base font-semibold text-ink-primary mb-1.5">Admin tidak mendapat laporan</h2>
          <p className="text-sm text-ink-secondary max-w-md">
            Admin tidak melihat menu laporan dan ditolak di server saat URL laporan dipanggil langsung.
            (Dokumen 01 §9 poin 3, Dokumen 05 skenario 124)
          </p>
        </div>
      </div>
    );
  }

  // Filter reports by role access
  const available = mockLaporanList.filter((r) => r.roles.includes(role));

  // PA/KPA specific exclusions already handled by roles array in mockLaporanList (lap-c excluded)
  // PA/KPA column notes for lap-b and lap-f
  const paKpaColumnNote = (kode: string) => {
    if (role === 'pa_kpa') {
      if (kode === 'b') return 'Kolom kuitansi tidak ditampilkan untuk PA/KPA.';
      if (kode === 'f') return 'Kolom Tanggal Kuitansi tidak ditampilkan untuk PA/KPA.';
    }
    return null;
  };

  function formatBadge(format: LaporanDef['format']) {
    if (format === 'PDF+Excel') {
      return (
        <div className="flex items-center gap-1">
          <span className="flex items-center gap-1 text-2xs text-status-red border border-status-red/40 px-1.5 py-0.5">
            <FileText className="h-3 w-3" /> PDF
          </span>
          <span className="flex items-center gap-1 text-2xs text-status-green border border-status-green/40 px-1.5 py-0.5">
            <FileSpreadsheet className="h-3 w-3" /> Excel
          </span>
        </div>
      );
    }
    if (format === 'Excel') {
      return (
        <span className="flex items-center gap-1 text-2xs text-status-green border border-status-green/40 px-1.5 py-0.5">
          <FileSpreadsheet className="h-3 w-3" /> Excel
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-2xs text-status-red border border-status-red/40 px-1.5 py-0.5">
        <FileText className="h-3 w-3" /> PDF
      </span>
    );
  }

  const scopeText =
    role === 'pptk'
      ? 'Hanya seksinya sendiri'
      : role === 'auditor'
      ? 'Seluruh TA, baca saja'
      : 'Seluruh seksi';

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Katalog Laporan"
        subtitle={`${scopeText} • TA ${ta?.taYear ?? 2026} • hanya data SPJ Dibukukan (BKU tercatat)`}
      />

      {/* Info card */}
      <div className="surface-card px-4 py-3 mb-5 flex items-start gap-3">
        <FileSearch className="h-5 w-5 text-amber shrink-0 mt-0.5" />
        <div className="text-xs text-ink-secondary leading-relaxed">
          <span className="text-ink-primary font-medium">Basis laporan:</span> Seluruh laporan hanya memuat data realisasi,
          yaitu SPJ Dibukukan dengan BKU tercatat. Komitmen kuitansi yang belum dibukukan tidak dilaporkan.
          {role === 'auditor' && ' Setiap unduhan atau cetakan tercatat di Jejak Audit dengan snapshot nama, instansi asal, nomor surat tugas, dan peran.'}
          {' '}(Dokumen 01 §9 poin 2–3, Dokumen 04 §2.2)
        </div>
      </div>

      {/* Report list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {available.map((lap) => {
          const colNote = paKpaColumnNote(lap.kode);
          return (
            <div key={lap.id} className="surface-card p-5 flex flex-col">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-sm font-bold text-amber border border-amber/40 px-2 py-1 bg-amber/5">
                    {lap.kode.toUpperCase()}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-ink-primary">{lap.nama}</h3>
                    <p className="text-2xs text-ink-muted mt-0.5">{lap.deskripsi}</p>
                  </div>
                </div>
              </div>

              {colNote && (
                <div className="mb-3 border-l-2 border-status-yellow/60 pl-2.5 text-2xs text-status-yellow">
                  {colNote} (Dokumen 01 §9 poin 3)
                </div>
              )}

              {lap.catatan && !colNote && (
                <div className="mb-3 text-2xs text-ink-muted leading-relaxed">
                  {lap.catatan}
                </div>
              )}

              <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
                {formatBadge(lap.format)}
                <div className="flex items-center gap-1.5">
                  {lap.format.includes('PDF') && (
                    <button className="btn-ghost text-xs flex items-center gap-1 px-2 py-1" title="Unduh PDF">
                      <Download className="h-3.5 w-3.5" />
                      PDF
                    </button>
                  )}
                  {lap.format.includes('Excel') && (
                    <button className="btn-ghost text-xs flex items-center gap-1 px-2 py-1" title="Unduh Excel">
                      <Download className="h-3.5 w-3.5" />
                      Excel
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Excluded reports note for PA/KPA */}
      {role === 'pa_kpa' && (
        <div className="mt-5 surface-card px-4 py-3 flex items-start gap-3">
          <Lock className="h-5 w-5 text-status-red shrink-0 mt-0.5" />
          <div className="text-xs text-ink-secondary leading-relaxed">
            <span className="text-ink-primary font-medium">Laporan c (Daftar Kuitansi & SPJ)</span> tidak ditampilkan
            untuk PA/KPA dan ditolak di server, termasuk melalui URL langsung. (Dokumen 01 §9 poin 3, Dokumen 05 skenario 65)
          </div>
        </div>
      )}

      {/* Auditor action note */}
      {role === 'auditor' && (
        <div className="mt-5 surface-card px-4 py-3 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-teal shrink-0 mt-0.5" />
          <div className="text-xs text-ink-secondary leading-relaxed">
            Pengawas/Auditor tidak memiliki akses ke Penyusunan Laporan Kustom. Tetap memakai Katalog Laporan baku secara baca saja.
            (Dokumen 01 §9 poin 12a, Dokumen 03 §7)
          </div>
        </div>
      )}

      {/* PPTK scope note */}
      {role === 'pptk' && (
        <div className="mt-5 surface-card px-4 py-3 flex items-start gap-3">
          <FileSearch className="h-5 w-5 text-ink-secondary shrink-0 mt-0.5" />
          <div className="text-xs text-ink-secondary leading-relaxed">
            PPTK hanya memperoleh data seksinya sendiri pada seluruh laporan. Pencarian/filter hanya bekerja dalam cakupan data peran.
            (Dokumen 03 §4 poin 9, Dokumen 01 §15 poin 5)
          </div>
        </div>
      )}
    </div>
  );
}
