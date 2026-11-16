import { Fragment, useReducer, useState } from 'react';
import { Button, Input, Modal, RupiahInput, useToast } from '@/components/ui';
import { repo } from '@/data/repo';
import * as anggaran from '@/data/anggaran';
import { formatRupiah } from '@/lib/format';
import { getSession } from '@/lib/auth';
import { formatTanggalPendek } from '@/lib/wita';
import { aktorSesi, ErrorLine, Panel, SectionTitle, StatusSeksiBadge, useTick, sisaWaktu } from '@/components/AnggaranShared';
import { ApbdPPanel } from '@/components/ApbdPPanel';
import { PergeseranPanel } from '@/components/PergeseranPanel';

export function AnggaranBendaharaPage() {
  const sesi = getSession();
  const aktor = aktorSesi();
  const [, bump] = useReducer((x: number) => x + 1, 0);
  if (!sesi || !aktor || !sesi.active_ta_id) return null;
  const ta_id = sesi.active_ta_id;
  const ta = repo.tahunAnggaranById(ta_id);
  if (!ta) return null;
  const onChanged = () => bump();
  return (
    <div>
      <JendelaPanel ta_id={ta_id} aktor={aktor} onChanged={onChanged} />
      <KesiapanPanel ta_id={ta_id} />
      <AlokasiSubkegiatanPanel ta_id={ta_id} aktor={aktor} onChanged={onChanged} />
      <ApbdPPanel ta_id={ta_id} />
      <SahkanPanel ta_id={ta_id} aktor={aktor} onChanged={onChanged} />
      <SpdPanel ta_id={ta_id} aktor={aktor} onChanged={onChanged} />
      <PergeseranPanel ta_id={ta_id} aktor={aktor} onChanged={onChanged} />
      <VersiPanel ta_id={ta_id} />
    </div>
  );
}

function JendelaPanel({ ta_id, aktor, onChanged }: { ta_id: string; aktor: NonNullable<ReturnType<typeof aktorSesi>>; onChanged: () => void }) {
  useTick(1000);
  const toast = useToast();
  const [nilai, setNilai] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const tutup = anggaran.jendelaTutup(ta_id);
  const terbuka = anggaran.jendelaTerbuka(ta_id);
  const atur = async () => {
    const hasil = await anggaran.aturJendela(ta_id, nilai.replace('T', ' '), aktor);
    if (!hasil.ok) { setErr(hasil.error ?? 'Gagal'); return; }
    setErr(null);
    setNilai('');
    toast.notify('Tersimpan');
    onChanged();
  };
  return (
    <Panel>
      <SectionTitle title="Jendela Waktu Alokasi" desc="Batas waktu pengisian alokasi dalam zona WITA." />
      <p className="text-sm text-mist">
        Status: <span className={terbuka ? 'text-ok' : 'text-crit'}>{terbuka ? 'Dibuka' : 'Tertutup'}</span>
        {tutup && <span className="text-mist-dim"> · tutup {tutup} WITA{terbuka ? <> · sisa <span className="mono tnum text-amber">{sisaWaktu(tutup)}</span></> : ''}</span>}
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="text-sm text-mist-dim">
          Tanggal dan jam tutup
          <Input type="datetime-local" className="mt-1 block" value={nilai} onChange={(e) => setNilai(e.target.value)} />
        </label>
        <Button variant="secondary" onClick={atur} disabled={!nilai}>Atur Jendela</Button>
      </div>
      <ErrorLine msg={err} />
    </Panel>
  );
}

