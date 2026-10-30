import { Construction, type LucideIcon } from 'lucide-react';
import { roleFullLabel } from '@/config/navigation';
import type { SessionUser } from '@/auth/types';

interface PlaceholderProps {
  title: string;
  session: SessionUser;
  icon?: LucideIcon;
}

export function PlaceholderView({ title, session, icon: Icon }: PlaceholderProps) {
  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink-primary">{title}</h1>
        <p className="text-sm text-ink-secondary mt-1">
          {roleFullLabel[session.role]}
          {session.activeTa?.seksiName && ` • ${session.activeTa.seksiName}`}
          {session.activeTa && ` • TA ${session.activeTa.taYear}`}
        </p>
      </div>

      <div className="surface-card p-10 flex flex-col items-center justify-center text-center min-h-[320px]">
        <div className="h-12 w-12 bg-bg border border-border-strong flex items-center justify-center mb-4">
          {Icon ? (
            <Icon className="h-6 w-6 text-amber" strokeWidth={1.5} />
          ) : (
            <Construction className="h-6 w-6 text-ink-muted" strokeWidth={1.5} />
          )}
        </div>
        <h2 className="text-base font-semibold text-ink-primary mb-1.5">Modul dalam pengembangan</h2>
        <p className="text-sm text-ink-secondary max-w-md leading-relaxed">
          Antarmuka modul ini sedang disiapkan sesuai spesifikasi AMANDA. Struktur tata letak,
          tema Treasury, dan aturan cakupan peran telah diterapkan pada kerangka navigasi.
        </p>
        <div className="mt-6 flex items-center gap-2 text-2xs text-ink-muted font-mono">
          <span className="px-2 py-1 border border-border bg-bg">{session.role.toUpperCase()}</span>
          <span className="px-2 py-1 border border-border bg-bg">{title}</span>
        </div>
      </div>
    </div>
  );
}
