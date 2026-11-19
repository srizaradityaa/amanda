import { Fragment, useReducer, useState } from 'react';
import { Button, Input, Modal, RupiahInput, useToast } from '@/components/ui';
import { repo } from '@/data/repo';
import * as anggaran from '@/data/anggaran';
import { formatRupiah } from '@/lib/format';
import { formatTanggalPendek } from '@/lib/wita';
import { aktorSesi, ErrorLine, Panel, SectionTitle } from '@/components/AnggaranShared';

type Aktor = NonNullable<ReturnType<typeof aktorSesi>>;

const SELECT_CLASS = 'mt-1 block w-full rounded-md border border-ink-edge bg-ink px-3 py-2 text-sm text-mist focus:border-amber focus:outline-none';

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
  const [open, setOpen] = useState(false);
  const [sumber, setSumber] = useState('');
  const [tujuan, setTujuan] = useState('');
  const [nilai, setNilai] = useState(0);
  const [alasan, setAlasan] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [, refresh] = useReducer((x: number) => x + 1, 0);
  const [multi, setMulti] = useState(false);
  const [baru, setBaru] = useState<Record<string, number>>({});
  const [cari, setCari] = useState('');
  const [hanyaUbah, setHanyaUbah] = useState(false);
  const [alasanMulti, setAlasanMulti] = useState('');
  const [errMulti, setErrMulti] = useState<string | null>(null);
  const bukaMulti = () => {
    setBaru(Object.fromEntries(rows.map((r) => [r.id, r.pagu])));
    setCari(''); setHanyaUbah(false); setAlasanMulti(''); setErrMulti(null); setMulti(true);
  };
  const tutupMulti = () => { setMulti(false); setErrMulti(null); };
  const kirimMulti = async () => {
    const hasil = await anggaran.geserMulti(ta_id, baru, alasanMulti, aktor);
    if (!hasil.ok) { setErrMulti(hasil.error ?? 'Gagal'); return; }
    setMulti(false); setErrMulti(null); toast.notify('Tersimpan'); refresh(); onChanged();
  };

  const bisaGeser = rows.length >= 2;
  const sumberRow = rows.find((r) => r.id === sumber);
  const tujuanRow = rows.find((r) => r.id === tujuan);
  const antarSub = !!sumberRow && !!tujuanRow && sumberRow.pemetaan_subkegiatan_id !== tujuanRow.pemetaan_subkegiatan_id;
  const tutup = () => { setOpen(false); setErr(null); };
  const buka = () => {
    setSumber(rows[0]?.id ?? '');
    setTujuan(rows[1]?.id ?? '');
    setNilai(0);
    setAlasan('');
    setErr(null);
    setOpen(true);
  };
  const kirim = async () => {
    const hasil = await anggaran.geserSPD(ta_id, sumber, tujuan, nilai, alasan, aktor);
    if (!hasil.ok) { setErr(hasil.error ?? 'Gagal'); return; }
    setOpen(false);
    setErr(null);
    toast.notify('Tersimpan');
    refresh();
    onChanged();
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
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <SectionTitle title="Pergeseran Anggaran" desc="Memindahkan alokasi antar-rekening atau antar-subkegiatan. Total Pagu Induk tidak berubah. Hanya Bendahara yang dapat menggeser." />
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={buka} disabled={!bisaGeser}>Geser Anggaran</Button>
          <Button variant="secondary" onClick={bukaMulti} disabled={!bisaGeser}>Geser Banyak Rekening</Button>
        </div>
      </div>
      {!bisaGeser && (
        <p className="text-sm text-mist-dim">Pergeseran membutuhkan minimal dua rekening yang sudah disahkan.</p>
      )}
      {bisaGeser && <DaftarAnggaran rows={rows} pemetaan={pemetaan} />}
      {riwayatPerNomor.size > 0 && (
        <ul className="mt-4 space-y-2 text-sm">
          {[...riwayatPerNomor.entries()].map(([nomor, daftar]) => {
            const turun = daftar.filter((l) => l.perubahan < 0);
            const naik = daftar.filter((l) => l.perubahan > 0);
            const jumlah = naik.reduce((t, l) => t + l.perubahan, 0);
            return (
              <li key={nomor} className="rounded-md border border-ink-line px-3 py-2">
                <p className="mono text-mist">{nomor}</p>
                <p className="text-mist-dim">
                  {formatTanggalPendek(daftar[0].waktu.slice(0, 10))} · {daftar[0].aktor_nama_snapshot} · {formatRupiah(jumlah)}
                </p>
                {turun.map((l) => <p key={l.id} className="text-mist-dim">Sumber (-): {labelBaris(l.alokasi_rekening_id)} · <span className="mono tnum">{formatRupiah(-l.perubahan)}</span></p>)}
                {naik.map((l) => <p key={l.id} className="text-mist-dim">Tujuan (+): {labelBaris(l.alokasi_rekening_id)} · <span className="mono tnum">{formatRupiah(l.perubahan)}</span></p>)}
                {daftar[0].keterangan && <p className="text-mist-dim">Alasan: {daftar[0].keterangan}</p>}
              </li>
            );
          })}
        </ul>
      )}
      <Modal
        open={open}
        onClose={tutup}
        title="Geser Anggaran"
        footer={
          <>
            <Button variant="secondary" onClick={tutup}>Batal</Button>
            <Button variant="primary" onClick={kirim}>Konfirmasi Geser</Button>
          </>
        }
      >
        <label className="block text-sm text-mist-dim">
          Rekening sumber (-)
          <select className={SELECT_CLASS} value={sumber} onChange={(e) => setSumber(e.target.value)}>
            {rows.map((r) => (
              <option key={r.id} value={r.id}>{labelBaris(r.id)}</option>
            ))}
          </select>
        </label>
        <p className="mt-1 text-xs text-mist-dim">
          Sisa SPD Bebas sumber: <span className="mono tnum text-mist">{sumberRow ? formatRupiah(anggaran.sisaSpdBebas(sumberRow)) : '—'}</span>
        </p>
        <label className="mt-3 block text-sm text-mist-dim">
          Rekening tujuan (+)
          <select className={SELECT_CLASS} value={tujuan} onChange={(e) => setTujuan(e.target.value)}>
            {rows.filter((r) => r.id !== sumber).map((r) => (
              <option key={r.id} value={r.id}>{labelBaris(r.id)}</option>
            ))}
          </select>
        </label>
        <label className="mt-3 block text-sm text-mist-dim">
          Nilai (Rp)
          <RupiahInput className="mt-1 block w-full" value={nilai} onChange={setNilai} />
        </label>
        {sumberRow && tujuanRow && nilai > 0 && (
          <div className="mt-3 rounded-md border border-amber/30 bg-amber/5 p-3 text-xs text-mist">
            <p className="mb-1 font-semibold text-amber">Ringkasan sebelum konfirmasi · {anggaran.nomorPergeseranBerikutnya(ta_id)}</p>
            <p>Sumber (-): {labelBaris(sumber)}</p>
            <p className="mono tnum text-mist-dim">Pagu {formatRupiah(sumberRow.pagu)} → {formatRupiah(sumberRow.pagu - nilai)} · SPD {formatRupiah(sumberRow.spd_aktif)} → {formatRupiah(sumberRow.spd_aktif - nilai)}</p>
            <p className="mt-1">Tujuan (+): {labelBaris(tujuan)}</p>
            <p className="mono tnum text-mist-dim">Pagu {formatRupiah(tujuanRow.pagu)} → {formatRupiah(tujuanRow.pagu + nilai)} · SPD {formatRupiah(tujuanRow.spd_aktif)} → {formatRupiah(tujuanRow.spd_aktif + nilai)}</p>
            <p className="mt-1 text-mist-dim">{antarSub ? 'Antar-subkegiatan: pagu subkegiatan ikut berpindah.' : 'Dalam subkegiatan yang sama.'} Total Pagu Induk tidak berubah.</p>
          </div>
        )}
        <label className="mt-3 block text-sm text-mist-dim">
          Keterangan (opsional)
          <Input className="mt-1 block w-full" value={alasan} onChange={(e) => setAlasan(e.target.value)} />
        </label>
        <ErrorLine msg={err} />
      </Modal>
      <MultiModal
        open={multi} onClose={tutupMulti} rows={rows} pemetaan={pemetaan} baru={baru} setBaru={setBaru}
        cari={cari} setCari={setCari} hanyaUbah={hanyaUbah} setHanyaUbah={setHanyaUbah}
        alasan={alasanMulti} setAlasan={setAlasanMulti} err={errMulti} nomor={anggaran.nomorPergeseranBerikutnya(ta_id)} onKirim={kirimMulti}
      />
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

// Daftar anggaran: subkegiatan dan rekening belanja, agar Bendahara melihat apa yang akan digeser.
function DaftarAnggaran({ rows, pemetaan }: { rows: Baris[]; pemetaan: Pemetaan }) {
  const [cari, setCari] = useState('');
  const q = cari.trim().toLowerCase();
  const grup = kelompok(rows, pemetaan).map((g) => ({
    ...g,
    daftar: g.daftar.filter((r) => !q || `${g.sub?.kode_snapshot} ${g.sub?.nama_snapshot} ${r.kode_rekening_snapshot} ${r.nama_rekening_snapshot}`.toLowerCase().includes(q)),
  })).filter((g) => g.daftar.length > 0);
  return (
    <div className="mb-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-mist">Daftar anggaran</p>
        <Input className="w-full sm:w-64" value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari subkegiatan atau rekening" aria-label="Cari subkegiatan atau rekening" />
      </div>
      <div className="max-h-[420px] overflow-auto rounded-md border border-ink-edge">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="sticky top-0 bg-ink-surface text-2xs uppercase tracking-wider text-mist-dim">
            <tr><th className="px-3 py-2 text-left">Subkegiatan / Rekening</th><th className="px-3 py-2 text-right">Pagu</th><th className="px-3 py-2 text-right">SPD</th><th className="px-3 py-2 text-right">Realisasi</th><th className="px-3 py-2 text-right">Sisa SPD Bebas</th></tr>
          </thead>
          <tbody>
            {grup.map((g) => (
              <Fragment key={g.pid}>
                <tr className="border-t border-ink-edge bg-ink/60">
                  <td className="px-3 py-2 font-medium text-mist">{g.sub?.kode_snapshot} {g.sub?.nama_snapshot}</td>
                  <td className="mono tnum px-3 py-2 text-right text-mist">{formatRupiah(anggaran.paguSubkegiatan(g.pid))}</td>
                  <td colSpan={3} />
                </tr>
                {g.daftar.map((r) => (
                  <tr key={r.id} className="border-t border-ink-edge/60">
                    <td className="py-1.5 pl-7 pr-3 text-mist-dim">{r.kode_rekening_snapshot} {r.nama_rekening_snapshot}</td>
                    <td className="mono tnum px-3 py-1.5 text-right">{formatRupiah(r.pagu)}</td>
                    <td className="mono tnum px-3 py-1.5 text-right">{formatRupiah(r.spd_aktif)}</td>
                    <td className="mono tnum px-3 py-1.5 text-right">{formatRupiah(anggaran.realisasiAlokasi(r))}</td>
                    <td className="mono tnum px-3 py-1.5 text-right">{formatRupiah(anggaran.sisaSpdBebas(r))}</td>
                  </tr>
                ))}
              </Fragment>
            ))}
            {grup.length === 0 && <tr><td colSpan={5} className="px-3 py-4 text-center text-mist-dim">Tidak ada yang cocok.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Pergeseran banyak rekening: Bendahara mengisi Pagu baru (angka akhir); sistem menghitung selisih dan hasil per subkegiatan.
function MultiModal({ open, onClose, rows, pemetaan, baru, setBaru, cari, setCari, hanyaUbah, setHanyaUbah, alasan, setAlasan, err, nomor, onKirim }: {
  open: boolean; onClose: () => void; rows: Baris[]; pemetaan: Pemetaan;
  baru: Record<string, number>; setBaru: (f: (b: Record<string, number>) => Record<string, number>) => void;
  cari: string; setCari: (v: string) => void; hanyaUbah: boolean; setHanyaUbah: (v: boolean) => void;
  alasan: string; setAlasan: (v: string) => void; err: string | null; nomor: string; onKirim: () => void;
}) {
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
    <Modal
      open={open} onClose={onClose} wider title={`Geser Banyak Rekening · ${nomor}`}
      footer={<><Button variant="secondary" onClick={onClose}>Batal</Button><Button variant="primary" onClick={onKirim} disabled={!bisaSimpan}>Simpan Pergeseran</Button></>}
    >
      <p className="mb-3 text-xs text-mist-dim">Isi <b className="text-mist">Pagu baru</b> pada rekening yang berubah. Rekening yang tidak diubah dibiarkan. Simpan hanya aktif bila total naik sama dengan total turun.</p>
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <Input className="w-full sm:w-64" value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari subkegiatan atau rekening" aria-label="Cari subkegiatan atau rekening" />
        <label className="flex items-center gap-2 text-xs text-mist-dim"><input type="checkbox" checked={hanyaUbah} onChange={(e) => setHanyaUbah(e.target.checked)} /> Hanya yang berubah</label>
      </div>
      <div className="max-h-[320px] overflow-auto rounded-md border border-ink-edge">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="sticky top-0 z-10 bg-ink-surface text-2xs uppercase tracking-wider text-mist-dim">
            <tr><th className="px-3 py-2 text-left">Subkegiatan / Rekening</th><th className="px-3 py-2 text-right">Pagu sekarang</th><th className="px-3 py-2 text-right">Sisa SPD Bebas</th><th className="w-52 px-3 py-2 text-right">Pagu baru</th><th className="px-3 py-2 text-right">Selisih</th></tr>
          </thead>
          <tbody>
            {grup.map((g) => (
              <Fragment key={g.pid}>
                <tr className="border-t border-ink-edge bg-ink/60"><td colSpan={5} className="px-3 py-1.5 font-medium text-mist">{g.sub?.kode_snapshot} {g.sub?.nama_snapshot}</td></tr>
                {g.daftar.map((r) => {
                  const d = nilai(r) - r.pagu;
                  return (
                    <tr key={r.id} className={`border-t border-ink-edge/60 ${d !== 0 ? 'bg-amber/5' : ''}`}>
                      <td className="py-1.5 pl-7 pr-3 text-mist-dim">{r.kode_rekening_snapshot} {r.nama_rekening_snapshot}{masalah.has(r.id) && <span className="mt-0.5 block text-2xs text-crit">{masalah.get(r.id)}</span>}</td>
                      <td className="mono tnum px-3 py-1.5 text-right">{formatRupiah(r.pagu)}</td>
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
    </Modal>
  );
}
