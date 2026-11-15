// TPL-02 — Form Builder Form Dinamis (Admin). Satu form per jenis belanja; setiap simpan membentuk versi baru.
import { useState } from 'react';
import { Card, Button, Field, Input, Select, Modal, EmptyState, useToast } from '@/components/ui';
import { repo } from '@/data/repo';
import type { FieldFormDinamis, BlokBerulangFormDinamis } from '@/data/types';
import { TAG_SISTEM, TAG_SISTEM_LABEL, TAG_SISTEM_SINGKAT, TIPE_FIELD_LABEL, KELOMPOK_TIPE, TIPE_BERPILIHAN, TIPE_KISI, validasiFieldForm } from '@/lib/formDinamis';
import { FormPreviewTab } from '@/components/FormPreviewTab';
import { Plus, Trash2, ArrowUp, ArrowDown, Layers, FileText, Pencil, X } from 'lucide-react';

type Draft = { jenis: string; fields: FieldFormDinamis[]; blok: BlokBerulangFormDinamis | null };

const DRAFT_KOSONG: Draft = { jenis: '', fields: [], blok: null };

function draftDari(jenis: string): Draft {
  const f = repo.formTerbaru(jenis);
  if (!f) return { ...DRAFT_KOSONG, jenis };
  return { jenis, fields: f.fields.map((x) => ({ ...x })), blok: f.blok_berulang ? { ...f.blok_berulang, fields: f.blok_berulang.fields.map((x) => ({ ...x })) } : null };
}

