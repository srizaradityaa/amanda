// AUT-02 — Layar seleksi TA & jabatan untuk personel multi-penugasan / multi-jabatan (D03 §1).
// P-121: personel multi-TA -> daftar TA lalu daftar jabatan.

import { useState } from 'react';
import { repo } from '@/data/repo';
import { selectContextForInternal, getSession, isPending, modeServer, konteksPending, pilihKonteksServer, logout } from '@/lib/auth';
import type { Konteks } from '@/lib/masuk';
import { Button } from '@/components/ui';
import { KerangkaMasuk } from '@/components/KerangkaMasuk';
import { ChevronRight, ShieldCheck, Wallet, ClipboardList, BadgeCheck, Landmark, Archive, CalendarDays, UserCircle2, type LucideIcon } from 'lucide-react';
import type { Role, PeranPenugasan } from '@/data/types';

const PERAN_LABEL: Record<string, string> = {
  admin: 'Administrator',
  bendahara: 'Bendahara Pengeluaran',
  pptk: 'PPTK / Seksi',
  verifikator: 'Verifikator',
  pa_kpa: 'PA/KPA',
  pengelola_arsip: 'Pengelola Arsip',
};

const PERAN_GAYA: Record<string, { ikon: LucideIcon; warna: string }> = {
  admin: { ikon: ShieldCheck, warna: '#F59E0B' },
  bendahara: { ikon: Wallet, warna: '#34D399' },
  pptk: { ikon: ClipboardList, warna: '#38BDF8' },
  verifikator: { ikon: BadgeCheck, warna: '#A78BFA' },
  pa_kpa: { ikon: Landmark, warna: '#FB7185' },
  pengelola_arsip: { ikon: Archive, warna: '#FB923C' },
};

// Ubin berwarna: ikon di kiri, judul dan keterangan singkat, panah di kanan.
function Ubin({ ikon: Ikon, warna, judul, ket, tambahan, onClick, disabled }: { ikon: LucideIcon; warna: string; judul: string; ket: string; tambahan?: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ ['--c' as string]: warna }}
      className="group flex w-full items-center gap-3 rounded-xl border border-ink-edge bg-ink/40 px-3 py-2.5 text-left transition hover:border-[color:var(--c)] hover:bg-[color-mix(in_srgb,var(--c)_10%,transparent)] disabled:opacity-60">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: 'color-mix(in srgb, var(--c) 18%, transparent)', color: 'var(--c)' }}>
        <Ikon size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-mist">{judul}{tambahan}</span>
        <span className="block truncate text-2xs text-mist-dim">{ket}</span>
      </span>
      <ChevronRight size={18} className="text-mist-dim transition group-hover:translate-x-0.5 group-hover:text-[color:var(--c)]" />
    </button>
  );
}

function peranLabel(p: PeranPenugasan): string {
  return PERAN_LABEL[p] ?? p;
}

export function ContextSelectPage({ onResolved }: { onResolved: () => void }) {
  const s = getSession();
  if (!s || !isPending(s)) return null;

  if (modeServer) return <ServerSelect onResolved={onResolved} />;

  return <InternalSelect onResolved={onResolved} />;
}

// Mode server: daftar TA dan jabatan berasal dari Supabase (hasil verifikasi login), bukan data contoh.
function ServerSelect({ onResolved }: { onResolved: () => void }) {
  const p = konteksPending();
  const [selectedTA, setSelectedTA] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  if (!p) {
    return (
      <Shell title="Sesi masuk berakhir" subtitle="Silakan masuk kembali.">
        <Button onClick={() => logout()}>Kembali ke halaman masuk</Button>
      </Shell>
    );
  }

  const daftarTA = Array.from(new Map(p.konteks.map((k) => [k.ta_id ?? '', k])).values());

  async function pilih(k: Konteks) {
    setSibuk(true);
    setGalat(null);
    const r = await pilihKonteksServer(k);
    setSibuk(false);
    if (!r.ok) { setGalat(r.error); return; }
    onResolved();
  }

  const infoGalat = galat && <p role="alert" className="mb-3 text-2xs text-crit">{galat}</p>;

  if (!selectedTA && daftarTA.length > 1) {
    return (
      <Shell title="Pilih Tahun Anggaran" subtitle={p.nama}>
        <div className="space-y-2">
          {daftarTA.map((k) => {
            const jml = p.konteks.filter((x) => x.ta_id === k.ta_id).length;
            return (
              <Ubin key={k.ta_id ?? 'x'} ikon={CalendarDays} warna="#F59E0B" judul={`TA ${k.tahun ?? k.ta_id}`} ket={`${jml} jabatan aktif`} onClick={() => setSelectedTA(k.ta_id ?? '')} />
            );
          })}
        </div>
      </Shell>
    );
  }

  const taTerpilih = selectedTA ?? (daftarTA[0]?.ta_id ?? '');
  const jabatan = p.konteks.filter((k) => (k.ta_id ?? '') === taTerpilih);
  const tahun = jabatan[0]?.tahun ?? taTerpilih;
  return (
    <Shell
      title={`Pilih Jabatan — TA ${tahun}`}
      subtitle=""
      onBack={daftarTA.length > 1 ? () => setSelectedTA(null) : undefined}
    >
      {infoGalat}
      <div className="space-y-2">
        {jabatan.map((k, idx) => (
          <Ubin key={idx} disabled={sibuk} {...(PERAN_GAYA[k.peran] ?? { ikon: UserCircle2, warna: '#F59E0B' })}
            judul={PERAN_LABEL[k.peran] ?? k.peran} tambahan={k.delegasi ? <span className="ml-2 text-2xs text-teal">Plh./Plt.</span> : undefined}
            ket={k.seksi_nama ? `Seksi: ${k.seksi_nama}` : 'Tingkat instansi'} onClick={() => pilih(k)} />
        ))}
      </div>
    </Shell>
  );
}

