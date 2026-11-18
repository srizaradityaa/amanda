// Grafik dasbor (tampilan saja, SVG sendiri, tanpa pustaka). Data dibaca lewat src/lib/ringkasanDasbor.ts.
import { Card } from '@/components/ui';
import { AngkaBulat, AngkaPersen, AngkaRupiah } from '@/components/AngkaHitung';
import { jumlahStatusSPJ, kumulatifBulanan, ringkasanAnggaran, serapanPerSeksi, serapanPerSubkegiatan, targetWaktu } from '@/lib/ringkasanDasbor';

const AMBER = '#F59E0B', OK = '#34D399', SPIKE = '#FB923C', TRACK = '#1F2937', DIM = '#9CA3AF';
const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function AngkaBesar({ label, nilai }: { label: string; nilai: number }) {
  return (
    <Card className="p-4">
      <p className="text-2xs text-mist-dim">{label}</p>
      <p className="mono tnum mt-1 text-lg text-mist"><AngkaRupiah nilai={nilai} /></p>
    </Card>
  );
}

function Donat({ real, komit }: { real: number; komit: number }) {
  const C = 2 * Math.PI * 52;
  const r = Math.min(100, Math.max(0, real)), k = Math.min(100 - r, Math.max(0, komit));
  const lingkar = (p: number, awal: number, warna: string, kunci: string) => p > 0 && (
    <circle key={kunci} className="gambar-arc" cx="60" cy="60" r="52" fill="none" stroke={warna} strokeWidth="11"
      strokeDasharray={`${(p / 100) * C} ${C}`} strokeDashoffset={-(awal / 100) * C}
      style={{ ['--panjang' as string]: `${C}` }} transform="rotate(-90 60 60)" />
  );
  return (
    <div className="relative mx-auto h-[132px] w-[132px]">
      <svg viewBox="0 0 120 120" width="132" height="132" role="img" aria-label={`Serapan ${(real + komit).toFixed(1)} persen dari pagu`}>
        <circle cx="60" cy="60" r="52" fill="none" stroke={TRACK} strokeWidth="11" />
        {lingkar(r, 0, AMBER, 'r')}{lingkar(k, r, '#FCD34D', 'k')}
      </svg>
      <b className="mono tnum absolute inset-0 grid place-items-center text-xl text-mist"><AngkaPersen nilai={real + komit} /></b>
    </div>
  );
}

function Garis({ ta_id, tahun, pagu, seksi_id }: { ta_id: string; tahun: number; pagu: number; seksi_id?: string }) {
  const nyata = kumulatifBulanan(ta_id, tahun, pagu, seksi_id), target = targetWaktu();
  const X = (i: number) => 8 + (i * 584) / 11, Y = (p: number) => 160 - (Math.min(100, p) / 100) * 140;
  const titikNyata = nyata.map((v, i) => (v === null ? null : `${X(i)},${Y(v)}`)).filter(Boolean).join(' ');
  const titikTarget = target.map((v, i) => `${X(i)},${Y(v)}`).join(' ');
  const terakhir = [...nyata].reverse().find((v) => v !== null) ?? 0;
  return (
    <>
      <svg viewBox="0 0 600 185" width="100%" height="185" role="img" aria-label={`Realisasi kumulatif ${terakhir.toFixed(1)} persen dari pagu, dibandingkan dengan waktu berjalan`}>
        <g stroke={TRACK}>{[0, 25, 50, 75, 100].map((p) => <line key={p} x1="8" x2="592" y1={Y(p)} y2={Y(p)} />)}</g>
        <g fill={DIM} fontSize="9">{[0, 50, 100].map((p) => <text key={p} x="10" y={Y(p) - 3}>{p}%</text>)}</g>
        <polyline points={titikTarget} fill="none" stroke={DIM} strokeWidth="1.5" strokeDasharray="4 5" />
        {titikNyata && <polyline className="gambar-garis" pathLength={1} strokeDasharray="1" points={titikNyata} fill="none" stroke={AMBER} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />}
        <g fill={DIM} fontSize="10">{BULAN.map((b, i) => (i % 3 === 0 || i === 11) && <text key={b} x={X(i)} y="180" textAnchor="middle">{b}</text>)}</g>
      </svg>
      <div className="mt-1 flex flex-wrap gap-4 text-2xs text-mist-dim">
        <span><b style={{ color: AMBER }}>━</b> Realisasi kumulatif</span><span>┅ Waktu berjalan</span>
      </div>
    </>
  );
}