export function FormBuilderPage() {
  const [, setTick] = useState(0);
  const [aktif, setAktif] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(DRAFT_KOSONG);
  const [jenisBaru, setJenisBaru] = useState('');
  const [err, setErr] = useState('');
  const [modal, setModal] = useState<'utama' | 'blok' | null>(null);
  const [ubah, setUbah] = useState<{ konteks: 'utama' | 'blok'; i: number } | null>(null);
  const [tab, setTab] = useState<'konfigurasi' | 'pratinjau'>('konfigurasi');
  const toast = useToast();

  const daftarJenis = Array.from(new Set(repo.formDinamisAll().map((f) => f.jenis_belanja)));
  const bukaJenis = (jenis: string) => { setAktif(jenis); setDraft(draftDari(jenis)); setErr(''); };
  const mulaiBaru = () => {
    const nama = jenisBaru.trim();
    if (!nama) return;
    setAktif(nama); setDraft({ ...DRAFT_KOSONG, jenis: nama }); setJenisBaru(''); setErr('');
  };

  const pindah = (i: number, arah: -1 | 1) => {
    const j = i + arah;
    if (j < 0 || j >= draft.fields.length) return;
    const f = [...draft.fields];
    [f[i], f[j]] = [f[j], f[i]];
    setDraft({ ...draft, fields: f });
  };

  const simpan = async () => {
    const isiErr = validasiFieldForm(draft.fields) ?? (draft.blok ? validasiFieldForm(draft.blok.fields) : null);
    if (isiErr) { setErr(isiErr); return; }
    const r = await repo.simpanVersiForm(draft.jenis, draft.fields.map((f, i) => ({ ...f, urutan: i + 1 })), draft.blok ? { ...draft.blok, fields: draft.blok.fields.map((f, i) => ({ ...f, urutan: i + 1 })) } : null);
    if (!r.ok) { setErr(r.error ?? 'Gagal menyimpan.'); return; }
    toast.notify('Tersimpan');
    setErr('');
    setAktif(draft.jenis);
    setDraft(draftDari(draft.jenis));
    setTick((t) => t + 1);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-mist">Jenis Belanja</h3>
        <div className="space-y-1">
          {daftarJenis.map((j) => (
            <button key={j} onClick={() => bukaJenis(j)} className={`w-full rounded-md px-3 py-2 text-left text-2xs ${aktif === j ? 'bg-ink-edge text-mist' : 'text-mist-dim hover:text-mist'}`}>
              {j} <span className="mono text-mist-dim">{repo.formTerbaru(j)?.versi}</span>
            </button>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <Input placeholder="Jenis belanja baru" value={jenisBaru} onChange={(e) => setJenisBaru(e.target.value)} />
          <Button variant="ghost" onClick={mulaiBaru}><Plus size={14} /></Button>
        </div>
      </Card>

      {!aktif ? (
        <EmptyState icon={<FileText size={20} />} title="Pilih jenis belanja" desc="Pilih jenis belanja untuk mengubah form, atau buat jenis baru." />
      ) : (
        <div className="space-y-4">
          <div className="flex w-fit gap-1 rounded-md bg-ink-raised p-1">
            {(['konfigurasi', 'pratinjau'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`rounded px-3 py-1.5 text-2xs transition-colors ${tab === t ? 'bg-ink-edge text-mist' : 'text-mist-dim hover:text-mist'}`}>
                {t === 'konfigurasi' ? 'Konfigurasi Editor' : 'Pratinjau Langsung'}
              </button>
            ))}
          </div>
          {tab === 'pratinjau' ? <FormPreviewTab fields={draft.fields} blok={draft.blok} /> : <>
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-mist">{draft.jenis} {repo.formTerbaru(draft.jenis) && <span className="mono text-2xs text-mist-dim">versi {repo.formTerbaru(draft.jenis)?.versi}</span>}</h3>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setModal('utama')}><Plus size={14} /> Field</Button>
                {!draft.blok && <Button variant="ghost" onClick={() => setDraft({ ...draft, blok: { id: `blk-${Date.now()}`, nama: 'Pelaku', fields: [] } })}><Layers size={14} /> Blok Berulang</Button>}
              </div>
            </div>
            <FieldTable fields={draft.fields} onUbah={(i) => setUbah({ konteks: 'utama', i })} onHapus={(i) => setDraft({ ...draft, fields: draft.fields.filter((_, x) => x !== i) })} onPindah={pindah} />
            {draft.fields.length === 0 && <p className="text-2xs text-mist-dim">Belum ada field.</p>}
          </Card>

          {draft.blok && (
            <Card className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <Field label="Nama blok"><Input value={draft.blok.nama} onChange={(e) => setDraft({ ...draft, blok: { ...draft.blok!, nama: e.target.value } })} /></Field>
                <Button variant="ghost" onClick={() => setDraft({ ...draft, blok: null })}><Trash2 size={14} /> Hapus blok</Button>
              </div>
              <FieldTable fields={draft.blok.fields} onUbah={(i) => setUbah({ konteks: 'blok', i })} onHapus={(i) => setDraft({ ...draft, blok: { ...draft.blok!, fields: draft.blok!.fields.filter((_, x) => x !== i) } })} onPindah={(i, arah) => {
                const j = i + arah; const f = [...draft.blok!.fields];
                if (j < 0 || j >= f.length) return;
                [f[i], f[j]] = [f[j], f[i]];
                setDraft({ ...draft, blok: { ...draft.blok!, fields: f } });
              }} />
              <Button variant="ghost" className="mt-3" onClick={() => setModal('blok')}><Plus size={14} /> Field dalam blok</Button>
            </Card>
          )}

          {err && <p className="text-2xs text-crit">{err}</p>}
          <div className="flex justify-end"><Button onClick={simpan}>Simpan Versi Baru</Button></div>
          </>}
        </div>
      )}

      {(modal || ubah) && (
        <FieldModal
          awal={ubah ? (ubah.konteks === 'utama' ? draft.fields[ubah.i] : draft.blok?.fields[ubah.i]) : undefined}
          onClose={() => { setModal(null); setUbah(null); }}
          onSimpan={(f) => {
            if (ubah) {
              if (ubah.konteks === 'utama') setDraft({ ...draft, fields: draft.fields.map((x, i) => (i === ubah.i ? f : x)) });
              else if (draft.blok) setDraft({ ...draft, blok: { ...draft.blok, fields: draft.blok.fields.map((x, i) => (i === ubah.i ? f : x)) } });
            } else if (modal === 'utama') setDraft({ ...draft, fields: [...draft.fields, f] });
            else if (draft.blok) setDraft({ ...draft, blok: { ...draft.blok, fields: [...draft.blok.fields, f] } });
            setModal(null); setUbah(null);
          }}
        />
      )}
    </div>
  );
}

function ringkas(f: FieldFormDinamis): string {
  if (f.opsi?.length) return ` (${f.opsi.length} pilihan)`;
  if (f.baris?.length) return ` (${f.baris.length}×${f.kolom?.length ?? 0})`;
  if (f.tipe === 'skala') return ` (${f.skala_min === 0 ? 0 : 1}–${f.skala_maks ?? 5})`;
  if (f.tipe === 'rating') return ` (${f.skala_maks ?? 5} bintang)`;
  return '';
}

function FieldTable({ fields, onHapus, onPindah, onUbah }: {
  fields: FieldFormDinamis[];
  onUbah: (i: number) => void;
  onHapus: (i: number) => void;
  onPindah: (i: number, arah: -1 | 1) => void;
}) {
  if (fields.length === 0) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-2xs">
        <tbody>
          {fields.map((f, i) => (
            <tr key={f.id} className="border-t border-ink-edge">
              <td className="px-2 py-2 text-mist">{f.label}</td>
              <td className="px-2 py-2 text-mist-dim">{TIPE_FIELD_LABEL[f.tipe]}{ringkas(f)}</td>
              <td className="px-2 py-2 text-mist-dim">{f.wajib ? 'Wajib' : 'Opsional'}</td>
              <td className="px-2 py-2 text-mist-dim">{f.system_tag ? TAG_SISTEM_SINGKAT[f.system_tag] : ''}</td>
              <td className="px-2 py-2">
                <div className="flex gap-1">
                  <button onClick={() => onPindah(i, -1)} className="rounded p-1 text-mist-dim hover:text-mist" aria-label="Naik"><ArrowUp size={14} /></button>
                  <button onClick={() => onPindah(i, 1)} className="rounded p-1 text-mist-dim hover:text-mist" aria-label="Turun"><ArrowDown size={14} /></button>
                  <button onClick={() => onUbah(i)} className="rounded p-1 text-mist-dim hover:text-mist" aria-label="Ubah"><Pencil size={14} /></button>
                  <button onClick={() => onHapus(i)} className="rounded p-1 text-mist-dim hover:text-crit" aria-label="Hapus"><Trash2 size={14} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DaftarEditor({ judul, nilai, onChange, tambah }: { judul: string; nilai: string[]; onChange: (v: string[]) => void; tambah: string }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-mist">{judul}</p>
      <div className="space-y-2">
        {nilai.map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-5 text-2xs text-mist-dim">{i + 1}.</span>
            <Input value={v} aria-label={`${judul} ${i + 1}`} onChange={(e) => onChange(nilai.map((x, j) => (j === i ? e.target.value : x)))} />
            <button type="button" className="rounded p-1 text-mist-dim hover:text-crit" aria-label="Hapus" onClick={() => onChange(nilai.filter((_, j) => j !== i))}><X size={14} /></button>
          </div>
        ))}
        <Button variant="ghost" onClick={() => onChange([...nilai, ''])}><Plus size={14} /> {tambah}</Button>
      </div>
    </div>
  );
}

function FieldModal({ awal, onClose, onSimpan }: { awal?: FieldFormDinamis; onClose: () => void; onSimpan: (f: FieldFormDinamis) => void }) {
  const [label, setLabel] = useState(awal?.label ?? '');
  const [tipe, setTipe] = useState<FieldFormDinamis['tipe']>(awal?.tipe ?? 'teks');
  const [wajib, setWajib] = useState(awal?.wajib ?? false);
  const [tag, setTag] = useState<string>(awal?.system_tag ?? '');
  const [bantuan, setBantuan] = useState(awal?.bantuan ?? '');
  const [opsi, setOpsi] = useState<string[]>(awal?.opsi ?? ['Opsi 1']);
  const [baris, setBaris] = useState<string[]>(awal?.baris ?? ['Baris 1']);
  const [kolom, setKolom] = useState<string[]>(awal?.kolom ?? ['Kolom 1', 'Kolom 2']);
  const [sMin, setSMin] = useState<number>(awal?.skala_min === 0 ? 0 : 1);
  const [sMaks, setSMaks] = useState<number>(awal?.skala_maks ?? 5);
  const [lMin, setLMin] = useState(awal?.label_min ?? '');
  const [lMaks, setLMaks] = useState(awal?.label_maks ?? '');
  const [err, setErr] = useState('');

  const berpilihan = TIPE_BERPILIHAN.includes(tipe);
  const kisi = TIPE_KISI.includes(tipe);
  // Tag sistem hanya masuk akal untuk jawaban teks, angka, atau tanggal.
  const bolehTag = tipe === 'teks' || tipe === 'angka' || tipe === 'tanggal';

  const simpan = () => {
    if (!label.trim()) return setErr('Label field wajib diisi.');
    const f: FieldFormDinamis = {
      id: awal?.id ?? `f-${Date.now()}`, label: label.trim(), tipe, urutan: awal?.urutan ?? 0, wajib,
      system_tag: (bolehTag && tag ? tag : null) as FieldFormDinamis['system_tag'],
    };
    if (bantuan.trim()) f.bantuan = bantuan.trim();
    if (berpilihan) f.opsi = opsi.map((x) => x.trim());
    if (kisi) { f.baris = baris.map((x) => x.trim()); f.kolom = kolom.map((x) => x.trim()); }
    if (tipe === 'skala') {
      f.skala_min = sMin; f.skala_maks = sMaks;
      if (lMin.trim()) f.label_min = lMin.trim();
      if (lMaks.trim()) f.label_maks = lMaks.trim();
    }
    if (tipe === 'rating') f.skala_maks = sMaks;
    const e = validasiFieldForm([f]);
    if (e) return setErr(e.replace(/^Field "[^"]*": /, ''));
    onSimpan(f);
  };

  return (
    <Modal open onClose={onClose} title={awal ? 'Ubah Field' : 'Tambah Field'} footer={<div className="flex justify-end gap-2">{err && <span className="mr-auto text-2xs text-crit">{err}</span>}<Button variant="ghost" onClick={onClose}>Batal</Button><Button onClick={simpan}>{awal ? 'Simpan' : 'Tambah'}</Button></div>}>
      <div className="space-y-4">
        <Field label="Pertanyaan / label" required><Input value={label} onChange={(e) => setLabel(e.target.value)} /></Field>
        <Field label="Jenis isian">
          <Select value={tipe} onChange={(e) => setTipe(e.target.value as FieldFormDinamis['tipe'])}>
            {KELOMPOK_TIPE.map((k, i) => (
              <optgroup key={i} label={['Teks', 'Pilihan', 'Penilaian', 'Kisi', 'Waktu'][i]}>
                {k.tipe.map((t) => <option key={t} value={t}>{TIPE_FIELD_LABEL[t]}</option>)}
              </optgroup>
            ))}
            {tipe === 'file' && <option value="file">{TIPE_FIELD_LABEL.file}</option>}
          </Select>
        </Field>
        <Field label="Teks bantuan (opsional)"><Input value={bantuan} onChange={(e) => setBantuan(e.target.value)} /></Field>

        {berpilihan && <DaftarEditor judul="Pilihan" nilai={opsi} onChange={setOpsi} tambah="Tambah pilihan" />}
        {kisi && (
          <div className="grid gap-4 sm:grid-cols-2">
            <DaftarEditor judul="Baris" nilai={baris} onChange={setBaris} tambah="Tambah baris" />
            <DaftarEditor judul="Kolom" nilai={kolom} onChange={setKolom} tambah="Tambah kolom" />
          </div>
        )}
        {tipe === 'skala' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-2xs text-mist">
              <Select aria-label="Awal skala" className="w-20" value={sMin} onChange={(e) => setSMin(Number(e.target.value))}><option value={0}>0</option><option value={1}>1</option></Select>
              sampai
              <Select aria-label="Akhir skala" className="w-20" value={sMaks} onChange={(e) => setSMaks(Number(e.target.value))}>
                {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => <option key={n} value={n}>{n}</option>)}
              </Select>
            </div>
            <Field label="Label ujung awal (opsional)"><Input value={lMin} onChange={(e) => setLMin(e.target.value)} /></Field>
            <Field label="Label ujung akhir (opsional)"><Input value={lMaks} onChange={(e) => setLMaks(e.target.value)} /></Field>
          </div>
        )}
        {tipe === 'rating' && (
          <Field label="Jumlah bintang"><Select value={sMaks} onChange={(e) => setSMaks(Number(e.target.value))}>
            {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => <option key={n} value={n}>{n}</option>)}
          </Select></Field>
        )}
        {(berpilihan || kisi) && <p className="text-2xs text-mist-dim">Teks pilihan, baris, dan kolom tidak boleh memuat tanda {'; : |'} dan tidak boleh sama.</p>}

        <label className="flex items-center gap-2 text-2xs text-mist"><input type="checkbox" checked={wajib} onChange={(e) => setWajib(e.target.checked)} /> Wajib diisi</label>
        {bolehTag && (
          <>
            <Field label="Tag sistem (opsional)"><Select value={tag} onChange={(e) => setTag(e.target.value)}>
              <option value="">Tidak ada</option>
              {TAG_SISTEM.map((t) => t && <option key={t} value={t}>{TAG_SISTEM_LABEL[t]}</option>)}
            </Select></Field>
            <p className="text-2xs text-mist-dim">NIP/NIK dan Nama harus dipasang berpasangan. Saat PPTK mengisi NIP/NIK yang sudah pernah tercatat, nama terisi otomatis; bila belum pernah tercatat, nama diisi manual dan tersimpan untuk berikutnya.</p>
          </>
        )}
      </div>
    </Modal>
  );
}
