import { Fragment, useReducer, useState } from 'react';
import { Button, Input, RupiahInput, useToast } from '@/components/ui';
import { repo } from '@/data/repo';
import * as anggaran from '@/data/anggaran';
import { formatRupiah } from '@/lib/format';
import { formatTanggalPendek } from '@/lib/wita';
import { aktorSesi, ErrorLine, Panel, SectionTitle } from '@/components/AnggaranShared';

type Aktor = NonNullable<ReturnType<typeof aktorSesi>>;

// Satu halaman pergeseran: daftar anggaran yang bisa langsung diisi Pagu baru. Pergeseran satu ke satu, banyak rekening,
// dalam satu subkegiatan maupun antar-subkegiatan memakai alur yang sama. Hasil dihitung ulang, Simpan hanya bila seimbang.
export function PergeseranPanel({ ta_id, aktor, onChanged }: { ta_id: string; aktor: Aktor; onChanged: () => void }) {
  const rows = repo.alokasiRekeningByTA(ta_id).filter((a) => a.disahkan);
  const pemetaan = new Map(repo.pemetaanByTA(ta_id).map((p) => [p.id, p]));
  const labelBaris = (id: string) => {
    const a = rows.find((r) => r.id === id);
    if (!a) return '';
    const sub = pemetaan.get(a.pemetaan_subkegiatan_id);
    return `${sub?.kode_snapshot ?? '-'} ${sub?.nama_snapshot ?? ''} • ${a.kode_rekening_snapshot} ${a.nama_rekening_snapshot}`;
  };

  const toast = useToast();
  const [baru, setBaru] = useState<Record<string, number>>({});
  const [alasan, setAlasan] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [kunci, setKunci] = useState(0); // mengosongkan isian setelah simpan atau setel ulang
  const [, refresh] = useReducer((x: number) => x + 1, 0);
  const bisaGeser = rows.length >= 2;

  const setel = () => { setBaru({}); setAlasan(''); setErr(null); setKunci((k) => k + 1); };
  const kirim = async () => {
    const hasil = await anggaran.geserMulti(ta_id, Object.fromEntries(rows.map((r) => [r.id, baru[r.id] ?? r.pagu])), alasan, aktor);
    if (!hasil.ok) { setErr(hasil.error ?? 'Gagal'); return; }
    setel(); toast.notify('Tersimpan'); refresh(); onChanged();
  };

  const riwayat = anggaran.ledgerByTA(ta_id).filter((l) => l.jenis === 'pergeseran');
  const riwayatPerNomor = new Map<string, typeof riwayat>();
  for (const l of riwayat) {
    const daftar = riwayatPerNomor.get(l.referensi ?? '') ?? [];
    daftar.push(l);
    riwayatPerNomor.set(l.referensi ?? '', daftar);
  }

  return (
    <Panel>
      <SectionTitle title="Pergeseran Anggaran" desc="Isi Pagu baru pada rekening yang berubah, di subkegiatan yang sama maupun antar-subkegiatan. Total Pagu Induk tidak berubah. Hanya Bendahara yang dapat menggeser." />
      {!bisaGeser && <p className="mt-2 text-sm text-mist-dim">Pergeseran membutuhkan minimal dua rekening yang sudah disahkan.</p>}
      {bisaGeser && (
        <FormGeser key={kunci} rows={rows} pemetaan={pemetaan} baru={baru} setBaru={setBaru} alasan={alasan} setAlasan={setAlasan}
          err={err} nomor={anggaran.nomorPergeseranBerikutnya(ta_id)} onKirim={kirim} onSetel={setel} />
      )}
      {riwayatPerNomor.size > 0 && (
        <>
          <p className="mb-2 mt-6 text-sm font-semibold text-mist">Riwayat pergeseran</p>
          <ul className="space-y-2 text-sm">
            {[...riwayatPerNomor.entries()].map(([nomor, daftar]) => {
              const turun = daftar.filter((l) => l.perubahan < 0);
              const naik = daftar.filter((l) => l.perubahan > 0);
              const jumlah = naik.reduce((t, l) => t + l.perubahan, 0);
              return (
                <li key={nomor} className="rounded-md border border-ink-line px-3 py-2">
                  <p className="mono text-mist">{nomor}</p>
                  <p className="text-mist-dim">{formatTanggalPendek(daftar[0].waktu.slice(0, 10))} · {daftar[0].aktor_nama_snapshot} · {formatRupiah(jumlah)}</p>
                  {turun.map((l) => <p key={l.id} className="text-mist-dim">Sumber (-): {labelBaris(l.alokasi_rekening_id)} · <span className="mono tnum">{formatRupiah(-l.perubahan)}</span></p>)}
                  {naik.map((l) => <p key={l.id} className="text-mist-dim">Tujuan (+): {labelBaris(l.alokasi_rekening_id)} · <span className="mono tnum">{formatRupiah(l.perubahan)}</span></p>)}
                  {daftar[0].keterangan && <p className="text-mist-dim">Alasan: {daftar[0].keterangan}</p>}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Panel>
  );
}

type Baris = ReturnType<typeof repo.alokasiRekeningByTA>[number];
type Pemetaan = Map<string, ReturnType<typeof repo.pemetaanByTA>[number]>;

function kelompok(rows: Baris[], pemetaan: Pemetaan) {
  const m = new Map<string, Baris[]>();
  for (const r of rows) m.set(r.pemetaan_subkegiatan_id, [...(m.get(r.pemetaan_subkegiatan_id) ?? []), r]);
  return [...m.entries()].map(([pid, daftar]) => ({ pid, sub: pemetaan.get(pid), daftar }))
    .sort((a, b) => (a.sub?.kode_snapshot ?? '').localeCompare(b.sub?.kode_snapshot ?? ''));
}

// Formulir pergeseran: Bendahara mengisi Pagu baru (angka akhir); sistem menghitung selisih dan hasil per subkegiatan.
function FormGeser({ rows, pemetaan, baru, setBaru, alasan, setAlasan, err, nomor, onKirim, onSetel }: {
  rows: Baris[]; pemetaan: Pemetaan;
  baru: Record<string, number>; setBaru: (f: (b: Record<string, number>) => Record<string, number>) => void;
  alasan: string; setAlasan: (v: string) => void; err: string | null; nomor: string; onKirim: () => void; onSetel: () => void;
}) {
  const [cari, setCari] = useState('');
  const [hanyaUbah, setHanyaUbah] = useState(false);
  const nilai = (r: Baris) => baru[r.id] ?? r.pagu;
  const ubah = rows.filter((r) => nilai(r) !== r.pagu);
  const naik = ubah.filter((r) => nilai(r) > r.pagu).reduce((t, r) => t + (nilai(r) - r.pagu), 0);
  const turun = ubah.filter((r) => nilai(r) < r.pagu).reduce((t, r) => t + (r.pagu - nilai(r)), 0);
  const selisih = naik - turun;
  const masalah = new Map<string, string>();
  for (const r of ubah) if (nilai(r) < r.pagu && r.pagu - nilai(r) > anggaran.sisaSpdBebas(r)) masalah.set(r.id, `Melebihi Sisa SPD Bebas (${formatRupiah(anggaran.sisaSpdBebas(r))})`);
  const seimbang = ubah.length >= 2 && selisih === 0;
  const bisaSimpan = seimbang && masalah.size === 0 && alasan.trim().length > 0;
  const q = cari.trim().toLowerCase();
  const grupSemua = kelompok(rows, pemetaan);
  const grup = grupSemua.map((g) => ({
    ...g,
    daftar: g.daftar.filter((r) => (!hanyaUbah || nilai(r) !== r.pagu) && (!q || `${g.sub?.kode_snapshot} ${g.sub?.nama_snapshot} ${r.kode_rekening_snapshot} ${r.nama_rekening_snapshot}`.toLowerCase().includes(q))),
  })).filter((g) => g.daftar.length > 0);
  const subUbah = grupSemua.map((g) => {
    const net = g.daftar.reduce((t, r) => t + (nilai(r) - r.pagu), 0);
    return { pid: g.pid, sub: g.sub, net, lama: anggaran.paguSubkegiatan(g.pid) };
  }).filter((x) => x.net !== 0);

  return (
    <div className="mt-3">
      <p className="mb-3 text-xs text-mist-dim">Isi <b className="text-mist">Pagu baru</b> pada rekening yang berubah; rekening lain dibiarkan. Simpan hanya aktif bila total naik sama dengan total turun. Berita acara berikutnya: <span className="mono">{nomor}</span></p>
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <Input className="w-full sm:w-64" value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari subkegiatan atau rekening" aria-label="Cari subkegiatan atau rekening" />
        <label className="flex items-center gap-2 text-xs text-mist-dim"><input type="checkbox" checked={hanyaUbah} onChange={(e) => setHanyaUbah(e.target.checked)} /> Hanya yang berubah</label>
      </div>
      <div className="max-h-[480px] overflow-auto rounded-md border border-ink-edge">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="sticky top-0 z-10 bg-ink-surface text-2xs uppercase tracking-wider text-mist-dim">
            <tr><th className="px-3 py-2 text-left">Subkegiatan / Rekening</th><th className="px-3 py-2 text-right">Pagu sekarang</th><th className="px-3 py-2 text-right">SPD</th><th className="px-3 py-2 text-right">Realisasi</th><th className="px-3 py-2 text-right">Sisa SPD Bebas</th><th className="w-52 px-3 py-2 text-right">Pagu baru</th><th className="px-3 py-2 text-right">Selisih</th></tr>
          </thead>
          <tbody>
            {grup.map((g) => (
              <Fragment key={g.pid}>
                <tr className="border-t border-ink-edge bg-ink/60">
                  <td className="px-3 py-1.5 font-medium text-mist">{g.sub?.kode_snapshot} {g.sub?.nama_snapshot}</td>
                  <td className="mono tnum px-3 py-1.5 text-right text-mist">{formatRupiah(anggaran.paguSubkegiatan(g.pid))}</td>
                  <td colSpan={4} className="mono tnum px-3 py-1.5 text-right text-2xs text-mist-dim">
                    {(() => { const n = g.daftar.reduce((t, r) => t + (nilai(r) - r.pagu), 0); return n === 0 ? '' : `Subkegiatan menjadi ${formatRupiah(anggaran.paguSubkegiatan(g.pid) + n)} (${n > 0 ? '+' : '−'}${formatRupiah(Math.abs(n))})`; })()}
                  </td>
                  <td />
                </tr>
                {g.daftar.map((r) => {
                  const d = nilai(r) - r.pagu;
                  return (
                    <tr key={r.id} className={`border-t border-ink-edge/60 ${d !== 0 ? 'bg-amber/5' : ''}`}>
                      <td className="py-1.5 pl-7 pr-3 text-mist-dim">{r.kode_rekening_snapshot} {r.nama_rekening_snapshot}{masalah.has(r.id) && <span className="mt-0.5 block text-2xs text-crit">{masalah.get(r.id)}</span>}</td>
                      <td className="mono tnum px-3 py-1.5 text-right">{formatRupiah(r.pagu)}</td>
                      <td className="mono tnum px-3 py-1.5 text-right">{formatRupiah(r.spd_aktif)}</td>
                      <td className="mono tnum px-3 py-1.5 text-right">{formatRupiah(anggaran.realisasiAlokasi(r))}</td>
                      <td className="mono tnum px-3 py-1.5 text-right">{formatRupiah(anggaran.sisaSpdBebas(r))}</td>
                      <td className="px-3 py-1"><RupiahInput className="block w-full text-right" value={nilai(r)} onChange={(v) => setBaru((b) => ({ ...b, [r.id]: v }))} aria-label={`Pagu baru ${r.kode_rekening_snapshot}`} /></td>
                      <td className={`mono tnum px-3 py-1.5 text-right ${d > 0 ? 'text-ok' : d < 0 ? 'text-crit' : 'text-mist-dim'}`}>{d === 0 ? '—' : `${d > 0 ? '+' : '−'}${formatRupiah(Math.abs(d))}`}</td>
                    </tr>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 rounded-md border border-amber/30 bg-amber/5 p-3 text-xs text-mist">
        <p className="mb-2 font-semibold text-amber">Hasil pergeseran</p>
        <div className="grid gap-2 sm:grid-cols-3">
          <p>Total naik <span className="mono tnum block text-sm text-ok">{formatRupiah(naik)}</span></p>
          <p>Total turun <span className="mono tnum block text-sm text-crit">{formatRupiah(turun)}</span></p>
          <p>Selisih <span className={`mono tnum block text-sm ${selisih === 0 && ubah.length >= 2 ? 'text-ok' : 'text-amber'}`}>{selisih === 0 ? formatRupiah(0) : `${selisih > 0 ? '+' : '−'}${formatRupiah(Math.abs(selisih))}`}</span></p>
        </div>
        <p className="mt-2 text-mist-dim">
          {ubah.length < 2 ? 'Ubah minimal dua rekening.' : selisih === 0 ? 'Seimbang. Total Pagu Induk tidak berubah.' : selisih > 0 ? `Belum seimbang: kurangi ${formatRupiah(selisih)} lagi atau tambah pengurangan.` : `Belum seimbang: masih ada ${formatRupiah(-selisih)} yang belum dialokasikan ke rekening tujuan.`}
        </p>
        {subUbah.length > 0 && (
          <div className="mt-2 border-t border-amber/20 pt-2">
            <p className="mb-1 text-mist-dim">Pagu subkegiatan setelah pergeseran</p>
            {subUbah.map((x) => (
              <p key={x.pid} className="mono tnum text-mist-dim">{x.sub?.kode_snapshot} · {formatRupiah(x.lama)} → <span className="text-mist">{formatRupiah(x.lama + x.net)}</span></p>
            ))}
          </div>
        )}
      </div>
      <label className="mt-3 block text-sm text-mist-dim">
        Alasan (wajib)
        <Input className="mt-1 block w-full" value={alasan} onChange={(e) => setAlasan(e.target.value)} />
      </label>
      <ErrorLine msg={err} />
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onSetel} disabled={ubah.length === 0 && alasan === ''}>Setel Ulang</Button>
        <Button variant="primary" onClick={onKirim} disabled={!bisaSimpan}>Simpan Pergeseran</Button>
      </div>
    </div>
  );
}
