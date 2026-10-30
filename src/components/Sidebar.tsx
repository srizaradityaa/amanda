import { ShieldCheck } from 'lucide-react';
import type { SessionUser } from '@/auth/types';
import { roleNav, roleFullLabel } from '@/config/navigation';

interface SidebarProps {
  session: SessionUser;
  activeId: string;
  onNavigate: (id: string) => void;
}

export function Sidebar({ session, activeId, onNavigate }: SidebarProps) {
  const sections = roleNav[session.role];

  return (
    <aside className="w-60 shrink-0 bg-surface border-r border-border flex flex-col h-full">
      {/* Brand */}
      <div className="h-14 flex items-center gap-2.5 px-5 border-b border-border shrink-0">
        <div className="h-8 w-8 bg-bg border border-border-strong flex items-center justify-center">
          <ShieldCheck className="h-4.5 w-4.5 text-amber" strokeWidth={1.5} />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold text-ink-primary tracking-tight">AMANDA</div>
          <div className="text-2xs text-ink-muted">Manajemen Data Anggaran</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {sections.map((section, si) => (
          <div key={section.heading} className={si > 0 ? 'mt-6' : ''}>
            <h3 className="px-2 mb-2 text-2xs font-semibold uppercase tracking-wider text-ink-muted">
              {section.heading}
            </h3>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = item.id === activeId;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => onNavigate(item.id)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-sm transition-colors group ${
                        active
                          ? 'bg-bg text-ink-primary border-l-2 border-amber'
                          : 'text-ink-secondary hover:text-ink-primary hover:bg-surface-hover border-l-2 border-transparent'
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          active ? 'text-amber' : 'text-ink-muted group-hover:text-ink-secondary'
                        }`}
                        strokeWidth={1.75}
                      />
                      <span className="truncate">{item.label}</span>
                      {item.mode === 'pro' && (
                        <span className="ml-auto text-2xs text-ink-muted font-mono">PRO</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer — role badge */}
      <div className="border-t border-border px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className="status-dot bg-amber" />
          <span className="text-2xs text-ink-muted truncate" title={roleFullLabel[session.role]}>
            {roleFullLabel[session.role]}
          </span>
        </div>
      </div>
    </aside>
  );
}
