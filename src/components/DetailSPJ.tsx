// Detail SPJ satu halaman (hanya baca) — untuk semua SPJ non-Draft, dipakai PPTK, Verifikator, Bendahara.
import { useState } from 'react';
import { Button, Modal, StatusBadge } from '@/components/ui';
import { CetakVerifikasiModal } from '@/components/CetakVerifikasi';
import { repo } from '@/data/repo';
import { formatRupiah } from '@/lib/format';
import { formatTanggalPendek } from '@/lib/wita';
import { bisaBukaLampiran, bukaLampiranSPJ } from '@/lib/lampiran';
import type { SPJ } from '@/data/types';
import { Printer } from 'lucide-react';

export function StatusSPJBadge({ status }: { status: SPJ['status'] }) {
  const kind = status === 'Draft' ? 'neutral' : status === 'Terkunci' ? 'warn' : status === 'Menunggu BKU' ? 'spike' : 'ok';
  return <StatusBadge kind={kind} label={status} />;
}

function Bagian({ judul, children }: { judul: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-ink-edge bg-ink p-3">
      <h4 className="mb-1 text-sm font-semibold text-mist">{judul}</h4>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

export function DetailSPJ({ spj_id, onClose, footerTambahan }: { spj_id: string; onClose: () => void; footerTambahan?: React.ReactNode }) {
  const [cetak, setCetak] = useState(false);
  const spj = repo.spjById(spj_id);
  if (!spj) return null;
  const k = repo.kuitansiByTA(spj.ta_id).find((q) => q.id === spj.kuitansi_id);
  const seksi = k ? repo.seksiTAById(k.seksi_ta_id) : undefined;
  const form = repo.getFormByVersion(spj.jenis_belanja, spj.versi_form);
  const rp = repo.ringkasanPajakSPJ(spj.id);
  const tk = repo.tokenAktifSPJ(spj.id);
  const jenisPajak = repo.masterJenisPajak();
  const bku = repo.bkuByTA(spj.ta_id).find((b) => b.spj_id === spj.id && b.status === 'Aktif');
  const draf = repo.bkuDrafByTA(spj.ta_id).find((d) => d.spj_id === spj.id);
  const nilai = (id: string) => {
    const v = spj.jawaban[id];
    return typeof v === 'string' && v ? v : '—';
  };
  const blok = form?.blok_berulang;
  const baris = blok && Array.isArray(spj.jawaban[blok.id]) ? (spj.jawaban[blok.id] as Record<string, string>[]) : [];
  const bisaCetak = spj.status === 'Menunggu BKU' || spj.status === 'Dibukukan' || !!tk;
  const rek = spj.rekening_penerima[0];

  return (
    <>
      <Modal open onClose={onClose} title={`Detail SPJ — ${spj.jenis_belanja}`} wider
        footer={
          <div className="flex flex-wrap items-center justify-end gap-2">
            {footerTambahan}
            {bisaCetak && <Button variant="secondary" onClick={() => setCetak(true)}><Printer size={14} /> Cetak Hasil Verifikasi</Button>}
            <Button variant="ghost" onClick={onClose}>Tutup</Button>
          </div>
        }>
        <div className="space-y-3 text-2xs text-mist-dim">
          <Bagian judul="Status">
            <div><StatusSPJBadge status={spj.status} />{spj.tanggal_pengajuan && <span> • diajukan {formatTanggalPendek(spj.tanggal_pengajuan)}</span>}</div>
            {bku && <div>No. BKU: <span className="mono text-mist">{bku.nomor_bku}</span> • tanggal BKU {formatTanggalPendek(bku.tanggal_bku)}</div>}
            {!bku && draf && <div className="text-warn">Draf BKU: <span className="mono">{draf.nomor_bku}</span> • {formatTanggalPendek(draf.tanggal_bku)} (belum disetujui)</div>}
            {spj.penandatangan_pengajuan && <div>PPTK pengaju: <span className="text-mist">{spj.penandatangan_pengajuan.pptk_nama}</span></div>}
          </Bagian>
          {k && (
            <Bagian judul="Kuitansi">
              <div>Seksi: <span className="text-mist">{seksi?.nama_snapshot}</span></div>
              <div>Uraian: <span className="text-mist">{k.uraian}</span></div>
              <div>Penerima: <span className="text-mist">{k.penerima}</span> • {formatTanggalPendek(k.tanggal_kuitansi)}</div>
              <div>Bruto: <span className="mono tnum text-mist">{formatRupiah(k.bruto)}</span></div>
            </Bagian>
          )}
          <Bagian judul={`Isian Form (${spj.versi_form})`}>
            {form ? (
              <>
                {form.fields.map((f) => <div key={f.id}>{f.label}: <span className="text-mist">{nilai(f.id)}</span></div>)}
                {blok && baris.length > 0 && (
                  <div className="mt-2 overflow-x-auto">
                    <div className="mb-1 text-mist">{blok.nama}</div>
                    <table className="w-full"><thead><tr className="text-left">{blok.fields.map((f) => <th key={f.id} className="px-2 py-1 font-medium">{f.label}</th>)}</tr></thead>
                      <tbody>{baris.map((r, i) => <tr key={i}>{blok.fields.map((f) => <td key={f.id} className="px-2 py-1 text-mist">{r[f.id] || '—'}</td>)}</tr>)}</tbody></table>
                  </div>
                )}
              </>
            ) : <p>Form versi {spj.versi_form} tidak ditemukan.</p>}
          </Bagian>
          <Bagian judul="Rekening Penerima">
            {rek ? (
              <>
                <div>Nama pemilik: <span className="text-mist">{rek.account_name}</span></div>
                <div>Bank: <span className="text-mist">{rek.bank_name}</span></div>
                <div>Nomor rekening: <span className="mono text-mist">{rek.account_number}</span></div>
                {rek.alias && <div>Alias: <span className="text-mist">{rek.alias}</span></div>}
              </>
            ) : <p>Belum ada rekening.</p>}
          </Bagian>
          <Bagian judul="Pajak dan Netto">
            {spj.entri_pajak.length === 0 ? <p>Tidak ada entri pajak.</p> : spj.entri_pajak.map((e) => (
              <div key={e.id}>{jenisPajak.find((j) => j.id === e.jenis_pajak_id)?.nama_jenis_pajak ?? '—'}: <span className="mono tnum text-mist">{formatRupiah(e.nominal)}</span></div>
            ))}
            <div>Total pajak: <span className="mono tnum text-mist">{formatRupiah(rp?.total ?? 0)}</span> • Netto dibayarkan: <span className="mono tnum text-mist">{formatRupiah(rp?.dibayarkan ?? 0)}</span></div>
          </Bagian>
          <Bagian judul="Lampiran PDF">
            {spj.lampiran_nama_asli ? (
              <div className="flex items-center gap-2">
                <span className="text-mist">{spj.lampiran_nama_asli}</span>
                {bisaBukaLampiran(spj.id, !!spj.lampiran_nama_asli)
                  ? <Button variant="secondary" onClick={() => { void bukaLampiranSPJ(spj.id); }}>Buka lampiran</Button>
                  : <span>(isi berkas hanya tersedia pada sesi unggah)</span>}
              </div>
            ) : <p>Belum ada lampiran.</p>}
          </Bagian>
          <Bagian judul="Verifikasi">
            {tk ? (
              <>
                <div>Nomor verifikasi: <span className="mono text-mist">{tk.nomor_verifikasi}</span> • <span className={tk.status === 'Berlaku' ? 'text-ok' : 'text-crit'}>{tk.status}</span></div>
                <div>Tanggal verifikasi: <span className="text-mist">{formatTanggalPendek(tk.tanggal_verifikasi)}</span></div>
                <div>Verifikator: <span className="text-mist">{tk.verifikator_nama}</span></div>
              </>
            ) : <p>Belum diverifikasi.</p>}
          </Bagian>
        </div>
      </Modal>
      {cetak && <CetakVerifikasiModal spj_id={spj.id} onClose={() => setCetak(false)} />}
    </>
  );
}
