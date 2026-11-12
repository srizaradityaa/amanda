// AUT-02 — Layar seleksi TA & jabatan untuk personel multi-penugasan / multi-jabatan (D03 §1).
// P-121: personel multi-TA -> daftar TA lalu daftar jabatan.
// P-119: auditor multi-TA -> daftar TA.

import { useState } from 'react';
import { repo } from '@/data/repo';
import { selectContextForInternal, selectContextForAuditor, getSession, isPending, modeServer, konteksPending, pilihKonteksServer, logout } from '@/lib/auth';
import type { Konteks } from '@/lib/masuk';
import { Card, Button } from '@/components/ui';
import { ChevronRight, ShieldCheck, UserCircle2 } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { formatTanggal } from '@/lib/wita';
import type { Role, PeranPenugasan } from '@/data/types';

const PERAN_LABEL: Record<string, string> = {
  admin: 'Administrator',
  bendahara: 'Bendahara Pengeluaran',
  pptk: 'PPTK / Seksi',
  verifikator: 'Verifikator',
  pa_kpa: 'PA/KPA',
  pengawas: 'Pengawas/Auditor',
};

function peranLabel(p: PeranPenugasan): string {
  return PERAN_LABEL[p] ?? p;
}

export function ContextSelectPage({ onResolved }: { onResolved: () => void }) {
  const s = getSession();
  if (!s || !isPending(s)) return null;

  if (modeServer) return <ServerSelect onResolved={onResolved} />;

  if (s.actor_type === 'auditor') {
    return <AuditorSelect onResolved={onResolved} />;
  }
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

  if (p.tipe === 'auditor') {
    return (
      <Shell title="Pilih Tahun Anggaran Penugasan" subtitle={`${p.nama} — Pengawas/Auditor`}>
        {infoGalat}
        <div className="space-y-2">
          {p.konteks.map((k, i) => (
            <button key={i} disabled={sibuk} onClick={() => pilih(k)}
              className="flex w-full items-center justify-between rounded-lg border border-ink-edge bg-ink-surface px-4 py-3 text-left hover:border-amber/40 disabled:opacity-60">
              <div className="flex items-center gap-3">
                <ShieldCheck size={20} className="text-teal" />
                <div className="mono text-sm font-semibold text-mist">TA {k.tahun ?? k.ta_id}</div>
              </div>
              <ChevronRight size={18} className="text-mist-dim" />
            </button>
          ))}
        </div>
      </Shell>
    );
  }

  if (!selectedTA && daftarTA.length > 1) {
    return (
      <Shell title="Pilih Tahun Anggaran" subtitle={`${p.nama} — pilih TA penugasan`}>
        <div className="space-y-2">
          {daftarTA.map((k) => {
            const jml = p.konteks.filter((x) => x.ta_id === k.ta_id).length;
            return (
              <button key={k.ta_id ?? 'x'} onClick={() => setSelectedTA(k.ta_id ?? '')}
                className="flex w-full items-center justify-between rounded-lg border border-ink-edge bg-ink-surface px-4 py-3 text-left hover:border-amber/40">
                <div>
                  <div className="mono text-sm font-semibold text-mist">TA {k.tahun ?? k.ta_id}</div>
                  <div className="text-2xs text-mist-dim">{jml} jabatan aktif</div>
                </div>
                <ChevronRight size={18} className="text-mist-dim" />
              </button>
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
      subtitle="Pilih jabatan aktif untuk sesi ini. Ganti TA atau jabatan wajib logout."
      onBack={daftarTA.length > 1 ? () => setSelectedTA(null) : undefined}
    >
      {infoGalat}
      <div className="space-y-2">
        {jabatan.map((k, idx) => (
          <button key={idx} disabled={sibuk} onClick={() => pilih(k)}
            className="flex w-full items-center justify-between rounded-lg border border-ink-edge bg-ink-surface px-4 py-3 text-left hover:border-amber/40 disabled:opacity-60">
            <div className="flex items-center gap-3">
              <UserCircle2 size={20} className="text-amber" />
              <div>
                <div className="text-sm font-semibold text-mist">
                  {PERAN_LABEL[k.peran] ?? k.peran}
                  {k.delegasi && <span className="ml-2 text-2xs text-teal">Plh./Plt.</span>}
                </div>
                <div className="text-2xs text-mist-dim">{k.seksi_nama ? `Seksi: ${k.seksi_nama}` : 'Tingkat instansi'}</div>
              </div>
            </div>
            <ChevronRight size={18} className="text-mist-dim" />
          </button>
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
      <Shell title="Pilih Tahun Anggaran" subtitle={`${personel.nama} — pilih TA penugasan`}>
        <div className="space-y-2">
          {taIds.map((tid) => {
            const ta = repo.tahunAnggaranById(tid);
            const jabatan = repo.jabatanForPersonelOnTA(personel.id, tid);
            return (
              <button
                key={tid}
                onClick={() => setSelectedTA(tid)}
                className="flex w-full items-center justify-between rounded-lg border border-ink-edge bg-ink-surface px-4 py-3 text-left hover:border-amber/40"
              >
                <div>
                  <div className="mono text-sm font-semibold text-mist">TA {ta?.tahun ?? tid}</div>
                  <div className="text-2xs text-mist-dim">
                    Status: {ta?.status} • {jabatan.length} jabatan aktif
                  </div>
                </div>
                <ChevronRight size={18} className="text-mist-dim" />
              </button>
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
      subtitle="Pilih jabatan aktif untuk sesi ini. Ganti TA atau jabatan wajib logout."
      onBack={() => setSelectedTA(null)}
    >
      <div className="space-y-2">
        {jabatan.map((j, idx) => {
          const seksi = j.seksi_ta_id ? repo.seksiTAById(j.seksi_ta_id) : undefined;
          return (
            <button
              key={idx}
              onClick={() => resolveJabatan(selectedTA, j.peran, j.seksi_ta_id, j.isDelegasi)}
              className="flex w-full items-center justify-between rounded-lg border border-ink-edge bg-ink-surface px-4 py-3 text-left hover:border-amber/40"
            >
              <div className="flex items-center gap-3">
                <UserCircle2 size={20} className="text-amber" />
                <div>
                  <div className="text-sm font-semibold text-mist">
                    {peranLabel(j.peran)}
                    {j.isDelegasi && <span className="ml-2 text-2xs text-teal">Plh./Plt.</span>}
                  </div>
                  {seksi && <div className="text-2xs text-mist-dim">Seksi: {seksi.nama_snapshot}</div>}
                  {!seksi && <div className="text-2xs text-mist-dim">Tingkat instansi</div>}
                </div>
              </div>
              <ChevronRight size={18} className="text-mist-dim" />
            </button>
          );
        })}
      </div>
    </Shell>
  );
}

function AuditorSelect({ onResolved }: { onResolved: () => void }) {
  const s = getSession()!;
  const aud = repo.pengawasById(s.user_id);
  if (!aud) return null;
  const taIds = repo.taIdsForPengawas(aud.id);

  return (
    <Shell title="Pilih Tahun Anggaran Penugasan" subtitle={`${aud.nama_lengkap} — Pengawas/Auditor`}>
      <div className="space-y-2">
        {taIds.map((tid) => {
          const ta = repo.tahunAnggaranById(tid);
          return (
            <button
              key={tid}
              onClick={() => {
                selectContextForAuditor(tid);
                onResolved();
              }}
              className="flex w-full items-center justify-between rounded-lg border border-ink-edge bg-ink-surface px-4 py-3 text-left hover:border-amber/40"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck size={20} className="text-teal" />
                <div>
                  <div className="mono text-sm font-semibold text-mist">TA {ta?.tahun ?? tid}</div>
                  <div className="text-2xs text-mist-dim">
                    Akhir akses: {formatTanggal(aud.tanggal_akhir_akses)} • Status: {ta?.status}
                  </div>
                </div>
              </div>
              <ChevronRight size={18} className="text-mist-dim" />
            </button>
          );
        })}
      </div>
    </Shell>
  );
}

function Shell({
  title,
  subtitle,
  children,
  onBack,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onBack?: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink p-6">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex items-center gap-3">
          <Logo varian="ikon" tinggi={44} />
          <div>
            <h1 className="text-lg font-bold text-mist">AMANDA</h1>
            <p className="text-2xs text-mist-dim">Aplikasi Manajemen Data Anggaran</p>
          </div>
        </div>
        <Card className="p-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-mist">{title}</h2>
            <p className="text-2xs text-mist-dim">{subtitle}</p>
          </div>
          {children}
          {onBack && (
            <div className="mt-4">
              <Button variant="ghost" onClick={onBack}>
                Kembali
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