function KesiapanPanel({ ta_id }: { ta_id: string }) {
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

function AlokasiSubkegiatanPanel({ ta_id, aktor, onChanged }: { ta_id: string; aktor: NonNullable<ReturnType<typeof aktorSesi>>; onChanged: () => void }) {
  const pemetaan = repo.pemetaanByTA(ta_id);
  const seksi = repo.seksiTAByTA(ta_id).filter((x) => x.status === 'Aktif');
  const toast = useToast();
  const [draft, setDraft] = useState<Record<string, number>>({});
  const [err, setErr] = useState<string | null>(null);
  const [buka, setBuka] = useState<Record<string, boolean>>({});
  const [tambah, setTambah] = useState<string | null>(null);
  const terkunci = anggaran.sudahDisahkan(ta_id) || !anggaran.jendelaTerbuka(ta_id);
  const nilai = (id: string) => draft[id] ?? anggaran.paguSubkegiatan(id);
  const total = pemetaan.reduce((t, p) => t + nilai(p.id), 0);

  const simpan = async () => {
    const payload = Object.fromEntries(pemetaan.map((p) => [p.id, nilai(p.id)]));
    const hasil = await anggaran.simpanAlokasiSubkegiatan(ta_id, payload, aktor);
    if (!hasil.ok) { setErr(hasil.error ?? 'Gagal'); return; }
    setErr(null);
    toast.notify('Tersimpan');
    onChanged();
  };
  const lepas = async (id: string) => {
    const hasil = await anggaran.lepasSubkegiatan(id, aktor);
    if (!hasil.ok) { setErr(hasil.error ?? 'Gagal'); return; }
    setErr(null);
    setDraft((d) => { const n = { ...d }; delete n[id]; return n; });
    onChanged();
  };

  return (
    <Panel>
      <SectionTitle title="Subkegiatan dan Pagu per Seksi" desc="Tempatkan subkegiatan pada seksi (satu subkegiatan hanya untuk satu seksi), lalu isi pagunya. Pagu Induk dihitung otomatis dari total semua subkegiatan. Klik panah untuk melihat rekening belanja." />
      {seksi.length === 0 && <p className="py-3 text-sm text-mist-dim">Belum ada seksi pada TA ini. Admin perlu menambah seksi lebih dulu.</p>}
      <div className="space-y-4">
        {seksi.map((sk) => {
          const pems = pemetaan.filter((p) => p.seksi_ta_id === sk.id);
          const subtotal = pems.reduce((t, p) => t + nilai(p.id), 0);
          return (
            <div key={sk.id} className="rounded-md border border-ink-line">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-line bg-ink/40 px-3 py-2">
                <span className="text-sm font-medium text-mist">{sk.nama_snapshot} <span className="ml-1 text-2xs font-normal text-mist-dim">({pems.length} subkegiatan)</span></span>
                <span className="mono tnum text-sm text-mist">{formatRupiah(subtotal)}</span>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {pems.length === 0 && (
                    <tr><td className="px-3 py-3 text-2xs text-mist-dim">Belum ada subkegiatan pada seksi ini.</td></tr>
                  )}
                  {pems.map((p) => {
                    const rek = anggaran.rekeningPemetaan(p.id);
                    const terbuka = !!buka[p.id];
                    return (
                      <Fragment key={p.id}>
                        <tr className="pro-row border-t border-ink-line first:border-t-0">
                          <td className="px-3 py-1.5 text-mist">
                            <button type="button" className="mr-2 text-mist-dim hover:text-mist" aria-expanded={terbuka} onClick={() => setBuka((b) => ({ ...b, [p.id]: !b[p.id] }))}>{terbuka ? '▾' : '▸'}</button>
                            <span className="mono">{p.kode_snapshot}</span> {p.nama_snapshot}
                            <span className="ml-2 text-2xs text-mist-dim">({rek.length} rekening)</span>
                          </td>
                          <td className="w-48 text-right">
                            <RupiahInput className="w-44" disabled={terkunci} value={nilai(p.id)} onChange={(n) => setDraft((d) => ({ ...d, [p.id]: n }))} />
                          </td>
                          <td className="w-16 pr-3 text-right">
                            {!terkunci && <button type="button" className="text-2xs text-crit hover:underline" onClick={() => { void lepas(p.id); }}>Hapus</button>}
                          </td>
                        </tr>
                        {terbuka && (
                          <tr className="bg-ink/40">
                            <td colSpan={3} className="px-6 py-2">
                              {rek.length === 0 ? (
                                <p className="text-2xs text-mist-dim">PPTK belum mengisi rekening belanja.</p>
                              ) : (
                                <table className="w-full text-2xs">
                                  <tbody>
                                    {rek.map((r) => (
                                      <tr key={r.id} className="border-t border-ink-line/60">
                                        <td className="py-1 text-mist"><span className="mono">{r.kode_rekening_snapshot}</span> {r.nama_rekening_snapshot}</td>
                                        <td className="mono tnum text-right text-mist">{formatRupiah(r.pagu)}</td>
                                      </tr>
                                    ))}
                                    <tr className="border-t border-ink-line font-medium">
                                      <td className="py-1 text-mist-dim">Total rekening</td>
                                      <td className={`mono tnum text-right ${anggaran.totalRekeningPemetaan(p.id) === nilai(p.id) ? 'text-ok' : 'text-warn'}`}>{formatRupiah(anggaran.totalRekeningPemetaan(p.id))}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
              {!terkunci && (
                <div className="border-t border-ink-line px-3 py-2">
                  <Button variant="ghost" className="text-2xs" onClick={() => setTambah(sk.id)}>+ Tambah subkegiatan</Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-mist-dim">Pagu Induk (otomatis) <span className="mono tnum text-mist">{formatRupiah(total)}</span></p>
        <Button variant="primary" onClick={simpan} disabled={terkunci || pemetaan.length === 0}>Simpan Pagu</Button>
      </div>
      {terkunci && <p className="mt-2 text-xs text-mist-dim">Terkunci: jendela alokasi tertutup atau sudah disahkan. Buka jendela waktu untuk menambah subkegiatan atau mengubah pagu.</p>}
      <ErrorLine msg={err} />
      {tambah && <TambahSubkegiatanModal ta_id={ta_id} seksiId={tambah} aktor={aktor} onClose={() => setTambah(null)} onSaved={() => { setTambah(null); onChanged(); }} />}
    </Panel>
  );
}

function TambahSubkegiatanModal({ ta_id, seksiId, aktor, onClose, onSaved }: { ta_id: string; seksiId: string; aktor: NonNullable<ReturnType<typeof aktorSesi>>; onClose: () => void; onSaved: () => void }) {
  const [cari, setCari] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const sudah = new Set(repo.pemetaanByTA(ta_id).map((p) => p.subkegiatan_id));
  const q = cari.trim().toLowerCase();
  const daftar = repo.masterSubkegiatan().filter((x) => x.status === 'Aktif' && !sudah.has(x.id) && (!q || `${x.kode} ${x.nama}`.toLowerCase().includes(q)));
  const nama = repo.seksiTAById(seksiId)?.nama_snapshot ?? '';
  const pilih = async (subId: string) => {
    const r = await anggaran.tempatkanSubkegiatan(ta_id, seksiId, subId, aktor);
    if (!r.ok) { setErr(r.error ?? 'Gagal'); return; }
    onSaved();
  };
  return (
    <Modal open onClose={onClose} title={`Tambah subkegiatan: ${nama}`} footer={<Button variant="ghost" onClick={onClose}>Tutup</Button>}>
      <Input value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari kode atau nama subkegiatan" aria-label="Cari subkegiatan" autoFocus />
      <div className="mt-3 max-h-72 space-y-1 overflow-y-auto">
        {daftar.length === 0 && <p className="py-3 text-2xs text-mist-dim">{q ? 'Tidak ada subkegiatan yang cocok.' : 'Semua subkegiatan aktif sudah dimiliki seksi.'}</p>}
        {daftar.slice(0, 50).map((x) => (
          <button key={x.id} type="button" onClick={() => { void pilih(x.id); }} className="block w-full rounded border border-ink-line px-3 py-2 text-left text-sm text-mist hover:bg-ink/60">
            <span className="mono">{x.kode}</span> {x.nama}
          </button>
        ))}
        {daftar.length > 50 && <p className="py-1 text-2xs text-mist-dim">Menampilkan 50 pertama. Persempit dengan kata kunci.</p>}
      </div>
      <ErrorLine msg={err} />
    </Modal>
  );
}

function SahkanPanel({ ta_id, aktor, onChanged }: { ta_id: string; aktor: NonNullable<ReturnType<typeof aktorSesi>>; onChanged: () => void }) {
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

function SpdPanel({ ta_id, aktor, onChanged }: { ta_id: string; aktor: NonNullable<ReturnType<typeof aktorSesi>>; onChanged: () => void }) {
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

function VersiPanel({ ta_id }: { ta_id: string }) {
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
