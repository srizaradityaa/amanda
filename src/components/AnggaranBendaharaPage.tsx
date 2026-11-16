import { useReducer, useState } from 'react';
import { Button, Input, Modal, RupiahInput, useToast } from '@/components/ui';
import { repo } from '@/data/repo';
import * as anggaran from '@/data/anggaran';
import { formatRupiah } from '@/lib/format';
import { formatTanggalPendek } from '@/lib/wita';
import { aktorSesi, ErrorLine, Panel, SectionTitle, StatusSeksiBadge, useTick, sisaWaktu } from '@/components/AnggaranShared';

export function JendelaPanel({ ta_id, aktor, onChanged }: { ta_id: string; aktor: NonNullable<ReturnType<typeof aktorSesi>>; onChanged: () => void }) {
  useTick(1000);
  const toast = useToast();
  const [nilai, setNilai] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [buka, setBuka] = useState(false);
  const tutup = anggaran.jendelaTutup(ta_id);
  const terbuka = anggaran.jendelaTerbuka(ta_id);
  const atur = async () => {
    const hasil = await anggaran.aturJendela(ta_id, nilai.replace('T', ' '), aktor);
    if (!hasil.ok) { setErr(hasil.error ?? 'Gagal'); return; }
    setErr(null);
    setNilai('');
    setBuka(false);
    toast.notify('Tersimpan');
    onChanged();
  };
  return (
    <Panel>
      <SectionTitle title="Jendela Waktu Alokasi" desc="Batas waktu pengisian alokasi dalam zona WITA." />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-mist">
          Status: <span className={terbuka ? 'text-ok' : 'text-crit'}>{terbuka ? 'Dibuka' : 'Tertutup'}</span>
          {tutup && <span className="text-mist-dim"> · tutup {tutup} WITA{terbuka ? <> · sisa <span className="mono tnum text-amber">{sisaWaktu(tutup)}</span></> : ''}</span>}
        </p>
        <Button variant="secondary" onClick={() => { setErr(null); setBuka(true); }}>{tutup ? 'Ubah jendela' : 'Buka jendela'}</Button>
      </div>
      <Modal open={buka} onClose={() => setBuka(false)} title="Atur Jendela Waktu" footer={<><Button variant="secondary" onClick={() => setBuka(false)}>Batal</Button><Button variant="primary" onClick={atur} disabled={!nilai}>Simpan</Button></>}>
        <label className="block text-sm text-mist-dim">
          Tanggal dan jam tutup (WITA)
          <Input type="datetime-local" className="mt-1 block" value={nilai} onChange={(e) => setNilai(e.target.value)} />
        </label>
        <ErrorLine msg={err} />
      </Modal>
    </Panel>
  );
}

