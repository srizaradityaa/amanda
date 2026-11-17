// BKU-01..05 — Buku Kas Umum (murni realisasi pengeluaran belanja). Bendahara mencatat/koreksi/cabut; Verifikator hanya membaca.
import { useState } from 'react';
import { Button, Card, EmptyState, FilterSelect, SearchBox, StatusBadge, Tabs, useToast, usePaging, Pager } from '@/components/ui';
import { SectionTitle } from '@/components/AnggaranShared';
import { repo } from '@/data/repo';
import { getSession } from '@/lib/auth';
import { formatRupiah } from '@/lib/format';
import { formatTanggalPendek } from '@/lib/wita';
import type { SPJ } from '@/data/types';
import { BookOpen } from 'lucide-react';
import { DetailSPJ } from '@/components/DetailSPJ';
import { RincianBKUModal } from '@/components/RincianBKUModal';

export function BKUPage() {
  const s = getSession()!;
  const ta_id = s.active_ta_id!;
  const ta = repo.tahunAnggaranById(ta_id)!;
  const bendahara = s.active_role === 'bendahara';
  const [, setTick] = useState(0);
  const bump = () => setTick((n) => n + 1);
  const [search, setSearch] = useState('');
  const [fSeksi, setFSeksi] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [dari, setDari] = useState('');
  const [sampai, setSampai] = useState('');
  const [catat, setCatat] = useState<SPJ | null>(null);
  const [pilih, setPilih] = useState<Set<string>>(new Set());
  const [infoSetuju, setInfoSetuju] = useState<string | null>(null);
  const toast = useToast();
  const [tab, setTab] = useState<'tindakan' | 'selesai'>('tindakan');
  const [lihat, setLihat] = useState<string | null>(null);

  const kuitansi = repo.kuitansiByTA(ta_id);
  const seksiList = repo.seksiTAByTA(ta_id);
  const menunggu = repo.spjByTA(ta_id).filter((x) => x.status === 'Menunggu BKU');
  const drafByspj = new Map(repo.bkuDrafByTA(ta_id).map((d) => [d.spj_id, d]));
  const pgM = usePaging(menunggu);
  const adaDraf = menunggu.filter((x) => drafByspj.has(x.id));
  const toggle = (id: string) => setPilih((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const setujui = async (ids: string[]) => {
    const r = await repo.setujuiDrafBKU(ids, s) as { ok: boolean; error?: string; hasil?: { spj: string; ok: boolean; error?: string }[] };
    if (!r.ok) { setInfoSetuju(r.error ?? 'Gagal'); return; }
    const gagal = (r.hasil ?? []).filter((h) => !h.ok);
    const berhasil = (r.hasil ?? []).length - gagal.length;
    setPilih(new Set());
    if (gagal.length === 0) { setInfoSetuju(null); toast.notify(`${berhasil} BKU dibukukan`); }
    else setInfoSetuju(`${berhasil} berhasil, ${gagal.length} gagal: ` + gagal.map((h) => `${drafByspj.get(h.spj)?.nomor_bku ?? h.spj} (${h.error})`).join('; '));
    bump();
  };
  const daftar = repo.bkuByTA(ta_id).filter((b) => {
    const k = kuitansi.find((q) => q.id === b.kuitansi_id);
    if (fSeksi && k?.seksi_ta_id !== fSeksi) return false;
    if (fStatus && b.status !== fStatus) return false;
    if (dari && b.tanggal_bku < dari) return false;
    if (sampai && b.tanggal_bku > sampai) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!b.nomor_bku.toLowerCase().includes(q) && !(k?.uraian ?? '').toLowerCase().includes(q)) return false;
    }
    return true;
  });
  const pgB = usePaging(daftar);
  const reset = () => { setSearch(''); setFSeksi(''); setFStatus(''); setDari(''); setSampai(''); };

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <SectionTitle title="Buku Kas Umum (BKU)" desc={`TA ${ta.tahun} • mencatat realisasi pengeluaran belanja per kuitansi/SPJ`} />
        <p className="text-2xs text-mist-dim">BKU ini tidak memuat penerimaan kas, SP2D, saldo awal, maupun saldo kas.</p>
      </Card>

      {bendahara && <Tabs nilai={tab} onPilih={setTab} daftar={[['tindakan', `Perlu Tindakan (${menunggu.length})`], ['selesai', `Selesai (${repo.bkuByTA(ta_id).filter((b) => b.status === 'Aktif').length})`]]} />}

      {bendahara && tab === 'tindakan' && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-edge px-4 py-3">
            <h3 className="text-sm font-semibold text-mist">SPJ Menunggu BKU ({menunggu.length}) <span className="ml-1 text-2xs font-normal text-mist-dim">· draf {adaDraf.length}</span></h3>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setPilih(new Set(adaDraf.map((x) => x.id)))} disabled={adaDraf.length === 0}>Pilih semua draf</Button>
              <Button variant="success" onClick={() => { void setujui([...pilih]); }} disabled={pilih.size === 0}>Setujui terpilih{pilih.size > 0 ? ` (${pilih.size})` : ''}</Button>
            </div>
          </div>
          {infoSetuju && <p className="px-4 pt-2 text-2xs text-warn">{infoSetuju}</p>}
          <div className="overflow-x-auto">
            {menunggu.length === 0 ? <EmptyState icon={<BookOpen size={28} />} title="Tidak ada SPJ yang menunggu pencatatan BKU" /> : (
              <table className="w-full text-2xs">
                <thead className="bg-ink text-mist-dim"><tr className="text-left">
                  {['', 'Seksi', 'Kuitansi', 'Bruto', 'Draf BKU', 'Aksi'].map((c) => <th key={c} className="px-4 py-2 font-medium whitespace-nowrap">{c}</th>)}
                </tr></thead>
                <tbody>{pgM.baris.map((x, i) => {
                  const k = kuitansi.find((q) => q.id === x.kuitansi_id);
                  return (
                    <tr key={x.id} className={i % 2 ? 'bg-ink-surface/40' : ''}>
                      <td className="px-4 py-2"><input type="checkbox" aria-label="Pilih draf" disabled={!drafByspj.has(x.id)} checked={pilih.has(x.id)} onChange={() => toggle(x.id)} /></td>
                      <td className="px-4 py-2 text-mist">{seksiList.find((q) => q.id === k?.seksi_ta_id)?.nama_snapshot}</td>
                      <td className="px-4 py-2 text-mist">{k?.uraian}</td>
                      <td className="px-4 py-2 mono tnum text-mist">{formatRupiah(k?.bruto ?? 0)}</td>
                      <td className="px-4 py-2 text-mist">{drafByspj.has(x.id) ? <span className="mono">{drafByspj.get(x.id)!.nomor_bku} · {formatTanggalPendek(drafByspj.get(x.id)!.tanggal_bku)}</span> : <span className="text-mist-dim">Belum ada</span>}</td>
                      <td className="px-4 py-2"><div className="flex gap-2">
                        <Button variant="secondary" onClick={() => setCatat(x)}>{drafByspj.has(x.id) ? 'Rincian dan draf' : 'Catat BKU'}</Button>
                        {drafByspj.has(x.id) && <Button variant="success" onClick={() => { void setujui([x.id]); }}>Setujui</Button>}
                      </div></td>
                    </tr>
                  );
                })}</tbody>
              </table>
            )}
          </div>
        <Pager {...pgM} />
        </Card>
      )}

      {(!bendahara || tab === 'selesai') && <Card>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-edge px-4 py-3">
          <h3 className="text-sm font-semibold text-mist">Daftar BKU</h3>
          <div className="flex flex-wrap items-center gap-2">
            <SearchBox value={search} onChange={setSearch} placeholder="Cari No. BKU/uraian..." />
            <FilterSelect value={fSeksi} onChange={setFSeksi} label="Seksi" options={seksiList.map((x) => ({ value: x.id, label: x.nama_snapshot }))} />
            <FilterSelect value={fStatus} onChange={setFStatus} label="Status" options={[{ value: 'Aktif', label: 'Aktif' }, { value: 'Dicabut', label: 'Dicabut' }]} />
            <label className="flex items-center gap-1 text-2xs text-mist-dim">Dari
              <input type="date" value={dari} onChange={(e) => setDari(e.target.value)} className="rounded-md border border-ink-edge bg-ink px-2 py-1 text-2xs text-mist" /></label>
            <label className="flex items-center gap-1 text-2xs text-mist-dim">Sampai
              <input type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} className="rounded-md border border-ink-edge bg-ink px-2 py-1 text-2xs text-mist" /></label>
            <Button variant="ghost" onClick={reset}>Reset</Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          {daftar.length === 0 ? <EmptyState icon={<BookOpen size={28} />} title="Belum ada BKU pada filter ini" /> : (
            <table className="w-full text-2xs">
              <thead className="bg-ink text-mist-dim"><tr className="text-left">
                {['No. BKU', 'Tanggal', 'Seksi', 'Uraian', 'Bruto', 'Status', 'Aksi'].map((c) => <th key={c} className="px-4 py-2 font-medium whitespace-nowrap">{c}</th>)}
              </tr></thead>
              <tbody>{pgB.baris.map((b, i) => {
                const k = kuitansi.find((q) => q.id === b.kuitansi_id);
                return (
                  <tr key={b.id} className={i % 2 ? 'bg-ink-surface/40' : ''}>
                    <td className="px-4 py-2 mono text-mist">{b.nomor_bku}</td>
                    <td className="px-4 py-2 text-mist-dim">{formatTanggalPendek(b.tanggal_bku)}</td>
                    <td className="px-4 py-2 text-mist-dim">{seksiList.find((q) => q.id === k?.seksi_ta_id)?.nama_snapshot ?? '—'}</td>
                    <td className="px-4 py-2 text-mist">{k?.uraian ?? '—'}</td>
                    <td className="px-4 py-2 mono tnum text-mist">{formatRupiah(k?.bruto ?? 0)}</td>
                    <td className="px-4 py-2"><StatusBadge kind={b.status === 'Aktif' ? 'ok' : 'crit'} label={b.status} /></td>
                    <td className="px-4 py-2"><Button variant="secondary" onClick={() => setLihat(b.spj_id)}>Lihat rincian</Button></td>
                  </tr>
                );
              })}</tbody>
            </table>
          )}
        </div>
        <Pager {...pgB} />
      </Card>}

      {catat && <RincianBKUModal spj={catat} onClose={() => setCatat(null)} onSaved={() => { setCatat(null); bump(); }} />}
      {lihat && <DetailSPJ spj_id={lihat} onClose={() => setLihat(null)} />}
    </div>
  );
}
