import type { SessionUser } from '@/auth/types';
import { Topbar } from '@/components/Topbar';
import { Sidebar } from '@/components/Sidebar';
import { PlaceholderView } from '@/components/PlaceholderView';
import { AccessDeniedView } from '@/components/AccessDeniedView';
import { findNavItem, roleNav } from '@/config/navigation';
import { DEFAULT_MODULE_ID } from '@/router/routes';
import { AdminDashboard } from '@/pages/dashboards/AdminDashboard';
import { BendaharaDashboard } from '@/pages/dashboards/BendaharaDashboard';
import { PptkDashboard } from '@/pages/dashboards/PptkDashboard';
import { VerifikatorDashboard } from '@/pages/dashboards/VerifikatorDashboard';
import { PaKpaDashboard } from '@/pages/dashboards/PaKpaDashboard';
import { AuditorDashboard } from '@/pages/dashboards/AuditorDashboard';
import { DrillDownAnggaran } from '@/pages/modules/DrillDownAnggaran';
import { JejakAudit } from '@/pages/modules/JejakAudit';
import { KatalogLaporan } from '@/pages/modules/KatalogLaporan';
import { AlokasiPagu } from '@/pages/modules/AlokasiPagu';
import { AlokasiRekening } from '@/pages/modules/AlokasiRekening';
import { KuitansiModule } from '@/pages/modules/KuitansiModule';
import { BkuModule } from '@/pages/modules/BkuModule';
import { TaManagement } from '@/pages/modules/TaManagement';
import { SotkManagement } from '@/pages/modules/SotkManagement';

interface MainLayoutProps {
  session: SessionUser;
  moduleId: string;
  onNavigate: (id: string) => void;
  onLogout: () => void;
}

const dashboards: Record<string, (props: { session: SessionUser }) => JSX.Element> = {
  admin: AdminDashboard,
  bendahara: BendaharaDashboard,
  pptk: PptkDashboard,
  verifikator: VerifikatorDashboard,
  pa_kpa: PaKpaDashboard,
  auditor: AuditorDashboard,
};

// Module registry: id → component (all take { session })
const moduleRegistry: Record<string, (props: { session: SessionUser }) => JSX.Element> = {
  ta: TaManagement,
  sotk: SotkManagement,
  drilldown: DrillDownAnggaran,
  audit: JejakAudit,
  laporan: KatalogLaporan,
  alokasi: AlokasiPagu,
  'alokasi-rekening': AlokasiRekening,
  kuitansi: KuitansiModule,
  bku: BkuModule,
};

export function MainLayout({ session, moduleId, onNavigate, onLogout }: MainLayoutProps) {
  const isAuditor = session.role === 'auditor';
  const sections = roleNav[session.role];
  const activeItem = findNavItem(session.role, moduleId);

  function renderContent() {
    if (!activeItem) {
      return <AccessDeniedView onBack={() => onNavigate(DEFAULT_MODULE_ID)} />;
    }
    if (moduleId === 'dashboard') {
      const Dash = dashboards[session.role];
      if (Dash) return <Dash session={session} />;
    }
    const Mod = moduleRegistry[moduleId];
    if (Mod) return <Mod session={session} />;
    return <PlaceholderView title={activeItem.label} session={session} icon={activeItem.icon} />;
  }

  if (isAuditor) {
    return (
      <div className="h-screen flex flex-col bg-bg">
        <Topbar session={session} onLogout={onLogout} />
        <nav className="h-11 bg-surface border-b border-border flex items-center gap-1 px-4 overflow-x-auto shrink-0">
          {sections[0].items.map((item) => {
            const I = item.icon;
            const active = item.id === moduleId;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm whitespace-nowrap transition-colors ${
                  active
                    ? 'text-amber border-b-2 border-amber -mb-px'
                    : 'text-ink-secondary hover:text-ink-primary border-b-2 border-transparent'
                }`}
              >
                <I className="h-4 w-4" strokeWidth={1.75} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-8xl mx-auto">{renderContent()}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-bg">
      <div className="hidden md:block h-full">
        <Sidebar session={session} activeId={moduleId} onNavigate={onNavigate} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar session={session} onLogout={onLogout} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-8xl mx-auto">{renderContent()}</div>
        </main>
      </div>
    </div>
  );
}
