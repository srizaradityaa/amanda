import { useState } from 'react';
import { Lock, Pencil, Send, Undo2, Plus } from 'lucide-react';
import type { SessionUser } from '@/auth/types';
import { mockSeksiList, formatRupiah, type KuitansiRow } from '@/data/mockData';
import { PageHeader, StatusBadge, GatekeeperBanner } from '@/components/ui/Primitives';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SpjForm } from '@/pages/modules/spj/SpjForm';
import { useDocumentStore } from '@/state/documentStore';

type SpjView = { kind: 'list' } | { kind: 'form'; kuitansiId: string };
type PendingAction = { kind: 'ajukan' | 'lepas'; row: KuitansiRow } | null;

export function SpjModule({ session }: { session: SessionUser }) {
  if (session.role !== 'pptk') {
    return (
      <div className="animate-fade-in">
        <PageHeader title="SPJ & Form Dinamis" subtitle="Akses ditolak" />
        <div className="surface-card p-10 flex flex-col items-center justify-center text-center min-h-[320px]">
          <Lock className="h-8 w-8 text-status-red mb-4" />
          <p className="text-sm text-ink-secondary max-w-md">Hanya PPTK yang dapat membuat dan mengelola SPJ. (D02 §5, D03 §4)</p>
        </div>
      </div>
    );
  }

  return <PptkSpj session={session} />;
}

function PptkSpj({ session }: { session: SessionUser }) {
  const mySeksi = mockSeksiList[0];
  const ta = session.activeTa;
  const belumSeimbang = mockSeksiList.filter((s) => s.alokasiStatus !== 'tuntas');
  const gatekeeperActive = belumSeimbang.length > 0;

  const { rows, spjByKuitansi, saveSpjDraft, ajukanSpj, lepasSpj } = useDocumentStore();
  const [view, setView] = useState<SpjView>({ kind: 'list' });
  const [pending, setPending] = useState<PendingAction>(null);

  if (view.kind === 'form') {
    const kuitansi = rows.find((r) => r.id === view.kuitansiId);
    if (kuitansi) {
      return (
        <SpjForm
          kuitansi={kuitansi}
          initial={spjByKuitansi[kuitansi.id] ?? null}
          onSaveDraft={(detail) => {
            saveSpjDraft(kuitansi.id, detail);
            setView({ kind: 'list' });
          }}
          onBack={() => setView({ kind: 'list' })}
        />
      );
    }
  }

  const handleConfirm = () => {
    if (!pending) return;
    if (pending.kind === 'ajukan') ajukanSpj(pending.row.id);
    else lepasSpj(pending.row.id);
    setPending(null);
  };

  const draftCount = rows.filter((r) => r.spjStatus === 'draft').length;
  const terkunciCount = rows.filter((r) => r.spjStatus === 'terkunci' || r.spjStatus === 'menunggu_bku').length;

  return (
    <div className="animate-fade-in">
      <PageHeader title="SPJ & Form Dinamis" subtitle={`${mySeksi.name} • TA ${ta?.taYear ?? 2026}`} mode="PRO" />

      {gatekeeperActive && <GatekeeperBanner seksiNames={belumSeimbang.map((s) => s.name)} />}

      <div className="surface-card mb-5 px-4 py-3 text-xs text-ink-secondary">
        <span className="text-ink-primary font-medium">{draftCount}</span> draft •{' '}
        <span className="text-status-yellow">{terkunciCount}</span> terkunci atau menunggu BKU
      </div>

      <div className="surface-card">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-ink-primary">Daftar Kuitansi dan SPJ</h2>
        </div>
        <ul className="divide-y divide-border">
          {rows.map((r) => {
            const canCreate = r.spjStatus === 'belum' && r.status === 'aktif' && !gatekeeperActive;
            return (
              <li key={r.id} className="px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm text-ink-primary">{r.uraian}</div>
                    <div className="text-2xs text-ink-muted">
                      {r.penerima} • <span className="font-mono">{r.kodeRekening}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono tnum text-xs text-ink-primary">{formatRupiah(r.bruto)}</span>
                    <StatusBadge status={r.spjStatus} type="spj" />
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap justify-end gap-1">
                  {r.spjStatus === 'belum' && (
                    <button
                      type="button"
                      disabled={!canCreate}
                      className={`btn-amber px-3 py-1 text-xs flex items-center gap-1.5 ${canCreate ? '' : 'opacity-50 cursor-not-allowed'}`}
                      onClick={() => setView({ kind: 'form', kuitansiId: r.id })}
                    >
                      <Plus className="h-3 w-3" aria-hidden="true" />
                      Buat SPJ
                    </button>
                  )}
                  {r.spjStatus === 'draft' && (
                    <>
                      <button
                        type="button"
                        className="btn-ghost px-2 py-1 text-xs flex items-center gap-1"
                        onClick={() => setView({ kind: 'form', kuitansiId: r.id })}
                      >
                        <Pencil className="h-3 w-3" aria-hidden="true" />
                        Ubah
                      </button>
                      <button
                        type="button"
                        className="btn-teal-outline px-2 py-1 text-xs flex items-center gap-1"
                        onClick={() => setPending({ kind: 'ajukan', row: r })}
                      >
                        <Send className="h-3 w-3" aria-hidden="true" />
                        Ajukan ke Verifikator
                      </button>
                      <button
                        type="button"
                        className="px-2 py-1 text-xs flex items-center gap-1 rounded-md text-status-red hover:bg-status-red/10 transition-colors"
                        onClick={() => setPending({ kind: 'lepas', row: r })}
                      >
                        <Undo2 className="h-3 w-3" aria-hidden="true" />
                        Lepas SPJ
                      </button>
                    </>
                  )}
                  {(r.spjStatus === 'terkunci' || r.spjStatus === 'menunggu_bku' || r.spjStatus === 'dibukukan') && (
                    <span className="flex items-center gap-1 text-2xs text-ink-muted py-1">
                      <Lock className="h-3 w-3" aria-hidden="true" />
                      Terkunci selama SPJ masih terkait
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {pending && (
        <ConfirmDialog
          title={pending.kind === 'ajukan' ? 'Ajukan SPJ ke Verifikator?' : 'Lepas SPJ draft ini?'}
          message={
            pending.kind === 'ajukan'
              ? 'Setelah diajukan, SPJ dan kuitansi terkait terkunci dan tidak dapat diubah sampai dikembalikan Verifikator.'
              : 'Draft SPJ akan dihapus dan kuitansi kembali Aktif.'
          }
          confirmLabel={pending.kind === 'ajukan' ? 'Ya, ajukan' : 'Ya, lepas'}
          onConfirm={handleConfirm}
          onCancel={() => setPending(null)}
        />
      )}
    </div>
  );
}
