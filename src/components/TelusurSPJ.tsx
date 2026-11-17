// Arsip — Telusur SPJ: daftar SPJ Dibukukan dikelompokkan per Subkegiatan → Rekening belanja (hanya tampil di layar, tanpa unduhan).
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, ScrollText } from 'lucide-react';
import { Button, Card, EmptyState } from '@/components/ui';
import { repo } from '@/data/repo';
import { formatRupiah } from '@/lib/format';
import { formatTanggalPendek } from '@/lib/wita';
import * as arsip from '@/data/arsip';
import type { ArsipBKU } from '@/data/arsip';
import { DetailSPJ } from '@/components/DetailSPJ';

function MultiPilih({ label, opsi, nilai, onUbah }: { label: string; opsi: { value: string; label: string }[]; nilai: Set<string>; onUbah: (s: Set<string>) => void }) {
  const [cari, setCari] = useState('');
  const [buka, setBuka] = useState(false);
  const tampil = opsi.filter((o) => o.label.toLowerCase().includes(cari.toLowerCase()));
  const ubah = (v: string) => { const n = new Set(nilai); if (n.has(v)) n.delete(v); else n.add(v); onUbah(n); };
  return (
    <div className="relative">
      <button type="button" onClick={() => setBuka((b) => !b)} aria-expanded={buka}
        className="flex items-center gap-1 rounded-md border border-ink-edge bg-ink px-2 py-1 text-2xs text-mist">
        {label}: {nilai.size === 0 ? 'semua' : `${nilai.size} dipilih`} <ChevronDown size={12} />
      </button>
      {buka && (
        <div className="absolute z-20 mt-1 w-80 max-w-[90vw] rounded-md border border-ink-edge bg-ink-surface p-2 shadow-xl">
          <input value={cari} onChange={(e) => setCari(e.target.value)} placeholder={`Cari ${label.toLowerCase()}...`} aria-label={`Cari ${label}`}
            className="mb-2 w-full rounded-md border border-ink-edge bg-ink px-2 py-1 text-2xs text-mist" />
          <div className="max-h-56 overflow-y-auto">
            {tampil.length === 0 ? <p className="p-2 text-2xs text-mist-dim">Tidak ada yang cocok.</p> : tampil.map((o) => (
              <label key={o.value} className="flex cursor-pointer items-start gap-2 px-1 py-1 text-2xs text-mist hover:bg-ink">
                <input type="checkbox" checked={nilai.has(o.value)} onChange={() => ubah(o.value)} className="mt-0.5" /> <span>{o.label}</span>
              </label>
            ))}
          </div>
          <div className="mt-2 flex justify-between">
            <Button variant="ghost" onClick={() => onUbah(new Set())}>Kosongkan</Button>
            <Button variant="secondary" onClick={() => setBuka(false)}>Selesai</Button>
          </div>
        </div>
      )}
    </div>
  );
}

const idAman = (s: string) => 'tl-' + s.replace(/[^a-zA-Z0-9]/g, '_');

