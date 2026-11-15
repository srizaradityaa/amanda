// Arsip Keuangan (Pilar 01–08; draf Arsip SPJ BKU v7.0).
// Tab 1: Arsip SPJ BKU (hanya SPJ berstatus Dibukukan, berbasis No. BKU). Tab 2: Dokumen Keuangan Non-BKU (dikelola Bendahara).
// Pengelola Arsip, Verifikator, dan Bendahara dapat melihat/mengunduh (satuan dan ZIP massal). PPTK, PA/KPA tidak punya akses.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Archive, Download, Eye, FolderCog, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { Button, Card, EmptyState, Field, FilterSelect, Input, Modal, Pager, SearchBox, Select, usePaging } from '@/components/ui';
import { ErrorLine, SectionTitle } from '@/components/AnggaranShared';
import { getSession } from '@/lib/auth';
import { repo } from '@/data/repo';
import { formatRupiah } from '@/lib/format';
import { formatTanggalPendek, todayWita } from '@/lib/wita';
import { formatUkuran } from '@/lib/berkas';
import { tampilkanGalat, tampilkanInfo } from '@/lib/galat';
import * as arsip from '@/data/arsip';
import type { ArsipBKU, DokumenArsip, KategoriArsip } from '@/data/arsip';

type Tab = 'bku' | 'dokumen';

function useTunda<T>(nilai: T, ms = 300): T {
  const [v, setV] = useState(nilai);
  useEffect(() => { const t = setTimeout(() => setV(nilai), ms); return () => clearTimeout(t); }, [nilai, ms]);
  return v;
}

export function ArsipKeuanganPage() {
  const s = getSession()!;
  const admin = s.active_role === 'admin';
  const daftarTA = admin ? repo.tahunAnggaran().slice().sort((a, b) => b.tahun.localeCompare(a.tahun)) : [];
  const [taAdmin, setTaAdmin] = useState<string>(() => (daftarTA.find((t) => t.status === 'Aktif Penuh') ?? daftarTA[0])?.id ?? '');
  const taId = admin ? taAdmin : s.active_ta_id!;
  arsip.setTaArsip(admin ? taId : null);
  const ta = repo.tahunAnggaranById(taId);
  const tahun = ta?.tahun ?? '';
  const bendahara = s.active_role === 'bendahara';
  const [tab, setTab] = useState<Tab>('bku');
  const tombolTab = (id: Tab, label: string) => (
    <button key={id} onClick={() => setTab(id)}
      className={`rounded-md px-3 py-1.5 text-sm font-medium ${tab === id ? 'bg-amber/10 text-amber ring-1 ring-amber/30' : 'text-mist-dim hover:text-mist'}`}>{label}</button>
  );
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <SectionTitle title="Arsip Keuangan" desc={`TA ${tahun} • berkas hanya-baca${admin ? ' untuk Admin' : ''}; seluruh unduhan dicatat pada jejak audit`} />
        <div className="flex flex-wrap items-center gap-2">
          {tombolTab('bku', 'Arsip SPJ BKU')}{tombolTab('dokumen', 'Dokumen Keuangan (Non-BKU)')}
          {admin && (
            <label className="ml-auto flex items-center gap-2 text-2xs text-mist-dim">Tahun Anggaran
              <select value={taAdmin} onChange={(e) => setTaAdmin(e.target.value)} className="rounded-md border border-ink-edge bg-ink px-2 py-1 text-2xs text-mist">
                {daftarTA.map((t) => <option key={t.id} value={t.id}>{t.tahun} ({t.status})</option>)}
              </select>
            </label>
          )}
        </div>
      </Card>
      {!taId ? <Card className="p-5 text-sm text-mist-dim">Belum ada Tahun Anggaran.</Card>
        : tab === 'bku' ? <TabBKU key={taId} tahun={tahun} /> : <TabDokumen key={taId} tahun={tahun} bendahara={bendahara} />}
    </div>
  );
}

