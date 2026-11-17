// Pop-up rincian SPJ untuk pencatatan BKU: semua data bisa disalin satu per satu; nomor dan tanggal BKU disimpan sebagai draf.
import { useState, type ReactNode } from 'react';
import { Copy } from 'lucide-react';
import { Button, Field, Input, Modal, TombolIkon, useToast } from '@/components/ui';
import { ErrorLine } from '@/components/AnggaranShared';
import { repo } from '@/data/repo';
import { getSession } from '@/lib/auth';
import { formatRupiah } from '@/lib/format';
import { formatTanggalPendek, todayWita } from '@/lib/wita';
import { salinTeks } from '@/lib/salin';
import type { SPJ } from '@/data/types';

function Baris({ label, nilai, salin, mono = false }: { label: string; nilai: ReactNode; salin: string | null; mono?: boolean }) {
  const toast = useToast();
  const klik = async () => { toast.notify((await salinTeks(salin ?? '')) ? 'Tersalin' : 'Gagal menyalin'); };
  return (
    <div className="flex items-start gap-3 border-t border-ink-edge py-2 first:border-t-0">
      <dt className="w-40 shrink-0 text-2xs text-mist-dim">{label}</dt>
      <dd className={`min-w-0 flex-1 break-words text-sm text-mist ${mono ? 'mono tnum' : ''}`}>{nilai}</dd>
      {salin !== null && salin !== '' && <TombolIkon ikon={Copy} label={`Salin ${label.toLowerCase()}`} onClick={() => { void klik(); }} />}
    </div>
  );
}

export function RincianBKUModal({ spj, onClose, onSaved }: { spj: SPJ; onClose: () => void; onSaved: () => void }) {
  const s = getSession()!;
  const toast = useToast();
  const k = repo.kuitansiById(spj.kuitansi_id);
  const draf = repo.bkuDrafByTA(spj.ta_id).find((d) => d.spj_id === spj.id);
  const [nomor, setNomor] = useState(draf?.nomor_bku ?? '');
  const [tanggal, setTanggal] = useState(draf?.tanggal_bku ?? todayWita());
  const [err, setErr] = useState<string | null>(null);
  if (!k) return null;

  const pem = repo.pemetaanByTA(spj.ta_id).find((p) => p.id === k.pemetaan_subkegiatan_id);
  const seksi = repo.seksiTAById(k.seksi_ta_id)?.nama_snapshot ?? '-';
  const rek = repo.masterRekeningBelanja().find((r) => r.id === k.rekening_id);
  const token = repo.tokenAktifSPJ(spj.id);
  const jenisPajak = repo.masterJenisPajak();
  const pajak = spj.entri_pajak.map((e) => ({ nama: jenisPajak.find((j) => j.id === e.jenis_pajak_id)?.nama_jenis_pajak ?? 'Pajak', nominal: e.nominal }));
  const totalPajak = pajak.reduce((t, p) => t + p.nominal, 0);
  const netto = k.bruto - totalPajak;
  const uraianBku = `${k.uraian} pada subkeg ${pem?.nama_snapshot ?? '-'}`;

  const simpan = async () => {
    const r = await repo.simpanDrafBKU(spj.id, nomor, tanggal, s);
    if (!r.ok) { setErr(r.error ?? 'Gagal'); return; }
    toast.notify('Draf BKU tersimpan');
    onSaved();
  };
  const hapus = async () => {
    const r = await repo.hapusDrafBKU(spj.id, s);
    if (!r.ok) { setErr(r.error ?? 'Gagal'); return; }
    toast.notify('Draf BKU dihapus');
    onSaved();
  };

  return (
    <Modal open onClose={onClose} title="Rincian SPJ dan Draf BKU" wider
      footer={<div className="flex flex-wrap justify-end gap-2">
        {draf && <Button variant="danger" onClick={hapus}>Hapus draf</Button>}
        <Button variant="ghost" onClick={onClose}>Tutup</Button>
        <Button onClick={simpan} disabled={!nomor.trim()}>Simpan sebagai draf</Button>
      </div>}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-4">
        <dl>
          <Baris label="Uraian BKU" nilai={uraianBku} salin={uraianBku} />
          <Baris label="Uraian kuitansi" nilai={k.uraian} salin={k.uraian} />
          <Baris label="Subkegiatan" nilai={pem ? `${pem.kode_snapshot} ${pem.nama_snapshot}` : '-'} salin={pem ? `${pem.kode_snapshot} ${pem.nama_snapshot}` : null} />
          <Baris label="Seksi" nilai={seksi} salin={seksi} />
          <Baris label="Rekening belanja" nilai={rek ? `${rek.kode_rekening} ${rek.nama}` : '-'} salin={rek ? `${rek.kode_rekening} ${rek.nama}` : null} />
          <Baris label="Tanggal kuitansi" nilai={formatTanggalPendek(k.tanggal_kuitansi)} salin={k.tanggal_kuitansi} />
          <Baris label="Penerima" nilai={k.penerima} salin={k.penerima} />
          <Baris label="Nilai bruto" nilai={formatRupiah(k.bruto)} salin={String(k.bruto)} mono />
          {pajak.map((p, i) => <Baris key={i} label={p.nama} nilai={formatRupiah(p.nominal)} salin={String(p.nominal)} mono />)}
          <Baris label="Total pajak" nilai={formatRupiah(totalPajak)} salin={String(totalPajak)} mono />
          <Baris label="Nilai netto" nilai={formatRupiah(netto)} salin={String(netto)} mono />
          <Baris label="No. verifikasi" nilai={token?.nomor_verifikasi ?? '-'} salin={token?.nomor_verifikasi ?? null} mono />
        </dl>

        <div>
          <p className="mb-1 text-sm font-semibold text-mist">Rekening penerima</p>
          {spj.rekening_penerima.length === 0 ? <p className="text-2xs text-mist-dim">Tidak ada rekening penerima pada SPJ ini.</p> : spj.rekening_penerima.map((r, i) => (
            <dl key={r.id} className="mb-2 rounded-md border border-ink-edge px-3">
              <p className="pt-2 text-2xs text-mist-dim">Rekening {i + 1}</p>
              <Baris label="Nama pemilik" nilai={r.account_name} salin={r.account_name} />
              <Baris label="Bank" nilai={r.bank_name} salin={r.bank_name} />
              <Baris label="No. rekening" nilai={r.account_number} salin={r.account_number} mono />
              {r.alias && <Baris label="Alias" nilai={r.alias} salin={r.alias} />}
            </dl>
          ))}
        </div>

        </div>
        <div className="h-fit rounded-md border border-amber/30 bg-amber/5 p-3 lg:sticky lg:top-0">
          <p className="mb-2 text-sm font-semibold text-mist">Draf BKU</p>
          <div className="grid gap-3">
            <Field label="No. BKU" required><Input value={nomor} onChange={(e) => setNomor(e.target.value)} placeholder="Contoh: BKU-002" /></Field>
            <Field label="Tanggal BKU" required><Input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} /></Field>
          </div>
          <p className="mt-2 text-2xs text-mist-dim">Draf belum menjadi realisasi. Realisasi terhitung saat draf disetujui dari daftar SPJ Menunggu BKU.</p>
          <ErrorLine msg={err} />
        </div>
      </div>
    </Modal>
  );
}
