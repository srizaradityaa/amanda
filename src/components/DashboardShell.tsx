// UIX-03 — Layout dasbor: sidebar + topbar.
// Topbar: TA aktif, peran aktif (label), mini progress bar per peran, tombol logout.
// Tanpa dropdown ganti TA/peran (AUT-03 — isolasi konteks sesi).

import { useEffect, useState, type ReactNode } from 'react';
import {
  LayoutDashboard, ShieldCheck, FileText, ScrollText, LogOut, Menu, X, ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { getSession, logout, subscribeSession } from '@/lib/auth';
import { Logo } from '@/components/Logo';
import { touchActivity } from '@/lib/auth';
import { repo } from '@/data/repo';
import { formatRupiah, formatPersen, persenNumerik } from '@/lib/format';
import type { SessionPayload, Role } from '@/data/types';
import { peranLabel } from '@/lib/audit';
import * as anggaran from '@/data/anggaran';

export interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
  render: () => ReactNode;
  /** Menu khusus (jarang dipakai): tampil terpisah di bawah menu utama. */
  khusus?: boolean;
  /** Kelompok submenu; item dengan kelompok sama dikumpulkan di bawah satu judul yang bisa dilipat. */
  grup?: string;
}

function bacaLocal(k: string): string | null { try { return localStorage.getItem(k); } catch { return null; } }
function tulisLocal(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* abaikan */ } }

