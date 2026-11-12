// AMANDA — App shell (Langkah 1, Tahap A).
// Menghubungkan login -> seleksi konteks berjenjang -> dasbor per peran.

import { lazy, useEffect, useState, useSyncExternalStore } from 'react';
import { langgananData, versiData, muatSemua } from '@/data/store';
import { langgananGalat } from '@/lib/galat';
import { LoginPage } from '@/components/LoginPage';
import { ContextSelectPage } from '@/components/ContextSelectPage';
import { DashboardShell, type NavItem } from '@/components/DashboardShell';
import {
  BendaharaDashboard, PptkDashboard, VerifikatorDashboard,
  PakpaDashboard, PengawasDashboard, AuditTrail,
} from '@/components/Dashboards';
import {
  AdminDasborPage, SOTKPage, PersonelPage, KamusPage, PajakPage,
  DirektoriPage, PetaJabatanPage,
} from '@/components/AdminPanels';
import { VerifikasiPage } from '@/components/VerifikasiPage';
import { BKUPage } from '@/components/BKUPage';
import { AnggaranBendaharaPage } from '@/components/AnggaranBendaharaPage';
import { AnggaranPptkPage } from '@/components/AnggaranPptkPage';
import { KuitansiPage } from '@/components/KuitansiPage';
import { SPJPage } from '@/components/SPJPage';
import { GerbangBanner } from '@/components/AnggaranShared';
import { repo } from '@/data/repo';
import { getSession, isPending, subscribeSession, logout, modeServer, validasiSesiServer } from '@/lib/auth';
import { visibleAuditEvents } from '@/lib/audit';
import { evaluasiDelegasiJatuhTempo } from '@/lib/delegasi';
import { BarChart3, BookOpen, LayoutDashboard, ScrollText, ShieldCheck, History, Building2, Users, Layers, FileText, ScrollText as ScrollIcon, CalendarRange, Wallet } from 'lucide-react';
import type { SessionPayload } from '@/data/types';

const TahunAnggaranPage = lazy(() => import('@/components/TAPanels').then((m) => ({ default: m.TahunAnggaranPage })));
const FormBuilderPage = lazy(() => import('@/components/FormBuilderPage').then((m) => ({ default: m.FormBuilderPage })));
const TemplateKuitansiPage = lazy(() => import('@/components/TemplateKuitansiPage').then((m) => ({ default: m.TemplateKuitansiPage })));
const PortalPublikPage = lazy(() => import('@/components/PortalPublikPage').then((m) => ({ default: m.PortalPublikPage })));
const HeatmapPage = lazy(() => import('@/components/HeatmapPage').then((m) => ({ default: m.HeatmapPage })));
const LaporanPage = lazy(() => import('@/components/LaporanPage').then((m) => ({ default: m.LaporanPage })));
const LaporanKustomPage = lazy(() => import('@/components/LaporanKustomPage').then((m) => ({ default: m.LaporanKustomPage })));
const KeaslianPage = lazy(() => import('@/components/KeaslianPage').then((m) => ({ default: m.KeaslianPage })));
const TemplateVerifikasiPage = lazy(() => import('@/components/TemplateVerifikasiPage').then((m) => ({ default: m.TemplateVerifikasiPage })));
const DirektoriRekeningPage = lazy(() => import('@/components/DirektoriRekeningPage').then((m) => ({ default: m.DirektoriRekeningPage })));
const DrilldownPage = lazy(() => import('@/components/DrilldownPage').then((m) => ({ default: m.DrilldownPage })));

type View = 'login' | 'context' | 'app' | 'public';

