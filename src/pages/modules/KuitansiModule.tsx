import { useState } from 'react';
import { Receipt, Lock, Plus, Pencil, Trash2, FileText, Send, Undo2 } from 'lucide-react';
import type { SessionUser } from '@/auth/types';
import {
  mockSeksiList,
  formatRupiah,
  formatDateID,
  type KuitansiRow,
} from '@/data/mockData';
import { useKuitansiSpj } from '@/state/KuitansiSpjContext';
import { PageHeader, StatusBadge, GatekeeperBanner } from '@/components/ui/Primitives';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { KuitansiForm, type KuitansiInput } from '@/pages/modules/kuitansi/KuitansiForm';
import { SpjCreateDialog } from '@/pages/modules/spj/SpjCreateDialog';

type KuitansiView = { kind: 'list' } | { kind: 'form'; id: string | null };

const TODAY_ISO = '2026-10-30';

export function KuitansiModule({ session }: { session: SessionUser }) {
  if (session.role !== 'pptk') {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Kuitansi" subtitle="Akses ditolak" />
        <div className="surface-card p-10 flex flex-col items-center justify-center text-center min-h-[320px]">
          <Lock className="h-8 w-8 text-status-red mb-4" />
          <p className="text-sm text-ink-secondary max-w-md">Hanya PPTK yang dapat membuat dan mengelola kuitansi. (D02 §2, D03 §4)</p>
        </div>
      </div>
    );
  }

  return <PptkKuitansi session={session} />;
}