export function DashboardShell({
  nav,
  activeId,
  onNavigate,
  children,
}: {
  nav: NavItem[];
  activeId: string;
  onNavigate: (id: string) => void;
  children: ReactNode;
}) {
  const [session, setSession] = useState<SessionPayload | null>(getSession());
  const [mobileOpen, setMobileOpen] = useState(false);
  const [ciutPref, setCiut] = useState(() => bacaLocal('amanda.sidebar.ciut') === '1');
  const [tutup, setTutup] = useState<string[]>(() => { try { return JSON.parse(bacaLocal('amanda.sidebar.grup') ?? '[]') as string[]; } catch { return []; } });
  const ciut = ciutPref && !mobileOpen; // laci menu di ponsel selalu penuh
  const ubahCiut = () => { setCiut((c) => { tulisLocal('amanda.sidebar.ciut', c ? '0' : '1'); return !c; }); };
  const ubahGrup = (g: string) => setTutup((t) => { const n = t.includes(g) ? t.filter((x) => x !== g) : [...t, g]; tulisLocal('amanda.sidebar.grup', JSON.stringify(n)); return n; });

  useEffect(() => {
    const unsub = subscribeSession(() => setSession(getSession()));
    return unsub;
  }, []);

  // AUT-08 — setiap interaksi memperbarui aktivitas
  useEffect(() => {
    const handler = () => touchActivity();
    window.addEventListener('click', handler, true);
    window.addEventListener('keydown', handler, true);
    return () => {
      window.removeEventListener('click', handler, true);
      window.removeEventListener('keydown', handler, true);
    };
  }, []);

  if (!session) return null;

  const renderItem = (item: NavItem) => (
    <button
      key={item.id}
      onClick={() => {
        onNavigate(item.id);
        setMobileOpen(false);
      }}
      title={ciut ? item.label : undefined}
      aria-label={item.label}
      className={`flex w-full items-center ${ciut ? 'justify-center px-0' : 'gap-2.5 px-3'} rounded-md py-2 text-sm font-medium transition-colors ${
        activeId === item.id
          ? 'bg-amber/10 text-amber ring-1 ring-amber/30'
          : 'text-mist-dim hover:bg-ink-edge/40 hover:text-mist'
      }`}
    >
      {item.icon}
      {!ciut && <span>{item.label}</span>}
    </button>
  );

  // Susun menu: item bergrup dikumpulkan di bawah judul grup pada kemunculan pertamanya.
  const renderDaftar = (items: NavItem[]) => {
    const sudah = new Set<string>();
    return items.map((item) => {
      if (!item.grup) return renderItem(item);
      if (sudah.has(item.grup)) return null;
      sudah.add(item.grup);
      const anggota = items.filter((i) => i.grup === item.grup);
      const terbuka = ciut || !tutup.includes(item.grup) || anggota.some((a) => a.id === activeId);
      return (
        <div key={`g-${item.grup}`} className={ciut ? 'space-y-1 border-y border-ink-edge/60 py-1' : ''}>
          {!ciut && (
            <button onClick={() => ubahGrup(item.grup!)} aria-expanded={terbuka}
              className="flex w-full items-center gap-1.5 rounded-md px-3 py-1.5 text-2xs font-semibold uppercase tracking-wide text-mist-dim hover:text-mist">
              {terbuka ? <ChevronDown size={12} /> : <ChevronRight size={12} />}{item.grup}
            </button>
          )}
          {terbuka && <div className={ciut ? 'space-y-1' : 'ml-2 space-y-1 border-l border-ink-edge pl-1.5'}>{anggota.map(renderItem)}</div>}
        </div>
      );
    });
  };

  return (
    <div className="flex min-h-screen bg-ink text-mist lg:h-screen lg:overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 ${ciut ? 'lg:w-16' : ''} w-60 transform border-r border-ink-edge bg-ink-surface transition-transform lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-12 items-center gap-2 border-b border-ink-edge px-4">
          <Logo varian="ikon" tinggi={28} />
          {!ciut && <span className="text-sm font-bold tracking-tight">AMANDA</span>}
          <button
            className="ml-auto hidden rounded p-1 text-mist-dim hover:text-mist lg:block"
            onClick={ubahCiut}
            aria-label={ciut ? 'Besarkan menu' : 'Kecilkan menu'}
            title={ciut ? 'Besarkan menu' : 'Kecilkan menu'}
          >
            {ciut ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
          <button
            className="ml-auto rounded p-1 text-mist-dim hover:text-mist lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Tutup menu"
          >
            <X size={18} />
          </button>
        </div>
        <nav className="flex h-[calc(100%-3rem)] flex-col p-3">
          <div className="space-y-1">
            {renderDaftar(nav.filter((i) => !i.khusus))}
          </div>
          {nav.some((i) => i.khusus) && (
            <div className="mt-auto space-y-1 border-t border-ink-edge pt-3">
              {!ciut && <p className="px-3 text-2xs uppercase tracking-wide text-mist-dim">Lainnya</p>}
              {nav.filter((i) => i.khusus).map((item) => renderItem(item))}
            </div>
          )}
        </nav>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} aria-hidden />
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col lg:min-h-0">
        <Topbar session={session} onMobileOpen={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:min-h-0" onClick={() => touchActivity()}>
          {children}
        </main>
      </div>
    </div>
  );
}

function Topbar({ session, onMobileOpen }: { session: SessionPayload; onMobileOpen: () => void }) {
  const ta = session.active_ta_id ? repo.tahunAnggaranById(session.active_ta_id) : undefined;
  const role = session.active_role;

  return (
    <header className="sticky top-0 z-20 flex h-12 items-center gap-3 border-b border-ink-edge bg-ink-surface/95 px-4 backdrop-blur-sm">
      <button
        className="rounded p-1 text-mist-dim hover:text-mist lg:hidden"
        onClick={onMobileOpen}
        aria-label="Buka menu"
      >
        <Menu size={18} />
      </button>

      {/* Label TA aktif + peran aktif (tanpa dropdown) */}
      <div className="flex items-center gap-2 text-2xs">
        {ta ? (
          <span className="mono rounded-full border border-ink-edge bg-ink px-2.5 py-0.5 font-medium text-mist">
            TA {ta.tahun}
          </span>
        ) : (
          <span className="rounded-full border border-ink-edge bg-ink px-2.5 py-0.5 font-medium text-mist-dim">
            Tanpa TA
          </span>
        )}
        <span className="rounded-full border border-ink-edge bg-ink px-2.5 py-0.5 font-medium text-mist-dim">
          {peranLabel(role)}
        </span>
        {role === 'admin' && (
          <span className="rounded-full border border-ink-edge bg-ink px-2.5 py-0.5 text-2xs text-mist-dim lg:hidden">
            Pagu Induk: {ta ? formatRupiah(ta.pagu_induk) : '—'}
          </span>
        )}
      </div>

      {/* Mini progress bar — slot di tengah (di desktop) */}
      <div className="ml-auto hidden items-center gap-4 lg:flex">
        <MiniProgress role={role} session={session} />
      </div>

      <div className="ml-auto flex items-center gap-2 lg:ml-2">
        <span className="hidden text-2xs text-mist-dim sm:inline">{session.nama_snapshot}</span>
        <button
          onClick={() => logout()}
          className="inline-flex items-center gap-1.5 rounded-md border border-ink-edge px-2.5 py-1.5 text-2xs font-medium text-mist-dim hover:border-crit/40 hover:text-crit"
          aria-label="Keluar"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>
    </header>
  );
}

// Mini progress bar per peran (D01 §3.3)
function MiniProgress({ role, session }: { role: Role | 'pending'; session: SessionPayload }) {
  if (role === 'admin') {
    // Admin hanya Pagu Induk
    const ta = session.active_ta_id ? repo.tahunAnggaranById(session.active_ta_id) : undefined;
    return (
      <div className="flex items-center gap-2 text-2xs text-mist-dim">
        <span>Pagu Induk</span>
        <span className="mono tnum text-mist">{ta ? formatRupiah(ta.pagu_induk) : '—'}</span>
      </div>
    );
  }

  // Hitung agregat instansi atau seksi (SPD-01: komitmen = kuitansi Aktif atau Terkunci tanpa BKU)
  const ta_id = session.active_ta_id;
  if (!ta_id) return null;
  const ta = repo.tahunAnggaranById(ta_id);
  if (!ta) return null;

  const semuaRek = repo.alokasiRekeningByTA(ta_id);
  const rekAktif = semuaRek.filter((a) => a.disahkan);
  const agregat = (rows: typeof rekAktif, semua: typeof rekAktif) => ({
    pagu: semua.reduce((s, a) => s + a.pagu, 0),
    realisasi: rows.reduce((s, a) => s + anggaran.realisasiAlokasi(a), 0),
    komitmen: rows.reduce((s, a) => s + anggaran.komitmenAlokasi(a), 0),
    sisa: rows.reduce((s, a) => s + anggaran.sisaSpdBebas(a), 0),
  });

  if (role === 'pptk') {
    const seksiId = session.active_seksi_id;
    if (!seksiId) return null;
    const pemetaanIds = repo.pemetaanBySeksi(seksiId).map((p) => p.id);
    const milikSeksi = (a: (typeof semuaRek)[number]) => pemetaanIds.includes(a.pemetaan_subkegiatan_id);
    const m = agregat(rekAktif.filter(milikSeksi), semuaRek.filter(milikSeksi));
    return (
      <div className="flex items-center gap-3 text-2xs">
        <Metric label="Pagu" value={formatRupiah(m.pagu)} />
        <Metric label="Realisasi" value={formatRupiah(m.realisasi)} />
        <Metric label="Sisa SPD Bebas" value={formatRupiah(m.sisa)} />
        <Bar pct={persenNumerik(m.realisasi + m.komitmen, m.pagu)} label={formatPersen(m.realisasi + m.komitmen, m.pagu)} />
      </div>
    );
  }

  const m = agregat(rekAktif, semuaRek);
  return (
    <div className="flex items-center gap-3 text-2xs">
      <Metric label="Pagu" value={formatRupiah(m.pagu)} />
      <Metric label="Realisasi" value={formatRupiah(m.realisasi)} />
      <Metric label="Sisa SPD Bebas" value={formatRupiah(m.sisa)} />
      <Bar pct={persenNumerik(m.realisasi + m.komitmen, m.pagu)} label={formatPersen(m.realisasi + m.komitmen, m.pagu)} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-mist-dim">{label}</span>
      <span className="mono tnum text-mist">{value}</span>
    </div>
  );
}

function Bar({ pct, label }: { pct: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-mist-dim">Serapan</span>
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-ink-edge">
        <div className="h-full rounded-full bg-amber" style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <span className="mono tnum text-mist">{label}</span>
    </div>
  );
}

// Ikon helper untuk nav
export const NavIcons = {
  dashboard: <LayoutDashboard size={18} />,
  shield: <ShieldCheck size={18} />,
  file: <FileText size={18} />,
  scroll: <ScrollText size={18} />,
};
