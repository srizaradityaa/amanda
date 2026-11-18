// PUB-01..05, PUB-07 — Portal Keterbukaan Informasi Publik (anonim, baca saja).
// Hanya memakai agregat aman dari data/publik.ts: persentase, cacah, nama seksi, peringkat. Tidak ada nominal rupiah.
import { useCallback, useEffect, useState } from 'react';
import { daftarTAPublikAsync, ringkasanPublikAsync, type TAPublik, type KodeKategori, type RingkasanPublik } from '@/data/publik';
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock, Maximize2, Minimize2, Pencil } from 'lucide-react';
import { pengaturanPortalAsync, type PengaturanPortal } from '@/data/pengaturanPortal';
import { alamatEmbed } from '@/lib/youtube';
import { Logo } from '@/components/Logo';

const SEGAR_MS = 5 * 60 * 1000; // data diperbarui otomatis tiap 5 menit (layar TV), tanpa memuat ulang halaman

const persenTeks = (n: number | null) => (n === null ? 'Belum tersedia' : `${n.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`);

const GAYA: Record<KodeKategori, { warna: string; ikon: JSX.Element }> = {
  selesai: { warna: '#34D399', ikon: <CheckCircle2 size={16} aria-hidden /> },
  verifikasi: { warna: '#F59E0B', ikon: <Clock size={16} aria-hidden /> },
  perbaikan: { warna: '#FB923C', ikon: <AlertTriangle size={16} aria-hidden /> },
  draf: { warna: '#9CA3AF', ikon: <Pencil size={16} aria-hidden /> },
};

function Donut({ r }: { r: RingkasanPublik }) {
  const R = 52, K = 2 * Math.PI * R;
  let geser = 0;
  const label = `Distribusi status SPJ: ${r.kategori.map((k) => `${k.label} ${k.cacah}`).join(', ')}. Total ${r.total_spj} SPJ.`;
  return (
    <svg viewBox="0 0 140 140" className="mx-auto h-36 w-36" role="img" aria-label={label}>
      <circle cx="70" cy="70" r={R} fill="none" stroke="#1F2937" strokeWidth="18" />
      {r.total_spj > 0 && r.kategori.map((k) => {
        const panjang = (k.cacah / r.total_spj) * K;
        const el = k.cacah > 0 && (
          <circle key={k.kode} cx="70" cy="70" r={R} fill="none" stroke={GAYA[k.kode].warna} strokeWidth="18"
            strokeDasharray={`${panjang} ${K - panjang}`} strokeDashoffset={-geser} transform="rotate(-90 70 70)" />
        );
        geser += panjang;
        return el;
      })}
      <text x="70" y="66" textAnchor="middle" fill="#E5E7EB" fontSize="20" fontFamily="JetBrains Mono, monospace" fontWeight="700">{r.total_spj}</text>
      <text x="70" y="84" textAnchor="middle" fill="#9CA3AF" fontSize="10">SPJ</text>
    </svg>
  );
}

function Gauge({ persen, label }: { persen: number | null; label: string }) {
  const R = 70, K = Math.PI * R;
  const isi = persen === null ? 0 : Math.min(100, Math.max(0, persen)) / 100;
  return (
    <svg viewBox="0 0 180 110" className="mx-auto h-36 w-full max-w-[14rem]" role="img" aria-label={`Realisasi ${label}: ${persenTeks(persen)}`}>
      <path d="M 20 90 A 70 70 0 0 1 160 90" fill="none" stroke="#1F2937" strokeWidth="16" strokeLinecap="round" />
      <path d="M 20 90 A 70 70 0 0 1 160 90" fill="none" stroke="#F59E0B" strokeWidth="16" strokeLinecap="round" strokeDasharray={`${K * isi} ${K}`} />
      <text x="90" y="82" textAnchor="middle" fill="#E5E7EB" fontSize={persen === null ? 13 : 24} fontFamily="JetBrains Mono, monospace" fontWeight="700">{persenTeks(persen)}</text>
      <text x="90" y="104" textAnchor="middle" fill="#9CA3AF" fontSize="10">{label}</text>
    </svg>
  );
}

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

/** Waktu WITA (UTC+8) dari jam perangkat, tanpa bergantung zona waktu perangkat. */
function waktuWita(d: Date) {
  const w = new Date(d.getTime() + 8 * 3600_000 + d.getTimezoneOffset() * 60_000);
  const p = (n: number) => String(n).padStart(2, '0');
  return { hari: HARI[w.getDay()], tanggal: `${w.getDate()} ${BULAN[w.getMonth()]} ${w.getFullYear()}`, jam: `${p(w.getHours())}:${p(w.getMinutes())}:${p(w.getSeconds())}`, jamWita: w.getHours() };
}

