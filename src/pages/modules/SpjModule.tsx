import { useState } from 'react';
import { ClipboardCheck, Eye, Lock, PencilLine, Wallet } from 'lucide-react';
import type { SessionUser } from '@/auth/types';
import {
  computeJumlahDibayarkan,
  computeTotalPajak,
} from '@/pages/modules/spj/pajakRules';
import { PajakDialog } from '@/pages/modules/spj/PajakDialog';
import {
  formatDateID,
  formatRupiah,
  formatRupiahFull,
  mockSeksiList,
  type KuitansiRow,
} from '@/data/mockData';
import { PageHeader, StatusBadge, StatCard } from '@/components/ui/Primitives';
import { useKuitansiSpj } from '@/state/KuitansiSpjContext';

export function SpjModule({ session }: { session: SessionUser }) {
  if (session.role !== 'pptk') {
    return (
      <div className="animate-fade-in">
        <PageHeader title="SPJ & Form Dinamis" subtitle="Akses ditolak" />
        <div className="surface-card p-10 flex flex-col items-center justify-center text-center min-h-[320px]">
          <Lock className="h-8 w-8 text-status-red mb-4" />
          <p className="text-sm text-ink-secondary max-w-md">Hanya PPTK yang dapat mengelola SPJ seksinya.</p>
        </div>
      </div>
    );
  }

  return <PptkSpj session={session} />;
}

function PptkSpj({ session }: { session: SessionUser }) {
  const mySeksi = mockSeksiList[0];
  const ta = session.activeTa;
  const { rows, pajakByKuitansi, savePajak } = useKuitansiSpj();
  const [pajakTargetId, setPajakTargetId] = useState<string | null>(null);

  const spjRows = rows.filter((r) => r.spjStatus !== 'belum');
  const pajakTarget: KuitansiRow | null = pajakTargetId
    ? rows.find((r) => r.id === pajakTargetId) ?? null
    : null;

  const totalBruto = spjRows.reduce((sum, r) => sum + r.bruto, 0);
  const totalPajak = spjRows.reduce((sum, r) => sum + computeTotalPajak(pajakByKuitansi[r.id] ?? []), 0);

  return (
    <div className="animate-fade-in">
      <PageHeader title="SPJ & Form Dinamis" subtitle={`${mySeksi.name} • TA ${ta?.taYear ?? 2026}`} mode="PRO" />

      <div className="mb-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard label="SPJ seksi" value={spjRows.length} sublabel="Draft, terkunci, atau dibukukan" icon={ClipboardCheck} />
        <StatCard label="Total bruto SPJ" value={formatRupiahFull(totalBruto)} accent="amber" icon={Wallet} />
        <StatCard label="Total Pajak" value={formatRupiahFull(totalPajak)} accent="teal" sublabel="Jumlah seluruh entri pajak" />
      </div>

      <p className="text-2xs text-ink-muted mb-1">
        Pajak diisi manual per SPJ dan tidak mengubah nilai bruto kuitansi maupun komitmen SPD.
      </p>

      <div className="surface-card mt-4">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-ink-primary">Daftar SPJ</h2>
        </div>
        {spjRows.length === 0 ? (
          <div className="px-4 py-12 text-center text-xs text-ink-muted">
            Belum ada SPJ. Buat SPJ dari menu Kuitansi untuk memulai.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-hover">
                  <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">No.</th>
                  <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Uraian</th>
                  <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2 hidden md:table-cell">Jenis Belanja</th>
                  <th className="text-right font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Bruto</th>
                  <th className="text-right font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2 hidden lg:table-cell">Total Pajak</th>
                  <th className="text-right font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2 hidden lg:table-cell">Dibayarkan</th>
                  <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Status SPJ</th>
                  <th className="text-right font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {spjRows.map((r, idx) => {
                  const entries = pajakByKuitansi[r.id] ?? [];
                  const isDraft = r.spjStatus === 'draft';
                  return (
                    <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors h-10">
                      <td className="px-4 py-1 font-mono text-xs text-ink-muted">{idx + 1}</td>
                      <td className="px-4 py-1 text-xs text-ink-primary">
                        <div>{r.uraian}</div>
                        <div className="text-2xs text-ink-muted">{formatDateID(r.tanggal)} • {r.penerima}</div>
                      </td>
                      <td className="px-4 py-1 text-xs text-ink-secondary hidden md:table-cell">{r.spjJenisBelanja ?? '—'}</td>
                      <td className="px-4 py-1 text-right font-mono tnum text-xs text-ink-primary">{formatRupiah(r.bruto)}</td>
                      <td className="px-4 py-1 text-right font-mono tnum text-xs text-ink-secondary hidden lg:table-cell">{formatRupiah(computeTotalPajak(entries))}</td>
                      <td className="px-4 py-1 text-right font-mono tnum text-xs text-ink-secondary hidden lg:table-cell">{formatRupiah(computeJumlahDibayarkan(r.bruto, entries))}</td>
                      <td className="px-4 py-1"><StatusBadge status={r.spjStatus} type="spj" /></td>
                      <td className="px-4 py-1">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => setPajakTargetId(r.id)}
                            className="btn-ghost px-2 py-1 text-xs flex items-center gap-1"
                          >
                            {isDraft ? <PencilLine className="h-3 w-3" aria-hidden="true" /> : <Eye className="h-3 w-3" aria-hidden="true" />}
                            {isDraft ? 'Isi Pajak' : 'Lihat Pajak'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pajakTarget && (
        <PajakDialog
          key={pajakTarget.id}
          kuitansi={pajakTarget}
          initialEntries={pajakByKuitansi[pajakTarget.id] ?? []}
          readOnly={pajakTarget.spjStatus !== 'draft'}
          onSave={(entries) => savePajak(pajakTarget.id, entries)}
          onClose={() => setPajakTargetId(null)}
        />
      )}
    </div>
  );
}