// VER-05: tautan barcode membuka halaman keaslian tanpa login (#/keaslian/{token})
function tokenDariHash(): string | null {
  const m = window.location.hash.match(/^#\/keaslian\/([A-Za-z0-9]+)$/);
  return m ? m[1] : null;
}

function App() {
  const [tokenKeaslian, setTokenKeaslian] = useState<string | null>(tokenDariHash());
  useEffect(() => {
    const h = () => setTokenKeaslian(tokenDariHash());
    window.addEventListener('hashchange', h);
    return () => window.removeEventListener('hashchange', h);
  }, []);
  if (tokenKeaslian) return <KeaslianPage token={tokenKeaslian} />;
  return <AplikasiUtama />;
}

function AplikasiUtama() {
  const [view, setView] = useState<View>('login');
  const [session, setSession] = useState<SessionPayload | null>(getSession());
  const [activeNav, setActiveNav] = useState('dashboard');
  // Mode server: tiap kali data dimuat ulang dari Supabase, seluruh layar dirender ulang.
  useSyncExternalStore(langgananData, versiData);
  const [dataStatus, setDataStatus] = useState<'belum' | 'memuat' | 'siap' | 'gagal'>(modeServer ? 'belum' : 'siap');
  const [galat, setGalat] = useState<string | null>(null);
  useEffect(() => langgananGalat((p) => setGalat(p)), []);
  const adaSesiAktif = !!session && !isPending(session);
  useEffect(() => {
    if (!modeServer) return;
    if (!adaSesiAktif) { setDataStatus('belum'); return; }
    let batal = false;
    setDataStatus('memuat');
    muatSemua().then(() => { if (!batal) setDataStatus('siap'); }).catch(() => { if (!batal) setDataStatus('gagal'); });
    return () => { batal = true; };
  }, [adaSesiAktif, session?.active_ta_id, session?.active_role]);

  useEffect(() => {
    // Mode server: sesi yang tersimpan di browser harus masih sah di server (kalau tidak, kembali ke login).
    void validasiSesiServer();
    evaluasiDelegasiJatuhTempo();
    const unsub = subscribeSession(() => {
      const s = getSession();
      setSession(s);
      if (!s) setView('login');
      else if (isPending(s)) setView('context');
      else setView('app');
    });
    // sinkronkan tampilan awal
    const s = getSession();
    if (!s) setView('login');
    else if (isPending(s)) setView('context');
    else setView('app');
    return unsub;
  }, []);

  useEffect(() => {
    const goPublic = () => setView('public');
    window.addEventListener('amanda:go-public', goPublic);
    return () => window.removeEventListener('amanda:go-public', goPublic);
  }, []);

  if (view === 'public') {
    return <PortalPublikPage onBack={() => setView('login')} />;
  }

  if (view === 'login' || !session) {
    return <LoginPage onLogin={() => {
      evaluasiDelegasiJatuhTempo();
      const s = getSession();
      setSession(s);
      if (!s) setView('login');
      else if (isPending(s)) setView('context');
      else setView('app');
    }} />;
  }

  if (view === 'context' || isPending(session)) {
    return <ContextSelectPage onResolved={() => {
      const s = getSession();
      setSession(s);
      setView('app');
      setActiveNav('dashboard');
    }} />;
  }

  if (modeServer && dataStatus !== 'siap') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink p-6 text-mist">
        <div className="max-w-sm text-center">
          {dataStatus === 'gagal' ? (
            <>
              <p className="mb-3 text-sm">Data tidak dapat dimuat dari server. Periksa koneksi, lalu coba lagi atau masuk kembali.</p>
              <div className="flex justify-center gap-2">
                <button className="rounded-md border border-ink-edge px-3 py-1.5 text-sm hover:border-amber/40" onClick={() => { setDataStatus('memuat'); muatSemua().then(() => setDataStatus('siap')).catch(() => setDataStatus('gagal')); }}>Coba lagi</button>
                <button className="rounded-md border border-ink-edge px-3 py-1.5 text-sm hover:border-amber/40" onClick={() => logout()}>Keluar</button>
              </div>
            </>
          ) : (
            <p className="text-sm text-mist-dim" role="status">Memuat data dari server…</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <AppShell session={session} activeNav={activeNav} onNavigate={setActiveNav} />
      {galat && (
        <div role="alert" className="fixed bottom-4 left-1/2 z-50 flex max-w-md -translate-x-1/2 items-start gap-3 rounded-md border border-crit/50 bg-ink-surface px-4 py-3 text-sm text-mist shadow-lg">
          <span className="flex-1">{galat}</span>
          <button className="text-mist-dim hover:text-mist" onClick={() => setGalat(null)} aria-label="Tutup">×</button>
        </div>
      )}
    </>
  );
}

function AppShell({
  session,
  activeNav,
  onNavigate,
}: {
  session: SessionPayload;
  activeNav: string;
  onNavigate: (id: string) => void;
}) {
  const role = session.active_role;
  const nav = buildNav(role);
  const active = nav.find((n) => n.id === activeNav) ?? nav[0];
  const bannerTA = role === 'pengawas'
    ? null
    : session.active_ta_id ?? (role === 'admin' ? repo.tahunAnggaran().find((t) => t.status === 'Aktif Penuh')?.id ?? null : null);

  return (
    <DashboardShell nav={nav} activeId={active?.id ?? 'dashboard'} onNavigate={onNavigate}>
      {bannerTA && <GerbangBanner ta_id={bannerTA} />}
      {active?.render()}
    </DashboardShell>
  );
}

function buildNav(role: string): NavItem[] {
  if (role === 'admin') {
    return [
      { id: 'dashboard', label: 'Dasbor', icon: <LayoutDashboard size={18} />, render: () => <AdminDasborPage /> },
      { id: 'sotk', label: 'Master SOTK', icon: <Building2 size={18} />, render: () => <SOTKPage /> },
      { id: 'personel', label: 'Master Personel', icon: <Users size={18} />, render: () => <PersonelPage /> },
      { id: 'peta-jabatan', label: 'Peta Jabatan', icon: <Users size={18} />, render: () => <PetaJabatanPage /> },
      { id: 'kamus', label: 'Subkegiatan & Rekening', icon: <Layers size={18} />, render: () => <KamusPage /> },
      { id: 'pajak', label: 'Jenis Pajak', icon: <FileText size={18} />, render: () => <PajakPage /> },
      { id: 'form-dinamis', label: 'Form Dinamis', icon: <FileText size={18} />, render: () => <FormBuilderPage /> },
      { id: 'template-kuitansi', label: 'Template Kuitansi', icon: <FileText size={18} />, render: () => <TemplateKuitansiPage /> },
      { id: 'template-verifikasi', label: 'Template Verifikasi', icon: <FileText size={18} />, render: () => <TemplateVerifikasiPage /> },
      { id: 'direktori', label: 'Direktori SPJ', icon: <ScrollIcon size={18} />, render: () => <DirektoriPage /> },
      { id: 'direktori-rekening', label: 'Direktori Rekening', icon: <Wallet size={18} />, render: () => <DirektoriRekeningPage /> },
      { id: 'tahun-anggaran', label: 'Tahun Anggaran', icon: <CalendarRange size={18} />, render: () => <TahunAnggaranPage /> },
      { id: 'audit', label: 'Jejak Audit', icon: <History size={18} />, khusus: true, render: () => <AuditTrail events={visibleAuditEvents()} /> },
    ];
  }
  if (role === 'bendahara') {
    return [
      { id: 'dashboard', label: 'Dasbor', icon: <LayoutDashboard size={18} />, render: () => <BendaharaDashboard /> },
      { id: 'anggaran', label: 'Anggaran', icon: <Wallet size={18} />, render: () => <AnggaranBendaharaPage /> },
      { id: 'bku', label: 'BKU', icon: <BookOpen size={18} />, render: () => <BKUPage /> },
      { id: 'rincian', label: 'Rincian Anggaran', icon: <Layers size={18} />, render: () => <DrilldownPage /> },
      { id: 'laporan', label: 'Laporan', icon: <BarChart3 size={18} />, render: () => <LaporanPage /> },
      { id: 'laporan-kustom', label: 'Laporan Kustom', icon: <BarChart3 size={18} />, render: () => <LaporanKustomPage /> },
      { id: 'audit', label: 'Jejak Audit', icon: <History size={18} />, khusus: true, render: () => <AuditTrail events={visibleAuditEvents()} /> },
    ];
  }
  if (role === 'pptk') {
    return [
      { id: 'dashboard', label: 'Dasbor', icon: <LayoutDashboard size={18} />, render: () => <PptkDashboard /> },
      { id: 'anggaran', label: 'Anggaran', icon: <Wallet size={18} />, render: () => <AnggaranPptkPage /> },
      { id: 'kuitansi', label: 'Kuitansi', icon: <FileText size={18} />, render: () => <KuitansiPage /> },
      { id: 'spj', label: 'SPJ', icon: <ScrollText size={18} />, render: () => <SPJPage /> },
      { id: 'rincian', label: 'Rincian Anggaran', icon: <Layers size={18} />, render: () => <DrilldownPage /> },
      { id: 'laporan', label: 'Laporan', icon: <BarChart3 size={18} />, render: () => <LaporanPage /> },
      { id: 'laporan-kustom', label: 'Laporan Kustom', icon: <BarChart3 size={18} />, render: () => <LaporanKustomPage /> },
      { id: 'audit', label: 'Jejak Audit', icon: <History size={18} />, khusus: true, render: () => <AuditTrail events={visibleAuditEvents()} /> },
    ];
  }
  if (role === 'verifikator') {
    return [
      { id: 'dashboard', label: 'Dasbor', icon: <LayoutDashboard size={18} />, render: () => <VerifikatorDashboard /> },
      { id: 'verifikasi', label: 'Verifikasi SPJ', icon: <ScrollText size={18} />, render: () => <VerifikasiPage /> },
      { id: 'bku', label: 'BKU', icon: <BookOpen size={18} />, render: () => <BKUPage /> },
      { id: 'rincian', label: 'Rincian Anggaran', icon: <Layers size={18} />, render: () => <DrilldownPage /> },
      { id: 'laporan', label: 'Laporan', icon: <BarChart3 size={18} />, render: () => <LaporanPage /> },
      { id: 'laporan-kustom', label: 'Laporan Kustom', icon: <BarChart3 size={18} />, render: () => <LaporanKustomPage /> },
      { id: 'audit', label: 'Jejak Audit', icon: <History size={18} />, khusus: true, render: () => <AuditTrail events={visibleAuditEvents()} /> },
    ];
  }
  if (role === 'pa_kpa') {
    return [
      { id: 'dashboard', label: 'Dasbor', icon: <LayoutDashboard size={18} />, render: () => <PakpaDashboard /> },
      { id: 'rincian', label: 'Rincian Anggaran', icon: <Layers size={18} />, render: () => <DrilldownPage /> },
      { id: 'heatmap', label: 'Heatmap Realisasi', icon: <BarChart3 size={18} />, render: () => <HeatmapPage /> },
      { id: 'laporan', label: 'Laporan', icon: <BarChart3 size={18} />, render: () => <LaporanPage /> },
      { id: 'laporan-kustom', label: 'Laporan Kustom', icon: <BarChart3 size={18} />, render: () => <LaporanKustomPage /> },
      { id: 'audit', label: 'Jejak Audit', icon: <History size={18} />, khusus: true, render: () => <AuditTrail events={visibleAuditEvents()} /> },
    ];
  }
  if (role === 'pengawas') {
    return [
      { id: 'dashboard', label: 'Dasbor', icon: <ShieldCheck size={18} />, render: () => <PengawasDashboard /> },
      { id: 'laporan', label: 'Laporan', icon: <BarChart3 size={18} />, render: () => <LaporanPage /> },
      { id: 'audit', label: 'Jejak Audit', icon: <History size={18} />, khusus: true, render: () => <AuditTrail events={visibleAuditEvents()} /> },
    ];
  }
  return [];
}

export default App;
