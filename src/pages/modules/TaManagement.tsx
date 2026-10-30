import { useMemo, useState } from 'react';
import { ArrowRight, CalendarRange, Plus, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PageHeader, StatusBadge } from '@/components/ui/Primitives';
import { formatRupiahFull } from '@/data/mockData';
import { buildChecklist, initialTaRecords, type TaRecord } from '@/data/taMock';
import { NEXT_STATUS, TRANSITION_LABEL, activationBlocker, canDelete } from '@/lib/taLifecycle';
import { TaCreateDialog } from '@/pages/modules/ta/TaCreateDialog';
import { TaStatusDialog } from '@/pages/modules/ta/TaStatusDialog';

export function TaManagement() {
  const [records, setRecords] = useState<TaRecord[]>(initialTaRecords);
  const [createOpen, setCreateOpen] = useState(false);
  const [statusTaId, setStatusTaId] = useState<string | null>(null);
  const [deleteTaId, setDeleteTaId] = useState<string | null>(null);

  const sorted = useMemo(() => [...records].sort((a, b) => b.tahun - a.tahun), [records]);
  const statusTa = records.find((r) => r.id === statusTaId) ?? null;
  const deleteTa = records.find((r) => r.id === deleteTaId) ?? null;
  const blocker =
    statusTa && statusTa.status === 'draft' ? activationBlocker(records, statusTa) : null;

  function updateTa(id: string, change: (ta: TaRecord) => TaRecord) {
    setRecords((prev) => prev.map((r) => (r.id === id ? change(r) : r)));
  }

  function toggleChecklist(itemId: string) {
    if (!statusTa) return;
    updateTa(statusTa.id, (ta) => ({
      ...ta,
      checklist: ta.checklist.map((item) =>
        item.id === itemId ? { ...item, done: !item.done } : item,
      ),
    }));
  }

  function confirmTransition() {
    if (!statusTa || blocker) return;
    const next = NEXT_STATUS[statusTa.status];
    if (!next) return;
    updateTa(statusTa.id, (ta) => ({ ...ta, status: next }));
    setStatusTaId(null);
  }

  function createTa(tahun: number) {
    const ta: TaRecord = {
      id: `ta-${tahun}`,
      tahun,
      nama: `Tahun Anggaran ${tahun}`,
      status: 'draft',
      pernahBertransaksi: false,
      paguInduk: 0,
      checklist: buildChecklist(false),
    };
    setRecords((prev) => [...prev, ta]);
    setCreateOpen(false);
  }

  function deleteSelectedTa() {
    if (!deleteTa) return;
    setRecords((prev) => prev.filter((r) => r.id !== deleteTa.id));
    setDeleteTaId(null);
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Tahun Anggaran"
        subtitle="Kelola siklus hidup TA. Setiap perpindahan status dilakukan manual oleh Admin."
      />

      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="btn-amber flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah TA</span>
        </button>
      </div>

      <ul className="space-y-3">
        {sorted.map((ta) => {
          const transitionLabel = TRANSITION_LABEL[ta.status];
          return (
            <li
              key={ta.id}
              className="surface-card px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <CalendarRange className="h-5 w-5 text-teal shrink-0" strokeWidth={1.5} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-sm font-semibold text-ink-primary">{ta.nama}</span>
                  <StatusBadge status={ta.status} />
                </div>
                <div className="text-2xs text-ink-muted mt-1 font-mono tnum">
                  Pagu induk:{' '}
                  {ta.paguInduk > 0 ? formatRupiahFull(ta.paguInduk) : 'Belum ditetapkan'}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {canDelete(ta) && (
                  <button
                    type="button"
                    onClick={() => setDeleteTaId(ta.id)}
                    aria-label={`Hapus ${ta.nama}`}
                    className="flex items-center gap-1.5 text-sm font-medium text-status-red px-3 py-2 hover:bg-status-red/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Hapus</span>
                  </button>
                )}
                {transitionLabel && (
                  <button
                    type="button"
                    onClick={() => setStatusTaId(ta.id)}
                    className="btn-teal-outline flex items-center gap-1.5"
                  >
                    <span>{transitionLabel}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {createOpen && (
        <TaCreateDialog
          existingYears={records.map((r) => r.tahun)}
          onCreate={createTa}
          onClose={() => setCreateOpen(false)}
        />
      )}

      {statusTa && (
        <TaStatusDialog
          ta={statusTa}
          blocker={blocker}
          onToggleChecklist={toggleChecklist}
          onConfirm={confirmTransition}
          onClose={() => setStatusTaId(null)}
        />
      )}

      {deleteTa && (
        <ConfirmDialog
          title="Hapus Tahun Anggaran?"
          message={`${deleteTa.nama} akan dihapus. Tindakan ini tidak dapat dibatalkan.`}
          confirmLabel="Hapus"
          onConfirm={deleteSelectedTa}
          onCancel={() => setDeleteTaId(null)}
        />
      )}
    </div>
  );
}