export function KesiapanPanel({ ta_id }: { ta_id: string }) {
  const seksi = repo.seksiTAByTA(ta_id).filter((s) => s.status === 'Aktif');
  return (
    <Panel>
      <SectionTitle title="Pemantau Kesiapan Seksi" desc="Status alokasi tiap seksi. Pagu seksi dihitung otomatis dari subkegiatan." />
      <table className="w-full text-sm">
        <thead className="text-left text-mist-dim">
          <tr><th className="py-2">Seksi</th><th>Pagu Seksi</th><th>Status</th></tr>
        </thead>
        <tbody>
          {seksi.map((s) => (
            <tr key={s.id} className="std-row border-t border-ink-line">
              <td className="py-2 text-mist">{s.nama_snapshot}</td>
              <td className="mono tnum text-mist">{formatRupiah(anggaran.paguSeksi(ta_id, s.id))}</td>
              <td><StatusSeksiBadge status={anggaran.statusSeksi(ta_id, s.id)} /></td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-ink-line font-medium">
            <td className="py-2 text-mist">Pagu Induk (otomatis dari total subkegiatan)</td>
            <td className="mono tnum text-mist">{formatRupiah(anggaran.paguIndukAktif(ta_id))}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </Panel>
  );
}

export function SahkanPanel({ ta_id, aktor, onChanged }: { ta_id: string; aktor: NonNullable<ReturnType<typeof aktorSesi>>; onChanged: () => void }) {
  const [err, setErr] = useState<string | null>(null);
  const toast = useToast();
  const g = anggaran.gerbangStatus(ta_id);
  const ta = repo.tahunAnggaranById(ta_id);
  const sahkan = async () => {
    const hasil = await anggaran.sahkanAlokasi(ta_id, aktor);
    if (!hasil.ok) { setErr(hasil.error ?? 'Gagal'); return; }
    setErr(null);
    toast.notify('Tersimpan');
    onChanged();
  };
  return (
    <Panel>
      <SectionTitle
        title={ta?.mode_apbd_p ? 'Sahkan ulang APBD-P' : 'Sahkan Alokasi'}
        desc={ta?.mode_apbd_p ? 'Sahkan ulang menyesuaikan SPD ke pagu perubahan. Tombol berhasil bila semua seksi Tuntas.' : 'Sahkan menerbitkan SPD 100% pagu. Berhasil bila ada pagu subkegiatan dan semua seksi Tuntas.'}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-mist">
          Status: <span className={g.disahkan ? 'text-ok' : 'text-mist-dim'}>{g.disahkan ? 'Sudah disahkan' : 'Belum disahkan'}</span>
          {' · '}Gerbang kuitansi: <span className={g.terbuka ? 'text-ok' : 'text-crit'}>{g.terbuka ? 'Terbuka' : 'Tertutup'}</span>
        </p>
        <Button variant="primary" onClick={sahkan} disabled={g.disahkan}>{ta?.mode_apbd_p ? 'Sahkan ulang' : 'Sahkan'}</Button>
      </div>
      <ErrorLine msg={err} />
    </Panel>
  );
}

export function SpdPanel({ ta_id, aktor, onChanged }: { ta_id: string; aktor: NonNullable<ReturnType<typeof aktorSesi>>; onChanged: () => void }) {
  const rows = repo.alokasiRekeningByTA(ta_id).filter((a) => a.disahkan);
  const pemetaan = new Map(repo.pemetaanByTA(ta_id).map((p) => [p.id, p]));
  const [modal, setModal] = useState<string | null>(null);
  const toast = useToast();
  const [final, setFinal] = useState(0);
  const [alasan, setAlasan] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [, refresh] = useReducer((x: number) => x + 1, 0);
  const baris = rows.find((r) => r.id === modal) ?? null;
  const buka = (id: string) => {
    const a = rows.find((r) => r.id === id);
    setModal(id); setFinal(a?.spd_aktif ?? 0); setAlasan(''); setErr(null);
  };
  const tutup = () => { setModal(null); setErr(null); };
  const selisih = baris ? final - baris.spd_aktif : 0;
  const kirim = async () => {
    if (!baris) return;
    const hasil = await anggaran.aturSPDFinal(baris.id, final, alasan, aktor);
    if (!hasil.ok) { setErr(hasil.error ?? 'Gagal'); return; }
    setModal(null); setErr(null);
    toast.notify('Tersimpan');
    refresh();
    onChanged();
  };
  const ledger = anggaran.ledgerByTA(ta_id);
  const namaRek = (id: string) => { const a = rows.find((r) => r.id === id); return a ? `${a.kode_rekening_snapshot} ${a.nama_rekening_snapshot}` : ''; };
  return (
    <Panel>
      <SectionTitle title="SPD dan Efisiensi" desc="Sisa SPD Bebas = SPD aktif - komitmen kuitansi - realisasi BKU. Bendahara mengisi SPD final yang diperlukan; selisihnya dicatat otomatis sebagai Efisiensi (turun) atau Kenaikan (naik)." />
      {rows.length === 0 ? (
        <p className="text-sm text-mist-dim">SPD belum terbit. Sahkan alokasi terlebih dahulu.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-mist-dim">
            <tr><th className="py-2">Subkegiatan / Rekening belanja</th><th className="text-right">Pagu</th><th className="text-right">SPD Aktif</th><th className="text-right">Komitmen</th><th className="text-right">Realisasi</th><th className="text-right">Sisa SPD Bebas</th><th /></tr>
          </thead>
          <tbody>
            {rows.map((a) => {
              const sub = pemetaan.get(a.pemetaan_subkegiatan_id);
              return (
                <tr key={a.id} className="pro-row border-t border-ink-line">
                  <td className="py-1.5 text-mist">
                    <span className="block text-2xs text-mist-dim"><span className="mono">{sub?.kode_snapshot ?? '-'}</span> {sub?.nama_snapshot}</span>
                    <span className="mono">{a.kode_rekening_snapshot}</span> {a.nama_rekening_snapshot}
                  </td>
                  <td className="mono tnum text-right text-mist">{formatRupiah(a.pagu)}</td>
                  <td className="mono tnum text-right text-mist">{formatRupiah(a.spd_aktif)}</td>
                  <td className="mono tnum text-right text-mist">{formatRupiah(anggaran.komitmenAlokasi(a))}</td>
                  <td className="mono tnum text-right text-mist">{formatRupiah(anggaran.realisasiAlokasi(a))}</td>
                  <td className="mono tnum text-right text-mist">{formatRupiah(anggaran.sisaSpdBebas(a))}</td>
                  <td className="whitespace-nowrap text-right">
                    <Button variant="ghost" onClick={() => buka(a.id)}>Atur SPD</Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {ledger.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-semibold text-mist">Riwayat perubahan SPD</p>
          <ul className="space-y-1 text-sm text-mist-dim">
            {ledger.map((l) => (
              <li key={l.id}>
                {formatTanggalPendek(l.waktu.slice(0, 10))} · {l.jenis} {formatRupiah(l.perubahan)} · {namaRek(l.alokasi_rekening_id)} · SPD menjadi {formatRupiah(l.spd_sesudah)} · {l.aktor_nama_snapshot}{l.keterangan ? ` · ${l.keterangan}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
      <Modal
        open={baris !== null}
        onClose={tutup}
        title="Atur SPD Final"
        footer={
          <>
            <Button variant="secondary" onClick={tutup}>Batal</Button>
            <Button variant="primary" onClick={kirim} disabled={selisih === 0}>Simpan</Button>
          </>
        }
      >
        {baris && (
          <>
            <p className="text-sm text-mist">{pemetaan.get(baris.pemetaan_subkegiatan_id)?.nama_snapshot}</p>
            <p className="mb-3 text-sm text-mist-dim"><span className="mono">{baris.kode_rekening_snapshot}</span> {baris.nama_rekening_snapshot}</p>
            <dl className="mb-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-mist-dim">
              <dt>Pagu rekening</dt><dd className="mono tnum text-right text-mist">{formatRupiah(baris.pagu)}</dd>
              <dt>SPD aktif saat ini</dt><dd className="mono tnum text-right text-mist">{formatRupiah(baris.spd_aktif)}</dd>
              <dt>Komitmen + realisasi</dt><dd className="mono tnum text-right text-mist">{formatRupiah(anggaran.terpakaiAlokasi(baris))}</dd>
              <dt>Sisa SPD Bebas</dt><dd className="mono tnum text-right text-mist">{formatRupiah(anggaran.sisaSpdBebas(baris))}</dd>
            </dl>
            <label className="block text-sm text-mist-dim">
              SPD final yang diperlukan (Rp)
              <RupiahInput className="mt-1 block w-full" value={final} onChange={setFinal} />
            </label>
            <p className={`mt-2 text-xs ${selisih === 0 ? 'text-mist-dim' : selisih < 0 ? 'text-warn' : 'text-ok'}`}>
              {selisih === 0 ? 'Belum ada perubahan.' : selisih < 0 ? `Dicatat sebagai Efisiensi ${formatRupiah(-selisih)}.` : `Dicatat sebagai Kenaikan ${formatRupiah(selisih)} (alasan wajib).`}
            </p>
            <label className="mt-3 block text-sm text-mist-dim">
              {selisih > 0 ? 'Alasan (wajib)' : 'Keterangan (opsional)'}
              <Input className="mt-1 block w-full" value={alasan} onChange={(e) => setAlasan(e.target.value)} />
            </label>
            <ErrorLine msg={err} />
          </>
        )}
      </Modal>
    </Panel>
  );
}

export function VersiPanel({ ta_id }: { ta_id: string }) {
  const versi = anggaran.versiByTA(ta_id);
  return (
    <Panel>
      <SectionTitle title="Versi Alokasi" desc="Setiap penyimpanan dan pengesahan tercatat dan tidak dapat diubah." />
      {versi.length === 0 ? (
        <p className="text-sm text-mist-dim">Belum ada versi alokasi.</p>
      ) : (
        <ul className="space-y-1 text-sm text-mist-dim">
          {versi.map((v) => (
            <li key={v.id}>
              {formatTanggalPendek(v.tanggal_efektif)} · {v.aktor_nama_snapshot} ({v.aktor_peran_snapshot}) · {v.keterangan} · {v.rincian.length} baris
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
