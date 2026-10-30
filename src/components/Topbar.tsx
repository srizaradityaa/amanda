import { LogOut, ShieldCheck } from 'lucide-react';
import type { SessionUser } from '@/auth/types';
import { roleShortLabel, roleFullLabel } from '@/config/navigation';

interface TopbarProps {
  session: SessionUser;
  onLogout: () => void;
}

// Mock progress figures per role — frontend placeholders for ticker/mini bar.
type ProgressInfo = { pagu?: string; realisasi?: string; sisa?: string; serapan?: number; label: string };
const progressByRole: Record<string, ProgressInfo | null> = {
  bendahara: {
    label: 'Instansi',
    pagu: '12.480.000.000',
    realisasi: '4.318.500.000',
    sisa: '8.161.500.000',
    serapan: 34.6,
  },
  pa_kpa: {
    label: 'Instansi',
    pagu: '12.480.000.000',
    realisasi: '4.318.500.000',
    sisa: '8.161.500.000',
    serapan: 34.6,
  },
  verifikator: {
    label: 'Instansi',
    pagu: '12.480.000.000',
    realisasi: '4.318.500.000',
    sisa: '8.161.500.000',
    serapan: 34.6,
  },
  pptk: {
    label: 'Seksi Perencanaan & Evaluasi',
    pagu: '1.840.000.000',
    realisasi: '612.400.000',
    sisa: '1.227.600.000',
    serapan: 33.3,
  },
  admin: {
    label: 'Pagu Induk',
    pagu: '12.480.000.000',
  },
  auditor: null,
};

export function Topbar({ session, onLogout }: TopbarProps) {
  const isAuditor = session.role === 'auditor';
  const ta = session.activeTa;
  const prog = progressByRole[session.role];

  return (
    <header className="h-14 bg-surface border-b border-border flex items-center px-4 sm:px-6 gap-4 shrink-0">
      {/* TA aktif */}
      {ta && (
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-2xs uppercase tracking-wider text-ink-muted">TA</span>
          <span className="font-mono font-semibold text-sm text-ink-primary">{ta.taYear}</span>
        </div>
      )}

      <div className="w-px h-6 bg-border hidden sm:block" />

      {/* Peran aktif */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-2xs uppercase tracking-wider text-ink-muted hidden sm:inline">Peran</span>
        <span className="text-sm text-ink-primary font-medium">{roleShortLabel[session.role]}</span>
        {session.activeTa?.seksiName && (
          <span className="text-2xs text-ink-secondary hidden md:inline truncate max-w-[200px]">
            • {session.activeTa.seksiName}
          </span>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Mini progress bar — role-aware, NOT for auditor */}
      {!isAuditor && prog && (
        <div className="hidden lg:flex items-center gap-4">
          {prog.pagu && (
            <div className="flex flex-col items-end leading-tight">
              <span className="text-2xs uppercase text-ink-muted">
                {prog.label === 'Pagu Induk' ? 'Pagu Induk' : 'Pagu'}
              </span>
              <span className="font-mono text-xs tnum text-ink-primary">{prog.pagu}</span>
            </div>
          )}
          {prog.realisasi && (
            <div className="flex flex-col items-end leading-tight">
              <span className="text-2xs uppercase text-ink-muted">Realisasi</span>
              <span className="font-mono text-xs tnum text-status-green">{prog.realisasi}</span>
            </div>
          )}
          {prog.sisa && (
            <div className="flex flex-col items-end leading-tight">
              <span className="text-2xs uppercase text-ink-muted">Sisa SPD</span>
              <span className="font-mono text-xs tnum text-teal">{prog.sisa}</span>
            </div>
          )}
          {prog.serapan !== undefined && (
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-border overflow-hidden">
                <div
                  className="h-full bg-amber transition-all"
                  style={{ width: `${prog.serapan}%` }}
                />
              </div>
              <span className="font-mono text-xs tnum text-ink-primary w-12 text-right">
                {prog.serapan.toFixed(1)}%
              </span>
            </div>
          )}
          {prog.serapan === undefined && prog.pagu && (
            // Admin: only Pagu Induk indicator dot
            <span className="status-dot bg-amber" />
          )}
        </div>
      )}

      <div className="w-px h-6 bg-border" />

      {/* User */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="h-8 w-8 bg-bg border border-border-strong flex items-center justify-center shrink-0">
          <ShieldCheck className="h-4 w-4 text-ink-secondary" />
        </div>
        <div className="hidden sm:flex flex-col leading-tight max-w-[180px]">
          <span className="text-xs font-medium text-ink-primary truncate">{session.displayName}</span>
          <span className="text-2xs text-ink-muted truncate" title={roleFullLabel[session.role]}>
            {roleFullLabel[session.role]}
          </span>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={onLogout}
        className="btn-ghost flex items-center gap-1.5 shrink-0"
        title="Logout & hancurkan sesi"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Keluar</span>
      </button>
    </header>
  );
}


