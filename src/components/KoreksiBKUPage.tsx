// Koreksi BKU — menu khusus Bendahara. Koreksi nomor/tanggal dan Cabut BKU hanya ada di sini (tidak di daftar).
import { useState } from 'react';
import { Button, Card, EmptyState, Field, Input, Modal, SearchBox, StatusBadge, useToast, usePaging, Pager } from '@/components/ui';
import { ErrorLine, SectionTitle } from '@/components/AnggaranShared';
import { repo } from '@/data/repo';
import { getSession } from '@/lib/auth';
import { formatRupiah } from '@/lib/format';
import { formatTanggalPendek } from '@/lib/wita';
import type { BKU } from '@/data/types';
import { BookOpen, Pencil, Trash2 } from 'lucide-react';

export function KoreksiBKUPage() {
  const s = getSession()!;
  const ta_id = s.active_ta_id!;
  const ta = repo.tahunAnggaranById(ta_id)!;
  const [, setTick] = useState(0);
  const bump = () => setTick((n) => n + 1);
  const [cari, setCari] = useState('');
  const [pilih, setPilih] = useState<BKU | null>(null);
  const [koreksi, setKoreksi] = useState(false);
  const [cabut, setCabut] = useState(false);
  const tutup = ta.status === 'Arsip Read-Only';
  const kuitansi = repo.kuitansiByTA(ta_id);
  const seksiList = repo.seksiTAByTA(ta_id);
  const daftar = repo.bkuByTA(ta_id).filter((b) => {
    if (b.status !== 'Aktif') return false;
    const k = kuitansi.find((q) => q.id === b.kuitansi_id);
    const seksi = seksiList.find((q) => q.id === k?.seksi_ta_id)?.nama_snapshot ?? '';
    if (!cari) return true;
    const q = cari.toLowerCase();
    return [b.nomor_bku, k?.uraian ?? '', seksi].some((t) => t.toLowerCase().includes(q));
  });
  const pg = usePaging(daftar);
  const bkuPilih = pilih ? repo.bkuByTA(ta_id).find((b) => b.id === pilih.id) : undefined;
  const kPilih = bkuPilih ? kuitansi.find((q) => q.id === bkuPilih.kuitansi_id) : undefined;

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <SectionTitle title="Koreksi BKU" desc={`TA ${ta.tahun} • koreksi nomor/tanggal atau cabut BKU yang sudah dibukukan`} />
        <p className="text-2xs text-mist-dim">Cari BKU, pilih, lalu pilih aksinya. Semua perubahan tercatat di Jejak Audit dengan nilai lama dan baru.</p>
        {tutup && <p className="mt-2 text-2xs text-warn">TA berstatus Arsip: koreksi dan pencabutan BKU ditutup.</p>}
      </Card>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-edge px-4 py-3">
          <h3 className="text-sm font-semibold text-mist">Cari BKU</h3>
          <SearchBox value={cari} onChange={setCari} placeholder="No. BKU / uraian / seksi..." />
        </div>
        <div className="overflow-x-auto">
          {daftar.length === 0 ? <EmptyState icon={<BookOpen size={28} />} title="Tidak ada BKU aktif yang cocok" /> : (
            <table className="w-full text-2xs">
              <thead className="bg-ink text-mist-dim"><tr className="text-left">
                {['No. BKU', 'Tanggal', 'Seksi', 'Uraian', 'Bruto', ''].map((c) => <th key={c} className="px-4 py-2 font-medium whitespace-nowrap">{c}</th>)}
              </tr></thead>
              <tbody>{pg.baris.map((b, i) => {
                const kk = kuitansi.find((q) => q.id === b.kuitansi_id);
                return (
                  <tr key={b.id} className={i % 2 ? 'bg-ink-surface/40' : ''}>
                    <td className="px-4 py-2 mono text-mist">{b.nomor_bku}</td>
                    <td className="px-4 py-2 text-mist-dim">{formatTanggalPendek(b.tanggal_bku)}</td>
                    <td className="px-4 py-2 text-mist-dim">{seksiList.find((q) => q.id === kk?.seksi_ta_id)?.nama_snapshot ?? '—'}</td>
                    <td className="px-4 py-2 text-mist">{kk?.uraian ?? '—'}</td>
                    <td className="px-4 py-2 mono tnum text-mist">{formatRupiah(kk?.bruto ?? 0)}</td>
                    <td className="px-4 py-2"><Button variant="secondary" onClick={() => setPilih(b)}>Pilih</Button></td>
                  </tr>
                );
              })}</tbody>
            </table>
          )}
        </div>
        <Pager {...pg} />
      </Card>

      {bkuPilih && (
        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="text-2xs text-mist-dim">
              <div className="text-sm font-semibold text-mist">BKU <span className="mono">{bkuPilih.nomor_bku}</span> <StatusBadge kind="ok" label={bkuPilih.status} /></div>
              <div>Tanggal: <span className="text-mist">{formatTanggalPendek(bkuPilih.tanggal_bku)}</span></div>
              <div>Uraian: <span className="text-mist">{kPilih?.uraian}</span></div>
              <div>Nilai: <span className="mono tnum text-mist">{formatRupiah(kPilih?.bruto ?? 0)}</span></div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" disabled={tutup} onClick={() => setKoreksi(true)}><Pencil size={14} /> Koreksi nomor/tanggal</Button>
              <Button variant="danger" disabled={tutup} onClick={() => setCabut(true)}><Trash2 size={14} /> Cabut BKU</Button>
            </div>
          </div>
        </Card>
      )}

      {koreksi && bkuPilih && <FormBKU judul={`Koreksi BKU ${bkuPilih.nomor_bku}`} awal={{ nomor: bkuPilih.nomor_bku, tanggal: bkuPilih.tanggal_bku }} catatan="Nominal tidak berubah. Perubahan tercatat di Jejak Audit dengan nilai lama dan baru."
        onClose={() => setKoreksi(false)} simpan={(n, t) => repo.koreksiBKU(bkuPilih.id, { nomor_bku: n, tanggal_bku: t }, s)} onSaved={() => { setKoreksi(false); setPilih(null); bump(); }} />}
      {cabut && bkuPilih && <KonfirmasiCabut bku={bkuPilih} onClose={() => setCabut(false)} onDone={() => { setCabut(false); setPilih(null); bump(); }} />}
    </div>
  );
}

