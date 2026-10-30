import { useMemo, useState } from 'react';
import { Building2, Pencil, Plus, Archive } from 'lucide-react';
import { PageHeader, StatusBadge } from '@/components/ui/Primitives';
import { initialSotkUnits, type SotkUnit } from '@/data/sotkMock';
import { addUnit, archiveUnit, correctUnitName, reorganizeUnit, type RuleResult } from '@/lib/sotkRules';
import { formatTanggalWita } from '@/lib/formatDate';
import { SotkAddDialog } from '@/pages/modules/sotk/SotkAddDialog';
import { SotkEditDialog } from '@/pages/modules/sotk/SotkEditDialog';
import { SotkArchiveDialog } from '@/pages/modules/sotk/SotkArchiveDialog';

type DialogState =
  | { kind: 'add' }
  | { kind: 'edit'; unitId: string }
  | { kind: 'archive'; unitId: string }
  | null;

function compareUnits(a: SotkUnit, b: SotkUnit): number {
  if (a.status !== b.status) return a.status === 'aktif' ? -1 : 1;
  return a.nama.localeCompare(b.nama, 'id');
}

export function SotkManagement() {
  const [units, setUnits] = useState<SotkUnit[]>(initialSotkUnits);
  const [dialog, setDialog] = useState<DialogState>(null);

  const sorted = useMemo(() => [...units].sort(compareUnits), [units]);
  const namaById = useMemo(() => new Map(units.map((u) => [u.id, u.nama])), [units]);
  const activeCount = units.filter((u) => u.status === 'aktif').length;

  const dialogUnit =
    dialog && dialog.kind !== 'add' ? units.find((u) => u.id === dialog.unitId) ?? null : null;

  function applyResult(result: RuleResult): string | null {
    if ('error' in result) return result.error;
    setUnits(result.units);
    setDialog(null);
    return null;
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Master SOTK"
        subtitle={`${activeCount} unit aktif • Daftar datar, tanpa hierarki. Identitas unit dibuat otomatis oleh sistem.`}
      />

      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={() => setDialog({ kind: 'add' })}
          className="btn-amber flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Unit Baru</span>
        </button>
      </div>

      <div className="surface-card overflow-x-auto">
        <table className="w-full text-sm min-w-[860px]">
          <thead>
            <tr className="border-b border-border text-left text-2xs uppercase tracking-wider text-ink-muted">
              <th className="px-5 py-3 font-medium">Nama Unit</th>
              <th className="px-4 py-3 font-medium">TMT Mulai</th>
              <th className="px-4 py-3 font-medium">TMT Selesai</th>
              <th className="px-4 py-3 font-medium">Dasar Hukum</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((unit) => {
              const isActive = unit.status === 'aktif';
              const predecessor = unit.penggantiDariId ? namaById.get(unit.penggantiDariId) : null;
              return (
                <tr key={unit.id} className="border-b border-border/60 last:border-b-0 hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Building2 className={`h-4 w-4 shrink-0 ${isActive ? 'text-teal' : 'text-ink-muted'}`} strokeWidth={1.5} />
                      <div className="min-w-0">
                        <div className={isActive ? 'font-medium text-ink-primary' : 'text-ink-secondary'}>{unit.nama}</div>
                        {predecessor && (
                          <div className="text-2xs text-ink-muted mt-0.5">Menggantikan {predecessor}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-mono tnum text-ink-secondary whitespace-nowrap">
                    {formatTanggalWita(unit.tmtMulai)}
                  </td>
                  <td className="px-4 py-3.5 font-mono tnum text-ink-secondary whitespace-nowrap">
                    {unit.tmtSelesai ? formatTanggalWita(unit.tmtSelesai) : '-'}
                  </td>
                  <td className="px-4 py-3.5 text-ink-secondary">{unit.dasarHukum}</td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={unit.status} />
                  </td>
                  <td className="px-5 py-3.5">
                    {isActive ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDialog({ kind: 'edit', unitId: unit.id })}
                          className="flex items-center gap-1.5 text-xs font-medium text-teal px-2.5 py-1.5 hover:bg-teal/10 transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span>Ubah</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDialog({ kind: 'archive', unitId: unit.id })}
                          className="flex items-center gap-1.5 text-xs font-medium text-status-red px-2.5 py-1.5 hover:bg-status-red/10 transition-colors"
                        >
                          <Archive className="h-3.5 w-3.5" />
                          <span>Arsipkan</span>
                        </button>
                      </div>
                    ) : (
                      <div className="text-right text-2xs text-ink-muted">Read-only</div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {dialog?.kind === 'add' && (
        <SotkAddDialog
          onSubmit={(input) => applyResult(addUnit(units, input))}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog?.kind === 'edit' && dialogUnit && (
        <SotkEditDialog
          unit={dialogUnit}
          onReorganize={(input) => applyResult(reorganizeUnit(units, dialogUnit.id, input))}
          onCorrectName={(nama) => applyResult(correctUnitName(units, dialogUnit.id, nama))}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog?.kind === 'archive' && dialogUnit && (
        <SotkArchiveDialog
          unit={dialogUnit}
          onArchive={(tmtSelesai) => applyResult(archiveUnit(units, dialogUnit.id, tmtSelesai))}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}