export interface SegPie { label: string; nilai: number; warna: string }

function Pie({ judul, segs }: { judul: string; segs: SegPie[] }) {
  const total = segs.reduce((s, x) => s + x.nilai, 0);
  let awal = 0;
  return (
    <div className="flex flex-wrap items-center gap-4">
      <svg viewBox="0 0 42 42" width="118" height="118" role="img" aria-label={judul}>
        <circle cx="21" cy="21" r="15.9155" fill="none" stroke={TRACK} strokeWidth="7" />
        {total > 0 && segs.map((s) => {
          const p = (s.nilai / total) * 100, a = awal; awal += p;
          return p > 0 && <circle key={s.label} className="gambar-seg" cx="21" cy="21" r="15.9155" pathLength={100} fill="none" stroke={s.warna} strokeWidth="7"
            strokeDasharray={`${Math.max(0, p - 0.8)} ${100 - Math.max(0, p - 0.8)}`} strokeDashoffset={-a} transform="rotate(-90 21 21)" />;
        })}
      </svg>
      <ul className="min-w-[130px] flex-1 space-y-1.5 text-2xs">
        {segs.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-mist">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: s.warna }} />{s.label}
            <b className="mono tnum ml-auto">{s.nilai}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Batang({ ta_id, seksi_id }: { ta_id: string; seksi_id?: string }) {
  const rows = seksi_id ? serapanPerSubkegiatan(ta_id, seksi_id) : serapanPerSeksi(ta_id);
  if (rows.length === 0) return <p className="text-2xs text-mist-dim">{seksi_id ? 'Belum ada subkegiatan.' : 'Belum ada seksi aktif.'}</p>;
  return (
    <ul className="space-y-1">
      {rows.map((r) => (
        <li key={r.nama} className="grid grid-cols-[minmax(80px,130px)_1fr_48px] items-center gap-3 py-1 text-2xs">
          <span className="truncate text-mist" title={r.nama}>{r.nama}</span>
          <div className="h-2.5 overflow-hidden rounded-full bg-ink" role="progressbar" aria-label={`Serapan ${r.nama}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(r.pct)}>
            <div className="tumbuh h-full rounded-full bg-amber" style={{ width: `${Math.min(100, r.pct)}%` }} />
          </div>
          <b className="mono tnum text-right text-mist">{r.pct.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%</b>
        </li>
      ))}
    </ul>
  );
}

export interface ItemTindakan { label: string; jumlah: number; menu?: string }

/** Kartu "Perlu tindakan": daftar hal yang menunggu, dengan angka dan tautan ke menu terkait. */
export function KartuTindakan({ judul = 'Perlu tindakan', items }: { judul?: string; items: ItemTindakan[] }) {
  return (
    <Card className="p-4">
      <h3 className="mb-2 text-sm font-semibold text-mist">{judul}</h3>
      <ul className="divide-y divide-ink-edge/60">
        {items.map((i) => (
          <li key={i.label} className="flex items-center gap-3 py-2 text-2xs">
            <span className="flex-1 text-mist">{i.label}</span>
            <b className={`mono tnum text-sm ${i.jumlah > 0 ? 'text-amber' : 'text-mist-dim'}`}><AngkaBulat nilai={i.jumlah} /></b>
            {i.menu && i.jumlah > 0 && (
              <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('amanda:nav', { detail: i.menu }))} className="text-teal hover:underline">Buka</button>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** Blok grafik dasbor: angka besar, donat serapan, garis kumulatif, pie, batang, dan kartu perlu tindakan.
 *  Bila seksi_id diisi (PPTK), semua angka dibatasi pada seksi itu dan batang menampilkan subkegiatan. */
export function GrafikAnggaran({ ta_id, tahun, seksi_id, pie, tindakan }: {
  ta_id: string; tahun: number; seksi_id?: string; pie?: { judul: string; segs: SegPie[] }; tindakan?: ItemTindakan[];
}) {
  const m = ringkasanAnggaran(ta_id, seksi_id);
  const s = jumlahStatusSPJ(ta_id, seksi_id);
  const pieSegs = pie ?? { judul: seksi_id ? 'Status SPJ seksi' : 'Status SPJ', segs: [
    { label: 'Dibukukan', nilai: s.dibukukan, warna: OK }, { label: 'Menunggu BKU', nilai: s.menungguBku, warna: SPIKE },
    { label: 'Terkunci', nilai: s.terkunci, warna: AMBER }, { label: 'Draft', nilai: s.draft, warna: '#6B7280' },
  ] };
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AngkaBesar label={seksi_id ? 'Pagu seksi' : 'Pagu'} nilai={m.pagu} />
        <AngkaBesar label="Realisasi" nilai={m.realisasi} />
        <AngkaBesar label="Sisa anggaran" nilai={m.sisaAnggaran} />
        <AngkaBesar label="Sisa SPD Bebas" nilai={m.sisaSpd} />
      </div>
      <div className="grid gap-3 lg:grid-cols-12">
        <Card className="p-4 lg:col-span-8"><h3 className="mb-2 text-sm font-semibold text-mist">Realisasi kumulatif terhadap waktu berjalan</h3><Garis ta_id={ta_id} tahun={tahun} pagu={m.pagu} seksi_id={seksi_id} /></Card>
        <Card className="p-4 text-center lg:col-span-4">
          <h3 className="mb-2 text-left text-sm font-semibold text-mist">Serapan anggaran</h3>
          <Donat real={m.pctRealisasi} komit={m.pctKomitmen} />
          <p className="mt-2 text-2xs text-mist-dim">Realisasi BKU (amber) dan komitmen kuitansi (kuning muda), dari pagu</p>
        </Card>
      </div>
      <div className="grid gap-3 lg:grid-cols-12">
        <Card className="p-4 lg:col-span-5"><h3 className="mb-3 text-sm font-semibold text-mist">{pieSegs.judul}</h3><Pie judul={pieSegs.judul} segs={pieSegs.segs} /></Card>
        <Card className="p-4 lg:col-span-7"><h3 className="mb-2 text-sm font-semibold text-mist">{seksi_id ? 'Serapan per subkegiatan' : 'Serapan per seksi'}</h3><Batang ta_id={ta_id} seksi_id={seksi_id} /></Card>
      </div>
      {tindakan && <KartuTindakan items={tindakan} />}
    </div>
  );
}

/** Batang sederhana dan donat generik untuk dasbor Admin (tanpa angka anggaran). */
export function BatangDaftar({ rows, maks }: { rows: { label: string; nilai: number }[]; maks?: number }) {
  const m = maks ?? Math.max(1, ...rows.map((r) => r.nilai));
  return (
    <ul className="space-y-1">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[minmax(110px,170px)_1fr_40px] items-center gap-3 py-1 text-2xs">
          <span className="truncate text-mist">{r.label}</span>
          <div className="h-2.5 overflow-hidden rounded-full bg-ink"><div className="tumbuh h-full rounded-full bg-amber" style={{ width: `${(r.nilai / m) * 100}%` }} /></div>
          <b className="mono tnum text-right text-mist">{r.nilai}</b>
        </li>
      ))}
    </ul>
  );
}
export { Pie as PieGrafik };
