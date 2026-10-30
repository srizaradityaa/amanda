import { useState } from 'react';
import type { SessionUser } from '@/auth/types';
import { Topbar } from '@/components/Topbar';
import { Sidebar } from '@/components/Sidebar';
import { PlaceholderView } from '@/components/PlaceholderView';
import { roleNav } from '@/config/navigation';
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
import { SpdEfisiensi } from '@/pages/modules/SpdEfisiensi';
import { PergeseranAnggaran } from '@/pages/modules/PergeseranAnggaran';
import { AntreanSpj } from '@/pages/modules/AntreanSpj';
import { HeatmapRealisasi } from '@/pages/modules/HeatmapRealisasi';
import { LaporanKustom } from '@/pages/modules/LaporanKustom';
import { SpjFormDinamis } from '@/pages/modules/SpjFormDinamis';
import { MasterSotk } from '@/pages/modules/MasterSotk';
import { MasterPersonel } from '@/pages/modules/MasterPersonel';
import { TahunAnggaran } from '@/pages/modules/TahunAnggaran';
import { AkunPengawas } from '@/pages/modules/AkunPengawas';
import { DirektoriRekeningBank } from '@/pages/modules/DirektoriRekeningBank';

interface MainLayoutProps {
  session: SessionUser;
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
  drilldown: DrillDownAnggaran,
  audit: JejakAudit,
  laporan: KatalogLaporan,
  'laporan-kustom': LaporanKustom,
  alokasi: AlokasiPagu,
  'alokasi-rekening': AlokasiRekening,
  kuitansi: KuitansiModule,
  bku: BkuModule,
  spd: SpdEfisiensi,
  pergeseran: PergeseranAnggaran,
  antrean: AntreanSpj,
  spj: SpjFormDinamis,
  heatmap: HeatmapRealisasi,
  sotk: MasterSotk,
  personel: MasterPersonel,
  ta: TahunAnggaran,
  akun: AkunPengawas,
  'bank-direktori': DirektoriRekeningBank,
};

export function MainLayout({ session, onLogout }: MainLayoutProps) {
  const isAuditor = session.role === 'auditor';
  const sections = roleNav[session.role];
  const firstId = sections[0]?.items[0]?.id ?? 'dashboard';

  const [activeId, setActiveId] = useState(firstId);
  const activeItem = sections
    .flatMap((s) => s.items)
    .find((i) => i.id === activeId);
  const title = activeItem?.label ?? 'Dasbor';
  const Icon = activeItem?.icon;

  function renderContent() {
    if (activeId === 'dashboard') {
      const Dash = dashboards[session.role];
      if (Dash) return <Dash session={session} />;
    }
    const Mod = moduleRegistry[activeId];
    if (Mod) return <Mod session={session} />;
    return <PlaceholderView title={title} session={session} icon={Icon} />;
  }

  if (isAuditor) {
    return (
      <div className="h-screen flex flex-col bg-bg">
        <Topbar session={session} onLogout={onLogout} />
        <nav className="h-11 bg-surface border-b border-border flex items-center gap-1 px-4 overflow-x-auto shrink-0">
          {sections[0].items.map((item) => {
            const I = item.icon;
            const active = item.id === activeId;
            return (
              <button
                key={item.id}
                onClick={() => setActiveId(item.id)}
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
        <Sidebar session={session} activeId={activeId} onNavigate={setActiveId} />
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