function KartuWaktu() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  const w = waktuWita(now);
  return (
    <section aria-label="Hari, tanggal, dan waktu" className="flex flex-1 flex-col items-center justify-center rounded-lg border border-ink-edge bg-ink-surface p-4 text-center">
      <div className="text-mist-dim">{w.hari}</div>
      <div className="my-1 text-[1.15em] font-semibold">{w.tanggal}</div>
      <div className="mono tnum text-[2.4em] font-bold leading-tight">{w.jam}</div>
      <div className="text-2xs text-mist-dim">WITA (UTC+8)</div>
    </section>
  );
}

export function PortalPublikPage({ onBack }: { onBack: () => void }) {
  const [daftar, setDaftar] = useState<TAPublik[]>([]);
  const [taId, setTaId] = useState('');
  const [r, setR] = useState<RingkasanPublik | null>(null);
  const [pengaturan, setPengaturan] = useState<PengaturanPortal>({ video_id: null, logo: null });
  useEffect(() => {
    let batal = false;
    void daftarTAPublikAsync().then((d) => { if (batal) return; setDaftar(d); setTaId((cur) => cur || (d.find((t) => t.bawaan)?.id ?? d[0]?.id ?? '')); });
    void pengaturanPortalAsync().then((p) => { if (!batal) setPengaturan(p); });
    return () => { batal = true; };
  }, []);
  const [layarPenuh, setLayarPenuh] = useState(false);

  const segarkan = useCallback(() => { if (!taId) { setR(null); return; } void ringkasanPublikAsync(taId).then((x) => { if (x) setR(x); else setR((lama) => lama); }); }, [taId]);
  useEffect(() => { segarkan(); const t = setInterval(segarkan, SEGAR_MS); return () => clearInterval(t); }, [segarkan]);

  // Layar TV yang menyala berminggu-minggu: muat ulang sekali tiap dini hari (03:00 WITA) agar tetap ringan.
  useEffect(() => {
    if (window.location.hash !== '#/portal') return;
    const w = new Date(); const sekarangWita = new Date(w.getTime() + 8 * 3600_000 + w.getTimezoneOffset() * 60_000);
    const target = new Date(sekarangWita); target.setHours(3, 0, 0, 0); if (target <= sekarangWita) target.setDate(target.getDate() + 1);
    const t = setTimeout(() => window.location.reload(), target.getTime() - sekarangWita.getTime());
    return () => clearTimeout(t);
  }, []);

  const alih = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen?.();
    else void document.documentElement.requestFullscreen?.();
  }, []);
  useEffect(() => {
    const ubah = () => setLayarPenuh(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', ubah);
    return () => document.removeEventListener('fullscreenchange', ubah);
  }, []);
  // Pintasan F tidak mengganggu pengetikan pada kolom isian
  useEffect(() => {
    const tekan = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'f' || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) || t.isContentEditable)) return;
      alih();
    };
    window.addEventListener('keydown', tekan);
    return () => window.removeEventListener('keydown', tekan);
  }, [alih]);

  const fokus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber';
  const padat = (r?.seksi.length ?? 0) > 8;

  return (
    <div className={`flex min-h-screen flex-col bg-ink text-mist md:h-screen md:overflow-hidden ${layarPenuh ? 'text-base lg:text-lg' : 'text-sm'}`} data-portal-publik>
      <header className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-ink-edge bg-ink-surface px-4 py-2 md:px-6">
        <div className="flex h-12 w-12 items-center justify-center">
          {pengaturan.logo && <img src={pengaturan.logo} alt="Logo instansi" className="max-h-12 max-w-12 object-contain" />}
        </div>
        <div className="text-center">
          <h1 className="text-[1.35em] font-bold leading-tight">Portal Keterbukaan Informasi Anggaran</h1>
          <p className="text-2xs text-mist-dim">Pemerintah Kecamatan Batumandi{r ? ` • ${r.ta_label}` : ''}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center"><Logo varian="ikon" tinggi={44} /></div>
      </header>

      {!r ? <p className="flex-1 p-6 text-mist-dim">Data TA tidak tersedia.</p> : (
        <main className="grid min-h-0 flex-1 gap-3 p-3 md:grid-cols-[1fr_1.9fr_1fr] md:p-4">
          <div className="flex min-h-0 flex-col gap-3">
            <section aria-label="Realisasi" className="rounded-lg border border-ink-edge bg-ink-surface p-3">
              <h2 className="mb-1 font-semibold">Realisasi Belanja</h2>
              <Gauge persen={r.persen_realisasi} label="BKU dibukukan terhadap pagu" />
            </section>
            <section aria-label="Status SPJ" className="flex-1 rounded-lg border border-ink-edge bg-ink-surface p-3">
              <h2 className="mb-1 font-semibold">Status SPJ</h2>
              <Donut r={r} />
              <ul className="mt-2 space-y-1 text-[.9em]">
                {r.kategori.map((k) => (
                  <li key={k.kode} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2" style={{ color: GAYA[k.kode].warna }}>{GAYA[k.kode].ikon}<span className="text-mist">{k.label}</span></span>
                    <span className="mono tnum text-mist">{k.cacah}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="flex min-h-0 flex-col gap-3">
            <section aria-label="Ringkasan" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Tiker label="Tahun Anggaran" nilai={r.ta_label.replace('TA ', '')} />
              <Tiker label="Realisasi" nilai={persenTeks(r.persen_realisasi)} />
              <Tiker label="Total SPJ" nilai={String(r.total_spj)} />
              <Tiker label="Jumlah seksi" nilai={String(r.seksi.length)} />
            </section>
            <section aria-label="Video informasi" className="aspect-video w-full overflow-hidden rounded-lg border border-ink-edge bg-black">
              {pengaturan.video_id
                ? <iframe title="Video informasi" src={alamatEmbed(pengaturan.video_id)} className="h-full w-full" allow="autoplay; encrypted-media" referrerPolicy="strict-origin-when-cross-origin" />
                : <div className="grid h-full place-items-center text-mist-dim"><Logo varian="ikon" tinggi={64} /></div>}
            </section>
            <section aria-label="Proporsi status SPJ" className="flex-1 rounded-lg border border-ink-edge bg-ink-surface p-3">
              <h2 className="mb-2 font-semibold">Proporsi Status SPJ</h2>
              <div className="flex h-4 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={r.kategori.map((k) => `${k.label} ${persenTeks(k.persen)}`).join(', ')}>
                {r.kategori.filter((k) => k.cacah > 0).map((k) => <span key={k.kode} style={{ width: `${(k.cacah / Math.max(1, r.total_spj)) * 100}%`, background: GAYA[k.kode].warna }} />)}
              </div>
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[.9em] text-mist-dim">
                {r.kategori.map((k) => <li key={k.kode} className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: GAYA[k.kode].warna }} />{persenTeks(k.persen)} {k.label}</li>)}
              </ul>
            </section>
          </div>

          <div className="flex min-h-0 flex-col gap-3">
            <section aria-label="Peringkat seksi" className="rounded-lg border border-ink-edge bg-ink-surface p-3">
              <h2 className="mb-2 font-semibold">Peringkat Realisasi per Seksi</h2>
              <ol className={padat ? 'space-y-1.5 text-[.85em]' : 'space-y-2.5'}>
                {r.seksi.map((s) => (
                  <li key={s.id}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate"><span className="mono tnum mr-2 text-mist-dim">{s.peringkat}.</span>{s.nama}</span>
                      <span className="mono tnum">{persenTeks(s.persen)}</span>
                    </div>
                    <div className="mt-1 h-2.5 w-full overflow-hidden rounded bg-ink" role="progressbar" aria-label={`Realisasi ${s.nama}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={s.persen ?? undefined} aria-valuetext={persenTeks(s.persen)}>
                      <div className="h-full bg-amber" style={{ width: `${Math.min(100, s.persen ?? 0)}%` }} />
                    </div>
                  </li>
                ))}
              </ol>
            </section>
            <KartuWaktu />
          </div>
        </main>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-ink-edge px-4 py-1.5 text-2xs text-mist-dim md:px-6">
        <span>Realisasi dihitung dari BKU yang sudah dibukukan; komitmen yang belum dibukukan tidak dihitung. Diperbarui otomatis tiap 5 menit{r ? ` • terakhir ${r.diperbarui} WITA` : ''}.</span>
        <span className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2">Tahun Anggaran
            <select value={taId} onChange={(e) => setTaId(e.target.value)} className={`rounded-md border border-ink-edge bg-ink px-2 py-1 text-mist ${fokus}`}>
              {daftar.map((t) => <option key={t.id} value={t.id}>{t.label}{t.bawaan ? ' (Aktif)' : ` (${t.status})`}</option>)}
            </select>
          </label>
          <button onClick={alih} className={`flex items-center gap-1 rounded-md border border-ink-edge px-2.5 py-1 hover:text-mist ${fokus}`} aria-label={layarPenuh ? 'Keluar layar penuh' : 'Layar penuh'} title="Layar penuh (F)">
            {layarPenuh ? <Minimize2 size={14} aria-hidden /> : <Maximize2 size={14} aria-hidden />} {layarPenuh ? 'Tutup layar penuh' : 'Layar penuh'}
          </button>
          <button onClick={onBack} className={`flex items-center gap-1 rounded-md border border-teal px-2.5 py-1 text-teal hover:bg-ink ${fokus}`}>
            <ArrowLeft size={14} aria-hidden /> Kembali ke login
          </button>
        </span>
      </footer>
    </div>
  );
}

function Tiker({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div className="rounded-lg border border-ink-edge bg-ink-surface px-3 py-2">
      <div className="text-2xs text-mist-dim">{label}</div>
      <div className="mono tnum text-[1.3em] font-semibold text-mist">{nilai}</div>
    </div>
  );
}
