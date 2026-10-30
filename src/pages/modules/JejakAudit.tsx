import { useState, useMemo } from 'react';
import { ScrollText, Search, Filter, RotateCcw, Lock } from 'lucide-react';
import type { SessionUser } from '@/auth/types';
import { mockAuditEventsFull, type AuditEvent } from '@/data/mockData';
import { PageHeader, StatusBadge } from '@/components/ui/Primitives';

function formatWaktu(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()} ${h}:${m}`;
}

export function JejakAudit({ session }: { session: SessionUser }) {
  const role = session.role;
  const ta = session.activeTa;

  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  // Role-aware scope (Dokumen 01 §6 poin 5, Dokumen 05 skenario 23c):
  // - Admin: all entries, read-only
  // - PPTK: only own seksi entries
  // - Auditor: all TA, read-only
  // - Bendahara/Verifikator/PA-KPA: all TA (read-only for verifikator & PA-KPA)
  let scopedEvents: AuditEvent[] = mockAuditEventsFull;
  let scopeNote = '';
  if (role === 'pptk') {
    // PPTK only sees own seksi audit entries
    scopedEvents = mockAuditEventsFull.filter(
      (e) => e.peran === 'PPTK' || e.entitas.includes('seksi-pem') || e.aktorName === 'Dwi Putri Lestari, S.T.',
    );
    scopeNote = 'Hanya entri milik seksinya sendiri yang terlihat. (Dokumen 01 §6 poin 5, Dokumen 05 skenario 23c)';
  } else if (role === 'admin') {
    scopeNote = 'Membaca seluruh entri termasuk entri keuangan (pengecualian disetujui). Tidak dapat mengubah atau menghapus entri. (Dokumen 01 §6 poin 3b, 7)';
  } else if (role === 'auditor') {
    scopeNote = 'Lihat seluruh TA, baca saja. Aksi mengunduh/mencetak laporan tercatat dengan snapshot nama, instansi asal, nomor surat tugas. (Dokumen 01 §8 poin 7–8)';
  } else if (role === 'verifikator') {
    scopeNote = 'Seluruh entri TA dalam mode baca saja. (Dokumen 03 §5 poin 5)';
  } else if (role === 'pa_kpa') {
    scopeNote = 'PA/KPA tidak melihat Jejak Audit. (Dokumen 05 §2 matriks — Jejak audit: PA/KPA = Tidak)';
    scopedEvents = [];
  } else {
    scopeNote = 'Seluruh entri TA untuk pemantauan operasional.';
  }

  // Filter
  const filtered = useMemo(() => {
    let result = scopedEvents;
    if (filterRole !== 'all') {
      result = result.filter((e) => e.peran === filterRole);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.aktorName.toLowerCase().includes(q) ||
          e.aktorNipNik.toLowerCase().includes(q) ||
          e.entitas.toLowerCase().includes(q) ||
          e.aksi.toLowerCase().includes(q),
      );
    }
    return result;
  }, [scopedEvents, filterRole, search]);

  const roleOptions = useMemo(() => {
    const set = new Set(scopedEvents.map((e) => e.peran));
    return Array.from(set);
  }, [scopedEvents]);

  function resetFilters() {
    setSearch('');
    setFilterRole('all');
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Jejak Audit"
        subtitle={`TA ${ta?.taYear ?? 2026} • baca saja • pencarian & filter`}
        mode="PRO"
      />

      {/* PA/KPA access denied */}
      {role === 'pa_kpa' ? (
        <div className="surface-card p-10 flex flex-col items-center justify-center text-center min-h-[320px]">
          <Lock className="h-8 w-8 text-status-red mb-4" />
          <h2 className="text-base font-semibold text-ink-primary mb-1.5">Tidak memiliki akses Jejak Audit</h2>
          <p className="text-sm text-ink-secondary max-w-md">
            PA/KPA tidak memiliki akses ke Jejak Audit sesuai matriks hak akses. (Dokumen 05 §2 matriks)
          </p>
        </div>
      ) : (
        <>
          {/* Scope note */}
          <div className="surface-card px-4 py-3 mb-4 flex items-start gap-3">
            <ScrollText className="h-5 w-5 text-amber shrink-0 mt-0.5" />
            <p className="text-xs text-ink-secondary leading-relaxed">{scopeNote}</p>
          </div>

          {/* Search & filter bar (Dokumen 01 §15) */}
          <div className="surface-card px-4 py-3 mb-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari aktor, NIP/NIK, entitas, atau aksi..."
                className="input-base pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-ink-muted shrink-0" />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="input-base py-2 pr-8 cursor-pointer min-w-[140px]"
              >
                <option value="all">Semua Peran</option>
                {roleOptions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <button onClick={resetFilters} className="btn-ghost flex items-center gap-1 text-xs shrink-0">
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            </div>
          </div>

          {/* Result count */}
          <div className="mb-3 text-2xs text-ink-muted">
            Menampilkan <span className="text-ink-primary font-medium">{filtered.length}</span> dari {scopedEvents.length} entri
          </div>

          {/* Table */}
          <div className="surface-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-hover">
                    <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2.5 whitespace-nowrap">Waktu</th>
                    <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2.5">Aktor</th>
                    <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2.5 hidden md:table-cell">NIP/NIK</th>
                    <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2.5">Peran</th>
                    <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2.5">Entitas</th>
                    <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2.5">Aksi</th>
                    <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2.5 hidden lg:table-cell">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-ink-muted">
                        Tidak ada entri yang cocok dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((ev) => (
                      <tr key={ev.id} className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors h-12">
                        <td className="px-4 py-2 font-mono text-xs text-ink-secondary whitespace-nowrap">{formatWaktu(ev.waktu)}</td>
                        <td className="px-4 py-2 text-sm text-ink-primary whitespace-nowrap">{ev.aktorName}</td>
                        <td className="px-4 py-2 font-mono text-xs text-ink-secondary hidden md:table-cell whitespace-nowrap">{ev.aktorNipNik}</td>
                        <td className="px-4 py-2 text-xs text-ink-secondary whitespace-nowrap">{ev.peran}</td>
                        <td className="px-4 py-2 text-xs text-ink-primary">{ev.entitas}</td>
                        <td className="px-4 py-2 text-xs text-ink-secondary">{ev.aksi}</td>
                        <td className="px-4 py-2 text-2xs text-ink-muted hidden lg:table-cell">
                          {ev.nilaiSebelum && ev.nilaiSesudah
                            ? `${ev.nilaiSebelum} → ${ev.nilaiSesudah}`
                            : ev.nilaiSesudah ?? ev.alasan ?? '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-border text-2xs text-ink-muted">
              Aktor selalu personel nyata dengan snapshot nama, NIP/NIK, dan peran saat aksi. Pencabutan BKU & koreksi tercatat dengan nilai lama dan baru. Pembatalan kuitansi/SPJ Draft tidak meninggalkan jejak. Tidak ada tombol hapus manual. (Dokumen 04 §2.2, §6, Dokumen 01 §6 poin 6)
            </div>
          </div>
        </>
      )}
    </div>
  );
}
