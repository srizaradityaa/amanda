// UIX-03 — Layout dasbor: sidebar + topbar.
// Topbar: TA aktif, peran aktif (label), mini progress bar per peran, tombol logout.
// Tanpa dropdown ganti TA/peran (AUT-03 — isolasi konteks sesi).

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import {
  LayoutDashboard, ShieldCheck, FileText, ScrollText, LogOut, Menu, X, ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { getSession, logout, subscribeSession } from '@/lib/auth';
import { LogoGerak } from '@/components/Logo';
import { touchActivity } from '@/lib/auth';
import { repo } from '@/data/repo';
import { formatRupiah, formatPersen, persenNumerik } from '@/lib/format';
import type { SessionPayload, Role } from '@/data/types';
import { peranLabel } from '@/lib/audit';
import * as anggaran from '@/data/anggaran';
import { jumlahStatusSPJ } from '@/lib/ringkasanDasbor';

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

// Warna ikon menu: per menu bila ditentukan, selain itu mengikuti kelompoknya. Hanya penanda visual.
const WARNA_ID: Record<string, string> = {
  dashboard: '#34D399', anggaran: '#F59E0B', persiapan: '#F59E0B', subkegiatan: '#F59E0B', pagu: '#F59E0B', 'sahkan-spd': '#F59E0B',
  kuitansi: '#F472B6', spj: '#A3E635', verifikasi: '#818CF8', bku: '#38BDF8', 'koreksi-bku': '#FB7185', arsip: '#2DD4BF',
  rincian: '#A78BFA', laporan: '#FB923C', 'laporan-kustom': '#F0ABFC', heatmap: '#F472B6',
  'tahun-anggaran': '#F59E0B', 'pengaturan-portal': '#A78BFA', audit: '#FB7185', tentang: '#9CA3AF',
};
const WARNA_GRUP: Record<string, string> = { 'Master Data': '#38BDF8', 'Templat & Formulir': '#F472B6', Direktori: '#2DD4BF', Anggaran: '#F59E0B', Keuangan: '#38BDF8', Laporan: '#A78BFA' };
function warnaMenu(item: NavItem): string {
  return WARNA_ID[item.id] ?? (item.grup ? WARNA_GRUP[item.grup] : undefined) ?? '#9CA3AF';
}
function inisial(nama: string): string {
  const k = nama.trim().split(/\s+/).filter(Boolean);
  return ((k[0]?.[0] ?? '') + (k.length > 1 ? k[k.length - 1][0] : '')).toUpperCase() || '?';
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

  // Lencana angka: jumlah pekerjaan yang menunggu peran ini (angka yang sama dengan kartu Perlu tindakan di dasbor).
  const lencana = (id: string): number => {
    const ta = session.active_ta_id;
    if (!ta) return 0;
    const role = session.active_role;
    if (!((role === 'bendahara' && id === 'bku') || (role === 'verifikator' && id === 'verifikasi') || (role === 'pptk' && id === 'spj'))) return 0;
    try {
      const j = jumlahStatusSPJ(ta, role === 'pptk' ? session.active_seksi_id ?? undefined : undefined);
      return role === 'bendahara' ? j.menungguBku : role === 'verifikator' ? j.terkunci : j.draft;
    } catch { return 0; }
  };

  const renderItem = (item: NavItem) => {
    const n = lencana(item.id);
    return (
      <button
        key={item.id}
        onClick={() => {
          onNavigate(item.id);
          setMobileOpen(false);
        }}
        aria-label={item.label}
        aria-current={activeId === item.id ? 'page' : undefined}
        style={{ '--c': warnaMenu(item) } as CSSProperties}
        className="nav-it focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber"
      >
        <span className="nav-ubin">{item.icon}</span>
        {!ciut && <span className="truncate">{item.label}</span>}
        {!ciut && n > 0 && <span className="nav-lencana">{n}</span>}
        {ciut && n > 0 && <span className="nav-titik" aria-hidden />}
        {ciut && <span className="nav-tip" aria-hidden>{item.label}{n > 0 ? ` (${n})` : ''}</span>}
      </button>
    );
  };

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
        <div key={`g-${item.grup}`} className={ciut ? 'my-2 space-y-1 border-t border-ink-edge pt-2' : 'mt-2'}>
          {!ciut && (
            <button onClick={() => ubahGrup(item.grup!)} aria-expanded={terbuka}
              className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-2xs font-bold uppercase tracking-[0.1em] text-[#6B7280] hover:text-mist">
              {terbuka ? <ChevronDown size={12} /> : <ChevronRight size={12} />}{item.grup}
            </button>
          )}
          {terbuka && <div className="submenu-buka space-y-1">{anggota.map(renderItem)}</div>}
        </div>
      );
    });
  };

  return (
    <div className="flex min-h-screen bg-ink text-mist lg:h-screen lg:overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 ${ciut ? 'lg:w-[4.75rem]' : ''} flex w-[17rem] transform flex-col border-r border-ink-edge bg-ink-surface transition-[transform,width] duration-300 lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className={`flex ${ciut ? 'flex-col items-center gap-2 px-3 pb-1 pt-3' : 'h-14 items-center gap-2 px-4'}`}>
          <LogoGerak tinggi={28} />
          {!ciut && <span className="text-base font-bold tracking-tight">AMANDA</span>}
          <button
            className="ml-auto hidden h-8 w-8 items-center justify-center rounded-lg border border-ink-edge text-mist-dim transition-colors hover:border-amber hover:text-mist lg:flex"
            style={ciut ? { marginLeft: 0 } : undefined}
            onClick={ubahCiut}
            aria-label={ciut ? 'Besarkan menu' : 'Kecilkan menu'}
            title={ciut ? 'Besarkan menu' : 'Kecilkan menu'}
          >
            {ciut ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
          <button
            className="ml-auto rounded p-1 text-mist-dim hover:text-mist lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Tutup menu"
          >
            <X size={18} />
          </button>
        </div>
        <div className={ciut ? 'flex justify-center px-3 py-2' : 'px-3 pb-2'}>
          <div className={`flex items-center gap-2.5 ${ciut ? '' : 'w-full rounded-2xl border border-ink-edge bg-ink p-2.5'}`} title={ciut ? `${session.nama_snapshot} · ${peranLabel(session.active_role)}` : undefined}>
            <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-amber/20 text-sm font-bold text-amber">{inisial(session.nama_snapshot)}</span>
            {!ciut && (
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-sm font-semibold text-mist">{session.nama_snapshot}</span>
                <span className="block truncate text-2xs text-mist-dim">{peranLabel(session.active_role)}</span>
              </span>
            )}
          </div>
        </div>
        <nav className={`flex min-h-0 flex-1 flex-col px-3 pb-3 ${ciut ? 'overflow-visible' : 'overflow-y-auto'}`}>
          <div className="space-y-1">
            {renderDaftar(nav.filter((i) => !i.khusus))}
          </div>
          {nav.some((i) => i.khusus) && (
            <div className="mt-auto space-y-1 border-t border-ink-edge pt-3">
              {!ciut && <p className="px-2 text-2xs font-bold uppercase tracking-[0.1em] text-[#6B7280]">Lainnya</p>}
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
      <div className="flex flex-1 items-center gap-3">
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
      </div>

      {/* Mini progress bar — di tengah; rincian muncul saat kursor/fokus/sentuhan */}
      <div className="hidden shrink-0 items-center lg:flex">
        <MiniProgress role={role} session={session} />
      </div>

      <div className="flex flex-1 items-center justify-end gap-2">
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
    return <PilProgress m={m} />;
  }

  const m = agregat(rekAktif, semuaRek);
  return <PilProgress m={m} />;
}

function PilProgress({ m }: { m: { pagu: number; realisasi: number; komitmen: number; sisa: number } }) {
  const pct = persenNumerik(m.realisasi + m.komitmen, m.pagu);
  return (
    <div className="group relative">
      <button type="button" aria-describedby="rincian-anggaran"
        className="flex items-center rounded-full border border-ink-edge bg-ink px-3.5 py-1.5 text-2xs">
        <Bar pct={pct} label={formatPersen(m.realisasi + m.komitmen, m.pagu)} />
      </button>
      <div id="rincian-anggaran" role="tooltip"
        className="invisible absolute left-1/2 top-full z-30 mt-2 w-72 -translate-x-1/2 -translate-y-1 rounded-lg border border-ink-edge bg-ink-surface p-3 text-2xs opacity-0 shadow-xl transition duration-150 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
        <Baris label="Pagu" value={formatRupiah(m.pagu)} />
        <Baris label="Realisasi" value={formatRupiah(m.realisasi)} />
        <Baris label="Sisa anggaran" value={formatRupiah(m.pagu - m.realisasi)} />
        <Baris label="Sisa SPD Bebas" value={formatRupiah(m.sisa)} />
      </div>
    </div>
  );
}

function Baris({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-ink-edge py-1.5 last:border-0">
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
        <div className="tumbuh h-full rounded-full bg-amber" style={{ width: `${Math.min(100, pct)}%` }} />
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
