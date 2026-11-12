// PJK-01 — Panel pajak SPJ (langkah 3 pada pop-up SPJ): banyak entri, jenis dari Master aktif, nominal manual (D02 §5, D03 §4 poin 11).
// State baris dipegang induk (EditSPJModal); penyimpanan dilakukan induk saat berpindah langkah.
import type { Dispatch, SetStateAction } from 'react';
import { Button, Field, RupiahInput, Select } from '@/components/ui';
import { repo } from '@/data/repo';
import { formatRupiah } from '@/lib/format';
import type { SPJ } from '@/data/types';
import { Plus, Trash2 } from 'lucide-react';

export type BarisPajak = { key: number; jenis_pajak_id: string; nominal: number };

export function barisPajakDariSPJ(spj: SPJ): BarisPajak[] {
  return spj.entri_pajak.map((e, i) => ({ key: i, jenis_pajak_id: e.jenis_pajak_id, nominal: e.nominal }));
}

export function PajakSPJPanel({ spj, isDraft, baris, setBaris }: {
  spj: SPJ; isDraft: boolean; baris: BarisPajak[]; setBaris: Dispatch<SetStateAction<BarisPajak[]>>;
}) {
  const jenisAktif = repo.masterJenisPajak().filter((j) => j.status === 'Aktif');
  const bruto = repo.ringkasanPajakSPJ(spj.id)?.bruto ?? 0;
  const totalLive = baris.reduce((s, r) => s + r.nominal, 0);

  const tambahBaris = () => setBaris((b) => [...b, { key: b.reduce((m, x) => Math.max(m, x.key), -1) + 1, jenis_pajak_id: '', nominal: 0 }]);
  const ubahBaris = (key: number, patch: Partial<Pick<BarisPajak, 'jenis_pajak_id' | 'nominal'>>) =>
    setBaris((b) => b.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const hapusBaris = (key: number) => setBaris((b) => b.filter((r) => r.key !== key));

  return (
    <fieldset disabled={!isDraft} className="space-y-3">
      <div className="grid grid-cols-3 gap-2 rounded-md border border-ink-edge bg-ink p-3 text-2xs text-mist-dim">
        <div>Bruto<div className="mono tnum text-mist">{formatRupiah(bruto)}</div></div>
        <div>Total Pajak<div className="mono tnum text-mist">{formatRupiah(totalLive)}</div></div>
        <div>Jumlah dibayarkan<div className="mono tnum text-mist">{formatRupiah(bruto - totalLive)}</div></div>
      </div>
      {baris.length === 0 && <p className="text-2xs text-mist-dim">Belum ada entri pajak. SPJ tanpa pajak tetap dapat diterima.</p>}
      {jenisAktif.length === 0 && <p className="text-2xs text-warn">Master Jenis Pajak masih kosong. Hubungi Admin bila SPJ ini memerlukan pajak.</p>}
      {baris.map((r) => (
        <div key={r.key} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field label="Jenis Pajak" required>
            <Select value={r.jenis_pajak_id} onChange={(e) => ubahBaris(r.key, { jenis_pajak_id: e.target.value })}>
              <option value="">Pilih jenis pajak</option>
              {jenisAktif.map((j) => <option key={j.id} value={j.id}>{j.kode} — {j.nama_jenis_pajak}</option>)}
            </Select>
          </Field>
          <Field label="Nominal" required>
            <RupiahInput value={r.nominal} onChange={(v) => ubahBaris(r.key, { nominal: v })} />
          </Field>
          <button onClick={() => hapusBaris(r.key)} className="mb-1 rounded p-1 text-mist-dim hover:text-crit" title="Hapus entri" aria-label="Hapus entri">
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      {isDraft && <Button variant="secondary" onClick={tambahBaris}><Plus size={14} /> Tambah Entri Pajak</Button>}
    </fieldset>
  );
}