function InternalSelect({ onResolved }: { onResolved: () => void }) {
  const s = getSession()!;
  const acc = repo.akunLogin().find((a) => a.id === s.user_id);
  const personel = acc?.personel_id ? repo.personelById(acc.personel_id) : undefined;
  const [selectedTA, setSelectedTA] = useState<string | null>(null);

  if (!personel) return null;
  const taIds = repo.taIdsForPersonel(personel.id);

  function resolveJabatan(ta_id: string, peran: PeranPenugasan, seksi_ta_id: string | null, _isDelegasi: boolean) {
    // Plh./Plt. PPTK tetap peran 'pptk' untuk sesi (D01 §6 poin 7).
    const role: Role = peran as Role;
    selectContextForInternal(ta_id, role, seksi_ta_id);
    onResolved();
  }

  // Tahap 1: daftar TA
  if (!selectedTA) {
    return (
      <Shell title="Pilih Tahun Anggaran" subtitle={personel.nama}>
        <div className="space-y-2">
          {taIds.map((tid) => {
            const ta = repo.tahunAnggaranById(tid);
            const jabatan = repo.jabatanForPersonelOnTA(personel.id, tid);
            return (
              <Ubin key={tid} ikon={CalendarDays} warna="#F59E0B" judul={`TA ${ta?.tahun ?? tid}`} ket={`Status: ${ta?.status} • ${jabatan.length} jabatan aktif`} onClick={() => setSelectedTA(tid)} />
            );
          })}
        </div>
      </Shell>
    );
  }

  // Tahap 2: daftar jabatan pada TA terpilih
  const jabatan = repo.jabatanForPersonelOnTA(personel.id, selectedTA);
  const ta = repo.tahunAnggaranById(selectedTA);
  return (
    <Shell
      title={`Pilih Jabatan — TA ${ta?.tahun ?? selectedTA}`}
      subtitle=""
      onBack={() => setSelectedTA(null)}
    >
      <div className="space-y-2">
        {jabatan.map((j, idx) => {
          const seksi = j.seksi_ta_id ? repo.seksiTAById(j.seksi_ta_id) : undefined;
          return (
            <Ubin key={idx} {...(PERAN_GAYA[j.peran] ?? { ikon: UserCircle2, warna: '#F59E0B' })}
              judul={peranLabel(j.peran)} tambahan={j.isDelegasi ? <span className="ml-2 text-2xs text-teal">Plh./Plt.</span> : undefined}
              ket={seksi ? `Seksi: ${seksi.nama_snapshot}` : 'Tingkat instansi'} onClick={() => resolveJabatan(selectedTA, j.peran, j.seksi_ta_id, j.isDelegasi)} />
          );
        })}
      </div>
    </Shell>
  );
}


function Shell({ title, subtitle, children, onBack }: { title: string; subtitle: string; children: React.ReactNode; onBack?: () => void }) {
  return (
    <KerangkaMasuk>
      <div className="mb-4 text-center">
        <h2 className="text-base font-semibold text-mist">{title}</h2>
        {subtitle && <p className="mt-0.5 text-2xs text-mist-dim">{subtitle}</p>}
      </div>
      {children}
      {onBack && (
        <div className="mt-4 text-center">
          <Button variant="ghost" onClick={onBack}>Kembali</Button>
        </div>
      )}
    </KerangkaMasuk>
  );
}