// ---------- Pratinjau PDF ----------
function PratinjauPdf({ judul, ambil, onClose }: { judul: string; ambil: () => Promise<Blob | null>; onClose: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  useEffect(() => {
    let batal = false; let u: string | null = null;
    ambil().then((b) => {
      if (batal) return;
      if (!b) { setGalat('Berkas tidak tersedia atau tidak dapat dibuka.'); return; }
      u = URL.createObjectURL(new Blob([b], { type: 'application/pdf' })); setUrl(u);
    }).catch(() => { if (!batal) setGalat('Berkas tidak dapat dibuka.'); });
    return () => { batal = true; if (u) URL.revokeObjectURL(u); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Modal open onClose={onClose} title={judul} wider footer={<div className="flex justify-end"><Button variant="ghost" onClick={onClose}>Tutup</Button></div>}>
      {galat ? <p className="text-sm text-crit">{galat}</p> : url ? <iframe title={judul} src={url} className="h-[70vh] w-full rounded border border-ink-edge bg-white" /> : <p className="text-sm text-mist-dim">Memuat berkas…</p>}
    </Modal>
  );
}

function Baris({ label, nilai, mono }: { label: string; nilai: string | number | null | undefined; mono?: boolean }) {
  return <div className="flex gap-3 py-1 text-2xs"><span className="w-32 shrink-0 text-mist-dim">{label}</span><span className={mono ? 'mono text-mist' : 'text-mist'}>{nilai === null || nilai === undefined || nilai === '' ? '—' : nilai}</span></div>;
}

// ---------- Tab 1: Arsip SPJ BKU ----------
function TabBKU({ tahun }: { tahun: string }) {
  const [data, setData] = useState<ArsipBKU[]>([]);
  const [galat, setGalat] = useState<string | null>(null);
  const [memuat, setMemuat] = useState(true);
  const [cari, setCari] = useState('');
  const q = useTunda(cari);
  const [fSeksi, setFSeksi] = useState('');
  const [dari, setDari] = useState('');
  const [sampai, setSampai] = useState('');
  const [pilih, setPilih] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<ArsipBKU | null>(null);
  const [lihat, setLihat] = useState<ArsipBKU | null>(null);

  const muat = useCallback(async () => {
    setMemuat(true);
    const r = await arsip.muatBKU();
    setData(r.baris); setGalat(r.ok ? null : r.error ?? 'Gagal memuat.'); setMemuat(false);
  }, []);
  useEffect(() => { void muat(); }, [muat]);

  const seksiOpsi = useMemo(() => [{ value: '', label: 'Semua seksi' }, ...Array.from(new Set(data.map((d) => d.seksi).filter(Boolean))).map((x) => ({ value: x, label: x }))], [data]);
  const hasil = useMemo(() => data.filter((d) => {
    if (fSeksi && d.seksi !== fSeksi) return false;
    if (dari && d.tanggal_bku < dari) return false;
    if (sampai && d.tanggal_bku > sampai) return false;
    if (q) { const t = q.toLowerCase(); if (!d.nomor_bku.toLowerCase().includes(t) && !d.uraian.toLowerCase().includes(t)) return false; }
    return true;
  }), [data, fSeksi, dari, sampai, q]);
  const pg = usePaging(hasil);
  const semuaHalaman = pg.baris.length > 0 && pg.baris.every((b) => pilih.has(b.id));
  const alih = (id: string) => setPilih((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const alihHalaman = () => setPilih((p) => { const n = new Set(p); for (const b of pg.baris) { if (semuaHalaman) n.delete(b.id); else n.add(b.id); } return n; });
  const reset = () => { setCari(''); setFSeksi(''); setDari(''); setSampai(''); };

  const unduhSatu = async (b: ArsipBKU) => {
    try {
      const { blob, catatan } = await arsip.blobBundelBKU(b);
      arsip.simpanBlob(arsip.namaBerkasBKU(b.nomor_bku), blob);
      void arsip.catatUnduh('BKU_PDF', b.nomor_bku, 1);
      if (catatan) tampilkanInfo(catatan);
    } catch { tampilkanGalat('Gagal merakit berkas PDF. Coba lagi.'); }
  };
  const unduhZip = async (daftar: ArsipBKU[]) => {
    const r = await arsip.unduhZipBKU(daftar, tahun);
    if (!r.ok) { tampilkanGalat(r.error ?? 'Gagal membuat ZIP.'); return; }
    tampilkanInfo(r.dilewati?.length ? `ZIP berisi ${r.jumlah} berkas. ${r.dilewati.length} BKU hanya memuat Lembar Verifikasi (lampiran tidak tersedia/tidak dapat digabung).` : `ZIP berisi ${r.jumlah} berkas diunduh.`);
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2 border-b border-ink-edge px-4 py-3">
        <SearchBox value={cari} onChange={setCari} placeholder="Cari No. BKU / uraian..." />
        <FilterSelect label="Seksi" value={fSeksi} onChange={setFSeksi} options={seksiOpsi} />
        <label className="flex items-center gap-1 text-2xs text-mist-dim">Dari <input type="date" value={dari} onChange={(e) => setDari(e.target.value)} className="rounded-md border border-ink-edge bg-ink px-2 py-1 text-2xs text-mist" /></label>
        <label className="flex items-center gap-1 text-2xs text-mist-dim">s.d. <input type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} className="rounded-md border border-ink-edge bg-ink px-2 py-1 text-2xs text-mist" /></label>
        <Button variant="ghost" onClick={reset}>Reset Filter</Button>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="secondary" disabled={pilih.size === 0} onClick={() => unduhZip(data.filter((d) => pilih.has(d.id)))}><Download size={14} /> Unduh Terpilih (ZIP){pilih.size ? ` (${pilih.size})` : ''}</Button>
          <Button variant="secondary" disabled={hasil.length === 0} onClick={() => unduhZip(hasil)}><Download size={14} /> Unduh Hasil Filter (ZIP)</Button>
        </div>
      </div>
      <ErrorLine msg={galat} />
      <div className="px-4 py-1 text-2xs text-mist-dim">Menampilkan {hasil.length} dari {data.length} arsip BKU</div>
      <div className="overflow-x-auto">
        {memuat ? <p className="px-4 py-8 text-center text-sm text-mist-dim">Memuat…</p> : hasil.length === 0 ? (
          <EmptyState icon={<Archive size={28} />} title="Belum ada arsip BKU" desc="Arsip muncul setelah Bendahara membukukan SPJ ke BKU. SPJ yang belum dibukukan tidak ditampilkan." />
        ) : (
          <table className="w-full text-2xs">
            <thead className="bg-ink text-mist-dim"><tr className="text-left">
              <th className="w-8 px-4 py-2"><input type="checkbox" checked={semuaHalaman} onChange={alihHalaman} aria-label="Pilih semua pada halaman ini" /></th>
              {['No', 'No. BKU', 'Aksi'].map((c) => <th key={c} className="px-4 py-2 font-medium">{c}</th>)}
            </tr></thead>
            <tbody>{pg.baris.map((b, i) => (
              <tr key={b.id} className={i % 2 ? 'bg-ink-surface/40' : ''}>
                <td className="px-4 py-2"><input type="checkbox" checked={pilih.has(b.id)} onChange={() => alih(b.id)} aria-label={`Pilih ${b.nomor_bku}`} /></td>
                <td className="px-4 py-2 text-mist-dim">{(pg.hal - 1) * pg.ukuran + i + 1}</td>
                <td className="px-4 py-2 mono text-mist">{b.nomor_bku}</td>
                <td className="px-4 py-2"><div className="flex flex-wrap gap-1.5">
                  <Button variant="ghost" onClick={() => setDetail(b)}><Eye size={14} /> Lihat Detail</Button>
                  <Button variant="secondary" onClick={() => unduhSatu(b)}><Download size={14} /> Unduh PDF</Button>
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
      <Pager {...pg} />
      {detail && (
        <Modal open onClose={() => setDetail(null)} title={`Arsip BKU ${detail.nomor_bku}`} wide
          footer={<div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { setLihat(detail); setDetail(null); }}><Eye size={14} /> Pratinjau PDF</Button>
            <Button variant="ghost" onClick={() => setDetail(null)}>Tutup</Button></div>}>
          <Baris label="No. BKU" nilai={detail.nomor_bku} mono />
          <Baris label="Tanggal BKU" nilai={formatTanggalPendek(detail.tanggal_bku)} />
          <Baris label="Seksi" nilai={detail.seksi} />
          <Baris label="Subkegiatan" nilai={detail.subkegiatan} />
          <Baris label="Uraian" nilai={detail.uraian} />
          <Baris label="Nilai Bruto" nilai={formatRupiah(detail.bruto)} mono />
          <Baris label="Potongan Pajak" nilai={formatRupiah(detail.pajak)} mono />
          <Baris label="Nilai Netto" nilai={formatRupiah(detail.bruto - detail.pajak)} mono />
          <Baris label="No. Verifikasi" nilai={detail.nomor_verifikasi} mono />
          <Baris label="Lampiran" nilai={detail.lampiran_nama ? `${detail.lampiran_nama}${detail.lampiran_ukuran ? ` (${formatUkuran(detail.lampiran_ukuran)})` : ''}` : null} />
        </Modal>
      )}
      {lihat && <PratinjauPdf judul={`Arsip BKU ${lihat.nomor_bku}`} ambil={async () => { try { const { blob } = await arsip.blobBundelBKU(lihat); void arsip.catatUnduh('BKU_PDF', `${lihat.nomor_bku} (pratinjau)`, 1); return blob; } catch { return null; } }} onClose={() => setLihat(null)} />}
    </Card>
  );
}

// ---------- Tab 2: Dokumen Non-BKU ----------
function TabDokumen({ tahun, bendahara }: { tahun: string; bendahara: boolean }) {
  const [data, setData] = useState<DokumenArsip[]>([]);
  const [kategori, setKategori] = useState<KategoriArsip[]>([]);
  const [galat, setGalat] = useState<string | null>(null);
  const [memuat, setMemuat] = useState(true);
  const [fKat, setFKat] = useState('');
  const [noSurat, setNoSurat] = useState('');
  const [judulCari, setJudulCari] = useState('');
  const qNo = useTunda(noSurat); const qJudul = useTunda(judulCari);
  const [dari, setDari] = useState('');
  const [sampai, setSampai] = useState('');
  const [pilih, setPilih] = useState<Set<string>>(new Set());
  const [unggahModal, setUnggahModal] = useState(false);
  const [kelola, setKelola] = useState<DokumenArsip | null>(null);
  const [katModal, setKatModal] = useState(false);
  const [lihat, setLihat] = useState<DokumenArsip | null>(null);

  const muat = useCallback(async () => {
    setMemuat(true);
    const [d, k] = await Promise.all([arsip.muatDokumen(), arsip.muatKategori()]);
    setData(d.baris); setKategori(k.baris); setGalat(!d.ok ? d.error ?? null : !k.ok ? k.error ?? null : null); setMemuat(false);
  }, []);
  useEffect(() => { void muat(); }, [muat]);

  const hasil = useMemo(() => data.filter((d) => {
    if (fKat && d.kategori_id !== fKat) return false;
    if (dari && d.tanggal < dari) return false;
    if (sampai && d.tanggal > sampai) return false;
    if (qNo && !d.nomor.toLowerCase().includes(qNo.toLowerCase())) return false;
    if (qJudul) { const t = qJudul.toLowerCase(); if (!d.judul.toLowerCase().includes(t) && !d.nama_asli.toLowerCase().includes(t)) return false; }
    return true;
  }), [data, fKat, dari, sampai, qNo, qJudul]);
  const pg = usePaging(hasil);
  const semuaHalaman = pg.baris.length > 0 && pg.baris.every((b) => pilih.has(b.id));
  const alih = (id: string) => setPilih((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const alihHalaman = () => setPilih((p) => { const n = new Set(p); for (const b of pg.baris) { if (semuaHalaman) n.delete(b.id); else n.add(b.id); } return n; });
  const reset = () => { setFKat(''); setNoSurat(''); setJudulCari(''); setDari(''); setSampai(''); };
  const katDipilih = kategori.find((k) => k.id === fKat);

  const unduhSatu = async (d: DokumenArsip) => {
    const blob = await arsip.blobDokumen(d);
    if (!blob) { tampilkanGalat('Berkas tidak tersedia.'); return; }
    arsip.simpanBlob(arsip.namaBerkasDokumen(d), blob);
    void arsip.catatUnduh('DOK_PDF', `${d.kategori_kode} ${d.nomor}`, 1);
  };
  const unduhZip = async (daftar: DokumenArsip[], label: string) => {
    const r = await arsip.unduhZipDokumen(daftar, tahun, label);
    if (!r.ok) { tampilkanGalat(r.error ?? 'Gagal membuat ZIP.'); return; }
    tampilkanInfo(`ZIP berisi ${r.jumlah} berkas diunduh.`);
  };

  return (
    <Card>
      <div className="space-y-2 border-b border-ink-edge px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect label="Kategori" value={fKat} onChange={setFKat} options={[{ value: '', label: 'Semua Kategori' }, ...kategori.map((k) => ({ value: k.id, label: k.aktif ? k.nama : `${k.nama} (nonaktif)` }))]} />
          <SearchBox value={noSurat} onChange={setNoSurat} placeholder="Cari No. Surat / Dokumen..." />
          <SearchBox value={judulCari} onChange={setJudulCari} placeholder="Cari Judul / Uraian Berkas..." />
          <label className="flex items-center gap-1 text-2xs text-mist-dim">Dari <input type="date" value={dari} onChange={(e) => setDari(e.target.value)} className="rounded-md border border-ink-edge bg-ink px-2 py-1 text-2xs text-mist" /></label>
          <label className="flex items-center gap-1 text-2xs text-mist-dim">s.d. <input type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} className="rounded-md border border-ink-edge bg-ink px-2 py-1 text-2xs text-mist" /></label>
          <Button variant="ghost" onClick={reset}>Reset Filter</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {bendahara && <Button onClick={() => setUnggahModal(true)} disabled={kategori.filter((k) => k.aktif).length === 0}><Upload size={14} /> Unggah Dokumen</Button>}
          {bendahara && <Button variant="secondary" onClick={() => setKatModal(true)}><FolderCog size={14} /> Kelola Kategori</Button>}
          <div className="ml-auto flex flex-wrap gap-2">
            <Button variant="secondary" disabled={!katDipilih || hasil.length === 0} onClick={() => unduhZip(hasil, katDipilih?.nama ?? '')}><Download size={14} /> Unduh Kategori Ini (ZIP)</Button>
            <Button variant="secondary" disabled={pilih.size === 0} onClick={() => unduhZip(data.filter((d) => pilih.has(d.id)), 'DOKUMEN')}><Download size={14} /> Unduh Terpilih (ZIP){pilih.size ? ` (${pilih.size})` : ''}</Button>
          </div>
        </div>
      </div>
      <ErrorLine msg={galat} />
      <div className="px-4 py-1 text-2xs text-mist-dim">Menampilkan {hasil.length} dari {data.length} berkas</div>
      <div className="overflow-x-auto">
        {memuat ? <p className="px-4 py-8 text-center text-sm text-mist-dim">Memuat…</p> : hasil.length === 0 ? (
          <EmptyState icon={<Archive size={28} />} title="Belum ada dokumen"
            desc={kategori.length === 0 ? (bendahara ? 'Buat kategori terlebih dahulu lewat Kelola Kategori, lalu unggah dokumen.' : 'Bendahara belum membuat kategori dokumen.') : 'Tidak ada dokumen yang cocok dengan filter.'} />
        ) : (
          <table className="w-full text-2xs">
            <thead className="bg-ink text-mist-dim"><tr className="text-left">
              <th className="w-8 px-4 py-2"><input type="checkbox" checked={semuaHalaman} onChange={alihHalaman} aria-label="Pilih semua pada halaman ini" /></th>
              {['No', 'Kategori', 'No. Dokumen', 'Tanggal', 'Judul Dokumen', 'Diunggah Oleh', 'Aksi'].map((c) => <th key={c} className="px-4 py-2 font-medium whitespace-nowrap">{c}</th>)}
            </tr></thead>
            <tbody>{pg.baris.map((d, i) => (
              <tr key={d.id} className={i % 2 ? 'bg-ink-surface/40' : ''}>
                <td className="px-4 py-2"><input type="checkbox" checked={pilih.has(d.id)} onChange={() => alih(d.id)} aria-label={`Pilih ${d.nomor}`} /></td>
                <td className="px-4 py-2 text-mist-dim">{(pg.hal - 1) * pg.ukuran + i + 1}</td>
                <td className="px-4 py-2 text-mist">{d.kategori}</td>
                <td className="px-4 py-2 mono text-mist">{d.nomor}</td>
                <td className="px-4 py-2 mono whitespace-nowrap text-mist-dim">{formatTanggalPendek(d.tanggal)}</td>
                <td className="px-4 py-2 text-mist">{d.judul}<div className="text-mist-dim">{d.nama_asli} • {formatUkuran(d.ukuran)}</div></td>
                <td className="px-4 py-2 text-mist-dim">{d.pengunggah}</td>
                <td className="px-4 py-2"><div className="flex flex-wrap gap-1.5">
                  <Button variant="ghost" onClick={() => setLihat(d)}><Eye size={14} /> Pratinjau</Button>
                  <Button variant="secondary" onClick={() => unduhSatu(d)}><Download size={14} /> Unduh PDF</Button>
                  {bendahara && <Button variant="ghost" onClick={() => setKelola(d)}><Pencil size={14} /> Kelola</Button>}
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
      <Pager {...pg} />
      {unggahModal && <UnggahModal kategori={kategori.filter((k) => k.aktif)} onClose={() => setUnggahModal(false)} onSaved={() => { setUnggahModal(false); void muat(); }} />}
      {kelola && <KelolaModal dok={kelola} onClose={() => setKelola(null)} onSaved={() => { setKelola(null); void muat(); }} />}
      {katModal && <KategoriModal kategori={kategori} onClose={() => setKatModal(false)} onChanged={() => void muat()} />}
      {lihat && <PratinjauPdf judul={`${lihat.kategori} — ${lihat.nomor}`} ambil={async () => { const b = await arsip.blobDokumen(lihat); if (b) void arsip.catatUnduh('DOK_PDF', `${lihat.kategori_kode} ${lihat.nomor} (pratinjau)`, 1); return b; }} onClose={() => setLihat(null)} />}
    </Card>
  );
}

function UnggahModal({ kategori, onClose, onSaved }: { kategori: KategoriArsip[]; onClose: () => void; onSaved: () => void }) {
  const [kat, setKat] = useState(kategori[0]?.id ?? '');
  const [nomor, setNomor] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [judul, setJudul] = useState('');
  const [ket, setKet] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [kirim, setKirim] = useState(false);
  const simpan = async () => {
    setGalat(null);
    if (!kat || !nomor.trim() || !tanggal || !judul.trim()) return setGalat('Kategori, nomor, tanggal, dan judul dokumen wajib diisi.');
    if (!file) return setGalat('Pilih berkas PDF.');
    setKirim(true);
    const r = await arsip.unggahDokumen({ kategori_id: kat, nomor, tanggal, judul, keterangan: ket }, file);
    setKirim(false);
    if (!r.ok) return setGalat(r.error ?? 'Gagal mengunggah.');
    tampilkanInfo('Dokumen diunggah.'); onSaved();
  };
  return (
    <Modal open onClose={onClose} title="Unggah Dokumen Keuangan" footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Batal</Button><Button onClick={simpan} disabled={kirim}>{kirim ? 'Mengunggah…' : 'Simpan'}</Button></div>}>
      <div className="space-y-3">
        <Field label="Kategori Dokumen" required><Select value={kat} onChange={(e) => setKat(e.target.value)}>{kategori.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}</Select></Field>
        <Field label="Nomor Surat / Dokumen" required><Input value={nomor} onChange={(e) => setNomor(e.target.value)} placeholder="900/142/KEC-RP/V/2026" /></Field>
        <Field label="Tanggal Dokumen" required hint="Tidak boleh melebihi hari ini."><Input type="date" max={todayWita()} value={tanggal} onChange={(e) => setTanggal(e.target.value)} /></Field>
        <Field label="Judul / Uraian Dokumen" required><Input maxLength={255} value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="BA Rekon GU Bulan Mei 2026" /></Field>
        <Field label="Keterangan Tambahan"><Input value={ket} onChange={(e) => setKet(e.target.value)} /></Field>
        <Field label="Berkas PDF" required hint="PDF, maksimal 20 MB."><input type="file" accept="application/pdf,.pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block w-full text-2xs text-mist" /></Field>
        <ErrorLine msg={galat} />
      </div>
    </Modal>
  );
}

function KelolaModal({ dok, onClose, onSaved }: { dok: DokumenArsip; onClose: () => void; onSaved: () => void }) {
  const [nomor, setNomor] = useState(dok.nomor);
  const [tanggal, setTanggal] = useState(dok.tanggal.slice(0, 10));
  const [judul, setJudul] = useState(dok.judul);
  const [ket, setKet] = useState(dok.keterangan);
  const [galat, setGalat] = useState<string | null>(null);
  const [konfirmasi, setKonfirmasi] = useState(false);
  const simpan = async () => {
    const r = await arsip.ubahDokumen(dok.id, { nomor, tanggal, judul, keterangan: ket });
    if (!r.ok) return setGalat(r.error ?? 'Gagal menyimpan.');
    tampilkanInfo('Tersimpan.'); onSaved();
  };
  const hapus = async () => {
    const r = await arsip.hapusDokumen(dok.id);
    if (!r.ok) return setGalat(r.error ?? 'Gagal menghapus.');
    tampilkanInfo('Dokumen dihapus.'); onSaved();
  };
  return (
    <Modal open onClose={onClose} title={`Kelola Dokumen — ${dok.kategori}`}
      footer={<div className="flex items-center justify-between gap-2">
        {konfirmasi ? <div className="flex items-center gap-2 text-2xs text-crit">Hapus permanen? <Button variant="danger" onClick={hapus}>Ya, hapus</Button><Button variant="ghost" onClick={() => setKonfirmasi(false)}>Tidak</Button></div>
          : <Button variant="danger" onClick={() => setKonfirmasi(true)}><Trash2 size={14} /> Hapus</Button>}
        <div className="flex gap-2"><Button variant="ghost" onClick={onClose}>Batal</Button><Button onClick={simpan}>Simpan</Button></div>
      </div>}>
      <div className="space-y-3">
        <Field label="Nomor Surat / Dokumen" required><Input value={nomor} onChange={(e) => setNomor(e.target.value)} /></Field>
        <Field label="Tanggal Dokumen" required><Input type="date" max={todayWita()} value={tanggal} onChange={(e) => setTanggal(e.target.value)} /></Field>
        <Field label="Judul / Uraian Dokumen" required><Input maxLength={255} value={judul} onChange={(e) => setJudul(e.target.value)} /></Field>
        <Field label="Keterangan Tambahan"><Input value={ket} onChange={(e) => setKet(e.target.value)} /></Field>
        <p className="text-2xs text-mist-dim">Berkas PDF tidak dapat diganti. Untuk mengganti berkas, hapus dokumen lalu unggah ulang.</p>
        <ErrorLine msg={galat} />
      </div>
    </Modal>
  );
}

function KategoriModal({ kategori, onClose, onChanged }: { kategori: KategoriArsip[]; onClose: () => void; onChanged: () => void }) {
  const [edit, setEdit] = useState<KategoriArsip | 'baru' | null>(null);
  const [kode, setKode] = useState(''); const [nama, setNama] = useState(''); const [desk, setDesk] = useState('');
  const [galat, setGalat] = useState<string | null>(null);
  const buka = (k: KategoriArsip | 'baru') => { setEdit(k); setKode(k === 'baru' ? '' : k.kode); setNama(k === 'baru' ? '' : k.nama); setDesk(k === 'baru' ? '' : k.deskripsi); setGalat(null); };
  const hasil = async (r: { ok: boolean; error?: string }) => { if (!r.ok) { setGalat(r.error ?? 'Gagal.'); return; } setGalat(null); setEdit(null); onChanged(); };
  return (
    <Modal open onClose={onClose} title="Kelola Kategori Dokumen" wide footer={<div className="flex justify-end"><Button variant="ghost" onClick={onClose}>Tutup</Button></div>}>
      <div className="space-y-3">
        {kategori.length === 0 && <div className="rounded border border-ink-edge p-3 text-2xs text-mist-dim">Belum ada kategori untuk TA ini.
          <div className="mt-2"><Button variant="secondary" onClick={async () => hasil(await arsip.kategoriBawaan())}>Buat 6 kategori bawaan</Button></div></div>}
        {kategori.map((k) => (
          <div key={k.id} className="flex items-center gap-2 rounded border border-ink-edge px-3 py-2 text-2xs">
            <div className="min-w-0 flex-1"><div className="text-mist">{k.nama} <span className="mono text-mist-dim">({k.kode})</span>{!k.aktif && <span className="ml-2 text-warn">nonaktif</span>}</div>
              <div className="text-mist-dim">{k.jumlah} dokumen{k.deskripsi ? ` • ${k.deskripsi}` : ''}</div></div>
            <Button variant="ghost" onClick={() => buka(k)}><Pencil size={14} /></Button>
            <Button variant="ghost" onClick={async () => hasil(await arsip.simpanKategori({ id: k.id, kode: k.kode, nama: k.nama, deskripsi: k.deskripsi, aktif: !k.aktif }))}>{k.aktif ? 'Nonaktifkan' : 'Aktifkan'}</Button>
            {k.jumlah === 0 && <Button variant="ghost" onClick={async () => hasil(await arsip.hapusKategori(k.id))}><Trash2 size={14} /></Button>}
          </div>
        ))}
        {edit === null ? <Button variant="secondary" onClick={() => buka('baru')}><Plus size={14} /> Tambah Kategori</Button> : (
          <div className="space-y-2 rounded border border-amber/30 p-3">
            <Field label="Kode Kategori" required hint="Contoh: BA-REKON-GU"><Input maxLength={50} value={kode} onChange={(e) => setKode(e.target.value)} /></Field>
            <Field label="Nama Kategori" required><Input maxLength={150} value={nama} onChange={(e) => setNama(e.target.value)} /></Field>
            <Field label="Deskripsi"><Input value={desk} onChange={(e) => setDesk(e.target.value)} /></Field>
            <div className="flex gap-2">
              <Button onClick={async () => hasil(await arsip.simpanKategori({ id: edit === 'baru' ? undefined : edit.id, kode, nama, deskripsi: desk, aktif: edit === 'baru' ? true : edit.aktif }))}>Simpan</Button>
              <Button variant="ghost" onClick={() => setEdit(null)}>Batal</Button>
            </div>
          </div>
        )}
        <ErrorLine msg={galat} />
      </div>
    </Modal>
  );
}
