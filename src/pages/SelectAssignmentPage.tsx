import { useState } from 'react';
import { ArrowLeft, Briefcase, CalendarRange, ChevronRight, LogOut, ShieldCheck } from 'lucide-react';
import type { SessionUser, TaAssignment } from '@/auth/types';
import { roleFullLabel } from '@/config/navigation';
import { formatTanggalWita } from '@/lib/formatDate';

function jabatanTitle(a: TaAssignment): string {
  const label = roleFullLabel[a.role];
  return a.delegasi ? `Plh. ${label}` : label;
}

interface SelectAssignmentPageProps {
  user: SessionUser;
  onSelect: (assignment: TaAssignment) => void;
  onLogout: () => void;
}

export function SelectAssignmentPage({ user, onSelect, onLogout }: SelectAssignmentPageProps) {
  const taOptions = user.assignments.filter(
    (a, i, all) => all.findIndex((b) => b.taId === a.taId) === i,
  );
  const [taId, setTaId] = useState<string | null>(
    taOptions.length === 1 ? taOptions[0].taId : null,
  );

  const jabatanOptions = taId ? user.assignments.filter((a) => a.taId === taId) : [];
  const isPickingTa = taId === null;

  function chooseTa(option: TaAssignment) {
    const jabatan = user.assignments.filter((a) => a.taId === option.taId);
    if (jabatan.length === 1) {
      onSelect(jabatan[0]);
    } else {
      setTaId(option.taId);
    }
  }

  return (
    <div className="min-h-screen bg-bg text-ink-primary flex items-center justify-center p-6">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 bg-surface border border-border-strong flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-amber" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink-primary">
              {isPickingTa ? 'Pilih Tahun Anggaran' : 'Pilih Jabatan'}
            </h1>
            <p className="text-sm text-ink-secondary mt-0.5">
              Halo, {user.displayName}. {isPickingTa
                ? 'Anda memiliki penugasan di lebih dari satu TA.'
                : 'Anda memegang lebih dari satu jabatan pada TA ini.'}
            </p>
          </div>
        </div>

        {isPickingTa ? (
          <ul className="space-y-2">
            {taOptions.map((option) => {
              const count = user.assignments.filter((a) => a.taId === option.taId).length;
              return (
                <li key={option.taId}>
                  <button
                    type="button"
                    onClick={() => chooseTa(option)}
                    className="w-full surface-card px-4 py-4 flex items-center gap-4 text-left transition-colors hover:bg-surface-hover hover:border-border-strong group"
                  >
                    <CalendarRange className="h-5 w-5 text-teal shrink-0" strokeWidth={1.5} />
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm font-semibold text-ink-primary">
                        Tahun Anggaran {option.taYear}
                      </div>
                      <div className="text-2xs text-ink-muted mt-0.5">
                        {count} penugasan
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-ink-muted group-hover:text-ink-secondary" />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <>
            <ul className="space-y-2">
              {jabatanOptions.map((option) => (
                <li key={`${option.taId}-${option.role}-${option.seksiId ?? ''}`}>
                  <button
                    type="button"
                    onClick={() => onSelect(option)}
                    className="w-full surface-card px-4 py-4 flex items-center gap-4 text-left transition-colors hover:bg-surface-hover hover:border-border-strong group"
                  >
                    <Briefcase className="h-5 w-5 text-amber shrink-0" strokeWidth={1.5} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-ink-primary">
                        {jabatanTitle(option)}
                      </div>
                      <div className="text-2xs text-ink-muted mt-0.5 truncate">
                        {option.seksiName ?? 'Tanpa seksi'} • TA {option.taYear}
                        {option.delegasi &&
                          ` • Berakhir ${formatTanggalWita(option.delegasi.berakhir)}`}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-ink-muted group-hover:text-ink-secondary" />
                  </button>
                </li>
              ))}
            </ul>
            {taOptions.length > 1 && (
              <button
                type="button"
                onClick={() => setTaId(null)}
                className="btn-ghost mt-4 flex items-center gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Pilih TA lain</span>
              </button>
            )}
          </>
        )}

        <div className="mt-8 pt-6 border-t border-border flex justify-end">
          <button type="button" onClick={onLogout} className="btn-ghost flex items-center gap-1.5">
            <LogOut className="h-4 w-4" />
            <span>Keluar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
