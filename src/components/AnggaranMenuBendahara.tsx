import { Fragment, useReducer, useState, type ReactNode } from 'react';
import { Button, Input, Modal, RupiahInput, Select, useToast } from '@/components/ui';
import { repo } from '@/data/repo';
import * as anggaran from '@/data/anggaran';
import { formatRupiah } from '@/lib/format';
import { getSession } from '@/lib/auth';
import { aktorSesi, ErrorLine, Panel, SectionTitle, StatusSeksiBadge } from '@/components/AnggaranShared';
import { JendelaPanel, KesiapanPanel, SahkanPanel, SpdPanel, VersiPanel } from '@/components/AnggaranBendaharaPage';
import { ApbdPPanel } from '@/components/ApbdPPanel';
import { PergeseranPanel } from '@/components/PergeseranPanel';

type Aktor = NonNullable<ReturnType<typeof aktorSesi>>;
interface Ctx { ta_id: string; aktor: Aktor; onChanged: () => void }

/** Pembungkus bersama: memastikan sesi/TA ada dan menyediakan konteks + penyegaran. */
function Halaman({ render }: { render: (c: Ctx) => ReactNode }) {
  const sesi = getSession();
  const aktor = aktorSesi();
  const [, bump] = useReducer((x: number) => x + 1, 0);
  if (!sesi || !aktor || !sesi.active_ta_id) return null;
  const ta_id = sesi.active_ta_id;
  if (!repo.tahunAnggaranById(ta_id)) return null;
  return <div>{render({ ta_id, aktor, onChanged: () => bump() })}</div>;
}

function Tabs<T extends string>({ nilai, onPilih, daftar }: { nilai: T; onPilih: (t: T) => void; daftar: [T, string][] }) {
  return (
    <div className="mb-4 flex flex-wrap gap-2" role="tablist">
      {daftar.map(([k, l]) => (
        <button key={k} type="button" role="tab" aria-selected={nilai === k} onClick={() => onPilih(k)} className={`rounded-md border px-3 py-1.5 text-2xs ${nilai === k ? 'border-amber/40 bg-amber/10 text-amber' : 'border-ink-edge text-mist-dim hover:text-mist'}`}>{l}</button>
      ))}
    </div>
  );
}

/* ---------- 1. Persiapan ---------- */
export function PersiapanPage() {
  return <Halaman render={(c) => (
    <>
      <JendelaPanel {...c} />
      <KesiapanPanel ta_id={c.ta_id} />
    </>
  )} />;
}

/* ---------- 2. Subkegiatan (Tarik dari Kamus, Kaitkan ke Seksi) ---------- */
export function SubkegiatanPage() {
  return <Halaman render={(c) => <SubkegiatanIsi {...c} />} />;
}

function SubkegiatanIsi({ ta_id, aktor, onChanged }: Ctx) {
  const [tab, setTab] = useState<'tarik' | 'kaitkan'>('tarik');
  const kolam = repo.subkegiatanTAByTA(ta_id);
  const pem = new Map(repo.pemetaanByTA(ta_id).map((p) => [p.subkegiatan_id, p]));
  const belum = kolam.filter((k) => !pem.has(k.subkegiatan_id)).length;
  return (
    <>
      <Tabs nilai={tab} onPilih={setTab} daftar={[['tarik', `Tarik dari Kamus (${kolam.length})`], ['kaitkan', `Kaitkan ke Seksi (${belum} belum)`]]} />
      {tab === 'tarik' ? <TarikTab ta_id={ta_id} aktor={aktor} onChanged={onChanged} /> : <KaitkanTab ta_id={ta_id} aktor={aktor} onChanged={onChanged} />}
    </>
  );
}

function terkunciUbah(ta_id: string) {
  return anggaran.sudahDisahkan(ta_id) || !anggaran.jendelaTerbuka(ta_id);
}