function PptkKuitansi({ session }: { session: SessionUser }) {
  const mySeksi = mockSeksiList[0];
  const ta = session.activeTa;
  const belumSeimbang = mockSeksiList.filter((s) => s.alokasiStatus !== 'tuntas');
  const gatekeeperActive = belumSeimbang.length > 0;

  const { rows, saveKuitansi, cancelKuitansi, createSpj, ajukanSpj, lepasSpj } = useKuitansiSpj();
  const [view, setView] = useState<KuitansiView>({ kind: 'list' });
  const [pendingCancel, setPendingCancel] = useState<KuitansiRow | null>(null);
  const [spjAction, setSpjAction] = useState<{ kind: 'create' | 'ajukan' | 'lepas'; row: KuitansiRow } | null>(null);
  const [ajukanError, setAjukanError] = useState<string | null>(null);

  const editingRow = view.kind === 'form' && view.id ? rows.find((r) => r.id === view.id) ?? null : null;

  const handleSave = (input: KuitansiInput) => {
    if (view.kind !== 'form') return;
    saveKuitansi(view.id, input);
    setView({ kind: 'list' });
  };

  const handleConfirmCancel = () => {
    if (!pendingCancel) return;
    cancelKuitansi(pendingCancel.id);
    setPendingCancel(null);
  };

  const handleCreateSpj = (jenisBelanja: string) => {
    if (spjAction?.kind !== 'create') return;
    createSpj(spjAction.row.id, jenisBelanja);
    setSpjAction(null);
  };

  const handleAjukanSpj = () => {
    if (spjAction?.kind !== 'ajukan') return;
    setAjukanError(ajukanSpj(spjAction.row.id));
    setSpjAction(null);
  };

  const handleLepasSpj = () => {
    if (spjAction?.kind !== 'lepas') return;
    lepasSpj(spjAction.row.id);
    setSpjAction(null);
  };

  if (view.kind === 'form') {
    return (
      <KuitansiForm
        seksiId={mySeksi.id}
        tanggalHariIni={TODAY_ISO}
        initial={editingRow}
        onSave={handleSave}
        onBack={() => setView({ kind: 'list' })}
      />
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Kuitansi" subtitle={`${mySeksi.name} • TA ${ta?.taYear ?? 2026}`} mode="PRO" />

      {gatekeeperActive && <GatekeeperBanner seksiNames={belumSeimbang.map((s) => s.name)} />}

      {ajukanError && (
        <div role="alert" className="surface-card mb-5 px-4 py-3 border-status-red/50 text-xs text-status-red leading-relaxed">
          {ajukanError}
        </div>
      )}

      <div className="surface-card mb-5 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-ink-secondary">
          <span className="text-ink-primary font-medium">{rows.length}</span> kuitansi •{' '}
          <span className="text-status-yellow">{rows.filter((r) => r.status === 'terkunci').length}</span> terkunci •{' '}
          <span className="text-status-green">{rows.filter((r) => r.spjStatus === 'dibukukan').length}</span> dibukukan
        </div>
        <button
          type="button"
          className={`btn-amber text-xs px-3 py-1.5 flex items-center gap-1.5 ${gatekeeperActive ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={gatekeeperActive}
          onClick={() => setView({ kind: 'form', id: null })}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Buat Kuitansi
        </button>
      </div>

      <div className="surface-card">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-ink-primary">Daftar Kuitansi</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-hover">
                <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">No.</th>
                <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Uraian</th>
                <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2 hidden md:table-cell">Kode Rekening</th>
                <th className="text-right font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Bruto</th>
                <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2 hidden lg:table-cell">Tanggal</th>
                <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Status</th>
                <th className="text-left font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">SPJ</th>
                <th className="text-right font-medium text-2xs uppercase tracking-wider text-ink-muted px-4 py-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => {
                const isAktif = r.status === 'aktif';
                return (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors h-10">
                    <td className="px-4 py-1 font-mono text-xs text-ink-muted">{idx + 1}</td>
                    <td className="px-4 py-1 text-xs text-ink-primary">
                      <div>{r.uraian}</div>
                      <div className="text-2xs text-ink-muted">{r.penerima}</div>
                    </td>
                    <td className="px-4 py-1 font-mono text-xs text-ink-secondary hidden md:table-cell">{r.kodeRekening}</td>
                    <td className="px-4 py-1 text-right font-mono tnum text-xs text-ink-primary">{formatRupiah(r.bruto)}</td>
                    <td className="px-4 py-1 text-xs text-ink-secondary hidden lg:table-cell">{formatDateID(r.tanggal)}</td>
                    <td className="px-4 py-1"><StatusBadge status={r.status} type="kuitansi" /></td>
                    <td className="px-4 py-1"><StatusBadge status={r.spjStatus} type="spj" /></td>
                    <td className="px-4 py-1">
                      {isAktif ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            className="btn-ghost px-2 py-1 text-xs flex items-center gap-1"
                            onClick={() => setView({ kind: 'form', id: r.id })}
                          >
                            <Pencil className="h-3 w-3" aria-hidden="true" />
                            Ubah
                          </button>
                          <button
                            type="button"
                            className="px-2 py-1 text-xs flex items-center gap-1 rounded-md text-status-red hover:bg-status-red/10 transition-colors"
                            onClick={() => setPendingCancel(r)}
                          >
                            <Trash2 className="h-3 w-3" aria-hidden="true" />
                            Batalkan
                          </button>
                          <button
                            type="button"
                            disabled={gatekeeperActive}
                            onClick={() => setSpjAction({ kind: 'create', row: r })}
                            className="btn-ghost px-2 py-1 text-xs flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <FileText className="h-3 w-3" aria-hidden="true" />
                            Buat SPJ
                          </button>
                        </div>
                      ) : r.spjStatus === 'draft' ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setSpjAction({ kind: 'ajukan', row: r })}
                            className="btn-ghost px-2 py-1 text-xs flex items-center gap-1 text-status-green"
                          >
                            <Send className="h-3 w-3" aria-hidden="true" />
                            Ajukan
                          </button>
                          <button
                            type="button"
                            onClick={() => setSpjAction({ kind: 'lepas', row: r })}
                            className="btn-ghost px-2 py-1 text-xs flex items-center gap-1"
                          >
                            <Undo2 className="h-3 w-3" aria-hidden="true" />
                            Tarik Draft
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1 text-2xs text-ink-muted">
                          <Lock className="h-3 w-3" aria-hidden="true" />
                          Terkunci SPJ
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 surface-card px-4 py-3 flex items-start gap-3">
        <Receipt className="h-5 w-5 text-ink-secondary shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-xs text-ink-secondary leading-relaxed">
          <span className="text-ink-primary font-medium">Siklus kuitansi:</span> Aktif → Terkunci (setelah masuk SPJ) → tidak dapat diedit. Pembatalan kuitansi Aktif tidak meninggalkan jejak. Kuitansi terkunci tidak dapat diubah atau dibatalkan. (D02 §2-4, D03 §4)
        </p>
      </div>

      {spjAction?.kind === 'create' && (
        <SpjCreateDialog
          kuitansi={spjAction.row}
          onConfirm={handleCreateSpj}
          onClose={() => setSpjAction(null)}
        />
      )}

      {spjAction?.kind === 'ajukan' && (
        <ConfirmDialog
          title="Ajukan SPJ ke Verifikator?"
          message={`SPJ untuk "${spjAction.row.uraian}" akan terkunci dan tidak dapat diubah sampai Verifikator mengembalikannya ke Draft.`}
          confirmLabel="Ya, ajukan"
          onConfirm={handleAjukanSpj}
          onCancel={() => setSpjAction(null)}
        />
      )}

      {spjAction?.kind === 'lepas' && (
        <ConfirmDialog
          title="Tarik SPJ Draft?"
          message={`SPJ draft untuk "${spjAction.row.uraian}" akan dihapus dan kuitansi kembali Aktif. Tidak meninggalkan jejak audit.`}
          confirmLabel="Ya, tarik draft"
          onConfirm={handleLepasSpj}
          onCancel={() => setSpjAction(null)}
        />
      )}

      {pendingCancel && (
        <ConfirmDialog
          title="Batalkan kuitansi ini?"
          message={`Kuitansi "${pendingCancel.uraian}" senilai ${formatRupiah(pendingCancel.bruto)} akan dihapus permanen. Pembatalan tidak meninggalkan jejak audit.`}
          confirmLabel="Ya, batalkan"
          onConfirm={handleConfirmCancel}
          onCancel={() => setPendingCancel(null)}
        />
      )}
    </div>
  );
}