export function TabTelusur() {
  const [data, setData] = useState<ArsipBKU[]>([]);
  const [galat, setGalat] = useState<string | null>(null);
  const [memuat, setMemuat] = useState(true);
  const [dari, setDari] = useState('');
  const [sampai, setSampai] = useState('');
  const [fSub, setFSub] = useState<Set<string>>(new Set());
  const [fRek, setFRek] = useState<Set<string>>(new Set());
  const [terbuka, setTerbuka] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<string | null>(null);

  const muat = useCallback(async () => {
    setMemuat(true);
    const r = await arsip.muatBKU();
    setData(r.baris); setGalat(r.ok ? null : r.error ?? 'Gagal memuat.'); setMemuat(false);
  }, []);
  useEffect(() => { void muat(); }, [muat]);

  const namaRek = useMemo(() => new Map(repo.masterRekeningBelanja().map((r) => [r.kode_rekening.trim(), r.nama])), []);
  const rekLabel = (kode: string) => (namaRek.get(kode) ? `${kode} ${namaRek.get(kode)}` : kode || '(tanpa rekening)');
  const subOpsi = useMemo(() => Array.from(new Set<string>(data.map((d) => d.subkegiatan))).sort().map((x) => ({ value: x, label: x || '(tanpa subkegiatan)' })), [data]);
  const rekOpsi = useMemo(() => Array.from(new Set<string>(data.map((d) => d.kode_rekening ?? ''))).sort().map((x) => ({ value: x, label: rekLabel(x) })), [data, namaRek]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasil = useMemo(() => data.filter((d) => {
    if (dari && d.tanggal_bku < dari) return false;
    if (sampai && d.tanggal_bku > sampai) return false;
    if (fSub.size && !fSub.has(d.subkegiatan)) return false;
    if (fRek.size && !fRek.has(d.kode_rekening ?? '')) return false;
    return true;
  }), [data, dari, sampai, fSub, fRek]);

  const kelompok = useMemo(() => {
    const m = new Map<string, Map<string, ArsipBKU[]>>();
    for (const d of hasil) {
      const r = d.kode_rekening ?? '';
      if (!m.has(d.subkegiatan)) m.set(d.subkegiatan, new Map());
      const mm = m.get(d.subkegiatan)!;
      if (!mm.has(r)) mm.set(r, []);
      mm.get(r)!.push(d);
    }
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([sub, rm]) => ({
      sub, rek: Array.from(rm.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([kode, baris]) => ({
        kode, baris: baris.slice().sort((a, b) => a.tanggal_bku.localeCompare(b.tanggal_bku) || a.nomor_bku.localeCompare(b.nomor_bku)),
        total: baris.reduce((t, x) => t + x.bruto, 0),
      })),
    }));
  }, [hasil]);
  const semuaRek = useMemo(() => Array.from(new Set<string>(hasil.map((d) => d.kode_rekening ?? ''))).sort(), [hasil]);
  const totalAll = hasil.reduce((t, x) => t + x.bruto, 0);

  const kunciSub = (sub: string) => `s|${sub}`;
  const kunciRek = (sub: string, rek: string) => `r|${sub}|${rek}`;
  const toggle = (k: string) => setTerbuka((p) => { const n = new Set(p); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const bukaSemua = () => setTerbuka(new Set(kelompok.flatMap((g) => [kunciSub(g.sub), ...g.rek.map((r) => kunciRek(g.sub, r.kode))])));
  const lompat = (sub: string, rek: string) => {
    setTerbuka((p) => new Set([...p, kunciSub(sub), kunciRek(sub, rek)]));
    setTimeout(() => document.getElementById(idAman(kunciRek(sub, rek)))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };
  const reset = () => { setDari(''); setSampai(''); setFSub(new Set()); setFRek(new Set()); };
  const bisaDetail = (spj_id: string) => !!repo.spjById(spj_id);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <p className="mb-3 text-2xs text-mist-dim">Menampilkan SPJ berstatus Dibukukan (sudah mengurangi SPD). Periode berdasarkan tanggal BKU. Hanya tampil di layar. BKU yang dicabut otomatis tidak ikut.</p>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1 text-2xs text-mist-dim">Tanggal BKU dari
            <input type="date" value={dari} onChange={(e) => setDari(e.target.value)} className="rounded-md border border-ink-edge bg-ink px-2 py-1 text-2xs text-mist" /></label>
          <label className="flex items-center gap-1 text-2xs text-mist-dim">sampai
            <input type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} className="rounded-md border border-ink-edge bg-ink px-2 py-1 text-2xs text-mist" /></label>
          <MultiPilih label="Subkegiatan" opsi={subOpsi} nilai={fSub} onUbah={setFSub} />
          <MultiPilih label="Rekening belanja" opsi={rekOpsi} nilai={fRek} onUbah={setFRek} />
          <Button variant="ghost" onClick={reset}>Reset</Button>
        </div>
        <p className="mt-3 text-2xs text-mist-dim">Ditemukan <span className="mono tnum text-mist">{hasil.length}</span> SPJ • total <span className="mono tnum text-mist">{formatRupiah(totalAll)}</span></p>
      </Card>

      {memuat ? <Card className="p-5 text-sm text-mist-dim">Memuat...</Card>
        : galat ? <Card className="p-5 text-sm text-crit">{galat}</Card>
        : hasil.length === 0 ? <Card><EmptyState icon={<ScrollText size={28} />} title="Tidak ada SPJ Dibukukan pada filter ini" /></Card> : (
          <>
            <Card>
              <div className="border-b border-ink-edge px-4 py-3 text-sm font-semibold text-mist">Ringkasan (klik sel untuk melompat ke daftar)</div>
              <div className="overflow-x-auto">
                <table className="w-full text-2xs">
                  <thead className="bg-ink text-mist-dim"><tr className="text-left">
                    <th className="px-3 py-2 font-medium">Subkegiatan</th>
                    {semuaRek.map((r) => <th key={r} className="px-3 py-2 font-medium whitespace-nowrap" title={rekLabel(r)}>{r || '—'}</th>)}
                  </tr></thead>
                  <tbody>{kelompok.map((g) => (
                    <tr key={g.sub} className="border-t border-ink-edge">
                      <td className="px-3 py-2 text-mist">{g.sub || '—'}</td>
                      {semuaRek.map((r) => {
                        const c = g.rek.find((x) => x.kode === r);
                        return <td key={r} className="px-3 py-2">{c ? (
                          <button type="button" onClick={() => lompat(g.sub, r)} className="text-left hover:text-amber">
                            <div className="mono tnum text-mist">{c.baris.length} SPJ</div><div className="mono tnum text-mist-dim">{formatRupiah(c.total)}</div>
                          </button>) : <span className="text-mist-dim">—</span>}</td>;
                      })}
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </Card>

            <div className="flex gap-2">
              <Button variant="secondary" onClick={bukaSemua}>Buka semua</Button>
              <Button variant="ghost" onClick={() => setTerbuka(new Set())}>Tutup semua</Button>
            </div>

            {kelompok.map((g) => {
              const nSub = g.rek.reduce((t, r) => t + r.baris.length, 0);
              const tSub = g.rek.reduce((t, r) => t + r.total, 0);
              const bukaSub = terbuka.has(kunciSub(g.sub));
              return (
                <Card key={g.sub}>
                  <button type="button" onClick={() => toggle(kunciSub(g.sub))} aria-expanded={bukaSub}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
                    <span className="flex items-center gap-2 text-sm font-semibold text-mist">{bukaSub ? <ChevronDown size={16} /> : <ChevronRight size={16} />}{g.sub || '(tanpa subkegiatan)'}</span>
                    <span className="mono tnum text-2xs text-mist-dim">{nSub} SPJ • {formatRupiah(tSub)}</span>
                  </button>
                  {bukaSub && g.rek.map((r) => {
                    const k = kunciRek(g.sub, r.kode);
                    const bukaR = terbuka.has(k);
                    return (
                      <Fragment key={k}>
                        <button type="button" id={idAman(k)} onClick={() => toggle(k)} aria-expanded={bukaR}
                          className="flex w-full items-center justify-between gap-3 border-t border-ink-edge bg-ink px-6 py-2 text-left">
                          <span className="flex items-center gap-2 text-2xs font-medium text-mist">{bukaR ? <ChevronDown size={14} /> : <ChevronRight size={14} />}{rekLabel(r.kode)}</span>
                          <span className="mono tnum text-2xs text-mist-dim">{r.baris.length} SPJ • {formatRupiah(r.total)}</span>
                        </button>
                        {bukaR && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-2xs">
                              <thead className="text-mist-dim"><tr className="text-left">
                                {['No. Verifikasi', 'Tgl Verifikasi', 'No. BKU', 'Tgl BKU', 'Seksi', 'Penerima', 'Uraian', 'Nilai'].map((c) => <th key={c} className="px-3 py-2 font-medium whitespace-nowrap">{c}</th>)}
                              </tr></thead>
                              <tbody>{r.baris.map((d, i) => (
                                <tr key={d.id} onClick={() => { if (bisaDetail(d.spj_id)) setDetail(d.spj_id); }}
                                  className={`${i % 2 ? 'bg-ink-surface/40' : ''} ${bisaDetail(d.spj_id) ? 'cursor-pointer hover:bg-ink' : ''}`}>
                                  <td className="px-3 py-2 mono text-mist">{d.nomor_verifikasi ?? '—'}</td>
                                  <td className="px-3 py-2 text-mist-dim">{d.tanggal_verifikasi ? formatTanggalPendek(d.tanggal_verifikasi) : '—'}</td>
                                  <td className="px-3 py-2 mono text-mist">{d.nomor_bku}</td>
                                  <td className="px-3 py-2 text-mist-dim">{formatTanggalPendek(d.tanggal_bku)}</td>
                                  <td className="px-3 py-2 text-mist-dim">{d.seksi}</td>
                                  <td className="px-3 py-2 text-mist">{d.penerima ?? '—'}</td>
                                  <td className="px-3 py-2 text-mist">{d.uraian}</td>
                                  <td className="px-3 py-2 mono tnum text-mist">{formatRupiah(d.bruto)}</td>
                                </tr>
                              ))}</tbody>
                            </table>
                          </div>
                        )}
                      </Fragment>
                    );
                  })}
                </Card>
              );
            })}
          </>
        )}
      {detail && <DetailSPJ spj_id={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