function FormBKU({ judul, awal, catatan, onClose, simpan, onSaved }: {
  judul: string; awal: { nomor: string; tanggal: string }; catatan?: string;
  onClose: () => void; simpan: (nomor: string, tanggal: string) => Promise<{ ok: boolean; error?: string }>; onSaved: () => void;
}) {
  const toast = useToast();
  const [nomor, setNomor] = useState(awal.nomor);
  const [tanggal, setTanggal] = useState(awal.tanggal);
  const [err, setErr] = useState<string | null>(null);
  const kirim = async () => {
    const r = await simpan(nomor, tanggal);
    if (!r.ok) { setErr(r.error ?? 'Gagal'); return; }
    toast.notify('Tersimpan');
    onSaved();
  };
  return (
    <Modal open onClose={onClose} title={judul}
      footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Batal</Button><Button onClick={kirim}>Simpan</Button></div>}>
      <div className="space-y-3">
        <Field label="No. BKU" required><Input value={nomor} onChange={(e) => setNomor(e.target.value)} placeholder="Contoh: BKU-002" /></Field>
        <Field label="Tanggal BKU" required><Input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} /></Field>
        {catatan && <p className="text-2xs text-mist-dim">{catatan}</p>}
        <ErrorLine msg={err} />
      </div>
    </Modal>
  );
}

// R-149 — pop-up konfirmasi untuk aksi yang tidak dapat dibatalkan; menutup pop-up tidak mengubah data
function KonfirmasiCabut({ bku, onClose, onDone }: { bku: BKU; onClose: () => void; onDone: () => void }) {
  const s = getSession()!;
  const toast = useToast();
  const [err, setErr] = useState<string | null>(null);
  const jalankan = async () => {
    const r = await repo.cabutBKU(bku.id, s);
    if (!r.ok) { setErr(r.error ?? 'Gagal'); return; }
    toast.notify('BKU dicabut');
    onDone();
  };
  return (
    <Modal open onClose={onClose} title={`Cabut BKU ${bku.nomor_bku}?`}
      footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Batal</Button><Button variant="danger" onClick={jalankan}>Ya, cabut BKU</Button></div>}>
      <div className="space-y-2 text-sm text-mist">
        <p>Jika BKU ini dicabut:</p>
        <ul className="list-disc space-y-1 pl-5 text-2xs text-mist-dim">
          <li>Realisasi anggaran berkurang sebesar nilai SPJ ini.</li>
          <li>SPJ kembali berstatus Menunggu BKU.</li>
          <li>SPJ hilang dari daftar Arsip (Telusur SPJ) sampai dibukukan lagi.</li>
        </ul>
        <p className="text-2xs text-mist-dim">Perubahan tercatat di Jejak Audit. Menutup pop-up ini tidak mengubah data.</p>
      </div>
      <ErrorLine msg={err} />
    </Modal>
  );
}
