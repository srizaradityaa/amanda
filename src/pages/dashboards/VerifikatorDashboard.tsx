import { useMemo, useState } from 'react';
import { ClipboardCheck, Inbox, CheckCircle2, RotateCcw, Clock } from 'lucide-react';
import type { SessionUser } from '@/auth/types';
import type { KuitansiRow } from '@/data/mockData';
import { formatRupiah, formatDateID } from '@/data/mockData';
import { PageHeader, StatCard, Ticker, StatusBadge } from '@/components/ui/Primitives';
import { SpjReturnDialog } from '@/pages/modules/spj/SpjReturnDialog';
import { toKuitansiActor, useKuitansiSpj } from '@/state/KuitansiSpjContext';

export function VerifikatorDashboard({ session }: { session: SessionUser }) {
  const ta = session.activeTa;
  const { rows, verifySpj, returnSpj } = useKuitansiSpj();
  const actor = toKuitansiActor(session);
  const [returning, setReturning] = useState<KuitansiRow | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const antrean = useMemo(() => rows.filter((r) => r.spjStatus === 'terkunci'), [rows]);
  const menunggu = useMemo(() => rows.filter((r) => r.spjStatus === 'menunggu_bku'), [rows]);
  const dibukukan = useMemo(() => rows.filter((r) => r.spjStatus === 'dibukukan'), [rows]);
  const spjRows = useMemo(() => rows.filter((r) => r.spjStatus !== 'belum'), [rows]);

  const handleApprove = (row: KuitansiRow) => {
    setActionError(verifySpj(row.id, actor));
  };

  const handleReturn = (catatan: string): string | null => {
    if (!returning) return null;
    const error = returnSpj(returning.id, catatan, actor);
    if (!error) setReturning(null);
    return error;
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dasbor Verifikator"
        subtitle={`Antrean SPJ seluruh seksi • TA ${ta?.taYear ?? 2026} • Verifikasi & BKU (mode baca anggaran)`}
        mode="PRO"
      />

      {/* Ticker summary */}
      <div className="mb-6">
        <Ticker>
          <StatCard label="Antrean Verifikasi" value={antrean.length} sublabel="SPJ Terkunci" accent="yellow" icon={Inbox} />
          <StatCard label="Menunggu BKU" value={menunggu.length} sublabel="disetujui" accent="teal" icon={Clock} />
          <StatCard label="Dibukukan" value={dibukukan.length} sublabel="realisasi" accent="green" icon={CheckCircle2} />
          <StatCard label="Total SPJ" value={spjRows.length} sublabel="seluruh seksi" accent="default" icon={ClipboardCheck} />
        </Ticker>
      </div>

      {/* Antrean SPJ — Pro Mode table (32px rows) */}
      <div className="surface-card mb-6">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-primary">Antrean Verifikasi SPJ</h2>
          <div className="flex items-center gap-2">
            <span className="text-2xs text-ink-muted">Seluruh seksi • mode baca</span>
            <span className="text-2xs text-ink-muted font-mono">32px • PRO</span>
          </div>
        </div>
        {actionError && (
          <div className="px-4 py-2 border-b border-border text-xs text-status-red">{actionError}</div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-hover">
                <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">No. Ref</th>
                <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Seksi</th>
                <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Uraian</th>
                <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2 hidden md:table-cell">Jenis Belanja</th>
                <th className="text-right font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Bruto</th>
                <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2 hidden lg:table-cell">Tgl. Kuitansi</th>
                <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2 hidden lg:table-cell">Diajukan Oleh</th>
                <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Status</th>
                <th className="text-right font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {spjRows.map((row) => {
                const isOwn = row.pengajuId === actor.id;
                return (
                <tr key={row.id} className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors h-8">
                  <td className="px-4 py-1 font-mono text-xs text-ink-secondary whitespace-nowrap">{row.verifikasi?.nomor ?? '—'}</td>
                  <td className="px-4 py-1 text-xs text-ink-primary whitespace-nowrap">{row.seksiName}</td>
                  <td className="px-4 py-1 text-xs text-ink-primary max-w-[200px] truncate">{row.uraian}</td>
                  <td className="px-4 py-1 text-xs text-ink-secondary hidden md:table-cell whitespace-nowrap">{row.spjJenisBelanja ?? '—'}</td>
                  <td className="px-4 py-1 text-right font-mono tnum text-xs text-ink-primary whitespace-nowrap">{formatRupiah(row.bruto)}</td>
                  <td className="px-4 py-1 text-xs text-ink-secondary hidden lg:table-cell whitespace-nowrap">{formatDateID(row.tanggal)}</td>
                  <td className="px-4 py-1 text-xs text-ink-secondary hidden lg:table-cell whitespace-nowrap">{row.pengajuName ?? '—'}</td>
                  <td className="px-4 py-1"><StatusBadge status={row.spjStatus} type="spj" /></td>
                  <td className="px-4 py-1 text-right">
                    {row.spjStatus === 'terkunci' ? (
                      isOwn ? (
                        <span className="text-2xs text-ink-muted" title="Verifikator tidak boleh memverifikasi SPJ yang ia ajukan">Milik sendiri</span>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleApprove(row)} className="btn-ghost text-2xs px-2 py-1 flex items-center gap-1 text-status-green" title="Setujui">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Setujui
                          </button>
                          <button onClick={() => { setActionError(null); setReturning(row); }} className="btn-ghost text-2xs px-2 py-1 flex items-center gap-1 text-status-red" title="Kembalikan">
                            <RotateCcw className="h-3.5 w-3.5" />
                            Kembalikan
                          </button>
                        </div>
                      )
                    ) : (
                      <span className="text-2xs text-ink-muted">—</span>
                    )}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border text-2xs text-ink-muted">
          SPJ Terkunci sejak dikirim ke Verifikator. Pengembalian membuka kunci SPJ menjadi Draft, tetapi kuitansi terkait tetap Terkunci dan komitmen SPD tetap berlaku.
        </div>
      </div>

      {returning && (
        <SpjReturnDialog spj={returning} onConfirm={handleReturn} onClose={() => setReturning(null)} />
      )}

      {/* Verifikator scope note */}
      <div className="surface-card px-4 py-3 flex items-start gap-3">
        <ClipboardCheck className="h-5 w-5 text-amber shrink-0 mt-0.5" />
        <p className="text-xs text-ink-secondary leading-relaxed">
          <span className="text-ink-primary font-medium">Cakupan Verifikator:</span> Melihat Pagu Induk pada kartu TA,
          seluruh Jejak Audit TA (baca saja), dan drill-down anggaran seluruh seksi sampai rekening belanja (baca saja).
          Tidak memverifikasi SPJ yang ia ajukan/kelola sendiri. (Dokumen 03 §5, Dokumen 01 §6 poin 9)
        </p>
      </div>
    </div>
  );
}