function TarikTab({ ta_id, aktor, onChanged }: Ctx) {
  const [modal, setModal] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const kolam = repo.subkegiatanTAByTA(ta_id);
  const pem = new Map(repo.pemetaanByTA(ta_id).map((p) => [p.subkegiatan_id, p]));
  const seksiNama = (id: string) => repo.seksiTAById(id)?.nama_snapshot ?? '-';
  const kunci = terkunciUbah(ta_id);
  const buang = async (subId: string) => {
    const r = await anggaran.buangSubkegiatan(ta_id, subId, aktor);
    if (!r.ok) { setErr(r.error ?? 'Gagal'); return; }
    setErr(null);
    onChanged();
  };
  return (
    <Panel>
      <SectionTitle title="Subkegiatan pada TA Ini" desc="Tarik subkegiatan dari kamus (master) ke tahun anggaran sebagai salinan. Setelah itu kaitkan tiap subkegiatan ke seksi pada tab berikutnya." />
      <div className="mb-3 flex justify-end">
        <Button variant="primary" disabled={kunci} onClick={() => { setErr(null); setModal(true); }}>Tarik dari Kamus</Button>
      </div>
      {kolam.length === 0 ? (
        <p className="py-3 text-sm text-mist-dim">Belum ada subkegiatan yang ditarik ke TA ini.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-mist-dim"><tr><th className="py-2">Subkegiatan</th><th>Seksi</th><th className="w-20" /></tr></thead>
          <tbody>
            {kolam.map((k) => {
              const p = pem.get(k.subkegiatan_id);
              return (
                <tr key={k.id} className="pro-row border-t border-ink-line">
                  <td className="py-1.5 text-mist"><span className="mono">{k.kode_snapshot}</span> {k.nama_snapshot}</td>
                  <td className={p ? 'text-mist' : 'text-warn'}>{p ? seksiNama(p.seksi_ta_id) : 'Belum dikaitkan'}</td>
                  <td className="text-right">{!p && !kunci && <button type="button" className="text-2xs text-crit hover:underline" onClick={() => { void buang(k.subkegiatan_id); }}>Buang</button>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {kunci && <p className="mt-2 text-xs text-mist-dim">Terkunci: jendela alokasi tertutup atau sudah disahkan. Buka jendela di menu Persiapan.</p>}
      <ErrorLine msg={err} />
      {modal && <TarikModal ta_id={ta_id} aktor={aktor} onClose={() => setModal(false)} onSaved={() => { setModal(false); onChanged(); }} />}
    </Panel>
  );
}

function TarikModal({ ta_id, aktor, onClose, onSaved }: { ta_id: string; aktor: Aktor; onClose: () => void; onSaved: () => void }) {
  const [cari, setCari] = useState('');
  const [pilih, setPilih] = useState<Set<string>>(new Set());
  const [err, setErr] = useState<string | null>(null);
  const sudah = new Set(repo.subkegiatanTAByTA(ta_id).map((k) => k.subkegiatan_id));
  const q = cari.trim().toLowerCase();
  const daftar = repo.masterSubkegiatan().filter((x) => x.status === 'Aktif' && !sudah.has(x.id) && (!q || `${x.kode} ${x.nama}`.toLowerCase().includes(q)));
  const tampil = daftar.slice(0, 100);
  const toggle = (id: string) => setPilih((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const semua = () => setPilih((s) => { const n = new Set(s); tampil.forEach((x) => n.add(x.id)); return n; });
  const kirim = async () => {
    const r = await anggaran.tarikSubkegiatan(ta_id, [...pilih], aktor);
    if (!r.ok) { setErr(r.error ?? 'Gagal'); return; }
    onSaved();
  };
  return (
    <Modal open onClose={onClose} title="Tarik subkegiatan dari kamus" footer={<><Button variant="secondary" onClick={onClose}>Batal</Button><Button variant="primary" onClick={kirim} disabled={pilih.size === 0}>Tarik {pilih.size > 0 ? `(${pilih.size})` : ''}</Button></>}>
      <Input value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari kode atau nama subkegiatan" aria-label="Cari subkegiatan" autoFocus />
      <div className="mt-2 flex justify-between text-2xs text-mist-dim">
        <span>{daftar.length} tersedia</span>
        <div className="space-x-3">
          <button type="button" className="hover:text-mist" onClick={semua}>Pilih semua yang tampil</button>
          <button type="button" className="hover:text-mist" onClick={() => setPilih(new Set())}>Kosongkan</button>
        </div>
      </div>
      <div className="mt-2 max-h-72 space-y-1 overflow-y-auto">
        {daftar.length === 0 && <p className="py-3 text-2xs text-mist-dim">{q ? 'Tidak ada subkegiatan yang cocok.' : 'Semua subkegiatan aktif sudah ditarik ke TA ini.'}</p>}
        {tampil.map((x) => (
          <label key={x.id} className="flex cursor-pointer items-start gap-2 rounded border border-ink-line px-3 py-2 text-sm text-mist hover:bg-ink/60">
            <input type="checkbox" className="mt-1" checked={pilih.has(x.id)} onChange={() => toggle(x.id)} />
            <span><span className="mono">{x.kode}</span> {x.nama}</span>
          </label>
        ))}
        {daftar.length > 100 && <p className="py-1 text-2xs text-mist-dim">Menampilkan 100 pertama. Persempit dengan kata kunci.</p>}
      </div>
      <ErrorLine msg={err} />
    </Modal>
  );
}

function KaitkanTab({ ta_id, aktor, onChanged }: Ctx) {
  const [pilih, setPilih] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const kolam = repo.subkegiatanTAByTA(ta_id);
  const pem = new Map(repo.pemetaanByTA(ta_id).map((p) => [p.subkegiatan_id, p]));
  const belum = kolam.filter((k) => !pem.has(k.subkegiatan_id));
  const sudah = kolam.filter((k) => pem.has(k.subkegiatan_id));
  const seksi = repo.seksiTAByTA(ta_id).filter((s) => s.status === 'Aktif');
  const kunci = terkunciUbah(ta_id);
  const toggle = (id: string) => setPilih((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const lepas = async (pemId: string) => {
    const r = await anggaran.lepasSubkegiatan(pemId, aktor);
    if (!r.ok) { setErr(r.error ?? 'Gagal'); return; }
    setErr(null);
    onChanged();
  };
  return (
    <Panel>
      <SectionTitle title="Kaitkan Subkegiatan ke Seksi" desc="Satu subkegiatan hanya dimiliki satu seksi; satu seksi boleh memiliki banyak subkegiatan. Centang beberapa subkegiatan lalu kaitkan sekaligus." />
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-mist">Belum dikaitkan ({belum.length})</p>
        <Button variant="primary" disabled={kunci || pilih.size === 0} onClick={() => { setErr(null); setModal(true); }}>Kaitkan ke seksi{pilih.size > 0 ? ` (${pilih.size})` : ''}</Button>
      </div>
      {belum.length === 0 ? (
        <p className="py-2 text-sm text-mist-dim">{kolam.length === 0 ? 'Tarik subkegiatan dari kamus dulu pada tab sebelumnya.' : 'Semua subkegiatan sudah dikaitkan ke seksi.'}</p>
      ) : (
        <ul className="space-y-1">
          {belum.map((k) => (
            <li key={k.id}>
              <label className="flex cursor-pointer items-start gap-2 rounded border border-ink-line px-3 py-2 text-sm text-mist hover:bg-ink/60">
                <input type="checkbox" className="mt-1" disabled={kunci} checked={pilih.has(k.subkegiatan_id)} onChange={() => toggle(k.subkegiatan_id)} />
                <span><span className="mono">{k.kode_snapshot}</span> {k.nama_snapshot}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
      <p className="mb-2 mt-5 text-sm font-semibold text-mist">Sudah dikaitkan ({sudah.length})</p>
      {sudah.length === 0 ? <p className="text-sm text-mist-dim">Belum ada.</p> : (
        <table className="w-full text-sm">
          <tbody>
            {sudah.map((k) => {
              const p = pem.get(k.subkegiatan_id)!;
              return (
                <tr key={k.id} className="pro-row border-t border-ink-line">
                  <td className="py-1.5 text-mist"><span className="mono">{k.kode_snapshot}</span> {k.nama_snapshot}</td>
                  <td className="text-mist-dim">{repo.seksiTAById(p.seksi_ta_id)?.nama_snapshot}</td>
                  <td className="w-16 text-right">{!kunci && <button type="button" className="text-2xs text-crit hover:underline" onClick={() => { void lepas(p.id); }}>Lepas</button>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {kunci && <p className="mt-2 text-xs text-mist-dim">Terkunci: jendela alokasi tertutup atau sudah disahkan.</p>}
      <ErrorLine msg={err} />
      {modal && <KaitkanModal ta_id={ta_id} aktor={aktor} subs={[...pilih]} seksi={seksi.map((s) => ({ id: s.id, nama: s.nama_snapshot }))} onClose={() => setModal(false)} onSaved={() => { setModal(false); setPilih(new Set()); onChanged(); }} />}
    </Panel>
  );
}

function KaitkanModal({ ta_id, aktor, subs, seksi, onClose, onSaved }: { ta_id: string; aktor: Aktor; subs: string[]; seksi: { id: string; nama: string }[]; onClose: () => void; onSaved: () => void }) {
  const [seksiId, setSeksiId] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const kirim = async () => {
    for (const s of subs) {
      const r = await anggaran.tempatkanSubkegiatan(ta_id, seksiId, s, aktor);
      if (!r.ok) { setErr(r.error ?? 'Gagal'); return; }
    }
    onSaved();
  };
  return (
    <Modal open onClose={onClose} title={`Kaitkan ${subs.length} subkegiatan ke seksi`} footer={<><Button variant="secondary" onClick={onClose}>Batal</Button><Button variant="primary" onClick={kirim} disabled={!seksiId}>Kaitkan</Button></>}>
      <label className="block text-sm text-mist-dim">
        Seksi
        <Select className="mt-1 block w-full" value={seksiId} onChange={(e) => setSeksiId(e.target.value)}>
          <option value="">Pilih seksi</option>
          {seksi.map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}
        </Select>
      </label>
      <ErrorLine msg={err} />
    </Modal>
  );
}

/* ---------- 3. Pagu (drilldown seksi -> subkegiatan -> rekening) ---------- */
export function PaguPage() {
  return <Halaman render={(c) => <PaguIsi {...c} />} />;
}

function PaguIsi({ ta_id, aktor, onChanged }: Ctx) {
  const [seksiId, setSeksiId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, number>>({});
  const [buka, setBuka] = useState<Record<string, boolean>>({});
  const [err, setErr] = useState<string | null>(null);
  const toast = useToast();
  const pemetaan = repo.pemetaanByTA(ta_id);
  const seksi = repo.seksiTAByTA(ta_id).filter((x) => x.status === 'Aktif');
  const kunci = terkunciUbah(ta_id);
  const nilai = (id: string) => draft[id] ?? anggaran.paguSubkegiatan(id);
  const total = pemetaan.reduce((t, p) => t + nilai(p.id), 0);
  const simpan = async () => {
    const payload = Object.fromEntries(pemetaan.map((p) => [p.id, nilai(p.id)]));
    const r = await anggaran.simpanAlokasiSubkegiatan(ta_id, payload, aktor);
    if (!r.ok) { setErr(r.error ?? 'Gagal'); return; }
    setErr(null);
    setDraft({});
    toast.notify('Tersimpan');
    onChanged();
  };
  const sk = seksi.find((x) => x.id === seksiId) ?? null;
  const pems = sk ? pemetaan.filter((p) => p.seksi_ta_id === sk.id) : [];
  return (
    <Panel>
      <SectionTitle title="Pagu per Seksi" desc="Pilih seksi untuk melihat subkegiatannya, lalu isi pagu. Pagu Induk dihitung otomatis dari total semua subkegiatan. Klik panah untuk melihat rekening belanja." />
      <p className="mb-3 text-sm text-mist-dim">Pagu Induk (otomatis) <span className="mono tnum text-mist">{formatRupiah(total)}</span></p>
      {!sk ? (
        <>
          {seksi.length === 0 && <p className="py-3 text-sm text-mist-dim">Belum ada seksi pada TA ini. Admin perlu menambah seksi lebih dulu.</p>}
          <table className="w-full text-sm">
            <thead className="text-left text-mist-dim"><tr><th className="py-2">Seksi</th><th>Subkegiatan</th><th className="text-right">Pagu Seksi</th><th>Status</th></tr></thead>
            <tbody>
              {seksi.map((s) => {
                const jml = pemetaan.filter((p) => p.seksi_ta_id === s.id);
                const sub = jml.reduce((t, p) => t + nilai(p.id), 0);
                return (
                  <tr key={s.id} className="pro-row cursor-pointer border-t border-ink-line hover:bg-ink/60" onClick={() => setSeksiId(s.id)}>
                    <td className="py-2 text-mist">{s.nama_snapshot} <span aria-hidden>›</span></td>
                    <td className="text-mist-dim">{jml.length}</td>
                    <td className="mono tnum text-right text-mist">{formatRupiah(sub)}</td>
                    <td><StatusSeksiBadge status={anggaran.statusSeksi(ta_id, s.id)} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      ) : (
        <>
          <button type="button" className="mb-3 text-sm text-amber hover:underline" onClick={() => setSeksiId(null)}>‹ Semua seksi</button>
          <p className="mb-2 text-sm font-semibold text-mist">{sk.nama_snapshot}</p>
          <table className="w-full text-sm">
            <tbody>
              {pems.length === 0 && <tr><td className="py-3 text-2xs text-mist-dim">Belum ada subkegiatan pada seksi ini. Kaitkan dulu di menu Subkegiatan.</td></tr>}
              {pems.map((p) => {
                const rek = anggaran.rekeningPemetaan(p.id);
                const terbuka = !!buka[p.id];
                return (
                  <Fragment key={p.id}>
                    <tr className="pro-row border-t border-ink-line first:border-t-0">
                      <td className="py-1.5 text-mist">
                        <button type="button" className="mr-2 text-mist-dim hover:text-mist" aria-expanded={terbuka} onClick={() => setBuka((b) => ({ ...b, [p.id]: !b[p.id] }))}>{terbuka ? '▾' : '▸'}</button>
                        <span className="mono">{p.kode_snapshot}</span> {p.nama_snapshot}
                        <span className="ml-2 text-2xs text-mist-dim">({rek.length} rekening)</span>
                      </td>
                      <td className="w-48 text-right"><RupiahInput className="w-44" disabled={kunci} value={nilai(p.id)} onChange={(n) => setDraft((d) => ({ ...d, [p.id]: n }))} /></td>
                    </tr>
                    {terbuka && (
                      <tr className="bg-ink/40">
                        <td colSpan={2} className="px-6 py-2">
                          {rek.length === 0 ? <p className="text-2xs text-mist-dim">PPTK belum mengisi rekening belanja.</p> : (
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
        </>
      )}
      <div className="mt-3 flex justify-end">
        <Button variant="primary" onClick={simpan} disabled={kunci || pemetaan.length === 0}>Simpan Pagu</Button>
      </div>
      {kunci && <p className="mt-2 text-xs text-mist-dim">Terkunci: jendela alokasi tertutup atau sudah disahkan.</p>}
      <ErrorLine msg={err} />
    </Panel>
  );
}

/* ---------- 4. Sahkan dan SPD ---------- */
export function SahkanSpdPage() {
  return <Halaman render={(c) => <SahkanSpdIsi {...c} />} />;
}

function SahkanSpdIsi({ ta_id, aktor, onChanged }: Ctx) {
  const [tab, setTab] = useState<'sahkan' | 'spd' | 'geser' | 'apbdp'>('sahkan');
  return (
    <>
      <Tabs nilai={tab} onPilih={setTab} daftar={[['sahkan', 'Sahkan'], ['spd', 'SPD dan Efisiensi'], ['geser', 'Pergeseran'], ['apbdp', 'APBD-P dan Riwayat Versi']]} />
      {tab === 'sahkan' && <SahkanPanel ta_id={ta_id} aktor={aktor} onChanged={onChanged} />}
      {tab === 'spd' && <SpdPanel ta_id={ta_id} aktor={aktor} onChanged={onChanged} />}
      {tab === 'geser' && <PergeseranPanel ta_id={ta_id} aktor={aktor} onChanged={onChanged} />}
      {tab === 'apbdp' && (<><ApbdPPanel ta_id={ta_id} /><VersiPanel ta_id={ta_id} /></>)}
    </>
  );
}
